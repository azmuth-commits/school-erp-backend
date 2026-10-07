# School ERP Backend

REST API for the School ERP mobile app (Admin, Teacher, Parent) built with Node.js, TypeScript, Express, Prisma, and Supabase PostgreSQL.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (this app uses `school-erp-bbk12`)

## Quick start

```bash
cp .env.example .env
# set DATABASE_URL (transaction pooler, port 6543) and DIRECT_URL (session pooler, port 5432)
# set JWT_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api/docs`  
Health: `http://localhost:3000/health`

## Seed accounts

| Role    | Login ID    | Password     |
|---------|-------------|--------------|
| Admin   | `ADMIN001`  | `Admin@123`  |
| Teacher | `TEACHER001`| `Teacher@123`|
| Parent  | `PARENT001` | `Parent@123` |

Forgot-password OTP is returned in the JSON body when `NODE_ENV=development`.

## Auth

Send `Authorization: Bearer <accessToken>` on admin, teacher, and parent routes.

```http
POST /api/auth/login
{ "loginId": "PARENT001", "password": "Parent@123" }
```

## Route map

- `/api/auth` — register (admin), login, forgot-password, verify-otp, refresh-token
- `/api/admin` — students, classes, teachers, timetable, fees, announcements
- `/api/teacher` — attendance, homework, report-cards (PDF), notifications, e-learning (video)
- `/api/parent` — children, attendance, homework submit, report-card download, fees, marks, announcements

Teachers can only mark attendance, assign homework, and upload e-learning for classes they are assigned to.

## File storage

If AWS credentials are set, uploads go to S3 (`report-cards/`, `e-learning/`) and downloads use presigned URLs.

Without AWS keys (local development), files are stored under `uploads/` and served at `/files/...`.

Limits: report cards PDF ≤ 10MB; e-learning MP4/AVI/MOV ≤ 500MB.

Fee payments currently record a local payment row. Razorpay/Cashfree can be wired into `POST /api/parent/children/:childId/fees/:feeId/pay` later.

## Database (Supabase)

Prisma Client uses `DATABASE_URL` (Supavisor transaction pooler, port `6543`, `pgbouncer=true`).
Prisma CLI (migrate, seed, studio) uses `DIRECT_URL` (session pooler, port `5432`).

Create a dedicated `prisma` database role instead of connecting as `postgres`. Tables live in `public`; the Express API is the only intended client, so enable RLS with no anon/authenticated policies after migrate.

## Deploy (AWS)

Recommended first path: Elastic Beanstalk + Supabase PostgreSQL + S3.

1. Set production env vars (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, AWS keys, `NODE_ENV=production`).
2. Run `npx prisma migrate deploy`.
3. Do not seed production with demo passwords.
4. Keep the S3 bucket private; the API issues short-lived signed URLs.

## Scripts

```bash
npm run dev              # tsx watch
npm run build            # prisma generate + tsc
npm start                # node dist/src/server.js
npx prisma studio
```
# school-erp-backend
