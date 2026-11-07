const express = require("express");
const env = require("../config/env");
const Product = require("../models/Product");
const Category = require("../models/Category");

const router = express.Router();

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const siteUrl = () =>
  (process.env.SITE_URL || env.clientUrl || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );

const urlNode = ({ loc, lastmod, changefreq, priority }) =>
  [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");

router.get("/", async (_req, res, next) => {
  try {
    const base = siteUrl();
    const [categories, products] = await Promise.all([
      Category.find().sort({ name: 1 }).select("slug updatedAt"),
      Product.find({ isActive: true })
        .sort({ updatedAt: -1 })
        .select("slug updatedAt"),
    ]);

    const urls = [
      { loc: `${base}/`, changefreq: "weekly", priority: "1.0" },
      { loc: `${base}/products`, changefreq: "daily", priority: "0.9" },
      {
        loc: `${base}/custom-bar-kit-builder`,
        changefreq: "monthly",
        priority: "0.8",
      },
      ...categories.map((category) => ({
        loc: `${base}/category/${category.slug}`,
        lastmod: category.updatedAt?.toISOString(),
        changefreq: "weekly",
        priority: "0.8",
      })),
      ...products.map((product) => ({
        loc: `${base}/products/${product.slug}`,
        lastmod: product.updatedAt?.toISOString(),
        changefreq: "weekly",
        priority: "0.7",
      })),
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(urlNode),
      "</urlset>",
    ].join("\n");

    res
      .status(200)
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600")
      .send(xml);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
