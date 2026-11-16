import { useEffect, useState, type JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  CameraIcon,
  CoatHangerIcon,
  SparkleIcon,
  TagIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { setLastClosetId } from "../lib/closets";
import {
  fetchInvitePreview,
  inviterFromSearch,
  normalizeInviteCode,
  setPendingInvite,
  type InvitePreview,
} from "../lib/invites";
import { googleSignInUrl } from "../lib/pwa";

const perks = [
  { Icon: TagIcon, text: "See what's listed, sold, and waiting to post" },
  { Icon: UsersIcon, text: "One shared closet, so nobody lists twice" },
  { Icon: CameraIcon, text: "Square photos and descriptions ready for Depop" },
];

export default function JoinPage(): JSX.Element {
  const { code: codeParam = "" } = useParams();
  const code = normalizeInviteCode(codeParam);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [inviter] = useState(() => inviterFromSearch(window.location.search));

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let active = true;

    fetchInvitePreview(code).then((result) => {
      if (!active) return;
      if (result.ok) {
        setPreview(result.data);
      } else {
        setError(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, [code]);

  useEffect(() => {
    if (preview && !user) setPendingInvite(preview.inviteCode);
  }, [preview, user]);

  async function join() {
    setError("");
    setJoining(true);
    const result = await api<{ id: number }>("/api/closets/join", {
      method: "POST",
      body: { inviteCode: code },
    });
    setJoining(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setPendingInvite(null);
    setLastClosetId(result.data.id);
    navigate(`/closet/${result.data.id}`, { replace: true });
  }

  return (
    <div className="auth-form items-center text-center">
      {!preview && !error && (
        <>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lavender text-plum">
            <UsersIcon size={34} weight="fill" aria-hidden="true" />
          </div>
          <p className="muted">Checking your invite...</p>
        </>
      )}

      {error && !preview && (
        <>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lavender text-plum">
            <UsersIcon size={34} weight="fill" aria-hidden="true" />
          </div>
          <h2 className="auth-heading">Invite not found</h2>
          <p role="alert" className="error-box">
            {error}
          </p>
          <p className="muted">
            Ask whoever invited you for a new link or code.
          </p>
          <Link to={user ? "/closet" : "/"} className="link text-sm">
            {user ? "Go to my closet" : "Back to Mothball"}
          </Link>
        </>
      )}

      {preview && (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lilac/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lilac">
            <SparkleIcon size={14} weight="fill" aria-hidden="true" />
            {inviter ? `${inviter} invited you` : "You're invited"}
          </span>

          <div className="flex flex-col gap-2">
            <h2 className="font-fredoka text-3xl font-medium leading-tight text-plum">
              Come join{" "}
              <span className="bg-linear-to-r from-plum to-lilac bg-clip-text text-transparent">
                {preview.name}
              </span>
              !
            </h2>
            <p className="text-sm leading-relaxed text-plum/70">
              Mothball is a shared closet for selling on Depop together.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1.5 text-sm font-medium text-plum">
              <UsersIcon size={16} weight="fill" aria-hidden="true" />
              {preview.memberCount}{" "}
              {preview.memberCount === 1 ? "member" : "members"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1.5 text-sm font-medium text-plum">
              <CoatHangerIcon size={16} weight="fill" aria-hidden="true" />
              {preview.itemCount} {preview.itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          <ul className="flex w-full flex-col gap-2.5 rounded-2xl border border-lavender-gray bg-mist/60 p-4 text-left">
            {perks.map(({ Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-plum"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-lilac shadow-sm">
                  <Icon size={18} weight="fill" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}

          {loading ? null : user ? (
            <>
              <button
                type="button"
                onClick={join}
                disabled={joining}
                className="btn-primary"
              >
                {joining ? "Joining..." : `Join ${preview.name}`}
              </button>
              <p className="footer-text">
                Joining as {user.name}.{" "}
                <Link to="/closet" className="link">
                  Not now
                </Link>
              </p>
            </>
          ) : (
            <>
              <Link
                to={`/register?invite=${preview.inviteCode}`}
                className="btn-primary text-center"
              >
                Create an account to join
              </Link>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => window.location.assign(googleSignInUrl())}
              >
                <FcGoogle className="h-5 w-5" />
                Continue with Google
              </button>
              <p className="footer-text">
                Already have an account?{" "}
                <Link
                  to={`/login?invite=${preview.inviteCode}`}
                  className="link"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
