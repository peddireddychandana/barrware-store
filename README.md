# Barware Store

A full-stack barware e-commerce site: a React (Vite + React Router) storefront (`client/`) backed by an Express + MongoDB API (`server/`). Prices are in INR. Customers pay by Cash on Delivery or by scanning a UPI QR code and paying the owner directly; an admin verifies each UPI payment.

## Folder structure

```
Barware-Store/
  client/                 React + Vite storefront (port 3000)
  server/                 Express API (port 5000)
    config/               env, db connection, store constants (shipping, kit tiers)
    controllers/          request handlers
    middleware/           auth/role guards, validation, uploads, error handler
    models/               User, Product, Category, Cart, Order, Review, Subscriber
    routes/               route table
    services/             pricing, cart, kit, orders, products, uploads
    seed/                 admin bootstrap (`npm run seed`)
    scripts/dev-db.js     zero-install local MongoDB (started automatically by the server)
    tests/                jest + supertest (mongodb-memory-server)
    uploads/              local image uploads (when Cloudinary is not configured)
```

## Quick start (two terminals)

Requires Node 20+ (developed on Node 24). The first run downloads a MongoDB binary once.

```bash
# terminal 1 - API (starts its own MongoDB and admin automatically)
cd server && npm install
npm run dev            # http://localhost:5000

# terminal 2 - storefront
cd client && npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
npm run dev            # http://localhost:3000
```

The API starts a persistent MongoDB on `127.0.0.1:27017` (data in `server/.mongo-data`) unless one is already running or `MONGO_URI` is set, and ensures the admin account exists. No separate DB or seed step is needed.

## MongoDB setup options

1. **Zero install:** the API starts a persistent MongoDB via `mongodb-memory-server` automatically. Data stays in `server/.mongo-data`. You can still run `npm run db` on its own if you prefer a dedicated terminal.
2. **Local mongod:** install MongoDB Community, start it, keep `MONGO_URI=mongodb://127.0.0.1:27017/barware-store`.
3. **Atlas:** create a cluster, allow your IP, set `MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/barware-store`.

## Environment variables

`server/.env` (copy from `server/.env.example`):

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (5000) |
| `NODE_ENV` | `development` / `production`. In `development` the forgot-password response includes `resetUrl` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (32+ chars required in production) |
| `JWT_EXPIRES_IN` | Token and cookie lifetime (`7d`) |
| `CLIENT_URL` | Allowed CORS origin (`http://localhost:3000`) |
| `SERVER_URL` | Public API URL used for absolute upload URLs (optional) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by the seed |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional. When all set, uploads go to Cloudinary; otherwise to `server/uploads` served at `/uploads` |
| `BREVO_API_KEY` / `RESEND_API_KEY` | Optional transactional email. Set **one**. Brevo free tier = 300 emails/day; Resend free tier = 3,000 emails/month. When neither is set, emails are skipped and logged only. |
| `MAIL_FROM`, `MAIL_FROM_NAME` | Sender address (must be verified with Brevo/Resend) and display name (default `VYRNT`). |
| `UPI_ID`, `UPI_PAYEE_NAME` | Your UPI ID (e.g. `yourname@okhdfcbank`) and the payee name shown in the customer's UPI app. When `UPI_ID` is blank, UPI is hidden at checkout and only COD is offered. |

`client/.env.local`: `VITE_API_URL=http://localhost:5000/api` plus optional `VITE_STORE_ADDRESS`, `VITE_STORE_PHONE`, `VITE_STORE_EMAIL`, `VITE_COMPANY_LEGAL_NAME`, `VITE_COMPANY_GSTIN`, `VITE_COMPANY_JURISDICTION` and `VITE_SUPPORT_HOURS` (used on the footer and legal pages).

## Admin account

The API ensures the admin account exists on startup in development. It seeds **no categories or products** — add those from the admin panel.

- Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env` (defaults: `admin@barware.test` / `Admin@12345`)
- Create or promote an admin manually: `npm run seed:admin` (or `npm run seed`, which does the same)
- Custom credentials: `npm run seed:admin -- --email you@example.com --password "YourPass123"`

Categories are managed in **Admin → Categories** (the **Add category** button creates new ones). To load or restore the 13 VYRNT catalog categories in any database, run:

```bash
cd server && npm run categories:sync
```

The sync is safe to re-run; it updates the 13 categories and remaps any legacy category products.

## Tests

```bash
cd server && npm test
```

Jest + supertest against an in-memory MongoDB (no external database needed).

## API

All responses use `{ success, data, message? }`; lists add `pagination: { page, limit, total, pages }`; errors are `{ success:false, message, errors? }`. Auth is an HTTP-only `token` cookie (a `Authorization: Bearer` header is also accepted).

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | public | |
| GET | `/api/payment/config` | public | `{ codEnabled, upiEnabled, upiId }` for checkout |
| POST | `/api/auth/register` | public | name, email, password, confirmPassword |
| POST | `/api/auth/login` | public | sets cookie |
| POST | `/api/auth/logout` | public | clears cookie |
| GET / PUT | `/api/auth/me` | user | PUT: name, phone, address |
| POST | `/api/auth/forgot-password` | public | link logged to console (no SMTP) |
| POST | `/api/auth/reset-password` | public | token, password, confirmPassword |
| GET | `/api/products` | public | search, category, productType, material, minPrice, maxPrice, sort, featured, bestSeller, premium, page, limit |
| GET | `/api/products/filters` | public | materials, productTypes, priceRange |
| GET | `/api/products/:idOrSlug` | public | includes relatedProducts |
| GET | `/api/products/:idOrSlug/reviews` | public | paginated |
| POST / PUT / DELETE | `/api/products`, `/api/products/:id` | admin | |
| GET | `/api/categories` | public | with productCount |
| POST / PUT / DELETE | `/api/categories`, `/api/categories/:id` | admin | delete blocked if in use |
| POST | `/api/uploads` | admin | multipart field `images`, jpg/png/webp up to 5MB |
| POST | `/api/newsletter` | public | idempotent |
| GET | `/api/reviews?limit=6` | public | latest reviews across products (max 20) |
| POST | `/api/reviews` | user | one per user per product |
| POST | `/api/cart/quote` | public | guest totals, nothing saved |
| GET / POST / DELETE | `/api/cart` | user | POST {productId, quantity}; DELETE clears |
| PUT / DELETE | `/api/cart/:productId` | user | PUT {quantity} (0 removes) |
| GET | `/api/kit/config` | public | slots, products, discount tiers |
| POST | `/api/kit/quote` | public | {items:[{slot, productId}]} |
| POST | `/api/cart/kit` | user | adds kit items under a shared kitId |
| POST | `/api/orders` | user | `paymentMethod` = `COD` or `UPI`, built from the server cart |
| GET | `/api/orders/my-orders` | user | |
| GET | `/api/orders/:id` | owner/admin | includes `upiUri` while a UPI order is unpaid |
| PUT | `/api/orders/:id/cancel` | owner | only while placed or confirmed |
| POST | `/api/orders/:id/payment` | owner | `{reference}` = UPI transaction/UTR ID |
| GET | `/api/admin/dashboard` | admin | |
| GET | `/api/admin/orders` | admin | status, page, limit |
| PUT | `/api/admin/orders/:id/status` | admin | {status, note} |
| PUT | `/api/admin/orders/:id/payment` | admin | {status: paid/failed, note} for UPI orders |
| GET | `/api/admin/customers` | admin | with orderCount, totalSpent |
| GET | `/api/admin/products` | admin | includes inactive |

Business rules: prices and totals are always computed on the server from the database; shipping is free at or above INR 999 after discounts, otherwise INR 79; kit discounts are 5/8/10/15% for 3/4/5/6 kit items; UPI orders start as `paymentStatus: pending` and are confirmed manually by an admin (`paid`/`failed`); dashboard `totalRevenue` counts delivered orders only (COD is collected on delivery), with open orders reported separately as `pendingRevenue`.

## Legal pages

The storefront includes Privacy, Terms of Service, Shipping and Returns & Refunds pages at `/privacy-policy`, `/terms`, `/shipping-policy` and `/refund-policy` (linked in the footer). Company details are filled from the `VITE_COMPANY_*` variables and the store contact variables; set them before launch.

## Images and store details

- Product, category and hero photos are in `client/public/images/`. They come from Wikimedia Commons; sources, authors and licences are in `client/public/images/IMAGES_CREDITS.md`. Several are CC BY or CC BY-SA, which require visible attribution on the site, and a few photos are weak matches for their product (replace them before launch).
- Products are added from the admin panel, with photos uploaded there (or to Cloudinary when configured). The files under `client/public/images/` are used by the storefront decorations and the test fixtures.
- Footer address, phone and email come from `VITE_STORE_ADDRESS`, `VITE_STORE_PHONE` and `VITE_STORE_EMAIL` in `client/.env.local` (see `client/.env.example`).

## Deploy to Render

Render hosts the two Node services (API and client). It does not host MongoDB, so the database goes on **MongoDB Atlas** (free M0 tier). The repo includes a `render.yaml` Blueprint that creates both services.

### 1. MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com.
2. Database Access: create a user with a password.
3. Network Access: add `0.0.0.0/0` (Render's outbound IPs change on the free plan).
4. Connect > Drivers: copy the connection string and add the database name, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/barware-store?retryWrites=true&w=majority`

