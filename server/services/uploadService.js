const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const env = require("../config/env");
const Upload = require("../models/Upload");
const { sniffImageType } = require("../middleware/upload");
const AppError = require("../utils/AppError");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const IMAGE_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function persistUpload(filename, data, contentType) {
  try {
    await Upload.updateOne(
      { filename },
      { $set: { filename, data, contentType, size: data.length } },
      { upsert: true },
    );
  } catch (error) {
    console.warn(`Could not persist upload ${filename}: ${error.message}`);
  }
}

async function findStoredUpload(filename) {
  const safe = path.basename(String(filename || ""));
  if (!safe || safe !== filename) return null;
  const stored = await Upload.collection.findOne({ filename: safe });
  if (!stored?.data) return null;
  const data = Buffer.isBuffer(stored.data)
    ? stored.data
    : Buffer.from(stored.data.buffer ?? stored.data.value());
  return { contentType: stored.contentType, data };
}

async function migrateUploadsToDb() {
  let files;
  try {
    files = await fs.readdir(UPLOAD_DIR);
  } catch {
    return 0;
  }
  const images = files.filter((name) =>
    Object.keys(IMAGE_TYPES).includes(path.extname(name).slice(1).toLowerCase()),
  );
  if (!images.length) return 0;
  const existing = new Set(
    (await Upload.find({ filename: { $in: images } }).select("filename").lean())
      .map((item) => item.filename),
  );
  let count = 0;
  for (const name of images) {
    if (existing.has(name)) continue;
    try {
      const data = await fs.readFile(path.join(UPLOAD_DIR, name));
      const type = IMAGE_TYPES[path.extname(name).slice(1).toLowerCase()];
      await Upload.create({ filename: name, data, contentType: type, size: data.length });
      count += 1;
    } catch (error) {
      console.warn(`Could not back up upload ${name}: ${error.message}`);
    }
  }
  return count;
}

const requestBase = (req) =>
  `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
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
  const base = requestBase(req);
  return Promise.all(
    files.map(async (file) => {
      const type = sniffImageType(file.buffer);
      const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${type}`;
      await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
      await persistUpload(name, file.buffer, IMAGE_TYPES[type]);
      return `${base}/uploads/${name}`;
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
  const base = requestBase(req);

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
          await persistUpload(filename, rendered.data, IMAGE_TYPES.webp);
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

module.exports = {
  storeImages,
  storeWebpImages,
  findStoredUpload,
  migrateUploadsToDb,
  UPLOAD_DIR,
};
