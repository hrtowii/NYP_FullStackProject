// the backend will be here. Models and data will be placed in backend/models/etcetc.js
import express from "express"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import cors from "cors"
import * as crypto from 'crypto';
// used for email verification
import { Resend } from "resend"
// Redis is used for storing OTP tokens temporarily
import { createClient } from 'redis';

const redisClient = createClient({
    // legacyMode: true,
    // socket: {
    //     port: 6379,
    //     host: "redis"
    // }
});
await redisClient.connect().catch(console.error);
const resend = new Resend(process.env.RESEND_SECRET)
const prisma = new PrismaClient() // -> database

const app = express();
app.use(express.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(cors());

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('this is homepage')
})

// what the user object should look like:
interface User {
    name: string,
    email: string,
    password: string,
    role: "user" | "donator",
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
                    donator: true
                }
            })
            return res.status(200).json({ success: true });
        } else {
            return res.status(403).json({error: "Invalid OTP code"});
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
            donator: true
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
    const ourRole = person.user ? 'user' : person.donator ? 'donator' : null;
    const token = jwt.sign(
        { id: person.id, role: ourRole },
        process.env.JWT_SECRET,
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
        return res.status(409).json({error: "User already exists"})
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



// Iruss - Reservation
let reservationList: String[] = [];

interface ReservationBody {
    userId: number;
    foodId: number;
    collectionTimeStart: string;
    collectionTimeEnd: string;
    collectionStatus: 'PENDING' | 'COMPLETE' | 'CANCELLED';
}   

app.post('/reservation', async (req, res) => {
    try {
        const {
            userId,
            foodId,
            collectionTimeStart,
            collectionTimeEnd,
            collectionStatus
        }: ReservationBody = req.body;
        console.log(req.body);

        // Validate input
        if (!userId || !foodId || !collectionTimeStart || !collectionTimeEnd || !collectionStatus) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Create or find person
        const person = await prisma.person.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: `user${userId}@example.com`,
                name: `User ${userId}`,
                hashedPassword: await bcrypt.hash('defaultpassword', 10)
            }
        });

        // Create or find user
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { person: { connect: { id: userId } } }
        });

        // Create or find donator
        const donator = await prisma.donator.upsert({
            where: { id: 1 },
            update: {},
            create: { 
                person: { 
                    create: {
                        email: 'donator@example.com',
                        name: 'Mock Donator',
                        hashedPassword: await bcrypt.hash('defaultpassword', 10)
                    }
                } 
            }
        });

        // Create or find donation
        const donation = await prisma.donation.upsert({
            where: { id: 1 },
            update: {},
            create: { 
                id: 1,
                title: "Mock Donation",
                foodReserved: false,
                donatorId: donator.id
            }
        });

        // Create or find food
        const food = await prisma.food.upsert({
            where: { id: foodId },
            update: {},
            create: { 
                id: foodId, 
                imageLink: "https://example.com/mock-food-image.jpg", 
                quantity: 1, 
                type: "Mock Food", 
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                donationId: donation.id 
            }
        });

        // Create the reservation
        const newReservation = await prisma.reservation.create({
            data: {
                userId: user.id,
                foodId: food.id,
                CollectionTimeStart: new Date(collectionTimeStart),
                CollectionTimeEnd: new Date(collectionTimeEnd),
                CollectionStatus: collectionStatus
            },
            include: {
                user: {
                    include: {
                        person: true
                    }
                },
                food: {
                    include: {
                        donation: {
                            include: {
                                donator: {
                                    include: {
                                        person: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return res.status(201).json({ success: true, data: newReservation });
    } catch (error) {
        console.error("Error creating reservation:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

// Retrieve reservations
app.get('/reservation', async (req, res) => {
    res.json(reservationList);
    
    return res.status(200).json({ success: true });
})


// Middleware function in expressjs so that routes that want authentication will have to go through this route
function authenticateToken(req, res, next) {
    const header = req.headers['authorization']
    const token = header && header.split(' ')[1]
    // looks like this -> Bearer <token> so split at the first space
    if (token == null) {
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.JWT_TOKEN, (err, user) => {
        if (err) {
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}

app.get("/exampleAuthenticatedRoute", authenticateToken, (req, res) => {
    res.send('this is homepage')
})

app.listen(port, () => {
    console.log(`server is running at port number ${port}`)
});
