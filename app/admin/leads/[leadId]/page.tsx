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
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <GlassCard>
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--blush-light)] text-2xl shadow-sm">
                ⌕
              </div>

              <h1 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
                Lead not found
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
                This lead does not exist or is not
                accessible from the operations workspace.
              </p>

              <Link
                href="/admin/leads"
                className="btn-primary mt-6 inline-flex items-center gap-2"
              >
                <span>←</span>
                Back to leads
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
    <main className="min-h-screen px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ───────────────── Header ───────────────── */}
        <section>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--coral-dark)] transition hover:gap-3"
          >
            <span>←</span>
            Back to leads
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                  Operations
                </span>

                <StatusBadge status={status} />
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Lead Details
              </h1>

              <p className="mt-2 break-all text-xs font-medium text-[var(--text-muted)]">
                Lead ID · {lead.leadId}
              </p>
            </div>

            {/* Lead snapshot */}
            <div className="glass flex items-center gap-4 rounded-2xl px-4 py-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--blush-light)] text-sm font-bold text-[var(--coral-dark)]">
                {getInitials(
                  borrower.borrowerName
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                  {borrower.borrowerName}
                </p>

                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {borrower.phone}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── Overview ───────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Loan Amount"
            value={formatCurrency(
              borrower.loanAmount
            )}
            icon="₹"
          />

          <MetricCard
            label="Credit Score"
            value={
              borrower.creditScore != null
                ? String(borrower.creditScore)
                : "—"
            }
            icon="C"
          />

          <MetricCard
            label="Lender"
            value={lead.lenderId || "—"}
            icon="L"
          />

          <MetricCard
            label="Assignment"
            value={
              lead.assignmentStatus
                ? formatStatus(
                    lead.assignmentStatus
                  )
                : "Unassigned"
            }
            icon="A"
          />
        </section>

        {/* ───────────────── Borrower + Loan ───────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Borrower Information */}
          <GlassCard>
            <SectionHeader
              eyebrow="Applicant"
              title="Borrower Information"
              icon="01"
            />

            <div className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-2">
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
            <SectionHeader
              eyebrow="Application"
              title="Loan Information"
              icon="02"
            />

            <div className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-2">
              <InfoRow
                label="Loan Amount"
                value={formatCurrency(
                  borrower.loanAmount
                )}
                highlight
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
        </div>

        {/* ───────────────── Address ───────────────── */}
        <GlassCard>
          <SectionHeader
            eyebrow="Location"
            title="Address"
            icon="03"
          />

          <div className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* ───────────────── Assignment ───────────────── */}
        <GlassCard>
          <SectionHeader
            eyebrow="Routing"
            title="Lender Assignment"
            icon="04"
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AssignmentItem
              label="Lender"
              value={lead.lenderId}
            />

            <AssignmentItem
              label="Lead Status"
              value={lead.status}
            />

            <AssignmentItem
              label="Assignment"
              value={
                lead.assignmentStatus ??
                "Unassigned"
              }
            />

            <AssignmentItem
              label="Assigned Agent"
              value={
                lead.assignedAgentId ??
                "Unassigned"
              }
            />
          </div>

          {lead.followUpDate && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[var(--blush)] bg-[var(--blush-light)]/60 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Follow-up scheduled
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                  {formatDate(
                    lead.followUpDate
                  )}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-sm shadow-sm">
                ◷
              </div>
            </div>
          )}
        </GlassCard>

        {/* ───────────────── Admin Actions ───────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Operations controls
            </p>
          </div>

          <AdminLeadActions
            leadId={lead.leadId}
            status={status}
          />
        </section>

        {/* ───────────────── Loan Offers ───────────────── */}
        <GlassCard>
          <SectionHeader
            eyebrow="Lending"
            title="Loan Offers"
            icon="05"
            count={offers.length}
          />

          {offers.length === 0 ? (
            <EmptyState
              icon="₹"
              title="No loan offers yet"
              description="No lender offer has been recorded for this lead."
            />
          ) : (
            <div className="mt-6 space-y-3">
              {offers.map(
                (offer: any, index: number) => (
                  <div
                    key={offer._id ?? index}
                    className="group rounded-2xl border border-[var(--glass-border)] bg-white/45 p-4 transition hover:border-[var(--blush)] hover:bg-white/65"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--blush-light)] text-xs font-bold text-[var(--coral-dark)]">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            Loan Offer
                          </p>

                          <p className="text-[11px] text-[var(--text-muted)]">
                            Offer #{index + 1}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-[var(--success)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--success)]">
                        Active
                      </span>
                    </div>

                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoRow
                        label="Sanctioned Amount"
                        value={formatCurrency(
                          offer.sanctionedAmount
                        )}
                        highlight
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

        {/* ───────────────── Activity History ───────────────── */}
        <GlassCard>
          <SectionHeader
            eyebrow="Audit Trail"
            title="Activity History"
            icon="06"
            count={history.length}
          />

          {history.length === 0 ? (
            <EmptyState
              icon="◷"
              title="No activity recorded"
              description="Actions and events for this lead will appear here."
            />
          ) : (
            <div className="relative mt-7">
              {/* Timeline line */}
              <div className="absolute bottom-3 left-[15px] top-3 w-px bg-[var(--blush)]" />

              <div className="space-y-7">
                {history.map(
                  (event: any, index: number) => (
                    <div
                      key={event._id ?? index}
                      className="relative flex gap-4"
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[var(--background)] bg-[var(--coral)] shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-[var(--glass-border)] bg-white/40 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Badge>
                            {event.type ??
                              "EVENT"}
                          </Badge>

                          <span className="text-[11px] font-medium text-[var(--text-muted)]">
                            {formatDate(
                              event.createdAt
                            )}
                          </span>
                        </div>

                        {event.notes && (
                          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                            {event.notes}
                          </p>
                        )}

                        {event.reason && (
                          <div className="mt-3 rounded-xl bg-[var(--blush-light)]/60 px-3 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                              Reason
                            </span>

                            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                              {event.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </GlassCard>

        {/* ───────────────── Footer metadata ───────────────── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <MetadataCard
            label="Created"
            value={formatDate(
              lead.createdAt
            )}
          />

          <MetadataCard
            label="Last Updated"
            value={formatDate(
              lead.updatedAt
            )}
          />
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Reusable UI components
───────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  icon,
  count,
}: {
  eyebrow: string;
  title: string;
  icon: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--blush-light)] text-[10px] font-bold text-[var(--coral-dark)]">
          {icon}
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--coral-dark)]">
            {eyebrow}
          </p>

          <h2 className="mt-0.5 text-base font-bold text-[var(--text-primary)] sm:text-lg">
            {title}
          </h2>
        </div>
      </div>

      {count !== undefined && (
        <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold text-[var(--text-muted)]">
          {count}
        </span>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            {label}
          </p>

          <p className="mt-2 truncate text-lg font-bold text-[var(--text-primary)]">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--blush-light)] text-xs font-bold text-[var(--coral-dark)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: unknown;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </p>

      <p
        className={`mt-1.5 break-words text-sm font-semibold leading-5 ${
          highlight
            ? "text-[var(--coral-dark)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? String(value)
          : "—"}
      </p>
    </div>
  );
}

function AssignmentItem({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-white/45 p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-bold capitalize text-[var(--text-primary)]">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? String(value).replaceAll(
              "_",
              " "
            )
          : "—"}
      </p>
    </div>
  );
}

function MetadataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-white/35 px-4 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[var(--blush)] bg-white/30 px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--blush-light)] text-sm font-bold text-[var(--coral-dark)]">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-[var(--text-primary)]">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  let className =
    "bg-[var(--info)]/10 text-[var(--info)]";

  if (
    normalized === "approved" ||
    normalized === "disbursed"
  ) {
    className =
      "bg-[var(--success)]/10 text-[var(--success)]";
  } else if (
    normalized === "rejected"
  ) {
    className =
      "bg-[var(--danger)]/10 text-[var(--danger)]";
  } else if (
    normalized === "follow_up"
  ) {
    className =
      "bg-[var(--warning)]/10 text-[var(--warning)]";
  } else if (
    normalized === "contacted"
  ) {
    className =
      "bg-[var(--info)]/10 text-[var(--info)]";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold capitalize ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function getInitials(
  name: unknown
) {
  if (!name) return "L";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
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
