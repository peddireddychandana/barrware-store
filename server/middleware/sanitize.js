/** Strips keys starting with "$" or containing "." (NoSQL operator injection) in place. */
function strip(value) {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) delete value[key];
    else strip(value[key]);
  }
}

module.exports = (req, _res, next) => {
  strip(req.body);
  strip(req.query);
  strip(req.params);
  next();
};
