"use client";

import { useState } from "react";

type Props = {
  lenderId: string;
  lenderName: string;
};

type InviteResponse = {
  message?: string;
  inviteLink?: string;
  error?: string;
};

export default function InviteLenderAdmin({
  lenderId,
  lenderName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  function closeModal() {
    if (loading) return;

    setOpen(false);
    setEmail("");
    setError("");
    setInviteLink("");
  }

  async function handleInvite(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setInviteLink("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(
        "Please enter the lender admin's email."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "lender_admin",
          lenderId,
        }),
      });

      const data: InviteResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create invitation."
        );
      }

      setInviteLink(data.inviteLink ?? "");
      setEmail("");
    } catch (error) {
      console.error(
        "Invite lender admin error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setInviteLink("");
          setOpen(true);
        }}
        className="rounded-xl bg-[#d86678] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c95769]"
      >
        + Invite Lender Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-rose-500">
                  Lender Workspace
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Invite Lender Admin
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Invite an administrator for{" "}
                  <span className="font-semibold text-slate-700">
                    {lenderName}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {inviteLink ? (
              <div className="mt-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-700">
                    Invitation created successfully
                  </p>

                  <p className="mt-1 text-xs text-green-600">
                    Share this invitation link with the
                    lender admin.
                  </p>

                  <div className="mt-3 break-all rounded-lg bg-white p-3 text-xs text-slate-700">
                    {inviteLink}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleInvite}
                className="mt-6 space-y-5"
              >
                <div>
                  <label
                    htmlFor="lender-admin-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Lender Admin Email
                  </label>

                  <input
                    id="lender-admin-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="admin@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-[#d86678] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c95769] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Sending..."
                      : "Create Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}