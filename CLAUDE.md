# Property 101 Group — Body Corporate Management Portal

## IMPORTANT: Working Rules
- **Always ask the user's permission before making any code changes.** Describe the change and wait for approval first.

## Project Overview
Internal staff portal for Property 101 Group (NZ-based Body Corporate and Incorporated Society management company). Manages complexes, insurance workflows, meetings, contractors, document generation, and statutory disclosures.

## Tech Stack
- React 19 + TypeScript + Vite (SPA, port 3000 with `npm run dev`)
- Firebase Firestore (database) + Firebase Auth (authentication)
- Google Gemini AI via `services/geminiService.ts`
- lucide-react for all icons (no raw SVGs)
- NZ-centric locale (`en-NZ`) throughout

## Key Files
- `firebase.ts` — Firestore (`db`) and Auth (`auth`) exports
- `contexts/AuthContext.tsx` — Firebase Auth login (signInWithEmailAndPassword)
- `contexts/DataContext.tsx` — Firestore listeners + CRUD only (~280 lines)
- `contexts/ThemeContext.tsx` — dark/light theme
- `constants/defaults.ts` — workflow steps, categories, checklist, BWOF message
- `constants/defaultTemplates.ts` — all HTML document templates (NOI, response forms, s146, s147, CPL)
- `utils/generateReminders.ts` — reminder generation logic
- `types.ts` — all TypeScript interfaces (BodyCorporate, Meeting, User, etc.)
- `services/geminiService.ts` — Gemini AI integration

## Pages
Dashboard, ComplexList, ContractorList, Financials, Reports, DocumentGenerator, DisclosureGenerator, AdminPanel, Login

## Environment Variables
- `GEMINI_API_KEY` must be in `.env.local` — never commit this file
- Firebase config is in `firebase.ts` (project: `property-101-internal-portal`)

## Local Development
- `node_modules` IS installed locally (npm install was run 2026-05-24)
- **npm install requires SSL workaround on this machine:** `$env:NODE_OPTIONS="--use-system-ca"; npm install`
- TypeScript check: `npx tsc --noEmit`

## Deployment
- Source code: https://github.com/garycheung007/Property-101-Internal-Webportal
- Live site: https://property-101-internal-portal.web.app (Firebase Hosting)
- Auto-deploys via GitHub Actions on every push to `main` (.github/workflows/deploy.yml)
- Build command: `npm run build` → outputs to `dist/`
- GitHub secrets required: `FIREBASE_TOKEN`, `GEMINI_API_KEY`

## Authentication
- Uses Firebase Auth `signInWithEmailAndPassword`
- Username input is mapped to email: `username@prop101.co.nz` (or full email accepted)
- After login, user profile (name, role, title) is fetched from Firestore `users` collection
- Roles: `admin`, `account_manager`, `support`
- **Action needed:** Users must be manually created in Firebase Authentication console (Authentication → Users → Add user):
  - `admin@prop101.co.nz`
  - `kareen@prop101.co.nz`
  - `celia@prop101.co.nz`

## app.py
Leftover from Google AI Studio scaffolding. Not used in production. Ignore it.

## Known Issues / Tech Debt
- `BodyCorporate` type has duplicate fields (`insuranceValuer` vs `lastInsuranceValuer`) — needs cleanup
