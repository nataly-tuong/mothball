import { useEffect, useState, type JSX, type SubmitEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { CrownSimpleIcon, KeyIcon, WarningIcon } from "@phosphor-icons/react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { setLastClosetId, type ClosetSummary } from "../lib/closets";
import { openInstallGuide } from "../lib/pwa";
import { celebrate } from "../lib/celebrate";

const CODE_LENGTH = 6;

export default function SettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();

  const [googleMessage] = useState(() => {
    const messages: Record<string, string> = {
      linked: "Google account connected. You can now log in with Google.",
      google_in_use:
        "That Google account is already connected to a different Mothball account.",
      google_cancelled: "Connecting Google was cancelled.",
      google_unverified: "That Google account's email isn't verified yet.",
      google_unavailable: "Google sign-in isn't available right now.",
      google_failed: "Couldn't connect Google. Please try again.",
    };
    const key = searchParams.get("google");
    return key ? (messages[key] ?? messages.google_failed) : "";
  });
  const googleLinked = searchParams.get("google") === "linked";
  const [googleError, setGoogleError] = useState("");
  const [unlinking, setUnlinking] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [savingConfetti, setSavingConfetti] = useState(false);

  const [nameError, setNameError] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [closets, setClosets] = useState<ClosetSummary[] | null>(null);
  const [closetError, setClosetError] = useState("");
  const [leaving, setLeaving] = useState<number | null>(null);

  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "code">(
    "idle",
  );
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    void loadClosets();
  }, []);

  async function loadClosets() {
    const result = await api<ClosetSummary[]>("/api/closets");
    if (result.ok) setClosets(result.data);
    else setClosetError(result.message);
  }

  async function toggleConfetti() {
    if (!user) return;
    const next = !user.confetti;
    setSavingConfetti(true);
    const result = await api("/api/auth/me", {
      method: "PATCH",
      body: { confetti: next },
    });
    setSavingConfetti(false);
    if (result.ok) {
      await refreshUser();
      if (next) void celebrate("LISTED");
    }
  }

  async function signOutEverywhere() {
    setSigningOutAll(true);
    const result = await api("/api/auth/logout-all", { method: "POST" });
    setSigningOutAll(false);

    if (!result.ok) {
      setGoogleError(result.message);
      return;
    }

    await refreshUser();
    navigate("/login", {
      replace: true,
      state: { message: "You've been signed out on every device." },
    });
  }

  async function unlinkGoogle() {
    setGoogleError("");
    setUnlinking(true);
    const result = await api("/api/auth/google/unlink", { method: "POST" });
    setUnlinking(false);

    if (!result.ok) {
      setGoogleError(result.message);
      return;
    }

    await refreshUser();
  }

  async function handleNameSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError("");
    setNameSaved(false);

    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();

    setSavingName(true);
    const result = await api("/api/auth/me", {
      method: "PATCH",
      body: { name },
    });
    setSavingName(false);

    if (!result.ok) {
      setNameError(result.message);
      return;
    }

    await refreshUser();
    setNameSaved(true);
  }

  async function leaveCloset(closet: ClosetSummary) {
    setClosetError("");

    if (leaving !== closet.id) {
      setLeaving(closet.id);
      return;
    }

    const result = await api(`/api/closets/${closet.id}/members/me`, {
      method: "DELETE",
    });
    setLeaving(null);

    if (!result.ok) {
      setClosetError(result.message);
      return;
    }

    setLastClosetId(null);
    await loadClosets();
  }

  async function sendDeleteCode() {
    setDeleteError("");
    setDeleteBusy(true);
    const result = await api("/api/auth/account/delete-code", {
      method: "POST",
    });
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }

    setDeleteCode("");
    setDeleteStep("code");
  }

  async function confirmDelete(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (deleteCode.length !== CODE_LENGTH) return;

    setDeleteError("");
    setDeleteBusy(true);
    const result = await api("/api/auth/account", {
      method: "DELETE",
      body: { code: deleteCode },
    });
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.message);
      setDeleteCode("");
      return;
    }

    setLastClosetId(null);
    await refreshUser();
    navigate("/login", {
      replace: true,
      state: { message: "Your account was deleted." },
    });
  }

  if (!user) {
    return (
      <AppShell>
        <p className="muted">Loading...</p>
      </AppShell>
    );
  }

  const leavingCloset = closets?.find((c) => c.id === leaving);
  const soloClosets = (closets ?? []).filter((c) => c.memberCount === 1);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-plum text-4xl font-bold">Settings</h2>
          <p className="muted">Manage your account and closets.</p>
        </div>

        <section
          className="card flex flex-col gap-4"
          aria-labelledby="profile-heading"
        >
          <h3 id="profile-heading" className="card-heading">
            Profile
          </h3>

          <form onSubmit={handleNameSubmit} className="flex flex-col gap-1.5">
            <label htmlFor="settings-name" className="field-label">
              Display name
            </label>
            <div className="flex gap-2">
              <input
                id="settings-name"
                name="name"
                type="text"
                required
                maxLength={20}
                defaultValue={user.name}
                onChange={() => {
                  setNameError("");
                  setNameSaved(false);
                }}
                aria-invalid={nameError !== ""}
                className="input"
              />
              <button
                type="submit"
                disabled={savingName}
                className="btn-small-primary shrink-0"
              >
                {savingName ? "Saving..." : "Save"}
              </button>
            </div>
            <p className="text-xs text-plum/60">
              Shown to people in your closets. Letters and numbers only.
            </p>
            {nameError && (
              <p role="alert" className="error-box">
                {nameError}
              </p>
            )}
            {nameSaved && (
              <p role="status" className="text-sm text-plum/70">
                Saved.
              </p>
            )}
          </form>

          <div className="flex flex-col gap-1.5">
            <span className="field-label">Email</span>
            <p className="rounded-lg border border-lavender-gray bg-mist px-4 py-2.5 text-plum/80">
              {user.email}
            </p>
          </div>
        </section>

        <section
          className="card flex flex-col gap-4"
          aria-labelledby="signin-heading"
        >
          <h3 id="signin-heading" className="card-heading">
            Sign-in methods
          </h3>
          <ul className="flex flex-col gap-2">
            <li className="flex items-center justify-between gap-3 rounded-xl border border-lavender-gray px-4 py-3">
              <span className="flex items-center gap-2.5 font-medium text-plum">
                <KeyIcon size={20} aria-hidden="true" />
                Password
              </span>
              <Link to="/forgot-password" className="link text-sm">
                {user.hasPassword ? "Change password" : "Set a password"}
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl border border-lavender-gray px-4 py-3">
              <span className="flex items-center gap-2.5 font-medium text-plum">
                <FcGoogle className="h-5 w-5" aria-hidden="true" />
                Google
              </span>
              {user.hasGoogle ? (
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-plum/60">Connected</span>
                  {user.hasPassword && (
                    <button
                      type="button"
                      onClick={unlinkGoogle}
                      disabled={unlinking}
                      className="font-medium text-coral cursor-pointer hover:underline disabled:opacity-60"
                    >
                      {unlinking ? "Disconnecting..." : "Disconnect"}
                    </button>
                  )}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    window.location.assign("/api/auth/google/link")
                  }
                  className="btn-small-secondary"
                >
                  Connect Google
                </button>
              )}
            </li>
          </ul>
          {googleMessage && (
            <p
              role={googleLinked ? "status" : "alert"}
              className={googleLinked ? "text-sm text-plum/70" : "error-box"}
            >
              {googleMessage}
            </p>
          )}
          {googleError && (
            <p role="alert" className="error-box">
              {googleError}
            </p>
          )}
          <p className="text-xs text-plum/60">
            Password changes go through a reset link sent to your email.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-lavender-gray pt-4">
            <p className="muted">
              Lost a phone or used a shared computer? Sign out everywhere.
            </p>
            <button
              type="button"
              onClick={signOutEverywhere}
              disabled={signingOutAll}
              className="btn-small-secondary"
            >
              {signingOutAll ? "Signing out..." : "Sign out of all devices"}
            </button>
          </div>
        </section>

        <section
          className="card flex items-center justify-between gap-4"
          aria-labelledby="confetti-heading"
        >
          <div className="flex flex-col gap-1">
            <h3 id="confetti-heading" className="card-heading">
              Celebrations
            </h3>
            <p className="muted">
              Confetti when something gets listed or sold.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={user.confetti}
            aria-labelledby="confetti-heading"
            onClick={toggleConfetti}
            disabled={savingConfetti}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition cursor-pointer disabled:opacity-60 ${
              user.confetti ? "bg-plum" : "bg-lavender-gray"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                user.confetti ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </section>

        <section
          className="card flex flex-wrap items-center justify-between gap-4"
          aria-labelledby="app-heading"
        >
          <div className="flex flex-col gap-1">
            <h3 id="app-heading" className="card-heading">
              Mothball app
            </h3>
            <p className="muted">
              Add Mothball to your phone's home screen so it opens like an app.
            </p>
          </div>
          <button
            type="button"
            onClick={openInstallGuide}
            className="btn-small-secondary"
          >
            Get the app
          </button>
        </section>

        <section
          className="card flex flex-col gap-4"
          aria-labelledby="closets-heading"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="closets-heading" className="card-heading">
              Your closets
            </h3>
            <Link to="/closet/new" className="link text-sm">
              New or join
            </Link>
          </div>

          {closets === null ? (
            <p className="muted">Loading...</p>
          ) : closets.length === 0 ? (
            <p className="muted">You're not in any closets yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {closets.map((closet) => (
                <li
                  key={closet.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lavender-gray px-4 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/closet/${closet.id}`}
                      className="flex items-center gap-2 font-medium text-plum hover:underline"
                    >
                      <span className="truncate">{closet.name}</span>
                      {closet.role === "OWNER" && (
                        <CrownSimpleIcon
                          size={14}
                          weight="fill"
                          className="shrink-0 text-lilac"
                          aria-label="Owner"
                        />
                      )}
                    </Link>
                    <p className="text-xs text-plum/60">
                      {closet.memberCount}{" "}
                      {closet.memberCount === 1 ? "member" : "members"} ·{" "}
                      {closet.itemCount}{" "}
                      {closet.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {leaving === closet.id && (
                      <button
                        type="button"
                        onClick={() => setLeaving(null)}
                        className="text-sm text-plum/60 cursor-pointer hover:text-plum"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => leaveCloset(closet)}
                      className={
                        leaving === closet.id
                          ? "btn-small-danger"
                          : "text-sm font-medium text-coral cursor-pointer hover:underline"
                      }
                    >
                      {leaving === closet.id ? "Confirm leave" : "Leave"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {leavingCloset && leavingCloset.memberCount === 1 && (
            <p className="muted">
              You're the only member of {leavingCloset.name}, so leaving deletes
              it and all its items.
            </p>
          )}

          {closetError && (
            <p role="alert" className="error-box">
              {closetError}
            </p>
          )}
        </section>

        <section
          className="card flex flex-col gap-4 border-coral/40"
          aria-labelledby="delete-heading"
        >
          <h3
            id="delete-heading"
            className="card-heading flex items-center gap-2"
          >
            <WarningIcon size={22} className="text-coral" aria-hidden="true" />
            Delete account
          </h3>
          <p className="muted">
            This permanently deletes your account and removes you from every
            closet. Items you added stay in shared closets.
            {soloClosets.length > 0 &&
              ` Closets where you're the only member (${soloClosets
                .map((c) => c.name)
                .join(", ")}) will be deleted with all their items.`}
          </p>

          {deleteStep === "idle" && (
            <button
              type="button"
              onClick={() => setDeleteStep("confirm")}
              className="btn-small-danger self-start"
            >
              Delete account
            </button>
          )}

          {deleteStep === "confirm" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-plum">
                We'll email a 6-digit code to {user.email} to confirm.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={sendDeleteCode}
                  disabled={deleteBusy}
                  className="btn-small-danger"
                >
                  {deleteBusy ? "Sending..." : "Send code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteStep("idle");
                    setDeleteError("");
                  }}
                  className="btn-small-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === "code" && (
            <form onSubmit={confirmDelete} className="flex flex-col gap-3">
              <label htmlFor="delete-code" className="field-label">
                Enter the code we sent to {user.email}
              </label>
              <input
                id="delete-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="------"
                maxLength={CODE_LENGTH}
                autoFocus
                value={deleteCode}
                onChange={(e) => {
                  setDeleteCode(
                    e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
                  );
                  setDeleteError("");
                }}
                aria-invalid={deleteError !== ""}
                disabled={deleteBusy}
                className="input max-w-60 text-center text-2xl font-semibold tracking-[0.5em]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={deleteBusy || deleteCode.length !== CODE_LENGTH}
                  className="btn-small-danger"
                >
                  {deleteBusy ? "Deleting..." : "Permanently delete account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteStep("idle");
                    setDeleteError("");
                  }}
                  className="btn-small-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendDeleteCode}
                  disabled={deleteBusy}
                  className="link cursor-pointer text-sm"
                >
                  Send a new code
                </button>
              </div>
            </form>
          )}

          {deleteError && (
            <p role="alert" className="error-box">
              {deleteError}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
