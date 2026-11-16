import { api } from "./api";

const PENDING_INVITE_KEY = "mothball:pendingInvite";

export type InvitePreview = {
  name: string;
  memberCount: number;
  itemCount: number;
  inviteCode: string;
};

export function normalizeInviteCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function inviteLink(code: string, from?: string) {
  const url = new URL(`/join/${code}`, window.location.origin);
  if (from) url.searchParams.set("from", from);
  return url.toString();
}

export function inviteMessage(closetName: string) {
  return `Come join my closet "${closetName}" on Mothball! We use it to keep track of what's listed, sold, and still waiting to post on Depop.`;
}

export function inviterFromSearch(search: string) {
  const name = new URLSearchParams(search).get("from") ?? "";
  const clean = name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim()
    .slice(0, 20);
  return clean || null;
}

export function getPendingInvite(): string | null {
  try {
    const code = normalizeInviteCode(
      localStorage.getItem(PENDING_INVITE_KEY) ?? "",
    );
    return code.length === 8 ? code : null;
  } catch {
    return null;
  }
}

export function setPendingInvite(code: string | null) {
  try {
    const clean = code ? normalizeInviteCode(code) : "";
    if (clean.length === 8) {
      localStorage.setItem(PENDING_INVITE_KEY, clean);
    } else {
      localStorage.removeItem(PENDING_INVITE_KEY);
    }
  } catch {
    return;
  }
}

export function fetchInvitePreview(code: string) {
  return api<InvitePreview>(
    `/api/closets/invite/${encodeURIComponent(normalizeInviteCode(code))}`,
  );
}
