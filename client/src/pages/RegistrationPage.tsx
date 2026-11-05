import type { SubmitEvent, JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function RegistrationPage(): JSX.Element {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-md px-5"
    >
      <h2 className="text-3xl font-fredoka w-full font-medium text-plum mb-6">
        Sign Up
      </h2>

      <label htmlFor="name" className="text-plum font-bold mb-1">
        Name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="jane"
        className="py-2.5 px-4 border border-lavender-gray rounded-lg mb-4"
      />

      <label htmlFor="email" className="text-plum font-bold mb-1">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="jane.doe@example.com"
        className="py-2.5 px-4 border border-lavender-gray rounded-lg mb-4"
      />

      <label htmlFor="password" className="text-plum font-bold mb-1">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        placeholder="your password"
        className="py-2.5 px-4 border border-lavender-gray rounded-lg mb-3"
      />

      <label htmlFor="confirmPassword" className="text-plum font-bold mb-1">
        Confirm Password
      </label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        placeholder="your password"
        className="py-2.5 px-4 border border-lavender-gray rounded-lg mb-5"
      />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-plum text-white py-2.5 rounded-lg text-sm font-medium hover:bg-plum/80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Creating account..." : "Register"}
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-lavender-gray" />
        <span className="text-sm text-plum/60">or</span>
        <div className="flex-1 h-px bg-lavender-gray" />
      </div>

      <button
        type="button"
        className="flex cursor-pointer items-center justify-center gap-2 border border-lavender-gray bg-white text-plum py-2.5 rounded-lg text-sm font-medium hover:bg-lavender/40"
      >
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </button>

      <p className="text-center text-plum/50 mt-6">
        Have an account?{" "}
        <Link to="/login" className="text-lilac">
          Log in
        </Link>
      </p>
    </form>
  );
}
