"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lead = {
  _id: string;
  leadId: string;
  lenderId: string;
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
    employmentType?: string;
    income?: number;
    creditScore?: number;
    city?: string;
    state?: string;
    pincode?: string;
    createdAt: string;
  };
};

type LeadsResponse = {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const statuses = [
  "all",
  "new",
  "contacted",
  "follow_up",
  "approved",
  "rejected",
  "disbursed",
];

const assignmentStatuses = [
  "all",
  "unassigned",
  "assigned",
];

// --------------------------------------------------
// SLIDER RANGES
// --------------------------------------------------

const MIN_AGE = 18;
const MAX_AGE = 70;

const MIN_INCOME = 0;
const MAX_INCOME = 10_000_000;

const MIN_LOAN_AMOUNT = 0;
const MAX_LOAN_AMOUNT = 5_000_000;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function LenderLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // --------------------------------------------------
  // FILTER STATE
  // --------------------------------------------------

  const [search, setSearch] = useState("");

  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const [status, setStatus] = useState("all");

  const [assignmentStatus, setAssignmentStatus] =
    useState("all");

  const [followUpDue, setFollowUpDue] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // --------------------------------------------------
  // AGE FILTER
  // --------------------------------------------------

  const [minAge, setMinAge] = useState(MIN_AGE);
  const [maxAge, setMaxAge] = useState(MAX_AGE);

  // --------------------------------------------------
  // INCOME FILTER
  // --------------------------------------------------

  const [minIncome, setMinIncome] = useState(MIN_INCOME);
  const [maxIncome, setMaxIncome] = useState(MAX_INCOME);

  // --------------------------------------------------
  // LOAN AMOUNT FILTER
  // --------------------------------------------------

  const [minAmount, setMinAmount] =
    useState(MIN_LOAN_AMOUNT);

  const [maxAmount, setMaxAmount] =
    useState(MAX_LOAN_AMOUNT);

  // --------------------------------------------------
  // UI STATE
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");

  // --------------------------------------------------
  // ASSIGNMENT STATE
  // --------------------------------------------------

  const [selectedLeadIds, setSelectedLeadIds] =
    useState<string[]>([]);

  const [assigning, setAssigning] = useState(false);

  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] =
    useState("");

  // --------------------------------------------------
  // PINCODE → CITY LOOKUP
  // --------------------------------------------------

  useEffect(() => {
    if (pincode.length !== 6) {
      setPincodeLoading(false);
      setPincodeError("");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError(
        "Enter a valid 6-digit pincode."
      );
      return;
    }

    const controller = new AbortController();

    async function lookupPincode() {
      try {
        setPincodeLoading(true);
        setPincodeError("");

        const response = await fetch(
          `/api/pincode/${pincode}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setCity("");
          setPincodeError(
            data?.error || "Pincode not found."
          );
          return;
        }

        setCity(data.city || "");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Pincode lookup error:",
          error
        );

        setCity("");

        setPincodeError(
          "Unable to find city for this pincode."
        );
      } finally {
        setPincodeLoading(false);
      }
    }

    lookupPincode();

    return () => {
      controller.abort();
    };
  }, [pincode]);

  // --------------------------------------------------
  // BUILD FILTER PARAMETERS
  // --------------------------------------------------

  function buildFilterParams(
    includePagination = true
  ) {
    const params = new URLSearchParams();

    if (includePagination) {
      params.set(
        "page",
        String(pagination.page)
      );

      params.set("limit", "20");
    }

    // Search
    if (search.trim()) {
      params.set(
        "search",
        search.trim()
      );
    }

    // --------------------------------------------------
    // LOCATION FILTERS
    // --------------------------------------------------

    if (city.trim()) {
      params.set(
        "city",
        city.trim()
      );
    }

    if (pincode.trim()) {
      params.set(
        "pincode",
        pincode.trim()
      );
    }

    // Status
    if (status !== "all") {
      params.set(
        "status",
        status
      );
    }

    // Assignment
    if (assignmentStatus !== "all") {
      params.set(
        "assignmentStatus",
        assignmentStatus
      );
    }

    // Follow-up
    if (followUpDue) {
      params.set(
        "followUpDue",
        "true"
      );
    }

    // Dates
    if (fromDate) {
      params.set(
        "fromDate",
        fromDate
      );
    }

    if (toDate) {
      params.set(
        "toDate",
        toDate
      );
    }

    // --------------------------------------------------
    // AGE
    // --------------------------------------------------

    if (minAge > MIN_AGE) {
      params.set(
        "minAge",
        String(minAge)
      );
    }

    if (maxAge < MAX_AGE) {
      params.set(
        "maxAge",
        String(maxAge)
      );
    }

    // --------------------------------------------------
    // INCOME
    // --------------------------------------------------

    if (minIncome > MIN_INCOME) {
      params.set(
        "minIncome",
        String(minIncome)
      );
    }

    if (maxIncome < MAX_INCOME) {
      params.set(
        "maxIncome",
        String(maxIncome)
      );
    }

    // --------------------------------------------------
    // LOAN AMOUNT
    // --------------------------------------------------

    if (minAmount > MIN_LOAN_AMOUNT) {
      params.set(
        "minAmount",
        String(minAmount)
      );
    }

    if (maxAmount < MAX_LOAN_AMOUNT) {
      params.set(
        "maxAmount",
        String(maxAmount)
      );
    }

    return params;
  }

  // --------------------------------------------------
  // FETCH LEADS
  // --------------------------------------------------

  async function fetchLeads(page = 1) {
    try {
      setLoading(true);
      setError("");

      const params =
        buildFilterParams(false);

      params.set(
        "page",
        String(page)
      );

      params.set(
        "limit",
        "20"
      );

      const response = await fetch(
        `/api/leads?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        throw new Error(
          "Failed to load leads"
        );
      }

      const data: LeadsResponse =
        await response.json();

      setLeads(data.leads);
      setPagination(data.pagination);

      // Remove selected IDs that are
      // no longer available.
      setSelectedLeadIds((current) =>
        current.filter((id) =>
          data.leads.some(
            (lead) =>
              lead.leadId === id
          )
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load leads. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    fetchLeads(1);

    // Filter changes are handled
    // explicitly using Apply Filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // SEARCH / APPLY FILTERS
  // --------------------------------------------------

  function handleSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setSelectedLeadIds([]);
    setAssignError("");
    setAssignSuccess("");

    fetchLeads(1);
  }

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  function handleClearFilters() {
    setSearch("");

    setCity("");
    setPincode("");
    setPincodeError("");

    setStatus("all");
    setAssignmentStatus("all");

    setFollowUpDue(false);

    setFromDate("");
    setToDate("");

    setMinAge(MIN_AGE);
    setMaxAge(MAX_AGE);

    setMinIncome(MIN_INCOME);
    setMaxIncome(MAX_INCOME);

    setMinAmount(MIN_LOAN_AMOUNT);
    setMaxAmount(MAX_LOAN_AMOUNT);

    setSelectedLeadIds([]);

    setAssignError("");
    setAssignSuccess("");

    // Fetch with completely
    // cleared filters.
    setTimeout(() => {
      fetchLeads(1);
    }, 0);
  }

  // --------------------------------------------------
  // AGE SLIDER HANDLERS
  // --------------------------------------------------

  function handleMinAgeChange(value: number) {
    setMinAge(
      Math.min(
        value,
        maxAge - 1
      )
    );
  }

  function handleMaxAgeChange(value: number) {
    setMaxAge(
      Math.max(
        value,
        minAge + 1
      )
    );
  }

  // --------------------------------------------------
  // INCOME SLIDER HANDLERS
  // --------------------------------------------------

  function handleMinIncomeChange(
    value: number
  ) {
    setMinIncome(
      Math.min(
        value,
        maxIncome - 1000
      )
    );
  }

  function handleMaxIncomeChange(
    value: number
  ) {
    setMaxIncome(
      Math.max(
        value,
        minIncome + 1000
      )
    );
  }

  // --------------------------------------------------
  // LOAN AMOUNT SLIDER HANDLERS
  // --------------------------------------------------

  function handleMinAmountChange(
    value: number
  ) {
    setMinAmount(
      Math.min(
        value,
        maxAmount - 10000
      )
    );
  }

  function handleMaxAmountChange(
    value: number
  ) {
    setMaxAmount(
      Math.max(
        value,
        minAmount + 10000
      )
    );
  }

  // --------------------------------------------------
  // SELECT / DESELECT LEAD
  // --------------------------------------------------

  function toggleLeadSelection(
    leadId: string
  ) {
    setAssignError("");
    setAssignSuccess("");

    setSelectedLeadIds((current) => {
      if (current.includes(leadId)) {
        return current.filter(
          (id) => id !== leadId
        );
      }

      return [
        ...current,
        leadId,
      ];
    });
  }

  // --------------------------------------------------
  // SELECT ALL UNASSIGNED LEADS
  // --------------------------------------------------

  function toggleSelectAll() {
    setAssignError("");
    setAssignSuccess("");

    const unassignedLeadIds =
      leads
        .filter(
          (lead) =>
            lead.assignmentStatus ===
            "unassigned"
        )
        .map(
          (lead) =>
            lead.leadId
        );

    if (
      unassignedLeadIds.length ===
      0
    ) {
      return;
    }

    const allSelected =
      unassignedLeadIds.every(
        (id) =>
          selectedLeadIds.includes(id)
      );

    if (allSelected) {
      setSelectedLeadIds(
        (current) =>
          current.filter(
            (id) =>
              !unassignedLeadIds.includes(
                id
              )
          )
      );
    } else {
      setSelectedLeadIds(
        (current) => [
          ...new Set([
            ...current,
            ...unassignedLeadIds,
          ]),
        ]
      );
    }
  }

  // --------------------------------------------------
  // SELECTABLE LEADS
  // --------------------------------------------------

  const selectableLeadIds =
    leads
      .filter(
        (lead) =>
          lead.assignmentStatus ===
          "unassigned"
      )
      .map(
        (lead) =>
          lead.leadId
      );

  const allSelectableSelected =
    selectableLeadIds.length > 0 &&
    selectableLeadIds.every(
      (id) =>
        selectedLeadIds.includes(id)
    );

  // --------------------------------------------------
  // BULK ASSIGN
  // --------------------------------------------------

  async function handleAssignSelected() {
    if (
      selectedLeadIds.length ===
      0
    ) {
      return;
    }

    try {
      setAssigning(true);
      setAssignError("");
      setAssignSuccess("");

      const response =
        await fetch(
          "/api/leads/assign",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              leadIds:
                selectedLeadIds,
            }),
          }
        );

      const data =
        await response.json();

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to assign selected leads"
        );
      }

      const assignedCount =
        data?.summary?.assigned ??
        0;

      const skippedCount =
        data?.summary?.skipped ??
        0;

      if (
        skippedCount > 0
      ) {
        setAssignSuccess(
          `${assignedCount} lead${
            assignedCount ===
            1
              ? ""
              : "s"
          } assigned successfully. ${skippedCount} skipped.`
        );
      } else {
        setAssignSuccess(
          `${assignedCount} lead${
            assignedCount ===
            1
              ? ""
              : "s"
          } assigned successfully.`
        );
      }

      setSelectedLeadIds([]);

      await fetchLeads(
        pagination.page
      );
    } catch (err) {
      console.error(
        "Assign selected leads error:",
        err
      );

      setAssignError(
        err instanceof Error
          ? err.message
          : "Unable to assign selected leads."
      );
    } finally {
      setAssigning(false);
    }
  }

  // --------------------------------------------------
  // EXPORT
  // --------------------------------------------------

  async function handleExport() {
    try {
      setExportLoading(true);
      setExportError("");

      const params =
        buildFilterParams(false);

      const response =
        await fetch(
          `/api/leads/export?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/login";
        return;
      }

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(
              () => null
            );

        throw new Error(
          data?.error ||
            "Failed to export leads"
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "leads.csv";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (err) {
      console.error(
        "Export error:",
        err
      );

      setExportError(
        err instanceof Error
          ? err.message
          : "Unable to export leads. Please try again."
      );
    } finally {
      setExportLoading(false);
    }
  }

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  function handlePrevious() {
    if (
      pagination.page <= 1
    ) {
      return;
    }

    setSelectedLeadIds([]);

    fetchLeads(
      pagination.page - 1
    );
  }

  function handleNext() {
    if (
      pagination.page >=
      pagination.totalPages
    ) {
      return;
    }

    setSelectedLeadIds([]);

    fetchLeads(
      pagination.page + 1
    );
  }

// --------------------------------------------------
// RENDER
// --------------------------------------------------

return (
  <main className="space-y-6">
    {/* ------------------------------------------------ */}
    {/* PAGE HEADER */}
    {/* ------------------------------------------------ */}

    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--success)]" />

          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Lending Operations
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Lead Queue
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review, filter and manage leads available
          in your lending workspace.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-black/[0.06] bg-white/65 px-4 py-2.5 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Total leads
          </p>

          <p className="mt-0.5 text-sm font-bold text-[var(--text-primary)]">
            {pagination.total.toLocaleString("en-IN")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading || loading}
          className="btn-primary"
        >
          {exportLoading ? (
            "Exporting..."
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>

              Export
            </>
          )}
        </button>
      </div>
    </section>

    {/* ------------------------------------------------ */}
    {/* FILTER PANEL */}
    {/* ------------------------------------------------ */}

    <section className="glass-strong overflow-hidden rounded-2xl">
      <form
        onSubmit={handleSearch}
        className="p-4 sm:p-5 lg:p-6"
      >
        {/* Filter heading */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--soft-rose)] text-[var(--coral-dark)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
              </div>

              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Filter leads
              </h2>
            </div>

            <p className="mt-1 pl-10 text-xs text-[var(--text-muted)]">
              Narrow down the queue using borrower and
              application criteria.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className="self-start text-xs font-semibold text-[var(--coral-dark)] transition hover:text-[var(--coral)] sm:self-auto"
          >
            Clear all filters
          </button>
        </div>

        {/* -------------------------------------------- */}
        {/* BASIC FILTERS */}
        {/* -------------------------------------------- */}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
          {/* Search */}

          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Search
            </label>

            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search borrower name or phone"
                className="input-glass pl-10"
              />
            </div>
          </div>

          {/* Status */}

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="input-glass cursor-pointer"
            >
              {statuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "all"
                    ? "All statuses"
                    : formatStatus(item)}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment */}

          <div>
            <label
              htmlFor="assignmentStatus"
              className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Assignment
            </label>

            <select
              id="assignmentStatus"
              value={assignmentStatus}
              onChange={(event) =>
                setAssignmentStatus(
                  event.target.value
                )
              }
              className="input-glass cursor-pointer"
            >
              {assignmentStatuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "all"
                    ? "All leads"
                    : item === "assigned"
                    ? "Assigned"
                    : "Unassigned"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* -------------------------------------------- */}
        {/* LOCATION */}
        {/* -------------------------------------------- */}

        <div className="mt-5 rounded-xl border border-black/[0.055] bg-[var(--background)]/55 p-4">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Location
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Search borrowers by city or pincode.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* City */}

            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                City
              </label>

              <input
                id="city"
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                placeholder="e.g. Lucknow"
                className="input-glass"
              />
            </div>

            {/* Pincode */}

            <div>
              <label
                htmlFor="pincode"
                className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Pincode
              </label>

              <input
                id="pincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(event) => {
                  const value =
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                  setPincode(value);
                }}
                placeholder="Enter 6-digit pincode"
                className="input-glass"
              />

              {pincodeLoading && (
                <p className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--coral)]" />
                  Finding city...
                </p>
              )}

              {pincodeError && (
                <p className="mt-2 text-[11px] text-[var(--danger)]">
                  {pincodeError}
                </p>
              )}

              {!pincodeLoading &&
                !pincodeError &&
                pincode.length === 6 &&
                city && (
                  <p className="mt-2 text-[11px] text-[var(--success)]">
                    City found: {city}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* -------------------------------------------- */}
        {/* RANGE FILTERS */}
        {/* -------------------------------------------- */}

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {/* Age */}

          <div className="rounded-xl border border-black/[0.055] bg-white/45 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Borrower Age
                </p>

                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Age range
                </p>
              </div>

              <span className="rounded-full bg-[var(--soft-rose)] px-2.5 py-1 text-[10px] font-semibold text-[var(--coral-dark)]">
                {minAge} – {maxAge}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Minimum</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {minAge}
                  </span>
                </div>

                <input
                  type="range"
                  min={MIN_AGE}
                  max={MAX_AGE}
                  step={1}
                  value={minAge}
                  onChange={(event) =>
                    handleMinAgeChange(
                      Number(event.target.value)
                    )
                  }
                  className="w-full cursor-pointer accent-[var(--coral)]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Maximum</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {maxAge}
                  </span>
                </div>

                <input
                  type="range"
                  min={MIN_AGE}
                  max={MAX_AGE}
                  step={1}
                  value={maxAge}
                  onChange={(event) =>
                    handleMaxAgeChange(
                      Number(event.target.value)
                    )
                  }
                  className="w-full cursor-pointer accent-[var(--coral)]"
                />
              </div>
            </div>
          </div>

          {/* Income */}

          <div className="rounded-xl border border-black/[0.055] bg-white/45 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Monthly Income
                </p>

                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Borrower income
                </p>
              </div>

              <span className="max-w-[130px] truncate rounded-full bg-[var(--soft-rose)] px-2.5 py-1 text-[10px] font-semibold text-[var(--coral-dark)]">
                {formatCurrency(minIncome)} –{" "}
                {formatCurrency(maxIncome)}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Minimum</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {formatCurrency(minIncome)}
                  </span>
                </div>

                <input
                  type="range"
                  min={MIN_INCOME}
                  max={MAX_INCOME}
                  step={1000}
                  value={minIncome}
                  onChange={(event) =>
                    handleMinIncomeChange(
                      Number(event.target.value)
                    )
                  }
                  className="w-full cursor-pointer accent-[var(--coral)]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Maximum</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {formatCurrency(maxIncome)}
                  </span>
                </div>

                <input
                  type="range"
                  min={MIN_INCOME}
                  max={MAX_INCOME}
                  step={1000}
                  value={maxIncome}
                  onChange={(event) =>
                    handleMaxIncomeChange(
                      Number(event.target.value)
                    )
                  }
                  className="w-full cursor-pointer accent-[var(--coral)]"
                />
              </div>
            </div>
          </div>

          {/* Loan amount */}

          <div className="rounded-xl border border-black/[0.055] bg-white/45 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Loan Amount
                </p>

                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Requested amount
                </p>
              </div>

              <span className="max-w-[130px] truncate rounded-full bg-[var(--soft-rose)] px-2.5 py-1 text-[10px] font-semibold text-[var(--coral-dark)]">
                {formatCurrency(minAmount)} –{" "}
                {formatCurrency(maxAmount)}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Minimum</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {formatCurrency(minAmount)}
                  </span>
                </div>

                <input
                  type="range"
                  min={MIN_LOAN_AMOUNT}
                  max={MAX_LOAN_AMOUNT}
                  step={10000}
                  value={minAmount}
                  onChange={(event) =>
                    handleMinAmountChange(
                      Number(event.target.value)
                    )
                  }
                  className="w-full cursor-pointer accent-[var(--coral)]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Maximum</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {formatCurrency(maxAmount)}
                  </span>
                </div>

                <input
                  type="range"
                  min={MIN_LOAN_AMOUNT}
                  max={MAX_LOAN_AMOUNT}
                  step={10000}
                  value={maxAmount}
                  onChange={(event) =>
                    handleMaxAmountChange(
                      Number(event.target.value)
                    )
                  }
                  className="w-full cursor-pointer accent-[var(--coral)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------- */}
        {/* DATE + FOLLOW UP */}
        {/* -------------------------------------------- */}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label
              htmlFor="fromDate"
              className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              From date
            </label>

            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
              className="input-glass"
            />
          </div>

          <div>
            <label
              htmlFor="toDate"
              className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              To date
            </label>

            <input
              id="toDate"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) =>
                setToDate(event.target.value)
              }
              className="input-glass"
            />
          </div>

          <label className="flex min-h-[42px] cursor-pointer items-center gap-3 self-end rounded-xl border border-black/[0.055] bg-white/55 px-4 py-3">
            <input
              type="checkbox"
              checked={followUpDue}
              onChange={(event) =>
                setFollowUpDue(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-black/20 text-[var(--coral)] focus:ring-[var(--coral)]"
            />

            <span className="whitespace-nowrap text-xs font-semibold text-[var(--text-secondary)]">
              Follow-ups due only
            </span>
          </label>
        </div>

        {/* -------------------------------------------- */}
        {/* FILTER ACTIONS */}
        {/* -------------------------------------------- */}

        <div className="mt-5 flex flex-col gap-2 border-t border-black/[0.055] pt-5 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="btn-coral flex-1 sm:flex-none"
          >
            {loading
              ? "Applying..."
              : "Apply Filters"}
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-black/[0.07] bg-white/65 px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-white hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>

      {/* -------------------------------------------- */}
      {/* EXPORT BAR */}
      {/* -------------------------------------------- */}

      <div className="flex flex-col gap-3 border-t border-black/[0.055] bg-[var(--background)]/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Export current results
          </p>

          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
            Your CSV will use the active search and
            filters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-black/[0.07] bg-white/75 px-4 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-white hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exportLoading
            ? "Preparing CSV..."
            : "Export CSV"}
        </button>
      </div>
    </section>

    {/* ------------------------------------------------ */}
    {/* ALERTS */}
    {/* ------------------------------------------------ */}

    {exportError && (
      <div className="status-danger rounded-xl px-4 py-3 text-xs font-medium">
        {exportError}
      </div>
    )}

    {error && (
      <div className="status-danger flex flex-col gap-3 rounded-xl px-4 py-3 text-xs font-medium sm:flex-row sm:items-center sm:justify-between">
        <span>{error}</span>

        <button
          type="button"
          onClick={() =>
            fetchLeads(pagination.page)
          }
          className="font-bold underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    )}

    {assignError && (
      <div className="status-danger rounded-xl px-4 py-3 text-xs font-medium">
        {assignError}
      </div>
    )}

    {assignSuccess && (
      <div className="status-success rounded-xl px-4 py-3 text-xs font-medium">
        {assignSuccess}
      </div>
    )}

    {/* ------------------------------------------------ */}
    {/* ASSIGNMENT TOOLBAR */}
    {/* ------------------------------------------------ */}

    {!loading && leads.length > 0 && (
      <section className="glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--soft-rose)] px-2 text-[10px] font-bold text-[var(--coral-dark)]">
              {selectedLeadIds.length}
            </span>

            <p className="text-sm font-bold text-[var(--text-primary)]">
              {selectedLeadIds.length === 1
                ? "Lead selected"
                : "Leads selected"}
            </p>
          </div>

          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Select unassigned leads to distribute
            them to agents using round robin.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={
              selectableLeadIds.length === 0 ||
              assigning
            }
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-black/[0.07] bg-white/70 px-4 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allSelectableSelected
              ? "Deselect All"
              : "Select All"}
          </button>

          <button
            type="button"
            onClick={handleAssignSelected}
            disabled={
              selectedLeadIds.length === 0 ||
              assigning
            }
            className="btn-coral min-h-9"
          >
            {assigning
              ? "Assigning..."
              : `Assign Selected${
                  selectedLeadIds.length > 0
                    ? ` (${selectedLeadIds.length})`
                    : ""
                }`}
          </button>
        </div>
      </section>
    )}

    {/* ------------------------------------------------ */}
    {/* RESULTS HEADER */}
    {/* ------------------------------------------------ */}

    {!loading && !error && (
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            Lead results
          </p>

          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Showing {leads.length} of{" "}
            {pagination.total.toLocaleString("en-IN")}{" "}
            leads
          </p>
        </div>

        <div className="hidden items-center gap-2 text-[10px] text-[var(--text-muted)] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          Workspace synchronized
        </div>
      </div>
    )}

    {/* ------------------------------------------------ */}
    {/* LOADING */}
    {/* ------------------------------------------------ */}

    {loading && (
      <section className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="lender-card animate-pulse p-4 sm:p-5"
          >
            <div className="flex gap-4">
              <div className="h-5 w-5 rounded bg-black/[0.07]" />

              <div className="flex-1">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="h-4 w-36 rounded bg-black/[0.07]" />
                    <div className="mt-2 h-3 w-24 rounded bg-black/[0.05]" />
                  </div>

                  <div className="h-5 w-24 rounded bg-black/[0.07]" />
                </div>

                <div className="mt-5 flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-black/[0.05]" />
                  <div className="h-5 w-20 rounded-full bg-black/[0.05]" />
                  <div className="h-5 w-14 rounded-full bg-black/[0.05]" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    )}

    {/* ------------------------------------------------ */}
    {/* EMPTY */}
    {/* ------------------------------------------------ */}

    {!loading &&
      !error &&
      leads.length === 0 && (
        <section className="lender-card flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-[var(--coral-dark)]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h10" />
              <circle cx="18" cy="19" r="2" />
            </svg>
          </div>

          <h2 className="mt-5 text-sm font-bold text-[var(--text-primary)]">
            No leads found
          </h2>

          <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-muted)]">
            No leads match your current search and
            filter criteria. Try broadening your
            filters.
          </p>

          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-5 rounded-lg bg-[var(--soft-rose)] px-4 py-2 text-xs font-semibold text-[var(--coral-dark)] transition hover:bg-[var(--blush-light)]"
          >
            Clear filters
          </button>
        </section>
      )}

    {/* ------------------------------------------------ */}
    {/* LEAD CARDS */}
    {/* ------------------------------------------------ */}

    {!loading && leads.length > 0 && (
      <section className="space-y-3">
        {leads.map((lead) => {
          const isAssigned =
            lead.assignmentStatus !==
            "unassigned";

          const isSelected =
            selectedLeadIds.includes(
              lead.leadId
            );

          const isFollowUpDue =
            lead.followUpDate
              ? new Date(
                  lead.followUpDate
                ) <= new Date()
              : false;

          return (
            <article
              key={lead._id}
              className={`
                lender-card group relative
                overflow-hidden
                p-4 sm:p-5
                ${
                  isSelected
                    ? "border-[var(--coral)]/30 ring-2 ring-[var(--coral)]/10"
                    : ""
                }
              `}
            >
              {/* Selected indicator */}

              {isSelected && (
                <div className="absolute inset-y-0 left-0 w-1 bg-[var(--coral)]" />
              )}

              <div className="flex gap-3 sm:gap-4">
                {/* Checkbox */}

                {!isAssigned && (
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleLeadSelection(
                          lead.leadId
                        )
                      }
                      disabled={assigning}
                      aria-label={`Select ${lead.borrower.borrowerName}`}
                      className="h-4 w-4 cursor-pointer rounded border-black/20 text-[var(--coral)] focus:ring-[var(--coral)] disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Lead */}

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/lender/leads/${lead.leadId}`}
                    className="block"
                  >
                    {/* Top */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-sm font-bold text-[var(--text-primary)] transition group-hover:text-[var(--coral-dark)] sm:text-base">
                            {lead.borrower.borrowerName}
                          </h2>

                          <span
                            className={`
                              rounded-full px-2 py-0.5
                              text-[10px] font-semibold capitalize
                              ${
                                lead.status ===
                                "approved"
                                  ? "status-success"
                                  : lead.status ===
                                    "rejected"
                                  ? "status-danger"
                                  : lead.status ===
                                    "disbursed"
                                  ? "status-info"
                                  : "status-warning"
                              }
                            `}
                          >
                            {formatStatus(
                              lead.status
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {lead.borrower.phone}
                        </p>

                        <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                          {lead.borrower.loanPurpose}
                        </p>
                      </div>

                      {/* Amount */}

                      <div className="shrink-0 sm:text-right">
                        <p className="text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">
                          {formatCurrency(
                            lead.borrower.loanAmount
                          )}
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                          Requested amount
                        </p>
                      </div>
                    </div>

                    {/* -------------------------------- */}
                    {/* METADATA */}
                    {/* -------------------------------- */}

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[0.055] pt-3">
                      {lead.borrower.creditScore !==
                        undefined && (
                        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                          Credit{" "}
                          <strong className="font-semibold text-[var(--text-primary)]">
                            {
                              lead.borrower
                                .creditScore
                            }
                          </strong>
                        </span>
                      )}

                      {lead.borrower.income !==
                        undefined && (
                        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                          Income{" "}
                          <strong className="font-semibold text-[var(--text-primary)]">
                            {formatCurrency(
                              lead.borrower
                                .income
                            )}
                          </strong>
                        </span>
                      )}

                      {lead.borrower.dateOfBirth && (
                        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                          DOB{" "}
                          {formatDate(
                            lead.borrower
                              .dateOfBirth
                          )}
                        </span>
                      )}

                      {lead.borrower.city && (
                        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                          {lead.borrower.city}
                          {lead.borrower.state
                            ? `, ${lead.borrower.state}`
                            : ""}
                        </span>
                      )}

                      {lead.borrower.pincode && (
                        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                          PIN{" "}
                          {lead.borrower.pincode}
                        </span>
                      )}

                      {lead.assignmentStatus && (
                        <span
                          className={`
                            rounded-full px-2.5 py-1
                            text-[10px] font-medium capitalize
                            ${
                              lead.assignmentStatus ===
                              "unassigned"
                                ? "status-warning"
                                : "status-success"
                            }
                          `}
                        >
                          {formatStatus(
                            lead.assignmentStatus
                          )}
                        </span>
                      )}

                      {lead.followUpDate && (
                        <span
                          className={`
                            rounded-full px-2.5 py-1
                            text-[10px] font-medium
                            ${
                              isFollowUpDue
                                ? "status-danger"
                                : "status-warning"
                            }
                          `}
                        >
                          {isFollowUpDue
                            ? "Follow-up due"
                            : "Follow-up"}{" "}
                          ·{" "}
                          {formatDate(
                            lead.followUpDate
                          )}
                        </span>
                      )}
                    </div>

                    {/* -------------------------------- */}
                    {/* FOOTER */}
                    {/* -------------------------------- */}

                    <div className="mt-4 flex items-center justify-between border-t border-black/[0.055] pt-3">
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                        <span>
                          Applied{" "}
                          {formatDate(
                            lead.createdAt
                          )}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-black/15" />

                        <span>
                          ID {lead.leadId}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--text-secondary)] transition group-hover:text-[var(--coral-dark)]">
                        View details

                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    )}

    {/* ------------------------------------------------ */}
    {/* PAGINATION */}
    {/* ------------------------------------------------ */}

    {!loading &&
      pagination.totalPages > 0 && (
        <section className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="px-1 text-[11px] text-[var(--text-muted)]">
            Page{" "}
            <strong className="font-semibold text-[var(--text-secondary)]">
              {pagination.page}
            </strong>{" "}
            of{" "}
            <strong className="font-semibold text-[var(--text-secondary)]">
              {pagination.totalPages}
            </strong>
          </p>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={
                pagination.page <= 1 ||
                assigning
              }
              className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-black/[0.07] bg-white/70 px-4 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>

              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                pagination.page >=
                  pagination.totalPages ||
                assigning
              }
              className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-black/[0.07] bg-white/70 px-4 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
            >
              Next

              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </section>
      )}
  </main>
);


}