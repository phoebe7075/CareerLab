import { useEffect, useState } from "react";

import { Button } from "./Button";

export type PageGuideStep = {
  body: string;
  target: string;
  title: string;
};

type TargetRect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type PageGuideOverlayProps = {
  onClose: () => void;
  onDismiss: () => void;
  open: boolean;
  steps: PageGuideStep[];
};

const GUIDE_VIEWPORT_TOP_PADDING = 88;
const GUIDE_VIEWPORT_BOTTOM_PADDING = 24;

export function PageGuideOverlay({
  onClose,
  onDismiss,
  open,
  steps
}: PageGuideOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const safeStepIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const activeStep = steps[safeStepIndex];

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setStepIndex(0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, steps]);

  useEffect(() => {
    if (!open || !activeStep) {
      return;
    }

    let frame = 0;

    function updateTargetRect() {
      const target = document.querySelector<HTMLElement>(activeStep.target);
      const currentRect = target?.getBoundingClientRect();

      if (
        currentRect &&
        shouldScrollTargetIntoView(currentRect) &&
        typeof target?.scrollIntoView === "function"
      ) {
        target.scrollIntoView({
          block: "nearest",
          inline: "nearest"
        });
      }

      frame = window.requestAnimationFrame(() => {
        const rect = target?.getBoundingClientRect();

        setTargetRect(
          rect
            ? {
                bottom: rect.bottom,
                height: rect.height,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                width: rect.width
              }
            : null
        );
      });
    }

    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [activeStep, open]);

  if (!open || !activeStep) {
    return null;
  }

  const panelPosition = getPanelPosition(targetRect);
  const spotlightRect = getSpotlightRect(targetRect);
  const isFirstStep = safeStepIndex === 0;
  const isLastStep = safeStepIndex === steps.length - 1;
  const closeFromStart = () => {
    setStepIndex(0);
    onClose();
  };
  const dismissFromStart = () => {
    setStepIndex(0);
    onDismiss();
  };

  return (
    <div
      aria-label="페이지 가이드"
      aria-modal="true"
      className="pointer-events-none fixed inset-0 z-40"
      role="dialog"
    >
      <SpotlightBackdrop targetRect={spotlightRect} />
      <div
        className="pointer-events-auto fixed z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-4 shadow-xl"
        style={panelPosition}
      >
        <div className="text-xs font-medium text-blue-700">
          {safeStepIndex + 1}/{steps.length}
        </div>
        <h3 className="mt-1 text-base font-semibold text-zinc-950">
          {activeStep.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{activeStep.body}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button onClick={dismissFromStart} size="sm">
            다시 표시하지 않음
          </Button>
          <div className="flex gap-2">
            <Button onClick={closeFromStart} size="sm">
              닫기
            </Button>
            <Button
              disabled={isFirstStep}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              size="sm"
            >
              이전
            </Button>
            <Button
              onClick={() => {
                if (isLastStep) {
                  closeFromStart();
                  return;
                }
                setStepIndex((current) => Math.min(steps.length - 1, current + 1));
              }}
              size="sm"
              variant="primary"
            >
              {isLastStep ? "완료" : "다음"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpotlightBackdrop({ targetRect }: { targetRect: TargetRect | null }) {
  const overlayClass = "pointer-events-auto fixed z-40 bg-zinc-950/20";

  if (!targetRect) {
    return <div aria-hidden="true" className={`${overlayClass} inset-0`} />;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={overlayClass}
        style={{
          height: targetRect.top,
          left: 0,
          top: 0,
          width: "100vw"
        }}
      />
      <div
        aria-hidden="true"
        className={overlayClass}
        style={{
          height: targetRect.height,
          left: 0,
          top: targetRect.top,
          width: targetRect.left
        }}
      />
      <div
        aria-hidden="true"
        className={overlayClass}
        style={{
          height: targetRect.height,
          left: targetRect.right,
          top: targetRect.top,
          width: Math.max(window.innerWidth - targetRect.right, 0)
        }}
      />
      <div
        aria-hidden="true"
        className={overlayClass}
        style={{
          height: Math.max(window.innerHeight - targetRect.bottom, 0),
          left: 0,
          top: targetRect.bottom,
          width: "100vw"
        }}
      />
    </>
  );
}

function getSpotlightRect(targetRect: TargetRect | null): TargetRect | null {
  if (!targetRect) {
    return null;
  }

  const padding = 8;
  const left = Math.max(targetRect.left - padding, 0);
  const top = Math.max(targetRect.top - padding, 0);
  const right = Math.min(targetRect.right + padding, window.innerWidth);
  const bottom = Math.min(targetRect.bottom + padding, window.innerHeight);

  return {
    bottom,
    height: Math.max(bottom - top, 0),
    left,
    right,
    top,
    width: Math.max(right - left, 0)
  };
}

function shouldScrollTargetIntoView(rect: DOMRect | TargetRect) {
  const topLimit = GUIDE_VIEWPORT_TOP_PADDING;
  const bottomLimit = window.innerHeight - GUIDE_VIEWPORT_BOTTOM_PADDING;
  const comfortableHeight = Math.max(
    window.innerHeight - GUIDE_VIEWPORT_TOP_PADDING - GUIDE_VIEWPORT_BOTTOM_PADDING,
    0
  );

  if (rect.height >= comfortableHeight) {
    return rect.bottom <= topLimit || rect.top >= bottomLimit;
  }

  return rect.top < topLimit || rect.bottom > bottomLimit;
}

function getPanelPosition(targetRect: TargetRect | null) {
  if (!targetRect) {
    return {
      left: "1rem",
      top: "6rem"
    };
  }

  const panelWidth = Math.min(360, window.innerWidth - 32);
  const preferredTop = targetRect.bottom + 16;
  const bottomAlignedTop = targetRect.top - 220;
  const top =
    preferredTop + 220 < window.innerHeight
      ? preferredTop
      : Math.max(16, bottomAlignedTop);
  const left = Math.min(
    Math.max(16, targetRect.left),
    Math.max(16, window.innerWidth - panelWidth - 16)
  );

  return {
    left,
    top
  };
}
