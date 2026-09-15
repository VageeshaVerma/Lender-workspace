"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lead = {
  _id: string;
  leadId: string;
  lenderId: string;
  eligibilityStatus?: string;
  assignmentStatus?: string;
  assignedAgentId?: string | null;
  status: string;
  followUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
  borrower: {
    id: string;
    sourceLeadId?: string;
    borrowerName: string;
    phone: string;
    loanAmount: number;
    loanPurpose: string;
    dateOfBirth?: string;
    gender?: string;
    employmentType?: string;
    income?: number;
    creditScore?: number;
    city?: string;
    state?: string;
    pincode?: string;
    createdAt: string;
  };
};

type LeadsResponse = {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const statuses = [
  "all",
  "new",
  "contacted",
  "follow_up",
  "approved",
  "rejected",
  "disbursed",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function LenderLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // --------------------------------------------------
  // FILTER STATE
  // --------------------------------------------------

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [followUpDue, setFollowUpDue] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // --------------------------------------------------
  // UI STATE
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");

  // --------------------------------------------------
  // BUILD FILTER PARAMETERS
  // --------------------------------------------------

  function buildFilterParams(includePagination = true) {
    const params = new URLSearchParams();

    if (includePagination) {
      params.set("page", String(pagination.page));
      params.set("limit", "20");
    }

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (status !== "all") {
      params.set("status", status);
    }

    if (followUpDue) {
      params.set("followUpDue", "true");
    }

    if (fromDate) {
      params.set("fromDate", fromDate);
    }

    if (toDate) {
      params.set("toDate", toDate);
    }

    if (minAmount.trim()) {
      params.set("minAmount", minAmount.trim());
    }

    if (maxAmount.trim()) {
      params.set("maxAmount", maxAmount.trim());
    }

    return params;
  }

  // --------------------------------------------------
  // FETCH LEADS
  // --------------------------------------------------

  async function fetchLeads(page = 1) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "20");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "all") {
        params.set("status", status);
      }

      if (followUpDue) {
        params.set("followUpDue", "true");
      }

      if (fromDate) {
        params.set("fromDate", fromDate);
      }

      if (toDate) {
        params.set("toDate", toDate);
      }

      if (minAmount.trim()) {
        params.set("minAmount", minAmount.trim());
      }

      if (maxAmount.trim()) {
        params.set("maxAmount", maxAmount.trim());
      }

      const response = await fetch(
        `/api/leads?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        throw new Error("Failed to load leads");
      }

      const data: LeadsResponse = await response.json();

      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load leads. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    fetchLeads(1);

    // We intentionally load the initial queue once.
    // Filter changes are handled explicitly through
    // the Search button / checkbox / date / amount filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // SEARCH / APPLY FILTERS
  // --------------------------------------------------

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    fetchLeads(1);
  }

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  function handleClearFilters() {
    setSearch("");
    setStatus("all");
    setFollowUpDue(false);
    setFromDate("");
    setToDate("");
    setMinAmount("");
    setMaxAmount("");

    // Fetch directly with empty filters.
    setTimeout(() => {
      fetchLeads(1);
    }, 0);
  }

  // --------------------------------------------------
  // EXPORT
  // --------------------------------------------------

  async function handleExport() {
    try {
      setExportLoading(true);
      setExportError("");

      const params = buildFilterParams(false);

      const response = await fetch(
        `/api/leads/export?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error || "Failed to export leads"
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "leads.csv";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);

      setExportError(
        err instanceof Error
          ? err.message
          : "Unable to export leads. Please try again."
      );
    } finally {
      setExportLoading(false);
    }
  }

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  function handlePrevious() {
    if (pagination.page <= 1) {
      return;
    }

    fetchLeads(pagination.page - 1);
  }

  function handleNext() {
    if (pagination.page >= pagination.totalPages) {
      return;
    }

    fetchLeads(pagination.page + 1);
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/lender"
            className="text-sm font-medium text-rose-500 hover:text-rose-600"
          >
            ← Dashboard
          </Link>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-rose-500">
                Lender Workspace
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Lead Queue
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage leads available in your queue.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {pagination.total} total leads
            </div>
          </div>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur sm:p-5">

          <form
            onSubmit={handleSearch}
            className="space-y-5"
          >

            {/* Search + Status */}
            <div className="grid gap-4 lg:grid-cols-[1fr_200px]">

              {/* Search */}
              <div>
                <label
                  htmlFor="search"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Search
                </label>

                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Borrower name or phone"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                >
                  {statuses.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item === "all"
                        ? "All statuses"
                        : formatStatus(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date filters */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Application date
              </p>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* From Date */}
                <div>
                  <label
                    htmlFor="fromDate"
                    className="mb-2 block text-xs font-medium text-slate-500"
                  >
                    From date
                  </label>

                  <input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(event) =>
                      setFromDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label
                    htmlFor="toDate"
                    className="mb-2 block text-xs font-medium text-slate-500"
                  >
                    To date
                  </label>

                  <input
                    id="toDate"
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(event) =>
                      setToDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>
            </div>

            {/* Amount filters */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Loan amount
              </p>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Minimum amount */}
                <div>
                  <label
                    htmlFor="minAmount"
                    className="mb-2 block text-xs font-medium text-slate-500"
                  >
                    Minimum amount
                  </label>

                  <input
                    id="minAmount"
                    type="number"
                    min="0"
                    value={minAmount}
                    onChange={(event) =>
                      setMinAmount(event.target.value)
                    }
                    placeholder="e.g. 50000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                {/* Maximum amount */}
                <div>
                  <label
                    htmlFor="maxAmount"
                    className="mb-2 block text-xs font-medium text-slate-500"
                  >
                    Maximum amount
                  </label>

                  <input
                    id="maxAmount"
                    type="number"
                    min="0"
                    value={maxAmount}
                    onChange={(event) =>
                      setMaxAmount(event.target.value)
                    }
                    placeholder="e.g. 500000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>
            </div>

            {/* Follow-up */}
            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={followUpDue}
                  onChange={(event) =>
                    setFollowUpDue(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                />

                Show only follow-ups due
              </label>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-5 sm:flex-row">

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Loading..."
                  : "Apply Filters"}
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Filters
              </button>
            </div>
          </form>

          {/* Export */}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/60 pt-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Export leads
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Export leads using your current search and filters.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportLoading
                ? "Exporting..."
                : "Export CSV"}
            </button>
          </div>
        </section>

        {/* Export Error */}
        {exportError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {exportError}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}

            <button
              type="button"
              onClick={() => fetchLeads(pagination.page)}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm"
              >
                <div className="h-5 w-40 rounded bg-slate-200" />

                <div className="mt-3 h-4 w-28 rounded bg-slate-200" />

                <div className="mt-5 h-4 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          leads.length === 0 && (
            <div className="rounded-2xl border border-white/60 bg-white/70 p-10 text-center shadow-sm backdrop-blur">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-xl">
                📋
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                No leads found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Lead cards */}
        {!loading && leads.length > 0 && (
          <section className="grid gap-4">
            {leads.map((lead) => (
              <Link
                key={lead._id}
                href={`/lender/leads/${lead.leadId}`}
                className="block rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4">

                  {/* Main information */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lead.borrower.borrowerName}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {lead.borrower.phone}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        {lead.borrower.loanPurpose}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(
                          lead.borrower.loanAmount
                        )}
                      </p>

                      <span className="mt-2 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold capitalize text-rose-600">
                        {formatStatus(lead.status)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 border-t border-slate-200/60 pt-3">

                    {lead.borrower.creditScore !== undefined && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        Credit {lead.borrower.creditScore}
                      </span>
                    )}

                    {lead.borrower.city && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {lead.borrower.city}
                      </span>
                    )}

                    {lead.assignmentStatus && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">
                        {formatStatus(
                          lead.assignmentStatus
                        )}
                      </span>
                    )}

                    {lead.followUpDate && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          new Date(lead.followUpDate) <=
                          new Date()
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        Follow-up{" "}
                        {formatDate(lead.followUpDate)}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs text-slate-500">

                    <span>
                      Applied {formatDate(lead.createdAt)}
                    </span>

                    <span className="font-semibold text-rose-500">
                      View details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* Pagination */}
        {!loading &&
          pagination.totalPages > 0 && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">

              <button
                type="button"
                onClick={handlePrevious}
                disabled={pagination.page <= 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <p className="text-sm text-slate-500">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

              <button
                type="button"
                onClick={handleNext}
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
      </div>
    </main>
  );
}