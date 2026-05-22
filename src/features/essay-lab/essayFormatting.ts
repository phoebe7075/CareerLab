export function formatEssayParagraphs(value: string) {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  if (!normalized) {
    return value;
  }

  const paragraphs = normalized.split(/\n{2,}/).flatMap((paragraph) => {
    const compacted = compactInlineText(paragraph);
    return splitEssayParagraph(compacted);
  });

  return paragraphs.filter(Boolean).join("\n\n");
}

function splitEssayParagraph(paragraph: string) {
  if (paragraph.length <= SHORT_PARAGRAPH_LIMIT) {
    return [paragraph];
  }

  const sentences = splitSentences(paragraph);
  if (sentences.length <= 2) {
    return [paragraph];
  }

  const targetParagraphCount = getTargetParagraphCount(paragraph.length);
  const targetParagraphLength = paragraph.length / targetParagraphCount;
  const minParagraphLength = Math.max(
    MIN_PARAGRAPH_LENGTH,
    Math.round(targetParagraphLength * 0.55)
  );
  const maxParagraphLength = Math.min(
    MAX_PARAGRAPH_LENGTH,
    Math.round(targetParagraphLength * 1.35)
  );
  const paragraphs: string[] = [];
  let current = "";

  for (const [index, sentence] of sentences.entries()) {
    const next = current ? `${current} ${sentence}` : sentence;
    const remaining = sentences.slice(index).join(" ").length;

    if (
      shouldStartNewParagraph({
        current,
        maxParagraphLength,
        minParagraphLength,
        next,
        remaining,
        sentence
      })
    ) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current) {
    paragraphs.push(current);
  }

  return paragraphs.length > 0 ? paragraphs : [paragraph];
}

function splitSentences(value: string) {
  return (
    value
      .match(/[^.!?。！？]+[.!?。！？]?/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [value]
  );
}

function shouldStartNewParagraph(input: {
  current: string;
  maxParagraphLength: number;
  minParagraphLength: number;
  next: string;
  remaining: number;
  sentence: string;
}) {
  const {
    current,
    maxParagraphLength,
    minParagraphLength,
    next,
    remaining,
    sentence
  } = input;

  if (!current) {
    return false;
  }

  if (remaining < MIN_FINAL_PARAGRAPH_LENGTH) {
    return false;
  }

  if (next.length > maxParagraphLength && current.length >= MIN_PARAGRAPH_LENGTH) {
    return true;
  }

  return (
    current.length >= minParagraphLength &&
    essayTransitionPattern.test(sentence)
  );
}

const essayTransitionPattern =
  /^(예를 들어|대표적으로|특히|문제는|그래서|이 과정에서|그 결과|이를 통해|이 경험을 통해|이러한 경험을 통해|앞으로|입사 후|제 강점은|반면|다만|또한|마지막으로)/;

const SHORT_PARAGRAPH_LIMIT = 320;
const MIN_PARAGRAPH_LENGTH = 120;
const MIN_FINAL_PARAGRAPH_LENGTH = 90;
const MAX_PARAGRAPH_LENGTH = 430;

function getTargetParagraphCount(length: number) {
  if (length <= 520) {
    return 2;
  }

  if (length <= 820) {
    return 3;
  }

  if (length <= 1150) {
    return 4;
  }

  return Math.min(6, Math.ceil(length / 320));
}

function compactInlineText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
