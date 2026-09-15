"use client";

import { useState } from "react";

type AdminLeadActionsProps = {
  leadId: string;
  status: string;
};

type ActionType =
  | "call"
  | "note"
  | "followup"
  | "approve"
  | "reject"
  | "disburse";

export default function AdminLeadActions({
  leadId,
  status,
}: AdminLeadActionsProps) {
  const [activeAction, setActiveAction] =
    useState<ActionType | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [callOutcome, setCallOutcome] = useState("connected");
  const [callNotes, setCallNotes] = useState("");

  const [note, setNote] = useState("");

  const [followUpDate, setFollowUpDate] = useState("");

  const [sanctionedAmount, setSanctionedAmount] =
    useState("");

  const [tenure, setTenure] = useState("");

  const [interestRate, setInterestRate] =
    useState("");

  const [offerValidity, setOfferValidity] =
    useState("");

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [disbursementAmount, setDisbursementAmount] =
    useState("");

  const [disbursementDate, setDisbursementDate] =
    useState("");

  const [referenceNumber, setReferenceNumber] =
    useState("");

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function openAction(action: ActionType) {
    resetMessages();
    setActiveAction(action);
  }

  function closeAction() {
    setActiveAction(null);
    resetMessages();
  }

  async function submitAction() {
    if (!activeAction) return;

    setLoading(true);
    resetMessages();

    try {
      let endpoint = "";
      let body: Record<string, unknown> = {};

      if (activeAction === "call") {
        if (!callNotes.trim()) {
          throw new Error("Please enter call notes.");
        }

        endpoint = `/api/leads/${leadId}/call`;

        body = {
          outcome: callOutcome,
          notes: callNotes.trim(),
        };
      }

      if (activeAction === "note") {
        if (!note.trim()) {
          throw new Error("Please enter a note.");
        }

        endpoint = `/api/leads/${leadId}/notes`;

        body = {
          note: note.trim(),
        };
      }

      if (activeAction === "followup") {
        if (!followUpDate) {
          throw new Error("Please select a follow-up date.");
        }

        endpoint = `/api/leads/${leadId}/follow-up`;

        body = {
          followUpDate: new Date(
            followUpDate
          ).toISOString(),
        };
      }

      if (activeAction === "approve") {
        if (!sanctionedAmount || Number(sanctionedAmount) <= 0) {
          throw new Error(
            "Enter a valid sanctioned amount."
          );
        }

        if (!tenure || Number(tenure) <= 0) {
          throw new Error("Enter a valid tenure.");
        }

        if (
          !interestRate ||
          Number(interestRate) < 0
        ) {
          throw new Error(
            "Enter a valid interest rate."
          );
        }

        if (!offerValidity) {
          throw new Error(
            "Please select offer validity."
          );
        }

        endpoint = `/api/leads/${leadId}/approve`;

        body = {
          sanctionedAmount: Number(sanctionedAmount),
          tenure: Number(tenure),
          interestRate: Number(interestRate),
          offerValidity: new Date(
            offerValidity
          ).toISOString(),
        };
      }

      if (activeAction === "reject") {
        if (!rejectionReason.trim()) {
          throw new Error(
            "Please enter a rejection reason."
          );
        }

        endpoint = `/api/leads/${leadId}/reject`;

        body = {
          reason: rejectionReason.trim(),
        };
      }

      if (activeAction === "disburse") {
        if (
          !disbursementAmount ||
          Number(disbursementAmount) <= 0
        ) {
          throw new Error(
            "Enter a valid disbursement amount."
          );
        }

        if (!disbursementDate) {
          throw new Error(
            "Please select the disbursement date."
          );
        }

        if (!referenceNumber.trim()) {
          throw new Error(
            "Please enter a reference number."
          );
        }

        endpoint = `/api/leads/${leadId}/disburse`;

        body = {
          amount: Number(disbursementAmount),
          date: new Date(
            disbursementDate
          ).toISOString(),
          referenceNumber:
            referenceNumber.trim(),
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Action failed."
        );
      }

      setSuccess(
        getSuccessMessage(activeAction)
      );

      setActiveAction(null);

      setCallNotes("");
      setNote("");
      setFollowUpDate("");
      setSanctionedAmount("");
      setTenure("");
      setInterestRate("");
      setOfferValidity("");
      setRejectionReason("");
      setDisbursementAmount("");
      setDisbursementDate("");
      setReferenceNumber("");

      /*
       * Refresh the server-rendered lead detail page
       * so status, offers and activity history update.
       */
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">
          Admin Actions
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Manage this lead as an operations administrator.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ActionButton
          label="Call"
          onClick={() => openAction("call")}
        />

        <ActionButton
          label="Add Note"
          onClick={() => openAction("note")}
        />

        <ActionButton
          label="Follow-up"
          onClick={() => openAction("followup")}
        />

        <ActionButton
          label="Approve"
          onClick={() => openAction("approve")}
          disabled={
            status === "approved" ||
            status === "disbursed" ||
            status === "rejected"
          }
        />

        <ActionButton
          label="Reject"
          onClick={() => openAction("reject")}
          disabled={
            status === "rejected" ||
            status === "disbursed"
          }
        />

        <ActionButton
          label="Disburse"
          onClick={() => openAction("disburse")}
          disabled={status !== "approved"}
        />
      </div>

      {/* Action form */}
      {activeAction && (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold">
              {getActionTitle(activeAction)}
            </h3>

            <button
              type="button"
              onClick={closeAction}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Close
            </button>
          </div>

          {activeAction === "call" && (
            <div className="space-y-4">
              <FormField label="Call outcome">
                <select
                  value={callOutcome}
                  onChange={(e) =>
                    setCallOutcome(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                >
                  <option value="connected">
                    Connected
                  </option>
                  <option value="not_connected">
                    Not connected
                  </option>
                  <option value="busy">
                    Busy
                  </option>
                  <option value="wrong_number">
                    Wrong number
                  </option>
                  <option value="interested">
                    Interested
                  </option>
                  <option value="not_interested">
                    Not interested
                  </option>
                  <option value="callback_requested">
                    Callback requested
                  </option>
                </select>
              </FormField>

              <FormField label="Notes">
                <textarea
                  value={callNotes}
                  onChange={(e) =>
                    setCallNotes(e.target.value)
                  }
                  maxLength={1000}
                  rows={4}
                  placeholder="Describe the call..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                />
              </FormField>
            </div>
          )}

          {activeAction === "note" && (
            <FormField label="Note">
              <textarea
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                maxLength={1000}
                rows={5}
                placeholder="Enter a note..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
              />
            </FormField>
          )}

          {activeAction === "followup" && (
            <FormField label="Follow-up date">
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) =>
                  setFollowUpDate(e.target.value)
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
              />
            </FormField>
          )}

          {activeAction === "approve" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Sanctioned amount">
                <input
                  type="number"
                  min="1"
                  value={sanctionedAmount}
                  onChange={(e) =>
                    setSanctionedAmount(e.target.value)
                  }
                  placeholder="500000"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                />
              </FormField>

              <FormField label="Tenure (months)">
                <input
                  type="number"
                  min="1"
                  value={tenure}
                  onChange={(e) =>
                    setTenure(e.target.value)
                  }
                  placeholder="24"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                />
              </FormField>

              <FormField label="Interest rate (%)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) =>
                    setInterestRate(e.target.value)
                  }
                  placeholder="12.5"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                />
              </FormField>

              <FormField label="Offer validity">
                <input
                  type="datetime-local"
                  value={offerValidity}
                  onChange={(e) =>
                    setOfferValidity(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                />
              </FormField>
            </div>
          )}

          {activeAction === "reject" && (
            <FormField label="Rejection reason">
              <textarea
                value={rejectionReason}
                onChange={(e) =>
                  setRejectionReason(e.target.value)
                }
                maxLength={500}
                rows={4}
                placeholder="Explain why this lead is being rejected..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
              />
            </FormField>
          )}

          {activeAction === "disburse" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Amount">
                <input
                  type="number"
                  min="1"
                  value={disbursementAmount}
                  onChange={(e) =>
                    setDisbursementAmount(e.target.value)
                  }
                  placeholder="500000"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                />
              </FormField>

              <FormField label="Disbursement date">
                <input
                  type="datetime-local"
                  value={disbursementDate}
                  onChange={(e) =>
                    setDisbursementDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Reference number">
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) =>
                      setReferenceNumber(e.target.value)
                    }
                    maxLength={100}
                    placeholder="TXN-2026-001"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                  />
                </FormField>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={submitAction}
              disabled={loading}
              className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : getSubmitLabel(activeAction)}
            </button>

            <button
              type="button"
              onClick={closeAction}
              disabled={loading}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function getActionTitle(action: ActionType) {
  switch (action) {
    case "call":
      return "Record Call Outcome";

    case "note":
      return "Add Note";

    case "followup":
      return "Set Follow-up";

    case "approve":
      return "Approve Loan";

    case "reject":
      return "Reject Lead";

    case "disburse":
      return "Disburse Loan";
  }
}

function getSubmitLabel(action: ActionType) {
  switch (action) {
    case "call":
      return "Save Call";

    case "note":
      return "Add Note";

    case "followup":
      return "Set Follow-up";

    case "approve":
      return "Approve";

    case "reject":
      return "Reject";

    case "disburse":
      return "Disburse";
  }
}

function getSuccessMessage(action: ActionType) {
  switch (action) {
    case "call":
      return "Call outcome recorded successfully.";

    case "note":
      return "Note added successfully.";

    case "followup":
      return "Follow-up scheduled successfully.";

    case "approve":
      return "Loan approved successfully.";

    case "reject":
      return "Lead rejected successfully.";

    case "disburse":
      return "Loan disbursed successfully.";
  }
}