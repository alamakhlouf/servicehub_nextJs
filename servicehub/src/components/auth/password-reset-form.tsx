"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";

export function PasswordResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(data.error ?? "Unable to reset your password."); return; }
      setMessage(data.message ?? "Your password was reset.");
    } catch { setError("We couldn't reach ServiceHub. Check your connection and try again."); }
    finally { setLoading(false); }
  }
  return <Card className="w-full max-w-md p-5 shadow-md sm:p-7"><h1 className="font-display text-2xl font-bold">Reset your password</h1>{message ? <div className="mt-5 space-y-3"><p aria-live="polite" className="text-sm text-emerald-300" role="status">{message}</p><Link className="inline-block text-sm font-semibold text-blue-300 underline" href="/login">Sign in</Link></div> : <form className="mt-6 grid gap-4" onSubmit={submit}><Input autoComplete="new-password" label="New password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /><Input autoComplete="new-password" label="Confirm new password" minLength={8} name="confirmation" onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} />{error ? <p className="text-sm text-red-200" role="alert">{error}</p> : null}<Button loading={loading} type="submit">Reset password</Button></form>}</Card>;
}
