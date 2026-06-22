---
name: web-stack-preferences
description: >
  Personal default tech-stack preferences for Natakrit's web app projects (Next.js fullstack,
  learning/practice projects). Captures decisions made while building Sketchsync (real-time
  whiteboard) so future projects start from the same defaults instead of re-litigating them.
  Use this skill whenever starting a new web app project, choosing an ORM/database layer,
  setting up authentication, picking a database host, or planning development phases for a
  Next.js + PostgreSQL app — even if the user doesn't explicitly ask "what stack should I use."
  Trigger on phrases like "เริ่มโปรเจกต์ใหม่", "ควรใช้ ORM ตัวไหน", "ตั้ง auth ยังไง",
  "Supabase หรือ Neon", or any request to scaffold/plan a Next.js + Postgres project.
---

# Web Stack Preferences

แนวทาง default สำหรับโปรเจกต์ฝึกฝีมือ/เรียนรู้แบบ Next.js fullstack ของ Natakrit — มาจากบทเรียนตอนวางแผนโปรเจกต์ Sketchsync (real-time whiteboard)

## หลักคิดรวม

เลือก tool ที่ **เบาและตรงไปตรงมาที่สุดที่ยังพอใช้งานได้** มากกว่า tool ที่ฟีเจอร์ครบแต่มี abstraction/setup เยอะ โดยเฉพาะกับโปรเจกต์ฝึกฝีมือที่เป้าหมายคือเข้าใจของจริงข้างใต้ ไม่ใช่ ship เร็วที่สุด ถ้าจะเพิ่ม complexity (เช่น OAuth, paid service, backend platform ที่ bundle ฟีเจอร์เยอะ) ให้ถามผู้ใช้ก่อนเสมอ อย่าเพิ่มเองโดยไม่ถาม

## ORM / Database layer

**Default: `pg` (node-postgres) + Drizzle ORM — ไม่ใช่ Prisma**

เหตุผล:
- ไม่มี codegen step (Prisma ต้องรัน `prisma generate` ทุกครั้งที่แก้ schema, ขัดจังหวะ dev loop)
- Schema เขียนเป็น TypeScript ตรงๆ ไม่มี DSL แยก (`.prisma` file)
- Syntax ใกล้ SQL มาก — เหมาะกับโปรเจกต์เรียนรู้ที่อยากเห็น SQL จริงข้างหลัง
- Bundle เล็กกว่ามาก (~5KB vs Prisma client ~40KB + binary ~50MB)
- รองรับ edge runtime / Vercel ได้ดีกว่าโดยไม่ต้องพึ่ง paid proxy (Prisma Accelerate)

ถ้าผู้ใช้บอกว่าอยากได้อะไรที่ "ง่ายกว่า Drizzle อีก" ให้เสนอ raw `pg` ล้วนๆ (เขียน SQL เองทุกคำสั่ง ไม่มี ORM เลย) เป็นตัวเลือกถัดไป — แต่เตือนว่าจะไม่มี type safety และต้องเขียน migration SQL เอง

อย่าเสนอ Prisma เป็น default แม้จะเป็นตัวที่นิยมสุดในตลาด เพราะผู้ใช้คนนี้ feedback ตรงว่ารู้สึกว่า Prisma ซับซ้อนเกินจำเป็นสำหรับ scope งานแบบนี้

## Authentication

**Default: NextAuth.js, Credentials provider (username/password) เท่านั้น — ไม่เพิ่ม OAuth (Google/GitHub ฯลฯ) เว้นแต่ผู้ใช้ขอ**

เหตุผล: OAuth เพิ่มงาน setup ที่ไม่เกี่ยวกับ core ของแอป (ไปสร้าง credentials ใน Google Cloud Console, จัดการ callback URL, ฯลฯ) สำหรับโปรเจกต์ฝึกฝีมือยังไม่จำเป็น

ถ้าผู้ใช้พูดถึง auth โดยไม่ระบุ ให้ถือว่าหมายถึง username/password ก่อน แล้วถามว่าต้องการ OAuth เพิ่มไหม

### รายละเอียดที่ใช้ได้จริง (NextAuth v4 + Credentials)

