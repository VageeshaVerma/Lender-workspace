import Link from "next/link";
import { getLeadsForUser } from "@/lib/db/leads";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

type Lead = {
  _id: string;
  leadId: string;
  lenderId: string;
  eligibilityStatus?: string;
  assignmentStatus?: string;
  assignedAgentId?: string | null;
  status: string;
  followUpDate?: string | null;

  borrower: {
    borrowerName: string;
    phone: string;
    loanAmount: number;
    loanPurpose: string;
    creditScore?: number;
    city?: string;
    state?: string;
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

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "status-success";

    case "rejected":
      return "status-danger";

    case "disbursed":
      return "status-info";

    case "pending":
    case "follow_up":
    case "followup":
      return "status-warning";

    default:
      return "status-info";
  }
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatIcon({
  type,
}: {
  type: "leads" | "active" | "followup" | "approved";
}) {
  if (type === "leads") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 5h16" />
        <path d="M4 12h16" />
        <path d="M4 19h10" />
        <circle cx="18" cy="19" r="2" />
      </svg>
    );
  }

  if (type === "active") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (type === "followup") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M3 10h18" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default async function LenderDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (
  session.role !== "lender_admin" &&
  session.role !== "lender_agent" &&
  session.role !== "ops_admin" &&
  session.role !== "super_admin"
) {
  redirect("/");
}

  const data = await getLeadsForUser(
  session,
  {
    limit: 10,
  }
);

