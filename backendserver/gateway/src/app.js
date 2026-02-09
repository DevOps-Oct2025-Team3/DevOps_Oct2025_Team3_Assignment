import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes.js";

dotenv.config();
const app = express();

app.use(cors());
//app.use(express.json());

// Load Proxy Routes
routes(app);

// Expose a simple health route and log the proxy targets on startup for debugging
app.get("/health", (req, res) => {
  res.json({ status: "ok", FILES_SERVICE_URL: process.env.FILES_SERVICE_URL || process.env.FILE_SERVICE, USERS_SERVICE_URL: process.env.USERS_SERVICE_URL || process.env.USER_SERVICE });
});

app.get("*", (req, res) => {
  res.status(404).json({ error: "API route not found, I know hard right?" });
});



console.log("API Gateway targets:", {
  FILES: process.env.FILES_SERVICE_URL || process.env.FILE_SERVICE,
USERS: process.env.USERS_SERVICE_URL || process.env.USER_SERVICE,
FRONTEND: "http://localhost:80"
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟧 API Gateway running on port ${PORT}`);
}
);
