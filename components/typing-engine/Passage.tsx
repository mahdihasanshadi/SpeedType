"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { CharState } from "@/store/typing-store";
import { cn } from "@/lib/utils";

type CaretRect = { left: number; top: number; height: number };

export function Passage({
  passage,
  charStates,
  currentIndex,
}: {
  passage: string;
  charStates: CharState[];
  currentIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caretRect, setCaretRect] = useState<CaretRect | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // No span exists past the last character — anchor to the right edge of the previous one.
    const targetIndex = Math.min(currentIndex, passage.length - 1);
    const target = spanRefs.current[targetIndex];
    if (!target) return;

    const containerBox = container.getBoundingClientRect();
    const targetBox = target.getBoundingClientRect();
    const atEnd = currentIndex >= passage.length;

    setCaretRect({
      left: targetBox.left - containerBox.left + (atEnd ? targetBox.width : 0),
      top: targetBox.top - containerBox.top,
      height: targetBox.height,
    });
  }, [currentIndex, passage]);

  return (
    <div
      ref={containerRef}
      data-slot="passage"
      className="relative select-none font-mono text-body-lg leading-relaxed break-words"
    >
      {caretRect && (
        // A plain CSS transition, not Framer Motion — this updates on every keystroke, the
        // highest-frequency animation in the app, and a native transition is both simpler and
        // more predictable at that frequency than a JS-driven one. See ui-stack.md.
        <span
          aria-hidden
          className="absolute top-0 left-0 w-0.5 rounded-full bg-type-caret transition-transform duration-75 ease-out"
          style={{
            height: caretRect.height,
            transform: `translate(${caretRect.left}px, ${caretRect.top}px)`,
          }}
        />
      )}
      {passage.split("").map((char, i) => (
        <span
          key={i}
          ref={(el) => {
            spanRefs.current[i] = el;
          }}
          data-state={charStates[i]}
          className={cn(
            charStates[i] === "correct" && "text-type-correct",
            charStates[i] === "incorrect" &&
              "text-type-incorrect underline decoration-2 underline-offset-4",
            charStates[i] === "pending" && "text-type-pending",
          )}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
