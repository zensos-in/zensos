const express = require("express");
const { sendContactEmail } = require("../utils/mailer");

const router = express.Router();

// POST /api/contact — Contact Form Enquiry
router.post("/", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    await sendContactEmail({ name, email, phone, message });
    res.json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Contact Form SMTP Error:", error);
    res.status(500).json({ message: "Failed to send email. Please try again later." });
  }
});

module.exports = router;
