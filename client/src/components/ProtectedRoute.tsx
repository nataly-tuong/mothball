import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import MothballSVG from "../assets/favicon.svg";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        role="status"
        className="grid h-dvh place-items-center bg-lavender/40"
      >
        <div className="flex flex-col items-center gap-3 text-plum">
          <img src={MothballSVG} alt="" className="w-14 animate-pulse" />
          <p className="font-gaegu text-2xl font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
