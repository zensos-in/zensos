const express = require("express");
const Seller = require("../models/Seller");
const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const DeliverySubscription = require("../models/DeliverySubscription");
const WebhookLog = require("../models/WebhookLog");
const auth = require("../middleware/auth");
const checkSubscription = require("../middleware/checkSubscription");
const {
  addPickupLocation,
  checkServiceability,
  createShiprocketOrder,
  assignAwb,
  generatePickup,
  generateLabel,
  generateManifest,
  cancelShiprocketOrder,
  getTrackingByAwb,
} = require("../utils/shiprocket");
const { syncOrderStatusFromShipment } = require("../utils/shipmentService");
const { trySendShippingNotificationForShipment } = require("../utils/orderConfirmation");

const router = express.Router();

const VALID_INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Ladakh", "Lakshadweep", "Puducherry"
];

const PINCODE_STATE_MAP = {
  "11": { state: "Delhi", city: "New Delhi" },
  "12": { state: "Haryana", city: "Gurgaon" },
  "13": { state: "Haryana", city: "Ambala" },
  "14": { state: "Punjab", city: "Ludhiana" },
  "15": { state: "Punjab", city: "Bathinda" },
  "16": { state: "Chandigarh", city: "Chandigarh" },
  "17": { state: "Himachal Pradesh", city: "Shimla" },
  "18": { state: "Jammu and Kashmir", city: "Jammu" },
  "19": { state: "Jammu and Kashmir", city: "Srinagar" },
  "20": { state: "Uttar Pradesh", city: "Aligarh" },
  "21": { state: "Uttar Pradesh", city: "Allahabad" },
  "22": { state: "Uttar Pradesh", city: "Lucknow" },
  "23": { state: "Uttar Pradesh", city: "Varanasi" },
  "24": { state: "Uttarakhand", city: "Dehradun" },
  "25": { state: "Uttar Pradesh", city: "Meerut" },
  "26": { state: "Uttarakhand", city: "Bareilly" },
  "27": { state: "Uttar Pradesh", city: "Gorakhpur" },
  "28": { state: "Uttar Pradesh", city: "Agra" },
  "30": { state: "Rajasthan", city: "Jaipur" },
  "31": { state: "Rajasthan", city: "Udaipur" },
  "32": { state: "Rajasthan", city: "Kota" },
  "33": { state: "Rajasthan", city: "Bikaner" },
  "34": { state: "Rajasthan", city: "Jodhpur" },
  "36": { state: "Gujarat", city: "Rajkot" },
  "37": { state: "Gujarat", city: "Jamnagar" },
  "38": { state: "Gujarat", city: "Ahmedabad" },
  "39": { state: "Gujarat", city: "Surat" },
  "40": { state: "Maharashtra", city: "Mumbai" },
  "41": { state: "Maharashtra", city: "Pune" },
  "42": { state: "Maharashtra", city: "Nashik" },
  "43": { state: "Maharashtra", city: "Aurangabad" },
  "44": { state: "Maharashtra", city: "Nagpur" },
  "45": { state: "Madhya Pradesh", city: "Indore" },
  "46": { state: "Madhya Pradesh", city: "Bhopal" },
  "47": { state: "Madhya Pradesh", city: "Gwalior" },
  "48": { state: "Madhya Pradesh", city: "Jabalpur" },
  "49": { state: "Chhattisgarh", city: "Raipur" },
  "50": { state: "Telangana", city: "Hyderabad" },
  "51": { state: "Andhra Pradesh", city: "Tirupati" },
  "52": { state: "Andhra Pradesh", city: "Vijayawada" },
  "53": { state: "Andhra Pradesh", city: "Visakhapatnam" },
  "56": { state: "Karnataka", city: "Bengaluru" },
  "57": { state: "Karnataka", city: "Mangaluru" },
  "58": { state: "Karnataka", city: "Hubli" },
  "59": { state: "Karnataka", city: "Belgaum" },
  "60": { state: "Tamil Nadu", city: "Chennai" },
  "61": { state: "Tamil Nadu", city: "Thanjavur" },
  "62": { state: "Tamil Nadu", city: "Madurai" },
  "63": { state: "Tamil Nadu", city: "Salem" },
  "64": { state: "Tamil Nadu", city: "Coimbatore" },
  "67": { state: "Kerala", city: "Kozhikode" },
  "68": { state: "Kerala", city: "Kochi" },
  "69": { state: "Kerala", city: "Thiruvananthapuram" },
  "70": { state: "West Bengal", city: "Kolkata" },
  "71": { state: "West Bengal", city: "Howrah" },
  "72": { state: "West Bengal", city: "Midnapore" },
  "73": { state: "West Bengal", city: "Siliguri" },
  "74": { state: "West Bengal", city: "Bardhaman" },
  "75": { state: "Odisha", city: "Bhubaneswar" },
  "76": { state: "Odisha", city: "Cuttack" },
  "77": { state: "Odisha", city: "Rourkela" },
  "78": { state: "Assam", city: "Guwahati" },
  "79": { state: "Meghalaya", city: "Shillong" },
  "80": { state: "Bihar", city: "Patna" },
  "81": { state: "Bihar", city: "Bhagalpur" },
  "82": { state: "Bihar", city: "Gaya" },
  "83": { state: "Jharkhand", city: "Ranchi" },
  "84": { state: "Bihar", city: "Muzaffarpur" },
  "85": { state: "Bihar", city: "Purnia" },
};

