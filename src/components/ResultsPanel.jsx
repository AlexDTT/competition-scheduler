import {useEffect, useMemo, useState} from 'react';
import {Panel, SectionHeading} from './ui.jsx';
import {standings} from '../../shared/results.js';
import {displayKickoff} from '../../shared/calendar.js';

function ScoreEditor({match, teams, result, onSave}) {
  const [homeScore, setHomeScore] = useState(result?.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(result?.awayScore ?? '');
  const [error, setError] = useState('');
  useEffect(() => {setHomeScore(result?.homeScore ?? ''); setAwayScore(result?.awayScore ?? ''); setError('');}, [result]);
  const valid = value => value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 999;
  const save = async event => {
    event.preventDefault();
    if (!valid(homeScore) || !valid(awayScore)) {setError('Enter both scores as whole numbers from 0 to 999.'); return;}
    setError('');
    await onSave(match, {homeScore: Number(homeScore), awayScore: Number(awayScore)});
  };
  return <form onSubmit={save} className="rounded-lg border border-line p-3"><div className="mb-2 flex justify-between text-[9px] text-muted"><span>MATCH {match.id + 1} · {match.makeup ? 'MAKEUP' : `ROUND ${match.round + 1}`}</span><span>{result ? 'RESULT SAVED' : 'NOT PLAYED'}</span></div><p className="mb-3 text-[10px] text-muted">{displayKickoff(match.kickoff)} · Lisbon</p><div className="grid grid-cols-[1fr_48px_16px_48px_1fr] items-center gap-2 text-xs"><label className="min-w-0 wrap-anywhere">{teams[match.home].name}<span className="mt-1 block text-[9px] text-muted">HOME</span></label><input className="w-full rounded border border-line p-2 text-center" aria-label={`${teams[match.home].name} home score, match ${match.id + 1}`} type="number" min="0" max="999" step="1" value={homeScore} onChange={event => setHomeScore(event.target.value)}/><span className="text-center text-muted">–</span><input className="w-full rounded border border-line p-2 text-center" aria-label={`${teams[match.away].name} away score, match ${match.id + 1}`} type="number" min="0" max="999" step="1" value={awayScore} onChange={event => setAwayScore(event.target.value)}/><label className="min-w-0 text-right wrap-anywhere">{teams[match.away].name}<span className="mt-1 block text-[9px] text-muted">AWAY</span></label></div>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}<div className="mt-3 flex justify-end gap-3">{result && <button type="button" className="text-[11px] text-red-700" onClick={() => {if (window.confirm('Clear this match result?')) onSave(match, null);}}>Clear result</button>}<button className="button-secondary" type="submit">{result ? 'Update result' : 'Save result'}</button></div></form>;
}
export function ResultsPanel({state, matches, onSaveResult}) {
  const rows = useMemo(() => standings(state.teams, state.results), [state.teams, state.results]);
  const [showGames, setShowGames] = useState(false);
  return <Panel><SectionHeading number="06 / THE RESULTS" title="Scores & standings"><span className="text-[10px] text-muted">{Object.keys(state.results).length} / 15 played</span></SectionHeading><p className="description">Win: 3 points · Draw: 1 point · Loss: 0 points. Ties use goal difference, then goals scored. Equal teams retain their original order.</p><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>{['Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts', 'H/A played'].map(label => <th key={label} scope="col" className={label === 'Team' ? 'text-left' : ''}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}><td className="min-w-32 wrap-anywhere">{index + 1}. {row.name}</td>{[row.played, row.won, row.drawn, row.lost, row.goalsFor, row.goalsAgainst, row.goalsFor - row.goalsAgainst, row.points, `${row.homePlayed}/${row.awayPlayed}`].map((value, column) => <td className={`text-center ${column === 7 ? 'font-bold text-green-800' : ''}`} key={column}>{value}</td>)}</tr>)}</tbody></table></div><button className="button-secondary mt-4" aria-expanded={showGames} onClick={() => setShowGames(!showGames)}>{showGames ? 'Hide score entry' : 'Enter match results'}</button>{showGames && <div className="mt-4 grid gap-3 xl:grid-cols-2">{matches.map(match => <ScoreEditor key={match.id} match={match} teams={state.teams} result={state.results[match.id]} onSave={onSaveResult}/>)}</div>}</Panel>;
}
