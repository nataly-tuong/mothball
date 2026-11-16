import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../prismaClient.js";
import { Prisma } from "../generated/prisma/client.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  parseId,
  requireMember,
  requireOwner,
} from "../middleware/closetAccess.js";
import {
  closetJoinLimiter,
  closetWriteLimiter,
  inviteLookupLimiter,
} from "../middleware/rateLimiters.js";
import {
  createInviteCode,
  getClosetNameError,
  normalizeInviteCode,
  removeMember,
} from "../lib/closets.js";
import { logActivity } from "../lib/activity.js";
import {
  createUploadSignature,
  deleteImages,
  isClosetImage,
  uploadsEnabled,
} from "../lib/cloudinary.js";

const router = Router();

const MAX_CLOSETS_PER_USER = 10;
const MAX_MEMBERS_PER_CLOSET = 20;
const MAX_ITEMS_PER_CLOSET = 2000;
const MAX_PHOTOS = 8;
const STALE_DAYS_MIN = 7;
const STALE_DAYS_MAX = 120;
const ACTIVITY_PAGE_SIZE = 40;
const MAX_HASHTAGS = 5;
const PRICE_CENTS_MAX = 10_000_000;
const STATUSES = ["TO_UPLOAD", "LISTED", "SOLD"] as const;
const CONDITIONS = [
  "BRAND_NEW",
  "LIKE_NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
] as const;

type ItemStatus = (typeof STATUSES)[number];
type ItemCondition = (typeof CONDITIONS)[number];

const TEXT_LIMITS = {
  name: 80,
  description: 1000,
  brand: 60,
  size: 30,
  category: 60,
  color: 30,
  notes: 500,
} as const;

const itemSelect = {
  id: true,
  name: true,
  description: true,
  hashtags: true,
  brand: true,
  size: true,
  condition: true,
  category: true,
  color: true,
  status: true,
  priceCents: true,
  minPriceCents: true,
  soldPriceCents: true,
  depopUrl: true,
  notes: true,
  listedAt: true,
  refreshedAt: true,
  soldAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true } },
  photos: {
    orderBy: { position: "asc" },
    select: { id: true, url: true, publicId: true },
  },
} satisfies Prisma.ItemSelect;

type PhotoInput = { url: string; publicId: string };

type ItemInput = {
  name?: string;
  description?: string | null;
  hashtags?: string[];
  brand?: string | null;
  size?: string | null;
  condition?: ItemCondition | null;
  category?: string | null;
  color?: string | null;
  status?: ItemStatus;
  priceCents?: number | null;
  minPriceCents?: number | null;
  soldPriceCents?: number | null;
  depopUrl?: string | null;
  notes?: string | null;
  ownerId?: number | null;
  photos?: PhotoInput[];
};

type ParseResult = { data: ItemInput } | { error: string };

function parseText(
  value: unknown,
  label: string,
  max: number,
): { value: string | null } | { error: string } {
  if (value === null) return { value: null };
  if (typeof value !== "string") return { error: `Invalid ${label}.` };
  const text = value.trim();
  if (text.length > max) {
    return { error: `${label} can't be longer than ${max} characters.` };
  }
  return { value: text || null };
}

function parsePrice(
  value: unknown,
  label: string,
): { value: number | null } | { error: string } {
  if (value === null) return { value: null };
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= PRICE_CENTS_MAX
  ) {
    return { value };
  }
  return { error: `Enter a valid ${label}.` };
}

function parseHashtags(
  value: unknown,
): { value: string[] } | { error: string } {
  if (!Array.isArray(value)) return { error: "Invalid hashtags." };

  const tags: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") return { error: "Invalid hashtags." };
    const tag = raw
      .trim()
      .replace(/^#+/, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_]/gu, "")
      .slice(0, 30);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }

  if (tags.length > MAX_HASHTAGS) {
    return { error: `Depop allows up to ${MAX_HASHTAGS} hashtags.` };
  }
  return { value: tags };
}

