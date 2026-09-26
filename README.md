# Tearnote

Tearnote is a crying journal. It logs each cry (when, how intense, why, what you were thinking) so you can spot your emotional patterns over time — and it lets you receive anonymous words of comfort from strangers who went through something similar. Available in English, Vietnamese and Japanese.

**Status:** the Supabase schema is deployed; the app runs the Entry + Comfort slice. Not launched yet.

## Tech stack

- **Mobile app:** TypeScript + React Native via Expo (managed), Android first, iOS later — [ADR 0001](docs/adr/0001-mobile-native-expo.md)
- **Local storage:** local-first SQLite (`expo-sqlite`); server sync is opt-in — [ADR 0004](docs/adr/0004-luu-tru-local-first.md)
- **Backend:** Supabase (Postgres + auth + storage) — [ADR 0006](docs/adr/0006-supabase.md)
- **Auth:** Supabase anonymous auth for journaling; a real account is required to write comforts or enable sync
- **Tests:** jest-expo

## Repository layout

```
app/        Expo app (screens in app/src/app, theme in app/src/theme.ts)
supabase/   SQL migrations and seed data
docs/       Product overview, DB schema, tag contract, ADRs
.husky/     Git hook that enforces commit message rules
```

The root `package.json` only installs the git hook; all app code and dependencies live in `app/`.

## Getting started

Requires Node.js and the Expo Go app on an Android phone.

```powershell
npm i                          # installs the husky git hook
cd app
npm i                          # app/.npmrc enables legacy-peer-deps; needed for expo 57 + RN 0.86
Copy-Item .env.example .env    # then fill in your Supabase URL and publishable key
npx expo start                 # scan the QR code with Expo Go
```

`app/.env` needs:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

## Documentation

Most docs are written in Vietnamese.

- [docs/overview.md](docs/overview.md) — what Tearnote is, MVP scope and what is deliberately left out
- [CONTEXT.md](CONTEXT.md) — domain vocabulary (Entry, Comfort, Tag, …)
- [PRODUCT.md](PRODUCT.md) — product voice and UI wording
- [DESIGN.md](DESIGN.md) — visual design system
- [docs/db.md](docs/db.md) — database schema (server and on-device)
- [docs/tags.md](docs/tags.md) — tag list shared by Entry and Comfort
- [docs/adr/](docs/adr/) — architecture decision records
- [CLAUDE.md](CLAUDE.md) — working rules for contributors and coding agents
