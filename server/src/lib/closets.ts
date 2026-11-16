import crypto from "crypto";
import prisma from "../prismaClient.js";
import { deleteImages } from "./cloudinary.js";
import { logActivity } from "./activity.js";

const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const INVITE_LENGTH = 8;

export const CLOSET_NAME_MAX = 40;

export function createInviteCode() {
  let code = "";
  for (let i = 0; i < INVITE_LENGTH; i++) {
    code += INVITE_ALPHABET[crypto.randomInt(INVITE_ALPHABET.length)];
  }
  return code;
}

export function normalizeInviteCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function getClosetNameError(name: string): string | null {
  if (!name) {
    return "Give your closet a name.";
  }
  if (name.length > CLOSET_NAME_MAX) {
    return `Closet name can't be longer than ${CLOSET_NAME_MAX} characters.`;
  }
  return null;
}

export async function removeMember(closetId: number, userId: number) {
  const imageIds: string[] = await prisma.$transaction(async (tx) => {
    const membership = await tx.closetMember.findUnique({
      where: { closetId_userId: { closetId, userId } },
    });

    if (!membership) {
      return [];
    }

    await tx.closetMember.delete({
      where: { closetId_userId: { closetId, userId } },
    });

    await tx.item.updateMany({
      where: { closetId, ownerId: userId },
      data: { ownerId: null },
    });

    const next = await tx.closetMember.findFirst({
      where: { closetId },
      orderBy: { joinedAt: "asc" },
    });

    if (!next) {
      const photos = await tx.itemPhoto.findMany({
        where: { item: { closetId } },
        select: { publicId: true },
      });
      await tx.closet.delete({ where: { id: closetId } });
      return photos.map((photo) => photo.publicId);
    }

    if (membership.role === "OWNER") {
      await tx.closetMember.update({
        where: { closetId_userId: { closetId, userId: next.userId } },
        data: { role: "OWNER" },
      });
    }

    return [];
  });

  deleteImages(imageIds);
}

export async function removeUserFromAllClosets(userId: number) {
  const memberships = await prisma.closetMember.findMany({
    where: { userId },
    select: {
      closetId: true,
      closet: { select: { _count: { select: { members: true } } } },
    },
  });

  for (const { closetId, closet } of memberships) {
    if (closet._count.members > 1) {
      await logActivity({ closetId, actorId: userId, type: "MEMBER_LEFT" });
    }
    await removeMember(closetId, userId);
  }
}
