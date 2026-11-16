import {
  useEffect,
  useState,
  useSyncExternalStore,
  type JSX,
  type ReactNode,
} from "react";
import {
  CheckCircleIcon,
  DeviceMobileIcon,
  DotsThreeVerticalIcon,
  ExportIcon,
  PlusSquareIcon,
} from "@phosphor-icons/react";
import Modal from "./Modal";
import {
  getInstallPrompt,
  getPlatform,
  hasSeenGuide,
  isIosNonSafari,
  isStandalone,
  markGuideSeen,
  onOpenInstallGuide,
  promptInstall,
  subscribeInstallPrompt,
} from "../lib/pwa";

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum text-sm font-bold text-white">
        {n}
      </span>
      <span className="pt-0.5 text-sm leading-relaxed text-plum">
        {children}
      </span>
    </li>
  );
}

function InlineIcon({ children }: { children: ReactNode }) {
  return (
    <span className="mx-0.5 inline-grid h-6 w-6 translate-y-1 place-items-center rounded-md bg-lavender align-baseline text-plum">
      {children}
    </span>
  );
}

function QrCode({ url }: { url: string }): JSX.Element {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;

    import("qrcode")
      .then((qr) =>
        qr.toDataURL(url, {
          margin: 1,
          width: 440,
          color: { dark: "#39245f", light: "#ffffff" },
        }),
      )
      .then((dataUrl) => {
        if (active) setSrc(dataUrl);
      })
      .catch(() => {
        if (active) setSrc("");
      });

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div className="grid aspect-square w-52 shrink-0 place-items-center rounded-2xl border border-lavender-gray bg-white p-2">
      {src ? (
        <img
          src={src}
          alt={`QR code to open ${url}`}
          width={192}
          height={192}
          className="aspect-square h-full w-full object-contain"
        />
      ) : (
        <span className="text-xs text-plum/50">Making QR code...</span>
      )}
    </div>
  );
}

export default function InstallGuide(): JSX.Element {
  const [open, setOpen] = useState(() => !isStandalone() && !hasSeenGuide());

  useEffect(() => onOpenInstallGuide(() => setOpen(true)), []);

  function close() {
    markGuideSeen();
    setOpen(false);
  }

  return (
    <Modal open={open} title="Get the Mothball app" onClose={close}>
      <InstallSteps onDone={close} />
    </Modal>
  );
}

function InstallSteps({ onDone }: { onDone: () => void }): JSX.Element {
  const installPrompt = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPrompt,
    () => null,
  );
  const [platform] = useState(getPlatform);
  const [standalone] = useState(isStandalone);
  const [installing, setInstalling] = useState(false);

  const appUrl = `${window.location.origin}/closet`;
  const isLocalhost = /^(localhost|127\.0\.0\.1)$/.test(
    window.location.hostname,
  );

  async function install() {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) onDone();
  }

  if (standalone) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircleIcon size={56} weight="fill" className="text-lilac" />
        <p className="text-plum">
          You're already using the Mothball app. Nice.
        </p>
        <button type="button" onClick={onDone} className="btn-small-primary">
          Done
        </button>
      </div>
    );
  }

  const installButton = installPrompt && (
    <button
      type="button"
      onClick={install}
      disabled={installing}
      className="btn-primary"
    >
      {installing ? "Installing..." : "Install Mothball"}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-plum/80">
        Add Mothball to your home screen.
      </p>

      {platform === "ios" && (
        <>
          {isIosNonSafari() && (
            <p className="rounded-lg bg-lavender px-3 py-2 text-sm text-plum">
              For the best result, open this page in <strong>Safari</strong>{" "}
              first.
            </p>
          )}
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Tap the Share button
              <InlineIcon>
                <ExportIcon size={16} weight="bold" />
              </InlineIcon>
              . In newer iOS it's under the
              <InlineIcon>
                <span className="text-base leading-none">⋯</span>
              </InlineIcon>
              menu.
            </Step>
            <Step n={2}>
              Scroll down and tap <strong>Add to Home Screen</strong>
              <InlineIcon>
                <PlusSquareIcon size={16} weight="bold" />
              </InlineIcon>
              .
            </Step>
            <Step n={3}>
              Make sure <strong>Open as Web App</strong> is on, then tap{" "}
              <strong>Add</strong>.
            </Step>
          </ol>
        </>
      )}

      {platform === "android" &&
        (installButton ?? (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Tap the menu button
              <InlineIcon>
                <DotsThreeVerticalIcon size={16} weight="bold" />
              </InlineIcon>
              in Chrome.
            </Step>
            <Step n={2}>
              Tap <strong>Add to Home screen</strong>, then{" "}
              <strong>Install</strong>.
            </Step>
          </ol>
        ))}

      {platform === "desktop" && (
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <QrCode url={appUrl} />
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-medium text-plum">
              <DeviceMobileIcon size={20} aria-hidden="true" />
              Scan with your phone's camera
            </p>
            <p className="text-sm leading-relaxed text-plum/70">
              It opens Mothball on your phone. Log in, then open this guide from
              your name menu to add it to your home screen.
            </p>
            {isLocalhost && (
              <p className="rounded-lg bg-lavender px-3 py-2 text-xs text-plum">
                You're on localhost, which your phone can't open. The QR code
                works once Mothball is deployed.
              </p>
            )}
          </div>
        </div>
      )}

      {platform === "desktop" && installButton && (
        <div className="flex flex-col gap-2 border-t border-lavender-gray pt-4">
          <p className="text-sm text-plum/70">
            Or install it on this computer:
          </p>
          {installButton}
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="self-center text-sm font-medium text-plum/60 cursor-pointer hover:text-plum"
      >
        Maybe later
      </button>
    </div>
  );
}
