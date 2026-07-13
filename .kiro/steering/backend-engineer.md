---
inclusion: auto
---

# Backend Engineer Agent - API Contract Project

## Project Overview

Repository ini adalah **API aggregator/proxy** yang terdiri dari 2 server Express terpisah:

1. **Auth Server** (port 3000) — Menangani registrasi, login, dan profile user
2. **Proxy Server** (port 3001) — Proxy ke TheMovieDB API dengan response modification dan penyimpanan ke database

## Tech Stack

- **Runtime**: Node.js dengan TypeScript (ES2020 target)
- **Framework**: Express 5
- **Database**: Supabase PostgreSQL via `postgres` (postgres.js, auto connection pooling)
- **Authentication**: JWT (`jsonwebtoken`) + bcryptjs password hashing
- **Validation**: `express-validator`
- **Security**: `helmet`, `cors`
- **HTTP Client**: `axios` (untuk hit third-party API)
- **Dev Tools**: `ts-node-dev`, `concurrently`
- **Build**: `tsc` ke folder `dist/`

## Architecture Pattern

```
src/
├── controllers/    → Business logic & request handlers
├── middleware/     → Auth middleware (JWT verification)
├── models/         → Database models (static class pattern)
├── routes/         → Express Router definitions
├── types/          → TypeScript interfaces
├── utils/          → Database pool, JWT helpers, password hashing
├── server.ts       → Auth API entry point (port 3000)
└── proxy-server.ts → Proxy API entry point (port 3001)
```

## Coding Conventions

### General Rules
- Gunakan TypeScript strict mode
- Semua handler harus return `Promise<void>` dengan explicit typing `(req: Request, res: Response)`
- Error handling: try-catch di setiap handler, log error ke console, return generic error message ke client
- Gunakan `express-validator` untuk input validation di routes
- Password TIDAK boleh dikembalikan ke client — selalu exclude dengan destructuring

### Controller Pattern
```typescript
export const handlerName = async (req: Request, res: Response): Promise<void> => {
  try {
    // validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }
    // business logic
    res.status(200).json({ data: result });
  } catch (error: any) {
    console.error('Context error:', error);
    res.status(500).json({ error: 'Human-readable error message' });
  }
};
```

### Model Pattern (Static Class)
```typescript
export class ModelName {
  static async methodName(params): Promise<ReturnType | null> {
    const query = 'SELECT ... WHERE field = ?';
    const [rows] = await pool.execute(query, [params]);
    return rows.length > 0 ? rows[0] : null;
  }
}
```

### Route Pattern
```typescript
import { Router } from 'express';
const router = Router();
router.get('/path', middlewareIfNeeded, handler);
export default router;
```

### Type Definitions
- Interfaces didefinisikan di `src/types/` dengan file terpisah per domain
- Gunakan `Omit<T, 'field'>` untuk exclude sensitive fields
- Export semua interfaces

### Response Format
- Auth endpoints: `{ message, user, token }`
- Proxy endpoints: `{ requestId: UUID, data: modifiedResponse }`
- Error responses: `{ error: 'message' }` atau `{ error, details }`
- List endpoints: `{ requestId, data: [], count }`

### Database
- Gunakan tagged template literals dari postgres.js: `` sql`SELECT * FROM users WHERE id = ${id}` ``
- JANGAN gunakan string interpolation atau concatenation untuk query
- Tidak perlu `connection.release()` — postgres.js handle pooling otomatis
- Soft delete pattern: gunakan kolom `deleted_at`
- Untuk INSERT, gunakan `RETURNING *` agar langsung dapat data tanpa query ulang
- Error unique violation: code `23505` (bukan `ER_DUP_ENTRY` seperti MySQL)

### Security
- JWT token di-extract dari header `Authorization: Bearer <token>`
- Password hashing: bcrypt dengan 12 salt rounds
- Middleware `authenticateToken` untuk protected routes
- Helmet untuk security headers
- CORS enabled

## Environment Variables

```
PORT=3000
PROXY_PORT=3001
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
JWT_SECRET=<secret>
JWT_EXPIRES_IN=24h
THEMOVIDB_API_KEY=<bearer token>
THEMOVIDB_BASE_URL=https://api.themoviedb.org/3
```

## Development Commands

- `npm run dev` — Jalankan kedua server (auth + proxy) secara bersamaan
- `npm run dev:auth` — Jalankan auth server saja
- `npm run dev:proxy` — Jalankan proxy server saja
- `npm run build` — Compile TypeScript ke JavaScript

## Best Practices untuk Menambah Fitur Baru

1. **Buat type/interface** di `src/types/` terlebih dahulu
2. **Buat model** (jika perlu akses DB) di `src/models/` dengan static class pattern
3. **Buat controller** di `src/controllers/` dengan handler functions
4. **Buat route** di `src/routes/` dan register di server yang sesuai
5. **Register route** di `server.ts` atau `proxy-server.ts`
6. **Tambah migration** di `initializeDatabase()` jika ada tabel/kolom baru

## Proxy Pattern (Third-Party API)

Ketika menambahkan proxy endpoint baru:
1. Hit third-party API dengan axios + Bearer token dari env
2. Transform/filter response sesuai kebutuhan (buat function terpisah)
3. Return dengan format: `{ requestId: randomUUID(), data: modifiedData }`
4. Opsional: simpan ke database untuk caching/analytics

## Hal yang Perlu Diperhatikan

- Express 5 digunakan (bukan 4) — async error handling sudah built-in
- Kedua server share database pool yang sama
- Database auto-initialize (create DB + tables) saat startup
- Server tetap jalan meskipun database gagal connect (graceful degradation)
- Komentar dalam code boleh menggunakan Bahasa Indonesia
