type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const GUIDE_SEEN_KEY = "mothball:installGuideSeen";
const OPEN_EVENT = "mothball:open-install-guide";

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function setupPwa() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    markGuideSeen();
    notify();
  });

  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    });
  }
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallPrompt() {
  return deferredPrompt;
}

export async function promptInstall() {
  const prompt = deferredPrompt;
  if (!prompt) return false;

  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === "accepted";
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type Platform = "ios" | "android" | "desktop";

export function getPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || iPadOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isIosNonSafari() {
  return /CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);
}

export function hasSeenGuide() {
  try {
    return localStorage.getItem(GUIDE_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markGuideSeen() {
  try {
    localStorage.setItem(GUIDE_SEEN_KEY, "1");
  } catch {
    return;
  }
}

export function openInstallGuide() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenInstallGuide(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

export function googleSignInUrl() {
  return isStandalone() ? "/api/auth/google?app=1" : "/api/auth/google";
}
