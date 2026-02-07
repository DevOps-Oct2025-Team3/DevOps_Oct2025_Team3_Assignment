const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "FileDB"
    });
    console.log("🟩 FileDB connected");
  } catch (err) {
    console.error("FileDB error:", err);
    process.exit(1);
  }
}


module.exports = connectDB;