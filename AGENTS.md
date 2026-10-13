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

The agreed implementation uses Vite. Optional makeup resolution may move affected matches into extra rounds; the five-round requirements describe the base schedule. The scheduling and travel rules below specify the agreed behavior in detail.

## Project

Roundhouse is a local six-team competition planner built with Vite and vanilla JavaScript ES modules. Keep changes focused on the requested behavior and follow the existing visual design. No backend, accounts, or database are currently required.

## Commands

- Node.js requirement: `^20.19.0 || >=22.12.0`.
- Install dependencies: `npm ci`.
- Development: `npm run dev` at `http://localhost:5173`.
- Production build: `npm run build`, output in `dist/`.
- Production preview: `npm run preview` at `http://localhost:4173`.
- Existing automated checks: `npm test`.
- Refresh the optional standalone demo: `npm run build:standalone`.

Do not edit `node_modules/` or `dist/`. Keep `package-lock.json` aligned with dependency changes. If the environment blocks network access or listening sockets, report the limitation accurately; do not claim the app was previewed.

## Source layout

- `index.html`: page structure and accessible controls.
- `style.css`: visual design and responsive layouts.
- `app.mjs`: rendering, event handlers, persistence, and the guided demo.
- `core.mjs`: pure scheduling, distance, and optimization functions.
- `core.test.mjs`: scheduling and optimization checks.
- `app.test.mjs`: UI handler checks using a simulated DOM; these do not verify browser rendering.
- `vite.config.mjs`: Vite configuration.
- `build-standalone.mjs`: generates `standalone.html` from the source files. Regenerate this artifact after changing its inputs; do not edit it directly.

Keep scheduling logic independent of the DOM and browser storage. Update the README when commands or user-visible behavior change.

## Data storage

The app saves JSON in browser `localStorage` under `roundhouse-v1`. State contains six teams with stable numeric IDs, names and venue coordinates, a six-by-five unavailability matrix, and `resolve` and `optimized` settings. Derive fixtures and travel estimates from state.

Preserve compatible saved data. Validate loaded state, handle unavailable storage gracefully, and explain any storage migration in changes that alter the state shape. Storage is specific to the browser origin: development, preview, and the standalone file do not share saved data.

## Scheduling rules

- The base competition has exactly six teams, five rounds, and 15 unique pairings.
- Each original round contains three matches, with each team appearing once.
- Use stable IDs for relationships; editing a name must not change pairings or availability.
- Count affected matches, not unavailable participants. Two unavailable teams in the same match produce one conflict.
- Makeup resolution may extend the competition beyond five rounds. Preserve all pairings, original-round labels, and home/away assignments.
- Find the minimum number of makeup rounds, with no team playing twice in a makeup round. Makeup rounds assume all teams are available.
- Clearing unavailability restores the corresponding original fixture when neither participant remains unavailable.

## Travel rules

- Every team receives two or three home games across its five matches.
- Venue inputs are finite latitude and longitude values within their geographic ranges. Invalid inputs suspend travel estimates and optimization without blocking fixture editing.
- Distances use the Haversine formula and represent estimated straight-line round trips, not road distances.
- Symmetric round trips make total travel invariant under home/away reversal. Minimize the largest individual team travel burden; do not claim reduced total distance.
- The exhaustive search covers all 32,768 home/away assignments and retains balanced assignments.

## User experience and validation

Escape editable names before inserting them into HTML. Preserve keyboard access, visible focus, meaningful labels, and textual conflict reasons. Do not rely on color alone to convey availability or conflicts.

Reset and demo actions replace saved edits and must retain their confirmation step. The guided demo demonstrates renaming, a round-two conflict, makeup resolution, and travel optimization.

Use the existing checks when verification is requested or required. Add tests only when requested or needed for a meaningful new behavior. For browser verification, cover name edits, availability toggles, conflict counts, makeup restoration, coordinate validation, persistence, and narrow layouts. Report automated and visual verification separately.
