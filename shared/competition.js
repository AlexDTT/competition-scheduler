export function defaults() {
  const names = ['Atlas', 'Harbor', 'Summit', 'Comets', 'Forest', 'Phoenix'];
  return {
    teams: names.map((name, id) => ({id, name, lat: 38.7 + id * 0.27, lon: -9.2 + ((id * 3) % 5) * 0.34})),
    unavailable: Array.from({length: 6}, () => Array(5).fill(false)),
    resolve: false,
    optimized: false,
  };
}

export function fixtures() {
  let ring = [0, 1, 2, 3, 4, 5];
  const matches = [];
  for (let round = 0; round < 5; round++) {
    for (let index = 0; index < 3; index++) {
      matches.push({id: matches.length, round, a: ring[index], b: ring[5 - index]});
    }
    ring = [ring[0], ring[5], ...ring.slice(1, 5)];
  }
  return matches;
}

export function distance(a, b) {
  const radians = value => value * Math.PI / 180;
  const latitudeDelta = radians(b.lat - a.lat);
  const longitudeDelta = radians(b.lon - a.lon);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, haversine))));
}

export function validCoordinates(teams) {
  return teams.every(team => Number.isFinite(team.lat) && Number.isFinite(team.lon) &&
    Math.abs(team.lat) <= 90 && Math.abs(team.lon) <= 180);
}

// Fifteen match orientations produce only 2^15 candidates, so exact search is practical.
export function orientations(teams) {
  const matches = fixtures();
  const costs = matches.map(match => 2 * distance(teams[match.a], teams[match.b]));
  const total = costs.reduce((sum, cost) => sum + cost, 0);
  let baseline = null;
  let best = null;
  for (let mask = 0; mask < 32768; mask++) {
    const homeCounts = Array(6).fill(0);
    matches.forEach((match, index) => homeCounts[(mask >> index) & 1 ? match.b : match.a]++);
    if (homeCounts.some(count => count < 2 || count > 3)) continue;
    const travel = Array(6).fill(0);
    matches.forEach((match, index) => travel[(mask >> index) & 1 ? match.a : match.b] += costs[index]);
    // Total round-trip travel is symmetric. Minimize the largest team's burden instead.
    const candidate = {
      mask, homeCounts, awayCounts: homeCounts.map(count => 5 - count),
      travel, total, maximum: Math.max(...travel),
    };
    baseline ??= candidate;
    if (!best || candidate.maximum < best.maximum - 1e-9) best = candidate;
  }
  return {baseline, best};
}

export function makeupRounds(matches) {
  if (!matches.length) return [];
  const degree = Array(6).fill(0);
  matches.forEach(match => {degree[match.a]++; degree[match.b]++;});
  const sorted = [...matches].sort((a, b) =>
    (degree[b.a] + degree[b.b]) - (degree[a.a] + degree[a.b]) || a.id - b.id);
  const minimum = Math.max(...degree, Math.ceil(matches.length / 3));
  for (let count = minimum; count <= matches.length; count++) {
    const rounds = Array.from({length: count}, () => []);
    const used = Array(count).fill(0);
    function place(index) {
      if (index === sorted.length) return true;
      const match = sorted[index];
      const bits = (1 << match.a) | (1 << match.b);
      let triedEmpty = false;
      for (let round = 0; round < count; round++) {
        if (used[round] & bits) continue;
        // Empty rounds are interchangeable; avoid searching the same partition twice.
        if (!used[round]) {
          if (triedEmpty) continue;
          triedEmpty = true;
        }
        used[round] |= bits;
        rounds[round].push(match);
        if (place(index + 1)) return true;
        rounds[round].pop();
        used[round] ^= bits;
      }
      return false;
    }
    if (place(0)) return rounds.map(round => round.sort((a, b) => a.id - b.id));
  }
}

export function schedule(state, orientation) {
  const matches = fixtures().map(match => ({
    ...match,
    home: (orientation.mask >> match.id) & 1 ? match.b : match.a,
    away: (orientation.mask >> match.id) & 1 ? match.a : match.b,
    conflicts: [match.a, match.b].filter(team => state.unavailable[team][match.round]),
  }));
  const affected = matches.filter(match => match.conflicts.length);
  const original = Array.from({length: 5}, (_, round) => matches.filter(match =>
    match.round === round && (!state.resolve || !match.conflicts.length)));
  return {
    matches, original,
    makeup: state.resolve ? makeupRounds(affected) : [],
    affected: affected.length,
    unresolved: state.resolve ? 0 : affected.length,
    postponed: state.resolve ? affected.length : 0,
  };
}
