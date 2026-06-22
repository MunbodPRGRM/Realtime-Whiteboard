import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const { name, username, password } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (existing) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(users)
      .values({ name, username, password: hashed })
      .returning({ id: users.id, username: users.username });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}
