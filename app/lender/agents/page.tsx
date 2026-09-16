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
        err instanceof Error
          ? err.message
          : "Failed to load agents"
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

  return (
    <main className="min-h-screen bg-[#fff8f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/lender"
              className="text-sm font-medium text-rose-500 hover:text-rose-600"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-2 text-2xl font-bold text-zinc-900">
              Manage Agents
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              View and invite agents for your lender.
            </p>
          </div>

          <Button
            onClick={() => {
              setShowInviteForm((current) => !current);
              setError("");
              setSuccess("");
              setInviteLink("");
            }}
          >
            {showInviteForm ? "Close" : "+ Invite Agent"}
          </Button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <GlassCard>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Invite Lender Agent
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Send an invitation to a new lender agent.
                </p>
              </div>

              <form
                onSubmit={handleInvite}
                className="flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <Input
                    type="email"
                    name="email"
                    placeholder="agent@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={inviting}>
                  {inviting ? "Sending..." : "Create Invite"}
                </Button>
              </form>

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {inviteLink && (
                <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-zinc-800">
                    Invite Link
                  </p>

                  <div className="break-all rounded-lg bg-white p-3 text-sm text-zinc-700">
                    {inviteLink}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteLink);
                      setSuccess("Invite link copied.");
                    }}
                    className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Copy Invite Link
                  </button>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Error */}
        {error && !showInviteForm && (
          <GlassCard>
            <div className="text-sm text-red-600">
              {error}
            </div>
          </GlassCard>
        )}

        {/* Agents */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Agents
            </h2>

            <span className="text-sm text-zinc-500">
              {agents.length} total
            </span>
          </div>

          {loading ? (
            <GlassCard>
              <p className="text-sm text-zinc-500">
                Loading agents...
              </p>
            </GlassCard>
          ) : agents.length === 0 ? (
            <GlassCard>
              <div className="py-6 text-center">
                <p className="font-medium text-zinc-800">
                  No agents found
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Invite your first lender agent to get started.
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {agents.map((agent) => (
                <GlassCard key={agent._id}>
                  <div className="flex items-start justify-between gap-4">
  <div className="min-w-0">
    <h3 className="truncate font-semibold text-zinc-900">
      {agent.name || "Unnamed Agent"}
    </h3>

    <p className="mt-1 break-all text-sm text-zinc-500">
      {agent.email}
    </p>

    {agent.createdAt && (
      <p className="mt-2 text-xs text-zinc-400">
        Joined{" "}
        {new Date(agent.createdAt).toLocaleDateString()}
      </p>
    )}

    <button
      type="button"
      onClick={() => handleRemoveAgent(agent._id)}
      disabled={removingAgentId === agent._id}
      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {removingAgentId === agent._id
        ? "Removing..."
        : "Remove Agent"}
    </button>
  </div>

  <Badge
    variant={agent.isActive ? "success" : "neutral"}
  >
    {agent.isActive ? "Active" : "Inactive"}
  </Badge>
</div>
                </GlassCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}