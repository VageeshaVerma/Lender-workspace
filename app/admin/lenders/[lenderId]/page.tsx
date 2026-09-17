import Link from "next/link";
import { cookies } from "next/headers";
import LenderStatusToggle from "@/components/admin/LenderStatusToggle";
import LenderConfigurationForm from "@/components/admin/LenderConfigurationForm";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import InviteLenderAdmin from "@/components/admin/InviteLenderAdmin";
type Agent = {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt?: string;
};

type Lender = {
  lender_id: string;
  name: string;
  isActive: boolean;
  priority: number | null;

  flow?: string | null;

  minAge?: number | null;
  maxAge?: number | null;
  minIncome?: number | null;

  minCreditScore_exclusive?: number | null;
  maxCreditScore_inclusive?: number | null;

  // Existing DB may contain strings,
  // while updated records may contain arrays.
  employmentTypes?: string[] | string | null;
  supportedPincodes?: string[] | string | null;

  maxLeadsPerDay?: number | null;

  // Existing DB may contain "true"/"false" strings,
  // while updated records use booleans.
  preflight?: boolean | string | null;
  leadOnly?: boolean | string | null;
  offerApproval?: boolean | string | null;
  canShowProvisionalOffer?: boolean | string | null;

  minAppVersion?: string | null;

  agents: Agent[];
  leadCount: number;
};

type PageProps = {
  params: Promise<{
    lenderId: string;
  }>;
};

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function AdminLenderDetailPage({
  params,
}: PageProps) {
  const { lenderId } = await params;

  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(
      (cookie) =>
        `${cookie.name}=${cookie.value}`
    )
    .join("; ");

  const baseUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

const response = await fetch(
  `${baseUrl}/api/admin/lenders/${encodeURIComponent(
    lenderId
  )}`,
  {
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  }
);

  if (response.status === 401) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-4 py-10">
        <div className="mx-auto max-w-lg">
          <GlassCard>
            <div className="py-8 text-center">
              <h1 className="text-xl font-bold text-slate-900">
                Session expired
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Please log in again.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-block rounded-xl bg-[#d86678] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Go to Login
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  if (response.status === 403) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-4 py-10">
        <div className="mx-auto max-w-lg">
          <GlassCard>
            <div className="py-8 text-center">
              <h1 className="text-xl font-bold text-slate-900">
                Access denied
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Only ops admins can manage lenders.
              </p>

              <Link
                href="/super-admin"
                className="mt-5 inline-block rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Back to Admin
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  if (response.status === 404) {
    return (
      <main className="min-h-screen bg-[#fff8f5] px-4 py-10">
        <div className="mx-auto max-w-lg">
          <GlassCard>
            <div className="py-8 text-center">
              <div className="mb-3 text-4xl">
                🏦
              </div>

              <h1 className="text-xl font-bold text-slate-900">
                Lender not found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                No lender exists with ID:
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {lenderId}
              </p>

              <Link
                href="/admin/lenders"
                className="mt-5 inline-block rounded-xl bg-[#d86678] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Back to Lenders
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  if (!response.ok) {
    throw new Error("Failed to load lender");
  }

  const data: {
    lender: Lender;
  } = await response.json();

  const lender = data.lender;

  return (
    <main className="min-h-screen bg-[#fff8f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-6">
          <Link
            href="/admin/lenders"
            className="text-sm font-medium text-[#c85c6f] hover:underline"
          >
            ← Back to Lenders
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {lender.name}
                </h1>

                <Badge
                  variant={
                    lender.isActive
                      ? "success"
                      : "neutral"
                  }
                >
                  {lender.isActive
                    ? "Active"
                    : "Inactive"}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {lender.lender_id}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
  <InviteLenderAdmin
    lenderId={lender.lender_id}
    lenderName={lender.name}
  />

  <LenderStatusToggle
    lenderId={lender.lender_id}
    initialIsActive={lender.isActive}
  />
</div>
          </div>
        </div>

        {/* Overview */}

        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard>
            <p className="text-sm text-slate-500">
              Total Agents
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {lender.agents.length}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-sm text-slate-500">
              Total Leads
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {lender.leadCount}
            </p>
          </GlassCard>

          <GlassCard>
            <p className="text-sm text-slate-500">
              Priority
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {lender.priority ?? "—"}
            </p>
          </GlassCard>
        </div>

        {/* Lender Configuration */}

        <div className="mt-4">
          <LenderConfigurationForm
            lender={{
              lenderId: lender.lender_id,

              priority: lender.priority,

              flow: lender.flow ?? null,

              minAge: lender.minAge ?? null,

              maxAge: lender.maxAge ?? null,

              minIncome: lender.minIncome ?? null,

              minCreditScore_exclusive:
                lender.minCreditScore_exclusive ??
                null,

              maxCreditScore_inclusive:
                lender.maxCreditScore_inclusive ??
                null,

              employmentTypes:
                lender.employmentTypes ?? null,

              supportedPincodes:
                lender.supportedPincodes ?? null,

              maxLeadsPerDay:
                lender.maxLeadsPerDay ?? null,

              preflight:
                lender.preflight ?? null,

              leadOnly:
                lender.leadOnly ?? null,

              minAppVersion:
                lender.minAppVersion ?? null,

              offerApproval:
                lender.offerApproval ?? null,

              canShowProvisionalOffer:
                lender.canShowProvisionalOffer ??
                null,
            }}
          />
        </div>

        {/* Agents */}

        <div className="mt-4">
          <GlassCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Lender Agents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Agents belonging to {lender.name}.
                </p>
              </div>

              <button
                type="button"
                disabled
                className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
              >
                + Invite Agent
              </button>
            </div>

            {lender.agents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  No agents have been added yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {lender.agents.map((agent) => (
                  <div
                    key={agent._id}
                    className="flex flex-col gap-3 rounded-xl bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {agent.name}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {agent.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Joined{" "}
                        {formatDate(
                          agent.createdAt
                        )}
                      </p>
                    </div>

                    <Badge
                      variant={
                        agent.isActive
                          ? "success"
                          : "neutral"
                      }
                    >
                      {agent.isActive
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

