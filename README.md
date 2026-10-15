# MF SPARKLING & SHINE LTD

A professional cleaning-company operations platform built with Next.js, TypeScript, Prisma, and Tailwind CSS.

## Stack

- Next.js App Router
- TypeScript
- Prisma + MySQL
- JWT-based cookie session auth
- Zod validation
- Tailwind CSS
- Vitest for validation tests

## Local development

1. Copy `.env.example` to `.env`.
2. Set the MySQL connection string in `.env`.
   ```bash
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/mf_sparkling_shine"
   SESSION_SECRET="replace-with-strong-random-secret"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```
5. Sync the Prisma schema with the development database:
   ```bash
   npm run prisma:push
   ```
6. Run the app:
   ```bash
   npm run dev
   ```

Open http://localhost:3000.

The app adds demo data on its first database read only when the MySQL database has no users. It does not seed or overwrite an existing database that already has users.

## Demo users

- Admin: admin@mfcleaning.co.uk / Welcome123!
- Client: client@mfcleaning.co.uk / Welcome123!
- Cleaner: cleaner@mfcleaning.co.uk / Welcome123!

These are demo credentials; replace them and the sample data before using the app with real users.

For production, create and review migrations in development, then apply them with `npx prisma migrate deploy`.

## Business workflow covered

- Client property registration and booking requests
- Admin approval and assignment flows
- Cleaner workspace and overtime submission
- Booking dashboard, role-based access and notifications
- Prisma schema for MySQL deployment

## Production notes

- Use a managed MySQL service for production.
- Set `SESSION_SECRET` to a long secure value before deployment.
- Keep the app behind a proper production environment with HTTPS.

## Testing

```bash
npm test
```
