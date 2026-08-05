const express = require("express");
const auth = require("../middleware/auth");
const {
  generateUploadPresignedUrl,
  generateViewPresignedUrl,
  deleteR2Object,
} = require("../utils/r2Storage");

const router = express.Router();

/**
 * POST /api/upload/presigned-url
 * Generate a Cloudflare R2 presigned PUT URL for direct client upload.
 */
router.post("/presigned-url", auth, async (req, res) => {
  try {
    const { folder = "products", fileName = "image.jpg", fileType = "image/jpeg", isPrivate = false } = req.body;

    const result = await generateUploadPresignedUrl({
      folder,
      fileName,
      contentType: fileType,
      isPrivate: Boolean(isPrivate),
    });

    return res.json(result);
  } catch (error) {
    console.error("[POST /upload/presigned-url error]", error);
    return res.status(500).json({ message: "Failed to generate presigned upload URL" });
  }
});

/**
 * DELETE /api/upload/file
 * Delete an object from Cloudflare R2 bucket.
 */
router.delete("/file", auth, async (req, res) => {
  try {
    const { key, isPrivate = false } = req.body;
    if (!key) {
      return res.status(400).json({ message: "Key parameter is required" });
    }

    const success = await deleteR2Object({ key, isPrivate: Boolean(isPrivate) });
    return res.json({ success, message: success ? "File deleted successfully" : "Failed to delete file" });
  } catch (error) {
    console.error("[DELETE /upload/file error]", error);
    return res.status(500).json({ message: "Unable to delete file from storage" });
  }
});

/**
 * GET /api/upload/kyc-view-url (Admin/Auth)
 * Generate a 15-minute expiring view URL for private KYC documents.
 */
router.get("/kyc-view-url", auth, async (req, res) => {
  try {
    const { key } = req.query;
    if (!key || typeof key !== "string") {
      return res.status(400).json({ message: "Document key is required" });
    }

    const viewUrl = await generateViewPresignedUrl({ key, expiresIn: 900 });
    return res.json({ viewUrl });
  } catch (error) {
    console.error("[GET /upload/kyc-view-url error]", error);
    return res.status(500).json({ message: "Unable to generate document view link" });
  }
});

module.exports = router;
