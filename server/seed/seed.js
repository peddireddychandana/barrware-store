/** Wipes and reseeds the database: categories, products, admin, demo customers and reviews. */
const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDb } = require("../config/db");
const {
  User,
  Category,
  Product,
  Cart,
  Order,
  Review,
  Subscriber,
} = require("../models");
const { recalculateProductRating } = require("../services/reviewService");
const { categories, products, demoCustomers, reviews } = require("./data");

const DAY = 24 * 60 * 60 * 1000;

async function runSeed({ log = console.log } = {}) {
  await Promise.all(
    [User, Category, Product, Cart, Order, Review, Subscriber].map((m) =>
      m.deleteMany({}),
    ),
  );
  await Promise.all(
    [User, Category, Product, Cart, Order, Review, Subscriber].map((m) =>
      m.syncIndexes(),
    ),
  );

  const createdCategories = await Category.insertMany(categories);
  const catBySlug = new Map(createdCategories.map((c) => [c.slug, c._id]));

  const now = Date.now();
  const createdProducts = await Product.insertMany(
    products.map(({ ageDays, ...p }) => ({
      ...p,
      category: catBySlug.get(p.category),
      createdAt: new Date(now - ageDays * DAY),
      updatedAt: new Date(now - ageDays * DAY),
    })),
    { timestamps: false },
  );
  const productBySlug = new Map(createdProducts.map((p) => [p.slug, p]));

  const admin = await User.create({
    name: "Store Admin",
    email: env.adminEmail,
    password: env.adminPassword,
    role: "admin",
  });
  const customers = [];
  for (const c of demoCustomers)
    customers.push(await User.create({ ...c, role: "customer" }));

  await Review.insertMany(
    reviews.map(([ci, slug, rating, title, comment, daysAgo]) => ({
      user: customers[ci]._id,
      product: productBySlug.get(slug)._id,
      rating,
      title,
      comment,
      createdAt: new Date(now - daysAgo * DAY),
      updatedAt: new Date(now - daysAgo * DAY),
    })),
    { timestamps: false },
  );
  for (const slug of new Set(reviews.map((r) => r[1])))
    await recalculateProductRating(productBySlug.get(slug)._id);

  log(
    `Seeded ${createdCategories.length} categories, ${createdProducts.length} products, ${reviews.length} reviews, 1 admin (${admin.email}), ${customers.length} demo customers.`,
  );
  return { admin, customers };
}

module.exports = { runSeed };

if (require.main === module) {
  (async () => {
    if (env.isProduction && !process.argv.includes("--force"))
      throw new Error(
        "Refusing to wipe the database in production without --force",
      );
    await connectDb();
    await runSeed();
    console.log(
      `Admin login: ${env.adminEmail} / (ADMIN_PASSWORD from .env)\nDemo customers: ${demoCustomers.map((c) => c.email).join(", ")} / Customer@123`,
    );
    await mongoose.disconnect();
  })().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
}
