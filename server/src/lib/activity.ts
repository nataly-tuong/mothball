import prisma from "../prismaClient.js";
import type { ActivityType } from "../generated/prisma/client.js";

export type ActivityInput = {
  closetId: number;
  actorId: number | null;
  type: ActivityType;
  itemId?: number | null;
  itemName?: string | null;
  detail?: string | null;
};

const ACTIVITY_MAX_AGE_DAYS = 180;

export async function logActivity(input: ActivityInput) {
  try {
    await prisma.activity.create({
      data: {
        closetId: input.closetId,
        actorId: input.actorId,
        type: input.type,
        itemId: input.itemId ?? null,
        itemName: input.itemName ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch (err) {
    console.error("Activity log failed:", err);
  }
}

export async function pruneOldActivity() {
  const cutoff = new Date(Date.now() - ACTIVITY_MAX_AGE_DAYS * 86_400_000);
  const { count } = await prisma.activity.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  if (count > 0) console.log(`Pruned ${count} old activity entries.`);
}
