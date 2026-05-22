import { useState } from "react";

import type { CareerLabEntities } from "../../data/schema";
import { formatPromptTemplateType } from "../../shared/lib/promptLabels";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import {
  getDashboardStats,
  type PromptTemplateUsageRow
} from "./dashboardStats";

type DashboardPageProps = {
  entities: CareerLabEntities;
  onNavigate?: (pageId: string) => void;
  onResetSampleData?: () => Promise<void>;
  sampleResetAvailable?: boolean;
};

const donutColors = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#52525b"
];

export function DashboardPage({
  entities,
  onNavigate,
  onResetSampleData,
  sampleResetAvailable = false
}: DashboardPageProps) {
  const stats = getDashboardStats(entities);
  const [activePromptType, setActivePromptType] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const canResetSample = sampleResetAvailable && Boolean(onResetSampleData);

  async function handleConfirmSampleReset() {
    if (!onResetSampleData) {
      return;
    }

    setResetBusy(true);
    try {
      await onResetSampleData();
      setResetConfirmOpen(false);
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <section className="space-y-7 px-6 py-6 max-sm:px-4">
      <section className="px-1 py-2" data-page-guide="dashboard-overview">
        <h3 className="text-2xl font-semibold text-zinc-950">작업공간 개요</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          프로젝트, 경력기술서, 자기소개서, 프롬프트 센터에서 바로 판단할
          통계만 모아봅니다.
        </p>
      </section>

      {canResetSample ? (
        <section
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
          data-page-guide="dashboard-sample-reset"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-blue-950">
                공개 데모 샘플
              </h4>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                이 브라우저에서 수정한 내용만 초기 샘플 데이터로 되돌립니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {resetConfirmOpen ? (
                <>
                  <Button
                    disabled={resetBusy}
                    onClick={() => void handleConfirmSampleReset()}
                    size="sm"
                    variant="softDanger"
                  >
                    리셋 확인
                  </Button>
                  <Button
                    disabled={resetBusy}
                    onClick={() => setResetConfirmOpen(false)}
                    size="sm"
                    variant="secondary"
                  >
                    취소
                  </Button>
                </>
              ) : (
                <Button
                  disabled={resetBusy}
                  onClick={() => setResetConfirmOpen(true)}
                  size="sm"
                  variant="secondary"
                >
                  초기 샘플로 되돌리기
                </Button>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section
        className="rounded-lg border border-zinc-200 bg-white p-5"
        data-page-guide="dashboard-project"
      >
        <SectionHeader
          actionLabel="프로젝트 열기"
          badge={`${stats.project.rows.length}개 프로젝트`}
          description="프로젝트별 업무 수, 최근 수정 순서, 평균 활용 점수, 기간 미입력 상태를 봅니다."
          onAction={onNavigate ? () => onNavigate("work-projects") : undefined}
          title="프로젝트 통계"
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <MetricList
            emptyLabel="등록된 프로젝트가 없습니다."
            rows={stats.project.rows.map((project) => ({
              label: project.name,
              value: `${project.workItemCount}개`
            }))}
            title="프로젝트별 업무 수"
          />
          <MetricList
            emptyLabel="수정 이력이 있는 프로젝트가 없습니다."
            rows={stats.project.rows.map((project) => ({
              label: project.name,
              value: formatDate(project.latestActivity)
            }))}
            title="최근 수정 프로젝트"
          />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <MetricList
            emptyLabel="점수가 있는 프로젝트 업무가 없습니다."
            rows={stats.project.rows.map((project) => ({
              label: project.name,
              value:
                project.averageUseScore === null
                  ? "점수 없음"
                  : `${project.averageUseScore}점`
            }))}
            title="프로젝트 평균 활용 점수"
          />
          <MetricList
            emptyLabel="기간 미입력 프로젝트가 없습니다."
            rows={stats.project.rows
              .filter((project) => project.periodMissing)
              .map((project) => ({
                label: project.name,
                value: "기간 없음"
              }))}
            summary={`${stats.project.periodMissingCount}개`}
            title="기간 미입력 프로젝트"
          />
        </div>
      </section>

      <section
        className="rounded-lg border border-zinc-200 bg-white p-5"
        data-page-guide="dashboard-resume"
      >
        <SectionHeader
          actionLabel="경력기술서 Lab 열기"
          description="최종 확정, 사용 후보, 평가 완료 여부를 분리해서 봅니다."
          onAction={onNavigate ? () => onNavigate("resume-lab") : undefined}
          title="경력기술서 통계"
        />

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <StatNumber label="최종 확정" value={stats.resume.finalStatements} />
          <StatNumber label="사용 후보" value={stats.resume.usableStatements} />
          <ProgressMetric
            detail={`${stats.resume.evaluatedStatements}/${stats.resume.totalStatements}개 평가 완료`}
            label="평가 완료율"
            value={stats.resume.evaluationRate}
          />
        </div>
      </section>

      <section
        className="rounded-lg border border-zinc-200 bg-white p-5"
        data-page-guide="dashboard-essay"
      >
        <SectionHeader
          actionLabel="자기소개서 Lab 열기"
          description="문항별 목표 글자 수 범위에 들어온 답변 비율만 봅니다."
          onAction={onNavigate ? () => onNavigate("essay-lab") : undefined}
          title="자기소개서 통계"
        />

        <div className="mt-6 max-w-xl">
          <ProgressMetric
            detail={`${stats.essay.targetLengthMet}/${stats.essay.totalQuestions}개 문항 충족`}
            label="목표 글자 수 충족률"
            value={stats.essay.targetLengthRate}
          />
        </div>
      </section>

      <section
        className="rounded-lg border border-zinc-200 bg-white p-5"
        data-page-guide="dashboard-prompt"
      >
        <SectionHeader
          actionLabel="프롬프트 센터 열기"
          badge={`${stats.prompt.totalPrompts}개 이력`}
          description="저장된 프롬프트 이력을 템플릿 종류별 비율로 봅니다."
          onAction={onNavigate ? () => onNavigate("prompt-center") : undefined}
          title="프롬프트 센터 통계"
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <PromptUsageDonut
            activeTemplateType={activePromptType}
            onActiveChange={setActivePromptType}
            rows={stats.prompt.templateUsage}
            total={stats.prompt.totalPrompts}
          />

          {stats.prompt.templateUsage.length === 0 ? (
            <p className="self-center text-sm leading-6 text-zinc-500">
              저장된 프롬프트 이력이 없습니다.
            </p>
          ) : (
            <div className="space-y-4 self-center">
              {stats.prompt.templateUsage.map((usage, index) => (
                <div
                  className={`rounded-md p-2 transition ${
                    activePromptType === usage.templateType
                      ? "bg-zinc-50"
                      : "focus-within:bg-zinc-50 hover:bg-zinc-50"
                  }`}
                  key={usage.templateType}
                  onBlur={() => setActivePromptType(null)}
                  onFocus={() => setActivePromptType(usage.templateType)}
                  onMouseEnter={() => setActivePromptType(usage.templateType)}
                  onMouseLeave={() => setActivePromptType(null)}
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: getDonutColor(index) }}
                      />
                      <span className="min-w-0 truncate text-zinc-700">
                        {formatPromptTemplateType(usage.templateType)}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-zinc-950">
                      {usage.count}개 · {usage.ratio}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: getDonutColor(index),
                        width: `${usage.ratio}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function PromptUsageDonut({
  activeTemplateType,
  onActiveChange,
  rows,
  total
}: {
  activeTemplateType: string | null;
  onActiveChange: (templateType: string | null) => void;
  rows: PromptTemplateUsageRow[];
  total: number;
}) {
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const activeUsage =
    rows.find((usage) => usage.templateType === activeTemplateType) ?? null;
  const activeIndex = activeUsage ? rows.indexOf(activeUsage) : -1;
  const activeColor = activeIndex >= 0 ? getDonutColor(activeIndex) : "#71717a";
  const tooltipStyle =
    activeIndex >= 0 ? getDonutTooltipStyle(rows, total, activeIndex) : undefined;

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseLeave={() => onActiveChange(null)}
    >
      <svg
        aria-label="템플릿 종류별 사용량"
        className="size-48 overflow-visible"
        role="img"
        viewBox="0 0 176 176"
      >
        <circle
          cx="88"
          cy="88"
          fill="none"
          r={radius}
          stroke="#e4e4e7"
          strokeWidth={strokeWidth}
        />
        {rows.map((usage, index) => {
          const segmentLength =
            total > 0 ? (usage.count / total) * circumference : 0;
          const previousLength = rows
            .slice(0, index)
            .reduce(
              (sum, row) =>
                sum + (total > 0 ? (row.count / total) * circumference : 0),
              0
            );
          const gap = rows.length > 1 ? 3 : 0;
          const visibleLength = Math.max(segmentLength - gap, 0);
          const dashOffset = -previousLength;
          const active = activeTemplateType === usage.templateType;

          return (
            <circle
              aria-label={`${formatPromptTemplateType(usage.templateType)} ${
                usage.count
              }개 ${usage.ratio}%`}
              className={`cursor-pointer outline-none transition duration-150 ${
                active ? "opacity-100 drop-shadow-sm" : "opacity-80 hover:opacity-100"
              }`}
              cx="88"
              cy="88"
              fill="none"
              key={usage.templateType}
              onBlur={() => onActiveChange(null)}
              onFocus={() => onActiveChange(usage.templateType)}
              onMouseEnter={() => onActiveChange(usage.templateType)}
              r={radius}
              role="listitem"
              stroke={getDonutColor(index)}
              strokeDasharray={`${visibleLength} ${
                circumference - visibleLength
              }`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              strokeWidth={active ? strokeWidth + 4 : strokeWidth}
              tabIndex={0}
              transform="rotate(-90 88 88)"
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute grid size-24 place-items-center rounded-full bg-white text-center shadow-sm">
        <div>
          <p className="font-mono text-2xl font-semibold text-zinc-950">{total}</p>
          <p className="mt-1 text-xs text-zinc-500">프롬프트</p>
        </div>
      </div>

      {activeUsage ? (
        <div
          className="pointer-events-none absolute z-10 w-56 max-w-[calc(100vw-3rem)] rounded-md border border-l-4 bg-white px-3 py-2 text-left shadow-lg transition"
          role="tooltip"
          style={{
            ...tooltipStyle,
            borderColor: activeColor,
            borderLeftColor: activeColor
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
            <p className="truncate text-sm font-semibold text-zinc-950">
              {formatPromptTemplateType(activeUsage.templateType)}
            </p>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {activeUsage.count}개 이력 · 전체의 {activeUsage.ratio}%
          </p>
        </div>
      ) : null}
    </div>
  );
}

function getDonutTooltipStyle(
  rows: PromptTemplateUsageRow[],
  total: number,
  activeIndex: number
) {
  const chartSize = 192;
  const center = chartSize / 2;
  const tooltipRadius = 78;
  const previousCount = rows
    .slice(0, activeIndex)
    .reduce((sum, row) => sum + row.count, 0);
  const activeCount = rows[activeIndex]?.count ?? 0;
  const midRatio =
    total > 0 ? (previousCount + activeCount / 2) / total : 0;
  const angle = midRatio * Math.PI * 2 - Math.PI / 2;
  const x = center + Math.cos(angle) * tooltipRadius;
  const y = center + Math.sin(angle) * tooltipRadius;
  const onRightSide = x >= center;

  return {
    left: onRightSide ? `${x + 16}px` : `${x - 16}px`,
    top: `${Math.max(24, Math.min(chartSize - 24, y))}px`,
    transform: onRightSide ? "translateY(-50%)" : "translate(-100%, -50%)"
  };
}

function SectionHeader({
  actionLabel,
  badge,
  description,
  onAction,
  title
}: {
  actionLabel?: string;
  badge?: string;
  description: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
          {badge ? <Badge tone="neutral">{badge}</Badge> : null}
        </div>
        <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-zinc-600">
          {description}
        </p>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function MetricList({
  emptyLabel,
  rows,
  summary,
  title
}: {
  emptyLabel: string;
  rows: Array<{ label: string; value: string }>;
  summary?: string;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950">{title}</h4>
        {summary ? (
          <span className="shrink-0 font-mono text-sm text-zinc-500">
            {summary}
          </span>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-zinc-500">{emptyLabel}</p>
      ) : (
        <dl className="mt-3 divide-y divide-zinc-100 border-y border-zinc-200 text-sm">
          {rows.map((row) => (
            <div
              className="flex items-center justify-between gap-4 py-2"
              key={`${title}-${row.label}`}
            >
              <dt className="min-w-0 truncate text-zinc-600">{row.label}</dt>
              <dd className="shrink-0 font-mono text-zinc-950">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function StatNumber({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 border-l border-zinc-200 pl-3">
      <p className="truncate text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function ProgressMetric({
  detail,
  label,
  value
}: {
  detail: string;
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 border-l border-zinc-200 pl-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-medium text-zinc-600">{label}</p>
        <p className="shrink-0 font-mono text-2xl font-semibold text-zinc-950">
          {value}%
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

function getDonutColor(index: number) {
  return donutColors[index % donutColors.length];
}

function formatDate(value: string) {
  if (!value) {
    return "기록 없음";
  }

  return value.slice(0, 10);
}
