export type TextDiffPart = {
  kind: "equal" | "added" | "removed";
  value: string;
};

export function createTextDiff(before: string, after: string) {
  if (before === after) {
    return "No changes";
  }

  return [`--- before`, before, `+++ after`, after].join("\n");
}

export function createTokenDiff(before: string, after: string): TextDiffPart[] {
  if (before === after) {
    return before ? [{ kind: "equal", value: before }] : [];
  }

  const beforeTokens = tokenizeText(before);
  const afterTokens = tokenizeText(after);
  const lcs = buildLcsTable(beforeTokens, afterTokens);
  const parts: TextDiffPart[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  while (beforeIndex < beforeTokens.length && afterIndex < afterTokens.length) {
    if (beforeTokens[beforeIndex] === afterTokens[afterIndex]) {
      pushPart(parts, "equal", beforeTokens[beforeIndex]);
      beforeIndex += 1;
      afterIndex += 1;
    } else if (
      lcs[beforeIndex + 1]?.[afterIndex] >= lcs[beforeIndex]?.[afterIndex + 1]
    ) {
      pushPart(parts, "removed", beforeTokens[beforeIndex]);
      beforeIndex += 1;
    } else {
      pushPart(parts, "added", afterTokens[afterIndex]);
      afterIndex += 1;
    }
  }

  while (beforeIndex < beforeTokens.length) {
    pushPart(parts, "removed", beforeTokens[beforeIndex]);
    beforeIndex += 1;
  }

  while (afterIndex < afterTokens.length) {
    pushPart(parts, "added", afterTokens[afterIndex]);
    afterIndex += 1;
  }

  return parts;
}

function tokenizeText(text: string) {
  return text.match(/\S+|\s+/g) ?? [];
}

function buildLcsTable(beforeTokens: string[], afterTokens: string[]) {
  const table = Array.from({ length: beforeTokens.length + 1 }, () =>
    Array(afterTokens.length + 1).fill(0)
  ) as number[][];

  for (let beforeIndex = beforeTokens.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = afterTokens.length - 1; afterIndex >= 0; afterIndex -= 1) {
      table[beforeIndex][afterIndex] =
        beforeTokens[beforeIndex] === afterTokens[afterIndex]
          ? table[beforeIndex + 1][afterIndex + 1] + 1
          : Math.max(
              table[beforeIndex + 1][afterIndex],
              table[beforeIndex][afterIndex + 1]
            );
    }
  }

  return table;
}

function pushPart(
  parts: TextDiffPart[],
  kind: TextDiffPart["kind"],
  value: string
) {
  const lastPart = parts.at(-1);

  if (lastPart?.kind === kind) {
    lastPart.value += value;
    return;
  }

  parts.push({ kind, value });
}
