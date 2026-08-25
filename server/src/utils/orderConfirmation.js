const ParentOrder = require("../models/ParentOrder");
const Shipment = require("../models/Shipment");
const { sendOrderConfirmationEmail, sendShippingNotificationEmail } = require("./mailer");

async function sendOrderConfirmationForParentOrder(parentOrderOrId) {
  const parentOrderId = parentOrderOrId?._id || parentOrderOrId;
  if (!parentOrderId) return;

  const parentOrder = await ParentOrder.findById(parentOrderId).populate({
    path: "subOrders",
    populate: [
      { path: "seller" },
      { path: "product", select: "title price imageUrl mrp category" },
      { path: "items.product", select: "title price imageUrl mrp category" },
    ],
  });

  if (!parentOrder || parentOrder.orderConfirmationEmailSentAt || !parentOrder.customerEmail) {
    return;
  }

  await sendOrderConfirmationEmail(parentOrder.customerEmail, {
    parentOrder,
    orders: parentOrder.subOrders || [],
  });

  parentOrder.orderConfirmationEmailSentAt = new Date();
  await parentOrder.save();
}

async function trySendOrderConfirmationForParentOrder(parentOrderOrId) {
  try {
    await sendOrderConfirmationForParentOrder(parentOrderOrId);
  } catch (error) {
    console.error("[Order Confirmation Email Error]:", error.message);
  }
}

async function sendShippingNotificationForShipment(shipmentOrId) {
  const shipmentId = shipmentOrId?._id || shipmentOrId;
  if (!shipmentId) return;

  const shipment = await Shipment.findById(shipmentId)
    .populate({
      path: "order",
      populate: [
        { path: "seller" },
        { path: "product", select: "title price imageUrl mrp category" },
        { path: "items.product", select: "title price imageUrl mrp category" },
      ],
    })
    .populate("parentOrder")
    .populate("seller");

  if (!shipment || shipment.status === "CANCELLED") {
    return;
  }

  // Idempotency: only send once per shipment
  if (shipment.shippingNotificationSent) {
    return;
  }

  // Must have valid tracking details
  if (!shipment.awbCode && !shipment.trackingUrl) {
    return;
  }

  const order = shipment.order;
  const parentOrder = shipment.parentOrder;
  const seller = shipment.seller || order?.seller;
  const toEmail = order?.customerEmail || parentOrder?.customerEmail;

  if (!toEmail) {
    return;
  }

  await sendShippingNotificationEmail(toEmail, {
    order,
    shipment,
    seller,
    parentOrder,
  });

  shipment.shippingNotificationSent = true;
  shipment.shippingNotificationSentAt = new Date();
  await shipment.save();
}

async function trySendShippingNotificationForShipment(shipmentOrId) {
  try {
    await sendShippingNotificationForShipment(shipmentOrId);
  } catch (error) {
    console.error("[Shipping Notification Email Error]:", error.message);
  }
}

module.exports = {
  sendOrderConfirmationForParentOrder,
  trySendOrderConfirmationForParentOrder,
  sendShippingNotificationForShipment,
  trySendShippingNotificationForShipment,
};
