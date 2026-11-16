import { useSyncExternalStore, type JSX } from "react";
import { isWaking, subscribeWaking } from "../lib/api";
import MothballSVG from "../assets/favicon.svg";

export default function WakeNotice(): JSX.Element | null {
  const waking = useSyncExternalStore(subscribeWaking, isWaking, () => false);

  if (!waking) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-plum/10 bg-white px-4 py-3 shadow-xl shadow-plum/20"
    >
      <img src={MothballSVG} alt="" className="w-7 shrink-0 animate-bounce" />
      <div className="text-sm leading-snug text-plum">
        <p className="font-semibold">Waking up Mothball...</p>
        <p className="text-plum/70">
          The server naps when nobody's around. This can take up to a minute.
        </p>
      </div>
    </div>
  );
}
