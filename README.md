# Barware Store

A full-stack barware e-commerce site: a React (Vite + React Router) storefront (`client/`) backed by an Express + MongoDB API (`server/`). Prices are in INR, payment is Cash on Delivery only.

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
    seed/                 seed data + `npm run seed`
    scripts/dev-db.js     zero-install local MongoDB (`npm run db`)
    tests/                jest + supertest (mongodb-memory-server)
    uploads/              local image uploads (when Cloudinary is not configured)
```

## Quick start (zero system install)

Requires Node 20+ (developed on Node 24). The first run downloads a MongoDB binary once.

```bash
# terminal 1 - local MongoDB on 127.0.0.1:27017 (data in server/.mongo-data)
cd server && npm install && cp .env.example .env
npm run db

# terminal 2 - seed and run the API
cd server
npm run seed
npm run dev            # http://localhost:5000

# terminal 3 - storefront
cd client && npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
npm run dev            # http://localhost:3000
```

## MongoDB setup options

1. **Zero install:** `npm run db` (above) starts a persistent MongoDB via `mongodb-memory-server`. Leave it running; Ctrl+C stops it and the data stays in `server/.mongo-data`.
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

`client/.env.local`: `VITE_API_URL=http://localhost:5000/api`

## Seed

```bash
cd server && npm run seed
```

Wipes all collections, then inserts 11 categories, 27 products (3 low-stock), 12 demo reviews, the admin user and 2 demo customers. Refuses to run with `NODE_ENV=production` unless `--force` is passed.

Default logins:
- Admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env` (example values: `admin@barware.test` / `Admin@12345`)
- Customers: `aarav@example.com` and `priya@example.com`, password `Customer@123`

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
| POST | `/api/orders` | user | COD, built from the server cart |
| GET | `/api/orders/my-orders` | user | |
| GET | `/api/orders/:id` | owner/admin | |
| PUT | `/api/orders/:id/cancel` | owner | only while placed or confirmed |
| GET | `/api/admin/dashboard` | admin | |
| GET | `/api/admin/orders` | admin | status, page, limit |
| PUT | `/api/admin/orders/:id/status` | admin | {status, note} |
| GET | `/api/admin/customers` | admin | with orderCount, totalSpent |
| GET | `/api/admin/products` | admin | includes inactive |

Business rules: prices and totals are always computed on the server from the database; shipping is free at or above INR 999 after discounts, otherwise INR 79; kit discounts are 5/8/10/15% for 3/4/5/6 kit items; dashboard `totalRevenue` counts delivered orders only (COD is collected on delivery), with open orders reported separately as `pendingRevenue`.

## Images and store details

- Product, category and hero photos are in `client/public/images/`. They come from Wikimedia Commons; sources, authors and licences are in `client/public/images/IMAGES_CREDITS.md`. Several are CC BY or CC BY-SA, which require visible attribution on the site, and a few photos are weak matches for their product (replace them before launch).
- The seed only lists image files that exist; a product or category with a missing photo falls back to the photos it does have. After adding photos with the same file names, re-run `npm run seed`.
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
| client | `VITE_API_URL` | API URL **plus `/api`**, e.g. `https://barware-store-api.onrender.com/api` |
| client | `VITE_STORE_ADDRESS` / `_PHONE` / `_EMAIL` | your store details |

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

### 4. Seed the database (one time)
Run this on your own machine against Atlas. It wipes and refills the catalog, so never run it against a database with real orders.
```bash
cd server
npm install
MONGO_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/barware-store" \
ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" \
npm run seed
```
This creates the 11 categories, 27 products, demo reviews, your admin account and two demo customers (`aarav@example.com`, `priya@example.com`, password `Customer@123`; delete them from the admin Customers page or the database before going live).

### 5. Check it works
- `https://<api>.onrender.com/api/health` returns `{"success":true,"data":{"status":"ok"}}`
- `https://<client>.onrender.com` loads the store; log in at `/admin` with the admin account.

### Things to know on Render
- **Free plan sleeps (API only):** the API web service sleeps after 15 minutes idle and the first request afterwards takes about a minute. The static client does not sleep.
- **Cookies:** the API and client are on different `onrender.com` addresses, so the login cookie is set `SameSite=None; Secure` (automatic in production). Safari and some privacy settings block such cross-site cookies, which can make login fail there. The reliable fix is a custom domain for both (e.g. `shop.example.com` and `api.example.com`) with `COOKIE_SAMESITE=lax` on the API.
- **Admin image uploads:** files saved to the server disk are lost on every redeploy on the free plan. Set the three `CLOUDINARY_*` variables on the API so uploads go to Cloudinary (this path is implemented but has not been run against a real Cloudinary account). Seeded product photos are served by the client and are not affected.
- **Forgot password:** no email service is configured. In production the reset link is only written to the API service logs (Render > API service > Logs); it is not emailed or returned to the browser. Add an email provider before relying on password reset.
- **Photo credits:** the product photos come from Wikimedia Commons; many licences require visible attribution (see `client/public/images/IMAGES_CREDITS.md`).
- Not tested on Render itself (no Render account was available); the build, start, production-mode cookie and health commands above were run locally in a clean copy.
