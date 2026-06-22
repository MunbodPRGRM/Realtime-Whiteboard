"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Board } from "@/db/schema";
import { LogoutButton } from "@/components/LogoutButton";

function formatDate(value: Date | string) {
  const d = new Date(value);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardClient({
  initialBoards,
  userName,
}: {
  initialBoards: Board[];
  userName: string;
}) {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    const res = await fetch("/api/boards", { method: "POST" });
    setCreating(false);
    if (!res.ok) return;
    const { board } = await res.json();
    // Jump straight into the new board's editor.
    router.push(`/board/${board.id}`);
  }

  async function handleRename(board: Board) {
    const name = window.prompt("เปลี่ยนชื่อบอร์ด", board.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === board.name) return;

    setBusyId(board.id);
    const res = await fetch(`/api/boards/${board.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusyId(null);
    if (!res.ok) return;
    const { board: updated } = await res.json();
    setBoards((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
  }

  async function handleDelete(board: Board) {
    if (!window.confirm(`ลบบอร์ด "${board.name}"?`)) return;
    setBusyId(board.id);
    const res = await fetch(`/api/boards/${board.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) return;
    setBoards((prev) => prev.filter((b) => b.id !== board.id));
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← หน้าแรก
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            บอร์ดของฉัน
          </h1>
          <p className="text-sm text-gray-500">สวัสดี, {userName}</p>
        </div>
        <LogoutButton />
      </header>

      <button
        onClick={handleCreate}
        disabled={creating}
        className="mb-6 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {creating ? "กำลังสร้าง..." : "+ สร้างบอร์ดใหม่"}
      </button>

      {boards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          ยังไม่มีบอร์ด — กดปุ่มด้านบนเพื่อสร้างอันแรก
        </p>
      ) : (
        <ul className="space-y-3">
          {boards.map((board) => (
            <li
              key={board.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <Link href={`/board/${board.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 hover:text-blue-600">
                  {board.name}
                </p>
                <p className="text-xs text-gray-400">
                  แก้ไขล่าสุด {formatDate(board.updatedAt)}
                </p>
              </Link>
              <div className="ml-4 flex shrink-0 gap-2">
                <button
                  onClick={() => handleRename(board)}
                  disabled={busyId === board.id}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  เปลี่ยนชื่อ
                </button>
                <button
                  onClick={() => handleDelete(board)}
                  disabled={busyId === board.id}
                  className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
