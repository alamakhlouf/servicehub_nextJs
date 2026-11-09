"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { XIcon } from "./icon";

type DialogProps = { open: boolean; title: string; description?: string; onClose: () => void; children: React.ReactNode; className?: string };

export function Dialog({ open, title, description, onClose, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={cn("m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-surface p-0 text-text shadow-lg backdrop:bg-overlay", className)}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <h2 className="font-display text-lg font-bold" id={titleId}>{title}</h2>
          {description ? <p className="mt-1 text-sm text-text-muted" id={descriptionId}>{description}</p> : null}
        </div>
        <button aria-label="Close dialog" className="rounded-md p-1.5 text-text-muted hover:bg-surface-interactive hover:text-text" onClick={onClose} type="button">
          <XIcon className="size-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
