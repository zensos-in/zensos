const Inventory = require("../models/Inventory");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const { sendOutOfStockAlert } = require("./mailer");

/**
 * Synchronize inventory records when a product is created or updated.
 */
async function syncProductInventory(sellerId, productId, productData = {}) {
  try {
    const trackInventory = Boolean(productData.trackInventory);
    const variantItems = Array.isArray(productData.variantItems) ? productData.variantItems : [];

    if (!trackInventory) {
      // Mark all existing inventory records for this product as not tracked
      await Inventory.updateMany(
        { product: productId },
        { $set: { trackInventory: false } }
      );
      return;
    }

    if (variantItems.length > 0) {
      const activeVariantIds = [];

      for (const item of variantItems) {
        const variantId = String(item.variantId || "").trim();
        if (!variantId) continue;
        activeVariantIds.push(variantId);

        const stock = Math.max(0, Number(item.stock) || 0);
        const isOutOfStock = stock <= 0;

        const existing = await Inventory.findOne({ product: productId, variantId });
        if (existing) {
          existing.variantTitle = item.title || "";
          existing.trackInventory = true;
          existing.quantity = stock;
          existing.isOutOfStock = isOutOfStock;
          if (stock > 0) {
            existing.lastNotifiedOutOfStockAt = null; // reset notification trigger on restock
          }
          await existing.save();
        } else {
          await Inventory.create({
            seller: sellerId,
            product: productId,
            variantId,
            variantTitle: item.title || "",
            trackInventory: true,
            quantity: stock,
            isOutOfStock,
            lastNotifiedOutOfStockAt: null,
          });
        }
      }

      // Remove orphaned inventory entries for variants that were deleted
      await Inventory.deleteMany({
        product: productId,
        variantId: { $nin: activeVariantIds },
      });
    } else {
      // Standalone product without variants
      const stock = Math.max(0, Number(productData.stock) || 0);
      const isOutOfStock = stock <= 0;

      const existing = await Inventory.findOne({ product: productId, variantId: "default" });
      if (existing) {
        existing.variantTitle = "Default";
        existing.trackInventory = true;
        existing.quantity = stock;
        existing.isOutOfStock = isOutOfStock;
        if (stock > 0) {
          existing.lastNotifiedOutOfStockAt = null;
        }
        await existing.save();
      } else {
        await Inventory.create({
          seller: sellerId,
          product: productId,
          variantId: "default",
          variantTitle: "Default",
          trackInventory: true,
          quantity: stock,
          isOutOfStock,
          lastNotifiedOutOfStockAt: null,
        });
      }

      // Delete any variant records if previously had variants
      await Inventory.deleteMany({
        product: productId,
        variantId: { $ne: "default" },
      });
    }
  } catch (error) {
    console.error(`[inventoryService] Failed to sync inventory for product ${productId}:`, error?.message || error);
  }
}

/**
 * Remove all inventory records when a product is deleted.
 */
async function cleanupProductInventory(productId) {
  try {
    await Inventory.deleteMany({ product: productId });
  } catch (error) {
    console.error(`[inventoryService] Failed to clean up inventory for product ${productId}:`, error?.message || error);
  }
}

/**
 * Fetch inventory map for a list of products.
 * Returns: { [productId]: { [variantId]: { quantity, isOutOfStock, trackInventory } } }
 */
async function getInventoryMapForProducts(productIds = []) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return {};
  }

  try {
    const docs = await Inventory.find({ product: { $in: productIds } }).lean();
    const map = {};

    for (const doc of docs) {
      const pId = String(doc.product);
      if (!map[pId]) {
        map[pId] = {};
      }
      map[pId][doc.variantId] = {
        quantity: doc.quantity,
        isOutOfStock: doc.isOutOfStock,
        trackInventory: doc.trackInventory,
      };
    }

    return map;
  } catch (error) {
    console.error(`[inventoryService] Error fetching inventory map:`, error?.message || error);
    return {};
  }
}

