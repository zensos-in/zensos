require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { startExpiryScheduler } = require("./utils/scheduler");

const port = process.env.PORT || 5000;

function checkProductionEnv() {
  if (process.env.NODE_ENV === "production") {
    const missing = [];
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev_secret") {
      missing.push("JWT_SECRET (currently using insecure dev default)");
    }
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "admin123") {
      missing.push("ADMIN_PASSWORD (currently using default 'admin123')");
    }
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_mock_id") {
      missing.push("RAZORPAY_KEY_ID");
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      missing.push("RAZORPAY_KEY_SECRET");
    }
    if (missing.length > 0) {
      console.warn("\n⚠️  [SECURITY WARNING] Running in production with missing or default environment variables:");
      missing.forEach((item) => console.warn(`   - ${item}`));
      console.warn("Please populate these variables in your deployment environment.\n");
    }
  }
}

async function boot() {
  try {
    checkProductionEnv();
    await connectDB();
    startExpiryScheduler();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error.message);
    process.exit(1);
  }
}

boot();
