"use client";

import { useState } from "react";

type Props = {
  lenderId: string;
  initialIsActive: boolean;
};

export default function LenderStatusToggle({
  lenderId,
  initialIsActive,
}: Props) {
  const [isActive, setIsActive] =
    useState(initialIsActive);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  async function handleToggle() {
    const nextStatus = !isActive;

    const confirmed = window.confirm(
      nextStatus
        ? "Are you sure you want to activate this lender?"
        : "Are you sure you want to deactivate this lender?"
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/lenders/${encodeURIComponent(
          lenderId
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update lender status"
        );
      }

      setIsActive(nextStatus);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update lender status"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        className={
          isActive
            ? "rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-xl bg-[#d86678] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c85c6f] disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {saving
          ? "Updating..."
          : isActive
            ? "Deactivate Lender"
            : "Activate Lender"}
      </button>

      {error && (
        <p className="max-w-xs text-right text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
