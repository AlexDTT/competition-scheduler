# Roundhouse

A browser-local six-team competition planner built with Vite and vanilla JavaScript.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
cd /home/alexdtt/competition-scheduler
npm install
npm run dev
```

Open http://localhost:5173. To build production assets, run `npm run build`; `npm run preview` serves the production build at http://localhost:4173.

## Data storage

The app saves a JSON object in browser `localStorage` under `roundhouse-v1`. It contains six team records (stable ID, name, latitude, longitude), a six-by-five availability matrix, and the makeup-resolution and travel-optimization settings. Fixtures and travel results are recalculated from this state rather than stored separately.

Data persists across reloads on the same browser origin. It is not synchronized between browsers or devices. Different ports, including Vite development and preview, have separate storage; data from the standalone file is also separate. Clearing browser storage removes saved data. If storage is unavailable, the app continues for the session and displays that status.

The optional self-contained HTML demo remains available: run `npm run build:standalone`, then open `standalone.html` directly in a browser.

## Demo

Click **Run demo** and confirm replacing saved edits. Advance through four steps: rename Atlas, mark it unavailable for round 2, move its match into a makeup round, and optimize travel. Closing the demo leaves the demonstrated state available to explore. Reset restores defaults after confirmation.

## Scheduling choices

The circle method creates all 15 unique pairings in five rounds. Stable numeric team IDs ensure renaming does not change pairings. Marking either participant unavailable counts one conflicting match, even if both participants are unavailable. Makeup resolution moves affected matches without changing pairings or home/away assignments. Exact backtracking finds the minimum number of makeup rounds, with at most one match per team per round. Makeup rounds assume everyone is available; clearing original-round unavailability restores the original fixture.

Home/away assignments enumerate all 32,768 possibilities and keep only assignments with two or three home games per team. Under symmetric venue-to-venue round trips, total distance is fixed regardless of home/away direction. Therefore travel optimization minimizes the largest per-team distance rather than claiming total-distance savings. Haversine distances are straight-line estimates, not road mileage. Editing coordinates automatically recalculates an optimized assignment if optimization was enabled. Invalid coordinates suspend travel estimates; fixtures remain available.

No account, hosting, external API, or database is used. Google Fonts is optional; system fonts are the fallback.

## Verify

```sh
npm test
```
