# Project Context: Real-time Collaborative Whiteboard

## Project Name
Sketchsync (ปรับได้)

## Goal
ฝึกทักษะ / เรียนรู้ — ไม่ได้ใช้งาน production จริง

## Tech Stack
- Framework: Next.js 14 (App Router) — fullstack, deploy ครั้งเดียว
- Styling: Tailwind CSS
- Canvas / Drawing: HTML5 Canvas API (freehand stroke)
- Real-time: Liveblocks (managed WebSocket, ฟรี dev tier)
- Auth: NextAuth.js — **username/password เท่านั้น (Credentials provider, ไม่มี OAuth)**
- Database (code → DB): **`pg` (node-postgres) + Drizzle ORM** — ไม่ใช้ Prisma (รู้สึกว่า Prisma ซับซ้อนเกินจำเป็น, codegen step, schema DSL แยก)
  - Drizzle: schema เขียนเป็น TypeScript ตรงๆ ไม่มี codegen, syntax ใกล้ SQL, migration จัดการผ่าน `drizzle-kit`
- Database (เครื่องมือดูข้อมูล): PostgreSQL local ผ่าน pgAdmin4 (สำหรับ dev เท่านั้น, ไม่ได้แทนที่ driver ในโค้ด)
- Deploy: Vercel
- Database hosting (ตอน deploy): **Neon** — เลือกเพราะผูกกับ Vercel แน่นกว่า Supabase, ไม่จำเป็นต้องใช้ฟีเจอร์ auth/storage/realtime ของ Supabase เพราะมี NextAuth + Liveblocks อยู่แล้ว

## Features (MVP)
1. Freehand drawing บน canvas
2. Real-time sync หลายคนในห้องเดียวกัน (via Liveblocks)
3. Login / User system (NextAuth, username/password)
4. สร้าง Board ได้หลายอัน, เซฟ stroke ใน DB
5. แชร์ Board ด้วย link (roomId)
6. แสดง cursor ของ user อื่น real-time

## Data Model (Drizzle schema)
- User: id, name, username, password (hashed), createdAt
- Board: id, name, ownerId (→ User), createdAt, updatedAt
- Stroke: id, boardId (→ Board), points (JSON), color, width, userId

## Project Structure
```
app/
├── page.tsx                  ← landing / login redirect
├── dashboard/page.tsx        ← รายการ board ของ user
├── board/[boardId]/page.tsx  ← whiteboard editor
├── api/
│   ├── auth/[...nextauth]/   ← NextAuth handler
│   ├── boards/               ← CRUD boards
│   └── liveblocks-auth/      ← Liveblocks auth endpoint
components/
├── Canvas.tsx                ← freehand drawing + Liveblocks sync
├── Toolbar.tsx               ← pen, eraser, color picker, stroke width
└── CursorOverlay.tsx         ← แสดง cursor user อื่น
lib/
├── liveblocks.ts             ← Liveblocks client config
├── db.ts                     ← DB connection (pg pool + Drizzle instance)
└── auth.ts                   ← NextAuth config
db/
└── schema.ts                 ← Drizzle schema (User, Board, Stroke)
```

## Development Phases
1. Next.js + Tailwind setup, ต่อ PostgreSQL local ผ่าน `pg` + Drizzle
2. NextAuth login/register (username/password)
3. Dashboard — CRUD boards
4. Canvas freehand drawing (local only)
5. Liveblocks integration — real-time sync + cursor (ต้องสมัคร account ที่ liveblocks.io ก่อน)
6. Save/load strokes from DB
7. Deploy to Vercel + ย้าย DB ไป Neon

## Status / Open Items
- PostgreSQL local (port 5432) — มีอยู่แล้ว, ใช้งานผ่าน pgAdmin4
- Liveblocks — ยังไม่มี account, ต้องสมัครก่อนถึง phase 5
- NextAuth secret — ต้องตั้งใน `.env`
- Neon — ยังไม่ตั้งค่า, ใช้ตอน deploy เท่านั้น (phase 7)

## Key Decisions (เหตุผล)
- **ไม่ใช้ Prisma** → เลือก Drizzle เพราะไม่มี codegen step, bundle เบากว่า (~5KB vs ~40KB+), เขียนแบบใกล้ SQL, รองรับ edge/Vercel ได้ดีกว่า
- **ไม่ใช้ OAuth** → ลดความซับซ้อนของ setup (ไม่ต้องสร้าง Google Cloud credentials)
- **เลือก Neon over Supabase** → ไม่ต้องการฟีเจอร์ auth/storage/realtime ที่ Supabase bundle มา เพราะมี NextAuth + Liveblocks จัดการเองอยู่แล้ว, Neon ผูกกับ Vercel แน่นกว่า
