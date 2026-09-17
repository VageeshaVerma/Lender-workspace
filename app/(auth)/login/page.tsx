"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to login");
        return;
      }
      if (!data.user) {
        setError("Login succeeded but user information was not returned.");
        return;
      }
      switch (data.user.role) {
        case "super_admin":
          router.push("/super-admin");
          break;
        case "lender_agent":
        case "lender_admin":
          router.push("/lender");
          break;
        case "ops_admin":
          router.push("/admin");
          break;
        default:
          router.push("/");
      }
      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--blush)]/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[var(--coral)]/20 blur-3xl"
        aria-hidden="true"
      />
      <GlassCard className="relative z-10 w-full max-w-md p-7 sm:p-9">
        <div className="text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--coral-dark)]"
          >
            Lender Workspace
          </Link>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Sign in to manage your lending workspace.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input label="Email" name="email" type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required/>
          <Input label="Password" name="password" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required/>
          {error && (
            <div
              role="alert"
              className="rounded-2xl bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
            >
              {error}
            </div>
          )}
          <Button
            type="submit"
            variant="coral"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </GlassCard>
    </main>
  );
}