- ใช้ **NextAuth v4** (`next-auth@4`) กับ Next 14 App Router — เสถียร, doc เยอะ, เข้ากับ route `app/api/auth/[...nextauth]/route.ts` ที่ export `{ handler as GET, handler as POST }` ไม่เลือก v5/Auth.js ที่ยัง beta เว้นแต่ผู้ใช้ขอ
- Hash ด้วย **`bcryptjs`** (pure JS) ไม่ใช่ `bcrypt` (native, มักพังตอน compile บน Windows) — `bcrypt.hash(pw, 10)` / `bcrypt.compare`
- `session.strategy: "jwt"` + callbacks `jwt`/`session` เพื่อยัด `id`/`username` custom เข้า token/session แล้ว augment type ใน `types/next-auth.d.ts` (`declare module "next-auth"` + `"next-auth/jwt"`)
- แยก register เป็น API route ของตัวเอง (`/api/register`) ไม่ผูกกับ NextAuth — ตรวจซ้ำ username, validate, hash, insert, `.returning()` เฉพาะ field ปลอดภัย (ไม่คืน password)
- `SessionProvider` ต้องอยู่ใน client component (`app/providers.tsx` มี `"use client"`) แล้วครอบใน `layout.tsx`; ฝั่ง server อ่าน session ด้วย `getServerSession(authOptions)`

### ทดสอบ login flow แบบ non-browser (curl)

NextAuth credentials callback ต้องมี CSRF token + cookie jar:
1. `GET /api/auth/csrf` (เก็บ cookie ด้วย `-c jar`) → ดึง `csrfToken`
2. `POST /api/auth/callback/credentials` แบบ `x-www-form-urlencoded` ส่ง `csrfToken`,`username`,`password` (`-b jar -c jar`) → สำเร็จ = **302 ไป `/`**, ผิด = **302 ไป `/api/auth/error?error=CredentialsSignin`**
3. `GET /api/auth/session` (`-b jar`) → สำเร็จคืน user object, ไม่ผ่านคืน `{}`

### Route protection (middleware)

- ป้องกัน route ด้วย `next-auth/middleware` + `matcher` ใน `export const config`
- **`export { default } from "next-auth/middleware"` (แบบสั้น) จะ redirect ไป `/api/auth/signin` เสมอ** ไม่สน `pages.signIn` ใน authOptions → ถ้าอยากให้ไปหน้า custom (`/login`) ต้องใช้ `withAuth({ pages: { signIn: "/login" } })` แทน
- middleware redirect ใช้ status **307** (ไม่ใช่ 302) พร้อม `?callbackUrl=` ติดมาด้วย
- ใน API route / server component บังคับ ownership ด้วย `where(and(eq(table.id, id), eq(table.ownerId, session.user.id)))` แล้วเช็คผล `.returning()` ว่าว่าง → คืน 404 (กันคนแก้/ลบ resource ของคนอื่น โดยไม่ leak ว่ามีอยู่จริงไหม)
- อ่าน session ใน API route ด้วย `getServerSession(authOptions)` (ฝั่ง server)

### ⚠️ NextAuth v4 middleware (`withAuth`) บน Vercel Edge เด้ง login ทั้งที่ login แล้ว — เจอจริงตอน deploy

อาการ: register/login สำเร็จ, หน้าแรกเห็นว่า login แล้ว, `/api/auth/session` คืน user object ครบ — **แต่กดเข้า route ที่ middleware ป้องกัน (`/dashboard`) กลับเด้ง `/login`**
- วินิจฉัย: ถ้า `/api/auth/session` (Node, `getServerSession`) คืน user แต่ middleware เด้ง → ปัญหาอยู่ที่ **`getToken` บน Edge runtime ล้วน ๆ** (decode token ฝั่ง edge ไม่ตรงกับ Node) ไม่ใช่ cookie/secret/NEXTAUTH_URL (พวกนั้นถูกหมดแล้ว)
- **ทางแก้ที่เชื่อถือได้บน App Router: ไม่ต้องพึ่ง edge middleware เลย** — ใส่ guard ในตัว server component page (`const s = await getServerSession(authOptions); if(!s?.user) redirect("/login")`) ซึ่ง `getServerSession` ทำงานบน prod แน่นอน แล้ว**ลบ `middleware.ts` ทิ้ง** (ความปลอดภัยอยู่ที่ page guard ครบ); หลังลบ build จะไม่มีบรรทัด `ƒ Middleware` อีก
- บทเรียน: บน App Router อย่า duplicate auth ไว้ทั้ง middleware + page — page-level `getServerSession` reliable กว่า edge `getToken`; ถ้าจะใช้ middleware ต้องเทสต์บน prod จริง ไม่ใช่แค่ local (local เป็น http ไม่เจอปัญหา secure-cookie/edge)

