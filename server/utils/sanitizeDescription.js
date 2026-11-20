const xss = require("xss");

const CELL_ATTRIBUTES = ["colspan", "rowspan", "colwidth", "width"];

const whiteList = {
  p: [],
  br: [],
  div: [],
  span: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  strike: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  code: [],
  pre: [],
  hr: [],
  table: [],
  thead: [],
  tbody: [],
  tfoot: [],
  tr: [],
  th: CELL_ATTRIBUTES,
  td: CELL_ATTRIBUTES,
  colgroup: [],
  col: ["width"],
  a: ["href", "target", "rel", "title"],
};

const safeAttrValue = (tag, name, value, cssFilter) => {
  if (name === "href" && !/^(https?:\/\/|mailto:|tel:|\/|#|\.\/|\.\.\/)/i.test(value.trim())) {
    return "";
  }
  return xss.safeAttrValue(tag, name, value, cssFilter);
};

const sanitizeDescription = (value) =>
  xss(String(value ?? ""), {
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "noscript", "textarea", "option"],
    safeAttrValue,
  });

module.exports = { sanitizeDescription };
