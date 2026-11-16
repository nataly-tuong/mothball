import type { JSX } from "react";
import { NavLink } from "react-router-dom";
import {
  BellIcon,
  CoatHangerIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export type MobileNavProps = {
  closetId: number | null;
  unread?: number;
};

function Tab({
  to,
  end,
  label,
  Icon,
  badge,
}: {
  to: string;
  end?: boolean;
  label: string;
  Icon: Icon;
  badge?: number;
}): JSX.Element {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition active:scale-95 ${
          isActive ? "bg-lavender text-plum" : "text-plum/55"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={24}
            weight={isActive ? "fill" : "regular"}
            aria-hidden="true"
          />
          {label}
          {badge ? (
            <span className="absolute right-[calc(50%-1.4rem)] top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export default function MobileNav({
  closetId,
  unread = 0,
}: MobileNavProps): JSX.Element {
  const base = closetId ? `/closet/${closetId}` : "/closet";

  return (
    <nav
      aria-label="App"
      className="mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] mt-2 grid grid-cols-3 gap-1 rounded-2xl border border-plum/10 bg-white/95 p-1.5 shadow-xl shadow-plum/25 backdrop-blur sm:hidden"
    >
      <Tab to={base} end label="Closet" Icon={CoatHangerIcon} />
      <Tab
        to={closetId ? `${base}/activity` : "/closet"}
        label="Activity"
        Icon={BellIcon}
        badge={unread}
      />
      <Tab to="/settings" label="Account" Icon={UserCircleIcon} />
    </nav>
  );
}
