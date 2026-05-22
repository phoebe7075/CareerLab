import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  List,
  MessageSquarePlus,
  Plus,
  Trash2,
  Upload,
  X
} from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  InterviewFollowUp,
  InterviewFollowUpAnchor,
  InterviewQuestion,
  InterviewUnderstanding,
  WorkItem
} from "../../data/schema";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import {
  countImportedFollowUps,
  parseInterviewFollowUpImport,
  type ImportedInterviewFollowUp,
  type InterviewFollowUpImportResult
} from "./followUpImport";
import { buildInterviewPracticeKeywords } from "./practiceKeywords";

export type UpdateInterviewQuestionInput = {
  answerDirection: string;
  exampleAnswer: string;
  intent: string;
  myAnswer: string;
  question: string;
  questionId: string;
};

export type AddInterviewFollowUpInput = {
  anchor?: InterviewFollowUpAnchor;
  parentId?: string | null;
  questionId: string;
};

export type UpdateInterviewFollowUpInput = {
  anchor?: InterviewFollowUpAnchor;
  answerDirection: string;
  exampleAnswer: string;
  followUpId: string;
  intent: string;
  myAnswer: string;
  question: string;
  questionId: string;
  riskWarnings: string[];
  tags: string[];
};

type InterviewPrepPageProps = {
  interviewQuestions: InterviewQuestion[];
  onAddFollowUp: (input: AddInterviewFollowUpInput) => Promise<void>;
  onAddQuestion: () => Promise<void>;
  onCopyFollowUpPrompt: (
    questionId: string,
    currentAnswer: string
  ) => Promise<void>;
  onDeleteFollowUp: (questionId: string, followUpId: string) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
  onImportFollowUps: (
    questionId: string,
    followUps: ImportedInterviewFollowUp[]
  ) => Promise<number>;
  onSelectQuestion: (id: string) => void;
  onUpdateFollowUp: (input: UpdateInterviewFollowUpInput) => Promise<void>;
  onUpdateQuestion: (input: UpdateInterviewQuestionInput) => Promise<void>;
  onUpdateUnderstanding: (
    questionId: string,
    understanding: InterviewUnderstanding
  ) => Promise<void>;
  selectedQuestionId: string | null;
  workItems: WorkItem[];
};

const understandingOptions: Array<{
  id: InterviewUnderstanding;
  label: string;
}> = [
  { id: "unknown", label: "모름" },
  { id: "readable", label: "읽으면 답변 가능" },
  { id: "keyword", label: "키워드 답변 가능" },
  { id: "natural", label: "자연스럽게 답변 가능" }
];

type PracticeMode = "practice" | "editor";

