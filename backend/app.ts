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
import { Dayjs } from "dayjs"

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
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(cors());

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
        { id: person.id, role: ourRole },
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
        return res.status(409).json({ error: "User already exists" })
    }
    const ourOtp: number = crypto.randomInt(0, 999999);
    // redis set otp code
    await redisClient.set(emailDetails.email, ourOtp);

    const { data, error } = await resend.emails.send({
        from: "ecosanct@hrtowii.dev",
        to: [emailDetails.email],
        subject: "Test email for fullstack",
        html: `Email verification code: ${ourOtp}`,
    });


    if (error) {
        console.log(error)
        return res.status(400).json({ error });
    }


    return res.status(200).json({ data });
})

app.post('/logout', async (req, res) => {
    return res.status(200).json({ success: true })
        .setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
})

//MARK: Admin functions

// Create a test admin account. NEVER ADD THIS IN REAL LIFE
// app.post('/createAdminAccount', async(req, res) => {
//     const user: User = {
//         name: "admin",
//         email: "test@gmail.com",
//         password: "1234",
//         role: "admin"
//     }
//     await prisma.person.create({
//         data: {
//             name: user.name,
//             hashedPassword: await bcrypt.hash(user.password, 12),
//             email: user.email,
//             [user.role]: {
//                 create: {}
//             }
//         },
//         include: {
//             user: true,
//             donator: true,
//             admin: true
//         }
//     })
//     return res.status(200).json({ success: true });
// })

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

// Delete a user
app.delete('/users/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.person.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
});

// Update user details
app.put('/users/:id', isAdmin, async (req, res) => {
  });
  



// Update user details
app.put('/users/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { email, name } = req.body;
    try {
        const updatedUser = await prisma.person.update({
            where: { id: parseInt(id) },
            data: { email, name },
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });
    }
});

// Additional admin features

// Get user statistics
app.get('/stats', isAdmin, async (req, res) => {
    try {
        let totalPeople = await prisma.person.count();
        const totalDonators = await prisma.donator.count();
        const totalUsers = await prisma.user.count();
        res.json({ totalUsers, totalDonators });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching statistics' });
    }
});