const leads = data.leads;

  const totalLeads = data.pagination.total;

  const activeLeads = leads.filter(
    (lead) =>
      !["rejected", "disbursed"].includes(
        lead.status
      )
  ).length;

  const followUpsDue = leads.filter((lead) => {
    if (!lead.followUpDate) return false;

    return (
      new Date(lead.followUpDate) <= new Date()
    );
  }).length;

  const approved = leads.filter(
    (lead) => lead.status === "approved"
  ).length;

  const recentLeads = leads.slice(0, 5);

  const isAdmin =
    session.role === "lender_admin";

  return (
    <main className="space-y-8">
      {/* ------------------------------------------------ */}
      {/* Page header */}
      {/* ------------------------------------------------ */}

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />

            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {isAdmin
                ? "Lender Administration"
                : "Agent Workspace"}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Good to see you.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Monitor your lending pipeline, review leads,
            and stay on top of follow-ups from one place.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/lender/leads"
            className="btn-primary"
          >
            View Lead Queue
            <ArrowIcon />
          </Link>

          {isAdmin && (
            <Link
              href="/lender/agents"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-black/[0.08] bg-white/70 px-4 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-white hover:shadow-md"
            >
              <PlusIcon />
              Manage Agents
            </Link>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* KPI cards */}
      {/* ------------------------------------------------ */}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="lender-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Total Leads
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {totalLeads}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--soft-rose)] text-[var(--coral-dark)]">
              <StatIcon type="leads" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            Leads available in your workspace
          </p>
        </div>

        <div className="lender-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Active
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {activeLeads}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[var(--info)]">
              <StatIcon type="active" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            Currently progressing
          </p>
        </div>

        <div className="lender-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Follow-ups Due
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--warning)] sm:text-3xl">
                {followUpsDue}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-[var(--warning)]">
              <StatIcon type="followup" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            Require attention
          </p>
        </div>

        <div className="lender-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Approved
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--success)] sm:text-3xl">
                {approved}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-[var(--success)]">
              <StatIcon type="approved" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            Approved from current results
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* Main content */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Recent leads */}
        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Recent Leads
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Latest leads available in your workspace.
              </p>
            </div>

            <Link
              href="/lender/leads"
              className="shrink-0 text-xs font-semibold text-[var(--coral-dark)] transition hover:text-[var(--coral)]"
            >
              View all
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="lender-card flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--soft-rose)] text-[var(--coral-dark)]">
                <StatIcon type="leads" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                No leads yet
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-muted)]">
                New leads will appear here when they
                become available in your workspace.
              </p>

              <Link
                href="/lender/leads"
                className="mt-5 text-xs font-semibold text-[var(--coral-dark)]"
              >
                Open lead queue →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <Link
                  key={lead._id}
                  href={`/lender/leads/${lead.leadId}`}
                  className="lender-card group block p-4 sm:p-5"
                >
                  <div className="flex gap-4">
                    {/* Avatar */}

                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--soft-rose)] text-xs font-bold text-[var(--coral-dark)] sm:flex">
                      {getInitials(
                        lead.borrower.borrowerName
                      )}
                    </div>

                    {/* Main lead information */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--coral-dark)]">
                              {lead.borrower.borrowerName}
                            </h3>

                            <span
                              className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:inline-flex ${getStatusClass(
                                lead.status
                              )}`}
                            >
                              {formatStatus(
                                lead.status
                              )}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {lead.borrower.phone}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {formatCurrency(
                              lead.borrower.loanAmount
                            )}
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:hidden ${getStatusClass(
                              lead.status
                            )}`}
                          >
                            {formatStatus(
                              lead.status
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Lead metadata */}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[var(--text-muted)]">
                        <span>
                          {lead.borrower.loanPurpose}
                        </span>

                        {lead.borrower.city && (
                          <>
                            <span className="hidden h-1 w-1 rounded-full bg-black/20 sm:block" />

                            <span>
                              {lead.borrower.city}
                              {lead.borrower.state
                                ? `, ${lead.borrower.state}`
                                : ""}
                            </span>
                          </>
                        )}

                        {lead.borrower.creditScore && (
                          <>
                            <span className="hidden h-1 w-1 rounded-full bg-black/20 sm:block" />

                            <span>
                              Credit score{" "}
                              <strong className="font-semibold text-[var(--text-secondary)]">
                                {lead.borrower.creditScore}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Bottom row */}

                      <div className="mt-3 flex items-center justify-between border-t border-black/[0.055] pt-3">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Applied{" "}
                          {formatDate(
                            lead.borrower.createdAt
                          )}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] transition group-hover:text-[var(--coral-dark)]">
                          View details
                          <ArrowIcon />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right side panel */}

        <aside className="space-y-4">
          {/* Quick actions */}

          <div className="lender-card p-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Common workspace operations.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <Link
                href="/lender/leads"
                className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-white/60 px-3 py-3 transition hover:border-[var(--coral)]/20 hover:bg-[var(--soft-rose)]/40"
              >
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Open lead queue
                  </p>

                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    Review and manage leads
                  </p>
                </div>

                <ArrowIcon />
              </Link>

              {isAdmin && (
                <Link
                  href="/lender/agents"
                  className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-white/60 px-3 py-3 transition hover:border-[var(--coral)]/20 hover:bg-[var(--soft-rose)]/40"
                >
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Manage agents
                    </p>

                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      Assign and manage your team
                    </p>
                  </div>

                  <ArrowIcon />
                </Link>
              )}

              <Link
                href="/lender/leads?followUpDue=true"
                className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-white/60 px-3 py-3 transition hover:border-[var(--coral)]/20 hover:bg-[var(--soft-rose)]/40"
              >
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Review follow-ups
                  </p>

                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    {followUpsDue} currently due
                  </p>
                </div>

                <ArrowIcon />
              </Link>
            </div>
          </div>

          {/* Workspace summary */}

          <div className="rounded-2xl bg-[var(--text-primary)] p-5 text-white shadow-[var(--shadow-card)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Workspace
            </p>

            <h3 className="mt-2 text-sm font-semibold">
              Lending operations
            </h3>

            <p className="mt-2 text-xs leading-5 text-white/60">
              Your workspace keeps lead handling,
              follow-ups and loan decisions organized
              in one operational flow.
            </p>

            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
              <div className="h-2 w-2 rounded-full bg-[var(--success)]" />

              <span className="text-[10px] text-white/60">
                Workspace active
              </span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
