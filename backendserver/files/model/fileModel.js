const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  UserId: {
    type: String,
    required: true,
    // This stores the custom "userId" string (e.g., "2") from your User model, 
    // rather than the MongoDB _id.
  },
  FileName: {
    type: String,
    required: true,
    trim: true
  },
  FilePath: {
    type: String,
    required: true,
    trim: true
  },
  FileSize: {
    type: Number,
    required: true,
    min: 0
  },
  FileType: {
    type: String,
    required: true,
    trim: true
  },
  UploadedAt: {
    type: Date,
    default: Date.now 
  }
});

// Create the 'files' collection
module.exports = mongoose.model("files", fileSchema);