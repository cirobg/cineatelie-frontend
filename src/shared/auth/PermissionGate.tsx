import type { ReactNode } from "react";
import { useSessionStore } from "./session";
import { hasPermission } from "./permissions";

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Hides `children` when the active tenant's role lacks `permission`. A convenience only
 * (frontend spec §8) — the corresponding action is independently refused server-side either
 * way, so this is UI polish, not a security boundary. */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const permissions = useSessionStore((state) => state.permissions);
  return hasPermission(permissions, permission) ? children : fallback;
}
