import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards } from "@/db/schema";

type Params = { params: { boardId: string } };

// PATCH /api/boards/:boardId — rename a board the current user owns.
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อบอร์ด" }, { status: 400 });
  }

  const [updated] = await db
    .update(boards)
    .set({ name, updatedAt: new Date() })
    .where(
      and(eq(boards.id, params.boardId), eq(boards.ownerId, session.user.id))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "ไม่พบบอร์ด" }, { status: 404 });
  }

  return NextResponse.json({ board: updated });
}

// DELETE /api/boards/:boardId — delete a board (strokes cascade).
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [deleted] = await db
    .delete(boards)
    .where(
      and(eq(boards.id, params.boardId), eq(boards.ownerId, session.user.id))
    )
    .returning({ id: boards.id });

  if (!deleted) {
    return NextResponse.json({ error: "ไม่พบบอร์ด" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
