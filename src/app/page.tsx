"use client";

import { DashboardGrid } from "@/components/dashboard-grid";
import { ChatSidebar } from "@/components/chat-sidebar";
import { CreateWidgetDialog } from "@/components/create-widget-dialog";
import { ScrambleText } from "@/components/scramble-text";

export default function Home() {
  const infiniteLen = "Infinite".length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      <header className="flex items-center justify-between px-5 py-3">
        <h1 className="text-sm font-medium uppercase tracking-[0.2em]">
          <ScrambleText
            text="InfiniteMonitor"
            charClassName={(i) =>
              i < infiniteLen ? "text-zinc-600" : "text-zinc-300"
            }
          />
        </h1>
        <CreateWidgetDialog />
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DashboardGrid />
        <ChatSidebar />
      </div>
    </div>
  );
}
