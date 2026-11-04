import type { JSX } from "react";
import { CheckCircleIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage(): JSX.Element {
  return (
    <>
      <form className="flex flex-col w-full max-w-md p-8 border border-lavender-gray rounded-2xl">
        <h2 className="text-3xl font-fredoka w-full font-medium text-plum mb-2">
          Forgot password
        </h2>
        <p className="text-plum/70 mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        <label htmlFor="email" className="text-plum font-bold mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="jane.doe@example.com"
          className="py-2.5 px-4 border border-lavender-gray rounded-lg mb-6"
        />

        <button
          type="submit"
          className="bg-plum hover:bg-plum/80 cursor-pointer text-white py-2.5 rounded-lg text-sm font-medium"
        >
          Send reset link
        </button>

        <Link to="/login" className="text-center text-lilac font-medium mt-6">
          Back to log in
        </Link>
      </form>

      <div className="flex flex-col items-center text-center w-full max-w-md p-8 border border-lavender-gray rounded-2xl">
        <div className="relative mb-4 text-lilac">
          <EnvelopeSimpleIcon size={64} aria-hidden="true" />
          <CheckCircleIcon
            size={28}
            weight="fill"
            className="absolute -bottom-1 -right-2 bg-white rounded-full"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-3xl font-fredoka font-medium text-plum mb-2">
          Check your email
        </h2>
        <p className="text-plum/70 mb-4">
          We sent a reset link to jane.doe@example.com.
        </p>
        <button
          type="button"
          className="text-lilac font-medium cursor-pointer hover:text-lilac/80"
        >
          Resend
        </button>
      </div>
    </>
  );
}
