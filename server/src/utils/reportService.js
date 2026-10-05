const ProductReport = require("../models/ProductReport");
const Order = require("../models/Order");

/**
 * Record sales items from an order into the persistent ProductReport collection.
 * Uses upsert so calling multiple times is idempotent.
 */
async function recordOrderProductReports(subOrder) {
  if (!subOrder || !subOrder.seller) return;
  try {
    const items = Array.isArray(subOrder.items) && subOrder.items.length > 0
      ? subOrder.items
      : [{
          product: subOrder.product,
          productTitle: subOrder.productTitle || "Product",
          productCategory: subOrder.productCategory || "",
          productImageUrl: subOrder.productImageUrl || "",
          quantity: subOrder.quantity || 1,
          unitPrice: subOrder.amount ? subOrder.amount / (subOrder.quantity || 1) : 0,
          lineTotal: subOrder.amount || 0,
        }];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawProductId = item.product?._id?.toString() || item.product?.toString?.() || `item-${i + 1}`;
      const title = item.productTitle || item.product?.title || "Product";
      const category = item.productCategory || item.product?.category || "";
      const imageUrl = item.productImageUrl || item.product?.imageUrl || "";
      const qty = Number(item.quantity) || 1;
      const lineTotal = Number(item.lineTotal) || Number(item.unitPrice ? item.unitPrice * qty : 0) || Number(subOrder.amount) || 0;
      const unitPrice = Number(item.unitPrice) || (qty > 0 ? lineTotal / qty : lineTotal);

      await ProductReport.findOneAndUpdate(
        {
          orderId: subOrder._id,
          productId: rawProductId,
        },
        {
          $set: {
            seller: subOrder.seller,
            productId: rawProductId,
            productTitle: title,
            productCategory: category,
            productImageUrl: imageUrl,
            orderId: subOrder._id,
            customOrderId: subOrder.customOrderId || "",
            quantity: qty,
            unitPrice,
            lineTotal,
            paymentStatus: subOrder.paymentStatus || "pending",
            orderCreatedAt: subOrder.createdAt || new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error("[recordOrderProductReports error]:", err.message);
  }
}

/**
 * Update payment status for all ProductReport records belonging to an order.
 */
async function updateOrderProductReportsStatus(orderId, paymentStatus) {
  if (!orderId) return;
  try {
    await ProductReport.updateMany(
      { orderId },
      { $set: { paymentStatus } }
    );
  } catch (err) {
    console.error("[updateOrderProductReportsStatus error]:", err.message);
  }
}

/**
 * Ensure historical orders are synced into ProductReport if none exist yet.
 */
async function backfillSellerReportsIfEmpty(sellerId) {
  try {
    const count = await ProductReport.countDocuments({ seller: sellerId });
    if (count > 0) return;

    const existingOrders = await Order.find({ seller: sellerId })
      .populate("product", "title category imageUrl")
      .populate("items.product", "title category imageUrl");

    for (const order of existingOrders) {
      await recordOrderProductReports(order);
    }
  } catch (err) {
    console.error("[backfillSellerReportsIfEmpty error]:", err.message);
  }
}

/**
 * Get sales report aggregated from the persistent ProductReport collection.
 */
async function getSellerSalesReport(sellerId, dateFilter = {}) {
  await backfillSellerReportsIfEmpty(sellerId);

  const reportRecords = await ProductReport.find({
    seller: sellerId,
    ...dateFilter,
    paymentStatus: { $ne: "cancelled" },
  });

  const distinctOrderIds = new Set();
  const productMap = {};
  let totalRevenue = 0;

  for (const record of reportRecords) {
    if (record.orderId) {
      distinctOrderIds.add(record.orderId.toString());
    }

    const key = record.productId || record.productTitle || "unknown";
    if (!productMap[key]) {
      productMap[key] = {
        productId: key,
        title: record.productTitle || "Untitled Product",
        category: record.productCategory || "",
        imageUrl: record.productImageUrl || "",
        unitsSold: 0,
        revenue: 0,
      };
    }

    productMap[key].unitsSold += record.quantity || 0;
    productMap[key].revenue += record.lineTotal || 0;
    totalRevenue += record.lineTotal || 0;
  }

  const topProducts = Object.values(productMap).sort((a, b) => b.unitsSold - a.unitsSold);

  return {
    totalOrders: distinctOrderIds.size,
    totalRevenue,
    topProducts,
  };
}

module.exports = {
  recordOrderProductReports,
  updateOrderProductReportsStatus,
  backfillSellerReportsIfEmpty,
  getSellerSalesReport,
};