/**
 * Validate that all items in an order/cart have sufficient stock.
 */
async function validateCartInventory(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: true };
  }

  for (const item of items) {
    const productId = item.product?._id || item.product;
    const variantId = item.variantId ? String(item.variantId).trim() : "default";
    const requestedQty = Math.max(1, Number(item.quantity) || 1);

    const inv = await Inventory.findOne({
      product: productId,
      variantId,
      trackInventory: true,
    }).lean();

    if (inv) {
      if (inv.quantity < requestedQty) {
        const itemLabel = item.productTitle
          ? `${item.productTitle}${item.variantTitle ? ` (${item.variantTitle})` : ""}`
          : "Selected item";
        return {
          valid: false,
          error: inv.quantity <= 0
            ? `"${itemLabel}" is currently out of stock.`
            : `Only ${inv.quantity} unit(s) available for "${itemLabel}".`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Atomically deduct inventory for confirmed order items.
 * Sends out-of-stock email to seller if stock reaches 0.
 */
async function deductInventoryForOrder(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return;
  }

  for (const item of order.items) {
    const productId = item.product?._id || item.product;
    const variantId = item.variantId ? String(item.variantId).trim() : "default";
    const qty = Math.max(1, Number(item.quantity) || 1);

    try {
      // Atomic decrement
      const updated = await Inventory.findOneAndUpdate(
        {
          product: productId,
          variantId,
          trackInventory: true,
        },
        {
          $inc: { quantity: -qty },
        },
        { new: true }
      );

      if (!updated) {
        continue;
      }

      // Check if stock reached 0 and needs notification
      if (updated.quantity <= 0) {
        updated.quantity = 0; // prevent negative display
        updated.isOutOfStock = true;

        if (!updated.lastNotifiedOutOfStockAt) {
          updated.lastNotifiedOutOfStockAt = new Date();
          await updated.save();

          // Dispatch out-of-stock notification to seller
          try {
            const seller = await Seller.findById(order.seller || updated.seller).lean();
            if (seller?.email) {
              const product = await Product.findById(productId).lean();
              sendOutOfStockAlert({
                email: seller.email,
                businessName: seller.businessName || seller.name,
                productTitle: product?.title || item.productTitle || "Product",
                variantTitle: updated.variantTitle !== "Default" ? updated.variantTitle : "",
                dashboardUrl: `${process.env.CLIENT_URL || "https://zensos.in"}/login`,
              }).catch((err) =>
                console.error("[inventoryService] Failed to send out-of-stock alert:", err?.message || err)
              );
            }
          } catch (notifErr) {
            console.error("[inventoryService] Notification dispatch error:", notifErr?.message || notifErr);
          }
        } else {
          await updated.save();
        }
      }
    } catch (err) {
      console.error(`[inventoryService] Error deducting stock for product ${productId}, variant ${variantId}:`, err?.message || err);
    }
  }
}

/**
 * Restock inventory when an order is cancelled or refunded.
 */
async function restockInventoryForOrder(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return;
  }

  for (const item of order.items) {
    const productId = item.product?._id || item.product;
    const variantId = item.variantId ? String(item.variantId).trim() : "default";
    const qty = Math.max(1, Number(item.quantity) || 1);

    try {
      const updated = await Inventory.findOneAndUpdate(
        {
          product: productId,
          variantId,
          trackInventory: true,
        },
        {
          $inc: { quantity: qty },
          $set: { isOutOfStock: false, lastNotifiedOutOfStockAt: null },
        },
        { new: true }
      );

      if (updated && updated.quantity < 0) {
        updated.quantity = 0;
        await updated.save();
      }
    } catch (err) {
      console.error(`[inventoryService] Error restocking for product ${productId}, variant ${variantId}:`, err?.message || err);
    }
  }
}

module.exports = {
  syncProductInventory,
  cleanupProductInventory,
  getInventoryMapForProducts,
  validateCartInventory,
  deductInventoryForOrder,
  restockInventoryForOrder,
};
