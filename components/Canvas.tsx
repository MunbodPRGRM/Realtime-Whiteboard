"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LocalStroke, Point, Tool } from "@/lib/types";

const ERASER_COLOR = "#ffffff";

type Props = {
  strokes: LocalStroke[];
  color: string;
  width: number;
  tool: Tool;
  onStrokeEnd: (stroke: LocalStroke) => void;
};

export function Canvas({ strokes, color, width, tool, onStrokeEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentRef = useRef<Point[]>([]);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: LocalStroke) => {
      if (stroke.points.length === 0) return;

      // A single point (tap without dragging) renders as a filled dot.
      if (stroke.points.length === 1) {
        const p = stroke.points[0];
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
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    },
    []
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

  const pointFromEvent = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
      ctx.fillStyle = activeColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const p = pointFromEvent(e);
    const points = currentRef.current;
    const prev = points[points.length - 1];
    points.push(p);

    const ctx = getCtx();
    if (!ctx) return;
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
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

  return (
    <canvas
      ref={canvasRef}
      className="block cursor-crosshair touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
