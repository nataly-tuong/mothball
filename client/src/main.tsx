import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";
import App from "./App";

import AuthLayout from "./pages/AuthLayout";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import ClosetPage from "./pages/ClosetPage";

import ProtectedRoute from "./components/ProtectedRoute";

import { SampleListings } from "./components/SampleListings";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/closet",
        element: <ClosetPage sampleListing={SampleListings} />,
      },
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
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
