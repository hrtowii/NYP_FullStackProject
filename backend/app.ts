// the backend will be here. Models and data will be placed in backend/models/etcetc.js
import express from "express"
import jwt, { Secret } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import cors from "cors"
import * as crypto from 'crypto';
// used for email verification
import { Resend } from "resend"
// Redis is used for storing OTP tokens temporarily
import { createClient } from 'redis';
import { Dayjs } from "dayjs";
import { configDotenv } from 'dotenv';
import { FontDownload, TurnedIn } from "@mui/icons-material"
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic();
configDotenv()
const redisClient = createClient({
    // legacyMode: true,
    // socket: {
    //     port: 6379,
    //     host: "redis"
    // }
});
(async () => {
    await redisClient.connect();
})();

redisClient.on('connect', () => console.log('::> Redis Client Connected'));
redisClient.on('error', (err) => console.log('<:: Redis Client Error', err));
const resend = new Resend(process.env.RESEND_SECRET)
const prisma = new PrismaClient() // -> database

const app = express();
app.use(express.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(cors({
    origin: 'http://localhost:8000', // Replace with your frontend URL
    credentials: true
}));


// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public'); // Make sure this directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Use this function when saving the path to the database
const formatImagePath = (filename) => {
    return '/public/' + filename.replace(/\\/g, '/');
};

export { upload, formatImagePath };

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "../public" directory
const publicPath = path.join(__dirname, '../public');
console.log('Serving static files from:', publicPath);
app.use('/public', express.static(publicPath));
app.get('/', (req, res) => {
    res.send('this is homepage')
})
// MARK: Auth

// what the user object should look like:
interface User {
    name: string,
    email: string,
    password: string,
    role: "user" | "donator" | "admin",
}

app.post('/signup', async (req, res) => {
    const user: User = req.body
    try {
        // add verifying to the sign up route instead of making a separate route because you can just post that way kekw
        const verification = req.body.otp;
        const actualOtp = await redisClient.get(user.email);

        if (actualOtp == verification) {
            await prisma.person.create({
                data: {
                    name: user.name,
                    hashedPassword: await bcrypt.hash(user.password, 12),
                    email: user.email,
                    [user.role]: {
                        create: {}
                    }
                },
                include: {
                    user: true,
                    donator: true,
                    admin: true
                }
            })
            return res.status(200).json({ success: true });
        } else {
            return res.status(403).json({ error: "Invalid OTP code" });
        }
    } catch (e) {
        console.log(e)
        return res.sendStatus(500)
    }
})

interface LoginRequest {
    email: string,
    password: string
}
app.post('/login', async (req, res) => {
    const request: LoginRequest = req.body
    const person = await prisma.person.findUnique({
        where: {
            email: request.email,
        },
        include: {
            user: true,
            donator: true,
            admin: true
        }
    })
    if (!person) {
        const responseObj = {
            success: false,
            message: "The email provided is not registered. Please sign up for a new account."
        };
        return res.status(404)
            .set('Content-Type', 'application/json')
            .json(responseObj);
    }
    const compare = await bcrypt.compare(
        request.password,
        person.hashedPassword
    )
    if (!compare) {
        const responseObj = {
            success: false,
            message: "Incorrect email/password"
        };
        return res.status(401)
            .set('Content-Type', 'application/json')
            .json(responseObj);
    }
    const ourRole = person.user ? 'user' : person.donator ? 'donator' : person.admin ? "admin" : null;
    const token = jwt.sign(
        { id: person.id, role: ourRole, name: person.name },
        process.env.JWT_SECRET as Secret,
        {
            algorithm: 'HS256',
            allowInsecureKeySizes: true,
            expiresIn: 86400,
        }
    );
    res.status(200)
        .set('Content-Type', 'application/json')
        .cookie('token', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: true
        })
        .json({ success: true, token: token });
})

interface emailDetails {
    email: string,
}

app.post('/sendEmail', async (req, res) => {
    const emailDetails: emailDetails = req.body;
    const exists = await prisma.person.findUnique({
        where: {
            email: emailDetails.email
        }
    })
    if (exists) {
        return res.status(409).json({ error: "User already exists" })
    }
    const ourOtp: number = crypto.randomInt(100000, 999999);
    // redis set otp code
    await redisClient.set(emailDetails.email, ourOtp);
    const { data, error } = await resend.emails.send({
        from: "ecosanct@hrtowii.dev",
        to: [emailDetails.email],
        subject: "Your CommuniFridge Verification Code",
        html: `Email verification code: ${ourOtp}`,
    });
    if (error) {
        console.log(error)
        return res.status(400).json({ error });
    }
    return res.status(200).json({ data });
})

app.post('/logout', async (req, res) => {
    res.status(200)
        .clearCookie('token', {
            path: '/',
            httpOnly: true,
            secure: true
        })
        .json({ success: true });
});

app.post('/reset-password-send-token', async (req, res) => {
    const { email }: { email: string } = req.body;

    try {
        const user = await prisma.person.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = uuidv4();
        const hash = crypto.createHash('sha3-256').update(token).digest('hex');

        // Store the hash in Redis with the email as the value (1 hour expiry)
        await redisClient.set(`pwd_reset:${hash}`, email, 'EX', 3600);

        // Send email with reset link
        const resetLink = `http://localhost:8000/reset/${token}`;
        await resend.emails.send({
            from: "ecosanct@hrtowii.dev",
            to: [email],
            subject: "Reset Your CommuniFridge Password",
            html: `Click this link to reset your password: <a href="${resetLink}">${resetLink}</a>`,
        });

        res.json({ message: "Password reset link sent to your email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred" });
    }
});

