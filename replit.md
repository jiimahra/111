# सहारा — Community Help Platform Mobile App

A mobile app matching saharaapphelp.com — connecting people who need help with those who can give it, across food, medical, job, animal, and education categories.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/mobile run dev` — run mobile app locally
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)

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
- App screens: `artifacts/mobile/app/(tabs)/` — index, volunteer (explore), alert (post), donate (hospitals), assist (AI), profile
- Shared context: `artifacts/mobile/contexts/AppContext.tsx`
- Card component: `artifacts/mobile/components/CaseCard.tsx`
- Brand colors: `artifacts/mobile/constants/colors.ts`
- API server: `artifacts/api-server/`

## Architecture decisions

- Mobile-first, frontend-only — all data persisted via AsyncStorage
- AppContext manages HelpRequest[] with categories + helpType (need_help/give_help)
- Auth gate: `components/AuthGate.tsx` wraps `(tabs)/_layout.tsx` — without `profile.name`, only welcome/signup screen is visible. Shows splash loader during AsyncStorage hydration to avoid flash.
- Design matches saharaapphelp.com exactly: navbar, hero, categories grid, request cards
- Tab routes kept as original filenames: volunteer=Explore, alert=Post, donate=Hospitals
- Orange #F97316 primary (matches website), dark navy #1E3A5F for "Request Help" button

## Product (matches saharaapphelp.com)

- **Home**: Sahara logo navbar, desert-tone hero with "Together we make a difference", search bar, two CTAs (मदद चाहिए / मदद करना है), categories grid (भोजन/चिकित्सा/रोजगार/पशु/शिक्षा), recent requests
- **Explore**: Browse all requests with category + help-type filters
- **Post**: Choose "मदद चाहिए" or "मदद करना है" → form with category, title, description, location, phone
- **Hospitals**: Nearby hospitals & vet clinics with location permission flow (matches website's Nearby Hospitals page)
- **Profile**: Login/signup form matching website's login page; shows stats + my requests when logged in

## User preferences

- App name: सहारा (Sahara) — matches saharaapphelp.com
- Reference website: saharaapphelp.com
- Location: Ajmer-focused seed data
- Language: Hindi branding, English UI

## Gotchas

- AsyncStorage keys: `@sahara/requests_v2`, `@sahara/profile_v2` (v2 to avoid old data conflict)
- Do not use `uuid` package — use `Date.now().toString() + Math.random().toString(36).substring(2,7)` for IDs
- Tab filenames are kept original (volunteer, alert, donate) but display as Explore, Post, Hospitals

## Pointers

- Expo skill: `.local/skills/expo/SKILL.md`
- Reference website: https://saharaapphelp.com
