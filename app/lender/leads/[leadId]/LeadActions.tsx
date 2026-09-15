"use client";

import { useState } from "react";

type LeadActionsProps = {
  leadId: string;
  role: "lender_admin" | "lender_agent";
};

const callOutcomes = [
  {
    value: "connected",
    label: "Connected",
  },
  {
    value: "not_connected",
    label: "Not connected",
  },
  {
    value: "busy",
    label: "Busy",
  },
  {
    value: "wrong_number",
    label: "Wrong number",
  },
  {
    value: "interested",
    label: "Interested",
  },
  {
    value: "not_interested",
    label: "Not interested",
  },
  {
    value: "callback_requested",
    label: "Callback requested",
  },
];

export default function LeadActions({
  leadId,
  role,
}: LeadActionsProps) {
  const [outcome, setOutcome] = useState("connected");
  const [callNotes, setCallNotes] = useState("");
  const [note, setNote] = useState("");
// Disbursement state
  const [disbursementAmount, setDisbursementAmount] = useState("");
  const [disbursementDate, setDisbursementDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

// Disbursement loading
  const [disburseLoading, setDisburseLoading] = useState(false);

// Disbursement success message
  const [disburseMessage, setDisburseMessage] = useState("");
  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState("");

  // Approval state
  const [sanctionedAmount, setSanctionedAmount] =
    useState("");
  const [tenure, setTenure] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [offerValidity, setOfferValidity] = useState("");

  // Reject state
  const [rejectReason, setRejectReason] =
    useState("");

  // Loading states
  const [callLoading, setCallLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] =
    useState(false);
  const [approveLoading, setApproveLoading] =
    useState(false);
  const [rejectLoading, setRejectLoading] =
    useState(false);

  // Success messages
  const [callMessage, setCallMessage] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [followUpMessage, setFollowUpMessage] =
    useState("");
  const [approveMessage, setApproveMessage] =
    useState("");
  const [rejectMessage, setRejectMessage] =
    useState("");

  // Common error
  const [error, setError] = useState("");

  const handleCallOutcome = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setCallLoading(true);
    setError("");
    setCallMessage("");

    try {
      const response = await fetch(
        `/api/leads/${leadId}/call`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            outcome,
            notes: callNotes,
          }),
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned non-JSON response (${response.status}).`
        );
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to record call outcome"
        );
      }

      setCallMessage(
        "Call outcome recorded successfully."
      );

      setCallNotes("");

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while recording the call."
      );
    } finally {
      setCallLoading(false);
    }
  };

  const handleNote = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!note.trim()) {
      setError("Please enter a note.");
      return;
    }

    setNoteLoading(true);
    setError("");
    setNoteMessage("");

    try {
      const response = await fetch(
        `/api/leads/${leadId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            note: note.trim(),
          }),
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned non-JSON response (${response.status}).`
        );
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add note"
        );
      }

      setNoteMessage("Note added successfully.");

      setNote("");

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while adding the note."
      );
    } finally {
      setNoteLoading(false);
    }
  };

  const handleFollowUp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!followUpDate) {
      setError(
        "Please select a follow-up date and time."
      );
      return;
    }

    const selectedDate = new Date(followUpDate);

    if (Number.isNaN(selectedDate.getTime())) {
      setError(
        "Please select a valid follow-up date and time."
      );
      return;
    }

    if (selectedDate <= new Date()) {
      setError(
        "Follow-up date must be in the future."
      );
      return;
    }

    setFollowUpLoading(true);
    setError("");
    setFollowUpMessage("");

    try {
      const response = await fetch(
        `/api/leads/${leadId}/follow-up`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            followUpDate:
              selectedDate.toISOString(),
          }),
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned non-JSON response (${response.status}).`
        );
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to schedule follow-up"
        );
      }

      setFollowUpMessage(
        "Follow-up scheduled successfully."
      );

      setFollowUpDate("");

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while scheduling the follow-up."
      );
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleApprove = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!sanctionedAmount) {
      setError(
        "Please enter the sanctioned amount."
      );
      return;
    }

    if (!tenure) {
      setError("Please enter the loan tenure.");
      return;
    }

    if (!interestRate) {
      setError(
        "Please enter the interest rate."
      );
      return;
    }

    if (!offerValidity) {
      setError(
        "Please select the offer validity date."
      );
      return;
    }

    const amount = Number(sanctionedAmount);
    const tenureValue = Number(tenure);
    const interestValue = Number(interestRate);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Sanctioned amount must be greater than 0."
      );
      return;
    }

    if (
      !Number.isInteger(tenureValue) ||
      tenureValue <= 0
    ) {
      setError(
        "Tenure must be a positive whole number."
      );
      return;
    }

    if (
      !Number.isFinite(interestValue) ||
      interestValue <= 0
    ) {
      setError(
        "Interest rate must be greater than 0."
      );
      return;
    }

    const validityDate = new Date(offerValidity);

    if (Number.isNaN(validityDate.getTime())) {
      setError(
        "Please select a valid offer validity date."
      );
      return;
    }

    setApproveLoading(true);
    setError("");
    setApproveMessage("");

    try {
      const response = await fetch(
        `/api/leads/${leadId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sanctionedAmount: amount,
            tenure: tenureValue,
            interestRate: interestValue,
            offerValidity:
              validityDate.toISOString(),
          }),
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned non-JSON response (${response.status}).`
        );
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data.error ||
            "You are not allowed to approve this lead."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to approve lead"
        );
      }

      setApproveMessage(
        "Lead approved successfully."
      );

      setSanctionedAmount("");
      setTenure("");
      setInterestRate("");
      setOfferValidity("");

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while approving the lead."
      );
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!rejectReason.trim()) {
      setError(
        "Please enter a rejection reason."
      );
      return;
    }

    setRejectLoading(true);
    setError("");
    setRejectMessage("");

    try {
      const response = await fetch(
        `/api/leads/${leadId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            reason: rejectReason.trim(),
          }),
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned non-JSON response (${response.status}).`
        );
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data.error ||
            "You are not allowed to reject this lead."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to reject lead"
        );
      }

      setRejectMessage(
        "Lead rejected successfully."
      );

      setRejectReason("");

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while rejecting the lead."
      );
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDisburse = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const amount = Number(disbursementAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    setError("Please enter a valid disbursement amount.");
    return;
  }

  if (!disbursementDate) {
    setError("Please select a disbursement date.");
    return;
  }

  if (!referenceNumber.trim()) {
    setError("Please enter a reference number.");
    return;
  }

  setDisburseLoading(true);
  setError("");
  setDisburseMessage("");

  try {
    const response = await fetch(
      `/api/leads/${leadId}/disburse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount,
          date: new Date(
            disbursementDate
          ).toISOString(),
          referenceNumber: referenceNumber.trim(),
        }),
      }
    );

    const text = await response.text();

    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `Server returned non-JSON response (${response.status}).`
      );
    }

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (response.status === 403) {
      throw new Error(
        data.error ||
          "You are not allowed to disburse this loan."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to disburse loan."
      );
    }

    setDisburseMessage(
      "Loan disbursed successfully."
    );

    setDisbursementAmount("");
    setDisbursementDate("");
    setReferenceNumber("");

    window.location.reload();
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Something went wrong while disbursing the loan."
    );
  } finally {
    setDisburseLoading(false);
  }
};

  return (
    <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
      
      <div>
        <p className="text-sm font-medium text-rose-500">
          Agent Workspace
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900">
          Call, Notes & Follow-up
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Record the conversation, add notes, and
          schedule the next follow-up.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Call Outcome */}
      <form
        onSubmit={handleCallOutcome}
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="call-outcome"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Call outcome
          </label>

          <select
            id="call-outcome"
            value={outcome}
            onChange={(event) =>
              setOutcome(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          >
            {callOutcomes.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="call-notes"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Call notes
          </label>

          <textarea
            id="call-notes"
            value={callNotes}
            onChange={(event) =>
              setCallNotes(event.target.value)
            }
            placeholder="What happened during the call?"
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />

          <p className="mt-1 text-right text-xs text-slate-400">
            {callNotes.length}/1000
          </p>
        </div>

        <button
          type="submit"
          disabled={callLoading}
          className="w-full rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {callLoading
            ? "Saving..."
            : "Record Call Outcome"}
        </button>

        {callMessage && (
          <p className="text-sm font-medium text-emerald-600">
            {callMessage}
          </p>
        )}
      </form>

      {/* Separator */}
      <div className="my-6 border-t border-slate-200/60" />

      {/* Notes */}
      <form
        onSubmit={handleNote}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="note"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Add note
          </label>

          <textarea
            id="note"
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            placeholder="Add an important observation or internal note..."
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />

          <p className="mt-1 text-right text-xs text-slate-400">
            {note.length}/1000
          </p>
        </div>

        <button
          type="submit"
          disabled={noteLoading}
          className="w-full rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {noteLoading
            ? "Adding..."
            : "Add Note"}
        </button>

        {noteMessage && (
          <p className="text-sm font-medium text-emerald-600">
            {noteMessage}
          </p>
        )}
      </form>

      {/* Separator */}
      <div className="my-6 border-t border-slate-200/60" />

      {/* Follow-up */}
      <form
        onSubmit={handleFollowUp}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="follow-up-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Follow-up date & time
          </label>

          <input
            id="follow-up-date"
            type="datetime-local"
            value={followUpDate}
            onChange={(event) =>
              setFollowUpDate(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />

          <p className="mt-1 text-xs text-slate-400">
            Select when the agent should contact the
            borrower again.
          </p>
        </div>

        <button
          type="submit"
          disabled={followUpLoading}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {followUpLoading
            ? "Scheduling..."
            : "Schedule Follow-up"}
        </button>

        {followUpMessage && (
          <p className="text-sm font-medium text-emerald-600">
            {followUpMessage}
          </p>
        )}
      </form>

      {/* Loan Decisions - lender admin only */}
      {role === "lender_admin" && (
        <>
          {/* Approve */}
          <div className="my-6 border-t border-slate-200/60" />

          <form
            onSubmit={handleApprove}
            className="space-y-4"
          >
            <div>
              <p className="text-sm font-medium text-rose-500">
                Loan Decision
              </p>

              <h3 className="mt-1 text-base font-bold text-slate-900">
                Approve Loan
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create an approved loan offer for this
                borrower.
              </p>
            </div>

            {/* Sanctioned amount */}
            <div>
              <label
                htmlFor="sanctioned-amount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sanctioned amount
              </label>

              <input
                id="sanctioned-amount"
                type="number"
                min="1"
                step="1"
                value={sanctionedAmount}
                onChange={(event) =>
                  setSanctionedAmount(
                    event.target.value
                  )
                }
                placeholder="Enter sanctioned amount"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {/* Tenure */}
            <div>
              <label
                htmlFor="tenure"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Tenure
              </label>

              <div className="relative">
                <input
                  id="tenure"
                  type="number"
                  min="1"
                  step="1"
                  value={tenure}
                  onChange={(event) =>
                    setTenure(event.target.value)
                  }
                  placeholder="Enter tenure"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  months
                </span>
              </div>
            </div>

            {/* Interest rate */}
            <div>
              <label
                htmlFor="interest-rate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Interest rate
              </label>

              <div className="relative">
                <input
                  id="interest-rate"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={interestRate}
                  onChange={(event) =>
                    setInterestRate(
                      event.target.value
                    )
                  }
                  placeholder="Enter interest rate"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Offer validity */}
            <div>
              <label
                htmlFor="offer-validity"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Offer valid until
              </label>

              <input
                id="offer-validity"
                type="datetime-local"
                value={offerValidity}
                onChange={(event) =>
                  setOfferValidity(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <button
              type="submit"
              disabled={approveLoading}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {approveLoading
                ? "Approving..."
                : "Approve Loan"}
            </button>

            {approveMessage && (
              <p className="text-sm font-medium text-emerald-600">
                {approveMessage}
              </p>
            )}
          </form>

          {/* Reject */}
          <div className="my-6 border-t border-slate-200/60" />

          <form
            onSubmit={handleReject}
            className="space-y-4"
          >
            <div>
              <p className="text-sm font-medium text-red-500">
                Loan Decision
              </p>

              <h3 className="mt-1 text-base font-bold text-slate-900">
                Reject Loan
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Reject this loan application and record
                the reason.
              </p>
            </div>

            {/* Rejection reason */}
            <div>
              <label
                htmlFor="reject-reason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Rejection reason
              </label>

              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(event) =>
                  setRejectReason(
                    event.target.value
                  )
                }
                placeholder="Explain why this loan is being rejected..."
                rows={4}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {rejectReason.length}/1000
              </p>
            </div>

            <button
              type="submit"
              disabled={rejectLoading}
              className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rejectLoading
                ? "Rejecting..."
                : "Reject Loan"}
            </button>

            {rejectMessage && (
              <p className="text-sm font-medium text-emerald-600">
                {rejectMessage}
              </p>
            )}
          </form>
          {/* Disbursement */}
<div className="my-6 border-t border-slate-200/60" />

<form
  onSubmit={handleDisburse}
  className="space-y-4"
>
  <div>
    <p className="text-sm font-medium text-emerald-600">
      Loan Disbursement
    </p>

    <h3 className="mt-1 text-base font-bold text-slate-900">
      Disburse Loan
    </h3>

    <p className="mt-1 text-sm text-slate-500">
      Record the amount actually disbursed to the customer.
    </p>
  </div>

  <div>
    <label
      htmlFor="disbursement-amount"
      className="mb-2 block text-sm font-medium text-slate-700"
    >
      Disbursement amount
    </label>

    <input
      id="disbursement-amount"
      type="number"
      min="1"
      step="0.01"
      value={disbursementAmount}
      onChange={(event) =>
        setDisbursementAmount(event.target.value)
      }
      placeholder="Enter amount"
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    />
  </div>

  <div>
    <label
      htmlFor="disbursement-date"
      className="mb-2 block text-sm font-medium text-slate-700"
    >
      Disbursement date
    </label>

    <input
      id="disbursement-date"
      type="date"
      value={disbursementDate}
      onChange={(event) =>
        setDisbursementDate(event.target.value)
      }
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    />
  </div>

  <div>
    <label
      htmlFor="reference-number"
      className="mb-2 block text-sm font-medium text-slate-700"
    >
      Reference number
    </label>

    <input
      id="reference-number"
      type="text"
      maxLength={100}
      value={referenceNumber}
      onChange={(event) =>
        setReferenceNumber(event.target.value)
      }
      placeholder="Enter transaction/reference number"
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    />
  </div>

  <button
    type="submit"
    disabled={disburseLoading}
    className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {disburseLoading
      ? "Disbursing..."
      : "Disburse Loan"}
  </button>

  {disburseMessage && (
    <p className="text-sm font-medium text-emerald-600">
      {disburseMessage}
    </p>
  )}
</form>
        </>

      )}
    </section>
  );
}

