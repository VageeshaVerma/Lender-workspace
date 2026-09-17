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
borrowerName: string;
phone: string;
loanAmount: number;
loanPurpose: string;
creditScore?: number;
city?: string;
state?: string;
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

function getStatusClass(status: string) {
switch (status) {
case "approved":
return "status-success";


case "rejected":
  return "status-danger";

case "disbursed":
  return "status-info";

case "follow_up":
  return "status-warning";

default:
  return "bg-[var(--soft-rose)] text-[var(--coral-dark)]";


}
}

function getEligibilityClass(status?: string) {
if (!status) {
return "bg-black/5 text-[var(--text-secondary)]";
}

if (status.toLowerCase().includes("eligible")) {
return "status-success";
}

return "status-warning";
}

export default function AdminLeadsPage() {
const [leads, setLeads] = useState<Lead[]>([]);

const [pagination, setPagination] = useState({
page: 1,
limit: 20,
total: 0,
totalPages: 0,
});

const [search, setSearch] = useState("");
const [status, setStatus] = useState("all");
const [lenderId, setLenderId] = useState("");
const [followUpDue, setFollowUpDue] = useState(false);

const [loading, setLoading] = useState(true);
const [exportLoading, setExportLoading] = useState(false);

const [error, setError] = useState("");
const [exportError, setExportError] = useState("");

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

  if (lenderId.trim()) {
    params.set("lenderId", lenderId.trim());
  }

  if (followUpDue) {
    params.set("followUpDue", "true");
  }

  const response = await fetch(
    `/api/leads?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
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

async function handleExport() {
try {
setExportLoading(true);
setExportError("");


  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (status !== "all") {
    params.set("status", status);
  }

  if (lenderId.trim()) {
    params.set("lenderId", lenderId.trim());
  }

  if (followUpDue) {
    params.set("followUpDue", "true");
  }

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
  link.download = "admin-leads.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
} catch (err) {
  console.error("Export error:", err);

  setExportError(
    err instanceof Error
      ? err.message
      : "Unable to export leads."
  );
} finally {
  setExportLoading(false);
}


}

useEffect(() => {
fetchLeads(1);
}, [status, lenderId, followUpDue]);

function handleSearch(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();
fetchLeads(1);
}

function handlePrevious() {
if (pagination.page <= 1) return;


fetchLeads(pagination.page - 1);


}

function handleNext() {
if (
pagination.page >= pagination.totalPages
) {
return;
}


fetchLeads(pagination.page + 1);


}

return ( <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"> <div className="mx-auto max-w-7xl space-y-6">


    {/* Header */}
    <section className="lender-card overflow-hidden">
      <div className="p-5 sm:p-7">

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--coral-dark)]"
        >
          <span className="text-base">←</span>
          Back to Dashboard
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div className="flex min-w-0 items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-lg font-bold text-[var(--coral-dark)]">
              L
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                Operations
              </p>

              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Lead Management
              </h1>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Monitor and manage borrower leads across all lenders.
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <div className="rounded-full bg-[var(--background)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)]">
              {pagination.total} total leads
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportLoading
                ? "Exporting..."
                : "Export CSV"}
            </button>

          </div>

        </div>
      </div>
    </section>

    {/* Filters */}
    <section className="lender-card overflow-hidden">

      <div className="border-b border-black/5 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
              Lead Queue
            </p>

            <h2 className="mt-1 font-bold text-[var(--text-primary)]">
              Search &amp; Filters
            </h2>
          </div>

          <span className="hidden rounded-full bg-[var(--soft-rose)] px-3 py-1.5 text-[10px] font-semibold text-[var(--coral-dark)] sm:inline-flex">
            {status === "all"
              ? "All statuses"
              : formatStatus(status)}
          </span>

        </div>
      </div>

      <div className="p-5 sm:p-6">

        <form
          onSubmit={handleSearch}
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_minmax(180px,220px)_auto]"
        >

          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]"
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
              className="input-glass w-full"
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="input-glass w-full"
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

          {/* Lender */}
          <div>
            <label
              htmlFor="lenderId"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]"
            >
              Lender ID
            </label>

            <input
              id="lenderId"
              type="text"
              value={lenderId}
              onChange={(event) =>
                setLenderId(event.target.value)
              }
              placeholder="e.g. ram-fincorp"
              className="input-glass w-full"
            />
          </div>

          {/* Search */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full lg:w-auto"
            >
              {loading
                ? "Loading..."
                : "Search"}
            </button>
          </div>

        </form>

        {/* Secondary controls */}
        <div className="mt-5 flex flex-col gap-4 border-t border-black/5 pt-5 sm:flex-row sm:items-center sm:justify-between">

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text-secondary)]">

            <input
              type="checkbox"
              checked={followUpDue}
              onChange={(event) =>
                setFollowUpDue(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-black/10 accent-[var(--coral)]"
            />

            <span>
              Show only follow-ups due
            </span>

          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="btn-coral w-full sm:w-auto"
          >
            {exportLoading
              ? "Exporting..."
              : "Export Filtered CSV"}
          </button>

        </div>

      </div>
    </section>

    {/* Export error */}
    {exportError && (
      <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4">
        <p className="text-sm font-medium text-[var(--danger)]">
          {exportError}
        </p>
      </div>
    )}

    {/* General error */}
    {error && (
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm font-medium text-[var(--danger)]">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            fetchLeads(pagination.page)
          }
          className="w-fit text-sm font-semibold text-[var(--danger)] underline"
        >
          Retry
        </button>

      </div>
    )}

    {/* Queue heading */}
    {!loading && leads.length > 0 && (
      <div className="flex items-end justify-between gap-4">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
            Current Results
          </p>

          <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
            Lead Queue
          </h2>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Page {pagination.page} of{" "}
          {pagination.totalPages}
        </p>

      </div>
    )}

    {/* Loading */}
    {loading && (
      <div className="space-y-3">

        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="lender-card animate-pulse p-5 sm:p-6"
          >
            <div className="flex gap-4">

              <div className="h-12 w-12 shrink-0 rounded-2xl bg-black/5" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 rounded bg-black/5" />
                <div className="mt-3 h-3 w-28 rounded bg-black/5" />
                <div className="mt-4 h-3 w-56 rounded bg-black/5" />

                <div className="mt-5 flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-black/5" />
                  <div className="h-6 w-24 rounded-full bg-black/5" />
                </div>
              </div>

            </div>
          </div>
        ))}

      </div>
    )}

    {/* Empty */}
    {!loading && !error && leads.length === 0 && (
      <section className="lender-card p-8 text-center sm:p-12">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-[var(--coral-dark)]">
          —
        </div>

        <h2 className="mt-5 font-bold text-[var(--text-primary)]">
          No leads found
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
          No leads match your current search and filter criteria. Try changing your filters and search again.
        </p>

      </section>
    )}

    {/* Lead Cards */}
    {!loading && leads.length > 0 && (
      <section className="space-y-3">

        {leads.map((lead) => {

          const followUpIsDue =
            lead.followUpDate
              ? new Date(
                  lead.followUpDate
                ) <= new Date()
              : false;

          return (
            <Link
              key={lead._id}
              href={`/admin/leads/${lead.leadId}`}
              className="lender-card group block overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >

              <div className="p-5 sm:p-6">

                {/* Top */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  <div className="flex min-w-0 gap-4">

                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-base font-bold text-[var(--coral-dark)]">
                      {lead.borrower.borrowerName
                        ?.charAt(0)
                        .toUpperCase() || "L"}
                    </div>

                    {/* Borrower */}
                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="truncate text-base font-bold text-[var(--text-primary)] sm:text-lg">
                          {lead.borrower.borrowerName}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${getStatusClass(
                            lead.status
                          )}`}
                        >
                          {formatStatus(
                            lead.status
                          )}
                        </span>

                      </div>

                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {lead.borrower.phone}
                      </p>

                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        {lead.borrower.loanPurpose}
                      </p>

                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between gap-5 lg:block lg:text-right">

                    <div>
                      <p className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                        {formatCurrency(
                          lead.borrower.loanAmount
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Requested amount
                      </p>
                    </div>

                    <span className="text-lg text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--coral-dark)]">
                      →
                    </span>

                  </div>

                </div>

                {/* Metadata */}
                <div className="mt-5 flex flex-wrap gap-2 border-t border-black/5 pt-4">

                  <span className="rounded-full bg-[var(--soft-rose)] px-3 py-1.5 text-[10px] font-semibold text-[var(--coral-dark)]">
                    {lead.lenderId}
                  </span>

                  {lead.borrower.creditScore !== undefined && (
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                      Credit {lead.borrower.creditScore}
                    </span>
                  )}

                  {lead.borrower.city && (
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                      {lead.borrower.city}
                      {lead.borrower.state
                        ? `, ${lead.borrower.state}`
                        : ""}
                    </span>
                  )}

                  {lead.assignmentStatus && (
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium capitalize text-[var(--text-secondary)]">
                      {formatStatus(
                        lead.assignmentStatus
                      )}
                    </span>
                  )}

                  {lead.eligibilityStatus && (
                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-semibold capitalize ${getEligibilityClass(
                        lead.eligibilityStatus
                      )}`}
                    >
                      {formatStatus(
                        lead.eligibilityStatus
                      )}
                    </span>
                  )}

                  {lead.followUpDate && (
                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                        followUpIsDue
                          ? "status-danger"
                          : "status-warning"
                      }`}
                    >
                      Follow-up{" "}
                      {formatDate(
                        lead.followUpDate
                      )}
                    </span>
                  )}

                </div>

                {/* Footer */}
                <div className="mt-4 flex flex-col gap-2 border-t border-black/5 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--text-muted)]">
                    <span>
                      Applied{" "}
                      {formatDate(
                        lead.createdAt
                      )}
                    </span>

                    <span className="hidden sm:inline">
                      Lead ID: {lead.leadId}
                    </span>
                  </div>

                  <span className="font-semibold text-[var(--coral-dark)]">
                    View details →
                  </span>

                </div>

              </div>

              <div className="h-1 w-full bg-[var(--soft-rose)] opacity-0 transition group-hover:opacity-100" />

            </Link>
          );
        })}

      </section>
    )}

    {/* Pagination */}
    {!loading && pagination.totalPages > 0 && (
      <div className="lender-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Lead Queue
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Showing page {pagination.page} of{" "}
            {pagination.totalPages}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">

          <button
            type="button"
            onClick={handlePrevious}
            disabled={pagination.page <= 1}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="hidden rounded-xl bg-[var(--background)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] sm:block">
            {pagination.page} /{" "}
            {pagination.totalPages}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={
              pagination.page >=
              pagination.totalPages
            }
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>

        </div>

      </div>
    )}

  </div>
</main>


);
}
