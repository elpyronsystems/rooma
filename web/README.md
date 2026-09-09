# Rooma Website (React + TypeScript + Vite)

A working, tested React website for Rooma — separate from the Flutter
mobile app, calling the exact same backend API you already built. This
was built and verified in a real environment: `npm install`, TypeScript
type-checking, and a full production build all pass cleanly.

## Design direction

Deliberately steers away from the generic "SaaS cream background +
terracotta accent" look. Palette: warm ivory paper, deep indigo, and a
warm ochre gold — grounded and trustworthy, fitting a platform real
landlords, agents, and hotel managers will use for actual transactions.
Layout is an asymmetric split panel (not a centered card) with a subtle
geometric pattern accent, paired with Fraunces (display serif) and IBM
Plex Sans (body/UI).

## 1. What's included

```
src/
  api/
    client.ts       — fetch wrapper, auth headers, error parsing
    auth.ts         — signup, verifyOtp, login, logout
    apiError.ts     — ApiError class carrying backend error details
    types.ts        — shared TypeScript types
  context/
    AuthContext.tsx — app-wide logged-in user state
  components/
    AuthLayout.tsx  — shared split-panel layout for auth pages
    ProtectedRoute.tsx — redirects to /login if not authenticated
  pages/
    LoginPage.tsx
    SignupPage.tsx
    OtpVerificationPage.tsx
    HomePage.tsx    — placeholder after login; build the real listings feed here next
  App.tsx           — routes
  main.tsx          — entry point
  index.css         — design tokens (colors, type) + base styles
```

## 2. Run it

```
npm install
npm run dev
```
Opens at `http://localhost:5173`. Since this is a real website (not an
emulator), `localhost` works directly — no `10.0.2.2` translation needed
like the Flutter/Android setup.

Make sure your backend is running too (`npm run dev` in your `backend`
folder) — the site expects it at `http://localhost:4000/api`, set in
`src/api/client.ts`.

## 3. CORS — one setting to check

Your backend's `ALLOWED_ORIGINS` in `.env` needs to include this site's
origin. Update it to:
```
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8080,http://localhost:5173"
```
(Vite's default dev port is 5173 — different from the 3000/8080 placeholders
from earlier.) Restart your backend after changing `.env`.

## 4. The flow

Same as the Flutter version: **Login → Sign Up → Verify OTP → Login → Home**.
Hubtel SMS still isn't wired up on the backend (on hold), so to test
verification: sign up, then open `npx prisma studio` in your backend
folder, find the code in the `SmsVerification` table, and type it in.

## 5. Type safety

Every API response is typed (see `src/api/types.ts`), and validation
errors from the backend's Zod layer are surfaced field-by-field on the
signup form automatically — try submitting a password under 8 characters
to see it in action.

## 6. Verified before handing off

- `npm install` — clean
- `npm run typecheck` — zero TypeScript errors
- `npm run build` — successful production build (173KB JS, gzipped ~56KB)

I couldn't visually screenshot the rendered pages in the environment I
built this in (no headless browser available), so give it a look on
your end once it's running — if the layout, spacing, or colors need
adjusting, tell me what you see and I'll refine it.
