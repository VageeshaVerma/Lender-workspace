import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import LogoutButton from "@/components/LogoutButton";

type Lead = {
leadId: string;
lenderId: string;
status: string;
followUpDate?: string | null;
borrower: {
borrowerName: string;
phone: string;
loanAmount: number;
loanPurpose: string;
creditScore?: number;
city?: string;
};
createdAt: string;
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

function formatCurrency(amount: number) {
return new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 0,
}).format(amount);
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

async function getLeads(): Promise<LeadsResponse | null> {
const cookieStore = await cookies();

const baseUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

const response = await fetch(
`${baseUrl}/api/leads?limit=20`,
{
headers: {
Cookie: cookieStore.toString(),
},
cache: "no-store",
}
);

if (!response.ok) {
return null;
}

return response.json();
}

export default async function AdminDashboard() {
const session = await getSession();

if (!session) {
redirect("/login");
}

if (session.role !== "ops_admin") {
redirect("/lender");
}

const data = await getLeads();

const leads = data?.leads ?? [];
const totalLeads = data?.pagination.total ?? 0;

const approvedCount = leads.filter(
(lead) => lead.status === "approved"
).length;

const rejectedCount = leads.filter(
(lead) => lead.status === "rejected"
).length;

const disbursedCount = leads.filter(
(lead) => lead.status === "disbursed"
).length;

const followUpsDue = leads.filter((lead) => {
if (!lead.followUpDate) return false;


return new Date(lead.followUpDate) <= new Date();


}).length;

return ( <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"> <div className="mx-auto max-w-7xl space-y-6">

    {/* Header */}
    <section className="lender-card overflow-hidden">
      <div className="p-5 sm:p-7">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-base font-bold text-[var(--coral-dark)]">
                LW
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                  Lender Workspace
                </p>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Operations &amp; portfolio management
                </p>
              </div>
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Operations Dashboard
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Monitor leads, lending activity, follow-ups, and
              operational performance across the workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--soft-rose)] px-3.5 py-2 text-xs font-semibold text-[var(--coral-dark)]">
              Ops Admin
            </span>

            <LogoutButton />
          </div>

        </div>

        {/* Summary metrics */}
        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-black/5 pt-6 sm:grid-cols-3 lg:grid-cols-5">

          <div className="rounded-xl bg-[var(--background)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Total Leads
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {totalLeads}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Across workspace
            </p>
          </div>

          <div className="rounded-xl bg-[var(--background)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Approved
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--success)]">
              {approvedCount}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Loan decisions
            </p>
          </div>

          <div className="rounded-xl bg-[var(--background)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Disbursed
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--info)]">
              {disbursedCount}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Completed loans
            </p>
          </div>

          <div className="rounded-xl bg-[var(--background)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Follow-ups
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--warning)]">
              {followUpsDue}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Currently due
            </p>
          </div>

          <div className="col-span-2 rounded-xl bg-[var(--background)] p-4 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Rejected
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--danger)]">
              {rejectedCount}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Loan decisions
            </p>
          </div>

        </div>
      </div>
    </section>

    {/* Quick Actions */}
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
          Workspace
        </p>

        <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Access the main operational areas of your workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Leads */}
        <Link
          href="/admin/leads"
          className="lender-card group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
        >
          <div className="p-5 sm:p-6">

            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--soft-rose)] text-[var(--coral-dark)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 3v5h4M8 12h8M8 16h6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-lg text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--coral-dark)]">
                →
              </span>
            </div>

            <h3 className="mt-5 font-bold text-[var(--text-primary)]">
              Manage Leads
            </h3>

            <p className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">
              View, filter, and manage leads across all lender organizations.
            </p>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--coral-dark)]">
              Open lead management
            </p>

          </div>

          <div className="h-1 w-full bg-[var(--soft-rose)] opacity-0 transition group-hover:opacity-100" />
        </Link>

        {/* Lenders */}
        <Link
          href="/admin/lenders"
          className="lender-card group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
        >
          <div className="p-5 sm:p-6">

            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--soft-rose)] text-[var(--coral-dark)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="text-lg text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--coral-dark)]">
                →
              </span>
            </div>

            <h3 className="mt-5 font-bold text-[var(--text-primary)]">
              Manage Lenders
            </h3>

            <p className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">
              View lender organizations, configurations, and workspace activity.
            </p>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--coral-dark)]">
              Open lender management
            </p>

          </div>

          <div className="h-1 w-full bg-[var(--soft-rose)] opacity-0 transition group-hover:opacity-100" />
        </Link>

        {/* Imports */}
        <Link
          href="/admin/imports"
          className="lender-card group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
        >
          <div className="p-5 sm:p-6">

            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--soft-rose)] text-[var(--coral-dark)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M12 16V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="text-lg text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--coral-dark)]">
                →
              </span>
            </div>

            <h3 className="mt-5 font-bold text-[var(--text-primary)]">
              Data Imports
            </h3>

            <p className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">
              Import lender organizations and borrower leads using CSV files.
            </p>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--coral-dark)]">
              Open import center
            </p>

          </div>

          <div className="h-1 w-full bg-[var(--soft-rose)] opacity-0 transition group-hover:opacity-100" />
        </Link>

      </div>
    </section>

    {/* Recent Leads */}
    <section className="lender-card overflow-hidden">

      <div className="flex flex-col gap-3 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
            Lead Activity
          </p>

          <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
            Recent Leads
          </h2>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Latest borrower applications across the workspace.
          </p>
        </div>

        <Link
          href="/admin/leads"
          className="w-fit text-sm font-semibold text-[var(--coral-dark)] transition hover:text-[var(--coral)]"
        >
          View all leads →
        </Link>

      </div>

      <div className="p-5 sm:p-6">

        {leads.length === 0 ? (

          /* Empty state */
          <div className="rounded-2xl border border-dashed border-black/10 bg-[var(--background)] px-5 py-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-[var(--coral-dark)]">
              —
            </div>

            <p className="mt-4 font-semibold text-[var(--text-primary)]">
              No leads found
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm leading-5 text-[var(--text-muted)]">
              There are currently no borrower leads available in the workspace.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {leads.slice(0, 5).map((lead) => (

              <Link
                key={lead.leadId}
                href={`/admin/leads/${lead.leadId}`}
                className="group block rounded-2xl border border-black/5 bg-[var(--background)] p-4 transition duration-200 hover:border-[var(--blush)] hover:shadow-[var(--shadow-soft)] sm:p-5"
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex min-w-0 items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-rose)] text-sm font-bold text-[var(--coral-dark)]">
                      {lead.borrower.borrowerName
                        ?.charAt(0)
                        .toUpperCase() || "L"}
                    </div>

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-bold text-[var(--text-primary)]">
                          {lead.borrower.borrowerName}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${getStatusClass(
                            lead.status
                          )}`}
                        >
                          {formatStatus(lead.status)}
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

                  <div className="flex items-center justify-between gap-5 lg:justify-end">

                    <div className="lg:text-right">
                      <p className="text-lg font-bold text-[var(--text-primary)]">
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

                <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">

                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    Lender: {lead.lenderId}
                  </span>

                  {lead.borrower.creditScore !== undefined && (
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                      Credit {lead.borrower.creditScore}
                    </span>
                  )}

                  {lead.borrower.city && (
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                      {lead.borrower.city}
                    </span>
                  )}

                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-[var(--text-muted)]">
                    {new Date(
                      lead.createdAt
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                </div>

              </Link>

            ))}

          </div>

        )}

      </div>
    </section>

  </div>
</main>


);
}
