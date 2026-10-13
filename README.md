# Roundhouse

A six-team competition planner using **Vite + React + Tailwind CSS + FullCalendar** and a **Node.js/Express JavaScript backend**. Competition data is saved in a JSON file on the server.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
cd /home/alexdtt/competition-scheduler
npm ci
npm run dev
```

Open **http://localhost:5173**. This command starts the API on port 3001 and the Vite frontend on port 5173. Vite proxies `/api` requests to the backend, so the frontend uses ordinary JavaScript `fetch` calls to the same origin.

For separate terminals, use `npm run dev:server` and `npm run dev:client`.

```sh
npm run build   # Compile the React frontend into dist/
npm start       # Serve both the compiled frontend and API on localhost:3001
npm run preview # Start the API and Vite's build preview on localhost:4173
npm test
```

The frontend needs the API running. The earlier standalone HTML version has been replaced by this full-stack app.

## Structure

```text
src/
  components/          React panels, calendar, and form controls
  hooks/               Server loading, save status, and revision management
  services/            JavaScript fetch client and legacy-data import
  lib/                 Demo states and display helpers
  App.jsx              Competition screen and actions
  main.jsx             React entry point
  styles.css           Tailwind imports, theme, and reusable styles
server/
  app.js               Express API routes and production static serving
  store.js             Validation, serialized writes, atomic JSON replacement
  index.js             Server startup and configuration
shared/
  competition.js       Pure round-robin, makeup, and travel algorithms
  calendar.js          Lisbon time conversion, kickoff dates, and rest checks
  validation.js        Shared state validation and legacy migration
data/competition.json Server-owned competition data (ignored by Git)
tests/                Scheduling, calendar, API-client, and file-storage tests
```

## File storage and API

The default file is `data/competition.json`, created automatically if missing. Override its location with `COMPETITION_DATA_FILE`; `PORT` changes the backend port (update the Vite proxy if using a different port in development).

The JSON document contains `schemaVersion`, `revision`, and `state`. State holds:

- Six teams: stable numeric `id`, editable `name`, `lat`, and `lon`.
- `unavailable`: a six-by-five boolean matrix.
- `resolve` and `optimized`: makeup and travel settings.
- `roundDates`: five ISO UTC kickoffs.
- `matchDates` and `makeupDates`: per-match kickoff overrides, keyed by stable match ID.
- `results`: home/away team IDs and scores, keyed by stable match ID.

Fixtures and travel estimates are derived from state. JavaScript connects the frontend and backend through:

| Request | Behavior |
| --- | --- |
| `GET /api/competition` | Load the current JSON record. |
| `PUT /api/competition` | Send `{state, revision}`; validate and save, returning the updated record. |

Names and venue changes save when the field loses focus; buttons save immediately. The UI displays “Saved to server” only after the API confirms the write. Write failures remain visible. A stale revision returns HTTP 409 and requires a reload, preventing one tab from silently overwriting another.

One backend process owns the shared competition file. Writes are serialized and use a temporary file followed by atomic rename. Invalid or corrupt existing files are reported instead of replaced with defaults. To edit the file manually, stop the backend first; restart after the edit.

`localStorage` is no longer the active data store. If valid `roundhouse-v1` data exists in the current browser origin, an explicit import action can copy it into the JSON file after confirmation. Data from another port or the old standalone file must be accessed from that original browser origin; the app cannot read it automatically. Existing JSON records without dates acquire the default weekly dates without losing team or availability edits.

## Dates, calendar, and postponement

Original rounds start **next Saturday at 15:00 Lisbon time**, one week apart. The first-round control regenerates weekly dates, and each fixture has an editable date/time. Dates are stored as UTC ISO strings; all inputs and calendar displays use `Europe/Lisbon`, including daylight saving changes.

FullCalendar provides month, week, and day views with Lisbon timezone support through its Luxon plugin. Click an event to edit kickoff, or drag a game to reschedule it. Failed edits are reverted and explained. Unavailable events are labeled **Unavailable**, not just colored red. When a game moves to a makeup date, its original slot remains labeled Unavailable and the makeup fixture appears at its new kickoff.

Marking either participant unavailable counts one conflicting match. Enabling makeup resolution moves affected matches into the minimum number of extra rounds without changing pairings. Automatic makeup rounds begin at least **72 hours after the last original kickoff**, with 72-hour spacing between makeup rounds. Both participants are assumed available in makeup rounds.

Manual date changes must leave **at least 72 hours between kickoffs before and after a postponed game for both teams**. The frontend explains invalid edits and the backend independently rejects them. Simultaneous games involving the same team are also rejected. Clearing unavailability restores the match and its original date. Changing the competition start clears individual date overrides after confirmation when needed.

## Home/away balance, scores, and standings

The **Home & Away** panel displays each team's two or three home games and remaining away games. This balances the scheduled venue advantage.

The **Scores & Standings** panel records a home score and away score for each match. Click **Enter match results**, fill in both scores, and save. Results are stored in the server JSON file. Standings show played, wins, draws, losses, goals for/against, goal difference, points, and actual home/away games played. Points are 3 for a win, 1 for a draw, and 0 for a loss; ties use goal difference, then goals scored, then stable team order.

Recorded results lock the match's home/away assignment during future optimization. Clearing a result removes its standings contribution and unlocks that assignment. Scores and fixtures remain linked by stable team and match IDs.

## Demo and technical choice

Click **Run demo** and confirm replacing the server's saved competition. Advance through four steps: rename Atlas, mark it unavailable for round 2, move its match into a makeup round, and optimize travel. Reset restores defaults after confirmation.

The **circle method** fixes one team and rotates the other five to produce three matches per round: 15 unique pairings in five rounds, with each team appearing once per original round. Stable team IDs keep fixtures intact when names change. Exact backtracking finds the minimum number of makeup rounds.

Travel optimization enumerates all **32,768** home/away assignments, preserves assignments for recorded results, and keeps only those giving each team two or three home games. It calculates estimated away-team round trips using the Haversine formula and selects the assignment with the smallest maximum team travel distance. Symmetric round trips leave total competition distance unchanged; optimization balances the burden rather than reducing the total. These are straight-line estimates, not road distances.

## Verification limits

`npm test` covers scheduling, rest windows, timezone conversion, file persistence, stale writes, corrupt files, API-client errors, demo states, unavailable calendar markers, scores, and standings. `npm run build` checks the React/Tailwind production bundle. A browser check is still needed for visual layout and end-to-end interaction when browser access is available.
