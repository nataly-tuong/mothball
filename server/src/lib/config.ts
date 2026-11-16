const isProduction = process.env.NODE_ENV === "production";

function resolveFrontendUrl() {
  const raw = process.env.FRONTEND_URL?.trim().replace(/\/+$/, "");

  if (!raw) {
    if (isProduction) {
      throw new Error(
        "FRONTEND_URL must be set in production (e.g. https://mothball-closet.vercel.app)",
      );
    }
    return "http://localhost:5173";
  }

  const url = new URL(raw);

  if (isProduction && url.protocol !== "https:") {
    throw new Error("FRONTEND_URL must use https in production");
  }

  return url.origin;
}

export const frontendUrl = resolveFrontendUrl();
export { isProduction };

export function verifyLink(email: string, code: string) {
  const params = new URLSearchParams({ email, code });
  return `${frontendUrl}/verify-email?${params.toString()}`;
}
