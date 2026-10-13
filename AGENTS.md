# Agent guide

## Project brief and acceptance criteria

Build a web app for a six-team competition using an AI coding agent.

- Provide six teams with editable names.
- Generate five rounds and 15 matches: three matches per round, with no repeated pairings.
- Each team plays exactly once per original round.
- Allow a team to be marked unavailable for a selected round.
- Highlight affected matches and display a conflict count.
- Demo the app and explain one technical choice.
- Bonus: include travel optimization and home/away balance.
- Use Vite, React, and Tailwind CSS with a JavaScript backend.
- Persist competition data in a server-side JSON file; connect the frontend and backend using JavaScript fetch requests.
- Give matches real kickoff dates and times, and use FullCalendar with month, week, and day views.
- Label unavailable original slots explicitly in the calendar, including after makeup resolution.
- Record home and away scores and calculate standings using 3 points for a win, 1 for a draw, and 0 for a loss.
- Postponed games must leave at least 72 hours between kickoffs before and after each participant's other games.

Optional makeup resolution can extend the competition beyond five rounds; the five-round requirements describe the base schedule. Default original rounds start next Saturday at 15:00 Lisbon time and recur weekly.

## Stack and commands

The frontend uses Vite, React ES modules, Tailwind's Vite plugin, and FullCalendar's React adapter with the Luxon timezone plugin. The backend uses Node.js and Express. Preserve the visual design and keep changes focused on the requested behavior.

- Node.js requirement: `^20.19.0 || >=22.12.0`.
- Install dependencies: `npm ci`.
- Development: `npm run dev` starts both API and frontend; open `http://localhost:5173`.
- Individual services: `npm run dev:server` and `npm run dev:client`.
- Build: `npm run build`, output in `dist/`.
- Production: `npm start` serves the compiled frontend and API at `http://localhost:3001`.
- Preview: `npm run preview` starts API plus Vite preview at `http://localhost:4173`.
- Automated checks: `npm test`.

Do not edit generated files in `node_modules/` or `dist/`. Keep `package-lock.json` aligned with dependency changes. If the environment blocks network access or listening sockets, report the limitation accurately; do not claim the app was previewed.

## Source organization

- `src/components/`: React UI panels and controls. Use Tailwind utilities and shared UI elements.
- `src/hooks/`: loading, persistence status, and state coordination.
- `src/services/`: JavaScript API connections. Centralize fetch and error handling here.
- `src/lib/`: demo behavior and display helpers.
- `src/App.jsx` and `src/main.jsx`: application orchestration and React entry point.
- `src/styles.css`: Tailwind theme and reusable style rules.
- `server/app.js`: Express routes and static serving.
- `server/store.js`: JSON persistence, atomic writes, validation, and revision checks.
- `server/index.js`: server startup.
- `shared/`: pure scheduling, calendar, and validation logic, reusable by client and server.
- `tests/`: scheduling, calendar, client API, and file-store checks.

Keep domain logic independent of React, the DOM, and storage. Keep filesystem operations in the backend and HTTP calls in frontend services. Update the README when commands, the API, or user-visible behavior change. The old browser-only and standalone implementation has been replaced.

## Persistence and API

`data/competition.json` is the source of truth. It is initialized if missing and ignored by Git. `COMPETITION_DATA_FILE` can override its path. The backend owns one shared competition and runs as one process.

The record contains `schemaVersion`, `revision`, and `state`. State contains six stable-ID teams, a six-by-five unavailability matrix, makeup and optimization settings, five round dates, original/makeup match-date overrides, and match results with home/away team IDs and scores. Derive fixtures and travel estimates rather than persisting duplicate results.

- `GET /api/competition`: return the current record.
- `PUT /api/competition`: accept `{state, revision}`, validate, and return the saved record.
- Reject malformed state with HTTP 400 and stale revisions with HTTP 409.
- Serialize writes and replace files atomically. Never silently overwrite corrupt existing data with defaults.
- Show successful save status only after the API confirms the write. Preserve error messages and require reload after stale-write conflicts.
- Keep runtime data outside the frontend bundle and inaccessible through Vite's static file serving.

Browser localStorage is used only to detect legacy `roundhouse-v1` data for an explicit, confirmed import. Preserve compatible existing JSON records; missing date fields are migrated to the default weekly schedule. Do not silently overwrite server data with browser data.

## Scheduling and dates

- The base competition has six teams, five rounds, and 15 unique pairings.
- Each original round has three matches and each team appears once.
- Editing names must not change pairings, IDs, or availability.
- Count affected matches once even when both participants are unavailable.
- Makeup resolution preserves pairings and home/away assignments, and finds the fewest extra rounds without double-booking a team.
- Makeup rounds assume participants are available; clearing original unavailability restores the original fixture and its original date.
- Store kickoff dates as UTC ISO strings; render inputs and calendar dates in `Europe/Lisbon`.
- Generate weekly original dates at the same Lisbon wall-clock time across daylight saving changes.
- Automatic makeups follow the last original kickoff by at least 72 hours, with 72-hour spacing between makeup rounds.
- Check rest before and after every postponed game for both teams. Enforce this on the backend as well as the frontend.
- Reject simultaneous games for the same team and invalid/nonexistent date inputs.
- Preserve Unavailable calendar markers at the original kickoff after a game moves to a makeup round.
- Calendar drag/drop and kickoff inputs must use the same validation and persistence path; revert failed drag changes.
- Changing the start regenerates weekly dates and clears per-match overrides; confirm before discarding overrides.

## Travel optimization

Every team receives two or three home games; display the counts in a dedicated Home & Away panel. Search all 32,768 home/away assignments and minimize the maximum per-team travel distance among balanced assignments. Preserve home/away assignments for matches with saved results.

Venue inputs are finite latitude/longitude values or null for incomplete edits. Invalid geographic values suspend travel estimates and optimization without blocking other edits. Haversine distances represent estimated straight-line round trips. Total distance is invariant under home/away reversal; do not claim reduced total distance.

## Results and standings

Store result scores with stable match IDs and the actual home/away team IDs. Both scores must be whole numbers from 0 to 999. Derive standings from results; do not persist duplicate standings data.

Award 3 points for a win, 1 for a draw, and 0 for a loss. Rank by points, goal difference, goals scored, then stable team order. Display actual home/away games played separately from scheduled home/away balance. Clearing a result removes its contribution and unlocks the match orientation. Confirm before clearing a result.

## User experience and validation

Use React's text rendering for editable names; do not introduce raw HTML injection. Preserve keyboard access, visible focus, meaningful labels, and textual conflict reasons. Do not rely on color alone to convey conflicts.

Reset, legacy import, and demo actions replace server data and require confirmation. The demo demonstrates renaming, a round-two conflict, makeup resolution, and travel optimization.

Use existing checks when verification is requested or required. Add tests only when requested or needed for meaningful behavior. For changes to scheduling, persistence, or dates, cover the relevant invariants and failure cases. Browser checks should cover edits, conflict counts, makeup restoration, the calendar, invalid coordinates, persistence, and narrow layouts. Report automated and visual verification separately.
