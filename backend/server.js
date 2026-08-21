const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // This loads our secret .env file!

const User = require('./models/User'); // We import the blueprint we made earlier

const app = express();

// Middleware: These act like translators for our server
app.use(cors()); // Allows our HTML frontend to talk to this backend
app.use(express.json()); // Tells the server to understand JSON data from forms

// --- DATABASE CONNECTION ---
// We add a fallback (the || operator) just in case the .env file fails to load
const db_connection = process.env.MONGO_URI || 'mongodb://localhost:27017/edutech';

mongoose.connect(db_connection)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((error) => console.error('❌ Database connection error:', error));
// --- FORGOT PASSWORD ROUTES ---

// 1. Check if user exists (before sending reset OTP)
app.post('/api/find-user', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.status(404).json({ message: "No account found with this email." });
        }
        
        res.status(200).json({ message: "User found! Ready for OTP." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error finding user" });
    }
});

// 2. Save the new password
app.post('/api/update-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        // Find the user and update their password
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        user.password = newPassword;
        await user.save(); // Save the updated password to MongoDB

        res.status(200).json({ message: "Password successfully updated!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error updating password" });
    }
});
// --- THE REGISTRATION ROUTE ---
// Route to check if an email already exists
app.post('/api/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Assuming your MongoDB model is named 'User'
        const existingUser = await User.findOne({ email: email });
        
        if (existingUser) {
            return res.status(400).json({ message: "This email is already registered. Please login." });
        }
        
        res.status(200).json({ message: "Email is available" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error checking email" });
    }
});
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if the user already exists in the database
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }
        
        // 2. Create the new user. 
        // Notice we are setting isVerified to TRUE immediately, because EmailJS already proved they are real!
        const newUser = new User({
            name: name,
            email: email,
            password: password, 
            isVerified: true 
        });

        // 3. Save them to MongoDB
        await newUser.save();

        console.log(`✅ Success! New user saved to MongoDB: ${email}`);
        res.status(201).json({ message: "User successfully registered in Database!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error during registration" });
    }
});

// --- THE LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by email in MongoDB
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "User not found! Please register first." });
        }

        // 2. Check if the password matches
        if (user.password !== password) {
            return res.status(400).json({ message: "Incorrect password!" });
        }

        // 3. Success! Send back a welcome message and user name
        res.status(200).json({ 
            message: "Login successful!", 
            name: user.name,
            email: user.email 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error during login" });
    }
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});