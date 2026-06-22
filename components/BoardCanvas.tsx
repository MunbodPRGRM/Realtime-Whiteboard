"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";
import type { LocalStroke, Point, Tool } from "@/lib/types";

// Imperative API the real-time bridge uses to apply remote events.
export type BoardCanvasHandle = {
  applyRemoteStroke: (stroke: LocalStroke) => void;
  applyRemoteUndo: (id: string) => void;
  applyRemoteClear: () => void;
};

// Optional real-time wiring. Absent when Liveblocks is not configured.
export type RealtimeAdapter = {
  broadcastStroke: (stroke: LocalStroke) => void;
  broadcastUndo: (id: string) => void;
  broadcastClear: () => void;
  onCursor: (point: Point | null) => void;
  cursorsOverlay: React.ReactNode;
  presenceSlot: React.ReactNode;
};

type Props = {
  boardId: string;
  boardName: string;
  initialStrokes: LocalStroke[];
  realtime?: RealtimeAdapter;
};

export const BoardCanvas = forwardRef<BoardCanvasHandle, Props>(
  function BoardCanvas({ boardId, boardName, initialStrokes, realtime }, ref) {
    const [strokes, setStrokes] = useState<LocalStroke[]>(initialStrokes);
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState("#111827");
    const [width, setWidth] = useState(4);
    const [saving, setSaving] = useState(false);

    // --- Remote events: update local state only, never re-persist. ---
    useImperativeHandle(ref, () => ({
      applyRemoteStroke: (stroke) =>
        setStrokes((prev) => [...prev, stroke]),
      applyRemoteUndo: (id) =>
        setStrokes((prev) => prev.filter((s) => s.id !== id)),
      applyRemoteClear: () => setStrokes([]),
    }), []);

    // Persist a finished stroke, backfill its id, then broadcast it.
    const persistStroke = useCallback(
      async (stroke: LocalStroke) => {
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
            realtime?.broadcastStroke({ ...stroke, id });
          }
        } finally {
          setSaving(false);
        }
      },
      [boardId, realtime]
    );

    function handleStrokeEnd(stroke: LocalStroke) {
      setStrokes((prev) => [...prev, stroke]);
      persistStroke(stroke);
    }

    async function handleUndo() {
      const last = strokes[strokes.length - 1];
      if (!last) return;
      setStrokes((prev) => prev.slice(0, -1));
      if (last.id) {
        realtime?.broadcastUndo(last.id);
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
      if (!window.confirm("ล้างเส้นทั้งหมดในบอร์ดนี้? (ลบถาวร)")) return;
      setStrokes([]);
      realtime?.broadcastClear();
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
          presenceSlot={realtime?.presenceSlot}
        />
        <div className="relative flex-1 overflow-hidden bg-white">
          <Canvas
            strokes={strokes}
            color={color}
            width={width}
            tool={tool}
            onStrokeEnd={handleStrokeEnd}
            onCursor={realtime?.onCursor}
          />
          {realtime?.cursorsOverlay}
        </div>
      </div>
    );
  }
);
