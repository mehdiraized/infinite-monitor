"use client";

import { memo, type ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export function Message({
  className,
  from,
  ...props
}: ComponentProps<"div"> & {
  from: "user" | "assistant";
}) {
  return (
    <div
      data-from={from}
      className={cn(
        "group flex w-full max-w-[92%] flex-col gap-2",
        "data-[from=user]:ml-auto data-[from=user]:items-end",
        "data-[from=assistant]:items-start",
        className
      )}
      {...props}
    />
  );
}

export function MessageContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden text-xs",
        "group-data-[from=user]:bg-zinc-800 group-data-[from=user]:px-4 group-data-[from=user]:py-3 group-data-[from=user]:text-zinc-100",
        "group-data-[from=assistant]:text-zinc-200",
        className
      )}
      {...props}
    />
  );
}

export const MessageResponse = memo(function MessageResponse({
  className,
  ...props
}: ComponentProps<typeof Streamdown>) {
  return (
    <Streamdown
      className={cn(
        "prose prose-invert prose-xs max-w-none wrap-break-word whitespace-pre-wrap [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:break-all [&_code]:break-all",
        className
      )}
      {...props}
    />
  );
});
