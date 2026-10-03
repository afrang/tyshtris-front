# Register & Login with OTP - Product Requirement Document

## Overview
- **Summary**: Implement a multi-step user registration and authentication system with email-based OTP (One-Time Password) verification. Users can register with email+password, verify their email via OTP, optionally complete their profile, and login using either password or OTP.
- **Purpose**: Secure user onboarding with email ownership verification, reduce password-reset friction by supporting OTP-based login, and allow gradual profile completion.
- **Target Users**: New users creating accounts on TishtryaCMS control center, and existing users logging in.

## Goals
- Add self-service registration endpoint (email + password) that triggers an OTP email.
- Implement OTP verification flow that confirms email ownership and activates the user.
- Support two login methods: password-based and OTP-based (magic-code via email).
- After first successful login, allow optional profile completion (first name / last name → DisplayName).
- Provide SMTP/email settings via appsettings configuration and environment variables.

## Non-Goals (Out of Scope)
- Social login providers (Google, Facebook, etc.) are NOT part of this phase.
- Phone/SMS-based OTP is NOT required; email-only.
- Two-factor authentication (TOTP app) is NOT required.
- Password reset flow via email is NOT in scope (OTP login covers it as a side effect).
- Role escalation during registration; new users always get the `User` role.

## Background & Context
- The Identity module already exists with: `User` entity (Email, PasswordHash, Role, DisplayName required, IsActive, CreatedAtUtc), JWT token auth, password login, and admin user CRUD.
- The `DisplayName` field is currently required at user creation. For the new "optional name/lastname after first login" flow, this must be relaxed: use the email local-part as a placeholder DisplayName during registration, and allow updating it post-login.
- Frontend has an existing `LoginPage` at `/login` but no register page.
- No email sending infrastructure (SMTP) exists yet; it needs to be added and configured via `appsettings.json` + `.env` equivalents.
- Database is SQL Server with EF Core; schema is under the `identity` schema.

## Functional Requirements
- **FR-1 Registration**: User submits email + password; system validates input, hashes password, creates a user record with `IsActive=false`, generates and stores an OTP code, and sends the OTP via email.
- **FR-2 OTP Verification (Registration)**: User submits email + OTP; system validates OTP (correct code, not expired), sets `IsActive=true`, and clears the OTP.
- **FR-3 OTP Resend**: User can request a new OTP code for the same email (rate-limited); the old OTP is invalidated.
- **FR-4 Password Login**: Existing password login continues to work; only active users can log in.
- **FR-5 OTP Login**: User requests an OTP by email, receives it, and submits it; on success, issues a JWT (no password needed). Only active users.
- **FR-6 Profile Completion (Optional)**: After first login (or at any time), user can set/update DisplayName (first + last name combined) via the existing `/api/auth/profile` endpoint. No forced gate; purely optional.
- **FR-7 Email Service**: A reusable email service that reads SMTP settings from configuration and sends plain-text emails with OTP codes.
- **FR-8 Configuration**: Email (SMTP) settings are loaded from `appsettings.json` / `appsettings.Development.json`, including host, port, username, password, enableSsl, defaultFrom address, and OTP expiration in minutes.
- **FR-9 Frontend Register Flow**: A new `/register` page with steps: (1) email + password, (2) enter OTP, (3) success → redirect to login.
- **FR-10 Frontend Login Enhancements**: Existing `/login` page gains a toggle between "Password" mode and "OTP" mode. OTP mode: enter email → request OTP → enter OTP → login.
- **FR-11 Frontend Routes**: Add `/register` route; keep `/login` route.
- **FR-12 OTP Storage & Expiration**: OTP codes are stored hashed (or at least obscured) with a creation timestamp; expire after a configurable window (default 10 minutes). Rate limit: max 1 request per 60 seconds per email.

## Non-Functional Requirements
- **NFR-1 Security**: Passwords are stored using `PasswordHasher<User>` (already used). OTP codes are stored hashed or salted in DB, never in plaintext logs. JWT uses the existing signing key.
- **NFR-2 Rate Limiting**: OTP requests are rate-limited per email to prevent abuse / mail spam (min 60s between requests).
- **NFR-3 Observability**: Failed login / OTP attempts return generic "invalid" messages (no email-enumeration hints except where necessary for UX).
- **NFR-4 Compatibility**: Existing `/api/auth/login` (password) and `/api/admin/users/*` endpoints continue to work without breaking changes.
- **NFR-5 Configurability**: All SMTP and OTP parameters (expiry, length, rate limit) are configurable via appsettings without code changes.

## Constraints
- **Technical**: C# / .NET 10 backend (modular monolith, Identity module), React + TypeScript + Vite frontend, SQL Server + EF Core, JWT bearer auth. SMTP for email delivery.
- **Business**: Self-registered users receive role `User` only; no admin self-escalation.
- **Dependencies**: System.Net.Mail (or FluentEmail if preferred, but existing code has no email library yet → use built-in SmtpClient / MailKit via a minimal abstraction to avoid adding unnecessary packages).

## Assumptions
- Frontend runs on http://localhost:5173 and backend on http://localhost:5068 (CORS already configured).
- Users who register but never verify OTP remain inactive and cannot log in until verified.
- OTP code length is 6 digits (numeric).
- DisplayName during registration is derived from email local part (e.g., "john.doe" from "john.doe@example.com"); users can change it later.

## Acceptance Criteria

