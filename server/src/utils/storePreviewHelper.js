const Seller = require("../models/Seller");

function isSocialCrawler(userAgent = "") {
  return /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|bingbot|googlebot|pinterest|skypeuripreview/i.test(
    userAgent
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStorePreviewHtml(seller) {
  const storeTitle = seller.businessName
    ? (seller.businessCategory ? `${seller.businessName} - ${seller.businessCategory}` : `${seller.businessName} - Online Store`)
    : "Online Store";

  const descriptionText = seller.businessName
    ? `Shop online from ${seller.businessName}${seller.businessCategory ? ` for ${seller.businessCategory.toLowerCase()}` : ""}.${seller.categories && seller.categories.length > 0 ? ` Explore ${seller.categories.slice(0, 4).join(", ")}.` : ""} Order directly with fast delivery and secure checkout.`
    : "Order directly from our online store with fast delivery and secure checkout.";

  const storeUrl = `https://www.zensos.in/store/${seller.slug}`;
  let imageUrl = String(seller.businessLogo || seller.banners?.[0]?.imageUrl || seller.profileImageUrl || "https://www.zensos.in/zensos-logo.png").trim();
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    imageUrl = `https://www.zensos.in${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  const safeTitle = escapeHtml(storeTitle);
  const safeDesc = escapeHtml(descriptionText);
  const safeImage = escapeHtml(imageUrl);
  const safeUrl = escapeHtml(storeUrl);
  const safeName = escapeHtml(seller.businessName || "Online Store");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#ff751f">

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${safeName}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:secure_url" content="${safeImage}">
  <meta property="og:url" content="${safeUrl}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">

  <meta http-equiv="refresh" content="0;url=${safeUrl}">
</head>
<body style="font-family:sans-serif;padding:24px;text-align:center;color:#334155;">
  <h2>${safeTitle}</h2>
  <p>${safeDesc}</p>
  <p><a href="${safeUrl}" style="color:#ff751f;font-weight:bold;">Click here if not redirected automatically</a></p>
  <script>window.location.href = "${storeUrl}";</script>
</body>
</html>`;
}

module.exports = {
  isSocialCrawler,
  renderStorePreviewHtml,
};
