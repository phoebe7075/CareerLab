import { useMemo, useState } from "react";

import type { PromptHistory, PromptTemplate } from "../../data/schema";
import { formatPromptTemplateType } from "../../shared/lib/promptLabels";
import { useResetWindowScroll } from "../../shared/lib/useResetWindowScroll";
import { Badge } from "../../shared/ui/Badge";

type PromptCenterPageProps = {
  promptHistory: PromptHistory[];
  templates: PromptTemplate[];
  view?: "templates" | "history";
};

export function PromptCenterPage({
  promptHistory,
  templates,
  view = "templates"
}: PromptCenterPageProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates[0]?.id ?? ""
  );

  useResetWindowScroll(view);

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0];
  const sortedPromptHistory = useMemo(
    () =>
      [...promptHistory].sort((first, second) =>
        second.createdAt.localeCompare(first.createdAt)
      ),
    [promptHistory]
  );

  return (
    <section className="px-6 py-6 max-sm:px-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-600">프롬프트 센터</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-950">
            {view === "templates" ? "템플릿 보관함" : "프롬프트 히스토리"}
          </h3>
        </div>
      </div>

      {view === "history" ? (
        <PromptHistoryView promptHistory={sortedPromptHistory} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4"
            data-page-guide="prompt-template-list"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-zinc-950">
                템플릿 목록
              </h3>
              <Badge tone="neutral">{templates.length}</Badge>
            </div>

            <div className="mt-5 grid gap-2">
              {templates.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  저장된 프롬프트 템플릿이 없습니다.
                </p>
              ) : (
                templates.map((template) => (
                  <button
                    aria-pressed={template.id === selectedTemplate?.id}
                    className={`rounded-md border p-3 text-left transition ${
                      template.id === selectedTemplate?.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    type="button"
                  >
                    <span className="break-words text-sm font-medium text-zinc-950">
                      {template.title}
                    </span>
                    <span className="mt-2 block break-words text-xs text-zinc-500">
                      {formatPromptTemplateType(template.templateType)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section
            className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5"
            data-page-guide="prompt-template-detail"
          >
            {selectedTemplate ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="accent">
                    {formatPromptTemplateType(selectedTemplate.templateType)}
                  </Badge>
                </div>
                <h3 className="mt-3 break-words text-xl font-semibold text-zinc-950">
                  {selectedTemplate.title}
                </h3>
                <p className="mt-3 break-words text-sm leading-6 text-zinc-600">
                  {selectedTemplate.description}
                </p>

                {selectedTemplate.requiredJsonShape ? (
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-zinc-950">
                      Required JSON Shape
                    </h4>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-5 text-zinc-700">
                      {selectedTemplate.requiredJsonShape}
                    </pre>
                  </div>
                ) : null}

                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-zinc-950">
                    템플릿 본문
                  </h4>
                  <pre className="mt-2 min-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-5 text-zinc-700">
                    {selectedTemplate.body}
                  </pre>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-600">
                저장된 프롬프트 템플릿이 없습니다.
              </p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function PromptHistoryView({
  promptHistory
}: {
  promptHistory: PromptHistory[];
}) {
  return (
    <section
      className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5"
      data-page-guide="prompt-history"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-zinc-950">
            전체 프롬프트 히스토리
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            각 Lab에서 복사하거나 저장한 프롬프트 이력입니다.
          </p>
        </div>
        <Badge tone="neutral">{promptHistory.length}개 이력</Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {promptHistory.length === 0 ? (
          <p className="text-sm text-zinc-600">
            아직 복사한 프롬프트가 없습니다.
          </p>
        ) : (
          promptHistory.map((prompt) => (
            <article
              className="rounded-md border border-zinc-200 bg-white p-4"
              key={prompt.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="accent">
                  {formatPromptTemplateType(prompt.templateType)}
                </Badge>
                <time className="text-xs text-zinc-500">{prompt.createdAt}</time>
              </div>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-zinc-600">
                {prompt.prompt}
              </pre>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
