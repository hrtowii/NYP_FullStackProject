const express = require('express');
const app = express.Router();
const { validateToken } = require('./auth');
const { upload } = require('./upload');
app.post('/upload', validateToken, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json(err);
        }
        else if (req.body.file == undefined) {
            res.status(400).json({ message: "No file uploaded" });
        }
        else {
            res.json({ filename: req.body.file.filename });
        }
    })
});
