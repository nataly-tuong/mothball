export type ClosetRole = "OWNER" | "MEMBER";

import defaultItemImage from "../assets/default-item.jpg";

export { defaultItemImage };

export type ItemStatus = "TO_UPLOAD" | "LISTED" | "SOLD";

export type ItemCondition =
  "BRAND_NEW" | "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR";

export type ClosetSummary = {
  id: number;
  name: string;
  role: ClosetRole;
  memberCount: number;
  itemCount: number;
};

export type ClosetMember = {
  id: number;
  name: string;
  role: ClosetRole;
};

export type ClosetDetail = {
  id: number;
  name: string;
  inviteCode: string;
  staleDays: number;
  unreadActivity: number;
  role: ClosetRole;
  members: ClosetMember[];
};

export type ItemPhoto = {
  id?: number;
  url: string;
  publicId: string;
};

export type Person = { id: number; name: string };

export type Item = {
  id: number;
  name: string;
  description: string | null;
  hashtags: string[];
  brand: string | null;
  size: string | null;
  condition: ItemCondition | null;
  category: string | null;
  subcategory: string | null;
  color: string | null;
  status: ItemStatus;
  priceCents: number | null;
  minPriceCents: number | null;
  soldPriceCents: number | null;
  listingUrl: string | null;
  notes: string | null;
  listedAt: string | null;
  refreshedAt: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: Person | null;
  owner: Person | null;
  photos: ItemPhoto[];
};

export const MAX_PHOTOS = 8;
export const MAX_HASHTAGS = 5;
export const DESCRIPTION_MAX = 1000;

export const CONDITION_OPTIONS: { value: ItemCondition; label: string }[] = [
  { value: "BRAND_NEW", label: "Brand new" },
  { value: "LIKE_NEW", label: "Like new" },
  { value: "EXCELLENT", label: "Used - Excellent" },
  { value: "GOOD", label: "Used - Good" },
  { value: "FAIR", label: "Used - Fair" },
];

export const CONDITION_LABELS = Object.fromEntries(
  CONDITION_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<ItemCondition, string>;

export const CATEGORIES: Record<string, string[]> = {
  Tops: [
    "T-shirts",
    "Tank tops",
    "Crop tops",
    "Blouses",
    "Shirts",
    "Polo shirts",
    "Bodysuits",
    "Sweatshirts",
    "Hoodies",
    "Sweaters",
    "Cardigans",
    "Other",
  ],
  Bottoms: [
    "Jeans",
    "Trousers",
    "Sweatpants",
    "Leggings",
    "Shorts",
    "Skirts",
    "Other",
  ],
  Dresses: ["Mini dresses", "Midi dresses", "Maxi dresses", "Other"],
  "Coats & jackets": [
    "Jackets",
    "Coats",
    "Puffer jackets",
    "Denim jackets",
    "Leather jackets",
    "Bomber jackets",
    "Blazers",
    "Vests",
    "Other",
  ],
  "Jumpsuits & playsuits": ["Jumpsuits", "Playsuits", "Overalls"],
  Activewear: ["Tops", "Bottoms", "Sports bras", "Tracksuits", "Other"],
  Swimwear: ["Bikinis", "One-pieces", "Swim shorts", "Cover-ups"],
  "Lingerie & sleepwear": ["Bras", "Underwear", "Pajamas", "Robes", "Other"],
  Suits: ["Suits", "Suit jackets", "Suit trousers", "Waistcoats"],
  Shoes: [
    "Sneakers",
    "Boots",
    "Heels",
    "Flats",
    "Sandals",
    "Loafers",
    "Slippers",
    "Other",
  ],
  Bags: [
    "Handbags",
    "Shoulder bags",
    "Crossbody bags",
    "Tote bags",
    "Backpacks",
    "Clutches",
    "Wallets & purses",
    "Other",
  ],
  Accessories: [
    "Hats",
    "Belts",
    "Scarves",
    "Sunglasses",
    "Gloves",
    "Hair accessories",
    "Watches",
    "Other",
  ],
  Jewelry: [
    "Necklaces",
    "Earrings",
    "Rings",
    "Bracelets",
    "Anklets",
    "Body jewelry",
    "Other",
  ],
};

export function categoryLabel(item: Pick<Item, "category" | "subcategory">) {
  return [item.category, item.subcategory].filter(Boolean).join(" › ");
}

export const STATUS_THEME: Record<
  ItemStatus,
  { card: string; chip: string; active: string }
> = {
  TO_UPLOAD: {
    card: "bg-orange-50/80 border-orange-200",
    chip: "border-orange-200 bg-orange-100/80 text-orange-900",
    active: "bg-orange-200 text-orange-950",
  },
  LISTED: {
    card: "bg-violet-50/80 border-violet-200",
    chip: "border-violet-200 bg-violet-100/80 text-violet-900",
    active: "bg-violet-200 text-violet-950",
  },
  SOLD: {
    card: "bg-emerald-50/80 border-emerald-200",
    chip: "border-emerald-200 bg-emerald-100/80 text-emerald-900",
    active: "bg-emerald-200 text-emerald-950",
  },
};

export const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "TO_UPLOAD", label: "To upload" },
  { value: "LISTED", label: "Listed" },
  { value: "SOLD", label: "Sold" },
];

