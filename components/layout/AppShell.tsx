"use client";

import { useState } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  userName?: string;
  navItems: NavItem[];
};

export default function AppShell({
  children,
  title,
  userName,
  navItems,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header
        title={title}
        userName={userName}
        onMenuClick={() => setMenuOpen((current) => !current)}
      />

      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        {children}
      </main>

      <BottomNav items={navItems} />
    </div>
  );
}