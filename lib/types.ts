// Shared drawing types used by the canvas editor (and later persisted to DB).

export type Point = { x: number; y: number };

export type Tool = "pen" | "eraser";

/** A single freehand stroke held in client state before it's saved. */
export type LocalStroke = {
  points: Point[];
  color: string;
  width: number;
};
