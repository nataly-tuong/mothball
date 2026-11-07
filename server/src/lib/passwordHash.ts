import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

export async function verifyPassword(
  password: string,
  hash: string | null | undefined,
): Promise<boolean> {
  const matches = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return hash ? matches : false;
}

export function needsRehash(hash: string) {
  return bcrypt.getRounds(hash) < BCRYPT_COST;
}
