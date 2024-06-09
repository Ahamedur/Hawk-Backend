const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Sequelize, DataTypes } = require('sequelize');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Initialize the database
const sequelize = new Sequelize('user_management', 'root', 'Nuzhat#2013', {
    host: 'localhost',
    dialect: 'mysql'
});

// Define the User model
const User = sequelize.define('User', {
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATE, allowNull: false },
    company_name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true } // New field for email
}, {
    timestamps: true
});

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const jwtSecret = 'your_jwt_secret'; // Replace with your own secret

const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: {
        user: 'pftdemo2024@outlook.com',
        pass: 'Alpha2024'
    }
});

let verificationCodes = {}; // Store verification codes temporarily

app.post('/api/register', [
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('dob').notEmpty(),
    body('company_name').notEmpty(),
    body('username').notEmpty(),
    body('password').notEmpty(),
    body('email').isEmail().notEmpty() // Validate email
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, dob, company_name, username, password, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ first_name, last_name, dob, company_name, username, password: hashedPassword, email });
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const verificationCode = crypto.randomBytes(3).toString('hex');
        verificationCodes[user.id] = verificationCode;
        console.log('Generated verification code:', verificationCode); // Debug log
        console.log('Stored verification code for user ID:', user.id, verificationCodes[user.id]); // Debug log

        const mailOptions = {
            from: 'pftdemo2024@outlook.com',
            to: user.email,
            subject: 'Your verification code',
            text: `Your verification code is ${verificationCode}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            res.status(200).json({ message: 'Verification code sent', userId: user.id, email: user.email });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

app.post('/api/verify', async (req, res) => {
    const { userId, verificationCode } = req.body;
    console.log('Received verification code:', verificationCode); // Debug log
    console.log('Stored verification code:', verificationCodes[userId]); // Debug log

    if (verificationCodes[userId] && verificationCodes[userId] === verificationCode) {
        delete verificationCodes[userId];
        const user = await User.findByPk(userId);
        //const user = await User.findOne({ where: { id: userId } });
        const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });
        //localStorage.setItem('token', token);
        //const token = jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
        return res.status(200).json({ token });
    } else {
        console.log('Invalid verification code');
        return res.status(401).json({ message: 'Invalid verification code' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
