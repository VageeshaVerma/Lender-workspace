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

  // --------------------------------------------------
  // OPEN CREATE FORM FROM ?create=true
  // --------------------------------------------------

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreateForm(true);
    }
  }, [searchParams]);

  // --------------------------------------------------
  // LOAD LENDERS
  // --------------------------------------------------

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

        const data: ApiResponse = await response.json();

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

  // --------------------------------------------------
  // FORM UPDATE
  // --------------------------------------------------

  function updateForm(
    field: keyof CreateLenderForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // --------------------------------------------------
  // CREATE LENDER
  // --------------------------------------------------

  async function createLender(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setCreateSuccess("");

      const payload = {
        lender_id: form.lender_id
          .trim()
          .toLowerCase(),

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

        maxLeadsPerDay: form.maxLeadsPerDay
          ? Number(form.maxLeadsPerDay)
          : undefined,

        employmentTypes: form.employmentTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        supportedPincodes: form.supportedPincodes
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

      // Reload lenders after creation
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

  // --------------------------------------------------
  // DELETE LENDER
  // --------------------------------------------------

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

  // --------------------------------------------------
  // TOGGLE LENDER STATUS
  // --------------------------------------------------

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
          data.error ||
            "Failed to update lender"
        );
      }

      setLenders((currentLenders) =>
        currentLenders.map(
          (currentLender) =>
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

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-white" />

            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div
                    key={item}
                    className="h-28 rounded-3xl bg-white/70"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  if (error && lenders.length === 0) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/super-admin"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Failed to load lenders
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#fff8f5] px-5 py-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/super-admin"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              ← Back to dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Lender Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create, manage and configure lender
              organizations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(
                (current) => !current
              );
              setCreateError("");
              setCreateSuccess("");
            }}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {showCreateForm
              ? "Close Form"
              : "+ Create Lender"}
          </button>
        </div>

        {/* GLOBAL ERROR */}
        {error && lenders.length > 0 && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CREATE FORM */}
        {showCreateForm && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create New Lender
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure the lender and its
                eligibility rules.
              </p>
            </div>

            {createError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {createSuccess}
              </div>
            )}

            <form
              onSubmit={createLender}
              className="space-y-8"
            >
              {/* BASIC INFORMATION */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Basic Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Lender ID"
                    value={form.lender_id}
                    onChange={(value) =>
                      updateForm(
                        "lender_id",
                        value
                      )
                    }
                    placeholder="example_lender"
                    required
                  />

                  <FormField
                    label="Lender Name"
                    value={form.name}
                    onChange={(value) =>
                      updateForm(
                        "name",
                        value
                      )
                    }
                    placeholder="Example Finance"
                    required
                  />

                  <FormField
                    label="Priority"
                    type="number"
                    value={form.priority}
                    onChange={(value) =>
                      updateForm(
                        "priority",
                        value
                      )
                    }
                    placeholder="1"
                  />

                  <FormField
                    label="Flow"
                    value={form.flow}
                    onChange={(value) =>
                      updateForm(
                        "flow",
                        value
                      )
                    }
                    placeholder="standard"
                  />

                  <FormField
                    label="Maximum Leads Per Day"
                    type="number"
                    value={form.maxLeadsPerDay}
                    onChange={(value) =>
                      updateForm(
                        "maxLeadsPerDay",
                        value
                      )
                    }
                    placeholder="100"
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
              </div>

              {/* ELIGIBILITY */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Eligibility Rules
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    label="Minimum Age"
                    type="number"
                    value={form.minAge}
                    onChange={(value) =>
                      updateForm(
                        "minAge",
                        value
                      )
                    }
                    placeholder="21"
                  />

                  <FormField
                    label="Maximum Age"
                    type="number"
                    value={form.maxAge}
                    onChange={(value) =>
                      updateForm(
                        "maxAge",
                        value
                      )
                    }
                    placeholder="60"
                  />

                  <FormField
                    label="Minimum Income"
                    type="number"
                    value={form.minIncome}
                    onChange={(value) =>
                      updateForm(
                        "minIncome",
                        value
                      )
                    }
                    placeholder="25000"
                  />

                  <FormField
                    label="Minimum Credit Score (Exclusive)"
                    type="number"
                    value={
                      form.minCreditScore_exclusive
                    }
                    onChange={(value) =>
                      updateForm(
                        "minCreditScore_exclusive",
                        value
                      )
                    }
                    placeholder="650"
                  />

                  <FormField
                    label="Maximum Credit Score (Inclusive)"
                    type="number"
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
                  />

                  <FormField
                    label="Employment Types"
                    value={
                      form.employmentTypes
                    }
                    onChange={(value) =>
                      updateForm(
                        "employmentTypes",
                        value
                      )
                    }
                    placeholder="salaried,self_employed"
                  />

                  <FormField
                    label="Supported Pincodes"
                    value={
                      form.supportedPincodes
                    }
                    onChange={(value) =>
                      updateForm(
                        "supportedPincodes",
                        value
                      )
                    }
                    placeholder="226001,226002"
                  />
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Use commas to separate multiple
                  employment types or pincodes.
                </p>
              </div>

              {/* FEATURES */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Lender Features
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <CheckboxField
                    label="Active"
                    checked={form.isActive}
                    onChange={(value) =>
                      updateForm(
                        "isActive",
                        value
                      )
                    }
                  />

                  <CheckboxField
                    label="Preflight"
                    checked={form.preflight}
                    onChange={(value) =>
                      updateForm(
                        "preflight",
                        value
                      )
                    }
                  />

                  <CheckboxField
                    label="Lead Only"
                    checked={form.leadOnly}
                    onChange={(value) =>
                      updateForm(
                        "leadOnly",
                        value
                      )
                    }
                  />

                  <CheckboxField
                    label="Offer Approval"
                    checked={form.offerApproval}
                    onChange={(value) =>
                      updateForm(
                        "offerApproval",
                        value
                      )
                    }
                  />

                  <CheckboxField
                    label="Show Provisional Offer"
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

              {/* FORM ACTIONS */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError("");
                    setCreateSuccess("");
                  }}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Lender"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* LENDER LIST */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Lenders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {lenders.length} lender
                {lenders.length === 1
                  ? ""
                  : "s"} configured
              </p>
            </div>
          </div>

          {lenders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                No lenders found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create your first lender to get
                started.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCreateForm(true)
                }
                className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create Lender
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {lenders.map((lender) => (
                <article
                  key={lender.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    {/* LENDER INFORMATION */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {lender.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            lender.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {lender.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
                        <div>
                          <span className="font-medium text-slate-700">
                            ID:
                          </span>{" "}
                          {lender.lender_id}
                        </div>

                        <div>
                          <span className="font-medium text-slate-700">
                            Priority:
                          </span>{" "}
                          {lender.priority ??
                            "—"}
                        </div>

                        <div>
                          <span className="font-medium text-slate-700">
                            Flow:
                          </span>{" "}
                          {lender.flow || "—"}
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/super-admin/lenders/${lender.lender_id}`}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          toggleLenderStatus(
                            lender
                          )
                        }
                        disabled={
                          updatingLenderId ===
                          lender.id
                        }
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingLenderId ===
                        lender.id
                          ? "Updating..."
                          : lender.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteLender(lender)
                        }
                        disabled={
                          deletingLenderId ===
                          lender.id
                        }
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingLenderId ===
                        lender.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ==================================================
// FORM FIELD
// ==================================================

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
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
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

// ==================================================
// CHECKBOX FIELD
// ==================================================

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function CheckboxField({
  label,
  checked,
  onChange,
}: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300"
      />

      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </label>
  );
}