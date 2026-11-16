import { useState, type JSX, type SubmitEvent } from "react";
import {
  ArrowsClockwiseIcon,
  CheckIcon,
  CopyIcon,
  CrownSimpleIcon,
  LinkIcon,
  UserMinusIcon,
} from "@phosphor-icons/react";
import Modal from "./Modal";
import { api } from "../lib/api";
import { formatInviteCode, type ClosetDetail } from "../lib/closets";
import { inviteLink } from "../lib/invites";

type ManageClosetDialogProps = {
  open: boolean;
  closet: ClosetDetail;
  currentUserId: number;
  onClose: () => void;
  onChanged: () => void;
  onLeft: () => void;
};

export default function ManageClosetDialog(
  props: ManageClosetDialogProps,
): JSX.Element {
  return (
    <Modal open={props.open} title="Manage closet" onClose={props.onClose}>
      <ManageClosetContent {...props} />
    </Modal>
  );
}

function ManageClosetContent({
  closet,
  currentUserId,
  onChanged,
  onLeft,
}: ManageClosetDialogProps): JSX.Element {
  const isOwner = closet.role === "OWNER";

  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  async function copy(kind: "code" | "link") {
    const text =
      kind === "link"
        ? inviteLink(closet.inviteCode)
        : formatInviteCode(closet.inviteCode);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Couldn't copy. Select the code and copy it instead.");
    }
  }

  async function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError("");
    setBusy(true);
    const result = await action();
    setBusy(false);

    if (!result.ok) {
      setError(result.message ?? "Something went wrong.");
      return false;
    }
    return true;
  }

  async function handleRename(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    if (name === closet.name) return;

    const ok = await run(() =>
      api(`/api/closets/${closet.id}`, { method: "PATCH", body: { name } }),
    );
    if (ok) onChanged();
  }

  async function regenerateCode() {
    const ok = await run(() =>
      api(`/api/closets/${closet.id}/invite-code`, { method: "POST" }),
    );
    if (ok) onChanged();
  }

  async function removeMember(memberId: number) {
    if (confirmRemove !== memberId) {
      setConfirmRemove(memberId);
      return;
    }

    const ok = await run(() =>
      api(`/api/closets/${closet.id}/members/${memberId}`, {
        method: "DELETE",
      }),
    );
    setConfirmRemove(null);
    if (ok) onChanged();
  }

  async function leave() {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }

    const ok = await run(() =>
      api(`/api/closets/${closet.id}/members/me`, { method: "DELETE" }),
    );
    if (ok) onLeft();
  }

  const lastMember = closet.members.length === 1;

  return (
    <div className="flex flex-col gap-6">
      {isOwner && (
        <form
          key={closet.name}
          onSubmit={handleRename}
          className="flex flex-col gap-1.5"
        >
          <label htmlFor="rename-closet" className="field-label">
            Closet name
          </label>
          <div className="flex gap-2">
            <input
              id="rename-closet"
              name="name"
              type="text"
              required
              maxLength={40}
              defaultValue={closet.name}
              className="input"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-small-secondary shrink-0"
            >
              Rename
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        <span className="field-label">Invite people</span>
        <p className="muted">
          Send the link, or share the code so they can enter it when they sign
          up or on the Join a closet screen.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-lg bg-lavender px-4 py-2 font-semibold tracking-[0.2em] text-plum select-all">
            {formatInviteCode(closet.inviteCode)}
          </code>
          <button
            type="button"
            onClick={() => copy("link")}
            className="btn-small-primary"
          >
            {copied === "link" ? (
              <CheckIcon size={16} weight="bold" aria-hidden="true" />
            ) : (
              <LinkIcon size={16} aria-hidden="true" />
            )}
            {copied === "link" ? "Link copied" : "Copy invite link"}
          </button>
          <button
            type="button"
            onClick={() => copy("code")}
            className="btn-small-secondary"
          >
            {copied === "code" ? (
              <CheckIcon size={16} weight="bold" aria-hidden="true" />
            ) : (
              <CopyIcon size={16} aria-hidden="true" />
            )}
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={regenerateCode}
              disabled={busy}
              className="btn-small-secondary"
              title="Make a new code. The old one stops working."
            >
              <ArrowsClockwiseIcon size={16} aria-hidden="true" />
              New code
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="field-label">Members ({closet.members.length})</span>
        <ul className="flex flex-col gap-2">
          {closet.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-lavender-gray px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-plum">
                  {member.name}
                  {member.id === currentUserId && (
                    <span className="text-plum/50"> (you)</span>
                  )}
                </span>
                {member.role === "OWNER" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-lilac/20 px-2 py-0.5 text-xs font-medium text-plum">
                    <CrownSimpleIcon
                      size={12}
                      weight="fill"
                      aria-hidden="true"
                    />
                    Owner
                  </span>
                )}
              </div>

              {isOwner && member.id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => removeMember(member.id)}
                  disabled={busy}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-coral cursor-pointer hover:underline"
                >
                  <UserMinusIcon size={16} aria-hidden="true" />
                  {confirmRemove === member.id ? "Confirm remove" : "Remove"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-lavender-gray pt-4">
        {confirmLeave && (
          <p className="muted">
            {lastMember
              ? "You're the only member, so leaving deletes this closet and all its items."
              : isOwner
                ? "The longest-standing member will become the owner."
                : "You'll need a new invite code to come back."}
          </p>
        )}
        <button
          type="button"
          onClick={leave}
          disabled={busy}
          className={
            confirmLeave
              ? "btn-small-danger self-start"
              : "self-start text-sm font-medium text-coral cursor-pointer hover:underline"
          }
        >
          {confirmLeave
            ? lastMember
              ? "Leave and delete closet"
              : "Yes, leave closet"
            : "Leave closet"}
        </button>
      </div>
    </div>
  );
}
