"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Agent = {
_id: string;
name: string;
email: string;
isActive: boolean;
createdAt?: string;
};

export default function LenderAgentsPage() {
const [agents, setAgents] = useState<Agent[]>([]);
const [loading, setLoading] = useState(true);
const [removingAgentId, setRemovingAgentId] = useState<string | null>(null);

const [showInviteForm, setShowInviteForm] = useState(false);
const [email, setEmail] = useState("");
const [inviting, setInviting] = useState(false);
const [inviteLink, setInviteLink] = useState("");

const [error, setError] = useState("");
const [success, setSuccess] = useState("");

async function loadAgents() {
try {
setLoading(true);
setError("");


  const response = await fetch("/api/lender/agents", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (response.status === 403) {
    setError("You do not have permission to view lender agents.");
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch agents");
  }

  setAgents(data.agents || []);
} catch (err) {
  console.error(err);

  setError(
    err instanceof Error ? err.message : "Failed to load agents"
  );
} finally {
  setLoading(false);
}


}

useEffect(() => {
loadAgents();
}, []);

async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();


setError("");
setSuccess("");
setInviteLink("");

if (!email.trim()) {
  setError("Email is required.");
  return;
}

try {
  setInviting(true);

  const response = await fetch("/api/auth/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      role: "lender_agent",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create invitation");
  }

  setSuccess("Invitation created successfully.");
  setInviteLink(data.inviteLink || "");
  setEmail("");

  await loadAgents();
} catch (err) {
  console.error(err);

  setError(
    err instanceof Error
      ? err.message
      : "Failed to create invitation"
  );
} finally {
  setInviting(false);
}


}