/**
 * Robust address parser — extracts pincode, valid state, city, and compliant line1 for Shiprocket.
 */
function parseAddressSimple(address = "") {
  const str = String(address || "").trim();
  const pincodeMatch = str.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : "";
  const prefix = pincode ? pincode.slice(0, 2) : "";
  const fallback = PINCODE_STATE_MAP[prefix] || { state: "Karnataka", city: "Bengaluru" };

  const parts = str.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);

  let detectedState = "";
  for (const part of parts) {
    const matched = VALID_INDIAN_STATES.find((s) => s.toLowerCase() === part.toLowerCase());
    if (matched) {
      detectedState = matched;
      break;
    }
  }

  const state = detectedState || fallback.state;

  let detectedCity = "";
  const nonStateParts = parts.filter(
    (p) => !/\d{6}/.test(p) && p.toLowerCase() !== state.toLowerCase()
  );
  if (nonStateParts.length >= 2) {
    detectedCity = nonStateParts[nonStateParts.length - 1];
  } else if (nonStateParts.length === 1) {
    detectedCity = nonStateParts[0];
  }

  const city = detectedCity || fallback.city;

  let line1 = str.replace(/\b\d{6}\b/, "").replace(/,\s*,/g, ",").trim().replace(/^,|,$/g, "").trim();
  if (line1.length < 10) {
    line1 = `${str}, ${city}, ${state}`.trim();
  }
  if (line1.length < 10) {
    line1 = `${line1}, Main Road, ${city}`;
  }

  return {
    line1: line1.slice(0, 190),
    line2: "",
    city: city.slice(0, 50),
    state: state.slice(0, 50),
    pincode: pincode || "560001",
  };
}

// Helper: Check if seller satisfies all conditions for shipping
async function isShippingEligible(seller) {
  if (!seller) return false;

  const now = new Date();
  const isMainSubActive = seller.subscriptionStatus === "ACTIVE" && seller.subscriptionEndDate && new Date(seller.subscriptionEndDate) > now;
  const isAddonActive = seller.deliveryAddonStatus === "ACTIVE" && seller.deliveryAddonExpiresAt && new Date(seller.deliveryAddonExpiresAt) > now;

  return Boolean(isMainSubActive && isAddonActive);
}