## Database hosting (production / deploy)

**เลือกระหว่าง Neon vs Supabase ด้วยคำถามนี้: โปรเจกต์ใช้ฟีเจอร์ auth/storage/realtime ของ Supabase ไหม?**

- ถ้า **ไม่ใช้** (มี NextAuth + Liveblocks หรือ realtime library อื่นจัดการเองอยู่แล้ว) → เลือก **Neon** เพราะผูกกับ Vercel แน่นกว่า (Neon เป็น engine เดียวกับ Vercel Postgres), serverless driver ใช้กับ Prisma/Drizzle ได้ทันทีไม่ต้องตั้งค่าเยอะ, มี database branching สำหรับ preview deploy
- ถ้า **ใช้** ฟีเจอร์ bundle ของ Supabase (เช่นอยากได้ storage หรือ realtime subscription ในตัวโดยไม่อยากตั้ง service แยก) → เลือก **Supabase** เพราะ dashboard ครบกว่า ลด setup หลายจุดพร้อมกัน

อย่าตั้งสมมติฐานเองว่าต้องใช้ Supabase เพราะ "ครบกว่า" — ต้องเช็คก่อนว่าฟีเจอร์ extra ของมันจำเป็นจริงไหม

### Checklist ตอน deploy Next.js + Drizzle + NextAuth ขึ้น Vercel + Neon

- รัน `next build` ในเครื่องก่อน push เสมอ — จับ type/lint error + ดู route map (static `○` vs dynamic `ƒ`) ที่นี่ก่อนเสีย build minute บน Vercel
- **Neon ใช้ pooled connection string** (endpoint มี `-pooler`, `?sslmode=require`) สำหรับ serverless — กัน connection exhaustion ; `pg` honor `sslmode=require` จาก URL อยู่แล้ว ไม่ต้องตั้ง `ssl` ในโค้ด (Neon cert valid)
- apply schema ขึ้น Neon ด้วยการชี้ `DATABASE_URL` ไป Neon ชั่วคราวแล้วรัน `db:migrate` (`DATABASE_URL="<neon>" npm run db:migrate`)
- env vars บน Vercel ที่ต้องตั้ง: `DATABASE_URL`, `NEXTAUTH_SECRET`, **`NEXTAUTH_URL` = domain จริง** (ไม่งั้น callback เพี้ยน), `LIVEBLOCKS_SECRET_KEY`
- API routes ที่ใช้ `pg` ต้องอยู่ Node runtime (default) — อย่าเผลอใส่ `export const runtime = "edge"` ; middleware ของ next-auth รันบน edge อ่าน `NEXTAUTH_SECRET` ได้ปกติ
- เขียน README (ภาษาไทย, commands อังกฤษ) ครอบ: setup local, ตาราง env vars, scripts, ขั้นตอน deploy — แทน boilerplate ของ create-next-app

## Canvas freehand drawing (HTML5 Canvas)

แนวทางที่ใช้ได้จริงกับ whiteboard แบบ freehand:

