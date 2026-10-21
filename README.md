# React + Vite

## Football data sources

API-Football remains the source for live scores, today's fixtures, and match
details. League tables use football-data.org for the competitions covered by
its free plan. Add your football-data.org token as `FOOTBALL_DATA_TOKEN` in
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
