import type { SubmitEvent, JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          remember: form.get("remember") === "on",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.code === "EMAIL_NOT_VERIFIED") {
          void fetch("/api/auth/resend-verification", {
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
      navigate("/closet");
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

      <button type="button" className="btn-secondary">
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
