// the backend will be here. Models and data will be placed in backend/models/etcetc.js
import express from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import cors from "cors"
const prisma = new PrismaClient() // -> database
dotenv.config()

const app = express();
app.use(express.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
// const corsOptions =
// app.use(cors(corsOptions))

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
    // if (req.body.user == null) {return res.status(400).json({error:})}
    const user: User = req.body
    // check if user exists
    const exists = await prisma.person.findUnique({
        where: {
            email: user.email
        }
    })
    if (exists) {
        return res.status(409).json({error: "User already exists"})
    }
    try {
        const person = await prisma.person.create({
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
        res.status(200).json({ success: true });
    } catch (e) {
        console.log(e)
        return res.sendStatus(501)
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
    const token = jwt.sign(
        { id: person.id },
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
        .json({ success: true });
})

app.post('/logout', async (req, res) => {
    return res.status(200).json({ success: true })
              .setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
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
