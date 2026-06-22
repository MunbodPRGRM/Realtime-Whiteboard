import type { LocalStroke, Point } from "@/lib/types";

// Global Liveblocks types (presence, user metadata, broadcast events).
// Augmenting the global `Liveblocks` interface makes all hooks strongly typed.
declare global {
  interface Liveblocks {
    // Per-connection presence — here, just the live cursor position.
    Presence: {
      cursor: Point | null;
    };

    // Attached server-side in the auth endpoint from the NextAuth session.
    UserMeta: {
      id: string;
      info: {
        name: string;
      };
    };

    // Fire-and-forget events broadcast between participants.
    RoomEvent:
      | { type: "stroke"; stroke: LocalStroke }
      | { type: "undo"; id: string }
      | { type: "clear" };
  }
}

export {};
