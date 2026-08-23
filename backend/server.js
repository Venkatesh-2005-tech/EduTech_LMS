const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const UserProgress = require('./models/UserProgress'); // Ensure this model exists

const app = express();

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const db_connection = process.env.MONGO_URI || 'mongodb://localhost:27017/edutech';

mongoose.connect(db_connection)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((error) => console.error('❌ Database connection error:', error));

// --- FORGOT PASSWORD ROUTES ---
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

app.post('/api/update-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: "Password successfully updated!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error updating password" });
    }
});

// --- REGISTRATION ROUTES ---
app.post('/api/check-email', async (req, res) => {
    try {
        const { email } = req.body;
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

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }
        
        const newUser = new User({
            name: name,
            email: email,
            password: password, 
            isVerified: true 
        });

        await newUser.save();
        console.log(`✅ Success! New user saved to MongoDB: ${email}`);
        res.status(201).json({ message: "User successfully registered in Database!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error during registration" });
    }
});

// --- LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "User not found! Please register first." });
        }

        if (user.password !== password) {
            return res.status(400).json({ message: "Incorrect password!" });
        }

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

// --- COURSE-SPECIFIC PROGRESS TRACKING ROUTES ---

// 1A. Get user progress with courseName specified
app.get('/api/progress/:email/:courseName', async (req, res) => {
    try {
        const { email, courseName } = req.params;
        let progress = await UserProgress.findOne({ email, courseName });
        
        if (!progress) {
            progress = await UserProgress.create({ email, courseName, completedLessons: [] });
        }
        
        res.status(200).json(progress);
    } catch (error) {
        console.error("Error fetching progress:", error.message);
        res.status(500).json({ message: "Server error fetching progress" });
    }
});

// 1B. Fallback Get user progress without courseName (defaults to fullstack)
app.get('/api/progress/:email', async (req, res) => {
    try {
        const { email } = req.params;
        let progress = await UserProgress.findOne({ email, courseName: 'fullstack' });
        
        if (!progress) {
            progress = await UserProgress.create({ email, courseName: 'fullstack', completedLessons: [] });
        }
        
        res.status(200).json(progress);
    } catch (error) {
        console.error("Error fetching progress:", error.message);
        res.status(500).json({ message: "Server error fetching progress" });
    }
});

// 2. Save completed lesson index for a specific course safely
app.post('/api/progress', async (req, res) => {
    try {
        const { email, courseName, lessonIndex, totalCount } = req.body;
        const queryCourse = courseName || 'fullstack';
        const trackTotal = totalCount || (queryCourse === 'ai' ? 7 : (queryCourse === 'blockchain' ? 6 : 6));

        let progress = await UserProgress.findOne({ email, courseName: queryCourse });

        if (!progress) {
            progress = new UserProgress({ email, courseName: queryCourse, completedLessons: [lessonIndex] });
        } else {
            if (!progress.completedLessons) {
                progress.completedLessons = [];
            }
            if (!progress.completedLessons.includes(lessonIndex)) {
                progress.completedLessons.push(lessonIndex);
            }
        }

        if (progress.completedLessons.length >= trackTotal) {
            progress.isCompleted = true;
        }

        await progress.save();
        res.status(200).json({ message: "Progress updated successfully!", progress });
    } catch (error) {
        console.error("Error saving progress:", error.message);
        res.status(500).json({ message: "Server error saving progress" });
    }
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
mongoose.connect(db_connection)
    .then(async () => {
        console.log('✅ Connected to MongoDB successfully!');
        // Automatically drop the old conflicting email index if it exists
        try {
            await mongoose.connection.collection('userprogresses').dropIndex('email_1');
            console.log('🗑️ Dropped old conflicting email_1 index successfully.');
        } catch (e) {
            // Index might already be dropped, safe to ignore
        }
    })
    .catch((error) => console.error('❌ Database connection error:', error));