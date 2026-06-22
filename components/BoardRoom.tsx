"use client";

import { useRef } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  useBroadcastEvent,
  useEventListener,
  useUpdateMyPresence,
} from "@liveblocks/react";
import { BoardCanvas, type BoardCanvasHandle } from "@/components/BoardCanvas";
import { CursorOverlay } from "@/components/CursorOverlay";
import { OnlinePresence } from "@/components/OnlinePresence";
import type { LocalStroke } from "@/lib/types";

type Props = {
  boardId: string;
  boardName: string;
  initialStrokes: LocalStroke[];
  realtimeEnabled: boolean;
};

export function BoardRoom({
  boardId,
  boardName,
  initialStrokes,
  realtimeEnabled,
}: Props) {
  // Without Liveblocks configured, render the plain (local + DB) editor.
  if (!realtimeEnabled) {
    return (
      <BoardCanvas
        boardId={boardId}
        boardName={boardName}
        initialStrokes={initialStrokes}
      />
    );
  }

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={80}>
      <RoomProvider id={`board-${boardId}`} initialPresence={{ cursor: null }}>
        <RealtimeBoard
          boardId={boardId}
          boardName={boardName}
          initialStrokes={initialStrokes}
        />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function RealtimeBoard({
  boardId,
  boardName,
  initialStrokes,
}: Omit<Props, "realtimeEnabled">) {
  const canvasRef = useRef<BoardCanvasHandle>(null);
  const broadcast = useBroadcastEvent();
  const updateMyPresence = useUpdateMyPresence();

  // Apply events from other participants to the local canvas.
  useEventListener(({ event }) => {
    if (event.type === "stroke") {
      canvasRef.current?.applyRemoteStroke(event.stroke);
    } else if (event.type === "undo") {
      canvasRef.current?.applyRemoteUndo(event.id);
    } else if (event.type === "clear") {
      canvasRef.current?.applyRemoteClear();
    }
  });

  return (
    <BoardCanvas
      ref={canvasRef}
      boardId={boardId}
      boardName={boardName}
      initialStrokes={initialStrokes}
      realtime={{
        broadcastStroke: (stroke) => broadcast({ type: "stroke", stroke }),
        broadcastUndo: (id) => broadcast({ type: "undo", id }),
        broadcastClear: () => broadcast({ type: "clear" }),
        onCursor: (cursor) => updateMyPresence({ cursor }),
        cursorsOverlay: <CursorOverlay />,
        presenceSlot: <OnlinePresence />,
      }}
    />
  );
}
