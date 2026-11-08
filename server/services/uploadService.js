const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
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

function cloudinaryClient() {
  const { v2: cloudinary } = require("cloudinary");
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  return cloudinary;
}

function uploadToCloudinary(buffer) {
  const cloudinary = cloudinaryClient();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "barware-store", format: "webp" }, (err, result) =>
        err ? reject(err) : resolve(result.secure_url),
      )
      .end(buffer);
  });
}

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

const RENDITIONS = {
  full: 2000,
  large: 1600,
  medium: 800,
  thumbnail: 400,
};

async function renderWebp(buffer, width) {
  return sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
}

async function storeWebpImages(files, req) {
  if (!files || files.length === 0)
    throw new AppError("No images uploaded (field name: images)", 400);
  for (const file of files) {
    if (!sniffImageType(file.buffer))
      throw new AppError(
        `${file.originalname} is not a valid jpg, png or webp image`,
        400,
      );
  }

  const useCloudinary = cloudinaryEnabled();
  if (!useCloudinary) await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const base = (env.serverUrl || `${req.protocol}://${req.get("host")}`).replace(
    /\/$/,
    "",
  );

  return Promise.all(
    files.map(async (file) => {
      let metadata;
      try {
        metadata = await sharp(file.buffer).metadata();
      } catch {
        throw new AppError(`${file.originalname} could not be processed`, 400);
      }
      const stamp = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
      const renditions = {};
      for (const [key, width] of Object.entries(RENDITIONS)) {
        renditions[key] = await renderWebp(file.buffer, width);
      }
      const urls = {};
      for (const [key, rendered] of Object.entries(renditions)) {
        if (useCloudinary) {
          urls[key] = await uploadToCloudinary(rendered.data);
        } else {
          const filename = `${stamp}-${key}.webp`;
          await fs.writeFile(path.join(UPLOAD_DIR, filename), rendered.data);
          urls[key] = `${base}/uploads/${filename}`;
        }
      }
      return {
        originalName: file.originalname,
        webpFilename: useCloudinary ? "" : `${stamp}-full.webp`,
        webpUrl: urls.full,
        thumbnailUrl: urls.thumbnail,
        mediumUrl: urls.medium,
        largeUrl: urls.large,
        width: metadata.width || renditions.full.info.width,
        height: metadata.height || renditions.full.info.height,
        fileSize: renditions.full.data.length,
      };
    }),
  );
}

module.exports = { storeImages, storeWebpImages, UPLOAD_DIR };
