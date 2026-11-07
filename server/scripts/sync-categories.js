/**
 * Ensures the store has the 13 VYRNT catalog categories and moves any
 * legacy-categorized products onto the matching new category.
 *
 * Safe to run repeatedly. Categories that still contain products are never deleted.
 */
const mongoose = require("mongoose");
const { connectDb } = require("../config/db");
const { Category, Product } = require("../models");

const CATEGORIES = [
  {
    slug: "shakers",
    name: "Shakers",
    description:
      "Cobbler, Boston and French shakers built to chill and dilute every cocktail perfectly.",
    image: "/images/categories/cocktail-shakers.jpg",
  },
  {
    slug: "openers",
    name: "Openers",
    description:
      "Corkscrews, bottle openers and wine keys for clean, effortless service.",
    image: "/images/categories/wine-accessories.jpg",
  },
  {
    slug: "bar-tools",
    name: "Bar Tools",
    description:
      "Essential bar tools and complete sets for building, stirring and serving.",
    image: "/images/categories/bartender-tool-sets.jpg",
  },
  {
    slug: "strainers",
    name: "Strainers",
    description:
      "Hawthorne and fine mesh strainers for silky, pulp-free pours.",
    image: "/images/categories/cocktail-strainers.jpg",
  },
  {
    slug: "measuring",
    name: "Measuring",
    description:
      "Jiggers and measuring tools for precise, repeatable pours.",
    image: "/images/categories/measuring-tools.jpg",
  },
  {
    slug: "glassware",
    name: "Glassware",
    description:
      "Tempered glassware for mixing, serving and entertaining.",
    image: "/images/categories/glassware.jpg",
  },
  {
    slug: "pitchers-beakers",
    name: "Pitchers & Beakers",
    description:
      "Mixing glasses, pitchers and beakers for stirred classics and batch drinks.",
    image: "/images/categories/cocktail-mixing-glasses.jpg",
  },
  {
    slug: "spoons",
    name: "Spoons",
    description:
      "Weighted, twisted-shaft spoons for stirring, layering and garnishing.",
    image: "/images/categories/bar-spoons.jpg",
  },
  {
    slug: "prep-tools",
    name: "Prep Tools",
    description:
      "Muddlers and prep essentials for working with fresh ingredients.",
    image: "/images/categories/muddlers.jpg",
  },
  {
    slug: "ice-accessories",
    name: "Ice Accessories",
    description:
      "Tongs and tools for handling ice cleanly at the bar or the dining table.",
    image: "/images/categories/ice-accessories.jpg",
  },
  {
    slug: "pourers",
    name: "Pourers",
    description:
      "Smooth, drip-free pourers for consistent free-pouring.",
    image: "/images/products/bottle-pourer-steel-2.jpg",
  },
  {
    slug: "garnish-prep",
    name: "Garnish & Prep",
    description:
      "Peelers, garnish tools and prep accessories for polished, professional serves.",
    image: "/images/categories/bar-spoons.jpg",
  },
  {
    slug: "drinkware",
    name: "Drinkware",
    description:
      "Shot glasses, tumblers and sipping vessels for every kind of serve.",
    image: "/images/products/shot-glass-30ml-set6-1.jpg",
  },
];

const LEGACY_TO_NEW = {
  "cocktail-shakers": "shakers",
  "wine-accessories": "openers",
  "bartender-tool-sets": "bar-tools",
  "cocktail-strainers": "strainers",
  "measuring-tools": "measuring",
  glassware: "glassware",
  "cocktail-mixing-glasses": "pitchers-beakers",
  "bar-spoons": "spoons",
  muddlers: "prep-tools",
  "ice-accessories": "ice-accessories",
  "bottle-pourers": "pourers",
};

async function run() {
  await connectDb();

  const bySlug = new Map();
  for (const data of CATEGORIES) {
    const category = await Category.findOneAndUpdate(
      { slug: data.slug },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    bySlug.set(data.slug, category);
    console.log(`synced category: ${category.name} (${category.slug})`);
  }

  let moved = 0;
  for (const [oldSlug, newSlug] of Object.entries(LEGACY_TO_NEW)) {
    if (oldSlug === newSlug) continue;
    const oldCategory = await Category.findOne({ slug: oldSlug });
    if (!oldCategory) continue;
    const result = await Product.updateMany(
      { category: oldCategory._id },
      { $set: { category: bySlug.get(newSlug)._id } },
    );
    moved += result.modifiedCount;
    if (result.modifiedCount) {
      console.log(
        `moved ${result.modifiedCount} product(s): ${oldCategory.name} -> ${bySlug.get(newSlug).name}`,
      );
    }
  }

  const keepSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const stale = await Category.find({ slug: { $nin: [...keepSlugs] } });
  for (const category of stale) {
    const inUse = await Product.countDocuments({ category: category._id });
    if (inUse > 0) {
      console.warn(
        `kept "${category.name}" (${category.slug}): still used by ${inUse} product(s)`,
      );
      continue;
    }
    await category.deleteOne();
    console.log(`removed legacy category: ${category.name} (${category.slug})`);
  }

  const finalCategories = await Category.find().sort({ name: 1 }).lean();
  console.log(`\n${finalCategories.length} categories now live:`);
  for (const category of finalCategories) {
    console.log(`- ${category.name} (${category.slug})`);
  }
  if (moved) console.log(`\nReassigned ${moved} product(s).`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Category sync failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
