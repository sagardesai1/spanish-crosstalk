# Spanish Crosstalk

A minimal MVP for practicing Spanish through **Crosstalk**: you speak English, a local Spanish partner replies in simple Spanish, and you hear them speak aloud.

This is an experiment to answer one question: would you enjoy a 20–30 minute daily Spanish conversation with this partner?

## What it does

### Marketing site (`/`)
A converting landing page for SEO and ads traffic: brand, promise, pricing, CTA into practice.

### Blog (`/blog`)
Markdown guides under `content/blog/` (pillar + cluster articles). Rendered by `app/blog`.

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

Fill in `.env.local` — see the repo README for the full env table.

## Run locally

```bash
npm run dev -- --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123) for the landing page, [http://127.0.0.1:43123/blog](http://127.0.0.1:43123/blog) for guides, or [http://127.0.0.1:43123/practice](http://127.0.0.1:43123/practice) for the app.

## SEOAgent

This repo is bound to [SEOAgent](https://seoagent.com) for `spanish-crosstalk.vercel.app`.

```bash
npm install -g @seoagent-official/seoagent
seoagent sync
```

- Skill contract: `.claude/skills/seoagent/SKILL.md` (also linked from `AGENTS.md`)
- Workspace state: `.seoagent/`
- Weekday habit: open Cursor in this repo each weekday morning; run `seoagent sync`, clear `.seoagent/inbox/`, `seoagent ack <id>` when done
- Optional on your laptop: `0 9 * * 1-5  cd /path/to/spanish-crosstalk && seoagent sync --silent`
