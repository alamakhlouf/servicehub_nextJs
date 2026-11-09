import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icon";

type FieldProps = { label: string; error?: string; hint?: string; className?: string };

export function Input({ label, error, hint, className, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const fieldId = id ?? props.name ?? generatedId;
  return (
    <FieldWrapper fieldId={fieldId} label={label} error={error} hint={hint} htmlFor={fieldId} className={className}>
      <input aria-describedby={describedBy(fieldId, error, hint)} aria-invalid={Boolean(error)} id={fieldId} className={fieldClass(error)} {...props} />
    </FieldWrapper>
  );
}

export function Select({ label, error, hint, className, id, children, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId();
  const fieldId = id ?? props.name ?? generatedId;
  return (
    <FieldWrapper fieldId={fieldId} label={label} error={error} hint={hint} htmlFor={fieldId} className={className}>
      <span className="relative block">
        <select aria-describedby={describedBy(fieldId, error, hint)} aria-invalid={Boolean(error)} id={fieldId} className={cn(fieldClass(error), "appearance-none pr-10")} {...props}>
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
      </span>
    </FieldWrapper>
  );
}

export function Textarea({ label, error, hint, className, id, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const fieldId = id ?? props.name ?? generatedId;
  return (
    <FieldWrapper fieldId={fieldId} label={label} error={error} hint={hint} htmlFor={fieldId} className={className}>
      <textarea aria-describedby={describedBy(fieldId, error, hint)} aria-invalid={Boolean(error)} id={fieldId} className={cn(fieldClass(error), "min-h-28 resize-y py-3")} {...props} />
    </FieldWrapper>
  );
}

function FieldWrapper({ fieldId, label, error, hint, htmlFor, className, children }: FieldProps & { fieldId: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-xs font-semibold text-text-muted" htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p className="text-xs text-error" id={`${fieldId}-error`} role="alert">{error}</p> : hint ? <p className="text-xs text-text-subtle" id={`${fieldId}-hint`}>{hint}</p> : null}
    </div>
  );
}

function describedBy(fieldId: string, error?: string, hint?: string) {
  return error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
}

function fieldClass(error?: string) {
  return cn(
    "w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text transition-colors placeholder:text-text-subtle focus:border-primary focus:bg-surface-elevated focus:outline-none",
    error ? "border-error" : "border-border",
  );
}
