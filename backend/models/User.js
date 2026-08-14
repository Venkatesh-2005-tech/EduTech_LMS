const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false // Stays false until they enter the OTP
    },
    otp: {
        type: String,
        required: false 
    },
    otpExpires: {
        type: Date,
        required: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);