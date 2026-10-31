const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const env = require("../config/env");
const { sniffImageType } = require("../middleware/upload");
const AppError = require("../utils/AppError");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const cloudinaryEnabled = () =>
  Boolean(
    env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret,
  );

function uploadToCloudinary(buffer) {
  const { v2: cloudinary } = require("cloudinary");
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "barware-store" }, (err, result) =>
        err ? reject(err) : resolve(result.secure_url),
      )
      .end(buffer);
  });
}

/** Validates (magic bytes) and stores files on Cloudinary or ./uploads; returns absolute URLs. */
async function storeImages(files, req) {
  if (!files || files.length === 0)
    throw new AppError("No images uploaded (field name: images)", 400);
  for (const file of files) {
    if (!sniffImageType(file.buffer))
      throw new AppError(
        `${file.originalname} is not a valid jpg, png or webp image`,
        400,
      );
  }
  if (cloudinaryEnabled())
    return Promise.all(files.map((f) => uploadToCloudinary(f.buffer)));
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const base = env.serverUrl || `${req.protocol}://${req.get("host")}`;
  return Promise.all(
    files.map(async (file) => {
      const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${sniffImageType(file.buffer)}`;
      await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
      return `${base.replace(/\/$/, "")}/uploads/${name}`;
    }),
  );
}

module.exports = { storeImages, UPLOAD_DIR };
