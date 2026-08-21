const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const storeRoutes = require("./routes/storeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const contactRoutes = require("./routes/contactRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const deliveryAddonRoutes = require("./routes/deliveryAddonRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration to allow specific origins
const allowedOrigins = [
  "https://zensos.vercel.app",
  "https://www.zensos.in",
  "http://localhost:5173",
  "https://localhost:5000"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
                      origin.startsWith("https://zensos.vercel.app") || origin.startsWith("https://www.zensos.in") ||
                      origin.startsWith("http://localhost:") ||
                      /^http:\/\/(192\.168|10|172)\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per 15 minutes for auth/OTP endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/OTP attempts, please try again after 15 minutes." },
});

const connectDB = require("./config/db");

// Apply rate limiters and DB connection guard to /api routes
app.use("/api", apiLimiter, async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("[DB Middleware Error]:", error.message);
    return res.status(500).json({
      message: `Database connection error: ${error.message || "Failed to connect to MongoDB. Please check MongoDB Atlas network access / MONGO_URI."}`
    });
  }
});
app.use("/api/auth", authLimiter);

// Store raw body in req.rawBody to support cryptographically verified webhooks
app.use(express.json({ 
  limit: "2mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", paymentRoutes); // Same handler: POST /api/webhooks/webhook
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/delivery-addon", deliveryAddonRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/contact", contactRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
