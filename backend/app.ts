// the backend will be here. Models and data will be placed in backend/models/etcetc.js
import express from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const app = express();
app.use(express.json())
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('this is homepage')
})

// what the user object should look like:
interface User {
    name: string,
    password: string,
}

app.post('/signup', (req, res) => {
    const user: User = req.body
})

app.post('/login', (req, res) => {
    const user: User = req.body
    if (user == null) {
        return res.sendStatus(401)
    }
    const accessToken = jwt.sign(user.name, process.env.JWT_SECRET)
    return res.status(200).json({token: accessToken})
})

// Middleware function in expressjs so that routes that want authentication will have to go through this route
function authenticateToken(req, res, next) {
    const header = req.headers['authorization']
    const token = header && header.split(' ')[1]
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