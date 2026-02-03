const express = require('express');
const sql = require('mssql');
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

const userController = require("./controllers/userController");
const { verifyJWT } = require("./middlewares/userValidation");


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

//routes for authentication
//app.post("/register", userController.registerUser);
app.get("/login", userController.login);
app.get("/logout", (req, res) => {
    // For JWT, logout is handled on client side by deleting the token
    return res.status(200).json({ message: "Logged out successfully" });
});

//routes for admin
app.get("/admin", verifyJWT, userController.getAllUsers);
app.post("/admin/create_user", verifyJWT, userController.registerUser);
app.delete("/admin/delete_user/:id", verifyJWT, userController.deleteUser);


//start server
app.listen(port, () => {
    console.log("Server running on port " + port);
});

//graceful shutdown
process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down");
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
});