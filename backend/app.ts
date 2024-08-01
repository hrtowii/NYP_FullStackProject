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

//MARK: Admin functions

// Create test accounts, including admin. NEVER ADD THIS IN REAL LIFE
app.post('/createAccounts', async (req, res) => {
    const user: User = {
        name: "admin",
        email: "test@gmail.com",
        password: "1234",
        role: "admin"
    }
    await prisma.person.create({
        data: {
            name: user.name,
            hashedPassword: await bcrypt.hash(user.password, 12),
            email: user.email,
            [user.role]: {
                create: {}
            },
            // ["donator"]: {
            //     create: {}
            // },
            // ["user"]: {
            //     create: {}
            // }
        },
        include: {
            user: true,
            donator: true,
            admin: true
        }
    })
    await prisma.person.create({
        data: {
            name: "lucas",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "leonghongkit@gmail.com",
            ["donator"]: {
                create: {}
            }
        }
    })
    await prisma.person.create({
        data: {
            name: "andric",
            hashedPassword: await bcrypt.hash("123", 12),
            email: "lucasleong09@gmail.com",
            ["user"]: {
                create: {}
            }
        }
    })
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

    try {
        if (isNaN(donatorId) || donationGoal < 0) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        const donator = await prisma.donator.update({
            where: { id: donatorId },
            data: { donationGoal },
        });

        res.json(donator);
    } catch (error) {
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
    const { foods, category, remarks, image } = req.body;
    try {
        const updatedDonation = await prisma.donation.update({
            where: { id: parseInt(id) },
            data: {
                category,
                remarks,
                image,
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
        console.log("Fetching reservations");
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
        console.error('Error fetching reservations:', error);
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


    // const id: number = parseInt(req.params.id)
    const userId: number = parseInt(req.params.id)
    const formData: ReservationInterface = req.body;
    let donationId = formData.cartItems[0].id;
    console.log('Received reservation data:', req.body);
    try {
        // Check if User exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(400).json({ error: `User with id ${userId} not found` });
        }

        donationId = parseInt(donationId.toString(), 10);

        const newReservation = await prisma.reservation.create({
            data: {
                user: {
                    connect: { id: userId }
                },
                collectionDate: new Date(formData.collectionDate),
                collectionTimeStart: formData.collectionTimeStart,
                collectionTimeEnd: formData.collectionTimeEnd,
                collectionStatus: 'Uncollected',
                remarks: formData.remarks,
                donation: {
                    connect: { id: donationId }
                },
                reservationItems: {
                    create: formData.cartItems.flatMap(item =>
                        item.foods.map(food => ({
                            food: { connect: { id: food.id } },
                            quantity: food.quantity
                        }))
                    )
                }
            },
            include: {
                reservationItems: {
                    include: {
                        food: true
                    }
                },
                donation: {
                    include: {
                        foods: true
                    }
                },
                user: true
            },
        });
        res.status(201).json(newReservation);
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Unable to create reservation', details: error.message });
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
        console.log("collection status FOUND")
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
        const existingReservation = await prisma.reservation.findUnique({
            where: { id: id }
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

        console.log('Cancelled reservation:', updatedReservation);

        res.status(200).json({
            message: 'Reservation cancelled successfully',
            reservation: updatedReservation
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
    attire: string,
    donatorId: number,
    images: Express.Multer.File,
}


app.post('/events', upload.array('images', 1), async (req, res) => {
    const { title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, maxSlots, attire, donatorId } = req.body;
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
    attire: string,
    donatorId: number,
    images: Express.Multer.File,

}
app.put('/events/update/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, maxSlots, attire, donatorId } = req.body;
    const files = req.files as Express.Multer.File[];

    try {
        let updateData: any = {
            title,
            briefSummary,
            fullSummary,
            phoneNumber,
            emailAddress,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            maxSlots,
            attire,
            donatorId: Number(donatorId),
        };
        if (files && files.length > 0) {
            updateData.images = {
                create: files.map(file => ({
                    url: `/public/${file.filename}`
                }))
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
                images: true
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
                images: true
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
        const { rating, comment, userId, isAnonymous } = req.body;

        const donatorId = parseInt(id, 10);
        const reviewerId = parseInt(userId, 10);

        // Validate input
        if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
            return res.status(400).json({ error: 'Invalid rating' });
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

        console.log(`Fetching reviews for donatorId: ${donatorId}, userId: ${userId}`);

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
                _count: {
                    select: { likes: true }
                },
                likes: userId ? {
                    where: { userId: userId }
                } : undefined
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Found ${reviews.length} reviews`);

        const mappedReviews = reviews.map(review => {
            const reviewData = { ...review };
            if (reviewData.isAnonymous) {
                const name = reviewData.user?.person?.name || 'Anonymous';
                reviewData.user.person.name = `${name[0]}${'*'.repeat(6)}`;
            }
            reviewData.likeCount = reviewData._count.likes;
            reviewData.likedByUser = reviewData.likes && reviewData.likes.length > 0;
            delete reviewData._count;
            delete reviewData.likes;
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
    const { userId } = req.body;

    try {
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_reviewId: {
                    userId: parseInt(userId),
                    reviewId: parseInt(reviewId)
                }
            }
        });

        let updatedReview;
        let message;
        let liked;

        if (existingLike) {
            // Unlike the review
            await prisma.like.delete({
                where: {
                    userId_reviewId: {
                        userId: parseInt(userId),
                        reviewId: parseInt(reviewId)
                    }
                }
            });

            updatedReview = await prisma.review.update({
                where: { id: parseInt(reviewId) },
                data: { likeCount: { decrement: 1 } },
                include: { _count: { select: { likes: true } } }
            });

            message = 'Review unliked';
            liked = false;
        } else {
            // Like the review
            await prisma.like.create({
                data: {
                    userId: parseInt(userId),
                    reviewId: parseInt(reviewId)
                }
            });

            updatedReview = await prisma.review.update({
                where: { id: parseInt(reviewId) },
                data: { likeCount: { increment: 1 } },
                include: { _count: { select: { likes: true } } }
            });

            message = 'Review liked';
            liked = true;
        }

        res.status(200).json({
            message: message,
            likeCount: updatedReview._count.likes,
            liked: liked
        });
    } catch (error) {
        console.error('Error handling review like:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                images: true
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
            // First, delete associated images if they exist
            if (review.images.length > 0) {
                console.log(`Deleting ${review.images.length} images for review ${reviewId}`);
                await prisma.image.deleteMany({
                    where: { reviewId: reviewId }
                });
            }

            // Then, delete the associated reply if it exists
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

        console.log(`Review ${reviewId}, associated reply, and images deleted successfully`);
        res.status(200).json({ message: 'Review, associated reply, and images deleted successfully' });
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