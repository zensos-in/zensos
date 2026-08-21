const express = require("express");
const Seller = require("../models/Seller");
const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const DeliverySubscription = require("../models/DeliverySubscription");
const auth = require("../middleware/auth");
const checkSubscription = require("../middleware/checkSubscription");
const {
  addPickupLocation,
  checkServiceability,
  createShiprocketOrder,
  getTrackingByAwb,
} = require("../utils/shiprocket");
const { syncOrderStatusFromShipment } = require("../utils/shipmentService");

const router = express.Router();

/**
 * Simple inline address parser — extracts pincode and city from a free-form address string.
 * The server doesn't share the frontend's contactFields utility.
 */
function parseAddressSimple(address = "") {
  const str = String(address).trim();
  const pincodeMatch = str.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : "";

  // Split on commas/newlines and take sensible parts
  const parts = str.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);
  const line1 = parts[0] || str;
  const line2 = parts[1] || "";
  // City is often the second-to-last meaningful segment before pincode
  const city = parts.find((p) => !/\d{6}/.test(p) && p !== line1) || "";
  // State heuristic: last non-pincode, non-city, non-line1 segment
  const state = parts.slice(2).find((p) => !/\d{6}/.test(p)) || "";

  return { line1, line2, city, state, pincode };
}

// Helper: Check if seller satisfies all conditions for shipping
async function isShippingEligible(seller) {
  if (!seller) return false;
  const now = new Date();
  const isMainSubActive = seller.subscriptionStatus === "ACTIVE" && seller.subscriptionEndDate && seller.subscriptionEndDate > now;
  const isAddonActive = seller.deliveryAddonStatus === "ACTIVE" && seller.deliveryAddonExpiresAt && seller.deliveryAddonExpiresAt > now;

  return Boolean(isMainSubActive && isAddonActive);
}

// ─── POST /api/shipping/onboarding/setup ─────────────────────────────────────
router.post("/onboarding/setup", auth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const eligible = await isShippingEligible(seller);
    if (!eligible) {
      return res.status(403).json({
        message: "Delivery Add-on is not active. Please activate the ₹200 Delivery Partner add-on first.",
      });
    }

    const {
      name,
      email,
      phone,
      address,
      address2,
      city,
      state,
      pincode,
    } = req.body || {};

    const addressParts = parseAddressSimple(seller.businessAddress || "");
    const pickupName = `Pickup_${seller.slug}_${seller._id.toString().slice(-4)}`;

    const resLocation = await addPickupLocation({
      locationName: pickupName,
      name: (name || "").trim() || seller.businessName || "Vendor",
      email: (email || "").trim() || seller.businessEmail || "vendor@zensos.in",
      phone: (phone || "").trim() || seller.phone || "9999999999",
      address: (address || "").trim() || addressParts.line1 || seller.businessAddress || "Store Address",
      address2: (address2 || "").trim() || addressParts.line2 || "",
      city: (city || "").trim() || addressParts.city || "Bengaluru",
      state: (state || "").trim() || addressParts.state || "Karnataka",
      pincode: (pincode || "").trim() || addressParts.pincode || "560001",
    });

    if (!resLocation.success) {
      await DeliverySubscription.updateOne(
        { seller: seller._id, status: "ACTIVE" },
        { $set: { onboardingStatus: "FAILED" } }
      );
      return res.status(400).json({
        message: "Failed to configure pickup location in Shiprocket",
        error: resLocation.error,
      });
    }

    seller.shiprocketPickupLocation = pickupName;
    await seller.save();

    await DeliverySubscription.updateOne(
      { seller: seller._id, status: "ACTIVE" },
      { $set: { onboardingStatus: "READY", pickupLocationName: pickupName } }
    );

    return res.json({
      message: "Pickup location configured successfully!",
      pickupLocation: pickupName,
    });
  } catch (error) {
    console.error("[POST /shipping/onboarding/setup error]", error);
    return res.status(500).json({ message: "Unable to configure pickup location" });
  }
});

