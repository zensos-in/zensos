const axios = require("axios");

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Get active Shiprocket API token for a seller or master account. Refresh if expired.
 */
async function getShiprocketToken(sellerDocOrId = null) {
  let seller = null;
  if (sellerDocOrId) {
    if (typeof sellerDocOrId === "object" && sellerDocOrId._id) {
      seller = sellerDocOrId;
    } else {
      try {
        const Seller = require("../models/Seller");
        seller = await Seller.findById(sellerDocOrId);
      } catch (err) {
        seller = null;
      }
    }
  }

  // 1. If seller has their own Shiprocket credentials configured
  if (seller && seller.shiprocketEmail && seller.shiprocketPassword) {
    if (
      seller.shiprocketApiToken &&
      seller.shiprocketTokenExpiresAt &&
      Date.now() < new Date(seller.shiprocketTokenExpiresAt).getTime() - 60 * 60 * 1000
    ) {
      return seller.shiprocketApiToken;
    }

    try {
      const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
        email: seller.shiprocketEmail,
        password: seller.shiprocketPassword,
      });

      if (response.data && response.data.token) {
        const token = response.data.token;
        seller.shiprocketApiToken = token;
        seller.shiprocketTokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
        seller.shiprocketAccountStatus = "CONNECTED";
        await seller.save();
        return token;
      }
    } catch (error) {
      console.error(`[Shiprocket Seller Auth Error for ${seller._id}]`, error?.response?.data || error.message);
      seller.shiprocketAccountStatus = "FAILED";
      await seller.save();
      throw new Error(`Shiprocket auth failed for seller: ${error?.response?.data?.message || error.message}`);
    }
  }

  // 2. Fallback to master credentials in process.env
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    return "MOCK_SHIPROCKET_TOKEN";
  }

  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60 * 60 * 1000) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data && response.data.token) {
      cachedToken = response.data.token;
      tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
      return cachedToken;
    }

    throw new Error("Shiprocket auth response did not include token");
  } catch (error) {
    console.error("[Shiprocket Master Auth Error]", error?.response?.data || error.message);
    throw new Error("Failed to authenticate with Shiprocket API");
  }
}

/**
 * Add or sync a seller pickup location in Shiprocket
 */
async function addPickupLocation({
  locationName,
  name,
  email,
  phone,
  address,
  address2 = "",
  city,
  state,
  pincode,
  country = "India",
  seller = null,
}) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    return { success: true, isMock: true, locationName: locationName || `Pickup_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/settings/company/addpickup`,
      {
        pickup_location: locationName,
        name,
        email,
        phone,
        address,
        address_2: address2,
        city,
        state,
        pin_code: String(pincode),
        country,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      success: true,
      data: response.data,
      locationName,
    };
  } catch (error) {
    const errData = error?.response?.data;
    console.error("[Shiprocket Add Pickup Error]", errData || error.message);

    // If Shiprocket says the location already exists, treat it as a success —
    // the location is already registered and usable.
    const errMsg = (errData?.message || errData?.error || error.message || "").toLowerCase();
    if (
      errMsg.includes("already exist") ||
      errMsg.includes("already been added") ||
      errMsg.includes("duplicate") ||
      errMsg.includes("pickup location name") // Shiprocket: "Pickup Location Name has already been taken."
    ) {
      console.log("[Shiprocket Add Pickup] Location already exists — treating as success.");
      return { success: true, alreadyExists: true, locationName };
    }

    // Extract the most descriptive error from Shiprocket's response
    const friendlyError =
      errData?.errors?.pickup_location?.[0] ||
      errData?.message ||
      errData?.error ||
      error.message ||
      "Failed to add pickup location";

    return {
      success: false,
      error: friendlyError,
    };
  }
}

/**
 * Check courier serviceability for a delivery route
 */
