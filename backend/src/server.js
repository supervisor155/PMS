/**
 * server.js
 * Entry point for the PMS backend.
 * Sets up Express, session middleware, CORS, and mounts all API routes.
 */

import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import interestRoutes from "./routes/interestRoutes.js";

dotenv.config();

const app = express();

// Allow frontend (Vite dev server) to access API with cookies
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// Session-based authentication
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/interests", interestRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PMS Server running on port ${PORT}`));
