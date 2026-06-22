"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LocalStroke, Point, Tool } from "@/lib/types";

const ERASER_COLOR = "#ffffff";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

type Props = {
  strokes: LocalStroke[];
  color: string;
  width: number;
  tool: Tool;
  onStrokeEnd: (stroke: LocalStroke) => void;
  // Reports the pointer position over the canvas (null when it leaves),
  // used to broadcast the live cursor in real-time mode. Normalized 0..1.
  onCursor?: (point: Point | null) => void;
};

export function Canvas({
  strokes,
  color,
  width,
  tool,
  onStrokeEnd,
  onCursor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentRef = useRef<Point[]>([]);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  // Stroke/cursor coordinates are stored normalized (0..1) so a drawing
  // looks the same on any canvas size. Convert to CSS pixels for rendering.
  const toPx = useCallback((p: Point) => {
    const canvas = canvasRef.current;
    const w = canvas?.clientWidth ?? 0;
    const h = canvas?.clientHeight ?? 0;
    return { x: p.x * w, y: p.y * h };
  }, []);

  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: LocalStroke) => {
      if (stroke.points.length === 0) return;

      // A single point (tap without dragging) renders as a filled dot.
      if (stroke.points.length === 1) {
        const p = toPx(stroke.points[0]);
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const first = toPx(stroke.points[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = toPx(stroke.points[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    },
    [toPx]
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = ERASER_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const stroke of strokes) drawStroke(ctx, stroke);
  }, [strokes, drawStroke]);

  // Keep the canvas backing store sized to its container (DPR-aware).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      redraw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  // Redraw whenever the stroke list changes (undo, clear, new stroke).
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Normalized point (0..1) from a pointer event.
  const pointFromEvent = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  };

  const activeColor = tool === "eraser" ? ERASER_COLOR : color;

  const handlePointerDown = (e: React.PointerEvent) => {
    drawingRef.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    const p = pointFromEvent(e);
    currentRef.current = [p];

    // Draw the starting dot immediately for instant feedback.
    const ctx = getCtx();
    if (ctx) {
      const px = toPx(p);
      ctx.fillStyle = activeColor;
      ctx.beginPath();
      ctx.arc(px.x, px.y, width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const cursor = pointFromEvent(e);
    onCursor?.(cursor);

    if (!drawingRef.current) return;
    const points = currentRef.current;
    const prev = points[points.length - 1];
    points.push(cursor);

    const ctx = getCtx();
    if (!ctx) return;
    const from = toPx(prev);
    const to = toPx(cursor);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const points = currentRef.current;
    if (points.length > 0) {
      onStrokeEnd({ points, color: activeColor, width });
    }
    currentRef.current = [];
  };

  const handlePointerLeave = () => {
    handlePointerUp();
    onCursor?.(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="block cursor-crosshair touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}
