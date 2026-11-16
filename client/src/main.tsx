import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { setupPwa } from "./lib/pwa";
import WakeNotice from "./components/WakeNotice";

import "./index.css";
import App from "./App";

import AuthLayout from "./pages/AuthLayout";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

import ClosetPage from "./pages/ClosetPage";
import ClosetHomePage from "./pages/ClosetHomePage";
import SettingsPage from "./pages/SettingsPage";
import JoinPage from "./pages/JoinPage";

import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/privacy", element: <PrivacyPolicyPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/closet", element: <ClosetHomePage /> },
      { path: "/closet/new", element: <ClosetHomePage onboarding /> },
      { path: "/closet/:closetId", element: <ClosetPage view="items" /> },
      {
        path: "/closet/:closetId/relist",
        element: <ClosetPage view="relist" />,
      },
      {
        path: "/closet/:closetId/activity",
        element: <ClosetPage view="activity" />,
      },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegistrationPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/join/:code", element: <JoinPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

setupPwa();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <WakeNotice />
    </AuthProvider>
  </StrictMode>,
);
