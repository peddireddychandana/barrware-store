const escapeCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (rows) => rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");

/** Streams a BOM-prefixed CSV so Excel opens Indian text correctly. */
const sendCsv = (res, filename, rows) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  res.send(`\uFEFF${toCsv(rows)}`);
};

module.exports = { toCsv, sendCsv };
