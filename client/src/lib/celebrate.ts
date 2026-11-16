import type { ItemStatus } from "./closets";

type Fire = (options: Record<string, unknown>) => Promise<unknown> | null;

let fire: Fire | null = null;

async function getConfetti(): Promise<Fire> {
  if (fire) return fire;

  const { default: confetti } = await import("canvas-confetti");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200;";
  document.body.appendChild(canvas);

  fire = confetti.create(canvas, {
    resize: true,
    useWorker: false,
    disableForReducedMotion: true,
  }) as unknown as Fire;
  return fire;
}

const LISTED_COLORS = ["#a984e8", "#d9c9f7", "#39245f", "#f0e9fa", "#ffffff"];
const SOLD_COLORS = ["#34d399", "#a7f3d0", "#fbbf24", "#fde68a", "#39245f"];

export function shouldCelebrate(from: ItemStatus, to: ItemStatus) {
  return (
    (from === "TO_UPLOAD" && to === "LISTED") ||
    (to === "SOLD" && from !== "SOLD")
  );
}

export async function celebrate(to: ItemStatus) {
  try {
    const shoot = await getConfetti();
    const colors = to === "SOLD" ? SOLD_COLORS : LISTED_COLORS;
    const burst = {
      particleCount: to === "SOLD" ? 90 : 60,
      spread: 75,
      startVelocity: 42,
      ticks: 220,
      colors,
      scalar: 0.95,
    };

    void shoot({ ...burst, origin: { x: 0.2, y: 0.75 }, angle: 60 });
    void shoot({ ...burst, origin: { x: 0.8, y: 0.75 }, angle: 120 });

    if (to === "SOLD") {
      setTimeout(() => {
        void shoot({
          particleCount: 60,
          spread: 120,
          startVelocity: 30,
          ticks: 260,
          colors,
          shapes: ["star"],
          origin: { x: 0.5, y: 0.45 },
        });
      }, 250);
    }
  } catch {
    return;
  }
}
