"use client";

import { useCallback, type ComponentProps, type FormEventHandler, type KeyboardEvent } from "react";
import { CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PromptInput({
  className,
  children,
  onSubmit,
  ...props
}: Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit?: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form
      className={cn("flex flex-col gap-3", className)}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  );
}

export function PromptInputTextarea({
  className,
  onKeyDown,
  ...props
}: ComponentProps<"textarea">) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
      }
    },
    [onKeyDown]
  );

  return (
    <textarea
      rows={3}
      className={cn(
        "min-h-20 w-full resize-none rounded-none border border-zinc-700 bg-black px-2.5 py-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-600",
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export function PromptInputSubmit({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      size="icon-sm"
      className={cn(
        "border border-zinc-700 bg-zinc-100 text-zinc-900 hover:bg-white",
        className
      )}
      {...props}
    >
      {children ?? <CornerDownLeft className="size-4" />}
      <span className="sr-only">Send message</span>
    </Button>
  );
}
