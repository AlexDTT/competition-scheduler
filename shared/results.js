export function standings(teams, results) {
  const rows = teams.map(team => ({id: team.id, name: team.name, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, homePlayed: 0, awayPlayed: 0}));
  for (const result of Object.values(results)) {
    const home = rows[result.homeTeam], away = rows[result.awayTeam];
    home.played++; away.played++; home.homePlayed++; away.awayPlayed++;
    home.goalsFor += result.homeScore; home.goalsAgainst += result.awayScore;
    away.goalsFor += result.awayScore; away.goalsAgainst += result.homeScore;
    if (result.homeScore > result.awayScore) {home.won++; home.points += 3; away.lost++;}
    else if (result.homeScore < result.awayScore) {away.won++; away.points += 3; home.lost++;}
    else {home.drawn++; away.drawn++; home.points++; away.points++;}
  }
  return rows.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.id - b.id);
}
