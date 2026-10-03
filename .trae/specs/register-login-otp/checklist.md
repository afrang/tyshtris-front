# Register & Login with OTP - Verification Checklist

## Backend Infrastructure & Configuration
- [x] Checkpoint 1: `SmtpOptions` and `OtpOptions` options classes exist and bind correctly from `appsettings.json` sections `"Smtp"` and `"Otp"`.
- [x] Checkpoint 2: `appsettings.json` and `appsettings.Development.json` include the new sections with clear placeholders; Development defaults activate the console-based fallback email sender.
- [x] Checkpoint 3: `IEmailSender` interface and at least one implementation (`SmtpEmailSender` + `ConsoleLoggerEmailSender`) are registered in DI via `IdentityModule.Register` and can be injected without errors.

## Database & OTP Persistence
- [x] Checkpoint 4: `OtpCode` entity exists with: Id, UserId, CodeHash (hashed), Purpose (EmailVerification | Login), CreatedAtUtc, ExpiresAtUtc, ConsumedAtUtc.
- [x] Checkpoint 5: `IdentityDbContext` exposes `DbSet<OtpCode>` mapped to `identity.OtpCodes` table with indexes on `(UserId, Purpose)` and `ExpiresAtUtc`; DB schema is applied (either via migration or EnsureCreated — match existing project strategy).
- [x] Checkpoint 6: `OtpCodeService` generates numeric OTP codes, hashes them deterministically, rejects expired/consumed codes on validation, and enforces ResendCooldownSeconds between consecutive creations for the same (UserId, Purpose).

## Registration + Email Verification Endpoints
- [x] Checkpoint 7: `POST /api/auth/register` returns 202 and creates an inactive User with role=User, password hashed, DisplayName derived from email local part; an OtpCode with purpose=EmailVerification is stored; an email (or console log) with the 6-digit OTP is dispatched.
- [x] Checkpoint 8: `POST /api/auth/register` with duplicate email returns 409; with invalid email or password <6 chars returns 400 with descriptive error.
- [x] Checkpoint 9: `POST /api/auth/verify-otp` with correct (email, code) for an inactive user returns 200, sets user.IsActive=true, marks OtpCode consumed, and returns a JWT LoginResponse (or at least success flag — per spec choice).
- [x] Checkpoint 10: `POST /api/auth/verify-otp` with wrong or expired code returns 400 "Invalid or expired verification code."
- [x] Checkpoint 11: `POST /api/auth/resend-otp` invalidates previous verification OTP, generates & sends a new one, returns 202; returns 429 TooManyRequests if called within ResendCooldownSeconds.

## OTP-based Login Endpoints
- [x] Checkpoint 12: `POST /api/auth/request-login-otp` returns 202 for both active users and unknown/inactive emails (no enumeration); for active users an OtpCode with purpose=Login is stored and emailed/console-logged; for unknown emails silently no-ops.
- [x] Checkpoint 13: `POST /api/auth/login-otp` with correct active user + valid unexpired OTP returns 200 with `LoginResponse` of identical shape to password login (accessToken, expiresAtUtc, email, displayName, role); wrong/expired OTP or inactive user returns 401 generic message.
- [x] Checkpoint 14: Existing password login `POST /api/auth/login` continues to work exactly as before (active user + valid password → 200 with JWT; invalid → 401; inactive → 401). No regressions.

## Profile Completion & Existing Endpoints
- [x] Checkpoint 15: `PUT /api/auth/profile` accepts updated DisplayName (first+last combined) and persists it correctly; the email-derived placeholder created during registration can be overwritten this way.
- [x] Checkpoint 16: All `/api/admin/users/*` endpoints (list, get, create, update, role change, set password, delete) behave identically to the baseline (no regressions).

## Frontend: API Library & Auth Helpers
- [x] Checkpoint 17: `control-center/src/lib/api.ts` exports typed helpers: `register()`, `verifyEmailOtp()`, `resendVerificationOtp()`, `requestLoginOtp()`, `loginWithOtp()`; each calls the correct URL with correct JSON body.
- [x] Checkpoint 18: TypeScript `tsc --noEmit` (or `npm run build`) reports zero errors for the modified `api.ts` and `auth.ts`.

## Frontend: Register Page
- [x] Checkpoint 19: `/register` route is registered in `App.tsx` outside the ProtectedRoute guard; authenticated users who visit `/register` are redirected to `/`.
- [x] Checkpoint 20: `RegisterPage.tsx` Step 1 (email + password + confirm): validates email format, password match, password ≥6 chars; shows error messages on invalid input / duplicate email 409 / network errors.
- [x] Checkpoint 21: `RegisterPage.tsx` Step 2 (OTP entry): accepts 6-digit code; submission triggers `verifyEmailOtp`; success shows confirmation and redirects to `/login` (or auto-logs in per spec choice). Includes "Resend code" button with 60-second cooldown disabled state.
- [x] Checkpoint 22: Register page visually matches the LoginPage brand (logo, gradient, spacing consistent via `RegisterPage.css`).

## Frontend: Login Page OTP Mode
- [x] Checkpoint 23: `LoginPage.tsx` has a tab/segmented control switching between "Password" (existing) and "OTP" (new); default is Password to preserve muscle memory.
- [x] Checkpoint 24: OTP login mode Step A: email + "Send code" → calls `requestLoginOtp` → shows "Check your email" + cooldown "Resend" (always success UI, no "email not found" hints).
- [x] Checkpoint 25: OTP login mode Step B: 6-digit OTP input → `loginWithOtp` → on success `persistSession(result)` → redirect to `/`; on 401 shows "Invalid or expired code."
- [x] Checkpoint 26: Original password mode is fully unchanged (no visual/behavior regression); loading + error states are still correct.

## Build & End-to-End Smoke
- [x] Checkpoint 27: Backend `dotnet build` from backend repo root returns exit code 0 with no new warnings beyond baseline.
- [x] Checkpoint 28: Frontend `npm run build` (or correct script from `package.json`) completes without errors or TS diagnostics.
- [x] Checkpoint 29: Manual end-to-end walk-through passes:
  1. Register → get OTP from backend console → verify → redirected / able to login.
  2. Logout → password login → dashboard.
  3. Logout → OTP login request → get OTP → submit → dashboard.
  4. Update DisplayName via profile endpoint/settings → `/api/auth/me` returns updated value.
- [x] Checkpoint 30: Edge cases tested manually: duplicate email registration, wrong OTP, expired OTP (>10 min), resend cooldown button, login OTP request for non-existent email gives no enumeration clue.
