/**
 * imgbbDelete.js (Deprecated -> Cloudflare R2 Wrapper)
 * Retained for backward compatibility. Directs all deletion calls to deleteR2Objects.
 */

const { deleteR2Objects } = require("./r2Storage");

async function deleteImgbbImages(deleteUrls = []) {
  return await deleteR2Objects({ keys: deleteUrls });
}

function parseImgbbDeleteUrl(deleteUrl) {
  if (!deleteUrl || typeof deleteUrl !== "string") return null;
  return { id: deleteUrl, hash: deleteUrl };
}

module.exports = { deleteImgbbImages, parseImgbbDeleteUrl };
