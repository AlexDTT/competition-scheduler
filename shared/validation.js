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
  return {teams, unavailable: value.unavailable.map(row => [...row]), resolve: value.resolve, optimized: value.optimized};
}
