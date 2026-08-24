const axios = require('axios');
const CLICKPOST_BASE_URL = process.env.CLICKPOST_BASE_URL || 'https://api.clickpost.in';

function getClickpostCredentials(seller) {
  const apiKey = (seller && seller.clickpostApiKey) || process.env.CLICKPOST_API_KEY || '';
  const username = (seller && seller.clickpostUsername) || process.env.CLICKPOST_USERNAME || '';
  return { apiKey, username };
}

async function createClickpostOrder({ orderId, customOrderId, customerName, customerPhone, customerEmail, shippingAddress, items, totalAmount, paymentMode, pickupAddress, seller }) {
  paymentMode = paymentMode || 'prepaid';
  const { apiKey, username } = getClickpostCredentials(seller);
  if (!apiKey || !username) {
    const mockAwb = 'CP' + Date.now().toString().slice(-8);
    return { success: true, isMock: true, provider: 'CLICKPOST', awbCode: mockAwb, courierName: 'ClickPost AI Carrier (Mock)', statusLabel: 'Order Created', trackingUrl: 'https://track.clickpost.ai/track/' + mockAwb };
  }
  try {
    const payload = {
      order_id: String(customOrderId || orderId),
      pickup_address: { name: (pickupAddress && pickupAddress.name) || (seller && seller.businessName) || 'Store', phone: (pickupAddress && pickupAddress.phone) || '9999999999', address: (pickupAddress && pickupAddress.address) || 'Store Street', pincode: (pickupAddress && pickupAddress.pincode) || '560001', city: (pickupAddress && pickupAddress.city) || 'Bengaluru', state: (pickupAddress && pickupAddress.state) || 'Karnataka', country: 'India' },
      delivery_address: { name: customerName, phone: customerPhone, email: customerEmail || 'customer@example.com', address: (shippingAddress && shippingAddress.address) || 'Delivery Address', pincode: (shippingAddress && shippingAddress.pincode) || '560001', city: (shippingAddress && shippingAddress.city) || 'Bengaluru', state: (shippingAddress && shippingAddress.state) || 'Karnataka', country: 'India' },
      order_type: (paymentMode.toLowerCase() === 'cod') ? 'COD' : 'PREPAID',
      cod_amount: (paymentMode.toLowerCase() === 'cod') ? (Number(totalAmount) || 0) : 0,
      invoice_value: Number(totalAmount) || 0,
      items: (items || []).map(function(item) { return { sku: String((item.productId || item._id) || 'SKU'), description: item.productTitle || item.name || 'Item', quantity: Math.max(1, Number(item.quantity) || 1), price: Number(item.price) || 0 }; }),
    };
    const response = await axios.post(CLICKPOST_BASE_URL + '/api/v1/orders-create/', payload, { params: { key: apiKey, username: username }, headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    const data = (response.data && response.data.result) || response.data;
    const waybill = (data && data.waybill) || (data && data.awb_code) || (data && data.awb) || '';
    return { success: true, provider: 'CLICKPOST', awbCode: waybill, courierPartnerId: (data && data.courier_partner_id) || null, courierName: (data && data.courier_name) || 'ClickPost Carrier', statusLabel: (data && data.status) || 'Order Created', trackingUrl: waybill ? 'https://track.clickpost.ai/track/' + waybill : '', raw: response.data };
  } catch (error) {
    console.error('[ClickPost Create Order Error]', (error.response && error.response.data) || error.message);
    return { success: false, error: ((error.response && error.response.data && error.response.data.meta && error.response.data.meta.message) || (error.response && error.response.data && error.response.data.message)) || error.message || 'Failed to create ClickPost order' };
  }
}

async function trackClickpostShipment({ awbCode, courierPartnerId, seller }) {
  const { apiKey, username } = getClickpostCredentials(seller);
  if (!apiKey || !username) {
    return { success: true, isMock: true, currentStatus: 'IN_TRANSIT', statusLabel: 'In Transit', scans: [{ status: 'ORDER_CREATED', activity: 'Order Created in ClickPost', location: 'Store', date: new Date() }] };
  }
  try {
    const response = await axios.get(CLICKPOST_BASE_URL + '/api/v2/track-order/', { params: { key: apiKey, username: username, waybill: awbCode, cp_id: courierPartnerId || '' }, timeout: 10000 });
    const result = (response.data && response.data.result) || {};
    return { success: true, currentStatus: (result.latest_status && result.latest_status.status) || 'IN_TRANSIT', statusLabel: (result.latest_status && result.latest_status.status_description) || 'In Transit', scans: (result.scans || []).map(function(s) { return { status: s.status, activity: s.remark || s.status_description, location: s.location || '', date: s.timestamp ? new Date(s.timestamp) : new Date() }; }), raw: response.data };
  } catch (error) {
    console.error('[ClickPost Tracking Error]', (error.response && error.response.data) || error.message);
    return { success: false, error: ((error.response && error.response.data && error.response.data.meta && error.response.data.meta.message)) || error.message || 'Failed to fetch ClickPost tracking' };
  }
}

async function cancelClickpostShipment({ awbCode, courierPartnerId, reason, seller }) {
  reason = reason || 'Cancelled by seller';
  const { apiKey, username } = getClickpostCredentials(seller);
  if (!apiKey || !username) return { success: true, isMock: true };
  try {
    const response = await axios.post(CLICKPOST_BASE_URL + '/api/v1/cancel-order/', { waybill: awbCode, courier_partner_id: courierPartnerId || '', reason: reason }, { params: { key: apiKey, username: username }, headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[ClickPost Cancel Error]', (error.response && error.response.data) || error.message);
    return { success: false, error: ((error.response && error.response.data && error.response.data.meta && error.response.data.meta.message)) || error.message || 'Failed to cancel ClickPost order' };
  }
}

async function generateClickpostLabel({ awbCode, courierPartnerId, seller }) {
  const { apiKey, username } = getClickpostCredentials(seller);
  if (!apiKey || !username) return { success: true, isMock: true, labelUrl: 'https://clickpost.ai/mock_label_' + awbCode + '.pdf' };
  try {
    const response = await axios.get(CLICKPOST_BASE_URL + '/api/v1/order-label/', { params: { key: apiKey, username: username, waybill: awbCode, cp_id: courierPartnerId || '' }, timeout: 10000 });
    return { success: true, labelUrl: (response.data && response.data.result && response.data.result.label_url) || '', raw: response.data };
  } catch (error) {
    console.error('[ClickPost Label Error]', (error.response && error.response.data) || error.message);
    return { success: false, error: ((error.response && error.response.data && error.response.data.meta && error.response.data.meta.message)) || error.message || 'Failed to generate ClickPost label' };
  }
}

module.exports = { createClickpostOrder, trackClickpostShipment, cancelClickpostShipment, generateClickpostLabel };
