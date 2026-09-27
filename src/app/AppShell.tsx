import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useSessionStore } from "../shared/auth/session";
import { hasPermission } from "../shared/auth/permissions";
import { NAV_ITEMS } from "./navConfig";
import styles from "./AppShell.module.css";

function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const groupKey = key(item);
    const existing = groups.get(groupKey);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(groupKey, [item]);
    }
  }
  return [...groups.entries()];
}

function collapsedStorageKey(userId: string): string {
  return `cineatelie:sidebar-collapsed:${userId}`;
}

/** Fixed shell: collapsible sidebar + header (frontend spec §4). Menu filtering by
 * permission is a convenience only — every route it links to is independently authorised
 * server-side regardless of what's shown here. */
export function AppShell() {
  const location = useLocation();
  const permissions = useSessionStore((state) => state.permissions);
  const userId = useSessionStore((state) => state.me?.user_id);
  const [collapsed, setCollapsed] = useState(() => {
    if (!userId) return false;
    return localStorage.getItem(collapsedStorageKey(userId)) === "true";
  });

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    if (userId) {
      localStorage.setItem(collapsedStorageKey(userId), String(next));
    }
  }

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(permissions, item.permission));
  const activeItem = NAV_ITEMS.find((item) => item.path === location.pathname);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} data-collapsed={collapsed}>
        <button type="button" onClick={toggleCollapsed} aria-label="Recolher menu">
          {!collapsed && <span className={styles.logo}>Cine Ateliê</span>}
          {collapsed && <span aria-hidden="true">›</span>}
        </button>
        {!collapsed &&
          groupBy(visibleItems, (item) => item.group).map(([group, items]) => (
            <nav className={styles.group} key={group} aria-label={group}>
              <p className={styles.groupLabel}>{group}</p>
              {items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={styles.navLink}
                  data-active={item.path === location.pathname}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ))}
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>{activeItem?.group ?? "Cine Ateliê"}</p>
            <h1 className={styles.title}>{activeItem?.label ?? ""}</h1>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
