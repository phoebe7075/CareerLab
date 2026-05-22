import type { VersionRecord } from "../../data/schema";

export function getVisibleVersionRecords(versions: VersionRecord[]) {
  return versions.filter((version) => !version.tags.includes("restore"));
}

export function findCurrentVersionId(
  versions: VersionRecord[],
  currentText: string
) {
  for (let index = versions.length - 1; index >= 0; index -= 1) {
    if (versions[index]?.after === currentText) {
      return versions[index]?.id;
    }
  }

  return undefined;
}

export function getVersionStyle(version: VersionRecord) {
  if (version.tags.includes("final")) {
    return {
      accentClass: "border-l-4 border-l-emerald-400",
      badgeTone: "success" as const,
      label: "최종"
    };
  }

  if (version.tags.includes("seed")) {
    return {
      accentClass: "border-l-4 border-l-blue-400",
      badgeTone: "accent" as const,
      label: "초기값"
    };
  }

  return {
    accentClass: "border-l-4 border-l-blue-400",
    badgeTone: "accent" as const,
    label: "수동 기록"
  };
}

export function formatVersionTimestamp(value: string) {
  const hasExplicitOffset = /[+-]\d{2}:\d{2}$/.test(value);
  const isoMatch = hasExplicitOffset
    ? value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/)
    : null;

  if (isoMatch) {
    return `${isoMatch[1]} ${isoMatch[2]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    date.getFullYear(),
    "-",
    padDatePart(date.getMonth() + 1),
    "-",
    padDatePart(date.getDate()),
    " ",
    padDatePart(date.getHours()),
    ":",
    padDatePart(date.getMinutes()),
    ":",
    padDatePart(date.getSeconds())
  ].join("");
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}