async function checkServiceability({ pickupPincode, deliveryPincode, weightKg = 0.5, cod = false, seller = null }) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    return {
      availableCouriers: [
        { id: 1, name: "Delhivery Surface", rating: 4.5, rate: 60, etd: "3-4 Days" },
        { id: 2, name: "Blue Dart Express", rating: 4.8, rate: 95, etd: "1-2 Days" },
        { id: 3, name: "DTDC Air", rating: 4.3, rate: 80, etd: "2-3 Days" },
      ],
      isMock: true,
    };
  }

  try {
    const response = await axios.get(`${SHIPROCKET_BASE_URL}/courier/serviceability/`, {
      params: {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weightKg,
        cod: cod ? 1 : 0,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const couriers = response.data?.data?.available_courier_companies || [];
    return {
      availableCouriers: couriers.map((c) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        rating: c.rating,
        rate: c.rate,
        etd: c.etd,
      })),
      raw: response.data,
    };
  } catch (error) {
    console.error("[Shiprocket Serviceability Error]", error?.response?.data || error.message);
    return { availableCouriers: [], error: error.message };
  }
}

/**
 * Create order and shipment in Shiprocket
 */
async function createShiprocketOrder({
  orderId,
  orderDate,
  pickupLocation,
  billingName,
  billingAddress,
  billingCity,
  billingState,
  billingPincode,
  billingPhone,
  billingEmail,
  orderItems,
  paymentMethod = "Prepaid",
  subTotal,
  weightKg = 0.5,
  autoAssignAwb = true,
  seller = null,
}) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    const mockShipmentId = Math.floor(1000000 + Math.random() * 9000000);
    const mockOrderId = Math.floor(10000000 + Math.random() * 90000000);
    const mockAwb = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;

    return {
      success: true,
      isMock: true,
      shiprocketOrderId: mockOrderId,
      shiprocketShipmentId: mockShipmentId,
      awbCode: mockAwb,
      courierName: "Delhivery Express (Mock)",
      courierCompanyId: 1,
      statusLabel: "Shipment Created",
      trackingUrl: `https://shiprocket.co/tracking/${mockAwb}`,
    };
  }

  try {
    const rawPincode = String(billingPincode || "").replace(/\D/g, "");
    const cleanPincode = rawPincode.length === 6 ? rawPincode : "560001";
    const cleanPhone = String(billingPhone || "").replace(/\D/g, "").slice(-10) || "9876543210";
    const cleanName = String(billingName || "Customer").trim() || "Customer";
    const cleanAddress = String(billingAddress || "Delivery Address, Main Road").trim();
    const finalAddress = cleanAddress.length >= 10 ? cleanAddress : `${cleanAddress}, Main Road, ${billingCity || "City"}`.slice(0, 190);
    const cleanCity = String(billingCity || "Bengaluru").trim() || "Bengaluru";
    const cleanState = String(billingState || "Karnataka").trim() || "Karnataka";
    const cleanEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(billingEmail || ""))
      ? String(billingEmail).trim()
      : "customer@zensos.in";

    const cleanPaymentMethod = String(paymentMethod).toUpperCase() === "COD" ? "COD" : "Prepaid";

    const cleanItems = Array.isArray(orderItems) && orderItems.length > 0
      ? orderItems.map((item, idx) => ({
          name: String(item.productTitle || item.title || item.name || "Product Item").slice(0, 100),
          sku: String(item.variantId || item.sku || item.product?._id || item.product || `SKU_${idx + 1}`).slice(0, 50),
          units: Math.max(1, parseInt(item.quantity || item.units, 10) || 1),
          selling_price: Math.max(0, parseFloat(item.unitPrice || item.lineTotal || item.selling_price || item.price) || 0),
        }))
      : [
          {
            name: "Product Item",
            sku: "SKU1",
            units: 1,
            selling_price: Math.max(0, parseFloat(subTotal) || 0),
          },
        ];

    let orderDateStr = "";
    try {
      orderDateStr = new Date(orderDate || Date.now()).toISOString().slice(0, 19).replace("T", " ");
    } catch {
      orderDateStr = new Date().toISOString().slice(0, 19).replace("T", " ");
    }

    const payload = {
      order_id: String(orderId),
      order_date: orderDateStr,
      pickup_location: pickupLocation,
      billing_customer_name: cleanName,
      billing_last_name: "",
      billing_address: finalAddress,
      billing_city: cleanCity,
      billing_pincode: cleanPincode,
      billing_state: cleanState,
      billing_country: "India",
      billing_email: cleanEmail,
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      order_items: cleanItems,
      payment_method: cleanPaymentMethod,
      sub_total: Math.max(1, parseFloat(subTotal) || 1),
      length: 10,
      breadth: 10,
      height: 10,
      weight: Math.max(0.1, parseFloat(weightKg) || 0.5),
    };

    const response = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const resData = response.data;
    const shiprocketOrderId = resData.order_id;
    const shiprocketShipmentId = resData.shipment_id;

    // Assign AWB automatically if enabled
    let awbCode = "";
    let courierName = "";
    let courierCompanyId = null;

    if (autoAssignAwb && shiprocketShipmentId) {
      try {
        const awbRes = await axios.post(
          `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
          { shipment_id: shiprocketShipmentId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (awbRes.data?.response?.data?.awb_code) {
          awbCode = awbRes.data.response.data.awb_code;
          courierName = awbRes.data.response.data.courier_name || "";
          courierCompanyId = awbRes.data.response.data.courier_company_id || null;
        }
      } catch (awbErr) {
        console.warn("[Shiprocket AWB Assignment Warning]", awbErr?.response?.data || awbErr.message);
      }
    }

    return {
      success: true,
      shiprocketOrderId,
      shiprocketShipmentId,
      awbCode,
      courierName,
      courierCompanyId,
      statusLabel: awbCode ? "AWB Assigned" : "Order Created",
      trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : "",
      raw: resData,
    };
  } catch (error) {
    const errData = error?.response?.data;
    console.error("[Shiprocket Order Creation Error]", errData || error.message);

    let errorMsg = "";
    if (errData?.errors && typeof errData.errors === "object") {
      const fieldErrors = Object.entries(errData.errors)
        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
        .join("; ");
      if (fieldErrors) errorMsg = fieldErrors;
    } else if (typeof errData?.errors === "string") {
      errorMsg = errData.errors;
    }

    if (!errorMsg && errData?.message && errData.message !== "Oops! Invalid Data") {
      errorMsg = errData.message;
    }

    if (!errorMsg && errData?.message) {
      errorMsg = errData.message;
    }

    return {
      success: false,
      error: errorMsg || error.message || "Failed to create shipment in Shiprocket",
      raw: errData,
    };
  }
}

/**
 * Assign AWB & Courier manually for a shipment
 */
async function assignAwb({ shipmentId, courierId, seller = null }) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    const mockAwb = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      success: true,
      isMock: true,
      awbCode: mockAwb,
      courierName: "Delhivery Express (Mock)",
      courierCompanyId: courierId || 1,
    };
  }

  try {
    const payload = { shipment_id: shipmentId };
    if (courierId) {
      payload.courier_id = courierId;
    }
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const resData = response.data;
    if (resData?.awb_assign_status === 0 || resData?.status === 0) {
      const assignErr =
        resData?.response?.data?.awb_assign_error ||
        resData?.message ||
        "Could not assign AWB. Please check your Shiprocket wallet balance or courier availability.";
      return {
        success: false,
        error: assignErr,
        raw: resData,
      };
    }

    const data = resData?.response?.data || {};
    return {
      success: Boolean(data.awb_code),
      awbCode: data.awb_code || "",
      courierName: data.courier_name || "",
      courierCompanyId: data.courier_company_id || null,
      raw: resData,
    };
  } catch (error) {
    const errData = error?.response?.data;
    const msg =
      errData?.response?.data?.awb_assign_error ||
      errData?.message ||
      error.message ||
      "Failed to assign AWB in Shiprocket";
    console.error("[Shiprocket Assign AWB Error]", errData || error.message);
    return {
      success: false,
      error: msg,
      raw: errData,
    };
  }
}

/**
 * Generate pickup request for shipment(s)
 */
async function generatePickup({ shipmentId, seller = null }) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    return {
      success: true,
      isMock: true,
      statusLabel: "Pickup Scheduled",
    };
  }

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/generate/pickup`,
      { shipment_id: [shipmentId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      data: response.data,
      statusLabel: "Pickup Scheduled",
    };
  } catch (error) {
    console.error("[Shiprocket Pickup Error]", error?.response?.data || error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Failed to schedule pickup",
    };
  }
}

/**
 * Generate PDF shipping label for shipment(s)
 */
async function generateLabel({ shipmentId, seller = null }) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    return {
      success: true,
      isMock: true,
      labelUrl: `https://shiprocket.co/mock_label_${shipmentId}.pdf`,
    };
  }

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/generate/label`,
      { shipment_id: [shipmentId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      labelUrl: response.data?.label_url || "",
      raw: response.data,
    };
  } catch (error) {
    console.error("[Shiprocket Generate Label Error]", error?.response?.data || error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Failed to generate label",
    };
  }
}

/**
 * Generate Manifest PDF for shipment(s)
 */
async function generateManifest({ shipmentId, seller = null }) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    return {
      success: true,
      isMock: true,
      manifestUrl: `https://shiprocket.co/mock_manifest_${shipmentId}.pdf`,
    };
  }

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/manifests/generate`,
      { shipment_id: [shipmentId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      manifestUrl: response.data?.manifest_url || "",
      raw: response.data,
    };
  } catch (error) {
    console.error("[Shiprocket Generate Manifest Error]", error?.response?.data || error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Failed to generate manifest",
    };
  }
}

/**
 * Cancel an order in Shiprocket
 */
async function cancelShiprocketOrder({ orderIds, seller = null }) {
  const token = await getShiprocketToken(seller);
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    return { success: true, isMock: true };
  }

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/cancel`,
      { ids: Array.isArray(orderIds) ? orderIds : [orderIds] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("[Shiprocket Cancel Order Error]", error?.response?.data || error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Failed to cancel Shiprocket order",
    };
  }
}

