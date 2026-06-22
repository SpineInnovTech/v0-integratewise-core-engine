import { createBrowserRouter } from "react-router";
import { AuthPage } from "./pages/auth-page";
import { OnboardingPage } from "./pages/onboarding-page";
import { WorkspacePage } from "./pages/workspace-page";
import { NotFoundPage } from "./pages/not-found-page";

/**
 * IntegrateWise Router Configuration
 * App starts directly at login - no public landing pages
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/signup",
    element: <AuthPage />,
  },
  {
    path: "/forgot-password",
    element: <AuthPage />,
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/workspace/*",
    element: <WorkspacePage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
