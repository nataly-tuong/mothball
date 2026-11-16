import { api } from "./api";

const PENDING_INVITE_KEY = "mothball:pendingInvite";

export type InvitePreview = {
  name: string;
  memberCount: number;
  inviteCode: string;
};

export function normalizeInviteCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function inviteLink(code: string) {
  return `${window.location.origin}/join/${code}`;
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
