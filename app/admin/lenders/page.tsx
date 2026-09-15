"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import GlassCard from "@/components/ui/GlassCard";

import Badge from "@/components/ui/Badge";

type Lender = {
  lender_id: string;
  name: string;
  isActive: boolean;
  priority: number | null;
  agentCount: number;
  leadCount: number;
};

type CreateLenderForm = {
  lender_id: string;
  name: string;
  priority: string;
  flow: string;
  minAge: string;
  maxAge: string;
  minIncome: string;
  minCreditScore_exclusive: string;
  maxCreditScore_inclusive: string;
  maxLeadsPerDay: string;
  employmentTypes: string;
  supportedPincodes: string;
  minAppVersion: string;
  isActive: boolean;
  preflight: boolean;
  leadOnly: boolean;
  offerApproval: boolean;
  canShowProvisionalOffer: boolean;
};

const initialForm: CreateLenderForm = {
  lender_id: "",
  name: "",
  priority: "1",
  flow: "",
  minAge: "",
  maxAge: "",
  minIncome: "",
  minCreditScore_exclusive: "",
  maxCreditScore_inclusive: "",
  maxLeadsPerDay: "",
  employmentTypes: "",
  supportedPincodes: "",
  minAppVersion: "",
  isActive: true,
  preflight: false,
  leadOnly: false,
  offerApproval: false,
  canShowProvisionalOffer: false,
};

