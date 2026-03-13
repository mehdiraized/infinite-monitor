"use client";

import { useEffect, useState, useCallback } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
const TICK_MS = 35;
const STAGGER_MS = 60;

interface ScrambleTextProps {
  text: string;
  className?: string;
  charClassName?: (index: number) => string;
  delay?: number;
}

export function ScrambleText({
  text,
  className,
  charClassName,
  delay = 0,
}: ScrambleTextProps) {
  const [displayed, setDisplayed] = useState(() =>
    Array.from(text, () => " ")
  );
  const [settled, setSettled] = useState(() =>
    Array.from(text, () => false)
  );

  const randomChar = useCallback(
    () => CHARS[Math.floor(Math.random() * CHARS.length)],
    []
  );

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    const startTimeout = setTimeout(() => {
      text.split("").forEach((char, i) => {
        if (char === " ") {
          setDisplayed((d) => {
            const next = [...d];
            next[i] = " ";
            return next;
          });
          setSettled((s) => {
            const next = [...s];
            next[i] = true;
            return next;
          });
          return;
        }

        const interval = setInterval(() => {
          setDisplayed((d) => {
            const next = [...d];
            next[i] = randomChar();
            return next;
          });
        }, TICK_MS);
        intervals.push(interval);

        const settleTimeout = setTimeout(() => {
          clearInterval(interval);
          setDisplayed((d) => {
            const next = [...d];
            next[i] = char;
            return next;
          });
          setSettled((s) => {
            const next = [...s];
            next[i] = true;
            return next;
          });
        }, STAGGER_MS * (i + 1) + 200);
        timeouts.push(settleTimeout);
      });
    }, delay);
    timeouts.push(startTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [text, delay, randomChar]);

  return (
    <span className={className}>
      {displayed.map((char, i) => (
        <span
          key={i}
          className={[
            "inline-block transition-colors duration-150",
            settled[i] ? "" : "text-zinc-500",
            charClassName?.(i),
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
