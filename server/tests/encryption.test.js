const assert = require("assert");
const {
  encrypt,
  decrypt,
  isEncrypted,
  normalizePhone,
  normalizeEmail,
  hashBlindIndex,
  phoneHash,
  emailHash,
  decryptObject,
} = require("../src/utils/encryption");

function runTests() {
  console.log("Running Encryption Utility Tests...\n");
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Basic Encryption & Decryption
  test("Encrypts and decrypts regular strings (AES-256-GCM)", () => {
    const plain = "Jane Doe";
    const encrypted = encrypt(plain);
    assert.notStrictEqual(encrypted, plain);
    assert.strictEqual(isEncrypted(encrypted), true);
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, plain);
  });

  // 2. Encryption format
  test("Encrypted string matches iv:authTag:cipherText format", () => {
    const encrypted = encrypt("1234567890");
    const parts = encrypted.split(":");
    assert.strictEqual(parts.length, 3);
    assert.strictEqual(parts[0].length, 24); // 12 bytes IV
    assert.strictEqual(parts[1].length, 32); // 16 bytes AuthTag
    assert.ok(parts[2].length > 0); // Ciphertext
  });

  // 3. Random IV per encryption (non-deterministic ciphertext)
  test("Produces different ciphertext for the same plaintext on each call", () => {
    const plain = "same-secret-text";
    const enc1 = encrypt(plain);
    const enc2 = encrypt(plain);
    assert.notStrictEqual(enc1, enc2);
    assert.strictEqual(decrypt(enc1), plain);
    assert.strictEqual(decrypt(enc2), plain);
  });

  // 4. Double encryption prevention
  test("Does not double-encrypt an already encrypted string", () => {
    const plain = "secret-phone-number";
    const enc1 = encrypt(plain);
    const enc2 = encrypt(enc1);
    assert.strictEqual(enc1, enc2);
    assert.strictEqual(decrypt(enc2), plain);
  });

  // 5. Legacy cleartext handling
  test("Decrypt handles unencrypted legacy text gracefully", () => {
    const legacyText = "9876543210";
    const result = decrypt(legacyText);
    assert.strictEqual(result, legacyText);
  });

  // 6. Null / undefined / empty handling
  test("Handles null, undefined, and empty string safely", () => {
    assert.strictEqual(encrypt(""), "");
    assert.strictEqual(encrypt(null), null);
    assert.strictEqual(encrypt(undefined), undefined);
    assert.strictEqual(decrypt(""), "");
    assert.strictEqual(decrypt(null), null);
    assert.strictEqual(decrypt(undefined), undefined);
  });

  // 7. Special characters, Unicode, Multi-line addresses
  test("Correctly encrypts and decrypts Unicode, special characters, and multiline addresses", () => {
    const address = "Flat #402, 4th Floor, 'Green Heights', \nMG Road, Bengaluru - 560001, Karnataka. 🌟";
    const encrypted = encrypt(address);
    assert.strictEqual(decrypt(encrypted), address);
  });

  // 8. Tamper resistance
  test("Fails or handles tampered ciphertext safely", () => {
    const encrypted = encrypt("Super Secret");
    const parts = encrypted.split(":");
    // Tamper with the ciphertext byte
    const tamperedCipher = parts[2].slice(0, -2) + (parts[2].slice(-2) === "aa" ? "bb" : "aa");
    const tampered = `${parts[0]}:${parts[1]}:${tamperedCipher}`;
    const result = decrypt(tampered);
    // Should return empty string on tampering rather than crashing
    assert.strictEqual(result, "");
  });

  // 9. Phone normalization & blind index
  test("Phone normalization handles +91, spaces, dashes", () => {
    assert.strictEqual(normalizePhone("+91 98765 43210"), "9876543210");
    assert.strictEqual(normalizePhone("919876543210"), "9876543210");
    assert.strictEqual(normalizePhone("98765-43210"), "9876543210");
    assert.strictEqual(normalizePhone("9876543210"), "9876543210");
  });

  test("Phone blind index is deterministic across equivalent representations", () => {
    const hash1 = phoneHash("+91 98765 43210");
    const hash2 = phoneHash("9876543210");
    const hash3 = phoneHash("919876543210");
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash2, hash3);
    assert.strictEqual(hash1.length, 64);
  });

  // 10. Email normalization & blind index
  test("Email normalization handles uppercase and whitespace", () => {
    assert.strictEqual(normalizeEmail("  John.Doe@Example.COM  "), "john.doe@example.com");
  });

  test("Email blind index is deterministic across case variations", () => {
    const hash1 = emailHash("Test.User@example.com");
    const hash2 = emailHash("  test.user@example.com ");
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);
  });

  // 11. DecryptObject helper
  test("decryptObject decrypts specified fields in plain objects", () => {
    const obj = {
      name: encrypt("Alice"),
      email: encrypt("alice@example.com"),
      role: "customer",
      amount: 500,
    };
    const decryptedObj = decryptObject(obj, ["name", "email"]);
    assert.strictEqual(decryptedObj.name, "Alice");
    assert.strictEqual(decryptedObj.email, "alice@example.com");
    assert.strictEqual(decryptedObj.role, "customer");
    assert.strictEqual(decryptedObj.amount, 500);
  });

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
