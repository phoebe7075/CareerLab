import { useEffect } from "react";

import { Button } from "./Button";

const DEFAULT_TOAST_DURATION_MS = 5000;

export type ToastMessage = {
  durationMs?: number;
  id: string;
  title: string;
  description?: string;
};

type ToastViewportProps = {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
};

export function ToastViewport({ messages, onDismiss }: ToastViewportProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2"
    >
      {messages.map((message) => (
        <ToastItem
          key={message.id}
          message={message}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function ToastItem({
  message,
  onDismiss
}: {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const durationMs = message.durationMs ?? DEFAULT_TOAST_DURATION_MS;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(message.id);
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, message.id, onDismiss]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-950">{message.title}</p>
            {message.description ? (
              <p className="mt-1 text-sm leading-5 text-zinc-600">
                {message.description}
              </p>
            ) : null}
          </div>
          <Button
            aria-label={`${message.title} 알림 닫기`}
            onClick={() => onDismiss(message.id)}
            size="sm"
            variant="ghost"
          >
            닫기
          </Button>
        </div>
      </div>
      <div
        aria-label={`${message.title} 알림 자동 닫힘 타이머`}
        className="h-1 bg-zinc-100"
        role="timer"
      >
        <div
          className="toast-progress-bar h-full bg-zinc-400"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  );
}
