import type { ReactNode } from "react";
import { getSession } from "@/lib/auth/session";
import LenderShell from "@/components/lender/LenderShell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const session = await getSession();

  return (
    <LenderShell session={session}>
      {children}
    </LenderShell>
  );
}