"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  lenders: {
    total: number;
    active: number;
    inactive: number;
  };

  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };

  leads: {
    total: number;
  };

  leadLenders: {
    total: number;
  };

  loanOffers: {
    total: number;
  };

  leadEvents: {
    total: number;
  };
};

type ApiResponse = {
  stats?: Stats;
  error?: string;
};

export default function SuperAdminPage() {
  const [stats, setStats] = useState<Stats | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----------------------------------------
  // LOAD DASHBOARD STATS
  // ----------------------------------------

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/super-admin/stats",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load statistics"
          );
        }

        setStats(data.stats ?? null);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load statistics"
        );
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // ----------------------------------------
  // LOGOUT
  // ----------------------------------------

  async function handleLogout() {
    try {
      setError("");

      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      window.location.href = "/login";
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to logout. Please try again."
      );
    }
  }

  // ----------------------------------------
  // LOADING STATE
  // ----------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">

            <div className="glass-strong rounded-3xl p-6">
              <div className="h-3 w-32 rounded bg-[var(--blush)]" />
              <div className="mt-4 h-9 w-64 rounded-xl bg-[var(--blush-light)]" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-[var(--blush-light)]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="glass rounded-3xl p-6"
                >
                  <div className="h-3 w-24 rounded bg-[var(--blush)]" />
                  <div className="mt-5 h-9 w-28 rounded-xl bg-[var(--blush-light)]" />
                  <div className="mt-3 h-3 w-20 rounded bg-[var(--blush-light)]" />
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="glass rounded-3xl p-6"
                >
                  <div className="h-5 w-40 rounded bg-[var(--blush-light)]" />
                  <div className="mt-2 h-3 w-56 rounded bg-[var(--blush-light)]" />

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-2xl bg-[var(--blush-light)]" />
                    <div className="h-24 rounded-2xl bg-[var(--blush-light)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------
  // ERROR STATE
  // ----------------------------------------

  if (error || !stats) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass-strong flex min-h-[420px] flex-col items-center justify-center rounded-3xl px-6 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10 text-xl text-[var(--danger)]">
              !
            </div>

            <h1 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
              Unable to load dashboard
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              {error ||
                "No statistics were returned."}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="btn-primary mt-6"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const roleCounts = stats.users.byRole;

  return (
    <main className="min-h-screen px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ───────────────── Header ───────────────── */}

        <section className="glass-strong relative overflow-hidden rounded-[28px] p-6 sm:p-8">

          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--blush)]/30 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--coral)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                  Platform Control
                </span>

                <span className="rounded-full bg-[var(--success)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--success)]">
                  System Active
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Super Admin
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Monitor and manage the entire
                Lender Workspace platform across
                lenders, users, leads and loan
                operations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-white/55 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Access Level
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--coral-dark)]">
                  PLATFORM ADMIN
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-[var(--danger)]/15 bg-[var(--danger)]/8 px-4 py-3 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)]/15"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* ───────────────── Error ───────────────── */}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--danger)]/15 bg-[var(--danger)]/8 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--danger)]/10 text-xs font-bold text-[var(--danger)]">
              !
            </div>

            <p className="text-sm font-medium text-[var(--danger)]">
              {error}
            </p>
          </div>
        )}

        {/* ───────────────── Main Stats ───────────────── */}

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                Platform Overview
              </p>

              <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                System Snapshot
              </h2>
            </div>

            <span className="hidden text-xs font-medium text-[var(--text-muted)] sm:block">
              Live platform statistics
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Total Lenders"
              value={stats.lenders.total}
              subtitle={`${stats.lenders.active} active`}
              icon="L"
              accent="coral"
            />

            <StatCard
              title="Total Users"
              value={stats.users.total}
              subtitle={`${stats.users.active} active`}
              icon="U"
              accent="info"
            />

            <StatCard
              title="Total Leads"
              value={stats.leads.total}
              subtitle={`${stats.leadLenders.total} lender mappings`}
              icon="D"
              accent="success"
            />

            <StatCard
              title="Loan Offers"
              value={stats.loanOffers.total}
              subtitle={`${stats.leadEvents.total} audit events`}
              icon="₹"
              accent="warning"
            />
          </div>
        </section>

        {/* ───────────────── Platform Breakdown ───────────────── */}

        <section className="grid gap-6 lg:grid-cols-2">

          {/* Lender Network */}

          <div className="glass-strong rounded-3xl p-6">
            <SectionHeader
              eyebrow="Network"
              title="Lender Network"
              description="Current platform lender status."
              icon="01"
            />

            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniStat
                label="Active"
                value={stats.lenders.active}
                tone="success"
              />

              <MiniStat
                label="Inactive"
                value={stats.lenders.inactive}
                tone="danger"
              />
            </div>

            <div className="mt-5 rounded-2xl bg-[var(--soft-rose)]/45 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Active coverage
                </span>

                <span className="text-xs font-bold text-[var(--coral-dark)]">
                  {stats.lenders.total > 0
                    ? Math.round(
                        (stats.lenders.active /
                          stats.lenders.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-[var(--coral)] transition-all"
                  style={{
                    width: `${
                      stats.lenders.total > 0
                        ? Math.round(
                            (stats.lenders.active /
                              stats.lenders.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* User Distribution */}

          <div className="glass-strong rounded-3xl p-6">
            <SectionHeader
              eyebrow="Workforce"
              title="User Distribution"
              description="Users currently stored in the platform."
              icon="02"
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label="Ops Admins"
                value={
                  roleCounts.ops_admin ?? 0
                }
                tone="info"
              />

              <MiniStat
                label="Lender Admins"
                value={
                  roleCounts.lender_admin ?? 0
                }
                tone="coral"
              />

              <MiniStat
                label="Agents"
                value={
                  roleCounts.lender_agent ?? 0
                }
                tone="success"
              />
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[var(--soft-rose)]/45 px-4 py-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Active users
              </span>

              <span className="text-sm font-bold text-[var(--text-primary)]">
                {stats.users.active.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* ───────────────── Management ───────────────── */}

        <section>
          <div className="mb-4 px-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
              Administration
            </p>

            <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
              Platform Management
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage lender organizations and
              platform configuration.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <ManagementCard
              href="/super-admin/lenders"
              icon="L"
              title="Lenders"
              description="View, activate, deactivate, and delete lender organizations across the platform."
            />

            <ManagementCard
              href="/super-admin/lenders?create=true"
              icon="+"
              title="Create Lender"
              description="Create a new lender organization and configure its eligibility rules."
            />
          </div>
        </section>

        {/* ───────────────── Platform Health ───────────────── */}

        <section className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--success)]/10 text-sm font-bold text-[var(--success)]">
                ✓
              </div>

              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Platform Operations
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  Core lender, lead, offer and audit
                  records are being tracked centrally.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-[var(--success)]/10 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--success)]">
                Operational
              </span>
            </div>
          </div>
        </section>

        
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  accent:
    | "coral"
    | "success"
    | "warning"
    | "info";
}) {
  const accentClasses = {
    coral:
      "bg-[var(--coral)]/10 text-[var(--coral-dark)]",
    success:
      "bg-[var(--success)]/10 text-[var(--success)]",
    warning:
      "bg-[var(--warning)]/10 text-[var(--warning)]",
    info:
      "bg-[var(--info)]/10 text-[var(--info)]",
  };

  return (
    <div className="glass-strong group rounded-3xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-6">

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {value.toLocaleString()}
          </p>

          <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${accentClasses[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--blush-light)] text-[10px] font-bold text-[var(--coral-dark)]">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-base font-bold text-[var(--text-primary)]">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "coral"
    | "success"
    | "danger"
    | "info";
}) {
  const toneClasses = {
    coral:
      "bg-[var(--coral)]/8 text-[var(--coral-dark)]",
    success:
      "bg-[var(--success)]/8 text-[var(--success)]",
    danger:
      "bg-[var(--danger)]/8 text-[var(--danger)]",
    info:
      "bg-[var(--info)]/8 text-[var(--info)]",
  };

  return (
    <div
      className={`rounded-2xl p-4 ${toneClasses[tone]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ManagementCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="glass-strong group rounded-3xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--blush-light)] text-sm font-bold text-[var(--coral-dark)]">
          {icon}
        </div>

        <span className="text-lg text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--coral-dark)]">
          →
        </span>
      </div>

      <h3 className="mt-5 text-base font-bold text-[var(--text-primary)]">
        {title}
      </h3>

      <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>

      <p className="mt-5 text-xs font-bold text-[var(--coral-dark)]">
        Open management →
      </p>
    </Link>
  );
}
