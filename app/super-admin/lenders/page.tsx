import { Suspense } from "react";

import SuperAdminLendersPage from "./SuperAdminLendersPage";

function LendersLoading() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header Skeleton */}
        <section className="glass-strong rounded-[28px] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--soft-rose)]" />

              <div className="h-9 w-64 animate-pulse rounded-xl bg-white/80 sm:w-80" />

              <div className="h-4 w-72 animate-pulse rounded-full bg-white/60 sm:w-96" />
            </div>

            <div className="h-11 w-36 animate-pulse rounded-xl bg-white/75" />
          </div>
        </section>

        {/* Search / Filter Skeleton */}
        <section className="glass rounded-[24px] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-11 flex-1 animate-pulse rounded-xl bg-white/75" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/65 sm:w-36" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/65 sm:w-36" />
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="glass rounded-[22px] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--soft-rose)]" />
                <div className="h-3 w-12 animate-pulse rounded-full bg-white/70" />
              </div>

              <div className="mt-5 h-8 w-16 animate-pulse rounded-lg bg-white/80" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-white/60" />
            </div>
          ))}
        </section>

        {/* Lender List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-2">
              <div className="h-6 w-36 animate-pulse rounded-lg bg-white/80" />
              <div className="h-3 w-52 animate-pulse rounded-full bg-white/60" />
            </div>

            <div className="h-8 w-20 animate-pulse rounded-lg bg-white/60" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="glass-strong rounded-[26px] p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-[var(--blush)]" />

                    <div className="min-w-0 space-y-2">
                      <div className="h-5 w-40 animate-pulse rounded-lg bg-white/85" />
                      <div className="h-3 w-28 animate-pulse rounded-full bg-white/60" />
                    </div>
                  </div>

                  <div className="h-7 w-16 animate-pulse rounded-full bg-white/70" />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((stat) => (
                    <div
                      key={stat}
                      className="rounded-2xl bg-white/45 p-3"
                    >
                      <div className="h-4 w-12 animate-pulse rounded bg-white/80" />
                      <div className="mt-2 h-3 w-16 animate-pulse rounded-full bg-white/60" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <div className="h-10 flex-1 animate-pulse rounded-xl bg-white/70" />
                  <div className="h-10 w-24 animate-pulse rounded-xl bg-white/60" />
                </div>
              </div>
            ))}
          </div>
        </section>
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