function parseDepopUrl(
  value: unknown,
): { value: string | null } | { error: string } {
  if (value === null || value === "") return { value: null };
  if (typeof value !== "string") return { error: "Invalid Depop link." };

  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      !(host === "depop.com" || host.endsWith(".depop.com"))
    ) {
      return { error: "Paste a link from depop.com." };
    }
    return { value: url.toString() };
  } catch {
    return { error: "Paste a link from depop.com." };
  }
}

function parseItemInput(
  body: unknown,
  closetId: number,
  partial: boolean,
): ParseResult {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const input = body as Record<string, unknown>;
  const data: ItemInput = {};

  if (input.name !== undefined || !partial) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) return { error: "Give the item a title." };
    if (name.length > TEXT_LIMITS.name) {
      return {
        error: `Title can't be longer than ${TEXT_LIMITS.name} characters.`,
      };
    }
    data.name = name;
  }

  const textFields = [
    ["description", "Description"],
    ["brand", "Brand"],
    ["size", "Size"],
    ["category", "Category"],
    ["color", "Color"],
    ["notes", "Notes"],
  ] as const;

  for (const [key, label] of textFields) {
    if (input[key] === undefined) continue;
    const parsed = parseText(input[key], label, TEXT_LIMITS[key]);
    if ("error" in parsed) return parsed;
    data[key] = parsed.value;
  }

  if (input.hashtags !== undefined) {
    const parsed = parseHashtags(input.hashtags);
    if ("error" in parsed) return parsed;
    data.hashtags = parsed.value;
  }

  if (input.condition !== undefined) {
    if (input.condition === null) {
      data.condition = null;
    } else if (CONDITIONS.includes(input.condition as ItemCondition)) {
      data.condition = input.condition as ItemCondition;
    } else {
      return { error: "Invalid condition." };
    }
  }

  if (input.status !== undefined) {
    if (!STATUSES.includes(input.status as ItemStatus)) {
      return { error: "Invalid status." };
    }
    data.status = input.status as ItemStatus;
  }

  const priceFields = [
    ["priceCents", "listed price"],
    ["minPriceCents", "lowest acceptable price"],
    ["soldPriceCents", "sold price"],
  ] as const;

  for (const [key, label] of priceFields) {
    if (input[key] === undefined) continue;
    const parsed = parsePrice(input[key], label);
    if ("error" in parsed) return parsed;
    data[key] = parsed.value;
  }

  if (input.depopUrl !== undefined) {
    const parsed = parseDepopUrl(input.depopUrl);
    if ("error" in parsed) return parsed;
    data.depopUrl = parsed.value;
  }

  if (input.ownerId !== undefined) {
    if (input.ownerId === null) {
      data.ownerId = null;
    } else {
      const ownerId = parseId(input.ownerId);
      if (!ownerId) return { error: "Invalid owner." };
      data.ownerId = ownerId;
    }
  }

  if (input.photos !== undefined) {
    if (!Array.isArray(input.photos)) return { error: "Invalid photos." };
    if (input.photos.length > MAX_PHOTOS) {
      return { error: `Add up to ${MAX_PHOTOS} photos.` };
    }

    const photos: PhotoInput[] = [];
    for (const photo of input.photos) {
      const { url, publicId } = (photo ?? {}) as Record<string, unknown>;
      if (
        typeof url !== "string" ||
        typeof publicId !== "string" ||
        !isClosetImage(closetId, url, publicId) ||
        photos.some((p) => p.publicId === publicId)
      ) {
        return { error: "Invalid photo." };
      }
      photos.push({ url, publicId });
    }
    data.photos = photos;
  }

  return { data };
}

async function validateItemRules(
  closetId: number,
  data: ItemInput,
  existing?: {
    priceCents: number | null;
    minPriceCents: number | null;
  },
): Promise<string | null> {
  const price =
    data.priceCents !== undefined ? data.priceCents : existing?.priceCents;
  const minPrice =
    data.minPriceCents !== undefined
      ? data.minPriceCents
      : existing?.minPriceCents;

  if (price != null && minPrice != null && minPrice > price) {
    return "Lowest acceptable price can't be more than the listed price.";
  }

  if (data.ownerId) {
    const member = await prisma.closetMember.findUnique({
      where: { closetId_userId: { closetId, userId: data.ownerId } },
      select: { userId: true },
    });
    if (!member) return "That person isn't in this closet.";
  }

  return null;
}

