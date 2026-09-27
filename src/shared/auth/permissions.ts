/**
 * Pure logic behind `PermissionGate` and the sidebar's menu filtering — separated from the
 * JSX so it's testable without a DOM. This is a convenience only, never the control (frontend
 * spec §8): every action is independently authorised server-side regardless of what this
 * function says.
 */
export const AUTHENTICATED_ONLY = "authenticated";

export function hasPermission(permissions: string[], required: string): boolean {
  if (required === AUTHENTICATED_ONLY) {
    return true;
  }
  return permissions.includes(required);
}
