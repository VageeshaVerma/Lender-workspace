"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Lender = {
  id: string;
  lender_id: string;
  name: string;
  isActive: boolean;
  priority: number | null;
  flow: string | null;
};

type ApiResponse = {
  lenders?: Lender[];
  error?: string;
};

type CreateLenderForm = {
  lender_id: string;
  name: string;
  priority: string;
  flow: string;
  minAge: string;
  maxAge: string;
  minIncome: string;
  minCreditScore_exclusive: string;
  maxCreditScore_inclusive: string;
  maxLeadsPerDay: string;
  employmentTypes: string;
  supportedPincodes: string;
  minAppVersion: string;
  isActive: boolean;
  preflight: boolean;
  leadOnly: boolean;
  offerApproval: boolean;
  canShowProvisionalOffer: boolean;
};

const initialForm: CreateLenderForm = {
  lender_id: "",
  name: "",
  priority: "1",
  flow: "",
  minAge: "",
  maxAge: "",
  minIncome: "",
  minCreditScore_exclusive: "",
  maxCreditScore_inclusive: "",
  maxLeadsPerDay: "",
  employmentTypes: "",
  supportedPincodes: "",
  minAppVersion: "",
  isActive: true,
  preflight: false,
  leadOnly: false,
  offerApproval: false,
  canShowProvisionalOffer: false,
};

