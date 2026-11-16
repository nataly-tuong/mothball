import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  CaretDownIcon,
  CoatHangerIcon,
  DeviceMobileIcon,
  GearSixIcon,
  ShieldCheckIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import MothballSVG from "../assets/favicon.svg";
import { openInstallGuide } from "../lib/pwa";

const pill =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition duration-200 cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const ghostPill = `${pill} bg-white/15 text-white ring-1 ring-inset ring-white/35 backdrop-blur-sm hover:bg-white/25`;

const solidPill = `${pill} bg-white text-plum shadow-md shadow-plum/20 hover:bg-lavender`;

const menuItem =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-plum transition cursor-pointer hover:bg-lavender focus-visible:bg-lavender focus-visible:outline-none";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointer(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      await refreshUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <Link
        to={user ? "/closet" : "/"}
        className="flex items-center gap-1 rounded-lg focus-visible:outline-2 focus-visible:outline-white"
      >
        <img src={MothballSVG} className="w-5" alt="" />
        <span className="text-3xl text-white font-gaegu font-bold">
          Mothball
        </span>
      </Link>

      {user ? (
        <nav aria-label="Account" className="flex items-center gap-2">
          <NavLink
            to="/closet"
            className={({ isActive }) => (isActive ? solidPill : ghostPill)}
          >
            <CoatHangerIcon size={16} weight="fill" aria-hidden="true" />
            Closet
          </NavLink>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`${ghostPill} gap-2 pl-1 pr-3`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-lilac text-xs font-bold uppercase text-white">
                {user.name.slice(0, 1)}
              </span>
              <span className="max-w-28 truncate">{user.name}</span>
              <CaretDownIcon
                size={14}
                weight="bold"
                aria-hidden="true"
                className={`transition ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-plum/10 bg-white p-1.5 shadow-xl shadow-plum/20"
              >
                <div className="px-3 pb-2 pt-1.5">
                  <p className="truncate text-sm font-semibold text-plum">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-plum/60">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-lavender-gray" />
                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className={menuItem}
                >
                  <GearSixIcon size={18} aria-hidden="true" />
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openInstallGuide();
                  }}
                  className={menuItem}
                >
                  <DeviceMobileIcon size={18} aria-hidden="true" />
                  Get the app
                </button>
                <Link
                  to="/privacy"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className={menuItem}
                >
                  <ShieldCheckIcon size={18} aria-hidden="true" />
                  Privacy policy
                </Link>
                <div className="my-1 h-px bg-lavender-gray" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className={`${menuItem} text-coral hover:bg-coral/10 focus-visible:bg-coral/10`}
                >
                  <SignOutIcon size={18} aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </nav>
      ) : (
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link to="/login" className={ghostPill}>
            Log in
          </Link>
          <Link to="/register" className={solidPill}>
            Register
          </Link>
        </nav>
      )}
    </header>
  );
}
