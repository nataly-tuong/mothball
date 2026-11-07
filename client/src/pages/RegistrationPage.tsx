import type { SubmitEvent, JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

const NAME_MIN = 2;
const NAME_MAX = 20;

function getNameError(name: string): string {
  if (name.length < NAME_MIN) {
    return `Name must be at least ${NAME_MIN} characters`;
  }
  if (name.length > NAME_MAX) {
    return `Name can't be longer than ${NAME_MAX} characters`;
  }
  if (/\s/.test(name)) {
    return "Name can't contain spaces";
  }
  if (!/^[\p{L}\p{N}]+$/u.test(name)) {
    return "Name can only contain letters and numbers";
  }
  return "";
}

export default function RegistrationPage(): JSX.Element {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  const nameError = getNameError(name);
  const showNameError = nameTouched && nameError !== "";
  const visibleError = showNameError ? nameError : error;

  const passwordChecks = [
    {
      label: "At least 12 characters",
      valid: password.length >= 12,
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(password),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9\s]/.test(password),
    },
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
    const email = form.get("email");
    const confirmPassword = form.get("confirmPassword");

    if (nameError) {
      setNameTouched(true);
      return;
    }

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
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
    <form onSubmit={handleSubmit} className="auth-form">
      <h2 className="auth-heading">Sign Up</h2>

      <div className="field">
        <label htmlFor="name" className="field-label">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="jane"
          autoComplete="off"
          required
          value={name}
          maxLength={NAME_MAX}
          onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
          onBlur={() => setNameTouched(true)}
          aria-invalid={showNameError}
          className="input"
        />
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
          className="input"
        />
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

      {visibleError && (
        <p role="alert" className="error-box">
          {visibleError}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-1">
        {loading ? "Creating account..." : "Register"}
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
        Have an account?{" "}
        <Link to="/login" className="link">
          Log in
        </Link>
      </p>
    </form>
  );
}
