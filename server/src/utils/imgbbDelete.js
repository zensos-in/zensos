/**
 * imgbbDelete.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Best-effort ImgBB image deletion helper.
 *
 * ImgBB does not publish an official delete API.  The community-discovered
 * approach is to POST to https://ibb.co/json with the image id + hash that
 * are embedded inside the `delete_url` returned at upload time.
 *
 * Delete URL format:  https://ibb.co/delete/<hash>/image/<id>
 *   OR (older):       https://ibb.co/<id>/<hash>
 *
 * Usage:
 *   const { deleteImgbbImages } = require("../utils/imgbbDelete");
 *   await deleteImgbbImages(["https://ibb.co/delete/abc123/image/xyz789", ...]);
 *
 * ⚠️  This method is unofficial and may stop working without notice.
 *     Failures are logged but never throw — the main deletion flow always
 *     continues regardless of ImgBB cleanup success.
 */

const https = require("https");

/**
 * Parse the image ID and delete hash from an ImgBB delete_url.
 * Returns null if the URL cannot be parsed.
 *
 * Supported formats:
 *   https://ibb.co/delete/<hash>/image/<id>
 *   https://ibb.co/<id>/<hash>          (legacy viewer URL)
 */
function parseImgbbDeleteUrl(deleteUrl) {
  if (!deleteUrl || typeof deleteUrl !== "string") return null;

  try {
    const url = new URL(deleteUrl);
    if (!url.hostname.includes("ibb.co")) return null;

    const parts = url.pathname.split("/").filter(Boolean);

    // Format: /delete/<hash>/image/<id>
    if (parts[0] === "delete" && parts[2] === "image" && parts[1] && parts[3]) {
      return { id: parts[3], hash: parts[1] };
    }

    // Fallback: /<id>/<hash>
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { id: parts[0], hash: parts[1] };
    }
  } catch {
    // Invalid URL — ignore
  }

  return null;
}

/**
 * Send a single delete request to ImgBB using Node's built-in https module
 * (avoids adding a new dependency).
 */
function sendImgbbDeleteRequest(id, hash) {
  return new Promise((resolve) => {
    const boundary = "----ImgBBDeleteBoundary" + Date.now();
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="action"',
      "",
      "delete",
      `--${boundary}`,
      'Content-Disposition: form-data; name="delete"',
      "",
      "image",
      `--${boundary}`,
      'Content-Disposition: form-data; name="deleting[id]"',
      "",
      id,
      `--${boundary}`,
      'Content-Disposition: form-data; name="deleting[hash]"',
      "",
      hash,
      `--${boundary}--`,
    ].join("\r\n");

    const options = {
      hostname: "ibb.co",
      path: "/json",
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "Mozilla/5.0",
      },
    };

    const req = https.request(options, (res) => {
      res.resume(); // drain the response body
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
    });

    req.on("error", (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });

    req.write(body);
    req.end();
  });
}

/**
 * Delete multiple ImgBB images by their delete_url strings.
 * Runs all deletions in parallel.  Failures are logged but never thrown.
 *
 * @param {string[]} deleteUrls - Array of ImgBB delete_url values
 */
async function deleteImgbbImages(deleteUrls) {
  if (!Array.isArray(deleteUrls) || deleteUrls.length === 0) return;

  const validTargets = deleteUrls
    .map((url) => {
      const parsed = parseImgbbDeleteUrl(url);
      if (!parsed) {
        // Silently skip unparseable URLs (pasted URLs, legacy data, etc.)
        return null;
      }
      return { url, ...parsed };
    })
    .filter(Boolean);

  if (validTargets.length === 0) return;

  const results = await Promise.allSettled(
    validTargets.map(({ id, hash, url }) =>
      sendImgbbDeleteRequest(id, hash).then((result) => {
        if (!result.ok) {
          console.warn(`[imgbbDelete] Failed to delete image (id=${id}):`, result.error || result.status);
        }
        return { url, ...result };
      })
    )
  );

  const failed = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value?.ok)
  ).length;

  if (failed > 0) {
    console.warn(`[imgbbDelete] ${failed}/${validTargets.length} image(s) could not be deleted from ImgBB.`);
  }
}

module.exports = { deleteImgbbImages, parseImgbbDeleteUrl };
