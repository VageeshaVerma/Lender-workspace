"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

type UserRole =
  | "ops_admin"
  | "lender_admin"
  | "lender_agent"
  | "super_admin";

type SessionData = {
  userId: string;
  email: string;
  role: UserRole;
  lenderId: string | null;
};

type LenderShellProps = {
  children: ReactNode;
  session: SessionData | null;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

function OverviewIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function LeadsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h10" />
      <circle cx="18" cy="19" r="2" />
    </svg>
  );
}

function AgentsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M18 14.5c1.8.8 3 2.7 3 4.8" />
    </svg>
  );
}

function LendersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10h18" />
      <path d="M5 10v9" />
      <path d="M9 10v9" />
      <path d="M15 10v9" />
      <path d="M19 10v9" />
      <path d="M3 19h18" />
      <path d="M12 3l9 5H3l9-5Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12H9" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export default function LenderShell({
  children,
  session,
}: LenderShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const role = session?.role;

  const navigation: NavigationItem[] = [
    {
      label: "Overview",
      href: "/lender",
      icon: <OverviewIcon />,
    },
    {
      label: "Leads",
      href: "/lender/leads",
      icon: <LeadsIcon />,
    },
  ];

  if (
    role === "lender_admin" ||
    role === "ops_admin" ||
    role === "super_admin"
  ) {
    navigation.push({
      label: "Agents",
      href: "/lender/agents",
      icon: <AgentsIcon />,
    });
  }

  if (
    role === "ops_admin" ||
    role === "super_admin"
  ) {
    navigation.push({
      label: "Lenders",
      href: "/lender/lenders",
      icon: <LendersIcon />,
    });
  }

  function isActive(href: string) {
    if (href === "/lender") {
      return pathname === "/lender";
    }

    return pathname.startsWith(href);
  }

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  const firstLetter =
    session?.email?.charAt(0).toUpperCase() ?? "U";

  const roleLabel =
    role?.replaceAll("_", " ") ?? "User";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ================================
          MOBILE HEADER
      ================================= */}

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-black/5 bg-white/85 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(true)
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] transition hover:bg-black/5"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        <div className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          Lender Workspace
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--soft-rose)] text-sm font-semibold text-[var(--text-primary)]">
          {firstLetter}
        </div>
      </header>

      {/* ================================
          MOBILE OVERLAY
      ================================= */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setMobileMenuOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ================================
          SIDEBAR
      ================================= */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-black/5
          bg-white/90
          shadow-[8px_0_30px_rgba(63,42,47,0.06)]
          backdrop-blur-xl
          transition-transform duration-200
          lg:translate-x-0
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Brand */}

        <div className="flex h-20 items-center border-b border-black/5 px-6">
          <Link
            href="/lender"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--text-primary)] text-sm font-bold text-white shadow-sm">
              L
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                Lender
              </p>

              <p className="text-xs text-[var(--text-muted)]">
                Workspace
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-black/5 hover:text-[var(--text-primary)] lg:hidden"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation
              .slice(0, 2)
              .map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={`
                      group flex items-center gap-3
                      rounded-lg px-3 py-2.5
                      text-sm font-medium
                      transition
                      ${
                        active
                          ? "bg-[var(--soft-rose)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-black/[0.035] hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    <span
                      className={`
                        transition
                        ${
                          active
                            ? "text-[var(--coral-dark)]"
                            : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    {item.label}

                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />
                    )}
                  </Link>
                );
              })}
          </div>

          {navigation.length > 2 && (
            <div className="mt-8">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Management
              </p>

              <div className="space-y-1">
                {navigation
                  .slice(2)
                  .map((item) => {
                    const active = isActive(
                      item.href
                    );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() =>
                          setMobileMenuOpen(false)
                        }
                        className={`
                          group flex items-center gap-3
                          rounded-lg px-3 py-2.5
                          text-sm font-medium
                          transition
                          ${
                            active
                              ? "bg-[var(--soft-rose)] text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:bg-black/[0.035] hover:text-[var(--text-primary)]"
                          }
                        `}
                      >
                        <span
                          className={`
                            transition
                            ${
                              active
                                ? "text-[var(--coral-dark)]"
                                : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                            }
                          `}
                        >
                          {item.icon}
                        </span>

                        {item.label}

                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </nav>

        {/* User / Logout */}

        <div className="border-t border-black/5 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-[var(--background)] px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--soft-rose)] text-sm font-semibold text-[var(--text-primary)]">
              {firstLetter}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {session?.email ?? "User"}
              </p>

              <p className="truncate text-xs capitalize text-[var(--text-muted)]">
                {roleLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-black/[0.035] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogoutIcon />

            {loggingOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </aside>

      {/* ================================
          MAIN AREA
      ================================= */}

      <div className="lg:pl-64">
        {/* Desktop Header */}

        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-black/5 bg-white/75 px-8 backdrop-blur-xl lg:flex">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Lender Workspace
            </p>

            <p className="text-xs text-[var(--text-muted)]">
              Lending operations dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-black/5 hover:text-[var(--text-primary)]"
              aria-label="Notifications"
            >
              <BellIcon />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />
            </button>

            <div className="h-5 w-px bg-black/10" />

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--soft-rose)] text-xs font-semibold text-[var(--text-primary)]">
                {firstLetter}
              </div>

              <div className="hidden xl:block">
                <p className="max-w-[220px] truncate text-xs font-semibold text-[var(--text-primary)]">
                  {session?.email ?? "User"}
                </p>

                <p className="text-[11px] capitalize text-[var(--text-muted)]">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}

        <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
