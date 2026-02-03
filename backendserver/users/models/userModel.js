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

// Optional: Cascade delete logic (Simulating ON DELETE CASCADE)
// This hook deletes all files associated with a user when the user is deleted
userSchema.pre('findOneAndDelete', async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    await mongoose.model('Files').deleteMany({ user: doc._id });
  }
  next();
});

module.exports = mongoose.model('users', userSchema);