export default function AdminLendersPage() {
  const [lenders, setLenders] = useState<Lender[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] =
    useState<CreateLenderForm>(initialForm);

  const [creating, setCreating] = useState(false);

  const [createError, setCreateError] = useState("");

  const [createSuccess, setCreateSuccess] = useState("");

  async function fetchLenders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/lenders", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "Only ops admins can access lender management."
        );
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error || "Failed to fetch lenders."
        );
      }

      const data = await response.json();

      setLenders(data.lenders ?? []);
    } catch (err) {
      console.error("Failed to fetch lenders:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading lenders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLenders();
  }, []);

  function updateForm(
    field: keyof CreateLenderForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function closeCreateForm() {
    if (creating) {
      return;
    }

    setShowCreateForm(false);
    setCreateError("");
    setCreateSuccess("");
    setForm(initialForm);
  }

  async function handleCreateLender(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreateError("");
    setCreateSuccess("");

    const lenderId = form.lender_id
      .trim()
      .toLowerCase();

    const name = form.name.trim();

    if (!lenderId) {
      setCreateError("Lender ID is required.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(lenderId)) {
      setCreateError(
        "Lender ID can contain only lowercase letters, numbers, and hyphens."
      );
      return;
    }

    if (!name) {
      setCreateError("Lender name is required.");
      return;
    }

    setCreating(true);

    try {
      const payload = {
        lender_id: lenderId,
        name,

        isActive: form.isActive,

        priority: form.priority
          ? Number(form.priority)
          : undefined,

        flow: form.flow.trim() || undefined,

        minAge: form.minAge
          ? Number(form.minAge)
          : undefined,

        maxAge: form.maxAge
          ? Number(form.maxAge)
          : undefined,

        minIncome: form.minIncome
          ? Number(form.minIncome)
          : undefined,

        minCreditScore_exclusive:
          form.minCreditScore_exclusive
            ? Number(form.minCreditScore_exclusive)
            : undefined,

        maxCreditScore_inclusive:
          form.maxCreditScore_inclusive
            ? Number(form.maxCreditScore_inclusive)
            : undefined,

        maxLeadsPerDay: form.maxLeadsPerDay
          ? Number(form.maxLeadsPerDay)
          : undefined,

        employmentTypes: form.employmentTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        supportedPincodes: form.supportedPincodes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        minAppVersion:
          form.minAppVersion.trim() || undefined,

        preflight: form.preflight,

        leadOnly: form.leadOnly,

        offerApproval: form.offerApproval,

        canShowProvisionalOffer:
          form.canShowProvisionalOffer,
      };

      const response = await fetch(
        "/api/super-admin/lenders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to create lenders."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to create lender."
        );
      }

      setCreateSuccess(
        "Lender created successfully."
      );

      setForm(initialForm);

      await fetchLenders();

      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess("");
      }, 800);
    } catch (err) {
      console.error("Failed to create lender:", err);

      setCreateError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the lender."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm font-medium text-[#c85c6f] hover:underline"
          >
            ← Back to Admin
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Lenders
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage lenders, agents, and lender activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateError("");
                setCreateSuccess("");
                setShowCreateForm(true);
              }}
              className="rounded-xl bg-[#d86678] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c95769]"
            >
              + Create Lender
            </button>

          </div>
        </div>

        {/* Create Lender Form */}

        {showCreateForm && (
          <GlassCard>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create New Lender
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a lender organization and configure its
                  eligibility rules.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                disabled={creating}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {createSuccess}
              </div>
            )}

            <form
              onSubmit={handleCreateLender}
              className="space-y-6"
            >

              {/* Basic Information */}

              <section>
                <h3 className="mb-3 font-semibold text-slate-900">
                  Basic Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Lender ID *
                    </label>

                    <input
                      value={form.lender_id}
                      onChange={(event) =>
                        updateForm(
                          "lender_id",
                          event.target.value.toLowerCase()
                        )
                      }
                      placeholder="example-lender"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d86678] focus:ring-2 focus:ring-[#d86678]/20"
                      required
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Lowercase letters, numbers and hyphens only.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Lender Name *
                    </label>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateForm(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Example Finance"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d86678] focus:ring-2 focus:ring-[#d86678]/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Priority
                    </label>

                    <input
                      type="number"
                      value={form.priority}
                      onChange={(event) =>
                        updateForm(
                          "priority",
                          event.target.value
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d86678] focus:ring-2 focus:ring-[#d86678]/20"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Flow
                    </label>

                    <input
                      value={form.flow}
                      onChange={(event) =>
                        updateForm(
                          "flow",
                          event.target.value
                        )
                      }
                      placeholder="standard"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d86678] focus:ring-2 focus:ring-[#d86678]/20"
                    />
                  </div>

                </div>
              </section>

              {/* Eligibility Rules */}

              <section>
                <h3 className="mb-3 font-semibold text-slate-900">
                  Eligibility Rules
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  <div>
                    <label className="text-sm text-slate-600">
                      Minimum Age
                    </label>

                    <input
                      type="number"
                      value={form.minAge}
                      onChange={(event) =>
                        updateForm(
                          "minAge",
                          event.target.value
                        )
                      }
                      placeholder="18"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">
                      Maximum Age
                    </label>

                    <input
                      type="number"
                      value={form.maxAge}
                      onChange={(event) =>
                        updateForm(
                          "maxAge",
                          event.target.value
                        )
                      }
                      placeholder="60"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">
                      Minimum Income
                    </label>

                    <input
                      type="number"
                      value={form.minIncome}
                      onChange={(event) =>
                        updateForm(
                          "minIncome",
                          event.target.value
                        )
                      }
                      placeholder="15000"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">
                      Min Credit Score
                    </label>

                    <input
                      type="number"
                      value={form.minCreditScore_exclusive}
                      onChange={(event) =>
                        updateForm(
                          "minCreditScore_exclusive",
                          event.target.value
                        )
                      }
                      placeholder="600"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">
                      Max Credit Score
                    </label>

                    <input
                      type="number"
                      value={form.maxCreditScore_inclusive}
                      onChange={(event) =>
                        updateForm(
                          "maxCreditScore_inclusive",
                          event.target.value
                        )
                      }
                      placeholder="900"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">
                      Max Leads / Day
                    </label>

                    <input
                      type="number"
                      value={form.maxLeadsPerDay}
                      onChange={(event) =>
                        updateForm(
                          "maxLeadsPerDay",
                          event.target.value
                        )
                      }
                      placeholder="100"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                </div>
              </section>

              {/* Lists */}

              <section>
                <h3 className="mb-3 font-semibold text-slate-900">
                  Supported Criteria
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label className="text-sm text-slate-600">
                      Employment Types
                    </label>

                    <input
                      value={form.employmentTypes}
                      onChange={(event) =>
                        updateForm(
                          "employmentTypes",
                          event.target.value
                        )
                      }
                      placeholder="salaried,self-employed"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Separate multiple values with commas.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">
                      Supported Pincodes
                    </label>

                    <input
                      value={form.supportedPincodes}
                      onChange={(event) =>
                        updateForm(
                          "supportedPincodes",
                          event.target.value
                        )
                      }
                      placeholder="226001,226002"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Separate multiple pincodes with commas.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">
                      Minimum App Version
                    </label>

                    <input
                      value={form.minAppVersion}
                      onChange={(event) =>
                        updateForm(
                          "minAppVersion",
                          event.target.value
                        )
                      }
                      placeholder="1.0.0"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                </div>
              </section>

              {/* Flags */}

              <section>
                <h3 className="mb-3 font-semibold text-slate-900">
                  Configuration
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">

                  <label className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        updateForm(
                          "isActive",
                          event.target.checked
                        )
                      }
                    />

                    <span className="text-sm text-slate-700">
                      Active lender
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                    <input
                      type="checkbox"
                      checked={form.preflight}
                      onChange={(event) =>
                        updateForm(
                          "preflight",
                          event.target.checked
                        )
                      }
                    />

                    <span className="text-sm text-slate-700">
                      Preflight
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                    <input
                      type="checkbox"
                      checked={form.leadOnly}
                      onChange={(event) =>
                        updateForm(
                          "leadOnly",
                          event.target.checked
                        )
                      }
                    />

                    <span className="text-sm text-slate-700">
                      Lead only
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                    <input
                      type="checkbox"
                      checked={form.offerApproval}
                      onChange={(event) =>
                        updateForm(
                          "offerApproval",
                          event.target.checked
                        )
                      }
                    />

                    <span className="text-sm text-slate-700">
                      Offer approval required
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl bg-white/70 p-3 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={
                        form.canShowProvisionalOffer
                      }
                      onChange={(event) =>
                        updateForm(
                          "canShowProvisionalOffer",
                          event.target.checked
                        )
                      }
                    />

                    <span className="text-sm text-slate-700">
                      Can show provisional offer
                    </span>
                  </label>

                </div>
              </section>

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={creating}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#d86678] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c95769] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating
                    ? "Creating..."
                    : "Create Lender"}
                </button>

              </div>

            </form>
          </GlassCard>
        )}

        {/* Loading */}

        {loading && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <GlassCard key={item}>
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-32 rounded bg-slate-200" />

                  <div className="h-4 w-24 rounded bg-slate-200" />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-xl bg-slate-200" />
                    <div className="h-16 rounded-xl bg-slate-200" />
                  </div>

                  <div className="h-10 rounded-xl bg-slate-200" />
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <GlassCard>
            <div className="py-8 text-center">
              <div className="mb-3 text-3xl">
                ⚠️
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                Unable to load lenders
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchLenders}
                className="mt-5 rounded-xl bg-[#d86678] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c95769]"
              >
                Try Again
              </button>
            </div>
          </GlassCard>
        )}

        {/* Empty */}

        {!loading &&
          !error &&
          lenders.length === 0 && (
            <GlassCard>
              <div className="py-10 text-center">
                <div className="mb-3 text-4xl">
                  🏦
                </div>

                <h2 className="text-lg font-semibold text-slate-900">
                  No lenders found
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  There are currently no lenders configured.
                </p>
              </div>
            </GlassCard>
          )}

        {/* Lender Cards */}

        {!loading &&
          !error &&
          lenders.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {lenders.map((lender) => (
                <GlassCard key={lender.lender_id}>
                  <div className="flex h-full flex-col">

                    {/* Name + Status */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">

                        <h2 className="truncate text-lg font-bold text-slate-900">
                          {lender.name}
                        </h2>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {lender.lender_id}
                        </p>

                      </div>

                      <Badge
                        variant={
                          lender.isActive
                            ? "success"
                            : "neutral"
                        }
                      >
                        {lender.isActive
                          ? "Active"
                          : "Inactive"}
                      </Badge>

                    </div>

                    {/* Stats */}

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-white/70 p-3">
                        <p className="text-xs text-slate-500">
                          Agents
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {lender.agentCount}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/70 p-3">
                        <p className="text-xs text-slate-500">
                          Leads
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {lender.leadCount}
                        </p>
                      </div>

                    </div>

                    {/* Priority */}

                    <div className="mt-3 flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5">

                      <span className="text-sm text-slate-500">
                        Priority
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        {lender.priority ?? "—"}
                      </span>

                    </div>

                    {/* Action */}

                    <div className="mt-5">

                      <Link
                        href={`/admin/lenders/${encodeURIComponent(
                          lender.lender_id
                        )}`}
                        className="block w-full rounded-xl border border-[#e7a1ad] bg-white/70 px-4 py-2.5 text-center text-sm font-semibold text-[#bd5366] transition hover:bg-[#fff0f2]"
                      >
                        View Lender
                      </Link>

                    </div>

                  </div>
                </GlassCard>
              ))}

            </div>
          )}

      </div>
    </main>
  );
}