"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Lender = {
  lender_id: string;
  name: string;
  isActive: boolean;
  priority: number | null;
  flow: string | null;
  minAge: number | null;
  maxAge: number | null;
  minIncome: number | null;
  minCreditScore_exclusive: number | null;
  maxCreditScore_inclusive: number | null;

  // Can currently be either an array or a string
  // depending on the existing MongoDB document.
  employmentTypes: string[] | string | null;
  supportedPincodes: string[] | string | null;

  maxLeadsPerDay: number | null;

  agents: {
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  }[];

  leadCount: number;
};

type ApiResponse = {
  lender?: Lender;
  error?: string;
};

/**
 * Converts lender list-like fields into a consistent string array.
 *
 * Supports:
 * - ["salaried", "self_employed"]
 * - "salaried+self_employed"
 * - "salaried,self_employed"
 * - "ALL"
 * - null / undefined
 */
function normalizeList(
  value: string[] | string | null | undefined
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[+,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export default function LenderDetailsPage() {
  const params = useParams();

  const lenderId = params.lenderId as string;

  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(
    null
  );

  const [lender, setLender] = useState<Lender | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLender() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/super-admin/lenders/${lenderId}`
        );

        const data: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to fetch lender"
          );
        }

        if (!data.lender) {
          throw new Error("Lender not found");
        }

        setLender(data.lender);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    if (lenderId) {
      fetchLender();
    }
  }, [lenderId]);

  async function handleDeleteAgent(agentId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this agent?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAgentId(agentId);

      const response = await fetch(
        `/api/super-admin/lenders/${lenderId}/agents/${agentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to remove agent"
        );
      }

      setLender((currentLender) => {
        if (!currentLender) {
          return currentLender;
        }

        return {
          ...currentLender,
          agents: currentLender.agents.filter(
            (agent) => agent._id !== agentId
          ),
        };
      });
    } catch (error) {
      console.error(error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to remove agent"
      );
    } finally {
      setDeletingAgentId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 w-64 rounded-lg bg-white" />

            <div className="mt-8 h-48 rounded-3xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !lender) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/super-admin/lenders"
            className="text-sm font-semibold text-slate-600"
          >
            ← Back to Lenders
          </Link>

          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-700">
              Unable to load lender
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error || "Lender not found"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const employmentTypes = normalizeList(
    lender.employmentTypes
  );

  const supportedPincodes = normalizeList(
    lender.supportedPincodes
  );

  return (
    <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/super-admin/lenders"
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to Lenders
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Lender Details
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {lender.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {lender.lender_id}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${
              lender.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {lender.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Overview */}

        <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Overview
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Priority
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {lender.priority ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Flow
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {lender.flow || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Total Leads
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {lender.leadCount}
              </p>
            </div>
          </div>
        </section>

        {/* Eligibility Rules */}

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Eligibility Rules
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Age */}

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Age Range
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {lender.minAge ?? "—"} -{" "}
                {lender.maxAge ?? "—"} years
              </p>
            </div>

            {/* Income */}

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Minimum Income
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {lender.minIncome !== null &&
                lender.minIncome !== undefined
                  ? `₹${lender.minIncome.toLocaleString(
                      "en-IN"
                    )}`
                  : "—"}
              </p>
            </div>

            {/* Credit Score */}

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Credit Score
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {lender.minCreditScore_exclusive ?? "—"} -{" "}
                {lender.maxCreditScore_inclusive ?? "—"}
              </p>
            </div>

            {/* Max Leads */}

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Max Leads Per Day
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {lender.maxLeadsPerDay ?? "Unlimited"}
              </p>
            </div>

            {/* Employment Types */}

            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-sm text-slate-500">
                Employment Types
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {employmentTypes.length > 0 ? (
                  employmentTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
                    >
                      {type}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">
                    No restriction
                  </span>
                )}
              </div>
            </div>

            {/* Supported Pincodes */}

            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-slate-500">
                Supported Pincodes
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {supportedPincodes.length > 0 ? (
                  supportedPincodes.map((pincode) => (
                    <span
                      key={pincode}
                      className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700"
                    >
                      {pincode}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">
                    No pincode restriction
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Lender Agents */}

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Lender Agents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Agents assigned to {lender.name}
              </p>
            </div>

            <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
              {lender.agents?.length ?? 0} Agents
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {lender.agents?.length > 0 ? (
              lender.agents.map((agent) => (
                <div
                  key={agent._id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {agent.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {agent.email}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        agent.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {agent.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Joined
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {new Date(
                          agent.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    {agent.isActive && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAgent(agent._id)
                        }
                        disabled={
                          deletingAgentId === agent._id
                        }
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingAgentId === agent._id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-6 sm:col-span-2">
                <p className="text-center text-sm text-slate-400">
                  No agents found for this lender.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
