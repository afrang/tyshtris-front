# Register & Login with OTP - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: Add SmtpOptions + OtpOptions configuration and EmailService infrastructure
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Add `Options/SmtpOptions.cs` with: Host, Port, Username, Password, EnableSsl, DefaultFromAddress. Bind from config section `"Smtp"`.
  - Add `Options/OtpOptions.cs` with: ExpirationMinutes (default 10), CodeLength (default 6), ResendCooldownSeconds (default 60). Bind from `"Otp"`.
  - Add `Application/IEmailSender.cs` interface and `Application/SmtpEmailSender.cs` implementation using System.Net.Mail / SmtpClient (or modern `System.Net.Mail` equivalent — use `SmtpClient` with `UseDefaultCredentials=false` and `Credentials=NetworkCredential`). For development, if SMTP host is empty, fallback to a `ConsoleLoggerEmailSender` that writes OTP to console + debug output (so devs can test without real SMTP).
  - Register services in `IdentityModule.Register(services, configuration)`: configure options, add `IEmailSender` with the correct implementation (Smtp if host configured, else Console).
  - Update `appsettings.json` to add empty defaults for `Smtp` and `Otp` sections.
  - Update `appsettings.Development.json` with placeholder-friendly Smtp settings (leave host empty so Console sender activates by default) and sample Otp settings.
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `programmatic` TR-1.1: Backend compiles cleanly; `SmtpOptions` and `OtpOptions` are correctly bindable (throw clear startup error if ExpirationMinutes <= 0 or CodeLength not between 4-10).
  - `human-judgement` TR-1.2: `appsettings.Development.json` includes the new sections clearly commented and `IEmailSender` service is injectable (verified by smoke test via the next tasks).
- **Notes**: Keep the Console fallback sender visible so OTP codes appear in the backend console during local development (avoids needing a real inbox).

