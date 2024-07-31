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
    return res.status(200).json({ success: true })
        .setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
})

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
            }
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
    foodName: string,
    quantity: string,
    expiryDate: string,
    type: string,
    category: string,
    location: string,
    remarks: string,
    imageURL: string,
}
app.post('/donation/:id', async (req, res) => {
    const id: number = parseInt(req.params.id);
    let formData: donationInterface = req.body
    const result = await prisma.donation.create({
        data: {
            donator: {
                connect: {
                    id: id,
                },
            },
            category: formData.category,
            deliveryDate: new Date(formData.expiryDate),
            location: formData.location,
            remarks: formData.remarks,
            imageUrl: formData.imageURL,
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

// Delete donations
app.delete('/donations/:id', async (req, res) => {
    const donationId = parseInt(req.params.id, 10);
    console.log(`Received delete request for donation ID: ${donationId}`);

    try {
        const result = await prisma.$transaction(async (prisma) => {
            // Delete related foods
            await prisma.food.deleteMany({
                where: { donationId: donationId }
            });

            // Delete related reservations
            await prisma.reservation.deleteMany({
                where: { donationId: donationId }
            });

            // Now delete the donation
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
    const { foods, category, remarks, imageUrl } = req.body;
    try {
        const updatedDonation = await prisma.donation.update({
            where: { id: parseInt(id) },
            data: {
                category,
                remarks,
                imageUrl,
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



//MARK: Reservation CRUD

// Create New Reservation

interface ReservationInterface {
    userId: number;
    collectionDate: string; // Will be converted to Date in backend
    collectionTimeStart: string;
    collectionTimeEnd: string;
    remarks?: string;
    donationId: number;
}

app.post('/reservation/:id', async (req, res) => {
    const id: number = parseInt(req.params.id)
    const formData: ReservationInterface = req.body;
    console.log('Received reservation data:', req.body);
    try {
        // Check if User exists
        const user = await prisma.user.findUnique({
            where: { id: id },
        });
        if (!user) {
            return res.status(400).json({ error: `User with id ${id} not found` });
        }
        // Remove donation-related for now, to test functionality of just the reservation part

        // let donation;
        // if (formData.donationId) {  // check if donation exists
        //     donation = await prisma.donation.findUnique({
        //         where: { id: formData.donationId },
        //     });
        //     if (!donation) {
        //         return res.status(400).json({ error: `Donation with id ${formData.donationId} not found` });
        //     }
        // }

        const newReservation = await prisma.reservation.create({
            data: {
                userId: id,
                collectionDate: new Date(formData.collectionDate),
                collectionTimeStart: formData.collectionTimeStart,
                collectionTimeEnd: formData.collectionTimeEnd,
                collectionStatus: 'Uncollected',
                remarks: formData.remarks,
                // donationId: formData.donationId || null,  // will be null if no donationId provided
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
    const { collectionDate, collectionTimeStart, collectionTimeEnd } = req.body;

    try {
        const updatedReservation = await prisma.reservation.updateMany({
            where: {
                id: parseInt(id),
            },
            data: {
                collectionDate: new Date(collectionDate),
                collectionTimeStart,
                collectionTimeEnd,
            },
        });
        res.json(updatedReservation);
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ error: 'Unable to update reservation' });
    }

});

// Cancel Reservation
app.delete('/reservation/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid reservation ID' });
    }
    try {
        await prisma.reservation.delete({
            where: { id: id },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ error: 'Unable to cancel reservation' });
    }
});


// MARK: event CRUD
interface EventBody {
    title: string,
    briefSummary: string,
    fullSummary: string,
    phoneNumber: string,
    emailAddress: string,
    startDate: Date,
    endDate: Date,
    imageFile: string,
    donatorId: number,
}


app.post('/events', async (req, res) => {
    const { title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, imageFile, donatorId }: EventBody = req.body;
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
                startDate: new Date(startDate), // Convert ISO string to Date object
                endDate: new Date(endDate),     // Convert ISO string to Date object
                imageFile: imageFile || '',     // Use empty string if imageFile is null/undefined
                donatorId: Number(donatorId),
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

interface updateEventBody {
    title: string,
    briefSummary: string,
    fullSummary: string,
    phoneNumber: string,
    emailAddress: string,
    startDate: Date,
    endDate: Date,
    imageFile: null,
    donatorId: number,
}
app.put('/events/update/:eventId', async (req, res) => {
    const { eventId } = req.params;  // Get eventId from params, not body
    const { title, briefSummary, fullSummary, phoneNumber, emailAddress, startDate, endDate, imageFile, donatorId } = req.body;

    try {
        const updatedEvent = await prisma.event.update({
            where: { id: Number(eventId) },
            data: {
                title,
                briefSummary,
                fullSummary,
                phoneNumber,
                emailAddress,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                imageFile: "a",
                // hardcoded^
                donatorId: Number(donatorId),
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

app.post('/review_submit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, userId } = req.body;

        console.log('Received review submission:', { id, rating, comment, userId });

        const donatorId = parseInt(id, 10);
        const reviewerId = parseInt(userId, 10);

        // Validate input (same as before)

        const newReview = await prisma.$transaction(async (prisma) => {
            const review = await prisma.review.create({
                data: {
                    rating,
                    comment,
                    userId: reviewerId,
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
                    }
                }
            });

            console.log('Created new review:', JSON.stringify(review, null, 2));

            const donator = await prisma.donator.findUnique({
                where: { id: donatorId },
                include: { reviews: true }
            });

            console.log('Fetched donator with reviews:', JSON.stringify(donator, null, 2));

            const newAverageRating = donator.reviews.reduce((sum, review) => sum + review.rating, 0) / donator.reviews.length;
            const newReviewCount = donator.reviews.length;

            console.log('Calculated new stats:', { newAverageRating, newReviewCount });

            const updatedDonator = await prisma.donator.update({
                where: { id: donatorId },
                data: {
                    averageRating: newAverageRating,
                    reviewCount: newReviewCount
                }
            });

            console.log('Updated donator:', JSON.stringify(updatedDonator, null, 2));

            return review;
        });

        res.status(201).json({ message: 'Review created successfully', review: newReview });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const { id } = req.params; // Get the donator's id from the URL parameters
        const donatorId = parseInt(id, 10);

        if (!donatorId || isNaN(donatorId)) {
            return res.status(400).json({ error: 'Invalid donator ID' });
        }

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
                }
            }
        });

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
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
        console.log('Attempting to update review...');
        const updatedReview = await prisma.review.update({
            where: {
                id: reviewId
            },
            data: {
                rating,
                comment
            }
        });
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

        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.log(`Review updated successfully in ${endTime - startTime}ms:`, updatedReview);
        // res.status(200).json({ message: 'Review updated successfully', updatedReview, timeTaken: endTime - startTime });
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
    console.log(`Received delete request for review ID: ${reviewId}`);
    const startTime = Date.now();

    // Set a timeout to force a response after 10 seconds
    const timeoutId = setTimeout(() => {
        console.log(`Delete operation timed out after 10 seconds for review ID: ${reviewId}`);
        res.status(504).json({ error: 'Delete operation timed out' });
    }, 10000);

    try {
        const result = await prisma.$transaction(async (prisma) => {
            console.log('Attempting to delete review...');
            const review = await prisma.review.findUnique({
                where: { id: reviewId }
            });

            if (!review) {
                throw new Error('Review not found');
            }

            const donatorId = review.donatorId;

            // Delete the review
            await prisma.review.delete({ where: { id: reviewId } });

            // Fetch the updated donator with reviews
            const donator = await prisma.donator.findUnique({
                where: { id: donatorId },
                include: { reviews: true }
            });

            // Calculate new stats
            const newAverageRating = donator.reviews.length > 0
                ? donator.reviews.reduce((sum, review) => sum + review.rating, 0) / donator.reviews.length
                : 0;
            const newReviewCount = donator.reviews.length;

            console.log('Calculated new stats:', { newAverageRating, newReviewCount });

            // Update the donator
            await prisma.donator.update({
                where: { id: donatorId },
                data: { averageRating: newAverageRating, reviewCount: newReviewCount }
            });

            return { donatorId, newAverageRating, newReviewCount };
        });

        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.log(`Review deleted successfully in ${endTime - startTime}ms:`, result);
        res.status(200).json({
            message: 'Review deleted successfully',
            timeTaken: endTime - startTime,
            donatorId: result.donatorId,
            newAverageRating: result.newAverageRating,
            newReviewCount: result.newReviewCount
        });
    } catch (error) {
        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.error(`Error deleting review after ${endTime - startTime}ms:`, error);
        res.status(500).json({ error: 'Failed to delete review', details: error.message, timeTaken: endTime - startTime });
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
import { upload } from '../src/components/upload.jsx'
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