function statusDates(
  status: ItemStatus | undefined,
  existing?: { listedAt: Date | null; soldAt: Date | null },
) {
  if (!status) return {};
  const now = new Date();
  return {
    listedAt:
      status === "TO_UPLOAD"
        ? (existing?.listedAt ?? null)
        : (existing?.listedAt ?? now),
    soldAt: status === "SOLD" ? (existing?.soldAt ?? now) : null,
  };
}

async function logItemChanges(
  closetId: number,
  actorId: number,
  before: { status: ItemStatus; priceCents: number | null },
  after: {
    id: number;
    name: string;
    status: ItemStatus;
    priceCents: number | null;
    soldPriceCents: number | null;
  },
) {
  const base = { closetId, actorId, itemId: after.id, itemName: after.name };

  if (after.status !== before.status) {
    if (after.status === "LISTED") {
      await logActivity({ ...base, type: "ITEM_LISTED" });
    } else if (after.status === "SOLD") {
      await logActivity({
        ...base,
        type: "ITEM_SOLD",
        detail:
          after.soldPriceCents != null ? String(after.soldPriceCents) : null,
      });
    } else {
      await logActivity({ ...base, type: "ITEM_UNLISTED" });
    }
  }

  if (
    after.priceCents !== before.priceCents &&
    before.priceCents != null &&
    after.priceCents != null &&
    after.status !== "SOLD"
  ) {
    await logActivity({
      ...base,
      type: "ITEM_PRICE_CHANGED",
      detail: `${before.priceCents}:${after.priceCents}`,
    });
  }
}

function photoCreates(photos: PhotoInput[]) {
  return photos.map((photo, position) => ({ ...photo, position }));
}

function isUniqueViolation(err: unknown) {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

router.get(
  "/invite/:code",
  inviteLookupLimiter,
  async (req: Request, res: Response) => {
    const code = normalizeInviteCode(String(req.params.code ?? ""));

    if (code.length !== 8) {
      return res.status(404).send({ message: "That invite isn't valid." });
    }

    const closet = await prisma.closet.findUnique({
      where: { inviteCode: code },
      select: {
        name: true,
        _count: { select: { members: true, items: true } },
      },
    });

    if (!closet) {
      return res
        .status(404)
        .send({ message: "That invite isn't valid anymore." });
    }

    res.send({
      name: closet.name,
      memberCount: closet._count.members,
      itemCount: closet._count.items,
      inviteCode: code,
    });
  },
);

router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
  const memberships = await prisma.closetMember.findMany({
    where: { userId: req.userId },
    orderBy: { joinedAt: "asc" },
    select: {
      role: true,
      closet: {
        select: {
          id: true,
          name: true,
          _count: { select: { members: true, items: true } },
        },
      },
    },
  });

  res.send(
    memberships.map(({ role, closet }) => ({
      id: closet.id,
      name: closet.name,
      role,
      memberCount: closet._count.members,
      itemCount: closet._count.items,
    })),
  );
});

router.get("/uploads/config", (_req: Request, res: Response) => {
  res.send({ enabled: uploadsEnabled() });
});

router.post("/", closetWriteLimiter, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const nameError = getClosetNameError(name);

  if (nameError) {
    return res.status(400).send({ message: nameError });
  }

  const owned = await prisma.closetMember.count({ where: { userId } });

  if (owned >= MAX_CLOSETS_PER_USER) {
    return res.status(400).send({
      message: `You can be in up to ${MAX_CLOSETS_PER_USER} closets.`,
    });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const closet = await prisma.closet.create({
        data: {
          name,
          inviteCode: createInviteCode(),
          members: { create: { userId, role: "OWNER" } },
        },
        select: { id: true },
      });

      await logActivity({
        closetId: closet.id,
        actorId: userId,
        type: "CLOSET_CREATED",
      });

      return res.status(201).send(closet);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }

  res.status(500).send({ message: "Couldn't create the closet. Try again." });
});

