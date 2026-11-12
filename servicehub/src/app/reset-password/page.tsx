import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ResetPasswordPage() {
  return <AuthShell><Suspense fallback={null}><PasswordResetForm /></Suspense></AuthShell>;
}