- เก็บ stroke เป็น `{ points: {x,y}[], color, width }` (array ของจุด) — ตรงกับที่จะ persist ลง DB (`jsonb`) และ broadcast ผ่าน realtime ได้เลย ไม่ต้องแปลง
- วาดด้วย **Pointer Events** (`onPointerDown/Move/Up`) ไม่ใช่ mouse/touch แยก — รองรับเมาส์+ทัช+ปากกาในชุดเดียว, ใช้ `setPointerCapture` กันลากออกนอก canvas แล้วหลุด
- **ยางลบ = วาดด้วยสีพื้นหลัง (ขาว)** เป็นวิธีที่ persist ง่ายสุด (ไม่ต้องใช้ `globalCompositeOperation`/ลบ stroke ราย object) — เก็บเป็น stroke สีขาวปกติ
- **DPR scaling:** ตั้ง `canvas.width = clientWidth * devicePixelRatio` (backing store) แล้ว `canvas.style.width = clientWidth + "px"` (CSS) + `ctx.setTransform(dpr,...)` ไม่งั้นเส้นเบลอบนจอ retina; ต้อง redraw ใหม่ทุกครั้งที่ resize เพราะ set `canvas.width` ล้าง buffer
- วาด live ทีละ segment ตอน move (lerp จุดก่อนหน้า→ปัจจุบัน) เพื่อ feedback ทันที แล้ว redraw ทั้งหมดจาก state array เมื่อ undo/clear/เพิ่ม stroke (`ctx.lineCap/lineJoin = "round"` ให้เส้นเนียน)
- จุดเดียว (tap ไม่ลาก) ต้อง render เป็นวงกลม (`arc`) เพราะ `moveTo` เฉย ๆ ไม่วาดอะไร
- โครง component: server page เช็ค session+ownership/notFound แล้วส่งให้ client `BoardEditor` (ถือ state strokes/tool/color/width) ที่ประกอบ `Toolbar` + `Canvas`
- guard `params.boardId` ด้วย regex UUID ก่อน query คอลัมน์ `uuid` — ไม่งั้น Postgres throw "invalid input syntax for type uuid" แทนที่จะได้ 404 สวย ๆ
- Canvas/interaction เป็น visual ทดสอบผ่าน curl ได้แค่ว่า `<canvas>` + toolbar render (HTTP 200) — การวาดจริงต้องเปิดเบราว์เซอร์ดู

## Persist strokes ลง DB

- เซฟ **ทีละ stroke ตอนวาดจบ** (POST 1 row ต่อ 1 เส้น) ไม่ใช่ dump ทั้ง canvas — เข้ากับ realtime (1 stroke = 1 event) และ undo/redo ทำเป็นราย row ได้
- เก็บ `points` เป็น `jsonb` (`$type<{x,y}[]>()` ใน Drizzle) — roundtrip array จุดกลับมาตรงเป๊ะไม่ต้อง serialize เอง
- **id จาก server ต้อง backfill กลับเข้า client state**: วาดจบ → optimistic append (ยังไม่มี id) → POST → ได้ id → `setStrokes(map(s => s===stroke ? {...s,id} : s))` (ใช้ reference equality ของ object เดิม) เพื่อให้ undo รู้ว่าจะ DELETE row ไหน
- undo = `DELETE /strokes/:id`, clear = `DELETE /strokes` (ทั้งบอร์ด) — touch `board.updatedAt` ทุกครั้งที่ strokes เปลี่ยน เพื่อให้ dashboard เรียงตามกิจกรรมล่าสุด
- โหลด initial strokes ฝั่ง server component (query ตรงจาก db, `orderBy(asc(createdAt))`) แล้วส่งเป็น prop ให้ client editor — ไม่ต้อง fetch ซ้ำฝั่ง client ตอน mount
- **ข้อจำกัดที่รู้ตัว (ยังไม่แก้):** เก็บพิกัดเป็น canvas pixel ดิบ → เปิดคนละขนาดจอจะเหลื่อม; undo ระหว่างที่ stroke ยังเซฟไม่เสร็จ (ยังไม่มี id) จะลบเฉพาะ local แต่ POST อาจ persist ทันเป็น orphan — รับได้สำหรับ MVP, จะแก้ตอนทำ normalized coords / realtime
- Phase 6 เป็น API ล้วน → ทดสอบ persistence ครบผ่าน curl ได้ (ต่างจาก Phase 4 ที่เป็น visual)

## Real-time collaboration

ถ้าโปรเจกต์ต้องการ real-time sync ระหว่างผู้ใช้หลายคน (cursor, live edit, ฯลฯ) ตัวที่เคยใช้และพอใจคือ **Liveblocks** (managed WebSocket, มี free dev tier) — เสนอเป็น default ก่อนเสนอ self-hosted WebSocket server เพราะลดงาน infra

### รายละเอียดที่ใช้ได้จริง (Liveblocks v3 + Next 14 App Router)

