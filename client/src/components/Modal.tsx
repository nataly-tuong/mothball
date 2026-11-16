import { useEffect, useRef, type JSX, type ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
  headerActions?: ReactNode;
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  size = "md",
  headerActions,
}: ModalProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="modal-title"
      tabIndex={-1}
      className={`m-auto max-h-[92dvh] w-[calc(100%-1rem)] overflow-y-auto overscroll-contain ${size === "lg" ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-plum/15 bg-white p-0 text-plum shadow-xl shadow-plum/25 backdrop:bg-plum/40 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-lavender-gray/70 bg-white/95 px-5 py-3 backdrop-blur sm:px-8 sm:py-4">
            <h2
              id="modal-title"
              className="min-w-0 truncate font-fredoka text-xl font-medium leading-tight sm:text-2xl"
            >
              {title}
            </h2>
            <div className="flex shrink-0 items-center gap-1.5">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-plum/60 transition cursor-pointer hover:bg-lavender hover:text-plum focus-visible:outline-2 focus-visible:outline-lilac"
              >
                <XIcon size={20} weight="bold" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-5 p-5 sm:p-8">{children}</div>
        </>
      )}
    </dialog>
  );
}
