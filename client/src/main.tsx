import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import AuthLayout from "./pages/AuthLayout";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegistrationPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
