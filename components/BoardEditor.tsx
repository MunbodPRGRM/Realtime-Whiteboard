"use client";

import { useState } from "react";
import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";
import type { LocalStroke, Tool } from "@/lib/types";

export function BoardEditor({
  boardId,
  boardName,
  initialStrokes,
}: {
  boardId: string;
  boardName: string;
  initialStrokes: LocalStroke[];
}) {
  const [strokes, setStrokes] = useState<LocalStroke[]>(initialStrokes);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#111827");
  const [width, setWidth] = useState(4);
  const [saving, setSaving] = useState(false);

  // Persist a finished stroke, then backfill its DB id into local state.
  async function persistStroke(stroke: LocalStroke) {
    setSaving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/strokes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: stroke.points,
          color: stroke.color,
          width: stroke.width,
        }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setStrokes((prev) =>
          prev.map((s) => (s === stroke ? { ...s, id } : s))
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleStrokeEnd(stroke: LocalStroke) {
    setStrokes((prev) => [...prev, stroke]);
    persistStroke(stroke);
  }

  async function handleUndo() {
    const last = strokes[strokes.length - 1];
    if (!last) return;
    setStrokes((prev) => prev.slice(0, -1));
    if (last.id) {
      setSaving(true);
      try {
        await fetch(`/api/boards/${boardId}/strokes/${last.id}`, {
          method: "DELETE",
        });
      } finally {
        setSaving(false);
      }
    }
  }

  async function handleClear() {
    if (strokes.length === 0) return;
    setStrokes([]);
    setSaving(true);
    try {
      await fetch(`/api/boards/${boardId}/strokes`, { method: "DELETE" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        boardName={boardName}
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        onUndo={handleUndo}
        onClear={handleClear}
        canUndo={strokes.length > 0}
        saving={saving}
      />
      <div className="relative flex-1 overflow-hidden bg-white">
        <Canvas
          strokes={strokes}
          color={color}
          width={width}
          tool={tool}
          onStrokeEnd={handleStrokeEnd}
        />
      </div>
    </div>
  );
}
