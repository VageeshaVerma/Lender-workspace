"use client";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";

type ImportType = "lenders" | "leads";

type ImportResult = {
  rowsProcessed: number;
  inserted: number;
  skippedExisting: number;
  skippedDuplicateInFile: number;
};

type ImportResponse = {
  message?: string;
  error?: string;
  details?: string[];
  result?: ImportResult;
};

export default function ImportsPage() {
  const [lenderFile, setLenderFile] = useState<File | null>(null);
  const [leadFile, setLeadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<ImportType | null>(null);
  const [result, setResult] = useState<{
    type: ImportType;
    data: ImportResult;
  } | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    type: ImportType
  ) {
    const file = event.target.files?.[0] ?? null;

    setError(null);
    setResult(null);

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    if (type === "lenders") {
      setLenderFile(file);
    } else {
      setLeadFile(file);
    }
  }

  async function handleImport(type: ImportType) {
    const file = type === "lenders" ? lenderFile : leadFile;

    if (!file) {
      setError(
        type === "lenders"
          ? "Please select a lender CSV file."
          : "Please select a lead CSV file."
      );
      return;
    }

    setLoading(type);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();

      // Important:
      // This sends the actual File object, not just the filename.
      formData.append("file", file);

      const endpoint =
        type === "lenders"
          ? "/api/admin/import/lenders"
          : "/api/admin/import/leads";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data: ImportResponse = await response.json();

      if (!response.ok) {
        if (data.details?.length) {
          setError(data.details.join("\n"));
        } else {
          setError(data.error ?? "Import failed.");
        }

        return;
      }

      if (data.result) {
        setResult({
          type,
          data: data.result,
        });
      }

      if (type === "lenders") {
        setLenderFile(null);
      } else {
        setLeadFile(null);
      }
    } catch (error) {
      console.error("Import error:", error);
      setError("Something went wrong while importing the CSV.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
{/* Header */}
<div className="mb-8">
  <button
    type="button"
    onClick={() => router.back()}
    className="mb-5 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    ← Back
  </button>

  <p className="text-sm font-medium text-rose-500">
    Operations
  </p>

  <h1 className="mt-1 text-3xl font-semibold text-slate-900">
    Data Imports
  </h1>

  <p className="mt-2 max-w-2xl text-sm text-slate-600">
    Upload lender and lead CSV files into the Lender Workspace.
    Existing records are protected and will be skipped.
  </p>
</div>



        {/* Error */}
        {error && (
          <div className="mb-6 whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Import cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportCard
            title="Lender Import"
            description="Add new lenders and their eligibility configuration."
            file={lenderFile}
            loading={loading === "lenders"}
            onFileChange={(event) =>
              handleFileChange(event, "lenders")
            }
            onImport={() => handleImport("lenders")}
          />

          <ImportCard
            title="Lead Import"
            description="Add borrower leads that can later be evaluated by the BRE."
            file={leadFile}
            loading={loading === "leads"}
            onFileChange={(event) =>
              handleFileChange(event, "leads")
            }
            onImport={() => handleImport("leads")}
          />
        </div>

        {/* Result */}
        {result && (
          <ImportResultCard
            type={result.type}
            result={result.data}
          />
        )}
      </div>
    </main>
  );
}

type ImportCardProps = {
  title: string;
  description: string;
  file: File | null;
  loading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
};

function ImportCard({
  title,
  description,
  file,
  loading,
  onFileChange,
  onImport,
}: ImportCardProps) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_10px_40px_rgba(120,70,70,0.08)] backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 px-4 text-center transition hover:border-rose-300 hover:bg-rose-50">
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
          ↑
        </div>

        <p className="text-sm font-medium text-slate-800">
          Choose CSV file
        </p>

        <p className="mt-1 text-xs text-slate-500">
          CSV files only
        </p>
      </label>

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {file.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>

          <span className="ml-3 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Ready
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={!file || loading}
        onClick={onImport}
        className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Importing..." : `Import ${title.replace(" Import", "")}`}
      </button>
    </section>
  );
}

type ImportResultCardProps = {
  type: ImportType;
  result: ImportResult;
};

function ImportResultCard({
  type,
  result,
}: ImportResultCardProps) {
  const label = type === "lenders" ? "Lenders" : "Leads";

  return (
    <section className="mt-6 rounded-3xl border border-green-200 bg-green-50/70 p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-green-600">
          Import completed
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          {label} import result
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultStat
          label="Processed"
          value={result.rowsProcessed}
        />

        <ResultStat
          label="Inserted"
          value={result.inserted}
        />

        <ResultStat
          label="Existing skipped"
          value={result.skippedExisting}
        />

        <ResultStat
          label="Duplicates skipped"
          value={result.skippedDuplicateInFile}
        />
      </div>
    </section>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}