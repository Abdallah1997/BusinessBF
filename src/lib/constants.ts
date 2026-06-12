export const BRAND = {
  name: "BusinessBF",
  tagline: "Inventory, crosslisting and bookkeeping for resellers, all in one place.",
  description:
    "Track inventory, manage listings across every marketplace, and know your real profit on every sale. Tax-ready reports included.",
} as const;

export const MARKETPLACES = [
  "EBAY",
  "POSHMARK",
  "MERCARI",
  "DEPOP",
  "FACEBOOK",
  "ETSY",
  "WHATNOT",
  "GRAILED",
  "VINTED",
  "OTHER",
] as const;
export type Marketplace = (typeof MARKETPLACES)[number];

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  EBAY: "eBay",
  POSHMARK: "Poshmark",
  MERCARI: "Mercari",
  DEPOP: "Depop",
  FACEBOOK: "Facebook Marketplace",
  ETSY: "Etsy",
  WHATNOT: "Whatnot",
  GRAILED: "Grailed",
  VINTED: "Vinted",
  OTHER: "Other",
};

export const ITEM_CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  NEW: "New with tags",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor / for parts",
};

export const ITEM_STATUSES = ["ACTIVE", "SOLD", "ARCHIVED"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const LISTING_STATUSES = ["DRAFT", "ACTIVE", "SOLD", "DELISTED"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

// Keys align with IRS Schedule C line items so the tax report can group cleanly.
export const EXPENSE_CATEGORIES = [
  "SUPPLIES",
  "SHIPPING",
  "FEES",
  "ADVERTISING",
  "OFFICE",
  "TRAVEL",
  "MEALS",
  "UTILITIES",
  "INSURANCE",
  "LEGAL",
  "REPAIRS",
  "RENT_LEASE",
  "TAXES_LICENSES",
  "EDUCATION",
  "SOFTWARE",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  SUPPLIES: "Supplies (Line 22)",
  SHIPPING: "Shipping & postage (Line 27a)",
  FEES: "Platform & payment fees (Line 10)",
  ADVERTISING: "Advertising (Line 8)",
  OFFICE: "Office expense (Line 18)",
  TRAVEL: "Travel (Line 24a)",
  MEALS: "Meals (Line 24b)",
  UTILITIES: "Utilities (Line 25)",
  INSURANCE: "Insurance (Line 15)",
  LEGAL: "Legal & professional (Line 17)",
  REPAIRS: "Repairs & maintenance (Line 21)",
  RENT_LEASE: "Rent or lease (Line 20)",
  TAXES_LICENSES: "Taxes & licenses (Line 23)",
  EDUCATION: "Education & training (Line 27a)",
  SOFTWARE: "Software & subscriptions (Line 27a)",
  OTHER: "Other expenses (Line 27a)",
};

// IRS standard mileage rate (2026). Kept here so it's one edit per tax year.
export const MILEAGE_RATE_CENTS_PER_MILE = 70;
