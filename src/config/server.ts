import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db";
import contactRoutes from "../routes/contactRoute";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();
connectDB();

const app = express();

// Allowed origins for CORS
const staticAllowedOrigins = [
  "https://mynerix.com",
  "https://www.mynerix.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080"
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...staticAllowedOrigins, ...envAllowedOrigins]);

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    // Allow any Vercel preview/production subdomain
    if (origin && origin.includes(".vercel.app")) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // For debugging: log rejected origins
    console.log(`CORS rejected origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use("/api/contact", contactRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
