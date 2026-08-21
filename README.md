# Zensos 🛍️

**Your Store. Your Link. Your Sales.**

Zensos is a free platform for small sellers to create online stores, share links on WhatsApp, accept UPI payments, and manage orders.

## ✨ Features
- Phone OTP login & store registration
- Manage products with images, variants, categories, MRP, and selling price
- Public shareable store link (`/store/my-shop`)
- Accept UPI payments (QR & deep-link) with payment screenshot verification
- Order management & status tracking
- Store customisation (banners, social links, delivery charges)
- Sales reports & CSV export

## 🛠️ Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express 5, MongoDB
- **Storage:** Cloudflare R2

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 2. Environment Variables
Create `.env` in both `client` and `server` folders based on `.env.example`.

**`server/.env`:**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_PUBLIC_BUCKET_NAME=zensos-public
R2_PRIVATE_BUCKET_NAME=zensos-private
R2_PUBLIC_DOMAIN=https://pub-yourdomain.r2.dev
```

**`client/.env`:**
```env
VITE_API_BASE_URL=/api
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

**Access the App:** `http://localhost:5173`
