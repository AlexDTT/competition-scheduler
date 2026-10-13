export const TIME_ZONE = 'Europe/Lisbon';
export const REST_HOURS = 72;
export const REST_MS = REST_HOURS * 60 * 60 * 1000;

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export function toLocalInput(iso) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(iso)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function fromLocalInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Enter a complete date and time.');
  const target = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(target)) throw new Error('Enter a valid date and time.');
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const localGuess = Date.parse(`${toLocalInput(new Date(guess).toISOString())}:00Z`);
    guess += target - localGuess;
  }
  const result = new Date(guess).toISOString();
  if (toLocalInput(result) !== value) throw new Error('That time does not exist in Lisbon due to daylight saving. Choose another time.');
  return result;
}
export function weeklyRoundDates(firstKickoff) {
  const first = toLocalInput(firstKickoff);
  return Array.from({length: 5}, (_, index) => {
    const date = new Date(`${first.slice(0, 10)}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index * 7);
    return fromLocalInput(`${date.toISOString().slice(0, 10)}T${first.slice(11)}`);
  });
}
export function defaultRoundDates(now = new Date()) {
  const date = new Date(`${toLocalInput(now.toISOString()).slice(0, 10)}T12:00:00Z`);
  let days = (6 - date.getUTCDay() + 7) % 7;
  if (days === 0) days = 7;
  date.setUTCDate(date.getUTCDate() + days);
  return weeklyRoundDates(fromLocalInput(`${date.toISOString().slice(0, 10)}T15:00`));
}
export function withKickoffs(state, data) {
  const dates = state.roundDates || defaultRoundDates();
  const original = data.original.map(round => round.map(match => ({
    ...match, makeup: false, kickoff: state.matchDates?.[match.id] || dates[match.round],
  })));
  // Keep automatic makeups after the complete five-round window and every remaining original fixture.
  const lastOriginal = Math.max(...dates.map(Date.parse), ...original.flat().map(match => Date.parse(match.kickoff)));
  const makeup = data.makeup.map((round, index) => round.map(match => ({
    ...match, makeup: true,
    kickoff: state.makeupDates?.[match.id] || new Date(lastOriginal + (index + 1) * REST_MS).toISOString(),
  })));
  return {...data, original, makeup, matches: [...original.flat(), ...makeup.flat()].sort((a, b) => a.id - b.id)};
}
export function restViolations(matches) {
  const violations = [];
  for (let team = 0; team < 6; team++) {
    const games = matches.filter(match => match.a === team || match.b === team)
      .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
    for (let index = 1; index < games.length; index++) {
      const previous = games[index - 1], next = games[index];
      const gap = Date.parse(next.kickoff) - Date.parse(previous.kickoff);
      if (gap === 0 || ((previous.makeup || next.makeup) && gap < REST_MS)) {
        violations.push({team, previous: previous.id, next: next.id, hours: gap / 3600000});
      }
    }
  }
  return violations;
}
export function displayKickoff(iso) {
  return new Intl.DateTimeFormat('en-GB', {timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(iso));
}
