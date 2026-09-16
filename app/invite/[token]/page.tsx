"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AcceptInviteResponse = {
  message?: string;
  error?: string;
  details?: Record<string, string[] | undefined>;
};

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();

  const token = params.token as string;

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid invitation link.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/auth/invite/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            password,
          }),
        }
      );

      const data: AcceptInviteResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to accept invitation."
        );
      }

      setSuccess(true);

      setName("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Accept invitation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to accept invitation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SUCCESS STATE
   * ---------------------------------------------------------
   */

  if (success) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <section className="w-full rounded-2xl border border-white/60 bg-white/70 p-6 text-center shadow-sm backdrop-blur sm:p-8">
            {/* Success Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-600">
              ✓
            </div>

            {/* Header */}
            <div className="mt-5">
              <p className="text-sm font-medium text-rose-500">
                Lender Workspace
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Account created
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your account has been created successfully.
                You can now log in and access your lender workspace.
              </p>
            </div>

            {/* Login Button */}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 w-full rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Go to Login
            </button>
          </section>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * INVITATION FORM
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <section className="w-full rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          {/* Brand / Header */}
          <div className="text-center">
            <p className="text-sm font-medium text-rose-500">
              Lender Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Join the Workspace
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You have been invited to join the lender workspace.
              Create your account to get started.
            </p>
          </div>

          {/* Invitation Information */}
          <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm text-rose-600">
                ✉
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Invitation received
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Complete the form below to activate your
                  account.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm leading-5 text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-slate-400">
                Minimum 6 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Accept Invitation"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-slate-200/60 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-rose-500 hover:text-rose-600"
              >
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}