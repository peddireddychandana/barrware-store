/** Store-wide business constants. Prices are INR. */
module.exports = {
  CURRENCY: "INR",
  FREE_SHIPPING_THRESHOLD: 999,
  SHIPPING_FEE: 79,
  LOW_STOCK_THRESHOLD: 10,
  MAX_ITEM_QUANTITY: 50,

  /** GST is included in displayed prices (standard Indian retail pricing). */
  GST_RATE: Number(process.env.GST_RATE) || 0.18,
  GST_ENABLED: process.env.GST_ENABLED !== "false",
  GST_NUMBER: process.env.GST_NUMBER || "",

  /** Minutes an unpaid UPI order may hold stock before it is auto-cancelled. */
  UPI_PAYMENT_WINDOW_MINUTES:
    Number(process.env.UPI_PAYMENT_WINDOW_MINUTES) || 60,

  /** Days after delivery in which a return can be requested. */
  RETURN_WINDOW_DAYS: Number(process.env.RETURN_WINDOW_DAYS) || 7,

  PRODUCT_TYPES: {
    "cocktail-shaker": "Cocktail Shaker",
    "hawthorne-strainer": "Hawthorne Strainer",
    "wooden-muddler": "Wooden Muddler",
    "dual-jigger": "Dual Jigger",
    "sommelier-corkscrew": "Sommelier Corkscrew",
    "tempered-shot-glass": "Tempered Shot Glass",
    "fine-mesh-strainer": "Fine Mesh Strainer",
    "bar-spoon": "Bar Spoon",
    "ice-tongs": "Ice Tongs",
    "bottle-pourer": "Bottle Pourer",
    "mixing-glass": "Mixing Glass",
    "tool-set": "Bartender Tool Set",
  },

  KIT_SLOTS: [
    { slot: "cocktail-shaker", label: "Cocktail Shaker" },
    { slot: "hawthorne-strainer", label: "Hawthorne Strainer" },
    { slot: "dual-jigger", label: "Dual Jigger" },
    { slot: "wooden-muddler", label: "Wooden Muddler" },
    { slot: "bar-spoon", label: "Bar Spoon" },
    { slot: "bottle-pourer", label: "Bottle Pourer" },
  ],

  KIT_DISCOUNT_TIERS: [
    { minItems: 3, percent: 5 },
    { minItems: 4, percent: 8 },
    { minItems: 5, percent: 10 },
    { minItems: 6, percent: 15 },
  ],

  ORDER_FLOW: [
    "placed",
    "confirmed",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
  ],
  CUSTOMER_CANCELLABLE: ["placed", "confirmed"],
};
