"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { SettingsPopup } from "@/components/settings-popup";
import { NAVIGATION } from "@/lib/navigation";

export function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="shell notranslate" translate="no" suppressHydrationWarning>
      <aside className="shell__sidebar">
        <Link href="/" className="brand-card">
          <BrandLogo />
        </Link>

        <div className="sidebar-section">
          <span className="sidebar-section__title">Navegacion</span>
          <nav className="sidebar-nav">
            {NAVIGATION.map((entry) => (
              <Link
                key={entry.label}
                className={`sidebar-nav__item ${pathname === entry.href ? "sidebar-nav__item--active" : ""}`}
                href={entry.href}
              >
                <span>{entry.label}</span>
                <small>{entry.hint}</small>
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-note">
          <p className="sidebar-note__title">API BCRA — Central de Deudores</p>
          <p>
            chequerIA consulta en tiempo real la API pública del Banco Central de la República
            Argentina. Los datos son oficiales y actualizados mensualmente.
          </p>
        </div>
      </aside>

      <div className="shell__workspace">
        <header className="topbar">
          <div className="topbar__welcome">
            <div className="topbar__icon" aria-hidden="true">
              <span />
            </div>
            <div>
              <p className="topbar__label">Central operativa</p>
              <strong>{process.env.NEXT_PUBLIC_USER_EMAIL || "admin@chequeria.app"}</strong>
            </div>
          </div>

          <div className="toolbar__actions">
            <SettingsPopup />
            <button
              type="button"
              className="secondary-button"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
            </button>
          </div>
        </header>

        <main className="shell__main">{children}</main>
      </div>
    </div>
  );
}
