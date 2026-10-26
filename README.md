# HackSaath — Smart Hackathon Team Formation & Campus Project Platform

**HackSaath** is a full-stack student collaboration platform designed for college students and hackathon builders across campuses in India. It enables students to discover compatible teammates, validate institutional eligibility rules (e.g. Smart India Hackathon single-institution mandates and gender diversity requirements), manage team workspaces, request mentor support, and exchange skills.

---

## 1. Architectural Overview

The project is built as a unified full-stack application:

- **Frontend**: Single Page Application built with React 19, Vite, Tailwind CSS v4, Lucide icons, and React Router v7.
- **Backend**: Node.js & Express REST API with modular routers, Zod schema validation, and JWT-based session security.
- **Database Layer**: Dual-mode data persistence:
  - **In-Memory Store (Zero-Config Default)**: Pre-seeded with collegiate institutions, student builder profiles, hackathons (SIH 2026, Technovanza, CleanTech), and mentor rosters.
  - **Supabase / PostgreSQL**: Optional production database with Row-Level Security (RLS) policies defined in `backend/db/schema.sql`.
- **Real-Time Communication**: Server-Sent Events (SSE) stream for live notifications (`/api/notifications/stream`) and periodic sync hooks.

---

## 2. Repository Layout

```text
├── backend/
│   ├── api/
│   │   └── index.js             # Vercel serverless entrypoint
│   ├── db/
│   │   ├── index.js             # Unified DB abstraction layer
│   │   ├── memory.js            # In-memory store & seed datasets
│   │   ├── schema.sql           # PostgreSQL & Supabase DDL schema
│   │   └── supabase.js          # Supabase client integration
│   ├── src/
│   │   ├── app.js               # Express application builder
│   │   ├── config/              # Environment config & validation
│   │   ├── middleware/          # Auth, error handling, rate limiting
│   │   ├── modules/             # Modular feature controllers
│   │   │   ├── admin/           # Platform moderation & reports
│   │   │   ├── auth/            # OTP, registration, login, JWT
│   │   │   ├── bids/            # Task bids and milestone proposals
│   │   │   ├── colleges/        # Authorized domains and requests
│   │   │   ├── dashboard/       # Activity feeds & metrics
│   │   │   ├── exchanges/       # Two-way skill swap matching
│   │   │   ├── hackathons/      # Eligibility validation & events
│   │   │   ├── listings/        # Project & team postings
│   │   │   ├── mentors/         # Advisory booking & session notes
│   │   │   ├── messages/        # Workspace communications
│   │   │   ├── notifications/   # In-app alerts & SSE streaming
│   │   │   ├── reports/         # Trust & safety reporting
│   │   │   ├── reviews/         # Student peer ratings
│   │   │   ├── search/          # Typo-tolerant global search
│   │   │   ├── support/         # Ticketing & campus desk
│   │   │   ├── teams/           # Squad discovery, readiness & merges
│   │   │   └── users/           # Profile setup, avatars & portfolios
│   │   ├── services/            # Matching & scoring algorithms
│   │   └── utils/               # Error classes, async handlers, email
├── public/
│   └── assets/                  # Brand assets (HackSaath logo & symbols)
├── src/
│   ├── components/              # Modular UI components & modals
│   ├── context/                 # AuthContext & global state
│   ├── hooks/                   # Custom hooks (e.g. useLiveRefresh)
│   ├── lib/                     # API client utilities (api.js)
│   ├── pages/                   # Application views (Home, Teams, Events...)
│   ├── utils/                   # Image compression, fuzzy search
│   ├── App.jsx                  # Main routing tree
│   ├── main.jsx                 # Client entry point
│   └── index.css                # Tailwind CSS imports
├── .env.example                 # Environment configuration template
├── package.json                 # Project dependencies and npm scripts
├── server.ts                    # Development & production server runner
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite configuration
```

---

## 3. Implemented Features vs Roadmap

### Implemented & Fully Operational
- **Smart Team Finder**:
  - Dual discovery modes: **Same College** (filtered by collegiate institution) and **Cross-College** (inter-collegiate discovery).
  - Multi-dimensional filtering by technical skills, graduation year, availability tier, and target hackathon role.
  - Deterministic role-gap identification and team readiness scoring (0–100%).
- **Hackathon Events & Eligibility Validation**:
  - Pre-loaded national and collegiate events (e.g. Smart India Hackathon 2026, Technovanza v8, CleanTech Global).
  - Automated rules engine enforcing team size bounds, cross-college allowance policies, and mandatory gender diversity requirements.
- **Mentor Advisory Network**:
  - Directory of verified professors, industry engineers, and alumni advisors.
  - Session request workflow with goal descriptions and post-session notes.
- **Projects & Opportunities**:
  - Multi-mode listings: Team Formation, Skill Barter/Exchange, and Campus Freelance Tasks.
  - Full application workflow, bid proposal modal, and collaborative workspaces.
