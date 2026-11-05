import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MothballSVG from "../assets/favicon.svg";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  async function handleLogout() {
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
    <header className="flex items-center justify-between gap-2 pt-1 px-4">
      <div className="flex">
        <img src={MothballSVG} className="w-5" alt="Mothball icon" />
        <h1 className="text-3xl text-white font-gaegu font-bold">Mothball</h1>
      </div>

      <div className="flex gap-5">
        {user ? (
          <>
            <button
              type="button"
              className="text-white hover:opacity-80 cursor-pointer"
            >
              {user.name}
            </button>

            <p className="text-white">|</p>

            <button
              type="button"
              onClick={handleLogout}
              className="text-white hover:opacity-80 cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-white hover:opacity-80 cursor-pointer"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-white hover:opacity-80 cursor-pointer"
            >
              Register
            </button>
          </>
        )}
      </div>
    </header>
  );
}
