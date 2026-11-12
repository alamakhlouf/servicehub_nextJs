"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage(""); setResetUrl("");
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json() as { error?: string; message?: string; resetUrl?: string };
      if (!response.ok) { setError(data.error ?? "Unable to request a password reset."); return; }
      setMessage(data.message ?? "Check your email for reset instructions.");
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch { setError("We couldn't reach ServiceHub. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  return <Card className="w-full max-w-md p-5 shadow-md sm:p-7"><h1 className="font-display text-2xl font-bold">Forgot your password?</h1><p className="mt-2 text-sm leading-6 text-text-muted">Enter your email and we&apos;ll send instructions to reset your password.</p>{message ? <p aria-live="polite" className="mt-5 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-blue-100" role="status">{message}{resetUrl ? <><br /><Link className="mt-2 inline-block underline" href={resetUrl}>Open reset link (development)</Link></> : null}</p> : null}{error ? <p className="mt-5 text-sm text-red-200" role="alert">{error}</p> : null}<form className="mt-6 grid gap-4" onSubmit={submit}><Input autoComplete="email" label="Email address" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /><Button loading={loading} type="submit">Send reset instructions</Button></form><p className="mt-6 text-center text-sm text-text-muted"><Link className="font-semibold text-blue-300 underline" href="/login">Back to sign in</Link></p></Card>;
}
