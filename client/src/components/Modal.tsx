import { useEffect, useRef, type JSX, type ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  size = "md",
}: ModalProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
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
      className={`m-auto max-h-[92dvh] w-[calc(100%-1rem)] overflow-y-auto overscroll-contain ${size === "lg" ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-plum/15 bg-white p-0 text-plum shadow-xl shadow-plum/25 backdrop:bg-plum/40 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="flex flex-col gap-5 p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="modal-title"
              className="font-fredoka text-2xl font-medium leading-tight"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 text-plum/60 transition cursor-pointer hover:bg-lavender hover:text-plum focus-visible:outline-2 focus-visible:outline-lilac"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
