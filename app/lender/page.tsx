import Link from "next/link";

import { cookies } from "next/headers";

import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
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

async function getLeads(): Promise<LeadsResponse> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/leads?limit=10`, {
    headers: {
      Cookie: sessionCookie
        ? `session=${sessionCookie.value}`
        : "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }

  return response.json();
}

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

export default async function LenderDashboardPage() {
  // 1. Check whether the user is logged in
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // 2. Only lender users can access this dashboard
  if (
    session.role !== "lender_admin" &&
    session.role !== "lender_agent"
  ) {
    redirect("/");
  }

  // 3. Fetch leads after authentication/authorization
  const data = await getLeads();

  const leads = data.leads;

  const totalLeads = data.pagination.total;

  const activeLeads = leads.filter(
    (lead) =>
      !["rejected", "disbursed"].includes(lead.status)
  ).length;

  const followUpsDue = leads.filter((lead) => {
    if (!lead.followUpDate) return false;

    return new Date(lead.followUpDate) <= new Date();
  }).length;

  const approved = leads.filter(
    (lead) => lead.status === "approved"
  ).length;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-rose-500">
              Lender Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your loan leads and follow-ups.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/lender/agents"
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white/70 px-5 py-3 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              Manage Agents
            </Link>

            <Link
              href="/lender/leads"
              className="inline-flex items-center justify-center rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
            >
              View Lead Queue
            </Link>
             <LogoutButton />
          </div>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-500">
              Total Leads
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalLeads}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {activeLeads}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-500">
              Follow-ups Due
            </p>

            <p className="mt-2 text-3xl font-bold text-rose-500">
              {followUpsDue}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-500">
              Approved
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {approved}
            </p>
          </div>
        </section>

        {/* Recent leads */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Leads
              </h2>

              <p className="text-sm text-slate-500">
                Latest leads available in your queue.
              </p>
            </div>

            <Link
              href="/lender/leads"
              className="text-sm font-semibold text-rose-500 hover:text-rose-600"
            >
              View all
            </Link>
          </div>

          {leads.length === 0 ? (
            <div className="rounded-2xl border border-white/60 bg-white/70 p-8 text-center shadow-sm backdrop-blur">
              <h3 className="font-semibold text-slate-900">
                No leads yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                New leads will appear here when they are assigned.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {leads.slice(0, 5).map((lead) => (
                <Link
                  key={lead._id}
                  href={`/lender/leads/${lead.leadId}`}
                  className="block rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {lead.borrower.borrowerName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {lead.borrower.phone}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        {lead.borrower.loanPurpose}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="font-bold text-slate-900">
                        {formatCurrency(
                          lead.borrower.loanAmount
                        )}
                      </p>

                      <span className="mt-2 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold capitalize text-rose-600">
                        {lead.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200/60 pt-3 text-xs text-slate-500">
                    {lead.borrower.city && (
                      <span>
                        {lead.borrower.city}
                        {lead.borrower.state
                          ? `, ${lead.borrower.state}`
                          : ""}
                      </span>
                    )}

                    <span>
                      Applied{" "}
                      {formatDate(lead.borrower.createdAt)}
                    </span>

                    {lead.borrower.creditScore && (
                      <span>
                        Credit score:{" "}
                        {lead.borrower.creditScore}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

