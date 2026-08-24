const shiprocket = require("./shiprocket");
const clickpost = require("./clickpost");

/**
 * Unified Multi-Provider Logistics Manager for Zensos
 * Supports Shiprocket, NimbusPost, Velocity, ClickPost, and Self/Manual Dispatch.
 * Zensos operates purely as a software bridge — freight costs and wallets belong 100% to the seller.
 */

async function createShipmentOrder(options) {
  const { seller } = options;
  const provider = seller?.preferredLogisticsProvider || "SHIPROCKET";

  if (provider === "SELF_MANUAL") {
    return {
      success: true,
      provider: "SELF_MANUAL",
      shiprocketOrderId: null,
      shiprocketShipmentId: null,
      awbCode: "",
      courierName: "Self / Local Delivery",
      statusLabel: "Order Ready for Dispatch",
      trackingUrl: "",
    };
  }

  if (provider === "CLICKPOST") {
    const res = await clickpost.createClickpostOrder({
      orderId: options.orderId,
      customOrderId: options.customOrderId || options.orderId,
      customerName: options.billingName,
      customerPhone: options.billingPhone,
      customerEmail: options.billingEmail,
      shippingAddress: {
        address: options.billingAddress,
        city: options.billingCity,
        state: options.billingState,
        pincode: options.billingPincode,
      },
      items: options.orderItems || [],
      totalAmount: options.subTotal,
      paymentMode: options.paymentMethod || "prepaid",
      pickupAddress: options.pickupAddressObj || null,
      seller,
    });
    return { ...res, provider: "CLICKPOST" };
  }

  // Shiprocket / NimbusPost / Velocity — all use same Shiprocket API wrapper
  if (provider === "SHIPROCKET" || provider === "NIMBUSPOST" || provider === "VELOCITY") {
    const res = await shiprocket.createShiprocketOrder(options);
    return { ...res, provider };
  }

  return {
    success: false,
    error: `Unsupported shipping provider: ${provider}`,
  };
}

async function assignShipmentAwb(options) {
  const { seller } = options;
  const provider = seller?.preferredLogisticsProvider || "SHIPROCKET";

  if (provider === "SELF_MANUAL") {
    return {
      success: true,
      awbCode: options.awbCode || `MANUAL_${Date.now()}`,
      courierName: options.courierName || "Self Delivery",
    };
  }

  if (provider === "CLICKPOST") {
    // ClickPost assigns AWB at order creation time; if already assigned return existing
    return {
      success: true,
      awbCode: options.awbCode || "",
      courierName: options.courierName || "ClickPost AI Carrier",
      message: "ClickPost AWB is auto-assigned at order creation. Re-trigger order creation to get a new AWB.",
    };
  }

  return await shiprocket.assignAwb(options);
}

async function scheduleShipmentPickup(options) {
  const { seller } = options;
  const provider = seller?.preferredLogisticsProvider || "SHIPROCKET";

  if (provider === "SELF_MANUAL" || provider === "CLICKPOST") {
    return { success: true, statusLabel: provider === "CLICKPOST" ? "Pickup Scheduled via ClickPost" : "Pickup Completed" };
  }

  return await shiprocket.generatePickup(options);
}

async function fetchShipmentLabel(options) {
  const { seller } = options;
  const provider = seller?.preferredLogisticsProvider || "SHIPROCKET";

  if (provider === "SELF_MANUAL") {
    return { success: true, labelUrl: "" };
  }

  if (provider === "CLICKPOST") {
    return await clickpost.generateClickpostLabel({ awbCode: options.awbCode, courierPartnerId: options.courierPartnerId, seller });
  }

  return await shiprocket.generateLabel(options);
}

async function fetchShipmentManifest(options) {
  const { seller } = options;
  const provider = seller?.preferredLogisticsProvider || "SHIPROCKET";

  if (provider === "SELF_MANUAL") {
    return {
      success: true,
      manifestUrl: "",
    };
  }

  return await shiprocket.generateManifest(options);
}

async function cancelShipmentOrder(options) {
  const { seller } = options;
  const provider = seller?.preferredLogisticsProvider || "SHIPROCKET";

  if (provider === "SELF_MANUAL") {
    return { success: true };
  }

  if (provider === "CLICKPOST") {
    return await clickpost.cancelClickpostShipment({
      awbCode: options.awbCode,
      courierPartnerId: options.courierPartnerId,
      reason: options.reason || "Cancelled by seller",
      seller,
    });
  }

  return await shiprocket.cancelShiprocketOrder(options);
}

async function getShipmentTracking(awbCode, seller = null, provider = "SHIPROCKET") {
  if (provider === "SELF_MANUAL") {
    return {
      success: true,
      awbCode,
      currentStatus: "DISPATCHED",
      statusLabel: "Dispatched by Vendor",
      events: [
        { status: "DISPATCHED", activity: "Order dispatched by seller", location: "Vendor Store", timestamp: new Date() },
      ],
    };
  }

  if (provider === "CLICKPOST") {
    const res = await clickpost.trackClickpostShipment({ awbCode, seller });
    if (!res.success) return res;
    return {
      success: true,
      awbCode,
      currentStatus: res.currentStatus,
      statusLabel: res.statusLabel,
      events: res.scans || [],
    };
  }

  return await shiprocket.getTrackingByAwb(awbCode, seller);
}

module.exports = {
  createShipmentOrder,
  assignShipmentAwb,
  scheduleShipmentPickup,
  fetchShipmentLabel,
  fetchShipmentManifest,
  cancelShipmentOrder,
  getShipmentTracking,
};
