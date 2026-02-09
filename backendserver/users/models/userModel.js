const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  passwordHash: {
    type: String,
    required: true,
    maxlength: 255
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'User'], // Corresponds to CHECK (Role IN...)
    default: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now // Corresponds to DEFAULT GETDATE()
  }
});

module.exports = mongoose.model('users', userSchema);