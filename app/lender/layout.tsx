import type { ReactNode } from "react";

import { getSession } from "@/lib/auth/session";
import LenderShell from "@/components/lender/LenderShell";

type LenderLayoutProps = {
  children: ReactNode;
};

export default async function LenderLayout({
  children,
}: LenderLayoutProps) {
  const session = await getSession();

  return (
    <LenderShell session={session}>
      {children}
    </LenderShell>
  );
}