export function InterviewPrepPage({
  interviewQuestions,
  onAddFollowUp,
  onAddQuestion,
  onCopyFollowUpPrompt,
  onDeleteFollowUp,
  onDeleteQuestion,
  onImportFollowUps,
  onSelectQuestion,
  onUpdateFollowUp,
  onUpdateQuestion,
  onUpdateUnderstanding,
  selectedQuestionId,
  workItems
}: InterviewPrepPageProps) {
  const [indexOpen, setIndexOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("practice");
  const [deleteTarget, setDeleteTarget] = useState<InterviewQuestion | null>(
    null
  );
  const selectedIndex = Math.max(
    0,
    interviewQuestions.findIndex((question) => question.id === selectedQuestionId)
  );
  const selectedQuestion =
    interviewQuestions[selectedIndex] ?? interviewQuestions[0] ?? null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target) || interviewQuestions.length === 0) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const previous = interviewQuestions[Math.max(0, selectedIndex - 1)];
        if (previous) {
          onSelectQuestion(previous.id);
        }
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const next =
          interviewQuestions[
            Math.min(interviewQuestions.length - 1, selectedIndex + 1)
          ];
        if (next) {
          onSelectQuestion(next.id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [interviewQuestions, onSelectQuestion, selectedIndex]);

  if (!selectedQuestion) {
    return (
      <section className="px-6 py-6 text-sm text-zinc-600">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5">
          <span>면접 질문이 없습니다.</span>
          <Button onClick={() => void onAddQuestion()} variant="primary">
            <Plus className="mr-2 size-4" />
            새 질문
          </Button>
        </div>
      </section>
    );
  }

  const atFirstQuestion = selectedIndex === 0;
  const atLastQuestion = selectedIndex === interviewQuestions.length - 1;

  async function handleAddQuestion() {
    await onAddQuestion();
    setPracticeMode("editor");
  }

  async function handleDeleteQuestion() {
    if (!deleteTarget) {
      return;
    }

    await onDeleteQuestion(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <section className="relative min-h-[calc(100vh-96px)] px-6 pb-32 pt-4 max-sm:px-4">
      <DeckControlPanel
        atFirstQuestion={atFirstQuestion}
        atLastQuestion={atLastQuestion}
        currentIndex={selectedIndex}
        mode={practiceMode}
        onAddQuestion={() => void handleAddQuestion()}
        onDeleteQuestion={() => setDeleteTarget(selectedQuestion)}
        onNext={() => {
          const next = interviewQuestions[selectedIndex + 1];
          if (next) {
            onSelectQuestion(next.id);
          }
        }}
        onOpenImport={() => setImportOpen((current) => !current)}
        onOpenIndex={() => setIndexOpen(true)}
        onPrevious={() => {
          const previous = interviewQuestions[selectedIndex - 1];
          if (previous) {
            onSelectQuestion(previous.id);
          }
        }}
        onSetMode={setPracticeMode}
        onUpdateUnderstanding={(understanding) =>
          void onUpdateUnderstanding(selectedQuestion.id, understanding)
        }
        question={selectedQuestion}
        totalCount={interviewQuestions.length}
      />

      {indexOpen ? (
        <QuestionIndexDrawer
          interviewQuestions={interviewQuestions}
          onClose={() => setIndexOpen(false)}
          onSelect={(id) => {
            onSelectQuestion(id);
            setIndexOpen(false);
          }}
          selectedQuestionId={selectedQuestion.id}
        />
      ) : null}

      <main
        className="mx-auto mt-5 max-w-6xl"
        data-page-guide="interview-main"
      >
        <QuestionDetail
          key={selectedQuestion.id}
          mode={practiceMode}
          onAddFollowUp={onAddFollowUp}
          onDeleteFollowUp={onDeleteFollowUp}
          onUpdateFollowUp={onUpdateFollowUp}
          onUpdateQuestion={onUpdateQuestion}
          question={selectedQuestion}
          workItems={workItems}
        />
      </main>

      {importOpen ? (
        <ImportDialog
          currentAnswer={selectedQuestion.myAnswer}
          onClose={() => setImportOpen(false)}
          onCopyFollowUpPrompt={onCopyFollowUpPrompt}
          onImportFollowUps={onImportFollowUps}
          question={selectedQuestion}
        />
      ) : null}

      <BottomDeckNavigation
        atFirstQuestion={atFirstQuestion}
        atLastQuestion={atLastQuestion}
        currentIndex={selectedIndex}
        onNext={() => {
          const next = interviewQuestions[selectedIndex + 1];
          if (next) {
            onSelectQuestion(next.id);
          }
        }}
        onPrevious={() => {
          const previous = interviewQuestions[selectedIndex - 1];
          if (previous) {
            onSelectQuestion(previous.id);
          }
        }}
        question={selectedQuestion}
        totalCount={interviewQuestions.length}
      />

      {deleteTarget ? (
        <ConfirmDeleteDialog
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDeleteQuestion()}
          question={deleteTarget}
        />
      ) : null}
    </section>
  );
}

