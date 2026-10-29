# React + Vite

## Football data sources

Highlightly is used for live scores, today's fixtures, and match details when
`HIGHLIGHTLY_API_KEY` is set in the backend environment. Its key stays on the
server and is never sent to the browser. API-Football remains a fallback for
match data and is still used by existing player and team endpoints when its key
is configured. League tables use football-data.org for the competitions
covered by its free plan. Add your football-data.org token as
`FOOTBALL_DATA_TOKEN` in
`server/.env` (see `server/.env.example`). The backend refreshes each supported
table on the first request of each day in India time and saves the last
successful table in `server/data/standings-cache.json` for use during outages.

The free standings feed currently covers the Premier League, La Liga,
Bundesliga, Serie A, Ligue 1, Champions League, World Cup, and European
Championship. UEFA Nations League standings are a dated snapshot transcribed
from UEFA.com for the 2026/27 season (as of 2026-10-21); the table shows that
snapshot date and must be refreshed when new matchdays are played. MLS
standings come from the official MLS stats endpoint. Saudi Pro League
standings are calculated from completed fixtures in the league's official
fantasy data feed and refreshed daily. Copa América has no active 2026 edition,
so the dashboard reports that no current table exists instead of reusing 2024
data.

The overview and Match Centre default to all competitions, showing live matches
first and today's fixtures when no games are live. Match Centre also offers
live matches and today's fixtures. Selecting a match from the overview opens its details in
Match Centre.

The Match Centre's **Next day** view reads a scheduled snapshot for tomorrow's
fixtures. The GitHub Actions workflow `.github/workflows/refresh-next-day-fixtures.yml`
runs at 1:00 p.m. India time. It fetches all available pages from the configured
match provider, saves progress and the completed snapshot in MongoDB, and lets
the Match Centre filter that saved list without requesting fixtures again. When
Highlightly pagination is needed, scheduled page requests are spaced at least 13
seconds apart (at most five requests in a rolling minute); a rate-limit response is retried
after the provider's retry delay or one minute.

To enable the scheduled workflow, set `SCHEDULE_SECRET` in the backend's
environment, and add repository Actions secrets `FAD_BACKEND_URL` (the backend
base URL) and `FAD_SCHEDULE_SECRET` (the same secret). The workflow can also be
run manually from GitHub Actions to preload the next-day snapshot immediately.
Competition standings are unchanged: they refresh on the first request of the
India-time day and then use the existing saved cache.

Player statistics are intentionally disconnected from API-Football for now and
will be added later from the curated player dataset.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
