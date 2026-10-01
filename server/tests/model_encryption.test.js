const assert = require("assert");
const Seller = require("../src/models/Seller");
const Order = require("../src/models/Order");
const ParentOrder = require("../src/models/ParentOrder");
const CustomerOtp = require("../src/models/CustomerOtp");
const RegistrationLead = require("../src/models/RegistrationLead");
const { isEncrypted, phoneHash, emailHash } = require("../src/utils/encryption");

async function runModelTests() {
  console.log("Running Mongoose Schema Encryption Tests...\n");
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Seller Model
  await test("Seller schema encrypts sensitive fields and computes blind index hashes", async () => {
    const rawPhone = "9876543210";
    const rawEmail = "seller@example.com";
    const rawAddress = "123 Market Street, Bengaluru";
    const rawUpi = "seller@upi";

    const seller = new Seller({
      slug: "test-seller",
      businessName: "Test Seller Store",
      phone: rawPhone,
      businessEmail: rawEmail,
      businessAddress: rawAddress,
      upiId: rawUpi,
      whatsappNumber: rawPhone,
      callNumber: rawPhone,
    });

    await seller.validate();

    // Check underlying raw storage is encrypted
    const rawDoc = seller._doc;
    assert.strictEqual(isEncrypted(rawDoc.phone), true, "Raw phone should be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.businessEmail), true, "Raw businessEmail should be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.businessAddress), true, "Raw businessAddress should be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.upiId), true, "Raw upiId should be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.whatsappNumber), true, "Raw whatsappNumber should be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.callNumber), true, "Raw callNumber should be encrypted");

    // Hashes
    assert.strictEqual(seller.phoneHash, phoneHash(rawPhone));
    assert.strictEqual(seller.businessEmailHash, emailHash(rawEmail));

    // Check getter returns cleartext
    assert.strictEqual(seller.phone, rawPhone);
    assert.strictEqual(seller.businessEmail, rawEmail);
    assert.strictEqual(seller.businessAddress, rawAddress);
    assert.strictEqual(seller.upiId, rawUpi);
    assert.strictEqual(seller.whatsappNumber, rawPhone);
    assert.strictEqual(seller.callNumber, rawPhone);

    // Check toObject() / toJSON() returns cleartext
    const plainObj = seller.toObject();
    assert.strictEqual(plainObj.phone, rawPhone);
    assert.strictEqual(plainObj.businessEmail, rawEmail);
    assert.strictEqual(plainObj.businessAddress, rawAddress);
    assert.strictEqual(plainObj.upiId, rawUpi);
  });

  // 2. Order Model
  await test("Order schema encrypts customer name, phone, email, and addresses", async () => {
    const rawName = "John Customer";
    const rawPhone = "9123456780";
    const rawEmail = "john@customer.com";
    const rawAddress = "House 101, Indiranagar, Bengaluru";

    const order = new Order({
      seller: "60c72b2f9b1d8b0015f8b9a1",
      customerName: rawName,
      customerPhone: rawPhone,
      customerEmail: rawEmail,
      deliveryAddress: rawAddress,
      billingAddress: rawAddress,
      shippingAddress: rawAddress,
      shippingCustomerName: rawName,
      shippingCustomerPhone: rawPhone,
      amount: 1500,
    });

    await order.validate();

    const rawDoc = order._doc;
    assert.strictEqual(isEncrypted(rawDoc.customerName), true, "customerName must be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.customerPhone), true, "customerPhone must be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.customerEmail), true, "customerEmail must be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.deliveryAddress), true, "deliveryAddress must be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.billingAddress), true, "billingAddress must be encrypted");
    assert.strictEqual(isEncrypted(rawDoc.shippingAddress), true, "shippingAddress must be encrypted");

    // Hashes
    assert.strictEqual(order.customerPhoneHash, phoneHash(rawPhone));
    assert.strictEqual(order.customerEmailHash, emailHash(rawEmail));

    // Getters and toObject
    const obj = order.toObject();
    assert.strictEqual(obj.customerName, rawName);
    assert.strictEqual(obj.customerPhone, rawPhone);
    assert.strictEqual(obj.customerEmail, rawEmail);
    assert.strictEqual(obj.deliveryAddress, rawAddress);
  });

  // 3. ParentOrder Model
  await test("ParentOrder schema encrypts customer details and addresses", async () => {
    const rawName = "Jane Buyer";
    const rawPhone = "9988776655";
    const rawEmail = "jane@buyer.com";
    const rawAddress = "404 Tech Park, Whitefield, Bengaluru";

    const parentOrder = new ParentOrder({
      razorpayOrderId: "order_test_123",
      customerName: rawName,
      customerPhone: rawPhone,
      customerEmail: rawEmail,
      deliveryAddress: rawAddress,
      totalAmountPaise: 200000,
    });

    await parentOrder.validate();

    const rawDoc = parentOrder._doc;
    assert.strictEqual(isEncrypted(rawDoc.customerName), true);
    assert.strictEqual(isEncrypted(rawDoc.customerPhone), true);
    assert.strictEqual(isEncrypted(rawDoc.customerEmail), true);
    assert.strictEqual(isEncrypted(rawDoc.deliveryAddress), true);

    // Hashes
    assert.strictEqual(parentOrder.customerPhoneHash, phoneHash(rawPhone));
    assert.strictEqual(parentOrder.customerEmailHash, emailHash(rawEmail));

    assert.strictEqual(parentOrder.customerName, rawName);
    assert.strictEqual(parentOrder.customerPhone, rawPhone);
    assert.strictEqual(parentOrder.customerEmail, rawEmail);
    assert.strictEqual(parentOrder.deliveryAddress, rawAddress);
  });

  // 4. CustomerOtp Model
  await test("CustomerOtp schema encrypts customer phone & email and hashes on validate", async () => {
    const rawPhone = "9876501234";
    const rawEmail = "otpuser@example.com";

    const otpDoc = new CustomerOtp({
      sellerId: "60c72b2f9b1d8b0015f8b9a1",
      customerPhone: rawPhone,
      customerEmail: rawEmail,
      hashedOtp: "dummy_hashed_otp",
      expiresAt: new Date(Date.now() + 600000),
    });

    await otpDoc.validate();

    assert.strictEqual(isEncrypted(otpDoc._doc.customerPhone), true);
    assert.strictEqual(isEncrypted(otpDoc._doc.customerEmail), true);
    assert.strictEqual(otpDoc.customerPhoneHash, phoneHash(rawPhone));
    assert.strictEqual(otpDoc.customerEmailHash, emailHash(rawEmail));
    assert.strictEqual(otpDoc.customerPhone, rawPhone);
    assert.strictEqual(otpDoc.customerEmail, rawEmail);
  });

  // 5. RegistrationLead Model
  await test("RegistrationLead schema encrypts phone & email and hashes on validate", async () => {
    const rawEmail = "lead@example.com";
    const rawPhone = "+919876543210";

    const lead = new RegistrationLead({
      email: rawEmail,
      phone: rawPhone,
    });

    await lead.validate();

    assert.strictEqual(isEncrypted(lead._doc.email), true);
    assert.strictEqual(isEncrypted(lead._doc.phone), true);
    assert.strictEqual(lead.emailHash, emailHash(rawEmail));
    assert.strictEqual(lead.phoneHash, phoneHash(rawPhone));
    assert.strictEqual(lead.email, rawEmail);
    assert.strictEqual(lead.phone, rawPhone);
  });

  console.log(`\nModel Tests Completed: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runModelTests();
