import { Navigate, Outlet } from "react-router";
import { useSessionStore } from "../shared/auth/session";

/** Guards everything behind login. A convenience redirect only — every route it protects is
 * independently authorised server-side (frontend spec §8); this just avoids flashing
 * protected UI before that 401 comes back. */
export function ProtectedLayout() {
  const accessToken = useSessionStore((state) => state.accessToken);
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
