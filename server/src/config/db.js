const dns = require("dns");
const mongoose = require("mongoose");

// Fix for Windows/Node.js querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("[DNS Config] Could not set custom DNS servers:", dnsErr.message);
}

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured in environment variables");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    isConnected = false;
    console.error("[MongoDB connection error]:", error.message);
    throw error;
  }
}

module.exports = connectDB;
