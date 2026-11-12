"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, Select } from "@/components/ui";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("returnTo"));
  const isSignup = mode === "signup";
  const [values, setValues] = useState({ name: "", email: "", password: "", role: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const alternatePath = isSignup ? "/login" : "/signup";
  const alternateHref = returnTo ? `${alternatePath}?returnTo=${encodeURIComponent(returnTo)}` : alternatePath;

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setServerError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (isSignup && values.name.trim().length < 2) nextErrors.name = "Enter your full name.";
    if (!values.email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (values.password.length < 8) nextErrors.password = isSignup ? "Use at least 8 characters." : "Enter your password.";
    if (isSignup && !values.role) nextErrors.role = "Choose an account type.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
        const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isSignup ? values : { email: values.email, password: values.password }) });
        const data = (await response.json()) as { error?: string; fieldErrors?: Record<string, string[]> };
        if (!response.ok) {
          setServerError(data.error ?? "Something went wrong. Please try again.");
          setErrors(Object.fromEntries(Object.entries(data.fieldErrors ?? {}).map(([key, messages]) => [key, messages[0] ?? ""])));
          return;
        }
        window.location.assign(returnTo ?? "/dashboard/profile");
    } catch {
        setServerError("We couldn't reach ServiceHub. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {returnTo ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-blue-100">
          <span aria-hidden="true" className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" />
          <p>Sign in to continue to <span className="font-semibold text-white">{destinationLabel(returnTo)}</span>.</p>
        </div>
      ) : null}
      <Card className="p-5 shadow-md sm:p-7">
        <div className="mb-7">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-[1.75rem]">
            {isSignup ? "Create your ServiceHub account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {isSignup ? "One account for local services, supplies, and workshops." : "Sign in to pick up where you left off."}
          </p>
        </div>

        {serverError ? <div aria-live="polite" className="mb-5 rounded-md border border-error/50 bg-error/10 px-4 py-3 text-sm leading-6 text-red-100" role="alert">{serverError}</div> : null}

        <form className="grid gap-4" noValidate onSubmit={submit}>
          {isSignup ? (
            <Input autoComplete="name" error={errors.name} label="Full name" name="name" onChange={(event) => update("name", event.target.value)} value={values.name} />
          ) : null}
          <Input autoComplete="email" error={errors.email} label="Email address" name="email" onChange={(event) => update("email", event.target.value)} type="email" value={values.email} />
          {isSignup ? (
            <Select error={errors.role} hint="This sets the actions available in your account." label="Account type" name="role" onChange={(event) => update("role", event.target.value)} value={values.role}>
              <option disabled value="">Choose an account type</option>
              <option value="CUSTOMER">Customer — find and book services</option>
              <option value="PROVIDER">Provider — offer local services</option>
              <option value="SUPPLIER">Supplier — list useful products</option>
            </Select>
          ) : null}
          <div className="relative">
            <Input autoComplete={isSignup ? "new-password" : "current-password"} error={errors.password} hint={isSignup ? "At least 8 characters." : undefined} label="Password" name="password" onChange={(event) => update("password", event.target.value)} type={showPassword ? "text" : "password"} value={values.password} />
            <button aria-pressed={showPassword} className="absolute right-2 top-7 rounded px-2 py-1 text-xs font-semibold text-text-muted hover:text-text" onClick={() => setShowPassword((current) => !current)} type="button">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <Button className="mt-2 w-full" loading={loading} size="lg" type="submit">{isSignup ? "Create account" : "Sign in"}</Button>
        </form>

        {!isSignup ? <p className="mt-4 text-center text-sm"><Link className="font-semibold text-blue-300 underline" href="/forgot-password">Forgot your password?</Link></p> : null}
        <p className="mt-6 text-center text-sm text-text-muted">
          {isSignup ? "Already have an account?" : "New to ServiceHub?"}{" "}
          <Link className="font-semibold text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200" href={alternateHref}>
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </Card>
      <p className="mt-5 text-center text-xs leading-5 text-text-subtle">Your role shapes the tools you can use. You can browse the marketplace without an account.</p>
    </div>
  );
}

function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function destinationLabel(path: string) {
  const segment = path.split("/").filter(Boolean).pop();
  if (!segment) return "the marketplace";
  return segment.replace(/[-_]/g, " ");
}
