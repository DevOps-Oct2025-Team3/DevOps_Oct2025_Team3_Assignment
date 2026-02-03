const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "UserDB"
    });
    console.log("🟩 UserDB connected");
  } catch (err) {
    console.error("UserDB error:", err);
    process.exit(1);
  }
}


module.exports = connectDB;