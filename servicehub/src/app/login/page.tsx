import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return <AuthShell><Suspense fallback={null}><AuthForm mode="login" /></Suspense></AuthShell>;
}
