// Shared drawing types used by the canvas editor (and later persisted to DB).

export type Point = { x: number; y: number };

export type Tool = "pen" | "eraser";

/**
 * A single freehand stroke held in client state. `id` is the DB id once the
 * stroke has been persisted (absent while it's still being saved).
 */
export type LocalStroke = {
  id?: string;
  points: Point[];
  color: string;
  width: number;
};
