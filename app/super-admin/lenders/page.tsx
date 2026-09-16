import { Suspense } from "react";
import SuperAdminLendersPage from "./SuperAdminLendersPage";

function LendersLoading() {
  return (
    <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="animate-pulse">
          <div className="h-8 w-56 rounded-lg bg-white" />

          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-28 rounded-3xl bg-white/70"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LendersLoading />}>
      <SuperAdminLendersPage />
    </Suspense>
  );
}