- packages: `@liveblocks/client`, `@liveblocks/react` (hooks/providers), `@liveblocks/node` (auth endpoint)
- **type ทั้งหมดผ่าน global augmentation**: `declare global { interface Liveblocks { Presence; UserMeta; RoomEvent } }` ใน `liveblocks.config.ts` (ต้อง `export {}` ให้เป็น module) → hooks strongly-typed อัตโนมัติ ไม่ต้อง `createRoomContext`
- **auth endpoint** (`app/api/liveblocks-auth/route.ts`): `new Liveblocks({secret})` → `liveblocks.prepareSession(userId, {userInfo:{name}})` → `session.allow(room, session.FULL_ACCESS)` → `session.authorize()` คืน `{status, body}` ; ดึง userId/name จาก `getServerSession(authOptions)` ผูกกับ NextAuth
- ฝั่ง client ใช้ `authEndpoint="/api/liveblocks-auth"` ใน `<LiveblocksProvider>` → **ไม่ต้องมี public key** บน client (secret อยู่ฝั่ง server เท่านั้น)
- โครง: `<LiveblocksProvider><RoomProvider id={`board-${id}`} initialPresence={{cursor:null}}>` ; cursor ใช้ `useUpdateMyPresence()` + `useOthers()` ; broadcast stroke ใช้ `useBroadcastEvent()` + `useEventListener(({event})=>...)`
- **sync model ที่จับคู่กับ DB persistence ได้ดี:** คนวาดเป็นคนเซฟลง DB แล้ว broadcast stroke (พร้อม id) ให้คนอื่น; คนอื่นแค่ render local ไม่ persist ซ้ำ — undo/clear ก็ broadcast event ลบ local ฝั่งคนรับ (ไม่ DELETE ซ้ำ) ; reload ดึงจาก DB
- **graceful degradation สำคัญมาก:** gate ด้วย `realtimeEnabled = !!process.env.LIVEBLOCKS_SECRET_KEY` ฝั่ง server แล้วส่งเป็น prop; ถ้าไม่มี key ให้ render editor ธรรมดา (ไม่เรียก Liveblocks hooks เลย เพราะ hooks เรียกนอก `RoomProvider` จะ throw) — แอปจึงใช้ได้ทันทีก่อนสมัคร service, auth endpoint คืน 501 เฉย ๆ
- **conditional hooks ทำไม่ได้** → แยกเป็น 2 component: wrapper (`BoardRoom`) ตัดสินใจ realtime on/off, กับ inner (`BoardCanvas` แบบ `forwardRef` + `useImperativeHandle` เปิด `applyRemoteStroke/Undo/Clear`) ให้ realtime bridge สั่งงานแบบ imperative ; inner ทำงานได้ทั้งมี/ไม่มี realtime adapter
- ทดสอบ realtime จริงต้องมี key + เปิด 2 หน้าต่าง — ไม่มี key เทสต์ได้แค่ว่า degrade mode ไม่พัง (board 200, auth 501) ; **มี key แล้วเทสต์ผ่าน curl ได้ว่า `/api/liveblocks-auth` คืน 200 + token (ยาว ~760 chars)** ยืนยัน key+session wiring ถูก โดยไม่ต้องเปิดเบราว์เซอร์
- throttle การส่ง presence ที่ `<LiveblocksProvider throttle={80}>` (16–1000ms) ลด bandwidth/quota ; คู่กับ CSS `transition-transform duration-100` ที่ cursor ฝั่งคนรับเพื่อให้ลื่นแม้ส่งห่าง ; แสดงสถานะต่อด้วย `useStatus()` (initial/connecting/connected/...), online users ด้วย `useOthers()` + `useSelf()`

## Normalized coordinates (สำคัญสำหรับ canvas ที่ sync/persist)

- เก็บพิกัด stroke + cursor เป็น **normalized 0..1** (หารด้วยขนาด canvas) ไม่ใช่ pixel ดิบ — ไม่งั้นเปิดคนละขนาดจอ/หน้าต่าง เส้นกับ cursor จะเหลื่อม
- input: `(clientX-rect.left)/rect.width` (clamp 0..1) ; render: `point * canvas.clientWidth` (ภายใต้ ctx ที่ setTransform(dpr) แล้ว coordinate space เป็น CSS px) ; **`lineWidth` เก็บเป็น px คงที่** (อยากให้เส้นหนาเท่ากันเชิงสายตา ไม่ scale ตามจอ)
- overlay cursor วาง normalized × ขนาด container — ให้ overlay วัดขนาดตัวเองด้วย `ResizeObserver` (self-contained) แทนรับ size เป็น prop
- **ระวัง data migration:** ถ้าเคยเก็บ pixel แล้วสลับเป็น normalized, stroke เก่าจะ misalign (ค่า >1 → คูณขนาดแล้วหลุดจอ) ต้องเคลียร์/แปลงก่อน — เช็คจำนวน row เดิมก่อนเปลี่ยน schema-meaning

