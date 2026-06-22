import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { asc, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards, strokes } from "@/db/schema";

type Params = { params: { boardId: string } };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ensures the request is authenticated and the board exists.
// Returns the session user id, or a NextResponse to short-circuit.
async function requireBoard(boardId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (!UUID_RE.test(boardId)) {
    return { error: NextResponse.json({ error: "ไม่พบบอร์ด" }, { status: 404 }) };
  }
  const board = await db.query.boards.findFirst({ where: eq(boards.id, boardId) });
  if (!board) {
    return { error: NextResponse.json({ error: "ไม่พบบอร์ด" }, { status: 404 }) };
  }
  return { userId: session.user.id };
}

// GET /api/boards/:boardId/strokes — all strokes in draw order.
export async function GET(_req: Request, { params }: Params) {
  const guard = await requireBoard(params.boardId);
  if ("error" in guard) return guard.error;

  const rows = await db
    .select({
      id: strokes.id,
      points: strokes.points,
      color: strokes.color,
      width: strokes.width,
    })
    .from(strokes)
    .where(eq(strokes.boardId, params.boardId))
    .orderBy(asc(strokes.createdAt));

  return NextResponse.json({ strokes: rows });
}

// POST /api/boards/:boardId/strokes — persist one stroke.
export async function POST(req: Request, { params }: Params) {
  const guard = await requireBoard(params.boardId);
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const points = body?.points;
  const color = body?.color;
  const width = body?.width;

  if (
    !Array.isArray(points) ||
    points.length === 0 ||
    typeof color !== "string" ||
    typeof width !== "number"
  ) {
    return NextResponse.json({ error: "ข้อมูลเส้นไม่ถูกต้อง" }, { status: 400 });
  }

  const [created] = await db
    .insert(strokes)
    .values({
      boardId: params.boardId,
      userId: guard.userId,
      points,
      color,
      width,
    })
    .returning({ id: strokes.id });

  // Touch the board so the dashboard reflects recent activity.
  await db
    .update(boards)
    .set({ updatedAt: new Date() })
    .where(eq(boards.id, params.boardId));

  return NextResponse.json({ id: created.id }, { status: 201 });
}

// DELETE /api/boards/:boardId/strokes — clear the whole board.
export async function DELETE(_req: Request, { params }: Params) {
  const guard = await requireBoard(params.boardId);
  if ("error" in guard) return guard.error;

  await db.delete(strokes).where(eq(strokes.boardId, params.boardId));
  await db
    .update(boards)
    .set({ updatedAt: new Date() })
    .where(eq(boards.id, params.boardId));

  return NextResponse.json({ ok: true });
}
