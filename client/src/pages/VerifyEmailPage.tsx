import { useEffect, useRef, useState, type JSX } from "react";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

type VerificationStatus = "verifying" | "success" | "error" | "pending";

export default function VerifyEmail(): JSX.Element {
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>(
    token ? "verifying" : "pending",
  );

  const [errorMessage, setErrorMessage] = useState("");

  const [email, setEmail] = useState(() =>
    typeof location.state?.email === "string" ? location.state.email : "",
  );
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const requestStartedForToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("pending");
      return;
    }

    if (requestStartedForToken.current === token) return;

    requestStartedForToken.current = token;

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data: { message?: string } = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Verification failed. Please try again.",
          );
        }

        setStatus("success");
      } catch (error) {
        setStatus("error");

        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      }
    };

    verifyEmail();
  }, [token]);

  // Request another verification email
  const handleResend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setResending(true);
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data: { message?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to send verification email.");
      }

      setResendMessage(
        data.message ||
          "If your account needs verification, an email will be sent.",
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center flex-col w-full max-w-md p-8 rounded-2xl">
      <EnvelopeSimpleIcon
        className="text-lilac"
        size={150}
        aria-hidden="true"
      />

      {status === "verifying" && (
        <>
          <h2 className="text-3xl font-fredoka w-full font-medium text-center text-plum mb-2">
            Verifying your email...
          </h2>

          <p className="text-plum/70 mb-6 text-center">
            Just a moment while we make sure everything is in order.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <h2 className="text-3xl font-fredoka w-full font-medium text-center text-plum mb-2">
            You're verified!
          </h2>

          <p className="text-plum/70 mb-6 text-center">
            Your email is confirmed. Welcome to Mothball!
          </p>

          <Link
            to="/login"
            className="w-full text-center rounded-full border border-plum bg-linear-to-b from-plum/80 to-plum py-2.5 text-sm font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-plum/25"
          >
            Back to log in
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h2 className="text-3xl font-fredoka w-full font-medium text-center text-plum mb-2">
            Verification unsuccessful
          </h2>

          <p className="text-plum/70 mb-6 text-center">{errorMessage}</p>

          <p className="text-plum/70 text-sm text-center mb-4">
            You can request a new verification email below.
          </p>
        </>
      )}

      {status === "pending" && (
        <>
          <h2 className="text-3xl font-fredoka w-full font-medium text-center text-plum mb-2">
            Check your email
          </h2>

          <p className="text-plum/70 mb-6 text-center">
            We've sent you a verification link to your email address. Verify
            your email before accessing your closet!
          </p>
        </>
      )}

      {(status === "pending" || status === "error") && (
        <form onSubmit={handleResend} className="w-full flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setResendMessage("");
            }}
            placeholder="Your email address"
            aria-label="Your email address"
            className="w-full rounded-full border border-plum/20 bg-white px-4 py-3 text-sm text-plum outline-none placeholder:text-plum/40 focus:border-lilac"
          />

          <button
            type="submit"
            disabled={resending}
            className="w-full rounded-full border border-plum bg-linear-to-b from-plum/80 to-plum py-2.5 text-sm font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-plum/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>

          {resendMessage && (
            <p role="status" className="text-center text-sm text-plum/70">
              {resendMessage}
            </p>
          )}
        </form>
      )}

      <p className="mt-8 text-center text-sm text-plum/70">
        Check your spam folder.{" "}
        <Link to="/login" className="font-medium text-lilac hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