### 2. Push the project to GitHub
```bash
cd Barware-Store
git init
git add .
git commit -m "Barware Store"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```
`.env` files are git-ignored; only the `.env.example` templates are committed.

### 3. Create the services on Render
Dashboard > **New > Blueprint** > select the repo. Render reads `render.yaml` and creates `barware-store-api` and `barware-store-client`. It asks for the values marked `sync: false`:

| Service | Variable | Value |
|---|---|---|
| api | `MONGO_URI` | the Atlas string from step 1 |
| api | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your admin login (choose a strong password) |
| api | `CLIENT_URL` | client URL, e.g. `https://barware-store-client.onrender.com` (no trailing slash) |
| api | `SERVER_URL` | API URL, e.g. `https://barware-store-api.onrender.com` |
| api | `UPI_ID` / `UPI_PAYEE_NAME` | your UPI ID (e.g. `yourname@okhdfcbank`) and payee name; leave `UPI_ID` blank to disable UPI |
| client | `VITE_API_URL` | API URL **plus `/api`**, e.g. `https://barware-store-api.onrender.com/api` |
| client | `VITE_STORE_ADDRESS` / `_PHONE` / `_EMAIL` | your store details |
| client | `VITE_COMPANY_LEGAL_NAME` / `_GSTIN` / `_JURISDICTION` / `VITE_SUPPORT_HOURS` | company details shown on the legal pages |

`JWT_SECRET` is generated automatically. The final URLs are only known after the first deploy, so fill the URL variables with the names Render shows, then **Manual Deploy > Deploy latest commit** on both services. `VITE_*` values are baked in at build time, so changing one needs a rebuild of the client.

If you prefer manual setup instead of the Blueprint, create a **Web Service** for the API and a **Static Site** for the client, both from the repo:

| | API (Web Service) | Client (Static Site) |
|---|---|---|
| Root Directory | `server` | `client` |
| Build Command | `npm ci --omit=dev` | `npm ci && npm run build` |
| Start Command | `npm start` | (none) |
| Publish Directory | | `dist` |
| Health Check Path | `/api/health` | |
| Redirects/Rewrites | | Rewrite `/*` to `/index.html` (so page refreshes and deep links work) |
| Env | `NODE_ENV=production`, `NODE_VERSION=24.18.0` plus the variables above | `NODE_VERSION=24.18.0` plus the variables above |

### 4. Create the admin account (one time)
Run this on your own machine against Atlas. It only creates (or promotes) the admin and leaves existing data untouched.
```bash
cd server
npm install
MONGO_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/barware-store" \
ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" \
npm run seed:admin
```
Then log in at `/admin` and add your categories and products. No demo catalog or customers are created.

### 5. Check it works
- `https://<api>.onrender.com/api/health` returns `{"success":true,"data":{"status":"ok"}}`
- `https://<client>.onrender.com` loads the store; log in at `/admin` with the admin account.

### Things to know on Render
- **Free plan sleeps (API only):** the API web service sleeps after 15 minutes idle and the first request afterwards takes about a minute. The static client does not sleep.
- **Cookies:** the API and client are on different `onrender.com` addresses, so the login cookie is set `SameSite=None; Secure` (automatic in production). Safari and some privacy settings block such cross-site cookies, which can make login fail there. The reliable fix is a custom domain for both (e.g. `shop.example.com` and `api.example.com`) with `COOKIE_SAMESITE=lax` on the API.
- **Admin image uploads:** files saved to the server disk are lost on every redeploy on the free plan. Set the three `CLOUDINARY_*` variables on the API so uploads go to Cloudinary (this path is implemented but has not been run against a real Cloudinary account). Seeded product photos are served by the client and are not affected.
- **Email notifications:** order confirmations, order status updates (shipped/delivered/cancelled), admin new-order alerts and password-reset links are sent through Brevo or Resend when `BREVO_API_KEY` or `RESEND_API_KEY` is set. Without a key they are skipped and logged, so the store still works.
- **Photo credits:** the product photos come from Wikimedia Commons; many licences require visible attribution (see `client/public/images/IMAGES_CREDITS.md`).
- Not tested on Render itself (no Render account was available); the build, start, production-mode cookie and health commands above were run locally in a clean copy.