router.post("/join", closetJoinLimiter, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const code =
    typeof req.body?.inviteCode === "string"
      ? normalizeInviteCode(req.body.inviteCode)
      : "";

  if (code.length !== 8) {
    return res
      .status(400)
      .send({ message: "Enter an 8-character invite code." });
  }

  const closet = await prisma.closet.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      _count: { select: { members: true } },
      members: { where: { userId }, select: { userId: true } },
    },
  });

  if (!closet) {
    return res
      .status(404)
      .send({ message: "That invite code doesn't match a closet." });
  }

  if (closet.members.length > 0) {
    return res.send({ id: closet.id });
  }

  if (closet._count.members >= MAX_MEMBERS_PER_CLOSET) {
    return res.status(400).send({ message: "This closet is full." });
  }

  const count = await prisma.closetMember.count({ where: { userId } });

  if (count >= MAX_CLOSETS_PER_USER) {
    return res.status(400).send({
      message: `You can be in up to ${MAX_CLOSETS_PER_USER} closets.`,
    });
  }

  await prisma.closetMember.create({
    data: { closetId: closet.id, userId, role: "MEMBER" },
  });

  await logActivity({
    closetId: closet.id,
    actorId: userId,
    type: "MEMBER_JOINED",
  });

  res.status(201).send({ id: closet.id });
});

router.get("/:closetId", requireMember, async (req: Request, res: Response) => {
  const membership = await prisma.closetMember.findUnique({
    where: {
      closetId_userId: { closetId: req.closetId!, userId: req.userId! },
    },
    select: { seenAt: true },
  });

  const unreadActivity = membership
    ? await prisma.activity.count({
        where: {
          closetId: req.closetId,
          createdAt: { gt: membership.seenAt },
          OR: [{ actorId: null }, { actorId: { not: req.userId } }],
        },
      })
    : 0;

  const closet = await prisma.closet.findUnique({
    where: { id: req.closetId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      staleDays: true,
      members: {
        orderBy: { joinedAt: "asc" },
        select: { role: true, user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!closet) {
    return res.status(404).send({ message: "Closet not found." });
  }

  res.send({
    id: closet.id,
    name: closet.name,
    inviteCode: closet.inviteCode,
    staleDays: closet.staleDays,
    unreadActivity,
    role: req.closetRole,
    members: closet.members.map(({ role, user }) => ({ ...user, role })),
  });
});

router.patch(
  "/:closetId",
  requireMember,
  requireOwner,
  closetWriteLimiter,
  async (req: Request, res: Response) => {
    const data: { name?: string; staleDays?: number } = {};

    if (req.body?.name !== undefined) {
      const name =
        typeof req.body.name === "string" ? req.body.name.trim() : "";
      const nameError = getClosetNameError(name);
      if (nameError) {
        return res.status(400).send({ message: nameError });
      }
      data.name = name;
    }

    if (req.body?.staleDays !== undefined) {
      const days = req.body.staleDays;
      if (
        typeof days !== "number" ||
        !Number.isInteger(days) ||
        days < STALE_DAYS_MIN ||
        days > STALE_DAYS_MAX
      ) {
        return res.status(400).send({
          message: `Pick between ${STALE_DAYS_MIN} and ${STALE_DAYS_MAX} days.`,
        });
      }
      data.staleDays = days;
    }

    if (!data.name && data.staleDays === undefined) {
      return res.status(400).send({ message: "Nothing to update." });
    }

    const before = await prisma.closet.findUnique({
      where: { id: req.closetId },
      select: { name: true },
    });

    await prisma.closet.update({ where: { id: req.closetId }, data });

    if (data.name && before && data.name !== before.name) {
      await logActivity({
        closetId: req.closetId!,
        actorId: req.userId!,
        type: "CLOSET_RENAMED",
        detail: data.name,
      });
    }

    res.sendStatus(204);
  },
);

router.post(
  "/:closetId/invite-code",
  requireMember,
  requireOwner,
  closetWriteLimiter,
  async (req: Request, res: Response) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const closet = await prisma.closet.update({
          where: { id: req.closetId },
          data: { inviteCode: createInviteCode() },
          select: { inviteCode: true },
        });
        return res.send(closet);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          continue;
        }
        throw err;
      }
    }

    res.status(500).send({ message: "Couldn't make a new code. Try again." });
  },
);