// ─── PUT /api/shipping/preferences ───────────────────────────────────────────
router.put("/preferences", auth, async (req, res) => {
  try {
    const { courierPreference } = req.body;
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.courierPreference = courierPreference || "BEST_AVAILABLE";
    await seller.save();

    await DeliverySubscription.updateOne(
      { seller: seller._id, status: "ACTIVE" },
      { $set: { preferredCourier: seller.courierPreference } }
    );

    return res.json({
      message: "Courier preference updated",
      courierPreference: seller.courierPreference,
    });
  } catch (error) {
    console.error("[PUT /shipping/preferences error]", error);
    return res.status(500).json({ message: "Unable to update courier preferences" });
  }
});

// ─── GET /api/shipping/serviceability ────────────────────────────────────────
router.get("/serviceability", auth, async (req, res) => {
  try {
    const { deliveryPincode } = req.query;
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const sellerAddress = parseAddressSimple(seller.businessAddress || "");
    const pickupPincode = sellerAddress.pincode || "560001";

    const result = await checkServiceability({
      pickupPincode,
      deliveryPincode: deliveryPincode || "400001",
    });

    return res.json(result);
  } catch (error) {
    console.error("[GET /shipping/serviceability error]", error);
    return res.status(500).json({ message: "Unable to check serviceability" });
  }
});

// ─── POST /api/shipping/shipments/create/:orderId ────────────────────────────
router.post("/shipments/create/:orderId", auth, checkSubscription, async (req, res) => {
  try {
    const subOrder = await Order.findById(req.params.orderId).populate("parentOrder");
    if (!subOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(subOrder.seller) !== String(req.sellerId)) {
      return res.status(403).json({ message: "Not authorized to ship this order" });
    }

    const seller = await Seller.findById(req.sellerId);
    const eligible = await isShippingEligible(seller);
    if (!eligible) {
      return res.status(403).json({
        message: "Delivery Add-on is not active. Activate the ₹200 Delivery Partner add-on to ship orders.",
      });
    }

    // Check if shipment already exists
    let shipment = await Shipment.findOne({ order: subOrder._id });
    if (shipment && shipment.status !== "CANCELLED") {
      return res.json({ message: "Shipment already created", shipment });
    }

    const parentOrder = subOrder.parentOrder;
    const shippingAddr = parseAddressSimple(parentOrder?.shippingAddress || "");
    const sellerAddr = parseAddressSimple(seller?.businessAddress || "");

    const pickupLocation = seller.shiprocketPickupLocation || `Pickup_${seller.slug}`;

    const items = subOrder.items && subOrder.items.length > 0 ? subOrder.items : [
      {
        productTitle: subOrder.productTitle || "Item",
        quantity: subOrder.quantity || 1,
        unitPrice: subOrder.amount || 0,
      }
    ];

    // Create in Shiprocket
    const srResult = await createShiprocketOrder({
      orderId: subOrder._id,
      orderDate: subOrder.createdAt,
      pickupLocation,
      billingName: parentOrder?.customerName || "Customer",
      billingAddress: shippingAddr.line1 || parentOrder?.shippingAddress || "Delivery Address",
      billingCity: shippingAddr.city || "City",
      billingState: shippingAddr.state || "State",
      billingPincode: shippingAddr.pincode || "110001",
      billingPhone: parentOrder?.customerPhone || "9999999999",
      billingEmail: parentOrder?.customerEmail || "customer@zensos.in",
      orderItems: items,
      paymentMethod: subOrder.paymentMethod === "cod" ? "COD" : "Prepaid",
      subTotal: subOrder.amount,
    });

    if (!srResult.success) {
      return res.status(400).json({
        message: "Could not create shipment in Shiprocket",
        error: srResult.error,
      });
    }

    shipment = await Shipment.create({
      order: subOrder._id,
      parentOrder: parentOrder._id,
      seller: seller._id,
      provider: "SHIPROCKET",
      shiprocketOrderId: srResult.shiprocketOrderId,
      shiprocketShipmentId: srResult.shiprocketShipmentId,
      awbCode: srResult.awbCode,
      courierName: srResult.courierName || "Standard Shipping",
      courierCompanyId: srResult.courierCompanyId,
      pickupLocation,
      status: "CREATED",
      statusLabel: srResult.statusLabel || "Shipment Created",
      trackingUrl: srResult.trackingUrl,
      trackingEvents: [
        {
          status: "CREATED",
          activity: "Shipment Created via Shiprocket",
          location: sellerAddr.city || "Vendor Warehouse",
          timestamp: new Date(),
        },
      ],
    });

    return res.json({ message: "Shipment created successfully", shipment });
  } catch (error) {
    console.error("[POST /shipping/shipments/create error]", error);
    return res.status(500).json({ message: "Unable to create shipment" });
  }
});

