import crypto from "crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import prisma from "../../prismaClient.js";
import authMiddleware, {
  getSessionUserId,
} from "../../middleware/authMiddleware.js";
import {
  accountLimiter,
  googleLimiter,
} from "../../middleware/rateLimiters.js";
import { issueAuthCookie } from "../../lib/authCookie.js";
import { NAME_MAX, NAME_MIN } from "../../lib/validation.js";
import { frontendUrl } from "../../lib/config.js";

const router = Router();

const STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

type Mode = "login" | "link";

const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ?? `${frontendUrl}/api/auth/google/callback`;

const stateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/google",
};

let client: OAuth2Client | null = null;

function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  client ??= new OAuth2Client({ clientId, clientSecret, redirectUri });
  return client;
}

function failRedirect(res: Response, mode: Mode, code: string) {
  const page = mode === "link" ? "settings" : "login";
  const param = mode === "link" ? "google" : "error";
  res.redirect(`${frontendUrl}/${page}?${param}=${code}`);
}

function displayNameFrom(...candidates: (string | undefined)[]) {
  for (const candidate of candidates) {
    const clean = (candidate ?? "")
      .split("@")[0]!
      .replace(/[^\p{L}\p{N}]/gu, "")
      .slice(0, NAME_MAX);
    if (clean.length >= NAME_MIN) return clean;
  }
  return "Member";
}

function statesMatch(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function startGoogle(res: Response, mode: Mode, fromApp = false) {
  const oauth = getClient();

  if (!oauth) {
    console.error("Google OAuth is not configured (missing client id/secret).");
    return failRedirect(res, mode, "google_unavailable");
  }

  const state = crypto.randomBytes(32).toString("hex");

  res.cookie(STATE_COOKIE, `${mode}.${state}.${fromApp ? "app" : "web"}`, {
    ...stateCookieOptions,
    maxAge: STATE_TTL_MS,
  });

  res.redirect(
    oauth.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account",
    }),
  );
}

router.get("/google", googleLimiter, (req: Request, res: Response) => {
  startGoogle(res, "login", req.query.app === "1");
});

router.get(
  "/google/link",
  googleLimiter,
  async (req: Request, res: Response) => {
    const userId = await getSessionUserId(req);

    if (!userId) {
      return res.redirect(`${frontendUrl}/login`);
    }

    startGoogle(res, "link");
  },
);

router.get(
  "/google/callback",
  googleLimiter,
  async (req: Request, res: Response) => {
    const stored = req.cookies[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, stateCookieOptions);

    const [storedMode, expectedState, client] =
      typeof stored === "string" ? stored.split(".") : [];
    const mode: Mode = storedMode === "link" ? "link" : "login";
    const fromApp = client === "app";

    const oauth = getClient();

    if (!oauth) {
      return failRedirect(res, mode, "google_unavailable");
    }

    if (typeof req.query.error === "string") {
      return failRedirect(res, mode, "google_cancelled");
    }

    const { code, state } = req.query;

    if (
      typeof code !== "string" ||
      typeof state !== "string" ||
      typeof expectedState !== "string" ||
      !statesMatch(state, expectedState)
    ) {
      return failRedirect(res, mode, "google_failed");
    }

    try {
      const { tokens } = await oauth.getToken(code);

      if (!tokens.id_token) {
        return failRedirect(res, mode, "google_failed");
      }

      const ticket = await oauth.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID!,
      });

      const profile = ticket.getPayload();

      if (!profile?.sub || !profile.email) {
        return failRedirect(res, mode, "google_failed");
      }

      if (!profile.email_verified) {
        return failRedirect(res, mode, "google_unverified");
      }

      const googleId = profile.sub;

      if (mode === "link") {
        const userId = await getSessionUserId(req);

        if (!userId) {
          return failRedirect(res, "login", "google_failed");
        }

        const owner = await prisma.user.findUnique({
          where: { googleId },
          select: { id: true },
        });

        if (owner && owner.id !== userId) {
          return failRedirect(res, mode, "google_in_use");
        }

        await prisma.user.update({
          where: { id: userId },
          data: { googleId },
        });

        return res.redirect(`${frontendUrl}/settings?google=linked`);
      }

      const email = profile.email.trim().toLowerCase();
      const name = displayNameFrom(profile.given_name, profile.name, email);

      let user = await prisma.user.findUnique({ where: { googleId } });

      if (!user) {
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing?.googleId) {
          return failRedirect(res, mode, "google_failed");
        }

        if (existing) {
          user = await prisma.user.update({
            where: { id: existing.id },
            data: {
              googleId,
              emailVerified: true,
              verificationToken: null,
              verificationTokenExpiry: null,
              ...(existing.emailVerified
                ? {}
                : {
                    name,
                    passwordHash: null,
                    resetToken: null,
                    resetTokenExpiry: null,
                    tokenVersion: { increment: 1 },
                  }),
            },
          });
        } else {
          user = await prisma.user.create({
            data: { name, email, googleId, emailVerified: true },
          });
        }
      }

      issueAuthCookie(res, user, fromApp ? "app" : "long");
      res.redirect(`${frontendUrl}/closet`);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      failRedirect(res, mode, "google_failed");
    }
  },
);

router.post(
  "/google/unlink",
  authMiddleware,
  accountLimiter,
  async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.sendStatus(404);
    }

    if (!user.passwordHash) {
      return res.status(400).send({
        message:
          "Set a password before disconnecting Google, so you can still log in.",
      });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { googleId: null },
    });

    res.sendStatus(204);
  },
);

export default router;
