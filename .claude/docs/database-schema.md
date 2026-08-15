# Database Schema

Postgres (Neon) via Prisma. Grow the schema phase by phase — don't dump the full target schema
into migration 1.

## Migration plan

| Migration | Tables / columns | Phase |
|---|---|---|
| `001_auth` | `User`, `Account`, `Session`, `VerificationToken` (Auth.js standard shape) | 1 |
| `002_typing_tests` | `TypingTest` | 1 |
| `003_user_settings` | `UserSettings` | 1 |
| `004_subscriptions` | `Subscription`, `WebhookEvent` | 2 |

## Target schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?   // null for OAuth-only accounts
  name          String?
  image         String?
  createdAt     DateTime  @default(now())

  accounts      Account[]
  sessions      Session[]
  tests         TypingTest[]
  settings      UserSettings?
  subscription  Subscription?
}

// Account, Session, VerificationToken: standard Auth.js Prisma adapter shape — generate via
// `npx auth prisma-adapter` / the Auth.js Prisma schema reference, don't hand-roll these.

model TypingTest {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mode         String   // "time" | "words"
  target       Int      // seconds (time mode) or word count (words mode)
  netWpm       Float
  rawWpm       Float
  accuracy     Float
  consistency  Float
  charStats    Json     // { correct, incorrect, extra, missed } — see wpm.ts
  punctuation  Boolean  @default(false)
  numbers      Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@index([userId, createdAt])
}
// SECURITY / rule 3 (CLAUDE.md): once written, a TypingTest row's stat columns
// (netWpm/rawWpm/accuracy/consistency/charStats) are never updated by app code. If a scoring bug
// is fixed, it applies only to tests taken after the fix — never a backfill UPDATE.

model UserSettings {
  userId       String   @id
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mode         String   @default("time")
  duration     Int      @default(30)
  punctuation  Boolean  @default(false)
  numbers      Boolean  @default(false)
  theme        String   @default("dark")
}

model Subscription {
  userId               String   @id
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String   @unique
  stripeSubscriptionId String?  @unique
  status               String   // "active" | "past_due" | "canceled" | "trialing"
  plan                 String   // "free" | "premium"
  currentPeriodEnd     DateTime?
  updatedAt            DateTime @updatedAt
}
// SECURITY: `status`, `plan`, and the Stripe id columns are written ONLY by the Stripe webhook
// handler (lib/stripe.ts + app/api/stripe/webhook/route.ts). No user-facing API route may ever
// accept these fields from a client request body — see api-conventions.md.

model WebhookEvent {
  id          String   @id            // the Stripe event id — the idempotency key
  type        String
  processedAt DateTime @default(now())
}
// Every Stripe webhook handler checks this table for the incoming event.id before acting, and
// inserts it after successful processing (CLAUDE.md rule 4). Insert is the idempotency guard, not
// a status flag — an event that fails mid-processing is safe to retry.
```

## Data retention (enforced in the `tests` query layer, not by deleting rows)

Free tier: history queries only return the last 90 days. Premium: unlimited. See
`infrastructure.md` for the exact plan/limits table. Rows are never hard-deleted by the retention
rule — a downgrade from Premium must not destroy history, only hide it from free-tier queries.
