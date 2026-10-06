/**
 * Predefined Trust Badges Generator & Templates
 * Generates vector SVG data URIs with rich styling, crisp typography, and high-DPI clarity.
 */

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export function generateMakeInIndiaBadge(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
  <defs>
    <linearGradient id="mii-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="mii-flag" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF9933"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#138808"/>
    </linearGradient>
    <filter id="mii-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>
  
  <rect x="2" y="2" width="236" height="66" rx="14" fill="url(#mii-bg)" stroke="#e2e8f0" stroke-width="1.5" filter="url(#mii-shadow)"/>
  
  <!-- Flag Stripe Accent on left -->
  <rect x="2" y="2" width="6" height="66" rx="3" fill="url(#mii-flag)"/>
  
  <!-- Emblem / Lion Icon Circle -->
  <circle cx="38" cy="35" r="22" fill="#fff7ed" stroke="#fdba74" stroke-width="1.5"/>
  <g transform="translate(24, 21) scale(0.95)">
    <!-- Chakra / Lion / Indian Emblem vector -->
    <path d="M14.5 3C8.7 3 4 7.7 4 13.5c0 4.1 2.3 7.6 5.7 9.3l.8-2.3c-2.4-1.2-4-3.7-4-6.6 0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5c0 2.9-1.6 5.4-4 6.6l.8 2.3c3.4-1.7 5.7-5.2 5.7-9.3C25 7.7 20.3 3 14.5 3z" fill="#ea580c"/>
    <circle cx="14.5" cy="13.5" r="4" fill="#0284c7"/>
    <path d="M14.5 6v15M7 13.5h15M9.2 8.2l10.6 10.6M9.2 18.8 19.8 8.2" stroke="#ffffff" stroke-width="1"/>
  </g>

  <!-- Typography -->
  <text x="68" y="28" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="1" fill="#ea580c">100% AUTHENTIC</text>
  <text x="68" y="44" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="0.5" fill="#0f172a">MAKE IN INDIA</text>
  <text x="68" y="56" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#16a34a">PROUDLY LOCAL</text>
</svg>`;
  return svgToDataUrl(svg);
}

export function generateSecuredCheckoutBadge(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
  <defs>
    <linearGradient id="sec-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </linearGradient>
    <linearGradient id="sec-shield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <filter id="sec-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>
  
  <rect x="2" y="2" width="236" height="66" rx="14" fill="url(#sec-bg)" stroke="#bbf7d0" stroke-width="1.5" filter="url(#sec-shadow)"/>
  
  <!-- Left Shield Icon -->
  <g transform="translate(18, 14)">
    <circle cx="21" cy="21" r="20" fill="#dcfce7"/>
    <path d="M21 7l11 4.5v9c0 8.5-4.8 14.5-11 16.5-6.2-2-11-8-11-16.5v-9L21 7z" fill="url(#sec-shield)"/>
    <path d="M16 20.5l3.5 3.5 7-7" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>

  <!-- Typography -->
  <text x="68" y="27" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.8" fill="#15803d">100% SAFE &amp; SECURE</text>
  <text x="68" y="44" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="0.4" fill="#0f172a">SECURED CHECKOUT</text>
  <text x="68" y="56" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#64748b">256-BIT SSL ENCRYPTION</text>
</svg>`;
  return svgToDataUrl(svg);
}