function DeckControlPanel({
  atFirstQuestion,
  atLastQuestion,
  currentIndex,
  mode,
  onAddQuestion,
  onDeleteQuestion,
  onNext,
  onOpenImport,
  onOpenIndex,
  onPrevious,
  onSetMode,
  onUpdateUnderstanding,
  question,
  totalCount
}: {
  atFirstQuestion: boolean;
  atLastQuestion: boolean;
  currentIndex: number;
  mode: PracticeMode;
  onAddQuestion: () => void;
  onDeleteQuestion: () => void;
  onNext: () => void;
  onOpenImport: () => void;
  onOpenIndex: () => void;
  onPrevious: () => void;
  onSetMode: (mode: PracticeMode) => void;
  onUpdateUnderstanding: (understanding: InterviewUnderstanding) => void;
  question: InterviewQuestion;
  totalCount: number;
}) {
  return (
    <div
      className="sticky top-0 z-20 mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-sm backdrop-blur"
      data-page-guide="interview-navigator"
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button aria-label="질문 인덱스 열기" onClick={onOpenIndex} size="sm">
              <List className="size-4" />
            </Button>
            <Button
              aria-label="이전 질문"
              disabled={atFirstQuestion}
              onClick={onPrevious}
              size="sm"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-16 text-center text-sm font-semibold text-zinc-950">
              {currentIndex + 1} / {totalCount}
            </span>
            <Button
              aria-label="다음 질문"
              disabled={atLastQuestion}
              onClick={onNext}
              size="sm"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              aria-label="이해도"
              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-blue-500"
              onChange={(event) =>
                onUpdateUnderstanding(
                  event.target.value as InterviewUnderstanding
                )
              }
              value={question.understanding}
            >
              {understandingOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
              <button
                className={`rounded px-3 py-1 text-sm ${
                  mode === "practice"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-600"
                }`}
                onClick={() => onSetMode("practice")}
                type="button"
              >
                연습
              </button>
              <button
                className={`rounded px-3 py-1 text-sm ${
                  mode === "editor"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-600"
                }`}
                onClick={() => onSetMode("editor")}
                type="button"
              >
                편집
              </button>
            </div>
            <Button
              data-page-guide="interview-follow-up"
              onClick={onOpenImport}
              size="sm"
            >
              <Upload className="mr-2 size-4" />
              AI 가져오기
            </Button>
            <Button onClick={onAddQuestion} size="sm" variant="primary">
              <Plus className="mr-2 size-4" />새 질문
            </Button>
            <Button onClick={onDeleteQuestion} size="sm" variant="softDanger">
              <Trash2 className="mr-2 size-4" />
              삭제
            </Button>
          </div>
        </div>

        <div className="grid gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <span className="text-xs font-semibold text-zinc-500">현재 질문</span>
          <p
            aria-label="현재 질문 제목"
            className="min-w-0 overflow-hidden text-sm font-semibold leading-5 text-zinc-950 sm:text-center"
            style={{
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              display: "-webkit-box"
            }}
            title={question.question}
          >
            {question.question}
          </p>
          <span className="text-xs text-zinc-500 sm:text-right">
            꼬리질문 {countFollowUps(question.followUps)}개
          </span>
        </div>
      </div>
    </div>
  );
}

function QuestionDetail({
  mode,
  onAddFollowUp,
  onDeleteFollowUp,
  onUpdateFollowUp,
  onUpdateQuestion,
  question,
  workItems
}: {
  mode: PracticeMode;
  onAddFollowUp: (input: AddInterviewFollowUpInput) => Promise<void>;
  onDeleteFollowUp: (questionId: string, followUpId: string) => Promise<void>;
  onUpdateFollowUp: (input: UpdateInterviewFollowUpInput) => Promise<void>;
  onUpdateQuestion: (input: UpdateInterviewQuestionInput) => Promise<void>;
  question: InterviewQuestion;
  workItems: WorkItem[];
}) {
  const [draft, setDraft] = useState({
    answerDirection: question.answerDirection,
    exampleAnswer: question.exampleAnswer,
    intent: question.intent,
    myAnswer: question.myAnswer,
    question: question.question
  });
  const [showHints, setShowHints] = useState(false);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const [showPracticeExampleAnswer, setShowPracticeExampleAnswer] =
    useState(false);
  const [selectedQuote, setSelectedQuote] = useState("");
  const [followUpDeleteTarget, setFollowUpDeleteTarget] =
    useState<InterviewFollowUp | null>(null);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);
  const linkedWorkItems = workItems.filter((item) =>
    question.linkedWorkItemIds.includes(item.id)
  );
  const practiceKeywords = useMemo(
    () => buildInterviewPracticeKeywords({ ...question, ...draft }, linkedWorkItems),
    [draft, linkedWorkItems, question]
  );
  const paragraphs = useMemo(() => splitAnswerParagraphs(draft.myAnswer), [
    draft.myAnswer
  ]);
  const isEditing = mode === "editor";

  useEffect(() => {
    if (
      draft.answerDirection === question.answerDirection &&
      draft.exampleAnswer === question.exampleAnswer &&
      draft.intent === question.intent &&
      draft.myAnswer === question.myAnswer &&
      draft.question === question.question
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void onUpdateQuestion({
        ...draft,
        questionId: question.id
      });
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [draft, onUpdateQuestion, question]);

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleAnswerSelection() {
    const textarea = answerRef.current;
    if (!textarea) {
      return;
    }

    const quote = textarea.value
      .slice(textarea.selectionStart, textarea.selectionEnd)
      .trim();
    setSelectedQuote(quote);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="grid gap-4">
          {isEditing ? (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                질문
              </span>
              <textarea
                aria-label="면접 질문"
                className="mt-2 min-h-24 w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-2xl font-semibold leading-9 text-zinc-950 outline-none focus:border-blue-500 max-sm:text-xl"
                onChange={(event) => updateDraft("question", event.target.value)}
                value={draft.question}
              />
            </label>
          ) : (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                질문
              </span>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-zinc-950 max-sm:text-2xl">
                {draft.question}
              </h2>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{question.understanding}</Badge>
            {linkedWorkItems.map((item) => (
              <Badge key={item.id} tone="neutral">
                {item.title}
              </Badge>
            ))}
          </div>
        </div>

        {mode === "practice" ? (
          <PracticePanel
            answerDirection={draft.answerDirection}
            exampleAnswer={draft.exampleAnswer}
            intent={draft.intent}
            keywords={practiceKeywords}
            onToggleExampleAnswer={() =>
              setShowPracticeExampleAnswer((current) => !current)
            }
            onToggleHints={() => setShowHints((current) => !current)}
            showExampleAnswer={showPracticeExampleAnswer}
            showHints={showHints}
          />
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <EditableTextArea
              label="면접관 의도"
              onChange={(value) => updateDraft("intent", value)}
              value={draft.intent}
            />
            <EditableTextArea
              label="답변 방향"
              onChange={(value) => updateDraft("answerDirection", value)}
              value={draft.answerDirection}
            />
            <EditableTextArea
              label="답변 예시"
              onChange={(value) => updateDraft("exampleAnswer", value)}
              value={draft.exampleAnswer}
            />
          </div>
        )}

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-950">
              내 답변
            </h3>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!selectedQuote}
                  onClick={() =>
                    void onAddFollowUp({
                      anchor: {
                        type: "selected-text",
                        paragraphIndex: findParagraphIndex(
                          draft.myAnswer,
                          selectedQuote
                        ),
                        quote: selectedQuote
                      },
                      questionId: question.id
                    })
                  }
                  size="sm"
                >
                  <MessageSquarePlus className="mr-2 size-4" />
                  선택 문구로 꼬리질문
                </Button>
                <Button
                  onClick={() =>
                    void onAddFollowUp({
                      anchor: { type: "main-question" },
                      questionId: question.id
                    })
                  }
                  size="sm"
                >
                  <MessageSquarePlus className="mr-2 size-4" />
                  메인 꼬리질문
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowPracticeAnswer((current) => !current)}
                size="sm"
                variant="secondary"
              >
                {showPracticeAnswer ? (
                  <EyeOff className="mr-2 size-4" />
                ) : (
                  <Eye className="mr-2 size-4" />
                )}
                {showPracticeAnswer ? "내 답변 숨기기" : "내 답변 보기"}
              </Button>
            )}
          </div>
          {isEditing ? (
            <textarea
              aria-label="내 답변"
              className="min-h-56 w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-3 text-base leading-7 text-zinc-950 outline-none focus:border-blue-500"
              id="interview-answer"
              onChange={(event) => updateDraft("myAnswer", event.target.value)}
              onSelect={handleAnswerSelection}
              ref={answerRef}
              value={draft.myAnswer}
            />
          ) : showPracticeAnswer ? (
            <div
              aria-label="내 답변"
              className="min-h-56 rounded-md border border-zinc-200 bg-zinc-50 px-5 py-4 text-base leading-8 text-zinc-900"
              tabIndex={0}
            >
              {paragraphs.length > 0 ? (
                <div className="space-y-4">
                  {paragraphs.map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">아직 작성된 답변이 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-500">
              답변을 숨겼습니다. 먼저 질문에 답한 뒤 열어보세요.
            </div>
          )}
        </div>
      </section>

      {question.followUps.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-950">
                꼬리질문 체인
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                답변 문단 순서에 맞춰 질문을 이어 붙입니다.
              </p>
            </div>
            {isEditing ? (
              <Button
                onClick={() =>
                  void onAddFollowUp({
                    anchor: { type: "main-question" },
                    questionId: question.id
                  })
                }
                size="sm"
                variant="primary"
              >
                <Plus className="mr-2 size-4" />
                꼬리질문 추가
              </Button>
            ) : null}
          </div>

          {isEditing && paragraphs.length > 0 ? (
            <div className="grid gap-3">
              {paragraphs.map((paragraph, index) => (
                <div
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
                  key={`${paragraph}-${index}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="max-w-3xl text-sm leading-6 text-zinc-700">
                      {paragraph}
                    </p>
                    <Button
                      onClick={() =>
                        void onAddFollowUp({
                          anchor: {
                            type: "answer-paragraph",
                            paragraphIndex: index,
                            quote: paragraph
                          },
                          questionId: question.id
                        })
                      }
                      size="sm"
                    >
                      문단 {index + 1}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4">
            {sortFollowUpsByAnchor(question.followUps).map((followUp, index) => (
              <FollowUpCard
                chainLabel={`체인 ${index + 1}`}
                followUp={followUp}
                key={followUp.id}
                mode={mode}
                onAddChild={(anchor) =>
                  void onAddFollowUp({
                    anchor,
                    parentId: followUp.id,
                    questionId: question.id
                  })
                }
                onDelete={(followUpId) =>
                  setFollowUpDeleteTarget(
                    findFollowUpById(question.followUps, followUpId)
                  )
                }
                onUpdate={(input) =>
                  void onUpdateFollowUp({
                    ...input,
                    questionId: question.id
                  })
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {followUpDeleteTarget ? (
        <ConfirmFollowUpDeleteDialog
          followUp={followUpDeleteTarget}
          onCancel={() => setFollowUpDeleteTarget(null)}
          onConfirm={() => {
            void onDeleteFollowUp(question.id, followUpDeleteTarget.id).then(() =>
              setFollowUpDeleteTarget(null)
            );
          }}
        />
      ) : null}
    </div>
  );
}

function ImportDialog({
  currentAnswer,
  onClose,
  onCopyFollowUpPrompt,
  onImportFollowUps,
  question
}: {
  currentAnswer: string;
  onClose: () => void;
  onCopyFollowUpPrompt: (
    questionId: string,
    currentAnswer: string
  ) => Promise<void>;
  onImportFollowUps: (
    questionId: string,
    followUps: ImportedInterviewFollowUp[]
  ) => Promise<number>;
  question: InterviewQuestion;
}) {
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] =
    useState<InterviewFollowUpImportResult | null>(null);
  const [importState, setImportState] = useState<"idle" | "importing">("idle");
  const previewCount =
    importPreview?.ok === true
      ? countImportedFollowUps(importPreview.followUps)
      : 0;
  const previewParentFallbackCount =
    importPreview?.ok === true
      ? countImportedParentFallbacks(importPreview.followUps)
      : 0;
  const previewAnchorCount =
    importPreview?.ok === true ? countImportedAnchors(importPreview.followUps) : 0;

  function handlePreviewImport() {
    setImportPreview(parseInterviewFollowUpImport(importText));
  }

  async function handleConfirmImport() {
    const preview = importPreview?.ok
      ? importPreview
      : parseInterviewFollowUpImport(importText);

    if (!preview.ok) {
      setImportPreview(preview);
      return;
    }

    setImportState("importing");
    try {
      await onImportFollowUps(question.id, preview.followUps);
      setImportText("");
      setImportPreview(null);
      onClose();
    } finally {
      setImportState("idle");
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-zinc-950/25 p-4"
      onClick={onClose}
    >
      <section
        aria-modal="true"
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-zinc-950">
              AI 꼬리질문 가져오기
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              JSON을 미리보고 현재 질문의 꼬리질문 체인에 추가합니다.
            </p>
            <p className="mt-2 truncate text-xs text-zinc-500">
              대상 질문: {question.question}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={() => void onCopyFollowUpPrompt(question.id, currentAnswer)}
              size="sm"
              variant="primary"
            >
              꼬리질문 프롬프트 복사
            </Button>
            <Button aria-label="가져오기 닫기" onClick={onClose} size="sm">
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-zinc-800">
            AI 꼬리질문 JSON
          </span>
          <textarea
            aria-label="AI 꼬리질문 JSON"
            className="mt-2 min-h-48 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
            onChange={(event) => {
              setImportText(event.target.value);
              setImportPreview(null);
            }}
            placeholder='{"newFollowUps":[{"question":"","anchor":{"type":"answer-paragraph","paragraphIndex":0},"children":[]}]}'
            value={importText}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={handlePreviewImport} size="sm">
            JSON 미리보기
          </Button>
          <Button
            disabled={importState === "importing" || previewCount === 0}
            onClick={handleConfirmImport}
            size="sm"
            variant="primary"
          >
            가져오기 확정
          </Button>
        </div>
        {importPreview?.ok === true ? (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
            <p>미리보기: {previewCount}개 꼬리질문을 추가할 수 있습니다.</p>
            <p>붙을 위치: 현재 선택한 질문 체인 아래</p>
            <p>붙임 위치 지정: {previewAnchorCount}개</p>
            {previewParentFallbackCount > 0 ? (
              <p>
                부모 질문 ID {previewParentFallbackCount}개는 현재 질문 체인에 붙습니다.
              </p>
            ) : null}
          </div>
        ) : null}
        {importPreview?.ok === false ? (
          <p className="mt-3 text-xs leading-5 text-rose-700">
            {importPreview.error}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function FollowUpCard({
  chainLabel,
  followUp,
  mode,
  onAddChild,
  onDelete,
  onUpdate
}: {
  chainLabel?: string;
  followUp: InterviewFollowUp;
  mode: PracticeMode;
  onAddChild: (anchor?: InterviewFollowUpAnchor) => void;
  onDelete: (followUpId: string) => void;
  onUpdate: (
    input: Omit<UpdateInterviewFollowUpInput, "questionId">
  ) => void;
}) {
  const [draft, setDraft] = useState({
    answerDirection: followUp.answerDirection,
    exampleAnswer: followUp.exampleAnswer,
    intent: followUp.intent,
    myAnswer: followUp.myAnswer,
    question: followUp.question,
    riskWarnings: followUp.riskWarnings.join("\n"),
    tags: followUp.tags.join(", ")
  });
  const [showPracticeDetails, setShowPracticeDetails] = useState(false);
  const isEditing = mode === "editor";

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const riskWarnings = splitLines(draft.riskWarnings);
    const tags = splitTags(draft.tags);
    if (
      draft.answerDirection === followUp.answerDirection &&
      draft.exampleAnswer === followUp.exampleAnswer &&
      draft.intent === followUp.intent &&
      draft.myAnswer === followUp.myAnswer &&
      draft.question === followUp.question &&
      arraysEqual(riskWarnings, followUp.riskWarnings) &&
      arraysEqual(tags, followUp.tags)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onUpdate({
        anchor: followUp.anchor,
        answerDirection: draft.answerDirection,
        exampleAnswer: draft.exampleAnswer,
        followUpId: followUp.id,
        intent: draft.intent,
        myAnswer: draft.myAnswer,
        question: draft.question,
        riskWarnings,
        tags
      });
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [draft, followUp, isEditing, onUpdate]);

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {chainLabel ? <Badge tone="accent">{chainLabel}</Badge> : null}
            <Badge tone="neutral">{describeAnchor(followUp.anchor)}</Badge>
          </div>
          {isEditing ? (
            <textarea
              aria-label="꼬리질문"
              className="mt-3 min-h-16 w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-base font-semibold leading-6 text-zinc-950 outline-none focus:border-blue-500"
              onChange={(event) => updateDraft("question", event.target.value)}
              value={draft.question}
            />
          ) : (
            <h4 className="mt-3 text-lg font-semibold leading-7 text-zinc-950">
              {draft.question}
            </h4>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={() => onAddChild(followUp.anchor)}
              size="sm"
              variant="secondary"
            >
              <Plus className="mr-2 size-4" />
              꼬리
            </Button>
            <Button
              aria-label="꼬리질문 삭제"
              onClick={() => onDelete(followUp.id)}
              size="sm"
              variant="softDanger"
            >
              <Trash2 className="mr-2 size-4" />
              삭제
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowPracticeDetails((current) => !current)}
            size="sm"
            variant="secondary"
          >
            {showPracticeDetails ? (
              <EyeOff className="mr-2 size-4" />
            ) : (
              <Eye className="mr-2 size-4" />
            )}
            {showPracticeDetails ? "힌트/답변 숨기기" : "힌트/답변 보기"}
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <EditableTextArea
              label="의도"
              onChange={(value) => updateDraft("intent", value)}
              value={draft.intent}
            />
            <EditableTextArea
              label="답변 방향"
              onChange={(value) => updateDraft("answerDirection", value)}
              value={draft.answerDirection}
            />
            <EditableTextArea
              label="내 답변"
              onChange={(value) => updateDraft("myAnswer", value)}
              value={draft.myAnswer}
            />
            <EditableTextArea
              label="예시 답변"
              onChange={(value) => updateDraft("exampleAnswer", value)}
              value={draft.exampleAnswer}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <EditableTextArea
              label="위험 경고"
              onChange={(value) => updateDraft("riskWarnings", value)}
              value={draft.riskWarnings}
            />
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">태그</span>
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
                onChange={(event) => updateDraft("tags", event.target.value)}
                value={draft.tags}
              />
            </label>
          </div>
        </>
      ) : showPracticeDetails ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <InfoBlock label="의도" value={draft.intent} />
          <InfoBlock label="답변 방향" value={draft.answerDirection} />
          <InfoBlock label="내 답변" value={draft.myAnswer || "아직 답변 없음"} />
          <InfoBlock label="예시 답변" value={draft.exampleAnswer} />
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          꼬리질문 힌트와 답변을 숨겼습니다.
        </div>
      )}

      {followUp.children.length > 0 ? (
        <div className="mt-4 border-l border-zinc-200 pl-4">
          <div className="grid gap-3">
            {sortFollowUpsByAnchor(followUp.children).map((child) => (
              <FollowUpCard
                followUp={child}
                key={child.id}
                mode={mode}
                onAddChild={onAddChild}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function PracticePanel({
  answerDirection,
  exampleAnswer,
  intent,
  keywords,
  onToggleExampleAnswer,
  onToggleHints,
  showExampleAnswer,
  showHints
}: {
  answerDirection: string;
  exampleAnswer: string;
  intent: string;
  keywords: string[];
  onToggleExampleAnswer: () => void;
  onToggleHints: () => void;
  showExampleAnswer: boolean;
  showHints: boolean;
}) {
  return (
    <section className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950">키워드 연습</h4>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onToggleHints} size="sm" variant="secondary">
            {showHints ? (
              <EyeOff className="mr-2 size-4" />
            ) : (
              <Eye className="mr-2 size-4" />
            )}
            {showHints ? "힌트 숨기기" : "힌트 보기"}
          </Button>
          <Button onClick={onToggleExampleAnswer} size="sm" variant="secondary">
            {showExampleAnswer ? (
              <EyeOff className="mr-2 size-4" />
            ) : (
              <Eye className="mr-2 size-4" />
            )}
            {showExampleAnswer ? "예시 숨기기" : "예시 보기"}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {keywords.length === 0 ? (
          <Badge tone="warning">키워드 없음</Badge>
        ) : (
          keywords.map((keyword) => (
            <Badge key={keyword} tone="accent">
              {keyword}
            </Badge>
          ))
        )}
      </div>

      {showHints ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <InfoBlock label="면접관 의도" value={intent} />
          <InfoBlock label="답변 방향" value={answerDirection} />
        </div>
      ) : null}

      {showExampleAnswer ? (
        <div className="mt-4">
          <InfoBlock label="답변 예시" value={exampleAnswer} />
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-500">
          예시 답변은 숨겨져 있습니다.
        </div>
      )}
    </section>
  );
}

function QuestionIndexDrawer({
  interviewQuestions,
  onClose,
  onSelect,
  selectedQuestionId
}: {
  interviewQuestions: InterviewQuestion[];
  onClose: () => void;
  onSelect: (id: string) => void;
  selectedQuestionId: string;
}) {
  return (
    <div className="fixed inset-0 z-30 bg-zinc-950/10 p-4" onClick={onClose}>
      <aside
        className="mx-auto max-h-[80vh] max-w-3xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-950">질문 인덱스</h3>
          <Button aria-label="질문 인덱스 닫기" onClick={onClose} size="sm">
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-4 grid gap-2">
          {interviewQuestions.map((question, index) => (
            <button
              className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
                question.id === selectedQuestionId
                  ? "border-blue-500 bg-blue-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
              key={question.id}
              onClick={() => onSelect(question.id)}
              type="button"
            >
              <span className="text-xs font-semibold text-zinc-500">
                {index + 1}
              </span>
              <span className="truncate text-sm text-zinc-900">
                {question.question}
              </span>
              <span className="text-xs text-zinc-500">
                {question.understanding} · {countFollowUps(question.followUps)}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function BottomDeckNavigation({
  atFirstQuestion,
  atLastQuestion,
  currentIndex,
  onNext,
  onPrevious,
  question,
  totalCount
}: {
  atFirstQuestion: boolean;
  atLastQuestion: boolean;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  question: InterviewQuestion;
  totalCount: number;
}) {
  return (
    <nav className="fixed bottom-4 left-[calc(var(--app-sidebar-width)+((100vw-var(--app-sidebar-width))/2))] z-20 grid w-[min(920px,calc(100vw-var(--app-sidebar-width)-2rem))] -translate-x-1/2 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur max-lg:left-1/2 max-lg:w-[min(920px,calc(100vw-2rem))]">
      <Button
        aria-label="하단 이전 질문"
        disabled={atFirstQuestion}
        onClick={onPrevious}
        size="sm"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-0 text-center">
        <p className="truncate text-sm font-medium text-zinc-950">
          {currentIndex + 1} / {totalCount} · {question.question}
        </p>
        <p className="text-xs text-zinc-500">
          {question.understanding} · 꼬리질문 {countFollowUps(question.followUps)}개
        </p>
      </div>
      <Button
        aria-label="하단 다음 질문"
        disabled={atLastQuestion}
        onClick={onNext}
        size="sm"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

function ConfirmDeleteDialog({
  onCancel,
  onConfirm,
  question
}: {
  onCancel: () => void;
  onConfirm: () => void;
  question: InterviewQuestion;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-zinc-950/20 p-4">
      <section
        aria-modal="true"
        autoFocus
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl"
        onKeyDown={(event) =>
          handleConfirmDialogKeyDown(event, onCancel, onConfirm)
        }
        role="dialog"
        tabIndex={-1}
      >
        <h3 className="text-base font-semibold text-zinc-950">
          면접 질문 삭제
        </h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          이 질문과 연결된 꼬리질문 체인을 삭제합니다.
        </p>
        <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-800">
          {question.question}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel}>취소</Button>
          <Button onClick={onConfirm} variant="softDanger">
            삭제
          </Button>
        </div>
      </section>
    </div>
  );
}

function ConfirmFollowUpDeleteDialog({
  followUp,
  onCancel,
  onConfirm
}: {
  followUp: InterviewFollowUp;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-zinc-950/20 p-4">
      <section
        aria-modal="true"
        autoFocus
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl"
        onKeyDown={(event) =>
          handleConfirmDialogKeyDown(event, onCancel, onConfirm)
        }
        role="dialog"
        tabIndex={-1}
      >
        <h3 className="text-base font-semibold text-zinc-950">
          꼬리질문 삭제
        </h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          이 꼬리질문과 이어진 하위 꼬리질문을 삭제합니다.
        </p>
        <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-800">
          {followUp.question}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel}>취소</Button>
          <Button onClick={onConfirm} variant="softDanger">
            삭제
          </Button>
        </div>
      </section>
    </div>
  );
}

function handleConfirmDialogKeyDown(
  event: ReactKeyboardEvent<HTMLElement>,
  onCancel: () => void,
  onConfirm: () => void
) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    onCancel();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    onConfirm();
  }
}

function EditableTextArea({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">{label}</span>
      <textarea
        aria-label={label}
        className="mt-1 min-h-28 w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-zinc-950">{label}</h4>
      <p className="mt-2 break-words text-sm leading-6 text-zinc-600">{value}</p>
    </section>
  );
}

function sortFollowUpsByAnchor(followUps: InterviewFollowUp[]) {
  return [...followUps].sort(
    (left, right) => getAnchorOrder(left.anchor) - getAnchorOrder(right.anchor)
  );
}

function getAnchorOrder(anchor: InterviewFollowUpAnchor | undefined) {
  if (!anchor || anchor.type === "main-question") {
    return 0;
  }

  if (anchor.type === "answer-paragraph") {
    return 10 + anchor.paragraphIndex;
  }

  return 10 + (anchor.paragraphIndex ?? 999) + 0.5;
}

function describeAnchor(anchor: InterviewFollowUpAnchor | undefined) {
  if (!anchor || anchor.type === "main-question") {
    return "메인 질문";
  }

  if (anchor.type === "answer-paragraph") {
    return `답변 문단 ${anchor.paragraphIndex + 1}`;
  }

  return anchor.quote ? `선택 문구: ${anchor.quote}` : "선택 문구";
}

function splitAnswerParagraphs(answer: string) {
  return answer
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function findParagraphIndex(answer: string, quote: string) {
  const paragraphs = splitAnswerParagraphs(answer);
  return paragraphs.findIndex((paragraph) => paragraph.includes(quote));
}

function countFollowUps(followUps: InterviewFollowUp[]): number {
  return followUps.reduce(
    (count, followUp) => count + 1 + countFollowUps(followUp.children),
    0
  );
}

function findFollowUpById(
  followUps: InterviewFollowUp[],
  followUpId: string
): InterviewFollowUp | null {
  for (const followUp of followUps) {
    if (followUp.id === followUpId) {
      return followUp;
    }

    const child = findFollowUpById(followUp.children, followUpId);
    if (child) {
      return child;
    }
  }

  return null;
}

function countImportedParentFallbacks(
  followUps: ImportedInterviewFollowUp[]
): number {
  return followUps.reduce(
    (count, followUp) =>
      count +
      (followUp.parentQuestionId ? 1 : 0) +
      countImportedParentFallbacks(followUp.children),
    0
  );
}

function countImportedAnchors(followUps: ImportedInterviewFollowUp[]): number {
  return followUps.reduce(
    (count, followUp) =>
      count +
      (followUp.anchor ? 1 : 0) +
      countImportedAnchors(followUp.children),
    0
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
