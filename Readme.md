# Olava Front end

The website for **Olava Invites**: the marketing pages, the couple's dashboard, private previews, and the public wedding websites with RSVP. It is built with Next.js 16 (App Router), React 19, Tailwind CSS 4 and TypeScript. All data comes from the Olava .NET API in the sibling repository `Olava-back-end`.

| Document | For |
|---|---|
| **This file** | Getting both apps running on Windows |
| [`Readme01.md`](Readme01.md) | Developer reference: architecture, scripts, configuration, tests, deployment notes |
| [`readmedoc.md`](readmedoc.md) | Beginner's guided tour of the code, file by file |
| [`docs/phase1-checklist.md`](docs/phase1-checklist.md) | Phase 1 requirement status and evidence (continue from here in a new chat) |
| [`AGENTS.md`](AGENTS.md) | Rules for contributors and AI agents |
| `../Olava-back-end/Readme.md` | API setup, secrets, Razorpay sandbox, backup/restore |

## Quick start (Windows, PowerShell)

You need the Node.js LTS release (22 or newer; 26 works), npm, the .NET 10 SDK and PostgreSQL. Docker is not needed.

**1. Start the API** (first time: follow steps 1–3 of `..\Olava-back-end\Readme.md` to create the database and set secrets):

```powershell
cd C:\Projects\Olava\Olava-back-end\src\Olava.Api
dotnet run --launch-profile http          # → http://localhost:5033  (leave this window open)
```

**2. Start the website** (in a second window):

```powershell
cd C:\Projects\Olava\Olava-front-end
npm install                               # first time, or after package.json changes
Copy-Item .env.example .env.local         # first time; defaults point at http://localhost:5033
npm run dev                               # → http://localhost:3000
```

**3. Try it.**

- Open http://localhost:3000.
- Choose **Start designing**, register, and create a wedding.
- Add the date and an event, design the site, and preview it.
- Paying needs Razorpay **test** keys in the API (see the backend Readme, §1 and §4). Without them the Publish page tells you payments aren't configured.

Emails (confirmation, password reset) aren't sent yet. Their links are printed in the API window.

## Everyday commands

```powershell
npm run dev          # development server with hot reload
npm run lint         # ESLint
npm run typecheck    # generates route types, then tsc
npm test             # unit + component tests (Vitest)
npm run build        # production build (also type-checks)
npm start            # serve the production build on :3000
npm run test:e2e     # browser journey tests: see Readme01.md → End-to-end tests
```
