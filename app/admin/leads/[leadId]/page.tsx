import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";

import { getSession } from "@/lib/auth/session";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import AdminLeadActions from "@/components/AdminLeadActions";

type LeadDetailPageProps = {
  params: Promise<{
    leadId: string;
  }>;
};

async function getLeadDetail(
  leadId: string,
  cookie: string
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/leads/${leadId}`,
    {
      headers: {
        Cookie: cookie,
      },
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load lead");
  }

  return response.json();
}

export default async function AdminLeadDetailPage({
  params,
}: LeadDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ops_admin") {
    redirect("/lender");
  }

  const { leadId } = await params;

  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(
      ({ name, value }) => `${name}=${value}`
    )
    .join("; ");

  const data = await getLeadDetail(
    leadId,
    cookieHeader
  );

  if (!data) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <GlassCard>
            <div className="py-10 text-center">
              <h1 className="text-xl font-semibold">
                Lead not found
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                This lead does not exist or is not
                accessible.
              </p>

              <Link
                href="/admin/leads"
                className="mt-6 inline-block text-sm font-medium text-rose-600"
              >
                ← Back to leads
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  const lead = data.lead;
  const borrower = lead.borrower;

  const status = lead.status ?? "new";

  const offers = lead.offers ?? [];
  const history = lead.history ?? [];

  return (
    <main className="min-h-screen px-4 py-6 pb-24 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/leads"
              className="text-sm font-medium text-rose-600"
            >
              ← Back to leads
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">
                Lead Details
              </h1>

              <Badge>{status}</Badge>
            </div>

            <p className="mt-1 break-all text-xs text-zinc-500">
              Lead ID: {lead.leadId}
            </p>
          </div>
        </div>

        {/* Borrower Information */}
        <GlassCard>
          <h2 className="text-lg font-semibold">
            Borrower Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow
              label="Name"
              value={borrower.borrowerName}
            />

            <InfoRow
              label="Phone"
              value={borrower.phone}
            />

            <InfoRow
              label="Credit Score"
              value={String(
                borrower.creditScore ?? "—"
              )}
            />

            <InfoRow
              label="Date of Birth"
              value={formatDateOnly(
                borrower.dateOfBirth
              )}
            />

            <InfoRow
              label="Gender"
              value={borrower.gender}
            />

            <InfoRow
              label="Marital Status"
              value={
                borrower.maritalStatus ?? "—"
              }
            />
          </div>
        </GlassCard>

        {/* Loan Information */}
        <GlassCard>
          <h2 className="text-lg font-semibold">
            Loan Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow
              label="Loan Amount"
              value={formatCurrency(
                borrower.loanAmount
              )}
            />

            <InfoRow
              label="Loan Purpose"
              value={borrower.loanPurpose}
            />

            <InfoRow
              label="Employment Type"
              value={borrower.employmentType}
            />

            <InfoRow
              label="Annual Income"
              value={formatCurrency(
                borrower.income
              )}
            />

            <InfoRow
              label="Work Experience"
              value={
                borrower.workExperience ?? "—"
              }
            />

            <InfoRow
              label="Eligibility"
              value={
                lead.eligibilityStatus ?? "—"
              }
            />
          </div>
        </GlassCard>

        {/* Address */}
        <GlassCard>
          <h2 className="text-lg font-semibold">
            Address
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <InfoRow
              label="Address Line 1"
              value={borrower.addressLine1}
            />

            <InfoRow
              label="Address Line 2"
              value={borrower.addressLine2}
            />

            <InfoRow
              label="City"
              value={borrower.city}
            />

            <InfoRow
              label="State"
              value={borrower.state}
            />

            <InfoRow
              label="Pincode"
              value={borrower.pincode}
            />
          </div>
        </GlassCard>

        {/* Lender Assignment */}
        <GlassCard>
          <h2 className="text-lg font-semibold">
            Lender Assignment
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoRow
              label="Lender"
              value={lead.lenderId}
            />

            <InfoRow
              label="Status"
              value={lead.status}
            />

            <InfoRow
              label="Assignment"
              value={lead.assignmentStatus}
            />

            <InfoRow
              label="Agent"
              value={
                lead.assignedAgentId ??
                "Unassigned"
              }
            />
          </div>

          {lead.followUpDate && (
            <div className="mt-5 rounded-xl bg-rose-50 p-4">
              <p className="text-xs font-medium text-zinc-500">
                Follow-up
              </p>

              <p className="mt-1 font-semibold">
                {formatDate(lead.followUpDate)}
              </p>
            </div>
          )}
        </GlassCard>

        {/* Admin Actions */}
        <AdminLeadActions
          leadId={lead.leadId}
          status={status}
        />

        {/* Loan Offers */}
        <GlassCard>
          <h2 className="text-lg font-semibold">
            Loan Offers
          </h2>

          {offers.length === 0 ? (
            <p className="mt-5 text-sm text-zinc-500">
              No loan offers yet.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {offers.map(
                (offer: any, index: number) => (
                  <div
                    key={offer._id ?? index}
                    className="rounded-2xl border border-black/5 bg-white/50 p-4"
                  >
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoRow
                        label="Sanctioned Amount"
                        value={formatCurrency(
                          offer.sanctionedAmount
                        )}
                      />

                      <InfoRow
                        label="Tenure"
                        value={
                          offer.tenure != null
                            ? `${offer.tenure} months`
                            : "—"
                        }
                      />

                      <InfoRow
                        label="Interest Rate"
                        value={
                          offer.interestRate != null
                            ? `${offer.interestRate}%`
                            : "—"
                        }
                      />

                      <InfoRow
                        label="Validity"
                        value={formatDate(
                          offer.offerValidity
                        )}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </GlassCard>

        {/* Activity History */}
        <GlassCard>
          <h2 className="text-lg font-semibold">
            Activity History
          </h2>

          {history.length === 0 ? (
            <p className="mt-5 text-sm text-zinc-500">
              No activity recorded yet.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {history.map(
                (event: any, index: number) => (
                  <div
                    key={event._id ?? index}
                    className="border-l-2 border-rose-200 pl-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>
                        {event.type ??
                          "EVENT"}
                      </Badge>

                      <span className="text-xs text-zinc-500">
                        {formatDate(
                          event.createdAt
                        )}
                      </span>
                    </div>

                    {event.notes && (
                      <p className="mt-2 text-sm text-zinc-700">
                        {event.notes}
                      </p>
                    )}

                    {event.reason && (
                      <p className="mt-2 text-sm text-zinc-700">
                        Reason: {event.reason}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-zinc-900">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? String(value)
          : "—"}
      </p>
    </div>
  );
}

function formatCurrency(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "—";
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(value: unknown) {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateOnly(value: unknown) {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
}