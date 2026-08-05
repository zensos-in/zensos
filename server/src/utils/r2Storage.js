const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

let r2Client = null;

function getR2Client() {
  if (!r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    r2Client = new S3Client({
      region: "auto",
      endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "https://dummy.r2.cloudflarestorage.com",
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
    });
  }
  return r2Client;
}

/**
 * Extract an R2 object key from a full URL or return as-is if already a key.
 */
function extractKeyFromUrl(urlOrKey) {
  if (!urlOrKey || typeof urlOrKey !== "string") return null;
  if (!urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://")) {
    return urlOrKey;
  }
  try {
    const parsed = new URL(urlOrKey);
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

/**
 * Generate a Presigned Upload (PUT) URL for direct Cloudflare R2 upload.
 */
async function generateUploadPresignedUrl({
  folder = "uploads",
  fileName = "file.jpg",
  contentType = "image/jpeg",
  isPrivate = false,
}) {
  const s3 = getR2Client();
  const bucketName = isPrivate
    ? process.env.R2_PRIVATE_BUCKET_NAME || "zensos-private-kyc"
    : process.env.R2_PUBLIC_BUCKET_NAME || "zensos-public";

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg";
  const sanitizedFolder = folder.replace(/^\/+|\/+$/g, "");
  const uniqueKey = `${sanitizedFolder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

  let publicUrl = "";
  if (!isPrivate) {
    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/$/, "");
    if (publicDomain) {
      publicUrl = `${publicDomain}/${uniqueKey}`;
    } else {
      const accountId = process.env.R2_ACCOUNT_ID;
      publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${uniqueKey}`;
    }
  }

  return {
    uploadUrl,
    key: uniqueKey,
    publicUrl,
    isPrivate,
    bucketName,
  };
}

/**
 * Generate a Presigned View (GET) URL for private KYC documents.
 */
async function generateViewPresignedUrl({ key, expiresIn = 900 }) {
  const extractedKey = extractKeyFromUrl(key);
  if (!extractedKey) return "";

  const s3 = getR2Client();
  const bucketName = process.env.R2_PRIVATE_BUCKET_NAME || "zensos-private-kyc";

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: extractedKey,
  });

  return await getSignedUrl(s3, command, { expiresIn });
}

/**
 * Delete a single object from Cloudflare R2.
 */
async function deleteR2Object({ key, isPrivate = false }) {
  const extractedKey = extractKeyFromUrl(key);
  if (!extractedKey) return false;

  try {
    const s3 = getR2Client();
    const bucketName = isPrivate
      ? process.env.R2_PRIVATE_BUCKET_NAME || "zensos-private-kyc"
      : process.env.R2_PUBLIC_BUCKET_NAME || "zensos-public";

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: extractedKey,
    });

    await s3.send(command);
    return true;
  } catch (err) {
    console.error("[r2Storage delete error]", err);
    return false;
  }
}

/**
 * Delete multiple objects from Cloudflare R2 in a single batch request.
 */
async function deleteR2Objects({ keys = [], isPrivate = false }) {
  const validKeys = keys.map(extractKeyFromUrl).filter(Boolean);
  if (validKeys.length === 0) return true;

  try {
    const s3 = getR2Client();
    const bucketName = isPrivate
      ? process.env.R2_PRIVATE_BUCKET_NAME || "zensos-private-kyc"
      : process.env.R2_PUBLIC_BUCKET_NAME || "zensos-public";

    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: validKeys.map((k) => ({ Key: k })),
      },
    });

    await s3.send(command);
    return true;
  } catch (err) {
    console.error("[r2Storage bulk delete error]", err);
    return false;
  }
}

module.exports = {
  generateUploadPresignedUrl,
  generateViewPresignedUrl,
  deleteR2Object,
  deleteR2Objects,
  extractKeyFromUrl,
};
