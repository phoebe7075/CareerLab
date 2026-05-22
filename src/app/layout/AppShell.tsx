import { useState, type CSSProperties, type ReactNode } from "react";

import { navigationItems } from "../../shared/constants/navigation";
import { useResetWindowScroll } from "../../shared/lib/useResetWindowScroll";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  activeItemId: string;
  children: ReactNode;
  onNavigate: (id: string) => void;
  pageActions?: ReactNode;
  title: string;
};

export function AppShell({
  activeItemId,
  children,
  onNavigate,
  pageActions,
  title
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const shellStyle = {
    "--app-sidebar-width": sidebarCollapsed ? "72px" : "256px"
  } as CSSProperties;

  useResetWindowScroll(activeItemId);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      <div
        className={`grid min-h-screen transition-[grid-template-columns] duration-200 max-lg:grid-cols-1 ${
          sidebarCollapsed
            ? "grid-cols-[72px_minmax(0,1fr)]"
            : "grid-cols-[256px_minmax(0,1fr)]"
        }`}
        style={shellStyle}
      >
        <Sidebar
          activeItemId={activeItemId}
          collapsed={sidebarCollapsed}
          items={navigationItems}
          onCollapsedChange={setSidebarCollapsed}
          onNavigate={onNavigate}
        />
        <main className="min-w-0 bg-[#fbfbfa]">
          <Topbar actions={pageActions} title={title} />
          {children}
        </main>
      </div>
    </div>
  );
}
