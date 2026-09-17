import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

import LenderShell from "@/components/lender/LenderShell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (
    session.role !== "ops_admin" &&
    session.role !== "super_admin"
  ) {
    redirect("/lender");
  }

  return (
    <LenderShell session={session}>
      {children}
    </LenderShell>
  );
}
