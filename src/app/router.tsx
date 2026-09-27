import { createBrowserRouter } from "react-router";
import { AppShell } from "./AppShell";
import { ProtectedLayout } from "./ProtectedLayout";
import { PagePlaceholder } from "./PagePlaceholder";
import { LoginPage } from "./routes/LoginPage";
import { AuthCallbackPage } from "./routes/AuthCallbackPage";
import { SubscriptionBlockedPage } from "./routes/SubscriptionBlockedPage";
import { WorkspaceClosedPage } from "./routes/WorkspaceClosedPage";
import { NAV_ITEMS } from "./navConfig";

// One route per nav entry (frontend spec §4) -- a real screen replaces each placeholder as
// its feature module lands; the table itself never needs to be duplicated to add the route.
const shellRoutes = NAV_ITEMS.map((item) =>
  item.path === "/"
    ? { index: true as const, element: <PagePlaceholder title={item.label} /> }
    : { path: item.path.slice(1), element: <PagePlaceholder title={item.label} /> },
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: "assinatura", element: <SubscriptionBlockedPage /> },
      { path: "encerrado", element: <WorkspaceClosedPage /> },
      { element: <AppShell />, children: shellRoutes },
    ],
  },
]);
