import type { JSX } from "react";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function VerifyEmail(): JSX.Element {
  return (
    <div className="flex items-center flex-col w-full max-w-md p-8 rounded-2xl">
      <EnvelopeSimpleIcon
        className="text-lilac"
        size={150}
        aria-hidden="true"
      />
      <h2 className="text-3xl font-fredoka w-full font-medium text-center text-plum mb-2">
        Check your email
      </h2>
      <p className="text-plum/70 mb-6 text-center">
        We've sent you a verification link to your email address.
      </p>

      <button
        type="submit"
        className="w-full rounded-full border border-plum bg-gradient-to-b from-plum/80 to-plum py-2.5 text-sm font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-plum/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
      >
        Resend verification mail
      </button>
      <p className="mt-8 text-center text-sm text-plum/70">
        Check your spam folder.{" "}
        <Link to="/login" className="font-medium text-lilac">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
