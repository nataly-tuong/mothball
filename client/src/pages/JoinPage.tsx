import { useEffect, useState, type JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { UsersIcon } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { setLastClosetId } from "../lib/closets";
import {
  fetchInvitePreview,
  normalizeInviteCode,
  setPendingInvite,
  type InvitePreview,
} from "../lib/invites";

export default function JoinPage(): JSX.Element {
  const { code: codeParam = "" } = useParams();
  const code = normalizeInviteCode(codeParam);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lavender text-plum">
        <UsersIcon size={34} weight="fill" aria-hidden="true" />
      </div>

      {!preview && !error && <p className="muted">Checking your invite...</p>}

      {error && !preview && (
        <>
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
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-plum/60">
              You're invited to join
            </p>
            <h2 className="auth-heading">{preview.name}</h2>
            <p className="muted">
              {preview.memberCount}{" "}
              {preview.memberCount === 1 ? "member" : "members"} share this
              closet on Mothball.
            </p>
          </div>

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
                {joining ? "Joining..." : "Join closet"}
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
                onClick={() => window.location.assign("/api/auth/google")}
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
