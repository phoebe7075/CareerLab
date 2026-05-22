import type { WorkItem } from "../../data/schema";

export function formatWorkItemPeriod(
  item: Pick<WorkItem, "endedAt" | "startedAt">
) {
  if (item.startedAt && item.endedAt) {
    const startedMonth = formatMonth(item.startedAt);
    const endedMonth = formatMonth(item.endedAt);

    return startedMonth === endedMonth
      ? startedMonth
      : `${startedMonth} ~ ${endedMonth}`;
  }

  if (item.startedAt) {
    return `${formatMonth(item.startedAt)} 이후`;
  }

  if (item.endedAt) {
    return `${formatMonth(item.endedAt)}까지`;
  }

  return "날짜 미입력";
}

function formatMonth(value: string) {
  return value.length >= 7 ? value.slice(0, 7) : value;
}