app.post('/validate-reset', async (req, res) => {
    const { token }: { token: string } = req.body;
    const hash = crypto.createHash('sha3-256').update(token).digest('hex');

    try {
        const email = await redisClient.get(`pwd_reset:${hash}`);
        if (email) {
            res.json({ isValid: true });
        } else {
            res.json({ isValid: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred" });
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, password }: { token: string, password: string } = req.body;
    const hash = crypto.createHash('sha3-256').update(token).digest('hex');

    try {
        const email = await redisClient.get(`pwd_reset:${hash}`);
        if (!email) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.person.update({
            where: { email },
            data: { hashedPassword }
        });

        // Delete the used token
        await redisClient.del(`pwd_reset:${hash}`);

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred" });
    }
});

const faqData = [
    {
        question: "What is CommuniFridge?",
        answer: ""
    },
    {
        question: "How can I donate food?",
        answer: "To donate food, you need to create a donator account. Once logged in, you can list the food items you wish to donate, including details such as quantity, expiration date, and pickup location."
    },
    {
        question: "Is my personal information safe?",
        answer: "Yes, we take data privacy seriously. We use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your explicit consent."
    },
    {
        question: "How can I request food?",
        answer: "To request food, create a user account and browse available donations in your area. You can then reserve the items you need and arrange for pickup with the donor."
    },
    {
        question: "What if I have dietary restrictions?",
        answer: "When browsing donations, you can filter items based on dietary restrictions. We encourage donors to provide accurate information about allergens and ingredients in their food donations."
    }
];

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        const faqContext = faqData.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');

        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 600,
            system: `You are a helpful chatbot for CommuniFridge, a project dedicated to organizing food donations for community fridges to improve the community in Singapore. Your primary goal is to assist users with questions about food donations and the CommuniFridge project. 
    
    Here's some key information about CommuniFridge:
    1. It's a local project specific to Singapore.
    2. It connects food donors with individuals in need.
    3. It aims to reduce food waste and address food insecurity.
    
    Below is a list of frequently asked questions. Use this information as a primary reference, but feel free to expand on these answers if necessary:
    
    ${faqContext}
    
    When responding to users:
    1. Prioritize information from the FAQ if it's relevant to the question.
    2. If the FAQ doesn't cover the topic, provide a helpful response based on the general context of CommuniFridge and its goals.
    3. Keep your answers focused on food donations, community fridges, and the local context of Singapore.
    4. Be friendly, empathetic, and encouraging to both potential donors and those seeking food assistance.
    5. If you're unsure about specific details, it's okay to say so and provide general information about how community fridge projects typically work.
    6. Encourage users to check the CommuniFridge website or contact the project directly for the most up-to-date and accurate information.`,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: message,
                        },
                    ],
                },
            ],
        });
        console.log(response)
        res.json({ response: response.content[0].text });
    } catch (error) {
        console.error('Error calling Anthropic API:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

//MARK: Admin functions

// Create test accounts, including admin. NEVER ADD THIS IN REAL LIFE
app.post('/createAccounts', async (req, res) => {
    // const user: User = {
    //     name: "Admin",
    //     email: "admin@gmail.com",
    //     password: "123",
    //     role: "admin"
    // }
    // await prisma.person.create({
    //     data: {
    //         name: user.name,
    //         hashedPassword: await bcrypt.hash(user.password, 12),
    //         email: user.email,
    //         [user.role]: {
    //             create: {}
    //         },
    //     },
    //     include: {
    //         user: true,
    //         donator: true,
    //         admin: true
    //     }
    // })
    // await prisma.person.create({
    //     data: {
    //         name: "DonatorA",
    //         hashedPassword: await bcrypt.hash("123", 12),
    //         email: "DonatorA@gmail.com",
    //         ["donator"]: {
    //             create: {}
    //         }
    //     }
    // })
    // await prisma.person.create({
    //     data: {
    //         name: "UserA",
    //         hashedPassword: await bcrypt.hash("123", 12),
    //         email: "UserA@gmail.com",
    //         ["user"]: {
    //             create: {}
    //         }
    //     }
    // })
    // await prisma.person.create({
    //     data: {
    //         name: "DonatorB",
    //         hashedPassword: await bcrypt.hash("123", 12),
    //         email: "DonatorB@gmail.com",
    //         ["donator"]: {
    //             create: {}
    //         }
    //     }
    // })
    // await prisma.person.create({
    //     data: {
    //         name: "UserB",
    //         hashedPassword: await bcrypt.hash("123", 12),
    //         email: "UserB@gmail.com",
    //         ["user"]: {
    //             create: {}
    //         }
    //     }
    // })
    await prisma.person.create({
        data: {
            name: "iruss",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "230446k@gmail.com",
            ["donator"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "ron",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "lucasleong1000@gmail.com",
            ["user"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "emma",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "emma@example.com",
            ["user"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "olivia",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "olivia@example.com",
            ["donator"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "noah",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "noah@example.com",
            ["user"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "liam",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "liam@example.com",
            ["donator"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "ava",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "ava@example.com",
            ["user"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "sophia",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "sophia@example.com",
            ["donator"]: {
                create: {}
            }
        }
    })
    return res.status(200).json({ success: true });
})

// View all users
app.post('/users', isAdmin, async (req, res) => {
    try {
        const users = await prisma.person.findMany({
            include: {
                user: true,
                donator: true,
                admin: true,
            },
        });
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});
// View all donators
app.post('/donators', async (req, res) => {
    try {
        const donators = await prisma.person.findMany({
            where: {
                donator: {
                    isNot: null
                }
            },
            include: {
                donator: true
            },
        });
        res.status(200).json(donators)
    } catch (error) {
        res.status(500).json({ error: 'Error fetching donators' });
    }
});

// Delete a user
app.delete('/users/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.person.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error deleting user' });
    }
});
// Update user details
interface editUserDetails {
    name: string,
    email: string,
    role: "user" | "donator" | "admin",
}

// remember that user roles are subclass models and not a simple attribute. 
// this complicates updating a role for us because we have to delete the existing role first
// so 1: find a user and check what roles it possesses
// 2. update the user to remove the roles it has. 
//    we cannot just remove every role because prisma errors if you try to remove a role that does not exist
app.put('/users/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email }: editUserDetails = req.body;
    try {
        const updatedUser = await prisma.person.update({
            where: { id: parseInt(id) },
            data: {
                email,
                name,
            },
        });
        res.status(200).json({ updatedUser })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error updating user' });
    }
});

app.post('/reset-password/:id', isAdmin, async (req, res) => {
    const { id } = req.param;
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.person.update({
            where: { id: parseInt(id) },
            data: { hashedPassword },
        });
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error resetting password' });
    }
});

// MARK: Donation CRUD - Andric
interface donationInterface {
    foodName: string;
    quantity: string;
    expiryDate: string;
    deliveryDate: string;  // Add this field
    type: string;
    category: string;
    location: string;
    remarks: string;
    image: Express.Multer.File;  // Change this to match the file object
}

app.post('/donation/:id', upload.single('image'), async (req: Request, res: Response) => {
    const id: number = parseInt(req.params.id);
    let formData: donationInterface = req.body;

    // The uploaded file is available as req.file
    const imagePath = req.file ? `/public/${req.file.filename}` : null;

    try {
        const result = await prisma.donation.create({
            data: {
                donator: {
                    connect: {
                        id: id,
                    },
                },
                category: formData.category,
                deliveryDate: new Date(formData.deliveryDate),
                location: formData.location,
                remarks: formData.remarks,
                image: imagePath, // Save the path to the image
                foods: {
                    create: {
                        name: formData.foodName,
                        quantity: parseInt(formData.quantity, 10),
                        type: formData.type,
                        expiryDate: new Date(formData.expiryDate),
                    },
                },
            },
            include: {
                foods: true,
            },
        });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({ error: 'Failed to create donation' });
    }
});

app.patch('/donators/:donatorId/goal', async (req, res) => {
    const donatorId = parseInt(req.params.donatorId, 10);
    const { donationGoal } = req.body;

    console.log(`Received request to update goal for donator ${donatorId} to ${donationGoal}`);

    try {
        if (isNaN(donatorId) || donationGoal < 0) {
            console.log('Invalid data received');
            return res.status(400).json({ error: 'Invalid data' });
        }

        const donator = await prisma.donator.update({
            where: { id: donatorId },
            data: { donationGoal },
        });

        console.log('Updated donator:', donator);
        res.json(donator);
    } catch (error) {
        console.error('Error updating donation goal:', error);
        res.status(500).json({ error: 'Failed to update donation goal' });
    }
});

app.get('/donators/:id/goal', async (req, res) => {
    const { id } = req.params;

    try {
        const donator = await prisma.donator.findUnique({
            where: { id: parseInt(id) },
            select: { donationGoal: true }
        });

        if (!donator) {
            return res.status(404).json({ error: 'Donator not found' });
        }

        res.json({ donationGoal: donator.donationGoal });
    } catch (error) {
        console.error('Error fetching donation goal:', error);
        res.status(500).json({ error: 'Failed to fetch donation goal' });
    }
});

app.patch('/donators/:id/achievement', async (req, res) => {
    const donatorId = parseInt(req.params.id, 10);
    const { achievement } = req.body;  // Get the achievement from the request body

    // Ensure the achievement is valid
    const validAchievements = ['Silver', 'Gold', 'Diamond', 'Supreme'];
    if (!validAchievements.includes(achievement)) {
        return res.status(400).json({ error: 'Invalid achievement value' });
    }

    try {
        // Update the achievement in the database
        const donator = await prisma.donator.update({
            where: { id: donatorId },
            data: { achievement }
        });

        res.json(donator);
    } catch (error) {
        console.error('Error updating achievement:', error);
        res.status(500).json({ error: 'Failed to update achievement' });
    }
});



// View donations with pagination and sorting
app.get('/donations/:id', async (req, res) => {
    const donorId: number = parseInt(req.params.id);
    const { page = '1', limit = '10' } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    try {
        const [donations, totalCount] = await prisma.$transaction([
            prisma.donation.findMany({
                where: { donatorId: donorId },
                include: {
                    foods: true,
                    donator: true,
                    reservations: true,
                },
                skip,
                take: limitNumber,
            }),
            prisma.donation.count({
                where: { donatorId: donorId }
            }),
        ]);
        res.status(200).json({
            donations,
            totalPages: Math.ceil(totalCount / limitNumber),
            currentPage: pageNumber,
        });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ error: 'Error getting donations', details: error.message });
    }
});

// Get ALL DONATIONS - iruss fridge 
app.get('/donations', async (req, res) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    try {
        const [donations, totalCount] = await prisma.$transaction([
            prisma.donation.findMany({
                where: {
                    availability: "Available"
                },
                include: {
                    foods: true,
                    donator: {
                        include: {
                            person: true
                        }
                    },
                    reservations: {
                        where: {
                            collectionStatus: {
                                not: "Cancelled"
                            }
                        },
                        select: {
                            id: true,
                            collectionStatus: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limitNumber,
            }),
            prisma.donation.count({
                where: {
                    availability: "Available"
                }
            }),
        ]);

        res.status(200).json({
            donations,
            totalPages: Math.ceil(totalCount / limitNumber),
            currentPage: pageNumber,
        });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ error: 'Error getting donations', details: error.message });
    }
})

app.get('/api/donators/leaderboard', async (req, res) => {
    try {
        const donators = await prisma.donator.findMany({
            include: {
                donations: {
                    include: {
                        foods: true,
                    },
                },
            },
        });

        const leaderboard = donators.map(donator => {
            const totalDonations = donator.donations.reduce((total, donation) => {
                return total + donation.foods.reduce((foodTotal, food) => foodTotal + food.quantity, 0);
            }, 0);

            return {
                donatorId: donator.id,
                name: donator.person.name, // Assuming there's a `name` field in the Person model
                totalDonations,
            };
        }).sort((a, b) => b.totalDonations - a.totalDonations);

        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Endpoint to get total donations for a specific donator
app.get('/api/donations/:donatorId/total', async (req, res) => {
    const { donatorId } = req.params;

    try {
        const totalDonations = await prisma.food.aggregate({
            _sum: {
                quantity: true,
            },
            where: {
                donation: {
                    donatorId: parseInt(donatorId, 10),
                },
            },
        });

        res.json({ totalQuantity: totalDonations._sum.quantity || 0 });
    } catch (error) {
        console.error('Error fetching total donations:', error);
        res.status(500).json({ error: 'Failed to fetch total donations' });
    }
});


app.patch('/donations/:id/availability', async (req, res) => {  // Patch req -> modifies item, instead of updating all
    const { id } = req.params;
    const { availability } = req.body;

    try {
        const updatedDonation = await prisma.donation.update({
            where: { id: parseInt(id) },
            data: { availability },
        });
        res.json(updatedDonation);
    } catch (error) {
        console.error('Error updating donation availability', error);
        res.status(500).json({ error: 'Unable to update donation availability' })
    }
});

// Delete donations
app.delete('/donations/:id', async (req, res) => {
    const donationId = parseInt(req.params.id, 10);
    console.log(`Received delete request for donation ID: ${donationId}`);

    try {
        const result = await prisma.$transaction(async (prisma) => {
            // Find all reservations associated with this donation
            const reservations = await prisma.reservation.findMany({
                where: { donationId: donationId },
                include: { reservationItems: true }
            });

            // Delete all reservation items for each reservation
            for (const reservation of reservations) {
                await prisma.reservationItem.deleteMany({
                    where: { reservationId: reservation.id }
                });
            }

            // Delete all reservations associated with this donation
            await prisma.reservation.deleteMany({
                where: { donationId: donationId }
            });

            // Delete all foods associated with this donation
            await prisma.food.deleteMany({
                where: { donationId: donationId }
            });

            // Finally, delete the donation
            const deletedDonation = await prisma.donation.delete({
                where: { id: donationId }
            });

            return deletedDonation;
        });

        console.log(`Donation deleted successfully:`, result);
        res.status(200).json({ message: 'Donation deleted successfully', deletedDonation: result });
    } catch (error) {
        console.error(`Error deleting donation:`, error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Donation not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete donation', details: error.message });
        }
    }
});

// Update donations
app.put('/donations/:id', async (req, res) => {
    const { id } = req.params;
    const { foods, category, remarks, image, location } = req.body;
    try {
        const updatedDonation = await prisma.donation.update({
            where: { id: parseInt(id) },
            data: {
                category,
                remarks,
                image,
                location,
                foods: {
                    updateMany: foods.map((food) => ({
                        where: { id: food.id },
                        data: {
                            name: food.name,
                            quantity: food.quantity,
                            expiryDate: new Date(food.expiryDate)
                        }
                    }))
                }
            },
            include: {
                foods: true,
            },
        });
        res.json(updatedDonation);
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).json({ error: 'Error updating donation', details: error.message });
    }
});

app.get('/reservations', async (req, res) => {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                reservationItems: {
                    include: {
                        food: {
                            include: {
                                donation: {
                                    include: {
                                        donator: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching reservations' });
    }
});
app.get('/reservation/:donerId', async (req, res) => {
    const donerId = parseInt(req.params.donerId);
    console.log('Received userId:', donerId);
    if (isNaN(donerId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const currentReservations = await prisma.reservation.findMany({
            where: {
                // donatorId: donerId,
                collectionStatus: 'Uncollected',
            },
            include: {
                reservationItems: {
                    include: {
                        food: {
                            include: {
                                donation: {
                                    include: {
                                        donator: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        console.log('Current reservations:', currentReservations);
        res.json(currentReservations);
    } catch (error) {
        console.error('Error fetching current reservations:', error);
        res.status(500).json({ error: 'Unable to fetch current reservations', details: error.message });
    }
});


//MARK: Reservation CRUD

// Create New Reservation

interface ReservationInterface {
    userId: number;
    collectionDate: string; // Will be converted to Date in backend
    collectionTimeStart: string;
    collectionTimeEnd: string;
    remarks?: string;
    cartItems: Array<{
        id: number;
        foods: Array<{
            id: number;
            quantity: number;
        }>;
    }>;
}

app.post('/reservation/:id', async (req, res) => {
    console.log('Received reservation request for user:', req.params.id);
    console.log('Request body:', req.body);


    const userId: number = parseInt(req.params.id)
    const formData: ReservationInterface = req.body;
    console.log('Received reservation data:', req.body);
    try {

        if (!userId || !formData.collectionDate || !formData.collectionTimeStart || !formData.collectionTimeEnd || !formData.cartItems) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if User exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(400).json({ error: `User with id ${userId} not found` });
        }

        // Check no. current reservations

        const result = await prisma.$transaction(async (prisma) => {
            const newReservations = await Promise.all(formData.cartItems.map(async (item) => {
                const donationId = parseInt(item.id.toString(), 10);

                // Create reservation
                const reservation = await prisma.reservation.create({
                    data: {
                        userId: userId,
                        donationId: donationId,
                        collectionDate: new Date(formData.collectionDate),
                        collectionTimeStart: formData.collectionTimeStart,
                        collectionTimeEnd: formData.collectionTimeEnd,
                        collectionStatus: 'Uncollected',
                        remarks: formData.remarks,
                        reservationItems: {
                            create: item.foods.map(food => ({
                                foodId: food.id,
                                quantity: food.quantity
                            }))
                        }
                    },
                    include: {
                        reservationItems: {
                            include: {
                                food: true
                            }
                        },
                        user: true
                    },
                });

                // Update donation availability
                await prisma.donation.update({
                    where: { id: donationId },
                    data: { availability: 'Reserved' }
                });

                return reservation;
            }));

            return newReservations;
        });

        console.log('Created reservations:', result);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating reservaton:', error);
        res.status(500).json({ error: 'Failed to create reservation', details: error.message });
    }
});


// Get Current Reservation
app.get('/reservation/current/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    console.log('Received userId:', userId);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const currentReservations = await prisma.reservation.findMany({
            where: {
                userId: userId,
                collectionStatus: 'Uncollected',
            },
            include: {
                reservationItems: {
                    include: {
                        food: {
                            include: {
                                donation: {
                                    include: {
                                        donator: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        console.log('Current reservations:', currentReservations);
        res.json(currentReservations);
    } catch (error) {
        console.error('Error fetching current reservations:', error);
        res.status(500).json({ error: 'Unable to fetch current reservations', details: error.message });
    }
});
// Get Past Reservations
app.get('/reservation/past/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    console.log('Fetching past reservations for user:', userId);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const pastReservations = await prisma.reservation.findMany({
            where: {
                userId: userId,
                collectionStatus: { in: ['Collected', 'Cancelled'] },
            },
            include: {
                reservationItems: {
                    include: {
                        food: {
                            include: {
                                donation: {
                                    include: {
                                        donator: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        console.log('Past reservations:', pastReservations);
        res.json(pastReservations);
    } catch (error) {
        console.error('Error fetching past reservations:', error);
        res.status(500).json({ error: 'Unable to fetch past reservations', details: error.message });
    }
});
// Reschedule Reservation (UPDATE)
app.put('/reservation/:id', async (req, res) => {
    const { id } = req.params;
    console.log(req.body)
    const { collectionDate, collectionTimeStart, collectionTimeEnd, donationId, collectionStatus } = req.body;

    // Prepare the update data
    const updateData = {
        collectionDate: new Date(collectionDate),
        collectionTimeStart,
        collectionTimeEnd,
        donation: {
            connect: { id: parseInt(donationId) }
        }
    };

    // Only include collectionStatus if it's provided
    if (collectionStatus !== undefined) {
        updateData.collectionStatus = collectionStatus;
    }

    try {
        const updatedReservation = await prisma.reservation.update({
            where: {
                id: parseInt(id),
            },
            data: updateData,
            include: {
                reservationItems: {
                    include: {
                        food: true
                    }
                }
            }
        });
        res.json(updatedReservation);
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ error: 'Unable to update reservation' });
    }
});
// Cancel Reservation (Soft delete)
app.patch('/reservation/:id/cancel', async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('Cancelling reservation with id:', id);

    try {
        const result = await prisma.$transaction(async (prisma) => {
            const existingReservation = await prisma.reservation.findUnique({
                where: { id: id },
                include: { donation: true }
            });

            if (!existingReservation) {
                return res.status(404).json({ error: 'Reservation not found.' });
            }

            if (existingReservation.collectionStatus !== 'Uncollected') {
                return res.status(400).json({ error: 'Cannot cancel a reservation that is not in Uncollected status' });
            }

            const updatedReservation = await prisma.reservation.update({
                where: { id: id },
                data: {
                    collectionStatus: 'Cancelled',
                    updatedAt: new Date()
                },
                include: {
                    reservationItems: {
                        include: {
                            food: true
                        }
                    }
                }
            });

            if (existingReservation.donation) {
                await prisma.donation.update({
                    where: { id: existingReservation.donation.id },
                    data: { availability: "Available" }
                });
            }

            return updatedReservation;
        });

        console.log('Cancelled reservation:', result);

        res.status(200).json({
            message: 'Reservation cancelled successfully',
            reservation: result
        });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ error: 'Unable to cancel reservation', details: error.message });
    }
});

app.patch('/reservation/:id/collect', async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('Marking reservation as collected, id:', id);

    try {
        const existingReservation = await prisma.reservation.findUnique({
            where: { id: id }
        });

        if (!existingReservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        if (existingReservation.collectionStatus !== 'Uncollected') {
            return res.status(400).json({ error: 'Cannot mark as collected reservation that is not in Uncollected status' });
        }

        const updatedReservation = await prisma.reservation.update({
            where: { id: id },
            data: {
                collectionStatus: 'Collected',
                updatedAt: new Date()
            },
            include: {
                reservationItems: {
                    include: {
                        food: true
                    }
                }
            }
        });

        console.log('Marked reservation as collected:', updatedReservation);

        res.status(200).json({
            message: 'Reservation marked as collected successfully',
            reservation: updatedReservation
        });
    } catch (error) {
        console.error('Error marking reservation as collected:', error);
        res.status(500).json({ error: 'Unable to mark reservation as collected', details: error.message });
    }
});

// app.delete('/reservation/:id', async (req, res) => {
//     const id = parseInt(req.params.id);
//     if (isNaN(id)) {
//         return res.status(400).json({ error: 'Invalid reservation ID' });
//     }
//     try {
//         await prisma.$transaction([
//             prisma.reservationItem.deleteMany({
//                 where: { reservationId: id },
//             }),
//             prisma.reservation.delete({
//                 where: { id: id },
//             }),
//         ]);

//         res.status(204).send();
//     } catch (error) {
//         console.error('Error cancelling reservation:', error);
//         res.status(500).json({ error: 'Unable to cancel reservation' });
//     }
// });

// MARK: event CRUD

interface EventBody {
    title: string,
    briefSummary: string,
    fullSummary: string,
    phoneNumber: string,
    emailAddress: string,
    startDate: Date,
    endDate: Date,
    maxSlots: number,
    takenSlots: number,
    attire: string,
    donatorId: number,
    images: Express.Multer.File,
}


app.post('/events', upload.array('images', 1), async (req, res) => {
    const { title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, maxSlots, takenSlots, attire, donatorId } = req.body;
    const files = req.files as Express.Multer.File[];

    try {
        const newEvent = await prisma.event.create({
            data: {
                title,
                briefSummary,
                fullSummary,
                phoneNumber,
                emailAddress,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                maxSlots: parseInt(maxSlots),
                takenSlots: 0,
                attire,
                donatorId: parseInt(donatorId),
                images: {
                    create: files.map(file => ({
                        url: `/public/${file.filename}` // Store the path relative to your public directory
                    }))
                }
            },
            include: {
                images: true
            }
        });
        console.log(newEvent)
        res.status(200).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

interface updateEventBody {
    title: string,
    briefSummary: string,
    fullSummary: string,
    phoneNumber: string,
    emailAddress: string,
    startDate: Date,
    endDate: Date,
    maxSlots: number,
    takenSlots: number,
    attire: string,
    donatorId: number,
    images: Express.Multer.File,

}



app.put('/events/update/:eventId', upload.single('images'), async (req, res) => {
    const { eventId } = req.params;
    const { title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, maxSlots, takenSlots, attire, donatorId, imageUpdated } = req.body;
    const file = req.file;

    try {
        // Find the current event to get the old image
        const currentEvent = await prisma.event.findUnique({
            where: { id: Number(eventId) },
            include: { images: true }
        });

        if (!currentEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const updateData: any = {
            title,
            briefSummary,
            fullSummary,
            phoneNumber,
            emailAddress,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            maxSlots: parseInt(maxSlots),
            takenSlots: parseInt(takenSlots),
            attire,
            donatorId: parseInt(donatorId),
        };

        if (imageUpdated === 'true' && file) {
            // Delete old image file if it exists
            if (currentEvent.images && currentEvent.images.length > 0) {
                const oldImagePath = path.join(__dirname, '..', currentEvent.images[0].url);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.error('Error deleting old image file:', err);
                }
            }

            // Update with new image
            updateData.images = {
                deleteMany: {},  // This will delete all existing images for this event
                create: {
                    url: `/public/${file.filename}`
                }
            };
        }

        const updatedEvent = await prisma.event.update({
            where: { id: Number(eventId) },
            data: updateData,
            include: {
                images: true
            }
        });

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});
app.get('/events/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        const event = await prisma.event.findUnique({
            where: { id: Number(eventId) },
            include: {
                images: true,
                participants: true
            }
        });
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});


app.get('/events', async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            include: {
                images: true,
                participants: true
            }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
app.post('/findeventsfromdonator', async (req, res) => {
    const { donatorId } = req.body
    const donator = await prisma.event.findMany({
        where: {
            donatorId: donatorId
        }
    })
    res.status(200).json(donator)

})

app.delete('/event/:id', async (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    try {
        console.log(`Attempting to delete event with ID: ${eventId}`);
        const deletedEvent = await prisma.event.delete({
            where: {
                id: eventId
            }
        });
        console.log(`Successfully deleted event:`, deletedEvent);
        res.status(200).json({ message: 'Event deleted successfully', deletedEvent });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event', details: error.message });
    }
});
app.get('/donator/events', async (req, res) => {
    try {
        const events = await prisma.event.findMany();
        console.log(events)
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// sign up functionality
app.post('/events/:eventId/signup', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    try {
        const event = await prisma.event.findUnique({
            where: { id: Number(eventId) },
            include: { participants: true }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.participants.some(participant => participant.userId === Number(userId))) {
            return res.status(400).json({ error: 'You have already signed up for this event' });
        }

        if (event.takenSlots >= event.maxSlots) {
            return res.status(400).json({ error: 'Event is already full' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: Number(eventId) },
            data: {
                takenSlots: { increment: 1 },
                participants: {
                    create: { userId: Number(userId) }
                }
            },
            include: {
                participants: true,
                images: true
            }
        });

        res.status(200).json({
            message: 'You have successfully signed up for this event!',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error signing up for event:', error);
        res.status(500).json({ error: 'Failed to sign up for event' });
    }
});

app.post('/events/:eventId/cancel-signup', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    try {
        const event = await prisma.event.findUnique({
            where: { id: Number(eventId) },
            include: { participants: true }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const participantIndex = event.participants.findIndex(
            participant => participant.userId === Number(userId)
        );

        if (participantIndex === -1) {
            return res.status(400).json({ error: 'You are not signed up for this event' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: Number(eventId) },
            data: {
                takenSlots: { decrement: 1 },
                participants: {
                    delete: { id: event.participants[participantIndex].id }
                }
            },
            include: {
                participants: true,
                images: true
            }
        });

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error canceling sign-up for event:', error);
        res.status(500).json({ error: 'Failed to cancel sign-up for event' });
    }
});


// MARK: review CRUD
// app.post('/get_donator/', async (req,res) => {
//     const {id} = req.body.id
//     try {
//         const newReview = await prisma.user.findUnique({
//             where: {
//                 id: parseInt(id, 10)
//             }
//         })
//         console.log(newReview)
//         res.status(200).json(newReview)
//     } catch (e) {
//         console.log(e)
//         res.status(400).json({error: e})
//     }
// })


// john's image review code
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
await fs.mkdir(uploadsDir, { recursive: true });

// Update multer configuration
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadsDir)
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname))
//     }
// });

// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype.startsWith('image/')) {
//             cb(null, true);
//         } else {
//             cb(new Error('Not an image! Please upload an image.') as any, false);
//         }
//     }
// })

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ends here

// Add a new reply
app.post('/reviews/:reviewId/reply', async (req, res) => {
    const { reviewId } = req.params;
    const { content, donatorId } = req.body;

    try {
        const reply = await prisma.reply.create({
            data: {
                content,
                reviewId: parseInt(reviewId),
                donatorId: parseInt(donatorId)
            },
            include: {
                donator: {
                    include: {
                        person: true
                    }
                }
            }
        });

        res.status(201).json(reply);
    } catch (error) {
        console.error('Error creating reply:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/review_submit/:id', upload.array('images', 2), async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, userId, isAnonymous, foodId } = req.body;

        const donatorId = parseInt(id, 10);
        const reviewerId = parseInt(userId, 10);
        const foodItemId = parseInt(foodId, 10);

        // Validate input
        if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
            return res.status(400).json({ error: 'Invalid rating' });
        }

        if (!foodItemId) {
            return res.status(400).json({ error: 'Food item ID is required' });
        }

        // Check if the user has already reviewed this food item
        const existingReview = await prisma.reviewedItem.findUnique({
            where: {
                userId_foodId: {
                    userId: reviewerId,
                    foodId: foodItemId
                }
            }
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this food item' });
        }

        const newReview = await prisma.$transaction(async (prisma) => {
            const review = await prisma.review.create({
                data: {
                    rating: parseInt(rating),
                    comment,
                    userId: reviewerId,
                    donatorId: donatorId,
                    isAnonymous: isAnonymous === 'true',
                    images: {
                        create: req.files ? req.files.map(file => ({
                            url: path.relative(uploadsDir, file.path).replace(/\\/g, '/')
                        })) : []
                    }
                },
                include: {
                    user: {
                        include: {
                            person: true
                        }
                    },
                    donator: {
                        include: {
                            person: true
                        }
                    },
                    images: true
                }
            });

            // Create a record in ReviewedItem
            await prisma.reviewedItem.create({
                data: {
                    userId: reviewerId,
                    foodId: foodItemId,
                    reviewId: review.id
                }
            });

            const donator = await prisma.donator.findUnique({
                where: { id: donatorId },
                include: { reviews: true }
            });

            const newAverageRating = donator.reviews.reduce((sum, review) => sum + review.rating, 0) / donator.reviews.length;
            const newReviewCount = donator.reviews.length;

            await prisma.donator.update({
                where: { id: donatorId },
                data: {
                    averageRating: newAverageRating,
                    reviewCount: newReviewCount
                }
            });

            return review;
        });

        res.status(201).json({ message: 'Review created successfully', review: newReview });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
app.get('/reviewed-items/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    try {
        const reviewedItems = await prisma.reviewedItem.findMany({
            where: { userId: userId },
            select: { foodId: true }
        });

        const reviewedItemsMap = reviewedItems.reduce((acc, item) => {
            acc[item.foodId] = true;
            return acc;
        }, {});

        res.json(reviewedItemsMap);
    } catch (error) {
        console.error('Error fetching reviewed items:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
app.post('/donators', async (req, res) => {
    try {
        const donators = await prisma.donator.findMany({
            include: {
                person: true,
                reviews: true,
            },
        });

        const donatorsWithStats = donators.map(donator => {
            const reviewCount = donator.reviews.length;
            const averageRating = reviewCount > 0
                ? donator.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
                : 0;

            return {
                id: donator.id,
                name: donator.person.name,
                averageRating: parseFloat(averageRating.toFixed(1)),
                reviewCount,
            };
        });

        console.log('Sending donators data to frontend:', JSON.stringify(donatorsWithStats, null, 2));

        res.json(donatorsWithStats);
    } catch (error) {
        console.error('Error fetching donators:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/get_donator', async (req, res) => {
    const { id } = req.body;
    try {
        const donator = await prisma.donator.findUnique({
            where: { id: parseInt(id) },
            include: { person: true }
        });
        if (donator) {
            res.json({ name: donator.person.name });
        } else {
            res.status(404).json({ error: 'Donator not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const donatorId = parseInt(id, 10);
        const userId = req.query.userId ? parseInt(req.query.userId.toString(), 10) : undefined;
        const userRole = req.query.userRole;

        const reviews = await prisma.review.findMany({
            where: {
                donatorId: donatorId
            },
            include: {
                user: {
                    include: {
                        person: true
                    }
                },
                donator: {
                    include: {
                        person: true
                    }
                },
                reply: true,
                images: true,
                likes: true,
                reviewedItem: {
                    include: {
                        food: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const reviewedItems = await prisma.reviewedItem.findMany({
            where: {
                userId: userId
            }
        });

        const mappedReviews = reviews.map(review => {
            const reviewData = { ...review };
            if (reviewData.isAnonymous) {
                const name = reviewData.user?.person?.name || 'Anonymous';
                reviewData.user.person.name = `${name[0]}${'*'.repeat(6)}`;
            }
            reviewData.likeCount = reviewData.likes.length;
            reviewData.likedByUser = reviewData.likes.some(like =>
                (userRole === 'user' && like.userId === userId) ||
                (userRole === 'donator' && like.donatorId === userId)
            );
            reviewData.likedByDonator = reviewData.likes.some(like => like.donatorId === donatorId);
            reviewData.reviewedByUser = reviewedItems.some(item => item.reviewId === review.id);
            delete reviewData.likes;
            reviewData.foodName = review.reviewedItem?.food?.name || 'Unknown Item';
            return reviewData;
        });

        res.status(200).json(mappedReviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.post('/reviews/:reviewId/like', async (req, res) => {
    const { reviewId } = req.params;
    const { userId, userRole } = req.body;

    console.log(`Received like request for reviewId: ${reviewId}, userId: ${userId}, userRole: ${userRole}`);

    try {
        const review = await prisma.review.findUnique({
            where: { id: parseInt(reviewId) },
            include: { likes: true }
        });

        if (!review) {
            console.log(`Review with id ${reviewId} not found`);
            return res.status(404).json({ error: "Review not found." });
        }

        let existingLike;
        let likeData;

        if (userRole === 'user') {
            existingLike = review.likes.find(like => like.userId === parseInt(userId));
            likeData = { userId: parseInt(userId), reviewId: parseInt(reviewId) };
        } else if (userRole === 'donator') {
            existingLike = review.likes.find(like => like.donatorId === parseInt(userId));
            likeData = { donatorId: parseInt(userId), reviewId: parseInt(reviewId) };
        } else {
            return res.status(400).json({ error: "Invalid user role" });
        }

        let updatedReview;
        let message;
        let liked;

        if (existingLike) {
            console.log(`Unliking review ${reviewId} for ${userRole} ${userId}`);
            await prisma.like.delete({
                where: { id: existingLike.id }
            });

            updatedReview = await prisma.review.update({
                where: { id: parseInt(reviewId) },
                data: { likeCount: { decrement: 1 } },
            });

            message = 'Review unliked';
            liked = false;
        } else {
            console.log(`Liking review ${reviewId} for ${userRole} ${userId}`);
            await prisma.like.create({
                data: likeData
            });

            updatedReview = await prisma.review.update({
                where: { id: parseInt(reviewId) },
                data: { likeCount: { increment: 1 } },
            });

            message = 'Review liked';
            liked = true;
        }

        console.log(`Successfully updated like status for review ${reviewId}`);
        res.status(200).json({
            message: message,
            likeCount: updatedReview.likeCount,
            liked: liked
        });
    } catch (error) {
        console.error('Error handling review like:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: error.stack
        });
    }
});

app.put('/reviews/:id', async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const { rating, comment } = req.body;
    console.log(`Received update request for review ID: ${reviewId}`);
    const startTime = Date.now();

    // Set a timeout to force a response after 10 seconds
    const timeoutId = setTimeout(() => {
        console.log(`Update operation timed out after 10 seconds for review ID: ${reviewId}`);
        res.status(504).json({ error: 'Update operation timed out' });
    }, 10000);

    try {
        const result = await prisma.$transaction(async (prisma) => {
            console.log('Attempting to update review...');
            const updatedReview = await prisma.review.update({
                where: { id: reviewId },
                data: { rating, comment }
            });

            // Fetch the updated donator with reviews
            const donator = await prisma.donator.findUnique({
                where: { id: updatedReview.donatorId },
                include: { reviews: true, person: true }
            });

            // Calculate new stats
            const newAverageRating = donator.reviews.length > 0
                ? donator.reviews.reduce((sum, review) => sum + review.rating, 0) / donator.reviews.length
                : 0;
            const newReviewCount = donator.reviews.length;

            console.log('Calculated new stats:', { newAverageRating, newReviewCount });

            // Update the donator
            await prisma.donator.update({
                where: { id: updatedReview.donatorId },
                data: { averageRating: newAverageRating, reviewCount: newReviewCount }
            });

            return {
                id: donator.id,
                name: donator.person.name,
                averageRating: parseFloat(newAverageRating.toFixed(1)),
                reviewCount: newReviewCount,
            };
        });

        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.log(`Review updated successfully in ${endTime - startTime}ms:`, result);
        res.status(200).json({
            message: 'Review updated successfully',
            updatedDonator: result,
            timeTaken: endTime - startTime
        });
    } catch (error) {
        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.error(`Error updating review after ${endTime - startTime}ms:`, error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Review not found', timeTaken: endTime - startTime });
        } else {
            res.status(500).json({ error: 'Failed to update review', details: error.message, timeTaken: endTime - startTime });
        }
    }
});

app.delete('/reviews/:id', async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.userId, 10);

    try {
        console.log(`Attempting to delete review ${reviewId} for user ${userId}`);

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                reply: true,
                donator: true,
                images: true,
                likes: true,
                reviewedItem: true // Include the associated ReviewedItem
            }
        });

        if (!review) {
            console.log(`Review ${reviewId} not found`);
            return res.status(404).json({ error: 'Review not found' });
        }

        console.log(`Review found:`, JSON.stringify(review, null, 2));

        if (review.userId !== userId) {
            console.log(`User ${userId} not authorized to delete review ${reviewId}`);
            return res.status(403).json({ error: 'You are not authorized to delete this review' });
        }

        await prisma.$transaction(async (prisma) => {
            // Delete associated ReviewedItem
            if (review.reviewedItem) {
                console.log(`Deleting ReviewedItem for review ${reviewId}`);
                await prisma.reviewedItem.delete({
                    where: { id: review.reviewedItem.id }
                });
            }

            // Delete associated likes
            if (review.likes.length > 0) {
                console.log(`Deleting ${review.likes.length} likes for review ${reviewId}`);
                await prisma.like.deleteMany({
                    where: { reviewId: reviewId }
                });
            }

            // Delete associated images if they exist
            if (review.images.length > 0) {
                console.log(`Deleting ${review.images.length} images for review ${reviewId}`);
                await prisma.image.deleteMany({
                    where: { reviewId: reviewId }
                });
            }

            // Delete the associated reply if it exists
            if (review.reply) {
                console.log(`Deleting reply ${review.reply.id} for review ${reviewId}`);
                await prisma.reply.delete({
                    where: { id: review.reply.id }
                });
            }

            // Now delete the review
            console.log(`Deleting review ${reviewId}`);
            await prisma.review.delete({
                where: { id: reviewId }
            });

            // Recalculate donator's stats
            const donator = await prisma.donator.findUnique({
                where: { id: review.donatorId },
                include: { reviews: true }
            });

            const newAverageRating = donator.reviews.length > 0
                ? donator.reviews.reduce((sum, r) => sum + r.rating, 0) / donator.reviews.length
                : 0;

            console.log(`Updating donator ${review.donatorId} stats`);
            await prisma.donator.update({
                where: { id: review.donatorId },
                data: {
                    averageRating: newAverageRating,
                    reviewCount: donator.reviews.length
                }
            });
        });

        console.log(`Review ${reviewId}, associated reply, likes, images, and ReviewedItem deleted successfully`);
        res.status(200).json({ message: 'Review and all associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        console.error('Error stack:', error.stack);
        console.error('Prisma error:', error.message);
        if (error.meta) {
            console.error('Prisma error meta:', error.meta);
        }
        res.status(500).json({
            error: 'Failed to delete review',
            details: error.message,
            stack: error.stack,
            meta: error.meta
        });
    }
});

// Edit a reply
app.put('/replies/:replyId', async (req, res) => {

    const { replyId } = req.params;
    const { content } = req.body;

    try {
        const updatedReply = await prisma.reply.update({
            where: { id: parseInt(replyId) },
            data: { content },
            include: {
                donator: {
                    include: {
                        person: true
                    }
                }
            }
        });

        res.status(200).json(updatedReply);
    } catch (error) {
        console.error('Error updating reply:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a reply
app.delete('/replies/:replyId', async (req, res) => {
    const { replyId } = req.params;

    try {
        await prisma.reply.delete({
            where: { id: parseInt(replyId) }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new post
app.post('/posts', async (req, res) => {
    const { content, imageUrl, donatorId } = req.body;
    try {
        const newPost = await prisma.post.create({
            data: {
                content,
                imageUrl,
                donatorId: parseInt(donatorId)
            }
        });
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get all posts
app.get('/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                donator: {
                    include: {
                        person: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get posts for a specific donator
app.get('/posts/:donatorId', async (req, res) => {
    const { donatorId } = req.params;
    try {
        const posts = await prisma.post.findMany({
            where: {
                donatorId: parseInt(donatorId)
            },
            include: {
                donator: {
                    include: {
                        person: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Update a post
app.put('/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { content, imageUrl } = req.body;
    try {
        const updatedPost = await prisma.post.update({
            where: { id: parseInt(id) },
            data: { content, imageUrl }
        });
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete a post
app.delete('/posts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.post.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});



// Middleware function in expressjs so that routes that want authentication will have to go through this route
function authenticateToken(req: any, res: any, next: any) {
    const header = req.headers['authorization']
    const token = header && header.split(' ')[1]
    // looks like this -> Bearer <token> so split at the first space
    if (token == null) {
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.JWT_TOKEN as Secret, (err: any, user: any) => {
        if (err) {
            console.log(err)
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}

// Middleware function in expressjs so that routes that want authentication will have to go through this route
function isAdmin(req, res, next) {
    const header = req.headers['authorization']
    const token = header && header.split(' ')[1]
    // looks like this -> Bearer <token> so split at the first space
    if (token == null) {
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json(err);
        }
        else if (req.body == undefined) {
            res.status(400).json({ message: "No file uploaded" });
        }
        else {
            res.json({ filename: req.body.filename });
        }
    })
});
app.get("/exampleAuthenticatedRoute", authenticateToken, (req, res) => {
    res.send('this is homepage')
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server is running at port number ${port}`)
}); 