import {defaultRoundDates, restViolations} from './calendar.js';
import {defaults, fixtures, orientations, schedule, validCoordinates} from './competition.js';

export function validateState(value) {
  if (!value || typeof value !== 'object') throw new Error('Competition state must be an object.');
  if (!Array.isArray(value.teams) || value.teams.length !== 6) throw new Error('Exactly six teams are required.');
  const teams = value.teams.map((team, id) => {
    if (!team || team.id !== id || typeof team.name !== 'string' || !team.name.trim() || team.name.length > 40) {
      throw new Error('Teams need stable IDs and names of 1–40 characters.');
    }
    for (const field of ['lat', 'lon']) {
      // Preserve incomplete coordinate edits; optimization checks geographic ranges separately.
      if (team[field] !== null && !Number.isFinite(team[field])) throw new Error('Coordinates must be finite numbers or null.');
    }
    return {id, name: team.name.trim(), lat: team.lat, lon: team.lon};
  });
  if (!Array.isArray(value.unavailable) || value.unavailable.length !== 6 ||
      value.unavailable.some(row => !Array.isArray(row) || row.length !== 5 || row.some(cell => typeof cell !== 'boolean'))) {
    throw new Error('Availability must be a six-by-five boolean matrix.');
  }
  if (typeof value.resolve !== 'boolean' || typeof value.optimized !== 'boolean') throw new Error('Settings must be booleans.');
  // Older saved competitions acquire dates without losing teams or availability.
  const dates = value.roundDates === undefined ? defaultRoundDates() : value.roundDates;
  const validDate = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(date) && Number.isFinite(Date.parse(date));
  if (!Array.isArray(dates) || dates.length !== 5 || !dates.every(validDate)) throw new Error('Five valid round kickoff dates are required.');
  const parseOverrides = overrides => {
    if (overrides === undefined) return {};
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Match dates must be an object.');
    const result = {};
    for (const [id, kickoff] of Object.entries(overrides)) {
      if (!/^(?:[0-9]|1[0-4])$/.test(id) || !validDate(kickoff)) throw new Error('Match dates need valid match IDs and kickoff dates.');
      result[id] = new Date(kickoff).toISOString();
    }
    return result;
  };
  const results = {};
  if (value.results !== undefined) {
    if (!value.results || typeof value.results !== 'object' || Array.isArray(value.results)) throw new Error('Results must be an object.');
    const matches = fixtures();
    for (const [id, result] of Object.entries(value.results)) {
      const match = matches[Number(id)];
      if (!/^(?:[0-9]|1[0-4])$/.test(id) || !result ||
          ![match.a, match.b].includes(result.homeTeam) || ![match.a, match.b].includes(result.awayTeam) || result.homeTeam === result.awayTeam) {
        throw new Error('Results must identify the actual home and away teams for a valid match.');
      }
      if (![result.homeScore, result.awayScore].every(score => Number.isInteger(score) && score >= 0 && score <= 999)) {
        throw new Error('Both scores must be whole numbers from 0 to 999.');
      }
      results[id] = {homeTeam: result.homeTeam, awayTeam: result.awayTeam, homeScore: result.homeScore, awayScore: result.awayScore};
    }
  }
  const state = {
    teams, results, unavailable: value.unavailable.map(row => [...row]), resolve: value.resolve, optimized: value.optimized,
    roundDates: dates.map(date => new Date(date).toISOString()),
    matchDates: parseOverrides(value.matchDates), makeupDates: parseOverrides(value.makeupDates),
  };
  if (Object.keys(results).length && !orientations(validCoordinates(teams) ? teams : defaults().teams, results).baseline) {
    throw new Error('Recorded home/away assignments must allow two or three home games per team.');
  }
  const violation = restViolations(schedule(state, {mask: 0}).matches)[0];
  if (violation) {
    const team = teams[violation.team].name;
    throw new Error(`${team} has only ${violation.hours.toFixed(1)} hours between matches ${violation.previous + 1} and ${violation.next + 1}. Postponed games need at least 72 hours before and after; simultaneous games are not allowed.`);
  }
  return state;
}
