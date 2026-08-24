const Seller = require("../models/Seller");
const Order = require("../models/Order");
const ParentOrder = require("../models/ParentOrder");
const Shipment = require("../models/Shipment");
const { createShiprocketOrder } = require("./shiprocket");

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

/**
 * Check if a seller has active Delivery Partner add-on and READY shipping configuration
 */
function isSellerShippingReady(seller) {
  if (!seller) return false;

  const now = new Date();
  const isMainSubActive =
    seller.subscriptionStatus === "ACTIVE" &&
    seller.subscriptionEndDate &&
    new Date(seller.subscriptionEndDate) > now;
  const isAddonActive =
    seller.deliveryAddonStatus === "ACTIVE" &&
    seller.deliveryAddonExpiresAt &&
    new Date(seller.deliveryAddonExpiresAt) > now;
  const hasPickup = Boolean(seller.shiprocketPickupLocation);

  return Boolean(isMainSubActive && isAddonActive && hasPickup);
}

/**
 * Automatically creates/registers a seller's pickup location in Shiprocket using
 * their existing business address and details already saved in MongoDB.
 */
async function autoSetupPickupLocation(sellerDocOrId) {
  try {
    const seller = typeof sellerDocOrId === "object" && sellerDocOrId._id
      ? sellerDocOrId
      : await Seller.findById(sellerDocOrId);
    if (!seller) return { success: false, error: "Seller not found" };

    const addressParts = parseAddressSimple(seller.businessAddress || "");
    const pickupName = `Pickup_${seller.slug}_${seller._id.toString().slice(-4)}`;

    const { addPickupLocation } = require("./shiprocket");
    const resLocation = await addPickupLocation({
      locationName: pickupName,
      name: seller.businessName || "Vendor",
      email: seller.businessEmail || "vendor@zensos.in",
      phone: seller.phone || "9999999999",
      address: addressParts.line1 || seller.businessAddress || "Store Address",
      address2: addressParts.line2 || "",
      city: addressParts.city || "Bengaluru",
      state: addressParts.state || "Karnataka",
      pincode: addressParts.pincode || "560001",
      seller,
    });

    if (resLocation.success) {
      seller.shiprocketPickupLocation = pickupName;
      await seller.save();

      const DeliverySubscription = require("../models/DeliverySubscription");
      await DeliverySubscription.updateOne(
        { seller: seller._id, status: "ACTIVE" },
        { $set: { onboardingStatus: "READY", pickupLocationName: pickupName } }
      );

      return { success: true, pickupLocation: pickupName };
    } else {
      return { success: false, error: resLocation.error };
    }
  } catch (error) {
    console.error("[autoSetupPickupLocation Error]:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Safely creates a Shiprocket shipment for a single sub-order.
 * Will NOT throw errors to caller; returns null on non-eligibility or failure.
 */
async function createShipmentForSubOrder(subOrderOrId, parentOrderOrId, sellerDoc) {
  try {
    const subOrder = typeof subOrderOrId === "object" && subOrderOrId._id
      ? subOrderOrId
      : await Order.findById(subOrderOrId);
    if (!subOrder) return null;

    // Check if shipment already created for this sub-order
    let existing = await Shipment.findOne({ order: subOrder._id, status: { $ne: "CANCELLED" } });
    if (existing) return existing;

    const parentOrder = typeof parentOrderOrId === "object" && parentOrderOrId._id
      ? parentOrderOrId
      : await ParentOrder.findById(subOrder.parentOrder || parentOrderOrId);
    if (!parentOrder) return null;

    const seller = sellerDoc || await Seller.findById(subOrder.seller);
    if (!isSellerShippingReady(seller)) {
      return null;
    }

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
    const pickupLocation = seller.shiprocketPickupLocation || `Pickup_${seller.slug || seller._id.toString().slice(-6)}`;

    const customerName =
      (subOrder.shippingCustomerName || subOrder.customerName || parentOrder?.customerName || "Customer").trim();
    const rawPhone =
      subOrder.shippingCustomerPhone || subOrder.customerPhone || parentOrder?.customerPhone || "";
    const cleanPhone = String(rawPhone).replace(/\D/g, "").slice(-10);
    const customerPhone = cleanPhone.length === 10 ? cleanPhone : "9876543210";
    const customerEmail =
      (subOrder.customerEmail || parentOrder?.customerEmail || "customer@zensos.in").trim();

    const items = subOrder.items && subOrder.items.length > 0 ? subOrder.items : [
      {
        productTitle: subOrder.productTitle || "Product",
        quantity: subOrder.quantity || 1,
        unitPrice: subOrder.amount || 0,
      },
    ];

    const { createShipmentOrder } = require("./logisticsManager");
    const srResult = await createShipmentOrder({
      orderId: subOrder._id,
      orderDate: subOrder.createdAt || new Date(),
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
      console.warn(`[ShipmentService] Could not create shipment for order ${subOrder._id}:`, srResult.error);
      return null;
    }

    const providerName = seller.preferredLogisticsProvider || "SHIPROCKET";
    const shipment = await Shipment.create({
      order: subOrder._id,
      parentOrder: parentOrder?._id || subOrder.parentOrder || null,
      seller: seller._id,
      provider: providerName,
      shiprocketOrderId: srResult.shiprocketOrderId,
      shiprocketShipmentId: srResult.shiprocketShipmentId,
      awbCode: srResult.awbCode || "",
      courierName: srResult.courierName || "Standard Shipping",
      courierCompanyId: srResult.courierCompanyId,
      pickupLocation,
      status: "CREATED",
      statusLabel: srResult.statusLabel || "Shipment Created",
      trackingUrl: srResult.trackingUrl || "",
      trackingEvents: [
        {
          status: "CREATED",
          activity: `Shipment Created via ${providerName}`,
          location: sellerAddr.city || "Vendor Warehouse",
          timestamp: new Date(),
        },
      ],
    });

    return shipment;
  } catch (error) {
    console.error("[ShipmentService] Error creating shipment for sub-order:", error.message);
    return null;
  }
}

/**
 * Iterates through all sub-orders of a parent order and auto-creates shipments
 * for sellers who have active Delivery Partner add-on with READY status.
 */
async function tryAutoCreateShipmentsForParentOrder(parentOrderOrId) {
  try {
    const parentOrderId = parentOrderOrId?._id || parentOrderOrId;
    if (!parentOrderId) return [];

    const parentOrder = await ParentOrder.findById(parentOrderId).populate({
      path: "subOrders",
      populate: { path: "seller" },
    });

    if (!parentOrder || !Array.isArray(parentOrder.subOrders)) return [];

    const results = [];
    for (const subOrder of parentOrder.subOrders) {
      const seller = subOrder.seller;
      if (seller && isSellerShippingReady(seller)) {
        const shipment = await createShipmentForSubOrder(subOrder, parentOrder, seller);
        if (shipment) {
          results.push(shipment);
        }
      }
    }

    return results;
  } catch (error) {
    console.error("[ShipmentService] Error in tryAutoCreateShipmentsForParentOrder:", error.message);
    return [];
  }
}

/**
 * Automatically synchronizes an Order's status and inventory when a Shipment updates
 * (e.g. DELIVERED -> mark order as delivered, CANCELLED/RTO -> mark cancelled and restock).
 */
async function syncOrderStatusFromShipment(shipmentDocOrId) {
  try {
    const shipment = typeof shipmentDocOrId === "object" && shipmentDocOrId._id
      ? shipmentDocOrId
      : await Shipment.findById(shipmentDocOrId);
    if (!shipment || !shipment.order) return null;

    const order = await Order.findById(shipment.order);
    if (!order) return null;

    const currentStatus = shipment.status;
    const previousOrderStatus = order.paymentStatus;

    if (currentStatus === "DELIVERED" && order.paymentStatus !== "delivered") {
      order.paymentStatus = "delivered";
      await order.save();
      console.log(`[ShipmentService] Auto-updated order ${order._id} status to 'delivered' via shipment ${shipment._id}`);
    } else if (
      (currentStatus === "CANCELLED" || currentStatus === "RTO" || currentStatus === "RETURN") &&
      order.paymentStatus !== "cancelled"
    ) {
      order.paymentStatus = "cancelled";
      await order.save();
      try {
        const { restockInventoryForOrder } = require("./inventoryService");
        await restockInventoryForOrder(order);
      } catch (invErr) {
        console.warn("[ShipmentService] Failed to restock inventory during auto-cancellation:", invErr.message);
      }
      console.log(`[ShipmentService] Auto-updated order ${order._id} status to 'cancelled' and restocked inventory via shipment ${shipment._id}`);
    }

    return order;
  } catch (error) {
    console.error("[ShipmentService] Error syncing order status from shipment:", error.message);
    return null;
  }
}

module.exports = {
  isSellerShippingReady,
  autoSetupPickupLocation,
  createShipmentForSubOrder,
  tryAutoCreateShipmentsForParentOrder,
  syncOrderStatusFromShipment,
};
