import { useEffect, useState, type JSX, type SubmitEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CoatHangerIcon, UsersIcon } from "@phosphor-icons/react";
import AppShell from "../components/AppShell";
import { api } from "../lib/api";
import { getPendingInvite, setPendingInvite } from "../lib/invites";
import {
  getLastClosetId,
  setLastClosetId,
  type ClosetSummary,
} from "../lib/closets";

export default function ClosetHomePage({
  onboarding = false,
}: {
  onboarding?: boolean;
}): JSX.Element {
  const navigate = useNavigate();
  const [closets, setClosets] = useState<ClosetSummary[] | null>(null);
  const [loadError, setLoadError] = useState("");

  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [pendingInvite] = useState(() => getPendingInvite());
  const [usingInvite, setUsingInvite] = useState(pendingInvite !== null);
  const [joinDefault, setJoinDefault] = useState("");

  useEffect(() => {
    if (!pendingInvite) return;
    let active = true;

    setPendingInvite(null);
    api<{ id: number }>("/api/closets/join", {
      method: "POST",
      body: { inviteCode: pendingInvite },
    }).then((result) => {
      if (!active) return;
      if (result.ok) {
        setLastClosetId(result.data.id);
        navigate(`/closet/${result.data.id}`, { replace: true });
        return;
      }
      setJoinDefault(pendingInvite);
      setJoinError(`Couldn't use your invite: ${result.message}`);
      setUsingInvite(false);
    });

    return () => {
      active = false;
    };
  }, [pendingInvite, navigate]);

  useEffect(() => {
    let active = true;

    api<ClosetSummary[]>("/api/closets").then((result) => {
      if (!active) return;
      if (result.ok) {
        setClosets(result.data);
      } else {
        setLoadError(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError("");

    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();

    setCreating(true);
    const result = await api<{ id: number }>("/api/closets", {
      method: "POST",
      body: { name },
    });
    setCreating(false);

    if (!result.ok) {
      setCreateError(result.message);
      return;
    }

    setLastClosetId(result.data.id);
    navigate(`/closet/${result.data.id}`);
  }

  async function handleJoin(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setJoinError("");

    const inviteCode = String(
      new FormData(e.currentTarget).get("inviteCode") ?? "",
    ).trim();

    setJoining(true);
    const result = await api<{ id: number }>("/api/closets/join", {
      method: "POST",
      body: { inviteCode },
    });
    setJoining(false);

    if (!result.ok) {
      setJoinError(result.message);
      return;
    }

    setLastClosetId(result.data.id);
    navigate(`/closet/${result.data.id}`);
  }

  if (usingInvite) {
    return (
      <AppShell showNav={false}>
        <p className="muted">Joining your invited closet...</p>
      </AppShell>
    );
  }

  if (!onboarding && closets && closets.length > 0 && !joinError) {
    const lastId = getLastClosetId();
    const target = closets.find((c) => c.id === lastId) ?? closets[0];
    return <Navigate to={`/closet/${target.id}`} replace />;
  }

  return (
    <AppShell showNav={false}>
      {closets === null && !loadError ? (
        <p className="muted">Loading your closets...</p>
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-plum text-4xl font-bold">
              {closets && closets.length > 0
                ? "Add a closet"
                : "Set up your closet"}
            </h2>
            <p className="muted">
              Start a new closet and invite people, or join one with an invite
              code someone shared with you.
            </p>
            {loadError && (
              <p role="alert" className="error-box">
                {loadError}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <form onSubmit={handleCreate} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lavender text-plum">
                  <CoatHangerIcon size={22} weight="fill" aria-hidden="true" />
                </div>
                <h3 className="card-heading">Start a closet</h3>
              </div>

              <div className="field">
                <label htmlFor="closet-name" className="field-label">
                  Closet name
                </label>
                <input
                  id="closet-name"
                  name="name"
                  type="text"
                  required
                  maxLength={40}
                  placeholder="Viktor & Caitlyn's closet"
                  onChange={() => createError && setCreateError("")}
                  aria-invalid={createError !== ""}
                  className="input"
                />
              </div>

              {createError && (
                <p role="alert" className="error-box">
                  {createError}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="btn-primary mt-auto"
              >
                {creating ? "Creating..." : "Create closet"}
              </button>
            </form>

            <form onSubmit={handleJoin} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lavender text-plum">
                  <UsersIcon size={22} weight="fill" aria-hidden="true" />
                </div>
                <h3 className="card-heading">Join a closet</h3>
              </div>

              <div className="field">
                <label htmlFor="invite-code" className="field-label">
                  Invite code
                </label>
                <input
                  id="invite-code"
                  name="inviteCode"
                  key={joinDefault}
                  defaultValue={joinDefault}
                  type="text"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={9}
                  placeholder="ABCD-1234"
                  onChange={() => joinError && setJoinError("")}
                  aria-invalid={joinError !== ""}
                  className="input font-semibold uppercase tracking-[0.2em]"
                />
              </div>

              {joinError && (
                <p role="alert" className="error-box">
                  {joinError}
                </p>
              )}

              <button
                type="submit"
                disabled={joining}
                className="btn-secondary mt-auto"
              >
                {joining ? "Joining..." : "Join closet"}
              </button>
            </form>
          </div>

          {closets && closets.length > 0 && (
            <Link to="/closet" className="link text-sm">
              Back to my closet
            </Link>
          )}
        </div>
      )}
    </AppShell>
  );
}
