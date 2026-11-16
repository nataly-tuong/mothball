import { useState, useSyncExternalStore, type JSX } from "react";
import { WifiSlashIcon } from "@phosphor-icons/react";
import MothballSVG from "../assets/favicon.svg";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function OfflineScreen(): JSX.Element | null {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const [checking, setChecking] = useState(false);

  if (online) return null;

  async function retry() {
    setChecking(true);
    try {
      await fetch("/api/health", { cache: "no-store" });
      window.location.reload();
    } catch {
      setChecking(false);
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-plum/70 px-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-white px-6 py-8 text-center shadow-2xl shadow-plum/40">
        <div className="relative">
          <img
            src={MothballSVG}
            alt=""
            className="w-20 opacity-80 grayscale-[40%]"
          />
          <span className="absolute -bottom-1 -right-2 grid h-8 w-8 place-items-center rounded-full bg-coral text-white shadow">
            <WifiSlashIcon size={18} weight="bold" aria-hidden="true" />
          </span>
        </div>
        <h2
          id="offline-title"
          className="font-fredoka text-2xl font-medium text-plum"
        >
          You're offline
        </h2>
        <p className="text-sm leading-relaxed text-plum/70">
          Mothball needs a connection to keep everyone's closet in sync. This
          will go away as soon as you're back online.
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={checking}
          className="btn-small-primary mt-2"
        >
          {checking ? "Checking..." : "Try again"}
        </button>
      </div>
    </div>
  );
}
