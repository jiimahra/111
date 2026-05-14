# Objective
Perform a production-scope security scan across Sahara, prioritizing exploitable broken access control and identity-trust failures in the Express API and connected clients.

## Shared context
- Production surfaces: `artifacts/api-server/`, `artifacts/mobile/` client calls into `/api`, and `artifacts/admin/` admin web client.
- Dev-only unless proven otherwise: `artifacts/mockup-sandbox/`.
- Primary trust boundary: clients are untrusted; AsyncStorage/localStorage values are attacker-controlled.
- Early recon finding: many server routes appear to trust caller-supplied `userId` values with no session binding.
- Deterministic scans were run: SAST and HoundDog results are available in notebook variables `sast` and `hounddog`.

## Tasks

### T001: Validate account/authentication boundary failures
- **Blocked By**: []
- **Files**: `artifacts/api-server/src/routes/auth.ts`, `artifacts/mobile/lib/auth.ts`, `artifacts/mobile/contexts/AppContext.tsx`, `lib/db/src/schema/users.ts`
- **Checks**:
  - Determine whether account/profile/delete/reset operations are authenticated server-side.
  - Confirm whether user enumeration, account takeover, or arbitrary account deletion is possible.
  - Check password reset/admin OTP flows for brute-force or replay weaknesses.
- **Acceptance**: Confirmed exploit paths or documented mitigations with concrete endpoint references.

### T002: Validate social and request authorization failures
- **Blocked By**: []
- **Files**: `artifacts/api-server/src/routes/social.ts`, `artifacts/api-server/src/routes/requests.ts`, `artifacts/mobile/lib/social.ts`, `artifacts/mobile/app/(tabs)/index.tsx`, `artifacts/mobile/app/(tabs)/volunteer.tsx`, `lib/db/src/schema/social.ts`, `lib/db/src/schema/requests.ts`
- **Checks**:
  - Determine whether a user can read/modify other users' messages, friend relationships, likes/comments, or request state by swapping IDs.
  - Identify any broad data exposure of user/contact data.
- **Acceptance**: Private data access and unauthorized mutation paths are either confirmed or ruled out.

### T003: Validate admin and APK management boundary
- **Blocked By**: []
- **Files**: `artifacts/api-server/src/routes/admin.ts`, `artifacts/api-server/src/routes/download.ts`, `artifacts/admin/src/hooks/use-admin.ts`, `artifacts/admin/src/pages/login.tsx`, `artifacts/admin/src/pages/dashboard.tsx`, `artifacts/admin/src/pages/users.tsx`
- **Checks**:
  - Determine whether admin identity is protected by a real session or only a caller-supplied `userId`.
  - Validate whether APK upload/delete/status endpoints are effectively admin-only.
  - Check whether admin OTP flow can be abused or brute-forced.
- **Acceptance**: Admin compromise scenarios are confirmed or ruled out with exact routes and prerequisites.

### T004: Review secondary public/external-call surfaces
- **Blocked By**: []
- **Files**: `artifacts/api-server/src/routes/ai.ts`, `artifacts/api-server/src/routes/hospitals.ts`, `artifacts/api-server/src/routes/upload.ts`, `artifacts/api-server/src/routes/notifications.ts`, `artifacts/api-server/src/index.ts`
- **Checks**:
  - Check for SSRF/open redirect/path traversal/object exposure and unauthenticated resource abuse on public features.
  - Review websocket identity assumptions and upload/object serving controls.
- **Acceptance**: Any production-impactful issues are confirmed; non-exploitable or dev-only concerns are discarded.

### T005: Synthesize findings and update tracking files
- **Blocked By**: [T001, T002, T003, T004]
- **Details**:
  - Deduplicate overlapping findings.
  - Group new vulnerability files by shared remediation area.
  - Update relevant existing vulnerabilities if any appear.
  - Refresh `threat_model.md` if new scope information emerges.
- **Acceptance**: Findings are grouped under `.local/new_vulnerabilities/` and ready for `report_scan_complete`.
