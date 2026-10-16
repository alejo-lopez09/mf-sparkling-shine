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
- Admin booking review and selectable cleaner assignment
- Cleaner check-in/check-out, service checklist and private photo evidence
- Administrator evidence review, work approval and corrective-work status
- Client/cleaner conversations linked to a booking, with administrator oversight
- Client ratings after approved completion
- Overtime requests linked to assigned services and administrator approval
- Administrator CSV export with date, client, cleaner and address filters, recorded hours and approved overtime details
- Role-specific dashboards, private service data, and in-app notifications that users can mark as read
- Administrator controls to deactivate/reactivate staff accounts while protecting the last admin and active cleaner assignments

## Production notes

- Use a managed MySQL service for production.
- Apply the current Prisma schema before starting the updated application (`npm run prisma:generate` and, for a new development database, `npm run prisma:push`). For production, create and review a database migration and apply it with `npx prisma migrate deploy`.
- Set `SESSION_SECRET` to at least 32 random characters before deployment; production startup rejects a missing or short value.
- Keep the app behind a proper production environment with HTTPS.
- Uploaded service photos are stored outside the public web root in `data/evidence` by default. On deployment, set `EVIDENCE_DIR` to durable private storage with backups and access restricted to the app; local/serverless instance storage is not a production backup strategy.
- The JSON file store is for local development only. Configure MySQL for a multi-user deployment; the production app refuses to start without `DATABASE_URL`.
- The beta records recurring frequency as a booking preference; it does not automatically generate future repeat bookings, and the booking form explains that clients must submit each visit separately. Administrators can edit staff names and phone numbers and deactivate/reactivate staff accounts; login email and password changes are not supported in the beta. Payments, payroll/tax invoices, messaging integrations, cleaner availability profiles and advanced contracts also remain outside this delivery.

## Testing

```bash
npm test
```
