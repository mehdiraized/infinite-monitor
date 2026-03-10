"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareDashed, Sparkles, X } from "lucide-react";
import { nanoid } from "nanoid";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWidgetStore } from "@/store/widget-store";

const PLACEHOLDER_REPLY =
  "UI-only mode — once a real agent is wired up I'll generate the component code for you. For now, keep describing what you want and I'll echo it back.";

export function ChatSidebar() {
  const widgets = useWidgetStore((s) => s.widgets);
  const activeWidgetId = useWidgetStore((s) => s.activeWidgetId);
  const setActiveWidget = useWidgetStore((s) => s.setActiveWidget);
  const addMessage = useWidgetStore((s) => s.addMessage);
  const [input, setInput] = useState("");

  const activeWidget = useMemo(
    () => widgets.find((w) => w.id === activeWidgetId) ?? null,
    [activeWidgetId, widgets]
  );

  useEffect(() => {
    if (!activeWidget || activeWidget.messages.length > 0) return;
    addMessage(activeWidget.id, {
      id: nanoid(),
      role: "assistant",
      content:
        "Tell me what you want this component to do, what data it should show, and the kind of layout you'd like.",
    });
  }, [activeWidget, addMessage]);

  const isOpen = activeWidget !== null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeWidget || !input.trim()) return;

    addMessage(activeWidget.id, {
      id: nanoid(),
      role: "user",
      content: input.trim(),
    });
    setInput("");

    setTimeout(() => {
      addMessage(activeWidget.id, {
        id: nanoid(),
        role: "assistant",
        content: PLACEHOLDER_REPLY,
      });
    }, 300);
  }

  return (
    <div
      className={cn(
        "relative shrink-0 transition-[width] duration-300 ease-out",
        isOpen ? "w-104" : "w-0"
      )}
    >
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "absolute inset-y-0 right-0 flex w-104 flex-col border-l border-zinc-800 bg-zinc-900/80 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                <Sparkles className="size-3.5" />
                Builder Chat
              </div>
              <h2 className="truncate text-sm font-medium uppercase tracking-wider text-zinc-100">
                {activeWidget?.title ?? "No widget selected"}
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
              onClick={() => setActiveWidget(null)}
            >
              <X className="size-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
          <p className="text-xs leading-5 text-zinc-500">
            Describe the component you want to build for this widget.
          </p>
        </div>

        {/* Conversation */}
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="bg-zinc-900/80">
            {activeWidget && activeWidget.messages.length > 0 ? (
              activeWidget.messages.map((msg) => (
                <Message key={msg.id} from={msg.role}>
                  <MessageContent>
                    <MessageResponse>{msg.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))
            ) : (
              <ConversationEmptyState
                icon={<MessageSquareDashed className="size-10" />}
                title="Start designing"
                description="Select a widget and describe the component you want."
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input */}
        <div className="border-t border-zinc-800 p-3">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the component you want to build…"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-600">
                Enter to send · Shift+Enter for newline
              </span>
              <PromptInputSubmit disabled={!input.trim() || !activeWidget} />
            </div>
          </PromptInput>
        </div>
      </aside>
    </div>
  );
}
