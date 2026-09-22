# Spanish Crosstalk

A minimal MVP for practicing Spanish through **Crosstalk**: you speak English, a local Spanish partner replies in simple Spanish, and you hear them speak aloud.

This is an experiment to answer one question: would you enjoy a 20–30 minute daily Spanish conversation with this partner?

## What it does

### Marketing site (`/`)
A converting landing page for SEO and ads traffic: brand, promise, pricing, CTA into practice.

### Practice app (`/practice`)

Signed-in only. Guests hitting `/practice` are redirected to `/signin` (Google or magic link).

1. Start a session — your partner greets you first in Spanish
2. Speak English into the microphone
3. Speech is transcribed (OpenAI Whisper)
4. An LLM replies in simple Spanish
5. Google Cloud Text-to-Speech speaks the reply
6. Practice time is saved to **Firestore** toward your daily goal
7. **Firebase Auth** (Google or email magic link) so progress follows you
8. **Stripe** subscriptions for unlimited Pro practice (free daily minutes without Pro)

Sign out returns you to `/`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Google Cloud Text-to-Speech + Firestore (same GCP project / service account)
- Firebase Authentication (Google + email link)
- Stripe Checkout + Customer Portal + webhooks
- Provider abstractions in `lib/` so STT / LLM / TTS can be swapped later

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `LLM_API_KEY` | OpenAI API key for chat (`gpt-4o-mini` by default) |
| `STT_API_KEY` | OpenAI API key for Whisper transcription |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP / Firebase project id |
| `GOOGLE_APPLICATION_CREDENTIALS` | Absolute path to a GCP service account JSON key file |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same as GCP project id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app id |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` / `sk_live_…`) or restricted key (`rk_…`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_…` / `pk_live_…`) — optional for hosted Checkout |
| `STRIPE_PRICE_ID` | Recurring Price id for Pro (`price_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |

Optional:

| Variable | Purpose |
| --- | --- |
| `LLM_MODEL` | Override chat model (default `gpt-4o-mini`) |
| `TTS_VOICE_NAME` | Override Google voice |
| `GOOGLE_CLOUD_CREDENTIALS_JSON` | Inline service-account JSON if you prefer not to use a file path |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for redirects / Open Graph |
| `NEXT_PUBLIC_STRIPE_PRICE_LABEL` | Landing price label (default `$15`) |
| `FREE_DAILY_MINUTES` | Free minutes/day without Pro (default `15`) |
| `NEXT_PUBLIC_FREE_DAILY_MINUTES` | Same number shown on the landing page |

### Google Cloud / Firebase

1. Enable **Cloud Text-to-Speech API**
2. Create a **Firestore** database in the Firebase/GCP console (Native mode)
3. Grant the service account access to Firestore
4. Enable **Email link** + **Google** in Firebase Authentication
5. Copy the web `firebaseConfig` into `NEXT_PUBLIC_FIREBASE_*`

### Stripe

1. Create a Product + recurring Price in the Stripe Dashboard (e.g. **Spanish Crosstalk Pro** monthly at **$15**)
2. Put the Price id in `STRIPE_PRICE_ID` and your secret/restricted key in `STRIPE_SECRET_KEY`
3. Enable Customer Portal: Stripe → Settings → Billing → Customer portal (allow cancel + update payment method)
4. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:43123/api/billing/webhook
```

5. Copy the CLI webhook signing secret into `STRIPE_WEBHOOK_SECRET`
6. For production, add an endpoint for `https://your-domain/api/billing/webhook` listening to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

**Test account (already created on `acct_1UGTBH5dcnJwIg3w`):** Product `prod_VH1cayj2SavyJ5` · Price `price_1UGTZe5dcnJwIg3w1uRAnqj6` ($15/month). Until Stripe env vars are set, practice stays fully free (billing UI stays hidden).

> Tip: in `.env.local`, write `NEXT_PUBLIC_STRIPE_PRICE_LABEL=\$15` — a bare `$15` is expanded to empty by dotenv.

#### Pricing rationale

| | Amount |
|---|---|
| ~20 min practice session COGS (Whisper + gpt-4o-mini + Neural2 TTS) | ~$0.12–0.18 |
| Heavy user (~20 min/day) monthly COGS | ~$4–5 |
| Stripe fee on $15 | ~$0.74 |
| Free tier (15 min/day) you subsidize | ~$2–3/user/mo if they max it |

**$15/month** leaves healthy margin (~$9–10 after COGS + fees for a daily heavy user), undercuts a tutor, and sits above Duolingo-style pricing so unlimited live STT/TTS feels intentional. $12 is workable but thin once free-tier burn + hosting stack up; $19 is fine later as a “tutor alternative” tier.

#### Stripe MCP / Cursor plugin (optional)

This repo includes `.cursor/mcp.json` pointed at `https://mcp.stripe.com`. In Cursor Desktop:

1. Install the Stripe plugin from the marketplace, **or** rely on the MCP config above
2. Authenticate when prompted (OAuth)
3. Confirm `stripe_implementation_planner` is available, then ask the agent to generate a plan

Cloud Agents may not see marketplace plugins until MCP is authenticated for that environment.

## Run locally

```bash
npm run dev -- --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123) for the landing page, or [http://127.0.0.1:43123/practice](http://127.0.0.1:43123/practice) for the app.

Allow microphone access when prompted.

## Project layout

```text
app/
  page.tsx                   # Marketing landing
  practice/page.tsx          # Crosstalk practice app
  api/billing/checkout|portal|status|webhook
components/
  LandingPage.tsx
  BillingControls.tsx
  Conversation.tsx
  AuthProvider.tsx / AuthControls.tsx
  ...
lib/
  stripe.ts / billing.ts / billingClient.ts
  firestore.ts / firebaseAdmin.ts / firebaseClient.ts
  ...
```

## Notes

- Today’s chat resumes from Firestore after refresh.
- Daily minutes + goal persist under `users/{userId}/dailyProgress/{YYYY-MM-DD}`.
- Subscription state lives on `users/{uid}` (`subscriptionStatus`, `stripeCustomerId`, …).
- Free users are capped at `FREE_DAILY_MINUTES` of credited practice time per day once Stripe is configured.
- Signed-in requests send a Firebase ID token; the server verifies it and uses the Firebase UID.
