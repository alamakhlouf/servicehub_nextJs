import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export default function ForgotPasswordPage() {
  return <AuthShell><PasswordResetRequestForm /></AuthShell>;
}