## [x] Task 2: Add OTP storage domain + DB schema (entity, DbContext, migration)
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Add new entity `Domain/OtpCode.cs`: Id (Guid), UserId (Guid non-null), CodeHash (string non-null — store SHA256 of the code), Purpose (string: "EmailVerification" | "Login"), CreatedAtUtc, ExpiresAtUtc, ConsumedAtUtc (nullable). Map purpose to a constant enum-like class `OtpPurposes`.
  - Add `IdentityDbContext.OtpCodes` DbSet; configure table `OtpCodes` under `identity` schema. Add index on (UserId, Purpose) and (ExpiresAtUtc).
  - Add `Infrastructure/OtpCodeService.cs` (scoped): GenerateNumericCode(length), HashCode(code), CreateOtpAsync(userId, purpose), ValidateAndConsumeOtpAsync(userId, purpose, enteredCode) → returns (bool valid, string? error). Implement cooldown check via most recent CreatedAtUtc for the (UserId, Purpose) pair.
  - Add EF migration (or if migrations aren't used in the project, ensure `EnsureCreated` / the seeding strategy picks up the new table; follow the existing IdentitySeeder pattern and keep schema consistent with existing approach).
- **Acceptance Criteria Addressed**: AC-1 (storage part), AC-3, AC-4, AC-5, FR-12
- **Test Requirements**:
  - `programmatic` TR-2.1: DbContext builds the model with `OtpCodes` table under `identity` schema; `OtpCodeService.GenerateNumericCode(n)` produces `n`-digit numeric strings; `HashCode` is deterministic (same code → same hash) and non-reversible.
  - `programmatic` TR-2.2: `ValidateAndConsumeOtpAsync` returns valid=true only for non-expired, non-consumed, matching hash; after success, `ConsumedAtUtc` is set; cooldown rejects earlier than ResendCooldownSeconds.
- **Notes**: The User entity `DisplayName` field is already required. Decide: at registration use email local-part as placeholder DisplayName (e.g., "john.doe" for "john.doe@example.com") OR allow empty DisplayName at DB level. Prefer placeholder approach (no DB schema change to User) and let profile update (AC-8) set it later. If we must relax the DisplayName constraint, do it in this task as a small EF model change only (do NOT split into FirstName/LastName columns — single DisplayName per AC-8).

## [x] Task 3: Add register + verify-otp + resend-otp backend endpoints
- **Priority**: high
- **Depends On**: Task 1, Task 2
- **Description**:
  - Add DTOs in `Application/AuthDtos.cs` (new file): `RegisterRequest(Email, Password)`, `VerifyOtpRequest(Email, Code, Purpose?=EmailVerification)`, `ResendOtpRequest(Email, Purpose?=EmailVerification)`, `VerifyOtpResponse(Success, AccessToken?, ExpiresAtUtc?, Email?, DisplayName?, Role?)` — optionally return JWT on success (answer to Open Question: default return JWT so user is auto-logged in; but also allow login-page redirect).
  - Update `AuthService` to add:
    - `RegisterAsync(RegisterRequest)`: validate email format, password ≥6 chars, check uniqueness; create User with `IsActive=false`, role=`User`, DisplayName=email local part (or empty if Task 2 relaxed DB); call OtpCodeService.CreateOtp + IEmailSender.SendOtpEmailAsync.
    - `VerifyEmailOtpAsync(VerifyOtpRequest)`: find user by email (must be inactive for EmailVerification), call ValidateAndConsumeOtp, set IsActive=true, optionally issue JWT via jwtTokenService.
    - `ResendOtpAsync(ResendOtpRequest)`: cooldown check, invalidate previous (delete or mark consumed), create new, send email.
  - Add endpoints in `IdentityModule.MapAuthEndpoints`:
    - `POST /api/auth/register` → AllowAnonymous, 202 on success
    - `POST /api/auth/verify-otp` → AllowAnonymous, 200 on success (with JWT)
    - `POST /api/auth/resend-otp` → AllowAnonymous, 202 on success, 429 on cooldown
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: `POST /api/auth/register` with valid payload → 202; new inactive User row + OtpCode row; SMTP/Console sender logs the 6-digit code.
  - `programmatic` TR-3.2: Duplicate email → 409. Short password or invalid email → 400.
  - `programmatic` TR-3.3: `POST /api/auth/verify-otp` with correct code → 200, user active, OTP consumed, JWT returned; wrong/expired → 400; cooldown enforced on resend.
- **Notes**: Email templates: plain text for this phase. Example subject: "Your TishtryaCMS verification code"; body: "Use code XXXXXX to verify your email. It expires in N minutes."

## [x] Task 4: Add OTP-login endpoints (request OTP + login with OTP)
- **Priority**: high
- **Depends On**: Task 1, Task 2
- **Description**:
  - Add DTOs: `RequestLoginOtpRequest(Email)`, `LoginOtpRequest(Email, Code)`.
  - Extend `AuthService`:
    - `RequestLoginOtpAsync(Email)`: ensure user exists AND is active; generate OtpCode with purpose=Login; cooldown enforcement; email via IEmailSender. **Important**: If user does not exist / is inactive, return 202 silently (no enumeration).
    - `LoginOtpAsync(LoginOtpRequest)`: find active user by email, validate+consume OTP, issue JWT (same `LoginResponse` shape as password login). Failures return 401 generic message.
  - Add endpoints:
    - `POST /api/auth/request-login-otp` → AllowAnonymous → 202 (always success-looking)
    - `POST /api/auth/login-otp` → AllowAnonymous → 200 with LoginResponse OR 401
- **Acceptance Criteria Addressed**: AC-6, FR-5
- **Test Requirements**:
  - `programmatic` TR-4.1: Active user POST to `/request-login-otp` → OtpCode row created + email sent; request for non-existent email returns 202 but no email/otp.
  - `programmatic` TR-4.2: Correct code → 200 with JWT shape matching password login; wrong/expired code → 401. Inactive user's code (if any) does NOT grant a token.
- **Notes**: Rate-limiting on `/request-login-otp` should be at least as strict as verification (60s / email). Share the same OtpCodeService cooldown.

## [x] Task 5: Update frontend API library and auth helpers
- **Priority**: high
- **Depends On**: Task 3, Task 4 (backend must have contracts)
- **Description**:
  - Extend `control-center/src/lib/api.ts` with typed functions: `register(email, password)`, `verifyEmailOtp(email, code)`, `resendVerificationOtp(email)`, `requestLoginOtp(email)`, `loginWithOtp(email, code)`. Mirror backend DTO shapes.
  - Extend `control-center/src/lib/auth.ts` types if needed (none should be required; LoginResult already covers both password and OTP login).
- **Acceptance Criteria Addressed**: FR-7 (indirect), AC-10/11 dependencies
- **Test Requirements**:
  - `programmatic` TR-5.1: TypeScript compiles with zero new errors; new exported functions correctly call their endpoint URLs with proper JSON bodies.
- **Notes**: Keep `api.ts` minimal — no React hooks here (matching existing pattern).

## [x] Task 6: Build frontend RegisterPage with step wizard (email/password → OTP → done)
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Create `pages/RegisterPage.tsx` + `pages/RegisterPage.css`. Reuse the `login-shell` / `login-atmosphere` styling from LoginPage (copy+adapt, or extract a shared `AuthShell` component if extracting is simpler; however per "prefer editing existing" don't over-extract — simply mirror styles).
  - Step 1: email, password, confirm password. Validation: valid email, passwords match, ≥6 chars. Submit → call `register()`. Handle 409 duplicate email.
  - Step 2: 6 OTP input boxes (or single 6-char field; either is fine). Submit → `verifyEmailOtp()`. On success, show success + countdown redirect to `/login` (or auto-login if we decide to consume the returned JWT). Include a "Resend code" button that calls `resendVerificationOtp()` with cooldown UI (countdown 60s disabled).
  - Link below form: "Already have an account? Sign in" → navigate to `/login`.
  - Add route in `App.tsx`: `<Route path="/register" element={<RegisterPage />} />` (outside ProtectedRoute).
  - Add i18n keys in `i18n/documentTranslations.ts` for register/verify-otp strings (or mirror existing translation keys pattern; add new keys t('register'), t('verifyEmail'), t('otpSent'), t('resend'), etc.).
- **Acceptance Criteria Addressed**: AC-10, FR-9, FR-11
- **Test Requirements**:
  - `programmatic` TR-6.1: TS compiles, route `/register` is reachable and renders without ProtectedRoute guard; `isAuthenticated()` users are redirected away (Navigated to `/`) similar to LoginPage pattern.
  - `human-judgement` TR-6.2: Visual step flow matches LoginPage visual style; error messages display on invalid inputs / network errors; cooldown button disables correctly.
- **Notes**: Style new page to match existing `LoginPage.css` brand (logo, gradient, spacing). Keep CSS in a single `RegisterPage.css` file.

## [/] Task 7: Update LoginPage to support OTP mode toggle
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Modify `pages/LoginPage.tsx` to add a tab switch (or segmented control) at the top: "Sign in with Password" | "Sign in with OTP".
  - Password mode: keep the existing behavior (email + password fields → `login()`).
  - OTP mode: (sub-step A) email field + "Send me a code" button → calls `requestLoginOtp()`, shows "Check your email" + cooldown "Resend" button; (sub-step B) 6-digit OTP input → `loginWithOtp()`, on success persistSession + redirect to `/`.
  - In OTP mode, "Send me a code" should return success-like UI even for unknown emails (per backend behavior) to avoid enumeration; "Invalid code" shown only on OTP submit failure.
  - Update CSS `LoginPage.css` to accommodate the tabs and OTP sub-steps.
- **Acceptance Criteria Addressed**: AC-11, FR-10
- **Test Requirements**:
  - `programmatic` TR-7.1: TS compiles; existing password login path still works unchanged; OTP path wires to correct API functions.
  - `human-judgement` TR-7.2: Tab switching is intuitive visually; password and OTP flows both reach authenticated dashboard in manual test; loading / error states are visible.
- **Notes**: Ensure no regressions in existing translations; add any new strings as new i18n keys, not inline text (match existing convention — see `UiLanguage.tsx`/`documentTranslations.ts`).

## [x] Task 8: Update backend build verification + regression check
- **Priority**: medium
- **Depends On**: Task 1, 2, 3, 4
- **Description**:
  - Build backend solution with `dotnet build`; ensure 0 warnings (or existing warning count) and all Identity module changes compile.
  - Verify all existing endpoints still respond: POST `/api/auth/login` (password), GET `/api/auth/me` (with token), PUT `/api/auth/profile`, PUT `/api/auth/password`, all `/api/admin/users/*` with SuperAdmin.
  - Manually run: backend starts with both `appsettings.json` (no SMTP host) → Console sender activates → OTP codes appear in stdout.
- **Acceptance Criteria Addressed**: AC-7, AC-9, AC-12
- **Test Requirements**:
  - `programmatic` TR-8.1: `dotnet build` from backend root returns exit code 0.
  - `human-judgement` TR-8.2: Developer manual smoke-test of all user journeys covers AC-1 through AC-11 with the console email sender.
- **Notes**: Update `TishtryaCMS.Api.http` (if present) with new endpoint examples to help the reviewer.

## [x] Task 9: Frontend build + manual full-flow verification
- **Priority**: medium
- **Depends On**: Task 6, 7
- **Description**:
  - `npm run build` (or equivalent, check package.json script name) from control-center root; confirm 0 TS errors, 0 build errors.
  - Manual walk-through end-to-end:
    1. Register with new email → get OTP from backend console → verify → login/redirect.
    2. Logout → login with password → success.
    3. Logout → login with OTP → request → get OTP → submit → success.
    4. Update DisplayName via Settings (or new profile prompt if any) → persists on next `/api/auth/me`.
- **Acceptance Criteria Addressed**: AC-10, AC-11, AC-8
- **Test Requirements**:
  - `programmatic` TR-9.1: Frontend build succeeds without errors.
  - `human-judgement` TR-9.2: Full manual walk-through succeeds; all edge cases (duplicate email, wrong OTP, expired OTP, resend cooldown) surface reasonable user-facing messages.
- **Notes**: Document the user-facing copy (OTP email text, success toast messages, error messages) for the reviewer.