async function handleRemoveAgent(agentId: string) {
const confirmed = window.confirm(
"Are you sure you want to remove this agent?"
);


if (!confirmed) {
  return;
}

try {
  setRemovingAgentId(agentId);
  setError("");
  setSuccess("");

  const response = await fetch(
    `/api/lender/agents/${agentId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to remove agent"
    );
  }

  setAgents((currentAgents) =>
    currentAgents.filter(
      (agent) => agent._id !== agentId
    )
  );

  setSuccess("Agent removed successfully.");
} catch (err) {
  console.error("Remove agent error:", err);

  setError(
    err instanceof Error
      ? err.message
      : "Failed to remove agent"
  );
} finally {
  setRemovingAgentId(null);
}


}

return ( <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"> <div className="mx-auto max-w-6xl space-y-6">


    {/* Header */}
    <section className="lender-card overflow-hidden">
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">
            <Link
              href="/lender"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--coral-dark)]"
            >
              <span className="text-base">←</span>
              Back to Dashboard
            </Link>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-lg font-bold text-[var(--coral-dark)]">
                A
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral-dark)]">
                  Team Management
                </p>

                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                  Manage Agents
                </h1>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Manage the lender agents responsible for handling assigned leads.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setShowInviteForm((current) => !current);
              setError("");
              setSuccess("");
              setInviteLink("");
            }}
          >
            {showInviteForm ? "Close Invite" : "+ Invite Agent"}
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-black/5 pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--background)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Total Agents
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {agents.length}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--background)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Active
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--success)]">
              {agents.filter((agent) => agent.isActive).length}
            </p>
          </div>

          <div className="col-span-2 rounded-xl bg-[var(--background)] p-4 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Team Status
            </p>

            <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
              {agents.length > 0
                ? "Team is operational"
                : "No agents added yet"}
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Invite Form */}
    {showInviteForm && (
      <section className="overflow-hidden rounded-2xl border border-[var(--blush)] bg-[var(--soft-rose)] shadow-[var(--shadow-card)]">
        <div className="p-5 sm:p-6">

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--coral-dark)] shadow-sm">
              +
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
                Team Access
              </p>

              <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                Invite a lender agent
              </h2>

              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                Create an invitation link for a new agent to join your lender team.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleInvite}
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Agent email
              </label>

              <Input
                type="email"
                name="email"
                placeholder="agent@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={inviting}
            >
              {inviting ? "Creating..." : "Create Invite"}
            </Button>
          </form>

          {success && (
            <div className="mt-4 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/10 p-3 text-sm font-medium text-[var(--success)]">
              {success}
            </div>
          )}

          {inviteLink && (
            <div className="mt-4 rounded-2xl border border-[var(--blush)] bg-white/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Invitation Link
                  </p>

                  <p className="mt-2 break-all rounded-xl bg-[var(--background)] p-3 font-mono text-xs text-[var(--text-secondary)]">
                    {inviteLink}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteLink);
                    setSuccess("Invite link copied.");
                  }}
                  className="shrink-0 rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-3 text-sm font-medium text-[var(--danger)]">
              {error}
            </div>
          )}
        </div>
      </section>
    )}

    {/* Global Error */}
    {error && !showInviteForm && (
      <section className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4">
        <p className="text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      </section>
    )}

    {/* Success */}
    {success && !showInviteForm && (
      <section className="rounded-2xl border border-[var(--success)]/20 bg-[var(--success)]/10 p-4">
        <p className="text-sm font-medium text-[var(--success)]">
          {success}
        </p>
      </section>
    )}

    {/* Agent Section */}
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral-dark)]">
            Lender Team
          </p>

          <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
            Agents
          </h2>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Agents available for lead assignment and customer follow-up.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[var(--glass-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-sm">
          {agents.length} total
        </span>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">

          {[1, 2].map((item) => (
            <div
              key={item}
              className="lender-card animate-pulse p-5"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-black/5" />

                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 rounded bg-black/5" />
                  <div className="h-3 w-48 rounded bg-black/5" />
                  <div className="h-3 w-24 rounded bg-black/5" />
                </div>
              </div>
            </div>
          ))}

        </div>
      ) : agents.length === 0 ? (

        /* Empty State */
        <div className="lender-card p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-xl font-bold text-[var(--coral-dark)]">
            +
          </div>

          <h3 className="mt-5 text-base font-bold text-[var(--text-primary)]">
            No agents yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
            Your lender team does not have any agents yet. Invite an agent to start assigning and managing leads.
          </p>

          <button
            type="button"
            onClick={() => {
              setShowInviteForm(true);
              setError("");
              setSuccess("");
              setInviteLink("");
            }}
            className="mt-5 rounded-xl bg-[var(--text-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + Invite First Agent
          </button>
        </div>

      ) : (

        /* Agent Cards */
        <div className="grid gap-4 md:grid-cols-2">

          {agents.map((agent) => (
            <article
              key={agent._id}
              className="lender-card group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <div className="p-5 sm:p-6">

                <div className="flex items-start justify-between gap-4">

                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft-rose)] text-base font-bold text-[var(--coral-dark)]">
                      {agent.name?.charAt(0).toUpperCase() || "A"}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-[var(--text-primary)]">
                        {agent.name || "Unnamed Agent"}
                      </h3>

                      <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">
                        {agent.email}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={agent.isActive ? "success" : "neutral"}
                  >
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black/5 pt-5">

                  <div className="rounded-xl bg-[var(--background)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Role
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      Lender Agent
                    </p>
                  </div>

                  <div className="rounded-xl bg-[var(--background)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Joined
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {agent.createdAt
                        ? new Date(
                            agent.createdAt
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between gap-3">

                  <div className="text-xs text-[var(--text-muted)]">
                    {agent.isActive
                      ? "Available for lead assignment"
                      : "Currently inactive"}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveAgent(agent._id)
                    }
                    disabled={
                      removingAgentId === agent._id
                    }
                    className="shrink-0 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-3.5 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)]/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingAgentId === agent._id
                      ? "Removing..."
                      : "Remove Agent"}
                  </button>

                </div>
              </div>

              <div className="h-1 w-full bg-[var(--soft-rose)] opacity-0 transition group-hover:opacity-100" />
            </article>
          ))}

        </div>
      )}
    </section>
  </div>
</main>


);
}
