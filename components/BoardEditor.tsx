"use client";

import { useState } from "react";
import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";
import type { LocalStroke, Tool } from "@/lib/types";

export function BoardEditor({
  boardId,
  boardName,
}: {
  boardId: string;
  boardName: string;
}) {
  // boardId will be used in Phase 6 (save/load) and Phase 5 (Liveblocks room).
  void boardId;

  const [strokes, setStrokes] = useState<LocalStroke[]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#111827");
  const [width, setWidth] = useState(4);

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
        onUndo={() => setStrokes((prev) => prev.slice(0, -1))}
        onClear={() => setStrokes([])}
        canUndo={strokes.length > 0}
      />
      <div className="relative flex-1 overflow-hidden bg-white">
        <Canvas
          strokes={strokes}
          color={color}
          width={width}
          tool={tool}
          onStrokeEnd={(stroke) => setStrokes((prev) => [...prev, stroke])}
        />
      </div>
    </div>
  );
}
