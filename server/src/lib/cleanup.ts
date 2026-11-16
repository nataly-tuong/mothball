import prisma from "../prismaClient.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const UNVERIFIED_MAX_AGE_MS = 7 * DAY_MS;
const RUN_EVERY_MS = 6 * 60 * 60 * 1000;

export async function deleteStaleUnverifiedUsers() {
  const now = new Date();

  try {
    const { count } = await prisma.user.deleteMany({
      where: {
        emailVerified: false,
        googleId: null,
        createdAt: { lt: new Date(now.getTime() - UNVERIFIED_MAX_AGE_MS) },
        OR: [
          { verificationTokenExpiry: null },
          { verificationTokenExpiry: { lt: now } },
        ],
      },
    });

    if (count > 0) {
      console.log(`Deleted ${count} unverified account(s).`);
    }
  } catch (err) {
    console.error("Unverified account cleanup failed:", err);
  }
}

export function startCleanupJobs() {
  void deleteStaleUnverifiedUsers();
  setInterval(() => void deleteStaleUnverifiedUsers(), RUN_EVERY_MS).unref();
}
