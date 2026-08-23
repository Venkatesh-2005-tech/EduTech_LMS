const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    email: { type: String, required: true },
    courseName: { type: String, required: true, default: 'fullstack' },
    completedLessons: { type: [Number], default: [] },
    isCompleted: { type: Boolean, default: false }
});

// Drop any old single-field email index and allow compound uniqueness per course
UserProgressSchema.index({ email: 1, courseName: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);