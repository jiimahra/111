# सहारा — Community Help Platform Mobile App

A mobile app matching saharaapphelp.com — connecting people who need help with those who can give it, across food, medical, job, animal, and education categories.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/mobile run dev` — run mobile app locally
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)
- `pnpm run typecheck:libs` — rebuild composite libs (needed after schema changes)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Mobile**: Expo SDK 54 + expo-router file-based routing
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **State**: AsyncStorage via AppContext (frontend-only, no backend calls)
- **Build**: esbuild (CJS bundle for API)

## Where things live

- Mobile app: `artifacts/mobile/`
- App screens: `artifacts/mobile/app/(tabs)/` — index, volunteer, alert, donate, assist, people, profile
- Chat screen: `artifacts/mobile/app/chat/[userId].tsx`
- Social API client: `artifacts/mobile/lib/social.ts`
- Auth API client: `artifacts/mobile/lib/auth.ts`
- Shared context: `artifacts/mobile/contexts/AppContext.tsx`
- Brand colors: `artifacts/mobile/constants/colors.ts` (green: #059669, dark: #064E3B)
- API server: `artifacts/api-server/src/routes/` — auth, social, ai, health, notifications
- DB schema: `lib/db/src/schema/` — users, social (friend_requests + messages)

## Architecture decisions

- Mobile-first — help requests persisted via AsyncStorage; social/auth data in Postgres
- AppContext manages HelpRequest[] + authed profile (AsyncStorage keys: `@sahara/requests_v2`, `@sahara/profile_v2`)
- Auth gate: `components/AuthGate.tsx` (FB/IG-style design) wraps `(tabs)/_layout.tsx`
- Real auth: `/api/auth/{signup,login,forgot-password,reset-password}` — bcrypt, 6-digit reset codes (15-min expiry), Gmail reset emails via `@replit/connectors-sdk`
- Social system: `/api/social/{users,friend-request,friend-requests,friends,messages}` — Postgres-backed friend requests + 1-on-1 messaging with 3s polling
- Input components defined at module scope (NOT inside render functions) to prevent keyboard dismiss bug

## Product

- **Home**: Hero, search, CTAs (मदद चाहिए / मदद करना है), categories, recent requests
- **Explore**: Browse/filter all requests
- **Post**: Post need-help or give-help request
- **Hospitals**: Nearby hospitals/vet clinics with location
- **AI Help**: AI assistant chat
- **Community** (people tab): Browse users → send/cancel friend requests | incoming requests (accept/decline) | friends list with unread count
- **Chat**: 1-on-1 real-time messaging with 3s polling, read receipts
- **Profile**: Auth (login/signup/forgot/reset) + stats + my requests

## User preferences

- App name: सहारा (Sahara) — matches saharaapphelp.com
- Reference website: saharaapphelp.com
- Location: Ajmer-focused seed data
- Language: Hindi branding, English UI
- Green theme: #059669 primary, #064E3B dark, #1E3A5F navy accent

## Gotchas

- AsyncStorage keys: `@sahara/requests_v2`, `@sahara/profile_v2`
- Do not use `uuid` package — use `Date.now().toString() + Math.random().toString(36).substring(2,7)` for IDs
- Tab filenames original (volunteer, alert, donate) but display as Explore, Post, Hospitals
- Pre-existing TS errors in `assist.tsx` (EncodingType) and `useColors.ts` (radius) — not blocking
- After DB schema changes: run `pnpm run typecheck:libs` THEN `pnpm --filter @workspace/db run push`

## Pointers

- Expo skill: `.local/skills/expo/SKILL.md`
- Reference website: https://saharaapphelp.com