// ─── PUT /api/shipping/provider ──────────────────────────────────────────────
// Allows seller to switch preferred logistics provider (SHIPROCKET, NIMBUSPOST, VELOCITY, CLICKPOST, SELF_MANUAL)
router.put("/provider", auth, async (req, res) => {
  try {
    const { provider, email, password, apiKey, username, clickpostApiKey, clickpostUsername } = req.body || {};
    const validProviders = ["SHIPROCKET", "NIMBUSPOST", "VELOCITY", "CLICKPOST", "SELF_MANUAL"];

    if (!validProviders.includes(provider)) {
      return res.status(400).json({ message: "Invalid logistics provider selected" });
    }

    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.preferredLogisticsProvider = provider;

    // Save provider specific credentials if provided
    if (provider === "SHIPROCKET" && email && password) {
      seller.shiprocketEmail = String(email).trim();
      seller.shiprocketPassword = String(password);
      seller.shiprocketAccountStatus = "CONNECTED";
    } else if (provider === "NIMBUSPOST" && email && password) {
      seller.nimbuspostEmail = String(email).trim();
      seller.nimbuspostPassword = String(password);
      seller.nimbuspostAccountStatus = "CONNECTED";
    } else if (provider === "VELOCITY" && email && password) {
      seller.velocityEmail = String(email).trim();
      seller.velocityPassword = String(password);
      seller.velocityAccountStatus = "CONNECTED";
    } else if (provider === "CLICKPOST") {
      const finalKey = (apiKey || clickpostApiKey || "").trim();
      const finalUser = (username || clickpostUsername || "").trim();
      if (finalKey) seller.clickpostApiKey = finalKey;
      if (finalUser) seller.clickpostUsername = finalUser;
      if (finalKey && finalUser) {
        seller.clickpostAccountStatus = "CONNECTED";
      }
    }

    await seller.save();

    return res.json({
      message: `Logistics provider updated to ${provider}. All freight charges are processed directly via your provider account.`,
      preferredLogisticsProvider: seller.preferredLogisticsProvider,
    });
  } catch (error) {
    console.error("[PUT /shipping/provider error]", error);
    return res.status(500).json({ message: "Unable to update logistics provider" });
  }
});

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
      const detailedMessage = resLocation.error
        ? `Shiprocket error: ${resLocation.error}`
        : "Failed to configure pickup location in Shiprocket";
      return res.status(400).json({
        message: detailedMessage,
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
    const rawShippingAddress =
      subOrder.shippingAddress ||
      subOrder.deliveryAddress ||
      subOrder.billingAddress ||
      parentOrder?.shippingAddress ||
      parentOrder?.deliveryAddress ||
      parentOrder?.billingAddress ||
      "";

    const shippingAddr = parseAddressSimple(rawShippingAddress);
    const sellerAddr = parseAddressSimple(seller?.businessAddress || "");

    const customerName =
      (subOrder.shippingCustomerName || subOrder.customerName || parentOrder?.customerName || "Customer").trim();
    const rawPhone =
      subOrder.shippingCustomerPhone || subOrder.customerPhone || parentOrder?.customerPhone || "";
    const cleanPhone = String(rawPhone).replace(/\D/g, "").slice(-10);
    const customerPhone = cleanPhone.length === 10 ? cleanPhone : "9876543210";
    const customerEmail =
      (subOrder.customerEmail || parentOrder?.customerEmail || "customer@zensos.in").trim();

    const pickupLocation = seller.shiprocketPickupLocation || `Pickup_${seller.slug || seller._id.toString().slice(-6)}`;

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
      billingName: customerName,
      billingAddress: shippingAddr.line1,
      billingCity: shippingAddr.city,
      billingState: shippingAddr.state,
      billingPincode: shippingAddr.pincode,
      billingPhone: customerPhone,
      billingEmail: customerEmail,
      orderItems: items,
      paymentMethod: subOrder.paymentMethod === "cod" ? "COD" : "Prepaid",
      subTotal: subOrder.amount,
      seller,
    });

    if (!srResult.success) {
      return res.status(400).json({
        message: "Could not create shipment in Shiprocket",
        error: srResult.error,
      });
    }

    shipment = await Shipment.create({
      order: subOrder._id,
      parentOrder: parentOrder?._id || subOrder.parentOrder || null,
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

    if (shipment.awbCode || shipment.trackingUrl) {
      await trySendShippingNotificationForShipment(shipment._id);
    }

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

// ─── POST /api/shipping/shipments/:shipmentId/assign-awb ─────────────────────
router.post("/shipments/:shipmentId/assign-awb", auth, async (req, res) => {
  try {
    const { courierId } = req.body;
    const shipment = await Shipment.findById(req.params.shipmentId);

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (String(shipment.seller) !== String(req.sellerId)) {
      return res.status(403).json({ message: "Not authorized to manage this shipment" });
    }

    if (!shipment.shiprocketShipmentId) {
      return res.status(400).json({ message: "No Shiprocket shipment ID associated with this shipment" });
    }

    const seller = await Seller.findById(req.sellerId);
    const result = await assignAwb({
      shipmentId: shipment.shiprocketShipmentId,
      courierId: courierId ? Number(courierId) : undefined,
      seller,
    });

    if (!result.success) {
      return res.status(400).json({ message: result.error || "Failed to assign AWB", error: result.error });
    }

    shipment.awbCode = result.awbCode || shipment.awbCode;
    if (result.courierName) shipment.courierName = result.courierName;
    if (result.courierCompanyId) shipment.courierCompanyId = result.courierCompanyId;
    shipment.statusLabel = "AWB Assigned";
    shipment.trackingUrl = result.awbCode ? `https://shiprocket.co/tracking/${result.awbCode}` : shipment.trackingUrl;
    await shipment.save();

    if (shipment.awbCode || shipment.trackingUrl) {
      await trySendShippingNotificationForShipment(shipment._id);
    }

    return res.json({ message: "AWB assigned successfully", shipment });
  } catch (error) {
    console.error("[POST /shipping/shipments/assign-awb error]", error);
    return res.status(500).json({ message: "Unable to assign AWB" });
  }
});

// ─── POST /api/shipping/shipments/:shipmentId/schedule-pickup ────────────────
router.post("/shipments/:shipmentId/schedule-pickup", auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (String(shipment.seller) !== String(req.sellerId)) {
      return res.status(403).json({ message: "Not authorized to manage this shipment" });
    }

    if (!shipment.shiprocketShipmentId) {
      return res.status(400).json({ message: "No Shiprocket shipment ID associated" });
    }

    const result = await generatePickup({ shipmentId: shipment.shiprocketShipmentId });
    if (!result.success) {
      return res.status(400).json({ message: "Failed to schedule pickup", error: result.error });
    }

    shipment.status = "PICKUP_SCHEDULED";
    shipment.statusLabel = "Pickup Scheduled";
    await shipment.save();

    return res.json({ message: "Pickup scheduled successfully", shipment });
  } catch (error) {
    console.error("[POST /shipping/shipments/schedule-pickup error]", error);
    return res.status(500).json({ message: "Unable to schedule pickup" });
  }
});