## วิธีวางแผน Development Phases

แตกงานเป็น phase ตามลำดับนี้ (ปรับตามฟีเจอร์จริงของแต่ละโปรเจกต์):

1. Setup framework + styling + ต่อ database layer (ยังไม่ต้อง deploy)
2. Auth (login/register)
3. Core CRUD ของ entity หลัก
4. Core feature แบบ local-only (ยังไม่ real-time)
5. เพิ่ม real-time/collaboration layer
6. Persist ข้อมูลจริงลง DB
7. Deploy + ย้าย DB ไป hosting จริง

แจ้งผู้ใช้ตรงๆ ว่าจุดไหนใน timeline ที่ต้องไปสมัคร external service (เช่น Liveblocks, Neon) ก่อนเพื่อไม่ให้ไปติดกลาง phase

## Scaffolding (create-next-app) — ข้อควรระวังที่เจอจริง

- **ชื่อโฟลเดอร์มีตัวพิมพ์ใหญ่ → `create-next-app .` ใช้ไม่ได้** (npm ห้ามชื่อ package มีตัวพิมพ์ใหญ่ เช่นโฟลเดอร์ `Realtime-Whiteboard`) วิธีแก้ที่ใช้ได้: scaffold ลง subfolder ชื่อ lowercase (เช่น `sketchsync`) แล้ว `mv` ทุกอย่างขึ้น root (ย้ายในไดรฟ์เดียวกันเป็น rename เร็วมาก) — ใช้ `shopt -s dotglob` เพื่อให้ย้าย dotfiles (`.git`, `.gitignore` ฯลฯ) ติดไปด้วย
- **`create-next-app .` ไม่ยอมรันถ้าโฟลเดอร์มีไฟล์แปลกปลอม** (เช่น `CONTEXT.md`, `SKILL.md`, `.claude/`) — ย้ายออกชั่วคราวก่อน scaffold แล้วย้ายกลับ
- Pin เวอร์ชันด้วย `create-next-app@14` เมื่ออยากได้ Next 14 + Tailwind v3 (เสถียร, doc เยอะ) แทน latest ที่ให้ Next 15
- Flag ที่ใช้: `--typescript --tailwind --app --no-src-dir --eslint --import-alias "@/*" --use-npm` (ไม่มี `src/` เพื่อให้ `app/` อยู่ root ตาม structure ที่วางไว้)

## Drizzle migration ใน non-interactive shell

- **`drizzle-kit push` ต้องการ TTY** (กดยืนยัน interactive) → พังใน shell ของ agent ด้วย error "Interactive prompts require a TTY terminal". ใช้ flow **`generate` + `migrate`** แทน: `drizzle-kit generate` สร้างไฟล์ SQL ลง `db/migrations/`, แล้ว `drizzle-kit migrate` apply เข้า DB แบบ non-interactive (เป็น production workflow ที่ถูกต้องอยู่แล้ว — `push` ไว้ prototype เร็ว ๆ ตอน dev เอง)
- ใส่ scripts ทั้ง 3: `db:generate`, `db:migrate`, `db:push` (+ `db:studio`) ใน package.json
- `gen_random_uuid()` เป็น built-in ตั้งแต่ Postgres 13 — ไม่ต้องเปิด extension `pgcrypto`
- ตั้ง singleton `Pool` ผ่าน `globalThis` ใน `lib/db.ts` กัน connection leak ตอน Next.js hot reload (สร้าง pool ใหม่ทุกครั้งที่ fast refresh)

## ตัวอย่างการใช้งาน

**ตัวอย่าง 1:**
คำขอ: "อยากทำเว็บ task manager แบบ real-time ด้วย Next.js"
คำตอบที่ควรให้: เสนอ Drizzle + `pg` (ไม่ใช่ Prisma), NextAuth username/password เป็น default, ถามว่าต้องการ real-time แบบไหนแล้วเสนอ Liveblocks, วางแผนเป็น phase ตามลำดับด้านบน

**ตัวอย่าง 2:**
คำขอ: "ควรเก็บ DB ที่ไหนตอน deploy ดี ใช้ Vercel"
คำตอบที่ควรให้: ถามก่อนว่าใช้ฟีเจอร์ auth/storage ของ Supabase ไหม ถ้าไม่ใช้ แนะนำ Neon เพราะผูกกับ Vercel แน่นกว่า
