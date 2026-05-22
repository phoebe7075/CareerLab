import {
  Archive,
  BarChart3,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  FilePenLine,
  FileText,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useState } from "react";

import type { NavigationItem } from "../../shared/constants/navigation";
import { cn } from "../../shared/lib/cn";

type SidebarProps = {
  activeItemId: string;
  collapsed: boolean;
  items: NavigationItem[];
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate: (id: string) => void;
};

export function Sidebar({
  activeItemId,
  collapsed,
  items,
  onCollapsedChange,
  onNavigate
}: SidebarProps) {
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    () => new Set()
  );
  const [collapsedActiveGroupIds, setCollapsedActiveGroupIds] = useState<
    Set<string>
  >(() => new Set());

  function toggleGroup(id: string, expanded: boolean, childActive: boolean) {
    setExpandedGroupIds((current) => {
      const next = new Set(current);

      if (expanded) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
    setCollapsedActiveGroupIds((current) => {
      const next = new Set(current);

      if (!childActive) {
        next.delete(id);
        return next;
      }

      if (expanded) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  return (
    <aside
      className={cn(
        "border-r border-zinc-200 bg-[#f7f7f5] py-5 transition-[padding] max-lg:sticky max-lg:top-0 max-lg:z-20 max-lg:min-w-0 max-lg:overflow-hidden max-lg:border-b max-lg:border-r-0 max-lg:bg-[#f7f7f5]/95 max-lg:px-4 max-lg:py-3 max-lg:backdrop-blur",
        collapsed ? "px-3" : "px-4"
      )}
    >
      <div className="mb-6 px-2 max-lg:mb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("min-w-0", collapsed && "hidden max-lg:block")}>
            <h1 className="text-2xl font-semibold text-zinc-950 max-lg:text-xl">
              Career Lab
            </h1>
          </div>
          <button
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 max-lg:hidden"
            onClick={() => onCollapsedChange(!collapsed)}
            type="button"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
        <p
          className={cn(
            "mt-3 text-sm leading-6 text-zinc-600 max-lg:hidden",
            collapsed && "hidden"
          )}
        >
          사실 기반 경력 정리 작업대
        </p>
      </div>

      <nav
        aria-label="주요 메뉴"
        className="grid gap-1 max-lg:flex max-lg:min-w-0 max-lg:overflow-x-auto max-lg:pb-1"
      >
        {items.map((item) => {
          const childActive = item.children?.some(
            (child) => child.id === activeItemId
          );
          const hasChildren = Boolean(item.children?.length);
          const groupExpanded =
            expandedGroupIds.has(item.id) ||
            (Boolean(childActive) && !collapsedActiveGroupIds.has(item.id));
          const active = item.id === activeItemId || Boolean(childActive);
          const Icon = getNavigationIcon(item.id);
          const ParentIndicator = groupExpanded ? ChevronDown : ChevronRight;

          return (
            <div className="min-w-0 max-lg:shrink-0" key={item.id}>
              <button
                aria-label={item.label}
                aria-current={active && !childActive ? "page" : undefined}
                aria-expanded={hasChildren ? groupExpanded : undefined}
                className={cn(
                  "flex min-h-9 w-full items-center gap-2 rounded-md text-left text-sm transition max-lg:w-auto max-lg:shrink-0 max-lg:px-3",
                  collapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                )}
                onClick={() => {
                  if (hasChildren) {
                    toggleGroup(item.id, groupExpanded, Boolean(childActive));
                    return;
                  }

                  onNavigate(item.id);
                }}
                title={collapsed ? item.label : undefined}
                type="button"
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span
                  className={cn("truncate", collapsed && "hidden max-lg:inline")}
                >
                  {item.label}
                </span>
                {hasChildren && !collapsed ? (
                  <ParentIndicator
                    aria-hidden="true"
                    className="ml-auto h-4 w-4 shrink-0"
                  />
                ) : null}
              </button>

              {item.children && groupExpanded && !collapsed ? (
                <div className="mt-1 grid gap-1 pl-6 max-lg:ml-2 max-lg:mt-0 max-lg:flex max-lg:pl-0">
                  {item.children.map((child) => {
                    const childIsActive = child.id === activeItemId;

                    return (
                      <button
                        aria-label={child.label}
                        aria-current={childIsActive ? "page" : undefined}
                        className={cn(
                          "min-h-8 rounded-md px-3 text-left text-sm transition",
                          childIsActive
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                        )}
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        type="button"
                      >
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function getNavigationIcon(id: string) {
  switch (id) {
    case "dashboard":
      return BarChart3;
    case "work-projects":
      return BriefcaseBusiness;
    case "work-understanding":
      return BriefcaseBusiness;
    case "resume-lab":
      return FileText;
    case "essay-lab":
      return FilePenLine;
    case "interview-prep":
      return MessageSquareText;
    case "prompt-center":
    case "prompt-center-templates":
    case "prompt-center-history":
      return MessageSquareText;
    case "export-import":
      return Archive;
    default:
      return FileText;
  }
}