// ─── GET /api/shipping/shipments ──────────────────────────────────────────────
router.get("/shipments", auth, async (req, res) => {
  try {
    const shipments = await Shipment.find({ seller: req.sellerId })
      .populate({ path: "order", select: "orderNumber amount items paymentStatus createdAt" })
      .sort({ createdAt: -1 });

    return res.json({ shipments });
  } catch (error) {
    console.error("[GET /shipping/shipments error]", error);
    return res.status(500).json({ message: "Unable to fetch shipments" });
  }
});

// ─── GET /api/shipping/track/:orderId ─────────────────────────────────────────
router.get("/track/:orderId", async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ order: req.params.orderId });
    if (!shipment) {
      return res.status(404).json({ message: "No shipment record found for this order" });
    }

    if (shipment.awbCode) {
      // Sync latest tracking if available
      const liveTracking = await getTrackingByAwb(shipment.awbCode);
      if (liveTracking.success) {
        if (liveTracking.events && liveTracking.events.length > 0) {
          shipment.trackingEvents = liveTracking.events;
        }
        if (liveTracking.statusLabel) {
          shipment.statusLabel = liveTracking.statusLabel;
        }
        if (liveTracking.currentStatus) {
          const statusUpper = String(liveTracking.currentStatus).toUpperCase();
          if (statusUpper.includes("DELIVERED")) shipment.status = "DELIVERED";
          else if (statusUpper.includes("OUT FOR DELIVERY")) shipment.status = "OUT_FOR_DELIVERY";
          else if (statusUpper.includes("IN TRANSIT")) shipment.status = "IN_TRANSIT";
          else if (statusUpper.includes("PICKED")) shipment.status = "PICKED_UP";
          else if (statusUpper.includes("RTO")) shipment.status = "RTO";
          else if (statusUpper.includes("CANCEL")) shipment.status = "CANCELLED";
        }
        await shipment.save();
        await syncOrderStatusFromShipment(shipment);
      }
    }

    return res.json({ shipment });
  } catch (error) {
    console.error("[GET /shipping/track error]", error);
    return res.status(500).json({ message: "Unable to fetch tracking data" });
  }
});

// ─── POST /api/shipping/webhook ──────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const { awb, current_status, scans } = req.body;
    if (!awb) {
      return res.status(200).json({ status: "ignored_no_awb" });
    }

    const shipment = await Shipment.findOne({ awbCode: awb });
    if (!shipment) {
      return res.status(200).json({ status: "shipment_not_found" });
    }

    if (current_status) {
      shipment.statusLabel = current_status;
      const statusUpper = String(current_status).toUpperCase();
      if (statusUpper.includes("DELIVERED")) shipment.status = "DELIVERED";
      else if (statusUpper.includes("OUT FOR DELIVERY")) shipment.status = "OUT_FOR_DELIVERY";
      else if (statusUpper.includes("IN TRANSIT")) shipment.status = "IN_TRANSIT";
      else if (statusUpper.includes("PICKED")) shipment.status = "PICKED_UP";
      else if (statusUpper.includes("RTO")) shipment.status = "RTO";
      else if (statusUpper.includes("CANCEL")) shipment.status = "CANCELLED";
    }

    if (Array.isArray(scans)) {
      shipment.trackingEvents = scans.map((s) => ({
        status: s["sr-status"] || "UPDATE",
        activity: s.activity || s.location || "Status Update",
        location: s.location || "",
        timestamp: s.date ? new Date(s.date) : new Date(),
      }));
    }

    await shipment.save();
    await syncOrderStatusFromShipment(shipment);

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[Shiprocket Webhook Error]", error);
    return res.status(500).json({ message: "Webhook error" });
  }
});

module.exports = router;
