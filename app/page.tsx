import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
      {/* Decorative background elements */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--blush)]/60 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[var(--coral)]/20 blur-3xl"
        aria-hidden="true"
      />

      {/* Main glass container */}
      <section className="glass-strong relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] p-6 sm:p-10 lg:flex-row lg:items-center lg:p-14">
        {/* Left content */}
        <div className="flex-1 text-center lg:pr-12 lg:text-left">
          <div className="mb-6 inline-flex items-center rounded-full border border-white/60 bg-white/40 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] backdrop-blur-md">
            Lender Workspace
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            Loans. Leads.
            <span className="block text-[var(--coral-dark)]">
              Decisions.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg lg:mx-0">
            A simple lending workspace for managing applications, leads,
            customer calls, approvals, and disbursements — all in one place.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/login"
              className="btn-coral inline-flex h-12 w-full items-center justify-center px-7 text-sm font-semibold sm:w-auto"
            >
              Get started
            </Link>

            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/70 bg-white/35 px-7 text-sm font-semibold text-[var(--text-primary)] backdrop-blur-md transition hover:bg-white/55 sm:w-auto"
            >
              Login
            </Link>
          </div>

          <p className="mt-5 text-sm text-[var(--text-muted)]">
            Built for lenders, agents, and customers.
          </p>
        </div>

        {/* Right visual */}
        <div className="mt-10 flex flex-1 justify-center lg:mt-0">
          <div className="relative w-full max-w-sm">
            {/* Main application card */}
            <div className="glass rounded-[28px] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    Today
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                    Lending overview
                  </h2>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--soft-rose,#f1dadb)] text-sm font-semibold text-[var(--coral-dark)]">
                  LW
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/45 p-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    New leads
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    24
                  </p>
                </div>

                <div className="rounded-2xl bg-white/45 p-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    Follow-ups
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    08
                  </p>
                </div>
              </div>

              {/* Example lead */}
              <div className="mt-3 rounded-2xl bg-white/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      Rahul Sharma
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Personal Loan
                    </p>
                  </div>

                  <span className="status-success rounded-full px-3 py-1 text-xs font-medium">
                    Eligible
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="font-semibold text-[var(--text-primary)]">
                    ₹2,50,000
                  </p>

                  <span className="text-xs text-[var(--text-muted)]">
                    Follow-up today
                  </span>
                </div>
              </div>
            </div>

            {/* Floating status card */}
            <div className="glass absolute -bottom-5 -left-5 rounded-2xl px-4 py-3 shadow-lg sm:-left-8">
              <p className="text-xs text-[var(--text-muted)]">Applications</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                On track ✓
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}