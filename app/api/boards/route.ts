import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards } from "@/db/schema";

// GET /api/boards — list the current user's boards (newest first).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(boards)
    .where(eq(boards.ownerId, session.user.id))
    .orderBy(desc(boards.updatedAt));

  return NextResponse.json({ boards: rows });
}

// POST /api/boards — create a new board for the current user.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let name = "บอร์ดใหม่";
  try {
    const body = await req.json();
    if (typeof body?.name === "string" && body.name.trim()) {
      name = body.name.trim();
    }
  } catch {
    // No/invalid JSON body — fall back to the default name.
  }

  const [created] = await db
    .insert(boards)
    .values({ name, ownerId: session.user.id })
    .returning();

  return NextResponse.json({ board: created }, { status: 201 });
}
