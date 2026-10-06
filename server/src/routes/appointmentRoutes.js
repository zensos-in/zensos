const express = require("express");
const Appointment = require("../models/Appointment");
const { sendAppointmentNotificationEmail } = require("../utils/mailer");

const router = express.Router();

// POST /api/appointments — Public booking endpoint
router.post("/", async (req, res) => {
  try {
    const { name, phone, email } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return res.status(400).json({ message: "Please provide a valid 10-digit phone number." });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    const safeName = name.trim().slice(0, 100);
    const safePhone = phone.trim().slice(0, 30);
    const safeEmail = email.trim().toLowerCase().slice(0, 254);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(safeEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const appointment = new Appointment({
      name: safeName,
      phone: safePhone,
      email: safeEmail,
    });

    await appointment.save();

    // Send notification email asynchronously
    sendAppointmentNotificationEmail({
      name: safeName,
      phone: safePhone,
      email: safeEmail,
      createdAt: appointment.createdAt,
    }).catch((err) => {
      console.error("[Appointment Route] Email notification failed:", err?.message || err);
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      appointment: {
        id: appointment._id,
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        createdAt: appointment.createdAt,
      },
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    return res.status(500).json({ message: "Unable to book appointment. Please try again later." });
  }
});

module.exports = router;