// ─── GET /api/shipping/shipments/:shipmentId/label ───────────────────────────
router.get("/shipments/:shipmentId/label", auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (String(shipment.seller) !== String(req.sellerId)) {
      return res.status(403).json({ message: "Not authorized to access this label" });
    }

    if (!shipment.shiprocketShipmentId) {
      return res.status(400).json({ message: "No Shiprocket shipment ID associated" });
    }

    const result = await generateLabel({ shipmentId: shipment.shiprocketShipmentId });
    if (!result.success) {
      return res.status(400).json({ message: "Failed to generate label", error: result.error });
    }

    shipment.labelUrl = result.labelUrl || shipment.labelUrl;
    await shipment.save();

    return res.json({ labelUrl: result.labelUrl });
  } catch (error) {
    console.error("[GET /shipping/shipments/label error]", error);
    return res.status(500).json({ message: "Unable to fetch label" });
  }
});

// ─── GET /api/shipping/shipments/:shipmentId/manifest ────────────────────────
router.get("/shipments/:shipmentId/manifest", auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (String(shipment.seller) !== String(req.sellerId)) {
      return res.status(403).json({ message: "Not authorized to access this manifest" });
    }

    if (!shipment.shiprocketShipmentId) {
      return res.status(400).json({ message: "No Shiprocket shipment ID associated" });
    }

    const result = await generateManifest({ shipmentId: shipment.shiprocketShipmentId });
    if (!result.success) {
      return res.status(400).json({ message: "Failed to generate manifest", error: result.error });
    }

    shipment.manifestUrl = result.manifestUrl || shipment.manifestUrl;
    await shipment.save();

    return res.json({ manifestUrl: result.manifestUrl });
  } catch (error) {
    console.error("[GET /shipping/shipments/manifest error]", error);
    return res.status(500).json({ message: "Unable to fetch manifest" });
  }
});

