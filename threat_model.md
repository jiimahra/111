# Threat Model

## Project Overview

Sahara is a community help platform with an Expo mobile client, an Express 5 API server, PostgreSQL via Drizzle ORM, object storage for uploaded media/APKs, and an admin web panel. Users can create accounts, post help requests, browse and react to requests, add friends, exchange direct messages, and use AI and hospital lookup features. The primary production trust boundary is between untrusted clients and the `/api` server.

Production-scope assumptions for future scans:
- `NODE_ENV` is `production` in deployed environments.
- TLS is terminated by the platform and transport encryption is handled by deployment infrastructure.
- `artifacts/mockup-sandbox/` is development-only and should be ignored unless production reachability is demonstrated.

## Assets

- **User accounts and profiles** — user IDs, emails, names, phone numbers, locations, profile photos, and admin flags. Exposure or unauthorized modification would enable impersonation, harassment, and privacy breaches.
- **Private social graph and communications** — friend relationships, pending requests, direct messages, read state, and online status. These are user-private data and must not be readable or mutable by other users.
- **Community request data** — help requests, anonymous posting state, comments, likes, and contact phone numbers. This includes sensitive real-world need information and sometimes contact details.
- **Administrative control plane** — admin-only user management, request moderation, platform statistics, and APK upload/delete operations. Compromise enables full platform takeover.
- **Reset and OTP secrets** — password reset codes and admin OTPs sent over email. These are temporary authenticators and must resist guessing, replay, and cross-user abuse.
- **Application secrets and integrations** — OpenAI credentials, Google Maps API key, Gmail connector access, and object storage access. Leakage or confused-deputy use could expose data or incur cost.

## Trust Boundaries

- **Mobile/Admin/Web client to API** — all request bodies, query parameters, headers, uploaded files, and websocket events are attacker-controlled. The server must authenticate identity and authorize every sensitive operation.
- **API to PostgreSQL** — the API has broad read/write access to user, request, social, and admin-relevant records. Broken access control at the API layer directly becomes unauthorized database access.
- **API to object storage** — upload and APK endpoints can create, delete, and serve stored objects. This boundary requires strong authorization and controlled object naming.
- **API to external services** — Google OAuth, Google Places, OpenAI, Expo push, Gmail connector, and Overpass are external trust boundaries. Outbound calls need bounded inputs, timeouts, and secret handling.
- **Public vs authenticated vs admin surfaces** — read-only public content (for example request browsing and hospitals) is lower trust than user account, social, or admin operations. Admin routes must not trust caller-supplied identifiers.
- **Client-side persistence vs server authority** — AsyncStorage/localStorage may cache profile or admin state, but it is fully attacker-controlled and cannot be treated as proof of identity or role.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/index.ts`, route files under `artifacts/api-server/src/routes/`.
- **Highest-risk code areas:** `routes/auth.ts`, `routes/social.ts`, `routes/admin.ts`, `routes/requests.ts`, `routes/download.ts`, `routes/upload.ts`, and admin client hooks under `artifacts/admin/src/hooks/`.
- **Public vs authenticated vs admin surfaces:** public-ish routes include hospitals, AI, health, request browsing, and notifications; user-private surfaces include auth/profile, request mutations, reactions/comments, and all social messaging routes; admin surfaces include `/api/admin/*` plus APK management endpoints.
- **Usually dev-only:** `artifacts/mockup-sandbox/`; avoid spending time there unless production routing/deployment explicitly includes it.

## Threat Categories

### Spoofing

This project currently relies heavily on caller-supplied `userId` values flowing from mobile AsyncStorage and admin localStorage into API routes. The system must treat those values as untrusted hints, not identity. All authenticated and admin operations must be bound to a server-verified session or equivalent proof of identity, and admin actions must require server-side role verification tied to that session.

### Tampering

Users can create and modify requests, likes, comments, friend relationships, profile photos, and APK assets through API calls. The server must ensure callers can only mutate their own resources or resources they are explicitly authorized to manage. Administrative mutations such as blocking users, deleting accounts, or replacing the downloadable APK require strong authorization beyond possession of a guessed or stolen user ID.

### Information Disclosure

The API handles sensitive account data, contact details, friend graphs, message histories, and moderation-visible user records. Responses must be scoped to the authenticated principal, anonymous content must not accidentally reveal owner identifiers or phone numbers, and admin datasets must never be exposed through forgeable identity parameters. Error logging must continue to avoid leaking secrets or bearer credentials.

### Denial of Service

Public endpoints accept large JSON bodies, file uploads, outbound API fan-out, OTP/reset requests, and AI transcription/chat input. The service must prevent attacker-triggered resource exhaustion with bounded input sizes, anti-automation controls on auth and OTP/reset flows, and careful handling of expensive external calls.

### Elevation of Privilege

The most relevant elevation risk is broken access control rather than code injection: if normal users can act as other users or as admins by changing a request parameter, they can read messages, delete accounts, moderate content, or alter stored APKs. The system must enforce ownership and role checks server-side for every non-public route and websocket event.