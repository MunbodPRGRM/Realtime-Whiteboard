"use client";

import Link from "next/link";
import type { Tool } from "@/lib/types";

const PRESET_COLORS = [
  "#111827", // near-black
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
];

type Props = {
  boardName: string;
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
};

export function Toolbar({
  boardName,
  tool,
  setTool,
  color,
  setColor,
  width,
  setWidth,
  onUndo,
  onClear,
  canUndo,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <Link
        href="/dashboard"
        className="text-sm text-blue-600 hover:underline"
      >
        ← บอร์ดของฉัน
      </Link>

      <span className="max-w-[12rem] truncate font-medium text-gray-900">
        {boardName}
      </span>

      <div className="mx-2 h-6 w-px bg-gray-200" />

      {/* Tool: pen / eraser */}
      <div className="flex gap-1">
        <button
          onClick={() => setTool("pen")}
          className={`rounded-md px-3 py-1 text-sm transition ${
            tool === "pen"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-100"
          }`}
        >
          ปากกา
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`rounded-md px-3 py-1 text-sm transition ${
            tool === "eraser"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-100"
          }`}
        >
          ยางลบ
        </button>
      </div>

      <div className="mx-2 h-6 w-px bg-gray-200" />

      {/* Color presets + custom picker */}
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setTool("pen");
            }}
            aria-label={`สี ${c}`}
            className={`h-6 w-6 rounded-full border transition ${
              color === c && tool === "pen"
                ? "ring-2 ring-blue-500 ring-offset-1"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setTool("pen");
          }}
          aria-label="เลือกสีเอง"
          className="h-6 w-6 cursor-pointer rounded border border-gray-300 bg-transparent p-0"
        />
      </div>

      <div className="mx-2 h-6 w-px bg-gray-200" />

      {/* Stroke width */}
      <label className="flex items-center gap-2 text-sm text-gray-700">
        ขนาด
        <input
          type="range"
          min={1}
          max={30}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
        <span className="w-6 text-right tabular-nums">{width}</span>
      </label>

      <div className="mx-2 h-6 w-px bg-gray-200" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-40"
      >
        ย้อนกลับ
      </button>
      <button
        onClick={onClear}
        disabled={!canUndo}
        className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-40"
      >
        ล้างทั้งหมด
      </button>
    </div>
  );
}