- **Authentication & Trust**:
  - Student registration with email OTP verification.
  - Verified student profile setup with GitHub, portfolio links, academic year, and showcased projects.
  - Campus moderation desk, support ticketing, and peer review trust rating.
- **Responsive Navigation**:
  - Desktop top navigation bar with search, notification count, and user dropdown.
  - Mobile compact top bar and accessible slide-out navigation drawer with keyboard (`Escape`) accessibility and body scroll locking.
  - Bottom navigation dock for one-tap mobile screen transitions.

### Planned Roadmap
- Push notifications via Web Push API.
- Direct code repository syncing with GitHub API.
- Calendar integration for mentor office hours.

---

## 4. Environment Variables & Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port for the Express server | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | Cryptographically random string |
| `SUPABASE_URL` | *(Optional)* Supabase instance URL | If omitted, in-memory store is used |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Optional)* Supabase service role secret | Server-side only (never exposed) |
| `SMTP_HOST` | *(Optional)* SMTP mail host for real OTPs | If omitted, OTPs log to console |
| `SMTP_PORT` | *(Optional)* SMTP port | `587` |
| `SMTP_USER` | *(Optional)* SMTP username | Empty |
| `SMTP_PASS` | *(Optional)* SMTP password / app password | Empty |
| `SMTP_FROM` | Mail sender header | `"HackSaath <no-reply@hacksaath.in>"` |
| `VITE_API_URL` | Custom API base URL (for separate hosting) | Blank (uses relative `/api`) |

---

## 5. Development & Production Run Instructions

### Prerequisites
- Node.js `>= 18.17.0` (or Node.js 20 / 22 LTS)
- npm or bun

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
The development server boots Express with Vite middlewares mounted on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check & Linting
Verify code integrity and TypeScript types without emitting artifacts:
```bash
npm run lint
```

### Production Build
Compile client assets into the `dist/` directory:
```bash
npm run build
```

### Run in Production Mode
Start the production server serving optimized static bundles and API endpoints:
```bash
npm start
```

---

## 6. Core API Reference

All protected routes accept a bearer token via the `Authorization: Bearer <JWT>` header.

### Authentication (`/api/auth`)
- `POST /api/auth/request-otp` — Request 6-digit email verification code.
- `POST /api/auth/login` — Login with student email and password.
- `POST /api/auth/register` — Register student account with verified OTP code.
- `GET /api/auth/me` — Retrieve current authenticated session and profile.

### Team Matching & Squads (`/api/teams`)
- `GET /api/teams/candidates?mode=same_college|cross_college&skills=...` — Discover student candidates.
- `GET /api/teams/:listingId/readiness` — Calculate team readiness score & missing skill gaps.
- `GET /api/teams/:listingId/recommendations` — Fetch recommended student profiles for open gaps.
- `POST /api/teams/:listingId/invite` — Send a direct squad invitation to a student.
- `POST /api/teams/:listingId/apply` — Apply to join a team listing.
- `POST /api/teams/invitations/:id/respond` — Accept or decline a received invitation.

### Hackathons (`/api/hackathons`)
- `GET /api/hackathons` — List upcoming hackathon challenges.
- `GET /api/hackathons/:id` — Get problem statements and official competition mandates.
- `POST /api/hackathons/:id/validate-eligibility` — Run automated validation check on a team squad.

### Mentors (`/api/mentors`)
- `GET /api/mentors` — List verified mentors and faculty advisors.
- `POST /api/mentors/request` — Submit advisory session request.
- `GET /api/mentors/requests` — View student's advisory requests.
- `PATCH /api/mentors/requests/:id/notes` — Save session notes and outcomes.

### Listings & Projects (`/api/listings`)
- `GET /api/listings?mode=team|freelance|exchange` — Filter campus listings.
- `POST /api/listings` — Create new project, hackathon team, or task.
- `GET /api/listings/:id` — Detailed listing data with applications and settlement info.
- `PATCH /api/listings/:id/status` — Update lifecycle status (`open`, `in_progress`, `completed`).

### Support & Moderation (`/api/support`, `/api/admin`)
- `POST /api/support/tickets` — Submit student support ticket with optional attachment.
- `GET /api/support/tickets/mine` — Retrieve submitted tickets and threaded responses.
- `POST /api/reports` — Submit peer misconduct or dispute report.

---

## 7. Security Best Practices

- **Zero Client Secret Exposure**: Secrets (`JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PASS`) are strictly backend-confined and never prefixed with `VITE_`.
- **Sanitized Error Messaging**: The frontend API utility cleans up raw stack traces and gateway errors into actionable user notices.
- **Safe Fallbacks**: Zero-dependency memory store boots seamlessly without external credentials, facilitating immediate local verification.
