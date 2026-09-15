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

async function getLeads(): Promise<LeadsResponse | null> {
  const cookieStore = await cookies();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
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

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-rose-500">
            Lender Workspace
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Operations Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor leads and lending activity across the workspace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
                Ops Admin
              </div>

              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

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
              Approved
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-500">
              Disbursed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {disbursedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-500">
              Follow-ups Due
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {followUpsDue}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-slate-500">
              Rejected
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {rejectedCount}
            </p>
          </div>

        </section>

        {/* Quick actions */}
<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Link
    href="/admin/leads"
    className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-xl">
      📋
    </div>

    <h2 className="mt-4 font-semibold text-slate-900">
      Manage Leads
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      View and manage leads across lenders.
    </p>

    <p className="mt-4 text-sm font-semibold text-rose-500">
      Open leads →
    </p>
  </Link>

  <Link
    href="/admin/lenders"
    className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-xl">
      🏦
    </div>

    <h2 className="mt-4 font-semibold text-slate-900">
      Manage Lenders
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      View lender organizations and their activity.
    </p>

    <p className="mt-4 text-sm font-semibold text-rose-500">
      Open lenders →
    </p>
  </Link>

  {/* Data Imports */}
  <Link
    href="/admin/imports"
    className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-xl">
      📥
    </div>

    <h2 className="mt-4 font-semibold text-slate-900">
      Data Imports
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Import lenders and borrower leads using CSV files.
    </p>

    <p className="mt-4 text-sm font-semibold text-rose-500">
      Open imports →
    </p>
  </Link>
</section>

        {/* Recent leads */}
        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Leads
              </h2>

              <p className="text-sm text-slate-500">
                Latest leads across your workspace.
              </p>
            </div>

            <Link
              href="/admin/leads"
              className="text-sm font-semibold text-rose-500 hover:text-rose-600"
            >
              View all →
            </Link>
          </div>

          {leads.length === 0 ? (
            <div className="rounded-2xl border border-white/60 bg-white/70 p-8 text-center shadow-sm">
              <p className="font-medium text-slate-900">
                No leads found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                There are currently no leads available.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {leads.slice(0, 5).map((lead) => (
                <Link
                  key={lead.leadId}
                  href={`/admin/leads/${lead.leadId}`}
                  className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                      <h3 className="font-bold text-slate-900">
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
                        {formatStatus(lead.status)}
                      </span>
                    </div>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/60 pt-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      Lender: {lead.lenderId}
                    </span>

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