/**
 * Fetch Shiprocket master wallet balance
 */
async function getWalletBalance() {
  const token = await getShiprocketToken();
  if (token === "MOCK_SHIPROCKET_TOKEN") {
    return {
      success: true,
      isMock: true,
      balance: 2500.00,
      currency: "INR",
    };
  }

  try {
    const response = await axios.get(`${SHIPROCKET_BASE_URL}/account/details/wallet-balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const balance = Number(response.data?.data?.balance ?? response.data?.balance ?? 0);
    return {
      success: true,
      balance,
      currency: "INR",
      raw: response.data,
    };
  } catch (error) {
    console.error("[Shiprocket Wallet Balance Error]", error?.response?.data || error.message);
    return {
      success: false,
      balance: 0,
      error: error?.response?.data?.message || error.message || "Failed to fetch wallet balance",
    };
  }
}

/**
 * Fetch real-time tracking for an AWB
 */
async function getTrackingByAwb(awbCode) {
  const token = await getShiprocketToken();
  if (token === "MOCK_SHIPROCKET_TOKEN" || !awbCode) {
    return {
      success: true,
      isMock: true,
      awbCode: awbCode || "MOCK_AWB_12345",
      currentStatus: "IN_TRANSIT",
      statusLabel: "In Transit",
      events: [
        { status: "CREATED", activity: "Shipment Created", location: "Bengaluru", timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: "PICKED_UP", activity: "Picked Up by Courier", location: "Bengaluru Hub", timestamp: new Date(Date.now() - 86400000) },
        { status: "IN_TRANSIT", activity: "In Transit to Destination Hub", location: "Mumbai Gateway", timestamp: new Date() },
      ],
    };
  }

  try {
    const response = await axios.get(`${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const trackingData = response.data?.tracking_data || {};
    const scans = trackingData.shipment_track_activities || [];

    return {
      success: true,
      awbCode,
      currentStatus: trackingData.current_status || "IN_TRANSIT",
      statusLabel: trackingData.current_status || "In Transit",
      events: scans.map((s) => ({
        status: s["sr-status"] || "IN_TRANSIT",
        activity: s.activity,
        location: s.location,
        timestamp: s.date ? new Date(s.date) : new Date(),
      })),
      raw: response.data,
    };
  } catch (error) {
    console.error("[Shiprocket Tracking Error]", error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getShiprocketToken,
  addPickupLocation,
  checkServiceability,
  createShiprocketOrder,
  assignAwb,
  generatePickup,
  generateLabel,
  generateManifest,
  cancelShiprocketOrder,
  getWalletBalance,
  getTrackingByAwb,
};
