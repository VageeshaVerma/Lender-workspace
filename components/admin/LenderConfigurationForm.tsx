"use client";

import { useState } from "react";

type LenderConfiguration = {
  lenderId: string;
  priority: number | null;
  flow: string | null;
  minAge: number | null;
  maxAge: number | null;
  minIncome: number | null;
  minCreditScore_exclusive: number | null;
  maxCreditScore_inclusive: number | null;

  // Supports both old DB format and new format
  employmentTypes: string[] | string | null;
  supportedPincodes: string[] | string | null;

  maxLeadsPerDay: number | null;

  // Supports both old DB format and new format
  preflight: boolean | string | null;
  leadOnly: boolean | string | null;
  offerApproval: boolean | string | null;

  minAppVersion: string | null;
  canShowProvisionalOffer: boolean | string | null;
};

type Props = {
  lender: LenderConfiguration;
};

const EMPLOYMENT_OPTIONS = [
  "salaried",
  "self_employed",
  "business",
  "professional",
];

function toBoolean(
  value: boolean | string | null | undefined
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}

function normalizeEmploymentTypes(
  value: string[] | string | null | undefined
): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizePincodes(
  value: string[] | string | null | undefined
): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

export default function LenderConfigurationForm({
  lender,
}: Props) {
  const [form, setForm] = useState({
    priority: lender.priority ?? 0,

    flow: lender.flow ?? "",

    minAge: lender.minAge ?? 18,

    maxAge: lender.maxAge ?? 60,

    minIncome: lender.minIncome ?? 0,

    minCreditScore_exclusive:
      lender.minCreditScore_exclusive ?? 0,

    maxCreditScore_inclusive:
      lender.maxCreditScore_inclusive ?? 900,

    employmentTypes: normalizeEmploymentTypes(
      lender.employmentTypes
    ),

    maxLeadsPerDay:
      lender.maxLeadsPerDay ?? 0,

    preflight: toBoolean(lender.preflight),

    leadOnly: toBoolean(lender.leadOnly),

    minAppVersion:
      lender.minAppVersion ?? "",

    offerApproval: toBoolean(
      lender.offerApproval
    ),

    canShowProvisionalOffer: toBoolean(
      lender.canShowProvisionalOffer
    ),
  });

  const [pincodesText, setPincodesText] =
    useState(() =>
      normalizePincodes(
        lender.supportedPincodes
      )
    );

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  function updateField(
    field: string,
    value: string | number | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleEmploymentType(type: string) {
    setForm((current) => {
      const exists =
        current.employmentTypes.includes(type);

      return {
        ...current,

        employmentTypes: exists
          ? current.employmentTypes.filter(
              (item) => item !== type
            )
          : [
              ...current.employmentTypes,
              type,
            ],
      };
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const supportedPincodes =
      pincodesText
        .split(",")
        .map((pincode) => pincode.trim())
        .filter(Boolean);

    try {
      const response = await fetch(
        `/api/admin/lenders/${encodeURIComponent(
          lender.lenderId
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            priority: Number(form.priority),

            flow: form.flow,

            minAge: Number(form.minAge),

            maxAge: Number(form.maxAge),

            minIncome: Number(form.minIncome),

            minCreditScore_exclusive:
              Number(
                form.minCreditScore_exclusive
              ),

            maxCreditScore_inclusive:
              Number(
                form.maxCreditScore_inclusive
              ),

            employmentTypes:
              form.employmentTypes,

            supportedPincodes,

            maxLeadsPerDay:
              Number(form.maxLeadsPerDay),

            preflight: form.preflight,

            leadOnly: form.leadOnly,

            minAppVersion:
              form.minAppVersion,

            offerApproval:
              form.offerApproval,

            canShowProvisionalOffer:
              form.canShowProvisionalOffer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update lender"
        );
      }

      setMessage(
        "Lender configuration updated successfully."
      );

      setForm((current) => ({
        ...current,
        supportedPincodes,
      }));
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update lender"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Eligibility Rules */}

      <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          Eligibility Rules
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Minimum Age"
            type="number"
            value={form.minAge}
            onChange={(value) =>
              updateField(
                "minAge",
                Number(value)
              )
            }
          />

          <Field
            label="Maximum Age"
            type="number"
            value={form.maxAge}
            onChange={(value) =>
              updateField(
                "maxAge",
                Number(value)
              )
            }
          />

          <Field
            label="Minimum Income"
            type="number"
            value={form.minIncome}
            onChange={(value) =>
              updateField(
                "minIncome",
                Number(value)
              )
            }
          />

          <Field
            label="Minimum Credit Score"
            type="number"
            value={
              form.minCreditScore_exclusive
            }
            onChange={(value) =>
              updateField(
                "minCreditScore_exclusive",
                Number(value)
              )
            }
          />

          <Field
            label="Maximum Credit Score"
            type="number"
            value={
              form.maxCreditScore_inclusive
            }
            onChange={(value) =>
              updateField(
                "maxCreditScore_inclusive",
                Number(value)
              )
            }
          />

          <Field
            label="Max Leads / Day"
            type="number"
            value={form.maxLeadsPerDay}
            onChange={(value) =>
              updateField(
                "maxLeadsPerDay",
                Number(value)
              )
            }
          />
        </div>
      </section>

      {/* Employment Types */}

      <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          Employment Types
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {EMPLOYMENT_OPTIONS.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <input
                type="checkbox"
                checked={form.employmentTypes.includes(
                  type
                )}
                onChange={() =>
                  toggleEmploymentType(type)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-slate-700">
                {type
                  .replace("_", " ")
                  .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                  )}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Supported Pincodes */}

      <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          Supported Pincodes
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter pincodes separated by commas.
        </p>

        <input
          type="text"
          value={pincodesText}
          onChange={(event) =>
            setPincodesText(
              event.target.value
            )
          }
          placeholder="226001, 226002, 226003"
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
        />
      </section>

      {/* Lender Configuration */}

      <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
        <h2 className="text-lg font-bold text-slate-900">
          Lender Configuration
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Priority"
            type="number"
            value={form.priority}
            onChange={(value) =>
              updateField(
                "priority",
                Number(value)
              )
            }
          />

          <Field
            label="Flow"
            type="text"
            value={form.flow}
            onChange={(value) =>
              updateField("flow", value)
            }
          />

          <Field
            label="Minimum App Version"
            type="text"
            value={form.minAppVersion}
            onChange={(value) =>
              updateField(
                "minAppVersion",
                value
              )
            }
          />
        </div>

        <div className="mt-5 space-y-3">
          <Toggle
            label="Preflight"
            checked={form.preflight}
            onChange={(value) =>
              updateField(
                "preflight",
                value
              )
            }
          />

          <Toggle
            label="Lead Only"
            checked={form.leadOnly}
            onChange={(value) =>
              updateField(
                "leadOnly",
                value
              )
            }
          />

          <Toggle
            label="Offer Approval"
            checked={form.offerApproval}
            onChange={(value) =>
              updateField(
                "offerApproval",
                value
              )
            }
          />

          <Toggle
            label="Show Provisional Offer"
            checked={
              form.canShowProvisionalOffer
            }
            onChange={(value) =>
              updateField(
                "canShowProvisionalOffer",
                value
              )
            }
          />
        </div>
      </section>

      {/* Messages */}

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Save */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#d86678] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c85c6f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: "text" | "number";
  value: string | number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4"
      />
    </label>
  );
}