app.get('/search', isAdmin, async (req, res) => {
    let { query } = req.query;
    query = query as string
    try {
        const users = await prisma.person.findMany({
            where: {
                OR: [
                    { email: { contains: query } },
                    { name: { contains: query } },
                ],
            },
            include: {
                user: true,
                donator: true,
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error searching users' });
    }
});

app.post('/reset-password/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
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
    foodName: string,
    quantity: string,
    expiryDate: string,
    type: string
}
app.post('/donation', async (req, res) => {
    let formData: donationInterface = req.body
    const result = await prisma.donation.create({
        data: {
            food: formData.foodName,
            donator: {
                connect: {
                    id: 1,
                },
            },
            expiryDate: new Date(formData.expiryDate),
            quantity: parseInt(formData.quantity, 10),
            category: "asd",
            deliveryDate: new Date(formData.expiryDate),
            location: "asd",
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
    res.status(200).json(result)
})

//MARK: Reservation CRUD

app.post('/reservation', authenticateToken, async (req, res) => {  // Create New Reservation
    const { collectionDate, collectionTime, remarks } = req.body;
    const userId = req.user.id;

    try {
        const newReservation = await prisma.reservation.create({
            data: {
                userId,
                collectionDate: new Date(collectionDate),
                collectionTime,
                remarks,
                status: 'Uncollected',
            },
        });
        res.json(newReservation);
    } catch (error) {
        res.status(500).json({ error: 'Unable to create reservation' });
    }
});

app.get('/reservation/current', authenticateToken, async (req, res) => {  // Get Current Reservations
    const userId = req.user.id;

    try {
        const currentReservations = await prisma.reservation.findMany({
            where: {
                userId,
                status: 'Uncollected',
            },
        });
        res.json(currentReservations);
    } catch (error) {
        console.error('Error fetching current reservations:', error);  // temporary
        res.status(500).json({ error: 'Unable to fetch current reservations' });
    }
});

app.get('/reservation/past', authenticateToken, async (req, res) => {  // Get Past Reservations
    const userId = req.user.id;

    try {
        const pastReservations = await prisma.reservation.findMany({
            where: {
                userId,
                status: 'Collected',
            },
        });
        res.json(pastReservations);
    } catch (error) {
        console.error('Error fetching past reservations:', error);
        res.status(500).json({ error: 'Unable to fetch past reservations' });
    }
});

app.put('/resevation/:id/reschedule', authenticateToken, async (req, res) => {  // Reschedule Reservation
    const { id } = req.params;
    const { collectionDate, collectionTime, remarks } = req.body;
    const userId = req.user.id;

    try {
        const updatedReservation = await prisma.reservation.updateMany({
            where: {
                id: parseInt(id),
                userId,
                status: 'Uncollected',
            },
            data: {
                collectionDate: new Date(collectionDate),
                CollectionTime,
            },
        });

        if (updatedReservation.count === 0) {
            return res.status(404).json({ error: 'Reservation not found or already collected/cancelled' });
        }

        res.json({ message: 'Reservation rescheduled successfully' });
    } catch (error) {
        console.error('Error rescheduling reservation:', error);
        res.status(500).json({ error: 'Unable to reschedule reservation' });
    }
});

app.put('/reservation/:id/cancel', authenticateToken, async (req, res) => {  // Cancel Reservation
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const cancelledReservation = await prisma.reservation.updateMany({
            where: {
                id: parseInt(id),
                userId,
                status: 'Uncollected',
            },
        })
    } catch (e) {
        console.error('Error cancelling reservation:', e);
    }
})


// MARK: event CRUD
interface EventBody {
    title: string,
    briefSummary: string,
    fullSummary: string,
    phoneNumber: string,
    emailAddress: string,
    startDate: Date,
    endDate: Date,
    donatorId: number,
}


app.post('/event', async (req, res) => {
    const { title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, donatorId }: EventBody = req.body;
    console.log(req.body);


    try {
        // const newEvent = await prisma.event.create({
        //     data: {
        //         title,
        //         summary,
        //         dates: new Date(), // Assuming 'date' is a string in a valid date format
        //         donatorId: 1, // Ensure donatorId is an integer
        //     },
        // });

        // res.status(200).json(newEvent);
        const newEvent = await prisma.event.create({
            data: {
                title,
                briefSummary,
                fullSummary,
                phoneNumber,
                emailAddress,
                startDate: new Date(),
                endDate: new Date(),
                donatorId: 1, // Ensure donatorId is an integer
            },
        });

        res.status(200).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});
});

interface updateEventBody {
    title: string,
    briefSummary: string,
    fullSummary: string,
    phoneNumber: string,
    emailAddress: string,
    startDate: Date,
    endDate: Date,
    donatorId: number,
}
app.put('/event', async (req, res) => {
    // const { eventId, title, summary, date, donatorId } = req.body
    const { eventId, title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, donatorId } = req.body
    const updatedEvent = await prisma.event.update({
        where: {
            id: eventId
        },
        data: {
            title: title,
            summary: summary,
            dates: date ? new Date() : undefined,
            donatorId: donatorId,
            briefSummary: briefSummary,
            fullSummary: fullSummary,
            phoneNumber: phoneNumber,
            emailAddress: emailAddress,
            startDate: startDate ? new Date() : undefined,
            endDate: startDate ? new Date() : undefined,
        }
    })
    res.status(200).json(updatedEvent)
})

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
    await prisma.event.delete({
        where: {
            id: eventId
        }
    })
    res.status(200)
})
app.get('/events', async (req, res) => {
    try {
        const events = await prisma.event.findMany();
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// MARK: review CRUD
app.post('/review_submit', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const newReview = await prisma.review.create({
            data: {
                rating,
                comment,
                donator: { connect: { id: 1 } }
            },
        });
        res.status(200).json(newReview);
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message });
    }
})

app.delete('/reviews/:id', async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    await prisma.review.delete({
        where: {
            id: reviewId
        }
    })
    res.status(200)
})

app.post('/reviews/:id', async (req, res) => {
    try {
        const donatorId = parseInt(req.params.id);
        const reviews = await prisma.review.findMany({
            where: {
                donatorId: donatorId
            }
        });
        res.status(200).json(reviews);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
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

app.get("/exampleAuthenticatedRoute", authenticateToken, (req, res) => {
    res.send('this is homepage')
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server is running at port number ${port}`)
});
