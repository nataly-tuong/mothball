import crypto from "crypto";

const HIBP_URL = "https://api.pwnedpasswords.com/range/";

const BREACH_THRESHOLD = 1;

export async function getBreachCount(password: string): Promise<number> {
  const hash = crypto
    .createHash("sha1")
    .update(password)
    .digest("hex")
    .toUpperCase();

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const res = await fetch(`${HIBP_URL}${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.warn(`HIBP lookup returned ${res.status}`);
      return 0;
    }

    const body = await res.text();

    for (const line of body.split("\n")) {
      const [lineSuffix, count] = line.trim().split(":");
      if (lineSuffix === suffix) {
        return Number(count) || 0;
      }
    }

    return 0;
  } catch (error) {
    console.warn("HIBP lookup failed:", error);
    return 0;
  }
}

export async function isPasswordBreached(password: string): Promise<boolean> {
  return (await getBreachCount(password)) >= BREACH_THRESHOLD;
}

export const BREACHED_PASSWORD_MESSAGE =
  "This password has appeared in a known data breach. Please choose a different one.";
