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
    process.env.NEXT_PUBLIC_APP_URL ||
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

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Back */}
        <Link
          href="/lender/leads"
          className="text-sm font-medium text-rose-500 hover:text-rose-600"
        >
          ← Back to Lead Queue
        </Link>

        {/* Header */}
        <section className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-rose-500">
                Lead Details
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {lead.borrower.borrowerName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {lead.borrower.phone}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold capitalize text-rose-600">
                {formatLabel(lead.status)}
              </span>

              {lead.assignmentStatus && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">
                  {formatLabel(lead.assignmentStatus)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* Left / main content */}
          <div className="space-y-6 lg:col-span-2">

            {/* Loan information */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Loan Information
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
                <InfoItem
                  label="Requested amount"
                  value={formatCurrency(
                    lead.borrower.loanAmount
                  )}
                />

                <InfoItem
                  label="Purpose"
                  value={lead.borrower.loanPurpose}
                />

                <InfoItem
                  label="Credit score"
                  value={
                    lead.borrower.creditScore?.toString() ??
                    "—"
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
                  label="Income"
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

                <InfoItem
                  label="Application date"
                  value={formatDate(
                    lead.borrower.createdAt
                  )}
                />
              </div>
            </section>

            {/* Borrower information */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Borrower Information
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
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
                  label="City"
                  value={lead.borrower.city}
                />

                <InfoItem
                  label="State"
                  value={lead.borrower.state}
                />

                <InfoItem
                  label="Pincode"
                  value={lead.borrower.pincode}
                />
              </div>

              <div className="mt-5 border-t border-slate-200/60 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Address
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  {lead.borrower.addressLine1}

                  {lead.borrower.addressLine2 && (
                    <>
                      <br />
                      {lead.borrower.addressLine2}
                    </>
                  )}

                  <br />

                  {lead.borrower.city},{" "}
                  {lead.borrower.state}{" "}
                  {lead.borrower.pincode}
                </p>
              </div>
            </section>

            {/* Lead actions */}
            <LeadActions
              leadId={leadId}
              role={session.role}
            />

            {/* Loan offers */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Loan Offers
              </h2>

              {lead.offers?.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">
                  No loan offers have been created yet.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {lead.offers.map((offer) => (
                    <div
                      key={offer._id}
                      className="rounded-xl border border-slate-200 bg-white/70 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xl font-bold text-slate-900">
                            {formatCurrency(
                              offer.amount
                            )}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {offer.tenure} months ·{" "}
                            {offer.interestRate}% interest
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-600">
                          {formatLabel(offer.status)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>
                          Valid until{" "}
                          {formatDate(
                            offer.offerValidity
                          )}
                        </span>

                        <span>
                          Created{" "}
                          {formatDate(
                            offer.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* =========================================================
                ACTIVITY HISTORY
               ========================================================= */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Activity History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Calls, notes, follow-ups, and loan
                    decisions recorded for this lead.
                  </p>
                </div>

                {/* Number of total events */}
                {history.length > 0 && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {history.length}{" "}
                    {history.length === 1
                      ? "activity"
                      : "activities"}
                  </span>
                )}
              </div>

              {history.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="mt-6 space-y-4">

                  {/*
                   * IMPORTANT:
                   *
                   * history.map() renders EVERY event.
                   *
                   * If there are:
                   *
                   * NOTE_ADDED
                   * NOTE_ADDED
                   * NOTE_ADDED
                   *
                   * all three will be rendered separately.
                   */}
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

                    return (
                      <div
                        key={event._id}
                        className="relative rounded-xl border border-slate-200 bg-white/80 p-4"
                      >

                        {/* Event header */}
                        <div className="flex items-start gap-3">

                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                              event.eventType ===
                              "CALL_OUTCOME"
                                ? "bg-rose-50 text-rose-600"
                                : event.eventType ===
                                  "NOTE_ADDED"
                                  ? "bg-amber-50 text-amber-600"
                                  : event.eventType ===
                                    "FOLLOW_UP_SET"
                                    ? "bg-blue-50 text-blue-600"
                                    : event.eventType ===
                                      "APPROVED"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : event.eventType ===
                                        "REJECTED"
                                        ? "bg-red-50 text-red-600"
                                        : event.eventType ===
                                          "DISBURSED"
                                          ? "bg-purple-50 text-purple-600"
                                          : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {event.eventType ===
                            "CALL_OUTCOME"
                              ? "☎"
                              : event.eventType ===
                                "NOTE_ADDED"
                                ? "📝"
                                : event.eventType ===
                                  "FOLLOW_UP_SET"
                                  ? "📅"
                                  : event.eventType ===
                                    "APPROVED"
                                    ? "✓"
                                    : event.eventType ===
                                      "REJECTED"
                                      ? "✕"
                                      : event.eventType ===
                                        "DISBURSED"
                                        ? "₹"
                                        : "•"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatLabel(
                                event.eventType
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDateTime(
                                event.createdAt
                              )}
                            </p>

                            {/* Optional agent information */}
                            {event.agentId && (
                              <p className="mt-1 text-xs text-slate-400">
                                Agent: {event.agentId}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* =================================================
                            CALL OUTCOME
                           ================================================= */}
                        {event.eventType ===
                          "CALL_OUTCOME" && (
                          <div className="mt-4 rounded-xl bg-rose-50/70 p-4">

                            {callOutcome && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                                  Call outcome
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-900">
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
                                    ? "mt-4"
                                    : ""
                                }
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Call notes
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                  {callNotes}
                                </p>
                              </div>
                            )}

                            {!callOutcome &&
                              !callNotes && (
                                <p className="text-sm text-slate-500">
                                  Call outcome recorded
                                  without additional
                                  notes.
                                </p>
                              )}

                            {(previousStatus ||
                              newStatus) && (
                              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                                {previousStatus && (
                                  <span className="rounded-full bg-white px-3 py-1">
                                    {formatLabel(
                                      previousStatus
                                    )}
                                  </span>
                                )}

                                {previousStatus &&
                                  newStatus && (
                                    <span>
                                      →
                                    </span>
                                  )}

                                {newStatus && (
                                  <span className="rounded-full bg-white px-3 py-1">
                                    {formatLabel(
                                      newStatus
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* =================================================
                            NORMAL NOTE
                           ================================================= */}
                        {event.eventType ===
                          "NOTE_ADDED" && (
                          <div className="mt-4 rounded-xl bg-amber-50/70 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                              Note
                            </p>

                            {normalNote ? (
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {normalNote}
                              </p>
                            ) : (
                              <p className="mt-2 text-sm text-slate-500">
                                Note recorded.
                              </p>
                            )}
                          </div>
                        )}

                        {/* =================================================
                            OTHER EVENTS
                           ================================================= */}
                        {event.eventType !==
                          "CALL_OUTCOME" &&
                          event.eventType !==
                            "NOTE_ADDED" && (
                            <div className="mt-4">

                              {Object.keys(
                                eventData
                              ).length > 0 ? (
                                <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                                  {JSON.stringify(
                                    eventData,
                                    null,
                                    2
                                  )}
                                </pre>
                              ) : (
                                <p className="text-sm text-slate-500">
                                  Activity recorded.
                                </p>
                              )}

                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* =============================================================
              RIGHT SIDEBAR
             ============================================================= */}
          <aside className="space-y-6">

            {/* Assignment */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
              <h2 className="font-bold text-slate-900">
                Assignment
              </h2>

              <div className="mt-4 space-y-4">
                <InfoItem
                  label="Lender"
                  value={lead.lenderId}
                />

                <InfoItem
                  label="Assignment status"
                  value={formatLabel(
                    lead.assignmentStatus
                  )}
                />

                <InfoItem
                  label="Assigned agent"
                  value={
                    lead.assignedAgentId ??
                    "Not assigned"
                  }
                />
              </div>
            </section>

            {/* Follow-up */}
            <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
              <h2 className="font-bold text-slate-900">
                Follow-up
              </h2>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Follow-up date
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDateTime(
                    lead.followUpDate
                  )}
                </p>
              </div>
            </section>

            {/* Current offer */}
            {latestOffer && (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Latest Offer
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    latestOffer.amount
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {latestOffer.tenure} months ·{" "}
                  {latestOffer.interestRate}% interest
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  Valid until{" "}
                  {formatDate(
                    latestOffer.offerValidity
                  )}
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}