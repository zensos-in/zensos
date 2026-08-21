const Seller = require("../models/Seller");
const Order = require("../models/Order");
const ParentOrder = require("../models/ParentOrder");
const Shipment = require("../models/Shipment");
const { createShiprocketOrder } = require("./shiprocket");

function parseAddressSimple(address = "") {
  const str = String(address).trim();
  const pincodeMatch = str.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : "";

  const parts = str.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);
  const line1 = parts[0] || str;
  const line2 = parts[1] || "";
  const city = parts.find((p) => !/\d{6}/.test(p) && p !== line1) || "";
  const state = parts.slice(2).find((p) => !/\d{6}/.test(p)) || "";

  return { line1, line2, city, state, pincode };
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

    const shippingAddr = parseAddressSimple(parentOrder.shippingAddress || parentOrder.deliveryAddress || "");
    const sellerAddr = parseAddressSimple(seller.businessAddress || "");
    const pickupLocation = seller.shiprocketPickupLocation || `Pickup_${seller.slug}`;

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
      billingName: parentOrder.customerName || "Customer",
      billingAddress: shippingAddr.line1 || parentOrder.shippingAddress || parentOrder.deliveryAddress || "Delivery Address",
      billingCity: shippingAddr.city || "City",
      billingState: shippingAddr.state || "State",
      billingPincode: shippingAddr.pincode || "110001",
      billingPhone: parentOrder.customerPhone || "9999999999",
      billingEmail: parentOrder.customerEmail || "customer@zensos.in",
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
      parentOrder: parentOrder._id,
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