router.delete(
  "/:closetId/members/me",
  requireMember,
  async (req: Request, res: Response) => {
    const others = await prisma.closetMember.count({
      where: { closetId: req.closetId, userId: { not: req.userId } },
    });

    if (others > 0) {
      await logActivity({
        closetId: req.closetId!,
        actorId: req.userId!,
        type: "MEMBER_LEFT",
      });
    }

    await removeMember(req.closetId!, req.userId!);
    res.sendStatus(204);
  },
);

router.delete(
  "/:closetId/members/:userId",
  requireMember,
  requireOwner,
  async (req: Request, res: Response) => {
    const memberId = parseId(req.params.userId);

    if (!memberId) {
      return res.status(404).send({ message: "Member not found." });
    }

    if (memberId === req.userId) {
      return res
        .status(400)
        .send({ message: "Use Leave closet to remove yourself." });
    }

    const member = await prisma.closetMember.findUnique({
      where: { closetId_userId: { closetId: req.closetId!, userId: memberId } },
      select: { user: { select: { name: true } } },
    });

    if (!member) {
      return res.status(404).send({ message: "Member not found." });
    }

    await removeMember(req.closetId!, memberId);
    await logActivity({
      closetId: req.closetId!,
      actorId: req.userId!,
      type: "MEMBER_REMOVED",
      detail: member.user.name,
    });
    res.sendStatus(204);
  },
);

router.get(
  "/:closetId/items",
  requireMember,
  async (req: Request, res: Response) => {
    const items = await prisma.item.findMany({
      where: { closetId: req.closetId },
      orderBy: { createdAt: "desc" },
      select: itemSelect,
      take: MAX_ITEMS_PER_CLOSET,
    });

    res.send(items);
  },
);

router.post(
  "/:closetId/items",
  requireMember,
  closetWriteLimiter,
  async (req: Request, res: Response) => {
    const closetId = req.closetId!;
    const parsed = parseItemInput(req.body, closetId, false);

    if ("error" in parsed) {
      return res.status(400).send({ message: parsed.error });
    }

    const { photos, ...fields } = parsed.data;
    const ruleError = await validateItemRules(closetId, parsed.data);

    if (ruleError) {
      return res.status(400).send({ message: ruleError });
    }

    const count = await prisma.item.count({ where: { closetId } });

    if (count >= MAX_ITEMS_PER_CLOSET) {
      return res.status(400).send({ message: "This closet is full." });
    }

    try {
      const item = await prisma.item.create({
        data: {
          ...fields,
          ...statusDates(fields.status),
          name: fields.name!,
          closetId,
          createdById: req.userId!,
          ...(photos?.length
            ? { photos: { create: photoCreates(photos) } }
            : {}),
        },
        select: itemSelect,
      });

      await logActivity({
        closetId,
        actorId: req.userId!,
        type: "ITEM_ADDED",
        itemId: item.id,
        itemName: item.name,
        detail: item.status,
      });

      res.status(201).send(item);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(400).send({ message: "A photo is already in use." });
      }
      throw err;
    }
  },
);

router.patch(
  "/:closetId/items/:itemId",
  requireMember,
  closetWriteLimiter,
  async (req: Request, res: Response) => {
    const closetId = req.closetId!;
    const itemId = parseId(req.params.itemId);

    const existing = itemId
      ? await prisma.item.findFirst({
          where: { id: itemId, closetId },
          select: {
            id: true,
            name: true,
            status: true,
            priceCents: true,
            minPriceCents: true,
            listedAt: true,
            soldAt: true,
            photos: { select: { publicId: true } },
          },
        })
      : null;

    if (!existing) {
      return res.status(404).send({ message: "Item not found." });
    }

    const parsed = parseItemInput(req.body, closetId, true);

    if ("error" in parsed) {
      return res.status(400).send({ message: parsed.error });
    }

    const { photos, ...fields } = parsed.data;
    const ruleError = await validateItemRules(closetId, parsed.data, existing);

    if (ruleError) {
      return res.status(400).send({ message: ruleError });
    }

    try {
      const item = await prisma.$transaction(async (tx) => {
        if (photos) {
          await tx.itemPhoto.deleteMany({ where: { itemId: existing.id } });
          if (photos.length) {
            await tx.itemPhoto.createMany({
              data: photoCreates(photos).map((photo) => ({
                ...photo,
                itemId: existing.id,
              })),
            });
          }
        }

        return tx.item.update({
          where: { id: existing.id },
          data: {
            ...fields,
            ...statusDates(fields.status, existing),
            ...(fields.status === "LISTED" && existing.status !== "LISTED"
              ? { refreshedAt: new Date() }
              : {}),
          },
          select: itemSelect,
        });
      });

      await logItemChanges(closetId, req.userId!, existing, item);

      if (photos) {
        const kept = new Set(photos.map((photo) => photo.publicId));
        deleteImages(
          existing.photos
            .map((photo) => photo.publicId)
            .filter((id) => !kept.has(id)),
        );
      }

      res.send(item);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(400).send({ message: "A photo is already in use." });
      }
      throw err;
    }
  },
);