### AC-1: Registration endpoint creates inactive user and sends OTP email
- **Given**: SMTP settings are configured and no user exists with the email
- **When**: Client POSTs valid email + password to `/api/auth/register`
- **Then**: Response is 202 Accepted; a new inactive User record is created with role `User` and email-derived DisplayName; an OTP code is stored (hashed) for that user with an expiry; an email containing the OTP is dispatched.
- **Verification**: `programmatic` (integration test + console log / SMTP stub during dev)

### AC-2: Registration with existing email returns 409 without leaking existence
- **Given**: A user already exists with that email (active or inactive)
- **When**: Client POSTs same email to `/api/auth/register`
- **Then**: Response is 409 Conflict with a generic "Could not register" error (do NOT explicitly confirm user existence if that is desired; however for typical admin UX we can be explicit per current CreateUserAsync behavior → match existing pattern)
- **Verification**: `programmatic`

### AC-3: OTP verification activates the user
- **Given**: An inactive user exists with a valid, non-expired OTP stored
- **When**: Client POSTs correct (email, otp) to `/api/auth/verify-otp`
- **Then**: Response is 200 OK; user.IsActive becomes true; the stored OTP is cleared / invalidated; a JWT token is optionally returned so user can proceed straight in.
- **Verification**: `programmatic`

### AC-4: Wrong or expired OTP fails verification
- **Given**: An inactive user exists but OTP is wrong or expired (>10 min default)
- **When**: Client POSTs (email, wrong-otp) to `/api/auth/verify-otp`
- **Then**: Response is 400 Bad Request with "Invalid or expired verification code."
- **Verification**: `programmatic`

### AC-5: OTP resend rotates the code and honors rate limit
- **Given**: A pending registration user exists
- **When**: Client POSTs email to `/api/auth/resend-otp`
- **Then**: If less than 60s since last request → 429 TooManyRequests; otherwise previous OTP invalidated, new OTP generated & emailed → 202 Accepted.
- **Verification**: `programmatic`

### AC-6: OTP Login flow issues a JWT
- **Given**: An active user exists
- **When**: (Step 1) Client POSTs email to `/api/auth/request-login-otp` → 202 + OTP emailed; (Step 2) Client POSTs (email, otp) to `/api/auth/login-otp`
- **Then**: Response 200 with `LoginResponse` (JWT token, expiresAt, email, displayName, role) identical shape to password login.
- **Verification**: `programmatic`

### AC-7: Password login continues working as before for active users
- **Given**: An active user with correct password
- **When**: Client POSTs to existing `/api/auth/login`
- **Then**: Returns 200 with JWT; inactive user returns 401.
- **Verification**: `programmatic`

### AC-8: DisplayName update (profile completion)
- **Given**: A logged-in user (JWT provided)
- **When**: Client PUTs { email, displayName } to `/api/auth/profile`
- **Then**: DisplayName is updated (can accept first+last name combined); returns 200 with updated user info; this works immediately after first login.
- **Verification**: `programmatic`

### AC-9: Email settings are read from configuration
- **Given**: `appsettings.json` contains a `Smtp` section (Host, Port, Username, Password, EnableSsl, DefaultFromAddress) and `Otp` section (ExpirationMinutes, CodeLength, ResendCooldownSeconds)
- **When**: Backend starts and any OTP email is sent
- **Then**: Email service uses those exact settings; missing required config causes a clear startup error (for Smtp host/port at minimum).
- **Verification**: `programmatic` (smtp stub reads options) + `human-judgment` (dev fills in .env / appsettings.Development.json)

### AC-10: Frontend /register page walks user through 2-step registration
- **Given**: Unregistered user visits `/register`
- **When**: Submits valid email + matching password confirm → moves to OTP step; submits correct OTP
- **Then**: Success message → auto-redirect to `/login`; both steps show validation errors for invalid inputs; network errors are surfaced.
- **Verification**: `human-judgment` (manual walk-through) + `programmatic` (TypeScript builds without errors, routes wired)

### AC-11: Frontend /login supports Password and OTP modes
- **Given**: User visits `/login`
- **When**: Tabs toggle between "Password" (existing form) and "OTP" (email → send code → 6-digit input)
- **Then**: OTP mode successfully requests OTP, accepts code, calls `persistSession` with returned JWT, redirects to `/`; errors shown appropriately.
- **Verification**: `human-judgment` (manual walk-through) + `programmatic` (TS compiles, routes exist)

### AC-12: No regressions in existing admin user management
- **Given**: Admin user is logged in
- **When**: Using `/api/admin/users/*` endpoints (create, list, update, delete, set password, change role)
- **Then**: All behave identically to before; the addition of `FirstName`/`LastName` fields (if any) or OTP infrastructure does not break them.
- **Verification**: `programmatic` (build + existing endpoints still smoke-test via backend.http or similar)

## Open Questions
- [ ] Do we want to split `DisplayName` into `FirstName` + `LastName` columns, or keep it as a single combined field? (Single field keeps DB changes minimal; can always split later.)
- [ ] Should successful OTP verification (registration) auto-login the user (return JWT), or force them to the login page? Current AC-3 says optionally return JWT; decide before implementation.
- [ ] Is 60s OTP resend cooldown and 10-minute expiration acceptable?
- [ ] SMTP provider: Are we using a real SMTP server for development (e.g., Mailtrap / Papercut) or should localhost SMTP stub (console logging) be the default in Development?
