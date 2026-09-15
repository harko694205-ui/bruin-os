# Bruin OS

A personal academic command center: classes, calendar, syllabus import, task
prioritization, focus timer, and quick links — all stored locally in your
browser (no backend, no account).

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Deploy to Vercel

**Option A — Vercel CLI**
```bash
npm install -g vercel
vercel
```
Follow the prompts (accept the auto-detected Vite settings). Framework
preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.

**Option B — GitHub + Vercel dashboard**
1. Push this folder to a new GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Vercel auto-detects Vite; leave defaults and click Deploy.

## Notes

- All data (classes, assignments, events, links, focus sessions, settings)
  lives in your browser's `localStorage` under the key `bruinos.v1`. Nothing
  is sent to a server. Clearing your browser storage clears the app's data.
- Set up your term dates from the Dashboard ("Set up term") to unlock the
  Quarter calendar view and let the syllabus importer resolve "Week N"
  references to real dates.
- Built with React + Vite, no backend required.
