"use client";

import { useEffect, useRef, useState } from "react";
import { useOthers } from "@liveblocks/react";

// Stable per-connection colors for other users' cursors.
const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function CursorOverlay() {
  const others = useOthers();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Track the overlay's pixel size so we can place normalized cursors.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      {others.map(({ connectionId, presence, info }) => {
        if (!presence.cursor) return null;
        const color = COLORS[connectionId % COLORS.length];
        return (
          <div
            key={connectionId}
            className="absolute -translate-y-1 select-none transition-transform duration-100 ease-linear"
            style={{
              transform: `translate(${presence.cursor.x * size.w}px, ${
                presence.cursor.y * size.h
              }px)`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 2l14 7-6 2-2 6-6-15z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="ml-3 whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-white"
              style={{ backgroundColor: color }}
            >
              {info?.name ?? "ผู้ใช้"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
