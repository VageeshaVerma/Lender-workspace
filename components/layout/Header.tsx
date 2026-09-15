"use client";

import Link from "next/link";

type HeaderProps = {
  title?: string;
  userName?: string;
  onMenuClick?: () => void;
};

export default function Header({
  title = "Lender Workspace",
  userName,
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/25 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/40 text-[var(--text-primary)] transition hover:bg-white/60 lg:hidden"
            >
              ☰
            </button>
          )}

          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
          >
            {title}
          </Link>
        </div>

        {userName && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-[var(--text-muted)]">Welcome</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {userName}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--soft-rose,#f1dadb)] text-sm font-semibold text-[var(--coral-dark)]">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}