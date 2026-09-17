import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import LeadActions from "./LeadActions";

type Offer = {
  _id: string;
  amount: number;
  tenure: number;
  interestRate: number;
  status: string;
  offerValidity: string;
  createdAt: string;
};

type HistoryEvent = {
  _id: string;
  eventType: string;
  agentId?: string;
  data?: {
    outcome?: string;
    notes?: string | null;
    note?: string;
    previousStatus?: string;
    newStatus?: string;
    followUpDate?: string;
    reason?: string;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type LeadDetail = {
  _id: string;
  lenderId: string;
  leadId: string;
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
    maritalStatus?: string;
    employmentType?: string;
    income?: number;
    workExperience?: number;
    creditScore?: number;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    createdAt: string;
    updatedAt: string;
  };

  offers: Offer[];
  history: HistoryEvent[];
};

type PageProps = {
  params: Promise<{
    leadId: string;
  }>;
};

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date?: string | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLabel(value?: string) {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getLeadDetail(
  leadId: string
): Promise<LeadDetail> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  const baseUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/leads/${leadId}`,
    {
      headers: {
        Cookie: sessionCookie
          ? `session=${sessionCookie.value}`
          : "",
      },
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 404) {
    throw new Error("Lead not found");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch lead");
  }

  const data = await response.json();

  return data.lead;
}

export default async function LeadDetailPage({
  params,
}: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (
    session.role !== "lender_admin" &&
    session.role !== "lender_agent"
  ) {
    redirect("/");
  }

  const { leadId } = await params;

  let lead: LeadDetail;

  try {
    lead = await getLeadDetail(leadId);
  } catch {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/lender/leads"
            className="text-sm font-medium text-rose-500"
          >
            ← Back to Lead Queue
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h1 className="text-lg font-bold text-red-800">
              Lead not found
            </h1>

            <p className="mt-2 text-sm text-red-600">
              This lead may no longer be available in your queue.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const latestOffer = lead.offers?.[0];

  /*
   * Make a separate copy of the history and sort it here.
   *
   * The backend already sorts history by createdAt DESC,
   * but sorting here makes the UI independent of backend
   * ordering.
   *
   * IMPORTANT:
   * We do NOT use .find(), .[0], or any logic that keeps
   * only one NOTE_ADDED event.
   *
   * Therefore every recorded event remains visible.
   */
  const history = [...(lead.history ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold leading-5 text-[var(--text-primary)]">
        {value || "—"}
      </p>
    </div>
  );
}

    return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* =========================================================
            TOP NAVIGATION
           ========================================================= */}

        <div className="mb-6">
          <Link
            href="/lender/leads"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--coral-dark)]"
          >
            <span className="text-base">←</span>
            Back to Lead Queue
          </Link>
        </div>

        {/* =========================================================
            LEAD HEADER
           ========================================================= */}

        <section className="lender-card overflow-hidden">
          <div className="p-5 sm:p-7">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              {/* Borrower identity */}
              <div className="flex min-w-0 items-start gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-lg font-bold text-[var(--coral-dark)]">
                  {lead.borrower.borrowerName
                    ?.charAt(0)
                    .toUpperCase() ?? "L"}
                </div>

                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                      Lead Details
                    </p>

                    {lead.assignmentStatus && (
                      <span className="status-info rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                        {formatLabel(lead.assignmentStatus)}
                      </span>
                    )}
                  </div>

                  <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                    {lead.borrower.borrowerName}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                    <span>{lead.borrower.phone}</span>

                    {lead.borrower.city && (
                      <>
                        <span className="hidden text-[var(--text-muted)] sm:inline">
                          •
                        </span>

                        <span>
                          {lead.borrower.city}
                          {lead.borrower.state
                            ? `, ${lead.borrower.state}`
                            : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">

                <span
                  className={`
                    rounded-full px-3 py-1.5 text-xs font-semibold
                    ${
                      lead.status === "approved"
                        ? "status-success"
                        : lead.status === "rejected"
                        ? "status-danger"
                        : lead.status === "disbursed"
                        ? "status-info"
                        : lead.status === "follow_up"
                        ? "status-warning"
                        : "bg-[var(--soft-rose)] text-[var(--coral-dark)]"
                    }
                  `}
                >
                  {formatLabel(lead.status)}
                </span>

                {lead.eligibilityStatus && (
                  <span
                    className={`
                      rounded-full px-3 py-1.5 text-xs font-semibold
                      ${
                        lead.eligibilityStatus
                          .toLowerCase()
                          .includes("eligible")
                          ? "status-success"
                          : "status-warning"
                      }
                    `}
                  >
                    {formatLabel(lead.eligibilityStatus)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick metrics */}
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-black/5 pt-6 sm:grid-cols-4">

              <div className="rounded-xl bg-[var(--background)] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Requested
                </p>

                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  {formatCurrency(lead.borrower.loanAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-[var(--background)] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Credit Score
                </p>

                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  {lead.borrower.creditScore ?? "—"}
                </p>
              </div>

              <div className="rounded-xl bg-[var(--background)] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Income
                </p>

                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  {formatCurrency(lead.borrower.income)}
                </p>
              </div>

              <div className="rounded-xl bg-[var(--background)] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Applied
                </p>

                <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                  {formatDate(lead.borrower.createdAt)}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================
            MAIN CONTENT
           ========================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">

          {/* =======================================================
              LEFT CONTENT
             ======================================================= */}

          <div className="min-w-0 space-y-6">

            {/* =====================================================
                LOAN INFORMATION
               ===================================================== */}

            <section className="lender-card overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                    Application
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    Loan Information
                  </h2>
                </div>
              </div>

              <div className="p-5 sm:p-6">

                {/* Requested amount highlight */}
                <div className="rounded-2xl bg-[var(--soft-rose)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                    Requested loan amount
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                    {formatCurrency(lead.borrower.loanAmount)}
                  </p>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {lead.borrower.loanPurpose || "Purpose not specified"}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                  <InfoItem
                    label="Purpose"
                    value={lead.borrower.loanPurpose}
                  />

                  <InfoItem
                    label="Credit score"
                    value={
                      lead.borrower.creditScore?.toString() ?? "—"
                    }
                  />

                  <InfoItem
                    label="Eligibility"
                    value={formatLabel(
                      lead.eligibilityStatus
                    )}
                  />

                  <InfoItem
                    label="Employment"
                    value={formatLabel(
                      lead.borrower.employmentType
                    )}
                  />

                  <InfoItem
                    label="Monthly income"
                    value={formatCurrency(
                      lead.borrower.income
                    )}
                  />

                  <InfoItem
                    label="Work experience"
                    value={
                      lead.borrower.workExperience !==
                      undefined
                        ? `${lead.borrower.workExperience} years`
                        : "—"
                    }
                  />
                </div>
              </div>
            </section>

            {/* =====================================================
                BORROWER INFORMATION
               ===================================================== */}

            <section className="lender-card overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                  Customer profile
                </p>

                <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  Borrower Information
                </h2>
              </div>

              <div className="p-5 sm:p-6">

                <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">

                  <InfoItem
                    label="Full name"
                    value={lead.borrower.borrowerName}
                  />

                  <InfoItem
                    label="Phone"
                    value={lead.borrower.phone}
                  />

                  <InfoItem
                    label="Date of birth"
                    value={formatDate(
                      lead.borrower.dateOfBirth
                    )}
                  />

                  <InfoItem
                    label="Gender"
                    value={formatLabel(
                      lead.borrower.gender
                    )}
                  />

                  <InfoItem
                    label="Marital status"
                    value={formatLabel(
                      lead.borrower.maritalStatus
                    )}
                  />

                  <InfoItem
                    label="Pincode"
                    value={lead.borrower.pincode}
                  />
                </div>

                {/* Address */}
                <div className="mt-7 rounded-xl border border-black/5 bg-[var(--background)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Address
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {lead.borrower.addressLine1 || "—"}

                    {lead.borrower.addressLine2 && (
                      <>
                        <br />
                        {lead.borrower.addressLine2}
                      </>
                    )}

                    {(lead.borrower.city ||
                      lead.borrower.state ||
                      lead.borrower.pincode) && (
                      <>
                        <br />
                        {lead.borrower.city}
                        {lead.borrower.city &&
                        lead.borrower.state
                          ? ", "
                          : ""}
                        {lead.borrower.state}
                        {lead.borrower.pincode
                          ? ` - ${lead.borrower.pincode}`
                          : ""}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* =====================================================
                LEAD ACTIONS
               ===================================================== */}

            <LeadActions
              leadId={leadId}
              role={session.role}
            />

            {/* =====================================================
                LOAN OFFERS
               ===================================================== */}

            <section className="lender-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                    Financing
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    Loan Offers
                  </h2>
                </div>

                {lead.offers?.length > 0 && (
                  <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    {lead.offers.length}{" "}
                    {lead.offers.length === 1
                      ? "offer"
                      : "offers"}
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6">
                {lead.offers?.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-[var(--background)] px-5 py-8 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--soft-rose)] text-[var(--coral-dark)]">
                      ₹
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                      No loan offers yet
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Offers created for this lead will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lead.offers.map((offer) => (
                      <div
                        key={offer._id}
                        className="rounded-2xl border border-black/5 bg-[var(--background)] p-4 transition hover:border-[var(--blush)] sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div>
                            <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                              {formatCurrency(
                                offer.amount
                              )}
                            </p>

                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {offer.tenure} months
                              <span className="mx-2 text-[var(--text-muted)]">
                                •
                              </span>
                              {offer.interestRate}% interest
                            </p>
                          </div>

                          <span
                            className={`
                              w-fit rounded-full px-3 py-1.5 text-xs font-semibold
                              ${
                                offer.status
                                  .toLowerCase()
                                  .includes("approved")
                                  ? "status-success"
                                  : offer.status
                                      .toLowerCase()
                                      .includes("reject")
                                  ? "status-danger"
                                  : "status-info"
                              }
                            `}
                          >
                            {formatLabel(
                              offer.status
                            )}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-black/5 pt-4 text-xs text-[var(--text-muted)]">
                          <span>
                            Valid until{" "}
                            <strong className="font-medium text-[var(--text-secondary)]">
                              {formatDate(
                                offer.offerValidity
                              )}
                            </strong>
                          </span>

                          <span>
                            Created{" "}
                            <strong className="font-medium text-[var(--text-secondary)]">
                              {formatDate(
                                offer.createdAt
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* =====================================================
                ACTIVITY HISTORY
               ===================================================== */}

            <section className="lender-card overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                    Audit trail
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    Activity History
                  </h2>

                  <p className="mt-1 max-w-xl text-sm leading-5 text-[var(--text-muted)]">
                    Calls, notes, follow-ups, and loan decisions
                    recorded for this lead.
                  </p>
                </div>

                {history.length > 0 && (
                  <span className="shrink-0 rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    {history.length}
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6">

                {history.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-[var(--background)] px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      No activity recorded
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Lead interactions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="relative space-y-5">

                    {/* Timeline line */}
                    <div className="absolute bottom-5 left-[17px] top-5 hidden w-px bg-black/5 sm:block" />

                    {history.map((event) => {

                      const eventData =
                        event.data ?? {};

                      const callOutcome =
                        typeof eventData.outcome ===
                        "string"
                          ? eventData.outcome
                          : undefined;

                      const callNotes =
                        typeof eventData.notes ===
                        "string"
                          ? eventData.notes
                          : undefined;

                      const normalNote =
                        typeof eventData.note ===
                        "string"
                          ? eventData.note
                          : undefined;

                      const previousStatus =
                        typeof eventData.previousStatus ===
                        "string"
                          ? eventData.previousStatus
                          : undefined;

                      const newStatus =
                        typeof eventData.newStatus ===
                        "string"
                          ? eventData.newStatus
                          : undefined;

                      const isCall =
                        event.eventType ===
                        "CALL_OUTCOME";

                      const isNote =
                        event.eventType ===
                        "NOTE_ADDED";

                      const isFollowUp =
                        event.eventType ===
                        "FOLLOW_UP_SET";

                      const isApproved =
                        event.eventType ===
                        "APPROVED";

                      const isRejected =
                        event.eventType ===
                        "REJECTED";

                      const isDisbursed =
                        event.eventType ===
                        "DISBURSED";

                      return (
                        <div
                          key={event._id}
                          className="relative flex gap-3 sm:gap-4"
                        >

                          {/* Timeline icon */}
                          <div
                            className={`
                              relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-[var(--background)] text-xs font-bold
                              ${
                                isCall
                                  ? "bg-[var(--soft-rose)] text-[var(--coral-dark)]"
                                  : isNote
                                  ? "bg-[#f4eadb] text-[var(--warning)]"
                                  : isFollowUp
                                  ? "bg-[#e8edf3] text-[var(--info)]"
                                  : isApproved
                                  ? "bg-[#e4eee8] text-[var(--success)]"
                                  : isRejected
                                  ? "bg-[#f3e4e5] text-[var(--danger)]"
                                  : isDisbursed
                                  ? "bg-[#e9e5f0] text-[var(--info)]"
                                  : "bg-black/5 text-[var(--text-secondary)]"
                              }
                            `}
                          >
                            {isCall
                              ? "☎"
                              : isNote
                              ? "N"
                              : isFollowUp
                              ? "F"
                              : isApproved
                              ? "✓"
                              : isRejected
                              ? "×"
                              : isDisbursed
                              ? "₹"
                              : "•"}
                          </div>

                          {/* Event content */}
                          <div className="min-w-0 flex-1 rounded-2xl border border-black/5 bg-[var(--background)] p-4 sm:p-5">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                              <div>
                                <p className="text-sm font-bold text-[var(--text-primary)]">
                                  {formatLabel(
                                    event.eventType
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                  {formatDateTime(
                                    event.createdAt
                                  )}
                                </p>
                              </div>

                              {event.agentId && (
                                <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)]">
                                  Agent:{" "}
                                  {event.agentId}
                                </span>
                              )}
                            </div>

                            {/* CALL OUTCOME */}
                            {isCall && (
                              <div className="mt-4 rounded-xl border border-[var(--blush)]/40 bg-[var(--soft-rose)]/60 p-4">

                                {callOutcome && (
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                                      Call outcome
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                                      {formatLabel(
                                        callOutcome
                                      )}
                                    </p>
                                  </div>
                                )}

                                {callNotes && (
                                  <div
                                    className={
                                      callOutcome
                                        ? "mt-4 border-t border-[var(--blush)]/30 pt-4"
                                        : ""
                                    }
                                  >
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                      Call notes
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
                                      {callNotes}
                                    </p>
                                  </div>
                                )}

                                {!callOutcome &&
                                  !callNotes && (
                                    <p className="text-sm text-[var(--text-secondary)]">
                                      Call outcome recorded
                                      without additional
                                      notes.
                                    </p>
                                  )}

                                {(previousStatus ||
                                  newStatus) && (
                                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--blush)]/30 pt-4 text-xs">

                                    {previousStatus && (
                                      <span className="rounded-full bg-white px-3 py-1.5 text-[var(--text-secondary)]">
                                        {formatLabel(
                                          previousStatus
                                        )}
                                      </span>
                                    )}

                                    {previousStatus &&
                                      newStatus && (
                                        <span className="text-[var(--text-muted)]">
                                          →
                                        </span>
                                      )}

                                    {newStatus && (
                                      <span className="rounded-full bg-[var(--text-primary)] px-3 py-1.5 font-medium text-white">
                                        {formatLabel(
                                          newStatus
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* NOTE */}
                            {isNote && (
                              <div className="mt-4 rounded-xl border border-[#ead9bb] bg-[#fbf4e9] p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--warning)]">
                                  Note
                                </p>

                                {normalNote ? (
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
                                    {normalNote}
                                  </p>
                                ) : (
                                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                                    Note recorded.
                                  </p>
                                )}
                              </div>
                            )}

                            {/* OTHER EVENTS */}
                            {!isCall &&
                              !isNote && (
                                <div className="mt-4">

                                  {Object.keys(
                                    eventData
                                  ).length > 0 ? (
                                    <pre className="overflow-x-auto rounded-xl bg-white p-4 text-xs leading-5 text-[var(--text-secondary)]">
                                      {JSON.stringify(
                                        eventData,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  ) : (
                                    <p className="text-sm text-[var(--text-secondary)]">
                                      Activity recorded.
                                    </p>
                                  )}

                                </div>
                              )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* =======================================================
              RIGHT SIDEBAR
             ======================================================= */}

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">

            {/* =====================================================
                ASSIGNMENT
               ===================================================== */}

            <section className="lender-card overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                  Ownership
                </p>

                <h2 className="mt-1 font-bold text-[var(--text-primary)]">
                  Assignment
                </h2>
              </div>

              <div className="space-y-5 p-5">

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Lender
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-primary)]">
                    {lead.lenderId}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Assignment status
                  </p>

                  <span className="mt-2 inline-flex rounded-full bg-[var(--soft-rose)] px-3 py-1.5 text-xs font-semibold text-[var(--coral-dark)]">
                    {formatLabel(
                      lead.assignmentStatus
                    )}
                  </span>
                </div>

                <div className="border-t border-black/5 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Assigned agent
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-primary)]">
                    {lead.assignedAgentId ??
                      "Not assigned"}
                  </p>
                </div>

              </div>
            </section>

            {/* =====================================================
                FOLLOW UP
               ===================================================== */}

            <section className="lender-card overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                  Next action
                </p>

                <h2 className="mt-1 font-bold text-[var(--text-primary)]">
                  Follow-up
                </h2>
              </div>

              <div className="p-5">

                <div className="rounded-xl bg-[var(--background)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Follow-up date
                  </p>

                  <p className="mt-2 text-base font-bold text-[var(--text-primary)]">
                    {formatDateTime(
                      lead.followUpDate
                    )}
                  </p>

                  {lead.followUpDate && (
                    <span className="mt-2 inline-flex rounded-full status-warning px-2.5 py-1 text-[10px] font-semibold">
                      Follow-up scheduled
                    </span>
                  )}
                </div>

              </div>
            </section>

            {/* =====================================================
                LATEST OFFER
               ===================================================== */}

            {latestOffer && (
              <section className="overflow-hidden rounded-2xl border border-[var(--blush)] bg-[var(--soft-rose)] shadow-[var(--shadow-soft)]">

                <div className="p-5">

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                      Latest Offer
                    </p>

                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                      {formatLabel(
                        latestOffer.status
                      )}
                    </span>
                  </div>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                    {formatCurrency(
                      latestOffer.amount
                    )}
                  </p>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {latestOffer.tenure} months
                    <span className="mx-2 text-[var(--text-muted)]">
                      •
                    </span>
                    {latestOffer.interestRate}% interest
                  </p>

                  <div className="mt-5 border-t border-[var(--blush)]/60 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Valid until
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {formatDate(
                        latestOffer.offerValidity
                      )}
                    </p>
                  </div>

                </div>
              </section>
            )}

            {/* =====================================================
                APPLICATION META
               ===================================================== */}

            <section className="rounded-2xl border border-black/5 bg-white/55 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl">

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Application metadata
              </p>

              <div className="mt-4 space-y-4">

                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs text-[var(--text-muted)]">
                    Lead created
                  </span>

                  <span className="text-right text-xs font-medium text-[var(--text-secondary)]">
                    {formatDateTime(
                      lead.createdAt
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs text-[var(--text-muted)]">
                    Last updated
                  </span>

                  <span className="text-right text-xs font-medium text-[var(--text-secondary)]">
                    {formatDateTime(
                      lead.updatedAt
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs text-[var(--text-muted)]">
                    Lead ID
                  </span>

                  <span className="max-w-[170px] break-all text-right font-mono text-[10px] text-[var(--text-muted)]">
                    {lead.leadId}
                  </span>
                </div>

              </div>
            </section>

          </aside>
        </div>
      </div>
    </main>
  );
}