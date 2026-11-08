import { useState } from "react";
import type { ComponentProps, JSX } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export default function PasswordInput({
  className = "",
  ...props
}: PasswordInputProps): JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className="input pr-11 [&::-ms-reveal]:hidden"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-plum/60 transition hover:text-plum"
      >
        {visible ? (
          <EyeSlashIcon size={20} aria-hidden="true" />
        ) : (
          <EyeIcon size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
