const multer = require("multer");
const AppError = require("../utils/AppError");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype))
      return cb(new AppError("Only jpg, png or webp images are allowed", 400));
    cb(null, true);
  },
});

/** Returns the real image type from magic bytes, or null. Guards against spoofed mimetypes. */
function sniffImageType(buffer) {
  if (
    buffer.length > 12 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return "jpg";
  if (
    buffer.length > 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  return null;
}

const imagesUpload = uploader.array("images", 8);

module.exports = { imagesUpload, sniffImageType, MAX_FILE_SIZE };
