import { useEffect, useState, type JSX, type SubmitEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";

type TokenStatus = "checking" | "valid" | "invalid";

export default function ResetPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(
    token ? "checking" : "invalid",
  );
  const [tokenMessage, setTokenMessage] = useState(
    token ? "" : "This password reset link is invalid or has expired.",
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  // Check the reset link as soon as the page loads
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function validateToken() {
      try {
        const res = await fetch("/api/auth/validate-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (res.ok && data?.valid) {
          setTokenStatus("valid");
        } else {
          setTokenMessage(
            data?.message ??
              "This password reset link is invalid or has expired.",
          );
          setTokenStatus("invalid");
        }
      } catch {
        if (cancelled) return;
        setTokenMessage("Can't reach the server. Please try again.");
        setTokenStatus("invalid");
      }
    }

    validateToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const passwordChecks = [
    { label: "At least 12 characters", valid: password.length >= 12 },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[^A-Za-z0-9\s]/.test(password) },
  ];

  const strength = passwordChecks.filter((check) => check.valid).length;

  const strengthLabel =
    strength <= 2
      ? "Weak"
      : strength <= 3
        ? "Fair"
        : strength === 4
          ? "Good"
          : "Strong";

  const strengthBar =
    strength <= 2
      ? "bg-red-500"
      : strength === 3
        ? "bg-amber-500"
        : strength === 4
          ? "bg-lime-500"
          : "bg-green-600";

  const strengthText =
    strength <= 2
      ? "text-red-600"
      : strength === 3
        ? "text-amber-600"
        : strength === 4
          ? "text-lime-700"
          : "text-green-700";

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const confirmPassword = form.get("confirmPassword");

    if (strength < passwordChecks.length) {
      setError("Please meet all the password requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.message ?? "Unable to reset your password. Please try again.",
        );
        return;
      }

      navigate("/login", {
        state: {
          message: "Your password has been successfully reset. Please log in.",
        },
      });
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (tokenStatus === "checking") {
    return (
      <div className="auth-form">
        <h2 className="auth-heading">Checking your link...</h2>
        <p className="text-sm text-plum/70">
          Just a moment while we verify your reset link.
        </p>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="auth-form">
        <h2 className="auth-heading">Invalid reset link</h2>
        <p className="text-sm text-plum/70">{tokenMessage}</p>

        <Link
          to="/forgot-password"
          className="btn-primary mt-1 block text-center"
        >
          Request a new link
        </Link>

        <p className="footer-text">
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
        <h2 className="auth-heading">Set a new password</h2>
        <p className="text-sm text-plum/70">
          Choose a new password for your Mothball account.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="field">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="your password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {password.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-plum/10 bg-plum/3 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-plum/70">Password strength</span>

              <span
                className={`text-xs font-semibold ${strengthText}`}
                aria-live="polite"
              >
                {strengthLabel}
              </span>
            </div>

            <div className="flex gap-1">
              {passwordChecks.map((check, index) => (
                <div
                  key={check.label}
                  className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                    index < strength ? strengthBar : "bg-plum/10"
                  }`}
                />
              ))}
            </div>

            <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
              {passwordChecks.map((check) => (
                <li
                  key={check.label}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <span
                    aria-hidden="true"
                    className={`w-3.5 shrink-0 text-center ${
                      check.valid ? "text-green-600" : "text-plum/40"
                    }`}
                  >
                    {check.valid ? "✓" : "○"}
                  </span>

                  <span className={check.valid ? "text-plum" : "text-plum/50"}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="confirmPassword" className="field-label">
          Confirm Password
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="your password"
          autoComplete="new-password"
          required
        />
      </div>

      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading ? "Resetting password..." : "Reset password"}
      </button>

      <p className="footer-text">
        <Link to="/login" className="link">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
