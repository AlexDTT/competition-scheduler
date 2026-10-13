import {fixtures} from '../../shared/competition.js';
export function calendarEvents(state, matches) {
  const events = matches.map(match => {
    const unavailable = !match.makeup && match.conflicts.length > 0;
    return {
      id: `match-${match.id}`,
      title: `${unavailable ? 'Unavailable · ' : match.makeup ? 'Makeup · ' : ''}${state.teams[match.home].name} vs ${state.teams[match.away].name}`,
      start: match.kickoff, allDay: false,
      backgroundColor: unavailable ? '#ad3e30' : match.makeup ? '#ad7028' : '#416c34',
      borderColor: unavailable ? '#ad3e30' : match.makeup ? '#ad7028' : '#416c34',
      extendedProps: {matchId: match.id, kind: 'match'},
    };
  });
  if (state.resolve) {
    for (const fixture of fixtures()) {
      const unavailable = [fixture.a, fixture.b].filter(team => state.unavailable[team][fixture.round]);
      if (!unavailable.length) continue;
      events.push({
        id: `unavailable-${fixture.id}`, title: `Unavailable · ${unavailable.map(id => state.teams[id].name).join(' & ')}`,
        start: state.matchDates[fixture.id] || state.roundDates[fixture.round], allDay: false,
        editable: false, backgroundColor: '#ad3e30', borderColor: '#ad3e30',
        extendedProps: {matchId: fixture.id, kind: 'unavailable', round: fixture.round, unavailable},
      });
    }
  }
  return events;
}
