# B2C Multi-App Demo

A React demo that shows how **multiple independent Azure AD B2C app registrations** can be tested from a single UI. Each card on the home page represents a separate B2C app (different client ID, tenant, and policy). Clicking **Sign in** opens a new tab and runs the full B2C redirect → callback → welcome flow in isolation.

---

## What It Does

| Feature | Detail |
|---|---|
| Multiple B2C apps | Each card maps to its own Azure App Registration |
| Environment switcher | Switch between DEV / STAGE / PROD per app |
| Isolated sessions | Each tab uses `sessionStorage` so apps don't share auth state |
| New-tab sign-in | Sign in opens in a new tab, leaving the home page untouched |
| Token claims viewer | After login the Welcome page shows decoded ID token claims |

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (dev server on port **8080**)
- **MSAL Browser** (`@azure/msal-browser`) — Microsoft Authentication Library
- **React Router v6**
- **Tailwind CSS**

---

## Prerequisites

- Node.js 18+
- One or more Azure AD B2C tenants with app registrations and custom policies (IEF) or user flows

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your B2C values:

```bash
cp .env.example .env
```

Open `.env` and set the variables for each app you want to enable:

```env
# App 1 — DEV environment
VITE_APP1_NAME="Vendor Hub"
VITE_APP1_DEV_TENANT_DOMAIN=yourtenantdev.onmicrosoft.com
VITE_APP1_DEV_CLIENT_ID=<App Registration Client ID>
VITE_APP1_DEV_POLICY=B2C_1A_YOUR_POLICY
VITE_APP1_DEV_SCOPE=openid profile offline_access
```

Leave an env block empty to mark it as **"not set"** (the button will be disabled).

### 3. Register the redirect URI in Azure

In each App Registration → **Authentication → Redirect URIs**, add:

```
http://localhost:8080/auth/callback
```

> Each app registration needs its own redirect URI entry.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

---

## Environment Variable Naming Convention

```
VITE_APPn_NAME                      — Card display name
VITE_APPn_DESC                      — Card description
VITE_APPn_{ENV}_TENANT_DOMAIN       — e.g. mytenantdev.onmicrosoft.com
VITE_APPn_{ENV}_CLIENT_ID           — Azure App Registration client ID
VITE_APPn_{ENV}_POLICY              — B2C policy name, e.g. B2C_1A_SUSI
VITE_APPn_{ENV}_SCOPE               — Space-separated OIDC scopes
```

Where `n` = 1, 2, 3 and `{ENV}` = `DEV`, `STAGE`, or `PROD`.

---

## Adding a New App

1. Add a new block to `.env`:
   ```env
   VITE_APP4_NAME="My New App"
   VITE_APP4_DEV_TENANT_DOMAIN=...
   VITE_APP4_DEV_CLIENT_ID=...
   VITE_APP4_DEV_POLICY=...
   VITE_APP4_DEV_SCOPE=openid profile offline_access
   ```

2. Add an entry to the `B2C_APPS` array in [src/config/b2cApps.ts](src/config/b2cApps.ts):
   ```ts
   {
     id: 'app4',
     name:        e.VITE_APP4_NAME ?? 'My New App',
     description: e.VITE_APP4_DESC ?? '',
     icon: '🚀',
     gradient: 'from-pink-600 to-pink-800',
     environments: {
       dev: envConfig('VITE_APP4', 'DEV'),
     },
   },
   ```

---

## Project Structure

```
src/
├── components/
│   ├── AppCard.tsx          # Card for each B2C app — env selector + sign-in button
│   ├── EnvBadge.tsx         # DEV / STAGE / PROD badge
│   ├── Header.tsx           # Top nav with logout button
│   └── ProtectedRoute.tsx   # Redirects unauthenticated users to /
├── config/
│   └── b2cApps.ts           # App registry — add/remove apps here
├── contexts/
│   ├── AppConfigContext.tsx  # Tracks the currently selected app + env
│   └── AuthContext.tsx       # Auth state (user, tokens, login, logout)
├── lib/
│   └── msalFactory.ts        # MSAL instance creation, caching, pending-auth helpers
└── pages/
    ├── Home.tsx              # App card grid (landing page)
    ├── SignIn.tsx            # New-tab redirect launcher
    ├── AuthCallback.tsx      # Handles B2C redirect response
    └── Welcome.tsx           # Post-login page showing token claims
```

---

## Build for Production

```bash
npm run build
```

Output is in `dist/`. Update the redirect URI in each Azure App Registration to match your production domain.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Sign-in opens Microsoft login instead of B2C policy | `POLICY` env var is wrong/missing, or the policy isn't enabled in IEF |
| `interaction_in_progress` error | Stale MSAL session — clear sessionStorage and retry |
| Button is greyed out ("not set") | One or more of `TENANT_DOMAIN`, `CLIENT_ID`, or `POLICY` is empty in `.env` |
| `redirect_uri_mismatch` error | `http://localhost:8080/auth/callback` is not registered in the Azure App Registration |
| Blank screen after callback | No pending auth session — the new tab was opened without going through the home page sign-in button |
