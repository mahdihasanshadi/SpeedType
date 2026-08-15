# Email Templates

Sent via Resend. All emails match `design-system.md` tokens (accent color, fonts as web-safe
fallbacks since email clients can't load custom fonts reliably — use a system mono/sans stack that
approximates Geist).

## Lifecycle

| Stage | Email | Trigger | Timing | Subject / tone |
|---|---|---|---|---|
| Signup | Welcome | Account created | Immediate | "Welcome to SpeedType — let's see your first WPM" — friendly, not salesy |
| Checkout | Receipt | `checkout.session.completed` webhook | Immediate | "You're on Premium — receipt inside" — factual, includes amount + next billing date |
| Subscription renewal reminder | Expiring soon | 3 days before `currentPeriodEnd`, only if `cancel_at_period_end` is true | Once, 3 days out | "Your Premium access ends in 3 days" — honest, no dark-pattern urgency language |
| Payment failed | Payment failed | `invoice.payment_failed` webhook | Immediate | "We couldn't process your payment" — clear next step (update card via billing portal link) |

## Rules

- **Welcome and receipt are transactional** — always send, no unsubscribe applies.
- **The expiring-soon reminder is lifecycle, not transactional** — must honor a global
  unsubscribe/notification-preference if one is ever added, and fires **once** per cancellation
  (not daily) via the idempotency mechanism below.
- **Idempotency**: a `EmailLog` table (or reuse `WebhookEvent` semantics keyed on
  `userId + emailType + periodEnd`) is checked before sending any "once" email — never rely on
  timing alone to avoid duplicate sends.
- **Email failures never break the underlying action.** A failed welcome email must not fail
  signup; a failed receipt email must not fail checkout. Log the failure, retry once async, then
  give up silently (the in-app state, e.g. "You're on Premium," is always the source of truth —
  email is a courtesy notification, not the mechanism that grants access).
