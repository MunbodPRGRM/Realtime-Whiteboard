# Sketchsync

ไวท์บอร์ดวาดร่วมกันแบบเรียลไทม์ (real-time collaborative whiteboard) — โปรเจกต์ฝึกฝีมือ

## Tech Stack

- **Next.js 14** (App Router) — fullstack
- **Tailwind CSS**
- **HTML5 Canvas** — freehand drawing (พิกัด normalized 0–1)
- **Liveblocks** — real-time sync (stroke broadcast + cursor presence)
- **NextAuth.js** — auth แบบ username/password (Credentials provider)
- **Drizzle ORM + `pg`** — PostgreSQL (ไม่ใช้ Prisma)
- Deploy: **Vercel** + DB hosting: **Neon**

## โครงสร้าง

```
app/
├── page.tsx                       landing (รู้สถานะ login)
├── login, register/page.tsx       หน้า auth
├── dashboard/page.tsx             รายการบอร์ดของ user
├── board/[boardId]/page.tsx       whiteboard editor
└── api/
    ├── auth/[...nextauth]         NextAuth handler
    ├── register                   สมัครสมาชิก (bcrypt)
    ├── boards, boards/[id]        CRUD บอร์ด
    ├── boards/[id]/strokes        เซฟ/โหลด/ลบ stroke
    └── liveblocks-auth            ออก token ให้ Liveblocks
components/   Canvas, Toolbar, BoardCanvas, BoardRoom, CursorOverlay, OnlinePresence, ...
db/          schema.ts (Drizzle), migrations/
lib/         db.ts, auth.ts, types.ts
liveblocks.config.ts               global types ของ Liveblocks
middleware.ts                      ป้องกัน /dashboard, /board
```

## เริ่มใช้งาน (local)

```bash
npm install
cp .env.example .env        # แล้วแก้ค่าใน .env
npm run db:migrate          # สร้างตารางใน Postgres local
npm run dev                 # http://localhost:3000
```

### Environment variables (`.env`)

| ตัวแปร | จำเป็น | คำอธิบาย |
|--------|--------|----------|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `NEXTAUTH_SECRET` | ✅ | สุ่มด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | ✅ | local: `http://localhost:3000` / prod: URL จริง |
| `LIVEBLOCKS_SECRET_KEY` | ⬜ | จาก liveblocks.io — ถ้าไม่ใส่ แอปยังวาด+เซฟได้ แต่ไม่มี realtime |

> ถ้าไม่ใส่ `LIVEBLOCKS_SECRET_KEY` แอปจะรันแบบ local + DB (degrade gracefully)

## Scripts

| คำสั่ง | ทำอะไร |
|--------|--------|
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / run |
| `npm run db:generate` | สร้าง SQL migration จาก schema |
| `npm run db:migrate` | apply migration เข้า DB (non-interactive) |
| `npm run db:studio` | เปิด Drizzle Studio ดูข้อมูล |

> ใช้ `db:migrate` ไม่ใช่ `db:push` — `push` ต้องการ TTY (กดยืนยัน) ซึ่งไม่เหมาะกับ CI

## Deploy (Vercel + Neon)

### 1. เตรียม Database บน Neon
1. สร้าง project ที่ [neon.tech](https://neon.tech) → คัดลอก **pooled connection string** (endpoint มี `-pooler`, ลงท้าย `?sslmode=require`)
2. apply schema ขึ้น Neon (รันจากเครื่อง โดยชี้ `DATABASE_URL` ไป Neon ชั่วคราว):
   ```bash
   DATABASE_URL="<neon-pooled-url>" npm run db:migrate
   ```

### 2. Deploy บน Vercel
1. push repo ขึ้น Git แล้ว import เข้า [vercel.com](https://vercel.com) (framework: Next.js — auto detect)
2. ตั้ง **Environment Variables** ใน Vercel:
   - `DATABASE_URL` = Neon pooled URL
   - `NEXTAUTH_SECRET` = ค่าสุ่ม (ตัวใหม่สำหรับ prod ได้)
   - `NEXTAUTH_URL` = URL ของ deployment (เช่น `https://sketchsync.vercel.app`)
   - `LIVEBLOCKS_SECRET_KEY` = key จาก Liveblocks
3. Deploy — Vercel รัน `next build` ให้อัตโนมัติ

### หมายเหตุ production
- ใช้ Neon **pooled** endpoint เพราะ serverless function เปิด connection เยอะ (กัน connection exhaustion)
- ตั้ง `NEXTAUTH_URL` ให้ตรงกับ domain จริง ไม่งั้น callback ของ NextAuth จะเพี้ยน
- พิกัด stroke เป็น normalized แล้ว → วาดข้ามจอ/อุปกรณ์ตรงกัน

## สถานะการพัฒนา

| Phase | สถานะ |
|-------|-------|
| 1 Setup + DB (Drizzle) | ✅ |
| 2 Auth (NextAuth) | ✅ |
| 3 Dashboard CRUD | ✅ |
| 4 Canvas freehand | ✅ |
| 5 Liveblocks realtime | ✅ |
| 6 Save/load strokes (DB) | ✅ |
| 7 Deploy (Vercel + Neon) | ✅ |
