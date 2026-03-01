import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AdminPage from "./pages/AdminPage";
import LandingPage from "./pages/LandingPage";
import LivePage from "./pages/LivePage";
import SettingsPage from "./pages/SettingsPage";

// Root route with Toaster
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.11 0.03 265)",
            border: "1px solid oklch(0.78 0.165 85 / 0.3)",
            color: "oklch(0.96 0.015 90)",
          },
        }}
      />
      <Outlet />
    </>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
      <div
        className="font-broadcast text-4xl"
        style={{ color: "oklch(0.78 0.165 85)" }}
      >
        404
      </div>
      <p style={{ color: "oklch(0.55 0.02 90)" }}>Page not found</p>
      <Link
        to="/"
        className="text-sm underline"
        style={{ color: "oklch(0.78 0.165 85)" }}
      >
        Go Home
      </Link>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: LivePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminRoute,
  liveRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
