const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const storeRoutes = require("./routes/storeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration to allow specific origins
const allowedOrigins = [
  "https://zensos.vercel.app",
  "https://www.zensos.in",
  "http://localhost:5173",
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

// Apply rate limiters
app.use("/api", apiLimiter);
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

app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `ZENSOS <${email}>`,
      to: "naik@shankaraonline.com",
      subject: `Enquiry from ${name} - ZENSOS`,
      text: `Enquiry on Website\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b183f; margin-top: 0; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">Enquiry on Website</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #ff751f; padding: 10px; margin-left: 0; background: #f8fafc; font-style: italic;">
            ${message.replace(/\n/g, "<br>")}
          </blockquote>
        </div>
      `
    });

    res.json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Contact Form SMTP Error:", error);
    res.status(500).json({ message: "Failed to send email. Please try again later." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