export default function SuperAdminLendersPage() {
  const searchParams = useSearchParams();

  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingLenderId, setUpdatingLenderId] =
    useState<string | null>(null);

  const [deletingLenderId, setDeletingLenderId] =
    useState<string | null>(null);

  // Create lender state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [form, setForm] =
    useState<CreateLenderForm>(initialForm);

  // ----------------------------------------
  // OPEN CREATE FORM FROM ?create=true
  // ----------------------------------------

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreateForm(true);
    }
  }, [searchParams]);

  // ----------------------------------------
  // LOAD LENDERS
  // ----------------------------------------

  useEffect(() => {
    async function loadLenders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/super-admin/lenders",
          {
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load lenders"
          );
        }

        setLenders(data.lenders ?? []);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load lenders"
        );
      } finally {
        setLoading(false);
      }
    }

    loadLenders();
  }, []);

  // ----------------------------------------
  // HANDLE FORM INPUT
  // ----------------------------------------

  function updateForm(
    field: keyof CreateLenderForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // ----------------------------------------
  // CREATE LENDER
  // ----------------------------------------

  async function createLender(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setCreateSuccess("");

      const payload = {
        lender_id: form.lender_id.trim().toLowerCase(),
        name: form.name.trim(),

        priority: form.priority
          ? Number(form.priority)
          : 1,

        flow: form.flow.trim() || undefined,

        minAge: form.minAge
          ? Number(form.minAge)
          : undefined,

        maxAge: form.maxAge
          ? Number(form.maxAge)
          : undefined,

        minIncome: form.minIncome
          ? Number(form.minIncome)
          : undefined,

        minCreditScore_exclusive:
          form.minCreditScore_exclusive
            ? Number(form.minCreditScore_exclusive)
            : undefined,

        maxCreditScore_inclusive:
          form.maxCreditScore_inclusive
            ? Number(form.maxCreditScore_inclusive)
            : undefined,

        maxLeadsPerDay:
          form.maxLeadsPerDay
            ? Number(form.maxLeadsPerDay)
            : undefined,

        employmentTypes:
          form.employmentTypes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

        supportedPincodes:
          form.supportedPincodes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

        minAppVersion:
          form.minAppVersion.trim() || undefined,

        isActive: form.isActive,
        preflight: form.preflight,
        leadOnly: form.leadOnly,
        offerApproval: form.offerApproval,
        canShowProvisionalOffer:
          form.canShowProvisionalOffer,
      };

      const response = await fetch(
        "/api/super-admin/lenders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create lender"
        );
      }

      setCreateSuccess(
        "Lender created successfully."
      );

      // Refresh lender list
      const lendersResponse = await fetch(
        "/api/super-admin/lenders",
        {
          cache: "no-store",
        }
      );

      const lendersData =
        await lendersResponse.json();

      if (lendersResponse.ok) {
        setLenders(lendersData.lenders ?? []);
      }

      // Reset form
      setForm(initialForm);

    } catch (error) {
      console.error(error);

      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create lender"
      );
    } finally {
      setCreating(false);
    }
  }

  // ----------------------------------------
  // DELETE LENDER
  // ----------------------------------------

  async function deleteLender(lender: Lender) {
    const confirmation = window.prompt(
      `This will permanently delete ${lender.name} and its lender-owned records.\n\nType "${lender.lender_id}" to confirm.`
    );

    if (confirmation !== lender.lender_id) {
      return;
    }

    try {
      setDeletingLenderId(lender.id);
      setError("");

      const response = await fetch(
        "/api/super-admin/lenders",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lenderId: lender.lender_id,
            confirmation,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete lender"
        );
      }

      setLenders((currentLenders) =>
        currentLenders.filter(
          (currentLender) =>
            currentLender.id !== lender.id
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete lender"
      );
    } finally {
      setDeletingLenderId(null);
    }
  }

  // ----------------------------------------
  // ACTIVATE / DEACTIVATE
  // ----------------------------------------

  async function toggleLenderStatus(
    lender: Lender
  ) {
    const nextStatus = !lender.isActive;

    const action = nextStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${lender.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingLenderId(lender.id);
      setError("");

      const response = await fetch(
        "/api/super-admin/lenders",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lenderId: lender.lender_id,
            isActive: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update lender"
        );
      }

      setLenders((currentLenders) =>
        currentLenders.map((currentLender) =>
          currentLender.id === lender.id
            ? {
                ...currentLender,
                isActive: nextStatus,
              }
            : currentLender
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update lender"
      );
    } finally {
      setUpdatingLenderId(null);
    }
  }

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-white" />

            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-3xl bg-white/70"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------
  // ERROR
  // ----------------------------------------

  if (error && lenders.length === 0) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-red-100 bg-white p-6">
            <h1 className="font-semibold text-red-900">
              Failed to load lenders
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/super-admin"
              className="text-sm font-medium text-rose-600"
            >
              ← Back to Super Admin
            </Link>

            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-rose-400">
              Super Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Lenders
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage all lenders across the platform.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-400">
                Total lenders
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {lenders.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCreateForm((current) => !current);
                setCreateError("");
                setCreateSuccess("");
              }}
              className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
            >
              {showCreateForm
                ? "Close"
                : "+ Create Lender"}
            </button>

          </div>
        </div>

        {/* General Error */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* ---------------------------------------- */}
        {/* CREATE LENDER FORM */}
        {/* ---------------------------------------- */}

        {showCreateForm && (
          <section className="mt-8 rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-sm backdrop-blur">

            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-rose-400">
                New Organization
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Create Lender
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a new lender and configure its eligibility rules.
              </p>
            </div>

            {createError && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">
                  {createError}
                </p>
              </div>
            )}

            {createSuccess && (
              <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-medium text-emerald-700">
                  {createSuccess}
                </p>
              </div>
            )}

            <form
              onSubmit={createLender}
              className="space-y-6"
            >

              {/* Basic Information */}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Basic Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <FormField
                    label="Lender ID"
                    value={form.lender_id}
                    onChange={(value) =>
                      updateForm("lender_id", value)
                    }
                    placeholder="e.g. new-finance"
                    required
                  />

                  <FormField
                    label="Lender Name"
                    value={form.name}
                    onChange={(value) =>
                      updateForm("name", value)
                    }
                    placeholder="e.g. New Finance"
                    required
                  />

                  <FormField
                    label="Priority"
                    value={form.priority}
                    onChange={(value) =>
                      updateForm("priority", value)
                    }
                    placeholder="1"
                    type="number"
                  />

                  <FormField
                    label="Flow"
                    value={form.flow}
                    onChange={(value) =>
                      updateForm("flow", value)
                    }
                    placeholder="e.g. digital"
                  />
                </div>
              </div>

              {/* Eligibility */}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Eligibility Rules
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  <FormField
                    label="Minimum Age"
                    value={form.minAge}
                    onChange={(value) =>
                      updateForm("minAge", value)
                    }
                    placeholder="18"
                    type="number"
                  />

                  <FormField
                    label="Maximum Age"
                    value={form.maxAge}
                    onChange={(value) =>
                      updateForm("maxAge", value)
                    }
                    placeholder="60"
                    type="number"
                  />

                  <FormField
                    label="Minimum Income"
                    value={form.minIncome}
                    onChange={(value) =>
                      updateForm("minIncome", value)
                    }
                    placeholder="15000"
                    type="number"
                  />

                  <FormField
                    label="Min Credit Score (exclusive)"
                    value={
                      form.minCreditScore_exclusive
                    }
                    onChange={(value) =>
                      updateForm(
                        "minCreditScore_exclusive",
                        value
                      )
                    }
                    placeholder="600"
                    type="number"
                  />

                  <FormField
                    label="Max Credit Score (inclusive)"
                    value={
                      form.maxCreditScore_inclusive
                    }
                    onChange={(value) =>
                      updateForm(
                        "maxCreditScore_inclusive",
                        value
                      )
                    }
                    placeholder="900"
                    type="number"
                  />

                  <FormField
                    label="Max Leads Per Day"
                    value={form.maxLeadsPerDay}
                    onChange={(value) =>
                      updateForm(
                        "maxLeadsPerDay",
                        value
                      )
                    }
                    placeholder="1000"
                    type="number"
                  />
                </div>
              </div>

              {/* Supported Values */}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Supported Values
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <FormField
                    label="Employment Types"
                    value={form.employmentTypes}
                    onChange={(value) =>
                      updateForm(
                        "employmentTypes",
                        value
                      )
                    }
                    placeholder="salaried, self-employed"
                  />

                  <FormField
                    label="Supported Pincodes"
                    value={form.supportedPincodes}
                    onChange={(value) =>
                      updateForm(
                        "supportedPincodes",
                        value
                      )
                    }
                    placeholder="226001, 226002, 226003"
                  />

                  <FormField
                    label="Minimum App Version"
                    value={form.minAppVersion}
                    onChange={(value) =>
                      updateForm(
                        "minAppVersion",
                        value
                      )
                    }
                    placeholder="1.0.0"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  For multiple values, separate them with commas.
                </p>
              </div>

              {/* Configuration */}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Configuration
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  <CheckboxField
                    label="Lender is active"
                    checked={form.isActive}
                    onChange={(value) =>
                      updateForm("isActive", value)
                    }
                  />

                  <CheckboxField
                    label="Enable preflight"
                    checked={form.preflight}
                    onChange={(value) =>
                      updateForm("preflight", value)
                    }
                  />

                  <CheckboxField
                    label="Lead only"
                    checked={form.leadOnly}
                    onChange={(value) =>
                      updateForm("leadOnly", value)
                    }
                  />

                  <CheckboxField
                    label="Offer approval required"
                    checked={form.offerApproval}
                    onChange={(value) =>
                      updateForm(
                        "offerApproval",
                        value
                      )
                    }
                  />

                  <CheckboxField
                    label="Show provisional offer"
                    checked={
                      form.canShowProvisionalOffer
                    }
                    onChange={(value) =>
                      updateForm(
                        "canShowProvisionalOffer",
                        value
                      )
                    }
                  />

                </div>
              </div>

              {/* Submit */}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError("");
                    setCreateSuccess("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Lender"}
                </button>

              </div>

            </form>
          </section>
        )}

        {/* ---------------------------------------- */}
        {/* LENDERS */}
        {/* ---------------------------------------- */}

        <section className="mt-8 space-y-4">

          {lenders.length === 0 ? (
            <div className="rounded-3xl border border-white/70 bg-white/75 p-8 text-center shadow-sm">
              <p className="font-semibold text-slate-900">
                No lenders found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                There are currently no lenders in the platform.
              </p>
            </div>
          ) : (
            lenders.map((lender) => (
              <div
                key={lender.id}
                className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur"
              >

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  {/* Lender information */}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">

                      <h2 className="font-semibold text-slate-900">
                        {lender.name}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          lender.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {lender.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {lender.lender_id}
                    </p>
                  </div>

                  {/* Metadata + Actions */}

                  <div className="flex flex-wrap items-center gap-5 text-sm">

                    <div>
                      <p className="text-xs text-slate-400">
                        Priority
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {lender.priority ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Flow
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {lender.flow ?? "—"}
                      </p>
                    </div>

                    {/* Activate / Deactivate */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleLenderStatus(lender)
                      }
                      disabled={
                        updatingLenderId === lender.id ||
                        deletingLenderId === lender.id
                      }
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        lender.isActive
                          ? "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-500 text-white hover:bg-emerald-600"
                      }`}
                    >
                      {updatingLenderId === lender.id
                        ? "Updating..."
                        : lender.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    {/* Delete */}

                    <button
                      type="button"
                      onClick={() =>
                        deleteLender(lender)
                      }
                      disabled={
                        deletingLenderId === lender.id ||
                        updatingLenderId === lender.id
                      }
                      className="rounded-xl border border-red-200 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingLenderId === lender.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>
                </div>

              </div>
            ))
          )}

        </section>

      </div>
    </main>
  );
}

// ----------------------------------------
// FORM FIELD
// ----------------------------------------

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
      />
    </label>
  );
}

// ----------------------------------------
// CHECKBOX FIELD
// ----------------------------------------

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-300"
      />

      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </label>
  );
}