export function generateCodAvailableBadge(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
  <defs>
    <linearGradient id="cod-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eff6ff"/>
    </linearGradient>
    <linearGradient id="cod-icon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <filter id="cod-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>
  
  <rect x="2" y="2" width="236" height="66" rx="14" fill="url(#cod-bg)" stroke="#bfdbfe" stroke-width="1.5" filter="url(#cod-shadow)"/>
  
  <!-- Cash & Hand Icon -->
  <g transform="translate(18, 14)">
    <circle cx="21" cy="21" r="20" fill="#dbeafe"/>
    <!-- Banknote / Rupee Box -->
    <rect x="10" y="11" width="22" height="15" rx="3" fill="url(#cod-icon)"/>
    <circle cx="21" cy="18.5" r="3.5" fill="#ffffff"/>
    <text x="21" y="21" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#1d4ed8" text-anchor="middle">₹</text>
    <!-- Hand receiving cash -->
    <path d="M8 29h8l4-2 6 1.5c1.5.4 2.5 1.8 2.5 3.3v.2H8v-3z" fill="#60a5fa"/>
  </g>

  <!-- Typography -->
  <text x="68" y="27" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.8" fill="#1d4ed8">PAY ON DELIVERY</text>
  <text x="68" y="44" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="0.4" fill="#0f172a">COD AVAILABLE</text>
  <text x="68" y="56" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#64748b">CASH / UPI AT DOORSTEP</text>
</svg>`;
  return svgToDataUrl(svg);
}

export function generateFreeShippingBadge(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
  <defs>
    <linearGradient id="fs-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fdf4ff"/>
    </linearGradient>
    <linearGradient id="fs-icon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#7e22ce"/>
    </linearGradient>
    <filter id="fs-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>
  
  <rect x="2" y="2" width="236" height="66" rx="14" fill="url(#fs-bg)" stroke="#f0abfc" stroke-width="1.5" filter="url(#fs-shadow)"/>
  
  <!-- Fast Truck Icon -->
  <g transform="translate(18, 14)">
    <circle cx="21" cy="21" r="20" fill="#f3e8ff"/>
    <g transform="translate(9, 10)">
      <!-- Truck Body -->
      <path d="M2 4h14v12H2z" fill="url(#fs-icon)"/>
      <path d="M16 7h5l3 4.5V16h-8V7z" fill="#9333ea"/>
      <!-- Speed motion lines -->
      <line x1="0" y1="6" x2="3" y2="6" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-1" y1="10" x2="2" y2="10" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Wheels -->
      <circle cx="6" cy="17" r="3" fill="#334155"/>
      <circle cx="6" cy="17" r="1" fill="#ffffff"/>
      <circle cx="19" cy="17" r="3" fill="#334155"/>
      <circle cx="19" cy="17" r="1" fill="#ffffff"/>
    </g>
  </g>

  <!-- Typography -->
  <text x="68" y="27" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.8" fill="#7e22ce">FAST &amp; RELIABLE</text>
  <text x="68" y="44" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="0.4" fill="#0f172a">FREE SHIPPING</text>
  <text x="68" y="56" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#64748b">DELIVERY ALL OVER INDIA</text>
</svg>`;
  return svgToDataUrl(svg);
}

export function generateFssaiBadge(licenseNumber = ""): string {
  const cleanLic = (licenseNumber || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  const licDisplay = cleanLic ? `Lic. No: ${cleanLic}` : "FOOD SAFETY CERTIFIED";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 70" width="250" height="70">
  <defs>
    <linearGradient id="fssai-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fffbeb"/>
    </linearGradient>
    <filter id="fssai-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>
  
  <rect x="2" y="2" width="246" height="66" rx="14" fill="url(#fssai-bg)" stroke="#fde68a" stroke-width="1.5" filter="url(#fssai-shadow)"/>
  
  <!-- FSSAI Logo Area -->
  <g transform="translate(14, 15)">
    <rect x="0" y="0" width="54" height="40" rx="8" fill="#ffffff" stroke="#f59e0b" stroke-width="1"/>
    <!-- fssai wordmark logo stylized -->
    <text x="27" y="24" font-family="Arial Black, Impact, system-ui, sans-serif" font-size="14" font-weight="900" font-style="italic" fill="#003399" text-anchor="middle" letter-spacing="-0.5">
      fssai
    </text>
    <path d="M6 31 C 18 27, 36 27, 48 31" stroke="#f59e0b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>

  <!-- Typography -->
  <text x="76" y="25" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" letter-spacing="0.8" fill="#d97706">STANDARDS &amp; QUALITY</text>
  <text x="76" y="42" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="900" letter-spacing="0.3" fill="#0f172a">FSSAI CERTIFIED</text>
  <text x="76" y="56" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="${cleanLic.length > 13 ? 8 : 9}" font-weight="700" fill="#003399" font-mono="true">${licDisplay}</text>
</svg>`;
  return svgToDataUrl(svg);
}

export interface PredefinedBadgeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  badgeType: "make_in_india" | "secured_checkout" | "cod_available" | "free_shipping" | "fssai";
  hasInput?: boolean;
  inputPlaceholder?: string;
  inputLabel?: string;
}

export const PREDEFINED_BADGES: PredefinedBadgeTemplate[] = [
  {
    id: "make_in_india",
    name: "Make In India",
    description: "100% Authentic Indian-made quality assurance",
    icon: "🇮🇳",
    badgeType: "make_in_india",
  },
  {
    id: "secured_checkout",
    name: "Secured Checkout",
    description: "100% Safe 256-Bit SSL Encrypted checkout guarantee",
    icon: "🔒",
    badgeType: "secured_checkout",
  },
  {
    id: "cod_available",
    name: "COD Available",
    description: "Cash on Delivery / Pay on Delivery support",
    icon: "💵",
    badgeType: "cod_available",
  },
  {
    id: "free_shipping",
    name: "Free Shipping",
    description: "Fast and reliable free delivery across India",
    icon: "🚚",
    badgeType: "free_shipping",
  },
  {
    id: "fssai",
    name: "FSSAI Food Safety",
    description: "Official Food Safety Standards certification badge with custom license number",
    icon: "🛡️",
    badgeType: "fssai",
    hasInput: true,
    inputLabel: "14-digit FSSAI License Number",
    inputPlaceholder: "e.g. 11223344556677",
  },
];
