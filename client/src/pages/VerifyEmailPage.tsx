import { useEffect, useState, type JSX } from "react";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyEmail(): JSX.Element {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const knownEmail =
    typeof location.state?.email === "string" ? location.state.email : "";

  const [email, setEmail] = useState(knownEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!loading && user?.emailVerified) {
      navigate("/closet", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(value: string) {
    if (submitting) return;

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: value }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message ?? "Verification failed. Please try again.");
        setCode("");
        return;
      }

      // The server set the login cookie, so load the user and continue
      await refreshUser();
      navigate("/closet", { replace: true });
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !email.trim()) {
      if (!email.trim()) setError("Enter your email address.");
      return;
    }

    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message ?? "Unable to send a new code.");
        return;
      }

      setInfo(data?.message ?? "A new code is on its way.");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Can't reach the server. Please try again.");
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError("");

    if (digits.length === CODE_LENGTH) {
      verify(digits);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === CODE_LENGTH) verify(code);
      }}
      className="auth-form items-center"
    >
      <EnvelopeSimpleIcon
        className="text-lilac"
        size={110}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-1 text-center">
        <h2 className="auth-heading">Check your email</h2>
        <p className="text-sm text-plum/70">
          {knownEmail
            ? `We sent a 6-digit code to ${knownEmail}.`
            : "Enter your email and the 6-digit code we sent you."}
        </p>
      </div>

      {!knownEmail && (
        <div className="field w-full">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
      )}

      <div className="field w-full">
        <label htmlFor="code" className="field-label">
          Verification code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="------"
          maxLength={CODE_LENGTH}
          autoFocus
          value={code}
          onChange={handleCodeChange}
          aria-invalid={error !== ""}
          disabled={submitting}
          className="input text-center text-2xl font-semibold tracking-[0.5em]"
        />
      </div>

      {error && (
        <p role="alert" className="error-box w-full text-center">
          {error}
        </p>
      )}

      {info && !error && (
        <p role="status" className="footer-text w-full">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || code.length !== CODE_LENGTH}
        className="btn-primary mt-1"
      >
        {submitting ? "Verifying..." : "Verify email"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0}
        className="link cursor-pointer text-sm disabled:cursor-not-allowed disabled:text-plum/40 disabled:no-underline"
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
      </button>

      <p className="footer-text">
        Check your spam folder.{" "}
        <Link to="/login" className="link">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
