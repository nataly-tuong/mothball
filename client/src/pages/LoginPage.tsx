import type { SubmitEvent, JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import {
  fetchInvitePreview,
  getPendingInvite,
  normalizeInviteCode,
  setPendingInvite,
} from "../lib/invites";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import { apiFetch } from "../lib/api";
import { googleSignInUrl, isStandalone } from "../lib/pwa";

const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_unverified: "Your Google email isn't verified yet.",
  google_unavailable: "Google sign-in isn't available right now.",
  google_failed: "Google sign-in failed. Please try again.",
};

function getGoogleError(search: string) {
  const code = new URLSearchParams(search).get("error");
  if (!code?.startsWith("google_")) return "";
  return GOOGLE_ERRORS[code] ?? GOOGLE_ERRORS.google_failed;
}

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const [error, setError] = useState(() => getGoogleError(location.search));
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const [inApp] = useState(isStandalone);
  const [inviteCode] = useState(() => {
    const fromUrl = normalizeInviteCode(searchParams.get("invite") ?? "");
    if (fromUrl.length === 8) setPendingInvite(fromUrl);
    return fromUrl.length === 8 ? fromUrl : getPendingInvite();
  });
  const [inviteName, setInviteName] = useState("");

  useEffect(() => {
    if (!inviteCode) return;
    let active = true;

    fetchInvitePreview(inviteCode).then((result) => {
      if (!active) return;
      if (result.ok) setInviteName(result.data.name);
      else setPendingInvite(null);
    });

    return () => {
      active = false;
    };
  }, [inviteCode]);

  const notice =
    typeof location.state?.message === "string" ? location.state.message : "";

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          remember: form.get("remember") === "on",
          app: isStandalone(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.code === "EMAIL_NOT_VERIFIED") {
          void apiFetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }).catch(() => {});

          navigate("/verify-email", { state: { email } });
          return;
        }

        setError(data?.message ?? "Something went wrong. Please try again");
        return;
      }

      await refreshUser();
      navigate(
        typeof location.state?.from === "string" &&
          location.state.from.startsWith("/") &&
          !location.state.from.startsWith("//")
          ? location.state.from
          : "/closet",
        { replace: true },
      );
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => error && setError("")}
      className="auth-form"
    >
      <h2 className="auth-heading">Log in</h2>

      {notice && (
        <p role="status" className="text-sm leading-snug text-plum/70">
          {notice}
        </p>
      )}

      {inviteName && (
        <p
          role="status"
          className="rounded-lg bg-lavender px-3 py-2 text-sm leading-snug text-plum"
        >
          Log in to join <strong>{inviteName}</strong>.
        </p>
      )}

      <div className="field">
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="jane.doe@example.com"
          autoComplete="email"
          required
          aria-invalid={error !== ""}
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="your password"
          autoComplete="current-password"
          required
          aria-invalid={error !== ""}
        />
      </div>

      <div className="flex items-center justify-between">
        {inApp ? (
          <span className="text-sm text-plum/60">
            You'll stay logged in on this app.
          </span>
        ) : (
          <label
            htmlFor="remember"
            className="flex cursor-pointer items-center gap-2 text-sm text-plum"
          >
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-plum"
            />
            Remember me
          </label>
        )}
        <Link to="/forgot-password" className="link text-sm">
          Forgot password?
        </Link>
      </div>

      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading ? "Logging in..." : "Log in"}
      </button>

      <div className="divider">
        <div className="divider-line" />
        <span className="divider-text">or</span>
        <div className="divider-line" />
      </div>

      <button
        type="button"
        className="btn-secondary"
        onClick={() => window.location.assign(googleSignInUrl())}
      >
        <FcGoogle className="h-5 w-5" />
        Continue with Google
      </button>

      <p className="footer-text">
        Don't have an account?{" "}
        <Link to="/register" className="link">
          Sign up
        </Link>
      </p>
    </form>
  );
}