export const STATUS_LABELS: Record<ItemStatus, string> = {
  TO_UPLOAD: "To upload",
  LISTED: "Listed",
  SOLD: "Sold",
};

export function formatPrice(cents: number | null) {
  if (cents === null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function parsePrice(input: string): number | null | undefined {
  const value = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!value) return null;
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return undefined;
  return Math.round(Number(value) * 100);
}

export function formatInviteCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function withTransform(url: string, transform: string) {
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}

export function squareUrl(url: string, size = 600) {
  return withTransform(url, `c_fill,g_auto,ar_1:1,w_${size},f_auto,q_auto`);
}

export function squareJpgUrl(url: string) {
  return withTransform(url, "c_fill,g_auto,ar_1:1,w_1600,q_90,f_jpg");
}

export function photoFileName(itemName: string, index: number) {
  const slug =
    itemName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "item";
  return `${slug}-${index + 1}.jpg`;
}

export function photoDownloadUrl(url: string, itemName: string, index: number) {
  const name = photoFileName(itemName, index).replace(/\.jpg$/, "");
  return withTransform(
    url,
    `c_fill,g_auto,ar_1:1,w_1600,q_90,f_jpg,fl_attachment:${name}`,
  );
}

export function coverImage(item: Item, size = 600) {
  return item.photos[0]
    ? squareUrl(item.photos[0].url, size)
    : defaultItemImage;
}

export function formatHashtags(tags: string[]) {
  return tags.map((tag) => `#${tag}`).join(" ");
}

export function parseHashtags(input: string) {
  const tags: string[] = [];
  for (const raw of input.split(/[\s,]+/)) {
    const tag = raw
      .replace(/^#+/, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_]/gu, "");
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

export function fullDescription(item: Item) {
  return [item.description?.trim(), formatHashtags(item.hashtags)]
    .filter(Boolean)
    .join("\n\n");
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const LAST_CLOSET_KEY = "mothball:lastCloset";

export function getLastClosetId(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_CLOSET_KEY));
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function setLastClosetId(id: number | null) {
  try {
    if (id === null) {
      localStorage.removeItem(LAST_CLOSET_KEY);
    } else {
      localStorage.setItem(LAST_CLOSET_KEY, String(id));
    }
  } catch {
    return;
  }
}

export type ActivityType =
  | "CLOSET_CREATED"
  | "CLOSET_RENAMED"
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "MEMBER_REMOVED"
  | "ITEM_ADDED"
  | "ITEM_LISTED"
  | "ITEM_SOLD"
  | "ITEM_UNLISTED"
  | "ITEM_PRICE_CHANGED"
  | "ITEM_RELISTED"
  | "ITEM_DELETED";

export type Activity = {
  id: number;
  type: ActivityType;
  itemId: number | null;
  itemName: string | null;
  detail: string | null;
  createdAt: string;
  actor: Person | null;
};

export const STALE_DAY_OPTIONS = [14, 21, 30, 45, 60, 90];
export const DUE_SOON_DAYS = 7;

const DAY_MS = 86_400_000;

export function listedSince(item: Item) {
  return item.refreshedAt ?? item.listedAt;
}

export function daysListed(item: Item, now = Date.now()) {
  const since = listedSince(item);
  if (item.status !== "LISTED" || !since) return null;
  return Math.floor((now - new Date(since).getTime()) / DAY_MS);
}

export function isStale(item: Item, staleDays: number, now = Date.now()) {
  const days = daysListed(item, now);
  return days !== null && days >= staleDays;
}

export function isDueSoon(item: Item, staleDays: number, now = Date.now()) {
  const days = daysListed(item, now);
  return days !== null && days < staleDays && days >= staleDays - DUE_SOON_DAYS;
}
