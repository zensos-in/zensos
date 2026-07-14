require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { startExpiryScheduler } = require("./utils/scheduler");

const port = process.env.PORT || 5000;

async function boot() {
  try {
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
