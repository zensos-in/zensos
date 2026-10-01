const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

// Derives a robust key if the hex key isn't provided or is invalid
function deriveFallbackKey() {
  return crypto.scryptSync(
    process.env.JWT_SECRET || "zensos_market_dev_encryption_secret_phrase",
    "zensos_financial_salt_123",
    32
  );
}

function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY || process.env.FINANCIAL_ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    try {
      return Buffer.from(envKey, "hex");
    } catch (e) {
      console.warn("Invalid ENCRYPTION_KEY format. Using fallback derivation.");
    }
  }
  // Safe developer fallback using a deterministic scrypt derivation
  return deriveFallbackKey();
}

function getBlindIndexSecret() {
  return (
    process.env.BLIND_INDEX_SECRET ||
    process.env.JWT_SECRET ||
    "zensos_blind_index_default_secret_seed"
  );
}

const KEY = getEncryptionKey();

const HEX_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Checks if a value is already encrypted in the `iv:authTag:cipherText` format.
 * @param {*} value
 * @returns {boolean}
 */
function isEncrypted(value) {
  if (typeof value !== "string") return false;
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  const [ivHex, tagHex, cipherHex] = parts;
  return (
    ivHex.length === 24 &&
    tagHex.length === 32 &&
    cipherHex.length > 0 &&
    HEX_REGEX.test(ivHex) &&
    HEX_REGEX.test(tagHex) &&
    HEX_REGEX.test(cipherHex)
  );
}

/**
 * Encrypts cleartext into a colon-separated string: iv:authTag:cipherText (AES-256-GCM)
 * If the value is already encrypted, it returns the value directly to prevent double-encryption.
 * @param {string} text - Cleartext to encrypt
 * @returns {string} - Encrypted string format
 */
function encrypt(text) {
  if (text === null || text === undefined || text === "") return text;
  const str = String(text);
  if (isEncrypted(str)) return str;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(str, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptWithKey(cipherText, key) {
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    // Return cleartext directly for legacy unencrypted database support
    return cipherText;
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = Buffer.from(parts[2], "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Decrypts an encrypted format: iv:authTag:cipherText back into cleartext
 * If the value is not in encrypted format (e.g. legacy cleartext), returns the value as-is.
 * @param {string} cipherText - Encrypted format string or unencrypted string
 * @returns {string} - Decrypted cleartext
 */
function decrypt(cipherText) {
  if (cipherText === null || cipherText === undefined || cipherText === "") return cipherText;
  const str = String(cipherText);
  if (!isEncrypted(str)) return str;

  try {
    return decryptWithKey(str, KEY);
  } catch (error) {
    try {
      const fallbackKey = deriveFallbackKey();
      if (!KEY.equals(fallbackKey)) {
        return decryptWithKey(str, fallbackKey);
      }
    } catch (_fallbackError) {
      // Keep the original error in logs below.
    }

    console.error("Decryption failed:", error.message);
    return ""; // Return empty string on failure to protect logic stability
  }
}

/**
 * Normalizes phone numbers for blind index hashing (standard 10 digits).
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Normalizes emails for blind index hashing (trimmed lowercase).
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Generates an HMAC-SHA256 blind index hash for exact-match database lookups.
 * @param {string} value
 * @returns {string}
 */
function hashBlindIndex(value) {
  if (value === null || value === undefined || value === "") return "";
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return "";
  return crypto.createHmac("sha256", getBlindIndexSecret()).update(normalized).digest("hex");
}

/**
 * Generates a blind index hash for phone numbers.
 * @param {string} phone
 * @returns {string}
 */
function phoneHash(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return "";
  return crypto.createHmac("sha256", getBlindIndexSecret()).update(`phone:${normalized}`).digest("hex");
}

/**
 * Generates a blind index hash for email addresses.
 * @param {string} email
 * @returns {string}
 */
function emailHash(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "";
  return crypto.createHmac("sha256", getBlindIndexSecret()).update(`email:${normalized}`).digest("hex");
}

/**
 * Helper to decrypt specific fields in an object (useful for lean queries or plain objects).
 * @param {Object} obj
 * @param {string[]} fields
 * @returns {Object}
 */
function decryptObject(obj, fields = []) {
  if (!obj || typeof obj !== "object") return obj;
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  normalizePhone,
  normalizeEmail,
  hashBlindIndex,
  phoneHash,
  emailHash,
  decryptObject,
};
