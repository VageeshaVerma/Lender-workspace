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
  const [stats, setStats] = useState<Stats | null>(null);
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

        const response = await fetch("/api/super-admin/stats", {
          method: "GET",
          cache: "no-store",
        });

        const data: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load statistics"
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

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

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
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-64 rounded-lg bg-white/70" />

            <div className="mt-3 h-4 w-80 rounded bg-white/70" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-3xl border border-white/60 bg-white/70"
                />
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
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-100 bg-white/80 p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Unable to load dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error || "No statistics were returned."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
    <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-400">
              Platform Control
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Super Admin
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage the entire Lender Workspace platform,
              across all lenders and users.
            </p>
          </div>

          {/* Access Level + Logout */}

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-400">
                Access level
              </p>

              <p className="mt-1 text-sm font-bold text-rose-500">
                PLATFORM ADMIN
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Action Error */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Main Stats */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Lenders"
            value={stats.lenders.total}
            subtitle={`${stats.lenders.active} active`}
          />

          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active`}
          />

          <StatCard
            title="Total Leads"
            value={stats.leads.total}
            subtitle={`${stats.leadLenders.total} lender mappings`}
          />

          <StatCard
            title="Loan Offers"
            value={stats.loanOffers.total}
            subtitle={`${stats.leadEvents.total} audit events`}
          />
        </section>

        {/* Platform Breakdown */}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">

          {/* Lender Network */}

          <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Lender Network
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Current platform lender status.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <MiniStat
                label="Active"
                value={stats.lenders.active}
              />

              <MiniStat
                label="Inactive"
                value={stats.lenders.inactive}
              />
            </div>
          </div>

          {/* User Distribution */}

          <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                User Distribution
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Users currently stored in the platform.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <MiniStat
                label="Ops Admins"
                value={roleCounts.ops_admin ?? 0}
              />

              <MiniStat
                label="Lender Admins"
                value={roleCounts.lender_admin ?? 0}
              />

              <MiniStat
                label="Agents"
                value={roleCounts.lender_agent ?? 0}
              />
            </div>
          </div>
        </section>

        {/* Platform Management */}

        <section className="mt-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Platform Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage lenders and create new lender organizations.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            {/* Manage Lenders */}

            <ManagementCard
              href="/super-admin/lenders"
              icon="🏦"
              title="Lenders"
              description="View, activate, deactivate, and delete lenders across the platform."
            />

            {/* Create Lender */}

            <ManagementCard
              href="/super-admin/lenders?create=true"
              icon="➕"
              title="Create Lender"
              description="Create a new lender organization and configure its eligibility rules."
            />

          </div>
        </section>

        {/* Danger Zone */}

        <section className="mt-8 rounded-3xl border border-red-100 bg-red-50/60 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-xl">
              ⚠️
            </div>

            <div>
              <h2 className="font-bold text-red-900">
                Danger Zone
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-red-700/80">
                Destructive platform operations will be added
                here. These actions will require Super Admin
                authorization and explicit confirmation.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

// ----------------------------------------
// STAT CARD
// ----------------------------------------

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value.toLocaleString()}
      </p>

      <p className="mt-2 text-xs font-medium text-rose-400">
        {subtitle}
      </p>
    </div>
  );
}

// ----------------------------------------
// MINI STAT
// ----------------------------------------

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50/80 p-4">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ----------------------------------------
// MANAGEMENT CARD
// ----------------------------------------

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
      className="group rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-xl">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {description}
      </p>

      <p className="mt-4 text-sm font-semibold text-rose-500 transition group-hover:translate-x-0.5">
        Open →
      </p>
    </Link>
  );
}