// ─── POST /api/shipping/shipments/:shipmentId/cancel ─────────────────────────
router.post("/shipments/:shipmentId/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body || {};
    const shipment = await Shipment.findById(req.params.shipmentId);

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (String(shipment.seller) !== String(req.sellerId)) {
      return res.status(403).json({ message: "Not authorized to cancel this shipment" });
    }

    const seller = await Seller.findById(req.sellerId);
    if (shipment.shiprocketOrderId) {
      await cancelShiprocketOrder({ orderIds: [shipment.shiprocketOrderId], seller });
    }

    const cancelReasonText = String(reason || "Cancelled by seller").trim();
    shipment.status = "CANCELLED";
    shipment.statusLabel = "Shipment Cancelled";
    shipment.cancellationReason = cancelReasonText;
    shipment.trackingEvents.push({
      status: "CANCELLED",
      activity: `Shipment cancelled by seller: ${cancelReasonText}`,
      location: "Store",
      timestamp: new Date(),
    });
    await shipment.save();

    return res.json({ message: "Shipment cancelled successfully", shipment });
  } catch (error) {
    console.error("[POST /shipping/shipments/cancel error]", error);
    return res.status(500).json({ message: "Unable to cancel shipment" });
  }
});

// ─── POST /api/shipping/webhook ──────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (secret) {
      const authHeader = req.headers["x-api-key"] || req.headers["authorization"] || "";
      const cleanToken = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (cleanToken && cleanToken !== secret) {
        return res.status(401).json({ message: "Invalid webhook token" });
      }
    }

    const body = req.body || {};
    const awb = body.awb || body.awb_code || body.shipment_track?.awb_code;
    const currentStatus = body.current_status || body.current_status_name || body.shipment_status;
    const scans = body.scans || body.shipment_track_activities || body.scans_data || [];

    const eventId = `sr_wh_${awb || "no_awb"}_${currentStatus || "status"}_${Date.now()}`;

    // Log webhook payload to database
    let webhookLog;
    try {
      webhookLog = await WebhookLog.create({
        eventId,
        eventType: `SHIPROCKET_${String(currentStatus || "EVENT").toUpperCase().replace(/\s+/g, "_")}`,
        payload: body,
      });
    } catch (logErr) {
      console.warn("[Shiprocket Webhook Log Warning]", logErr.message);
    }

    const srOrderId = Number(body.order_id || body.shipment_track?.order_id) || null;
    const srShipmentId = Number(body.shipment_id || body.shipment_track?.shipment_id) || null;

    const lookupQueries = [];
    if (awb) lookupQueries.push({ awbCode: awb });
    if (srOrderId) lookupQueries.push({ shiprocketOrderId: srOrderId });
    if (srShipmentId) lookupQueries.push({ shiprocketShipmentId: srShipmentId });

    if (lookupQueries.length === 0) {
      return res.status(200).json({ status: "ignored_no_identifier" });
    }

    const shipment = await Shipment.findOne({ $or: lookupQueries });
    if (!shipment) {
      if (webhookLog) {
        webhookLog.error = "Shipment record not found for webhook identifiers";
        await webhookLog.save();
      }
      return res.status(200).json({ status: "shipment_not_found" });
    }

    if (awb && !shipment.awbCode) {
      shipment.awbCode = awb;
    }

    if (currentStatus) {
      shipment.statusLabel = currentStatus;
      const statusUpper = String(currentStatus).toUpperCase();

      if (statusUpper.includes("DELIVERED")) shipment.status = "DELIVERED";
      else if (statusUpper.includes("OUT FOR DELIVERY")) shipment.status = "OUT_FOR_DELIVERY";
      else if (statusUpper.includes("IN TRANSIT")) shipment.status = "IN_TRANSIT";
      else if (statusUpper.includes("PICKED") || statusUpper.includes("PICKUP")) shipment.status = "PICKED_UP";
      else if (statusUpper.includes("RTO")) shipment.status = "RTO";
      else if (statusUpper.includes("RETURN")) shipment.status = "RETURN";
      else if (statusUpper.includes("CANCEL")) shipment.status = "CANCELLED";
    }

    if (Array.isArray(scans) && scans.length > 0) {
      shipment.trackingEvents = scans.map((s) => ({
        status: s["sr-status"] || s.status || "UPDATE",
        activity: s.activity || s.location || "Status Update",
        location: s.location || "",
        timestamp: s.date ? new Date(s.date) : new Date(),
      }));
    }

    await shipment.save();
    await syncOrderStatusFromShipment(shipment);

    if (webhookLog) {
      webhookLog.processed = true;
      webhookLog.processedAt = new Date();
      await webhookLog.save();
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[Shiprocket Webhook Error]", error);
    return res.status(500).json({ message: "Webhook processing error" });
  }
});

