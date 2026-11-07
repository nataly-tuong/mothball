import { useEffect, useState, type JSX, type SubmitEvent } from "react";
import { CheckCircleIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const RESEND_COOLDOWN = 30;

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestReset(address: string): Promise<boolean> {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message ?? "Something went wrong. Please try again.");
        return false;
      }

      setCooldown(RESEND_COOLDOWN);
      return true;
    } catch {
      setError("Can't reach the server. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;

    if (await requestReset(address)) {
      setSentTo(address);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return;

    if (await requestReset(sentTo)) {
      setInfo("Sent again. Check your inbox.");
    }
  }

  if (sentTo) {
    return (
      <div className="auth-form items-center text-center">
        <div className="relative mb-2 text-lilac">
          <EnvelopeSimpleIcon size={64} aria-hidden="true" />
          <CheckCircleIcon
            size={28}
            weight="fill"
            className="absolute -bottom-1 -right-2 rounded-full bg-white"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="auth-heading">Check your email</h2>
          <p className="text-sm text-plum/70">
            If an account exists for{" "}
            <span className="font-semibold text-plum">{sentTo}</span>, we sent a
            reset link. It expires in 1 hour.
          </p>
        </div>

        {error && (
          <p role="alert" className="error-box">
            {error}
          </p>
        )}

        {info && !error && (
          <p role="status" className="footer-text">
            {info}
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || loading}
          className="link cursor-pointer text-sm disabled:cursor-not-allowed disabled:text-plum/40 disabled:no-underline"
        >
          {loading
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend"}
        </button>

        <p className="footer-text">
          Check your spam folder.{" "}
          <Link to="/login" className="link">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="flex flex-col gap-1">
        <h2 className="auth-heading">Forgot password</h2>
        <p className="text-sm text-plum/70">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

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
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          aria-invalid={error !== ""}
          className="input"
        />
      </div>

      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading ? "Sending..." : "Send reset link"}
      </button>

      <p className="footer-text">
        <Link to="/login" className="link">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
