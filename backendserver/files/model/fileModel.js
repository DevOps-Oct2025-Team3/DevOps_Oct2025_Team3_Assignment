const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  UserId: {
    type: String,
    required: true,
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

module.exports = mongoose.model("files", fileSchema);