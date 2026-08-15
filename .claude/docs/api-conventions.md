# API Conventions

## The route pattern every route follows

```ts
export async function POST(req: Request) {
  const session = await auth(); // Auth.js — null if unauthenticated
  if (!session && requiresAuth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SomeZodSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await doTheBusinessLogic(parsed.data, session);
    return Response.json(result);
  } catch (err) {
    console.error("[route-name]", err); // real error, server-side only
    return Response.json({ error: "Something went wrong" }, { status: 500 }); // generic, client-facing
  }
}
```

Auth check → Zod-validated input → business logic in `try` → generic error out, real error logged
server-side. Every route uses Zod to parse its body; never trust `req.json()`'s shape directly.

## The most critical route: `POST /api/stripe/webhook`

This is the one route in the app where getting the step order wrong has real financial/access
consequences. Exact order, return early on any failure:

1. Read the raw request body (not parsed JSON — Stripe signature verification needs the raw bytes).
2. Verify the Stripe signature header against `STRIPE_WEBHOOK_SECRET`. Reject with 400 on failure —
   never process an unverified payload.
3. Check `WebhookEvent` for the incoming `event.id`. If it already exists, return `200` immediately
   and do nothing else — this event was already processed (CLAUDE.md rule 4, idempotency).
4. Switch on `event.type` (`checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`) and update the `Subscription` row accordingly.
5. Insert the `WebhookEvent` row **only after** step 4 succeeds — if step 4 throws, the event is
   safe to retry on Stripe's next delivery attempt because no `WebhookEvent` row was written.
6. Return `200`. Stripe retries on any non-2xx — never swallow a real failure as a 200.

## Route map

| Route | Concern |
|---|---|
| `app/api/auth/[...nextauth]` | Auth.js — session, credentials + Google OAuth |
| `app/api/tests` (GET/POST) | List (paginated, retention-limited) / save a completed test |
| `app/api/tests/import` (POST) | Guest → account migration, see `ux-flows.md` Flow 4 |
| `app/api/settings` (GET/POST) | Sync typing preferences for logged-in users |
| `app/api/stripe/checkout` (POST) | Create a Stripe Checkout session for the Premium plan |
| `app/api/stripe/portal` (POST) | Create a Stripe Billing Portal session |
| `app/api/stripe/webhook` (POST) | See above — the critical path |

## Cross-cutting rules

- **IDs**: `cuid()` everywhere via Prisma's default — never sequential integers for anything
  user-facing (avoids enumeration of other users' test/account counts).
- **Premium gating is enforced server-side, in the route handler, by reading `Subscription.plan`
  from the database** — never by trusting a client-sent flag or a stale session claim. See
  `qa-checklist.md`'s access-control section.
- **Guest test saves** never hit `/api/tests` — they stay in `localStorage` until the user signs
  up, at which point `/api/tests/import` runs once. `/api/tests` POST always requires a session.
- **Cache invalidation**: saving a new test (`POST /api/tests`) must invalidate the history/speed-
  curve query cache for that user so the new point appears without a manual refresh — use Next.js
  `revalidateTag('tests:<userId>')` tagged on the GET route's fetch.
- Emails (welcome, receipt, reminder) are **fire-and-forget** — a Resend failure must never block
  or fail the underlying user action (signup, checkout). See `email-templates.md`.
