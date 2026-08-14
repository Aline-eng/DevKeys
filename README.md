# DevKeys — AI Typing Coach

AI-powered typing improvement platform for developers. Phase 1 (MVP) is built:
a real typing-test engine, accounts, per-key accuracy/speed tracking, and a
dashboard with a trend chart and a weak-key heatmap.

## Stack

- **Client:** Next.js 16 (App Router), React 19, Tailwind v4, TypeScript
- **Server:** Express 5, TypeScript, Drizzle ORM, PostgreSQL
- **Auth:** better-auth (email/password + GitHub OAuth), session lives on the API domain
- **Client and server are separate origins** — deploy target is Vercel (client) + Railway/Render (API + Postgres)

## Local setup

### 1. Database

Create a Postgres database and a role for the app (or point `DATABASE_URL` at
an existing one).

### 2. Server

```
cd server
cp .env.example .env      # fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.
npm install
npm run db:migrate
npm run db:seed           # seeds practice texts
npm run dev
```

### 3. Client

```
cd client
cp .env.example .env.local
npm install
npm run dev
```

Client runs at `http://localhost:3000`, API at `http://localhost:5000`.

### GitHub OAuth (optional)

Email/password works without it. To enable "Continue with GitHub", register a
GitHub OAuth App with callback `http://localhost:5000/api/auth/callback/github`
and set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `server/.env`.

## What's built (Phase 1)

- Email/password + GitHub OAuth accounts, `plan: free|premium` field on the user (feature-flagged, no billing yet)
- Typing-test engine: per-keystroke capture (`key` + physical `code`), backspace/correction tracking, IME/key-repeat/focus-loss handling
- Practice texts (code snippets, prose, quotes), attempt history, per-key stats
- Dashboard: WPM/accuracy trend, recent sessions, weak-key keyboard heatmap
- Rate limiting on auth and attempt-submission endpoints

## Roadmap

- **Phase 2:** deep personalization (targeted drills from weak-key data), train-on-your-own-code (import a repo/paste code as practice text)
- **Phase 3:** competitive/social layer (leaderboards, races, shareable profile cards)
- **Phase 4:** live biometric coaching — real-time webcam hand-placement/posture feedback, fatigue/RSI-risk detection
- **Phase 5:** Stripe billing to gate Phase 2/4 premium features
