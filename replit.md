# सहारा — Humanitarian Aid & Animal Rescue Mobile App

A mission-driven mobile app connecting people in crisis (humans and animals) with volunteers and donors in real time.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo (React Native) with expo-router file-based routing
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **State**: AsyncStorage for mobile persistence; React context (AppContext)

## Where things live

- Mobile app: `artifacts/mobile/`
- App screens: `artifacts/mobile/app/(tabs)/` — index, alert, volunteer, donate, profile
- Shared context: `artifacts/mobile/contexts/AppContext.tsx`
- Card component: `artifacts/mobile/components/CaseCard.tsx`
- Brand colors: `artifacts/mobile/constants/colors.ts`
- API server: `artifacts/api-server/`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/`

## Architecture decisions

- Mobile-first, frontend-only on first build — all data persisted via AsyncStorage, no backend calls
- AppContext provides cases, donations, volunteer profile with CRUD — seeded with 5 realistic Delhi-based cases on first launch
- CaseCard is the shared card component used across Home, Volunteer, and Donate screens
- Saffron (#E85D04) primary color echoes the Indian flag and humanitarian urgency
- Tab bar uses NativeTabs (iOS 26+ liquid glass) with Feather icons fallback for Android/web

## Product

- **Home**: Feed of active emergency cases with urgency filter (All / Human / Animal / Critical)
- **Alert**: Form to report a new human or animal emergency with urgency, location, volunteers needed, optional donation goal
- **Volunteer**: Toggle active status; respond to cases needing help
- **Donate**: View campaigns with funding progress bars; donate with preset or custom amounts via modal
- **Profile**: User info, impact stats (cases helped, total donated), recent donation history

## User preferences

- App name: सहारा (Sahara)
- Tagline: "हाथ मदद का, साथ इंसानियत का"
- Mission: Emergency alerts, volunteer network, donation tracking for humans and animals
- Language: Hindi branding, English UI

## Gotchas

- AsyncStorage data is seeded on first launch only (checks if key exists)
- Do not use `uuid` package — use `Date.now().toString() + Math.random().toString(36).substring(2,7)` for IDs
- Run `restart_workflow` after dependency changes, not for normal code edits (HMR handles those)

## Pointers

- Expo skill: `.local/skills/expo/SKILL.md`
- First build reference: `.local/skills/expo/references/first_build.md`
