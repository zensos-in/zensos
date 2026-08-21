const axios = require("axios");

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Get active Shiprocket API token. Refresh if expired.
 */
async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    // Return mock indicator if credentials are not set (e.g. in test / dev environment without live keys)
    return "MOCK_SHIPROCKET_TOKEN";
  }

  // Token is valid for 10 days; refresh if within 1 hour of expiry
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
      // 10 days minus buffer
      tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
      return cachedToken;
    }

    throw new Error("Shiprocket auth response did not include token");
  } catch (error) {
    console.error("[Shiprocket Auth Error]", error?.response?.data || error.message);
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
}) {
  const token = await getShiprocketToken();
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
        pincode: String(pincode),
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
    console.error("[Shiprocket Add Pickup Error]", error?.response?.data || error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Failed to add pickup location",
    };
  }
}

/**
 * Check courier serviceability for a delivery route
 */
async function checkServiceability({ pickupPincode, deliveryPincode, weightKg = 0.5, cod = false }) {
  const token = await getShiprocketToken();
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
}) {
  const token = await getShiprocketToken();
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
    const payload = {
      order_id: String(orderId),
      order_date: new Date(orderDate).toISOString().slice(0, 19).replace("T", " "),
      pickup_location: pickupLocation,
      billing_customer_name: billingName,
      billing_last_name: "",
      billing_address: billingAddress,
      billing_city: billingCity,
      billing_pincode: String(billingPincode),
      billing_state: billingState,
      billing_country: "India",
      billing_email: billingEmail || "customer@zensos.in",
      billing_phone: billingPhone,
      shipping_is_billing: true,
      order_items: orderItems.map((item) => ({
        name: item.productTitle || "Product",
        sku: String(item.variantId || item.product || "SKU1"),
        units: item.quantity || 1,
        selling_price: item.unitPrice || item.lineTotal || 0,
      })),
      payment_method: paymentMethod,
      sub_total: subTotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: weightKg,
    };

    const response = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const resData = response.data;
    const shiprocketOrderId = resData.order_id;
    const shiprocketShipmentId = resData.shipment_id;

    // Assign AWB automatically
    let awbCode = "";
    let courierName = "";
    let courierCompanyId = null;

    if (shiprocketShipmentId) {
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
      statusLabel: "Shipment Created",
      trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : "",
      raw: resData,
    };
  } catch (error) {
    console.error("[Shiprocket Order Creation Error]", error?.response?.data || error.message);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Failed to create shipment in Shiprocket",
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
  getTrackingByAwb,
};
