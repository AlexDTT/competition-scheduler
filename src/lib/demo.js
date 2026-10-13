import {defaults} from '../../shared/competition.js';
export const demoSteps = [
  ['Meet the lineup', 'Atlas becomes Atlas United. Stable team IDs keep every pairing intact.'],
  ['Spot the conflict', 'Atlas United is unavailable in round 2. One affected match is highlighted and counted.'],
  ['Make room to play', 'The affected match moves to Makeup 1. All 15 pairings remain, with no team double-booked.'],
  ['Balance the journey', 'Search all balanced home/away assignments to minimize the most-traveled team’s distance.'],
];
export function demoState(step) {
  const state = defaults(); state.teams[0].name = 'Atlas United';
  if (step >= 1) state.unavailable[0][1] = true;
  if (step >= 2) state.resolve = true;
  if (step >= 3) state.optimized = true;
  return state;
}