// ─── POST /api/shipping/webhook/clickpost ────────────────────────────────────
// Webhook endpoint to receive real-time shipping events from ClickPost
router.post("/webhook/clickpost", async (req, res) => {
  try {
    const body = req.body || {};
    const waybill = body.waybill || body.awb || body.result?.waybill || body.tracking_number || "";
    const orderId = body.order_id || body.result?.order_id || "";
    const currentStatus = body.status || body.latest_status?.status || body.current_status || "";
    const scans = body.scans || body.history || [];

    const eventId = `cp_wh_${waybill || "no_awb"}_${currentStatus || "status"}_${Date.now()}`;

    let webhookLog;
    try {
      webhookLog = await WebhookLog.create({
        eventId,
        eventType: `CLICKPOST_${String(currentStatus || "EVENT").toUpperCase().replace(/\s+/g, "_")}`,
        payload: body,
      });
    } catch (logErr) {
      console.warn("[ClickPost Webhook Log Warning]", logErr.message);
    }

    const lookupQueries = [];
    if (waybill) lookupQueries.push({ awbCode: waybill });
    if (orderId) lookupQueries.push({ order: orderId });

    if (lookupQueries.length === 0) {
      return res.status(200).json({ status: "ignored_no_identifier" });
    }

    const shipment = await Shipment.findOne({ $or: lookupQueries });
    if (!shipment) {
      if (webhookLog) {
        webhookLog.error = "Shipment record not found for ClickPost webhook identifiers";
        await webhookLog.save();
      }
      return res.status(200).json({ status: "shipment_not_found" });
    }

    if (waybill && !shipment.awbCode) {
      shipment.awbCode = waybill;
    }

    if (currentStatus) {
      shipment.statusLabel = currentStatus;
      const statusUpper = String(currentStatus).toUpperCase();

      if (statusUpper.includes("DELIVERED")) shipment.status = "DELIVERED";
      else if (statusUpper.includes("OUT FOR DELIVERY") || statusUpper.includes("OFD")) shipment.status = "OUT_FOR_DELIVERY";
      else if (statusUpper.includes("TRANSIT") || statusUpper.includes("DISPATCH")) shipment.status = "IN_TRANSIT";
      else if (statusUpper.includes("PICKED") || statusUpper.includes("PICKUP")) shipment.status = "PICKED_UP";
      else if (statusUpper.includes("RTO")) shipment.status = "RTO";
      else if (statusUpper.includes("RETURN")) shipment.status = "RETURN";
      else if (statusUpper.includes("CANCEL")) shipment.status = "CANCELLED";
    }

    if (Array.isArray(scans) && scans.length > 0) {
      shipment.trackingEvents = scans.map((s) => ({
        status: s.status || "UPDATE",
        activity: s.remark || s.activity || s.status_description || "Status Update",
        location: s.location || "",
        timestamp: s.timestamp ? new Date(s.timestamp) : new Date(),
      }));
    }

    await shipment.save();
    await syncOrderStatusFromShipment(shipment);

    if (webhookLog) {
      webhookLog.processed = true;
      webhookLog.processedAt = new Date();
      await webhookLog.save();
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[ClickPost Webhook Error]", error);
    return res.status(500).json({ message: "Webhook processing error" });
  }
});

module.exports = router;
