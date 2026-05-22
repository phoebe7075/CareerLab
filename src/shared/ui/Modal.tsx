import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Button } from "./Button";

type ModalProps = {
  children: ReactNode;
  confirmOnEnter?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  open: boolean;
  size?: "md" | "wide";
  title: string;
};

export function Modal({
  children,
  confirmOnEnter = false,
  onClose,
  onConfirm,
  open,
  size = "md",
  title
}: ModalProps) {
  if (!open) {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (!confirmOnEnter || !onConfirm || event.key !== "Enter") {
      return;
    }

    if (isInteractiveTarget(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onConfirm();
  }

  return (
    <div
      aria-label={title}
      aria-modal="true"
      autoFocus
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 py-6"
      onKeyDown={handleKeyDown}
      role="dialog"
      tabIndex={-1}
    >
      <div
        className={cn(
          "flex max-h-[min(760px,90svh)] w-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl",
          size === "wide" ? "max-w-5xl" : "max-w-2xl"
        )}
      >
        <div className="shrink-0 border-b border-zinc-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
            <Button aria-label="닫기" onClick={onClose} size="sm" variant="ghost">
              닫기
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function isInteractiveTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("button,input,select,textarea,a,[contenteditable='true']")
  );
}