router.delete(
  "/:closetId/items/:itemId",
  requireMember,
  closetWriteLimiter,
  async (req: Request, res: Response) => {
    const itemId = parseId(req.params.itemId);

    const existing = itemId
      ? await prisma.item.findFirst({
          where: { id: itemId, closetId: req.closetId },
          select: {
            id: true,
            name: true,
            photos: { select: { publicId: true } },
          },
        })
      : null;

    if (!existing) {
      return res.status(404).send({ message: "Item not found." });
    }

    await prisma.item.delete({ where: { id: existing.id } });
    await logActivity({
      closetId: req.closetId!,
      actorId: req.userId!,
      type: "ITEM_DELETED",
      itemName: existing.name,
    });
    deleteImages(existing.photos.map((photo) => photo.publicId));
    res.sendStatus(204);
  },
);

router.post(
  "/:closetId/items/:itemId/relist",
  requireMember,
  closetWriteLimiter,
  async (req: Request, res: Response) => {
    const itemId = parseId(req.params.itemId);

    const existing = itemId
      ? await prisma.item.findFirst({
          where: { id: itemId, closetId: req.closetId },
          select: { id: true, status: true },
        })
      : null;

    if (!existing) {
      return res.status(404).send({ message: "Item not found." });
    }

    if (existing.status !== "LISTED") {
      return res
        .status(400)
        .send({ message: "Only listed items can be marked as relisted." });
    }

    const item = await prisma.item.update({
      where: { id: existing.id },
      data: { refreshedAt: new Date() },
      select: itemSelect,
    });

    await logActivity({
      closetId: req.closetId!,
      actorId: req.userId!,
      type: "ITEM_RELISTED",
      itemId: item.id,
      itemName: item.name,
    });

    res.send(item);
  },
);

router.get(
  "/:closetId/activity",
  requireMember,
  async (req: Request, res: Response) => {
    const before = parseId(req.query.before);

    const activities = await prisma.activity.findMany({
      where: {
        closetId: req.closetId,
        ...(before ? { id: { lt: before } } : {}),
      },
      orderBy: { id: "desc" },
      take: ACTIVITY_PAGE_SIZE + 1,
      select: {
        id: true,
        type: true,
        itemId: true,
        itemName: true,
        detail: true,
        createdAt: true,
        actor: { select: { id: true, name: true } },
      },
    });

    const hasMore = activities.length > ACTIVITY_PAGE_SIZE;
    const page = activities.slice(0, ACTIVITY_PAGE_SIZE);

    res.send({
      activities: page,
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    });
  },
);

router.post(
  "/:closetId/activity/seen",
  requireMember,
  async (req: Request, res: Response) => {
    await prisma.closetMember.update({
      where: {
        closetId_userId: { closetId: req.closetId!, userId: req.userId! },
      },
      data: { seenAt: new Date() },
    });
    res.sendStatus(204);
  },
);

router.post(
  "/:closetId/uploads/signature",
  requireMember,
  closetWriteLimiter,
  (req: Request, res: Response) => {
    const signature = createUploadSignature(req.closetId!);

    if (!signature) {
      return res
        .status(503)
        .send({ message: "Photo uploads aren't set up yet." });
    }

    res.send(signature);
  },
);

export default router;
