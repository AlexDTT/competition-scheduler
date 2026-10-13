import {ResultsPanel} from './components/ResultsPanel.jsx';
import {HomeAwayPanel} from './components/HomeAwayPanel.jsx';
import {weeklyRoundDates} from '../shared/calendar.js';
import {validateState} from '../shared/validation.js';
import {lazy, Suspense, useMemo, useState} from 'react';
import {defaults, orientations, schedule, validCoordinates} from '../shared/competition.js';
import {useCompetition} from './hooks/useCompetition.js';
import {readLegacyCompetition} from './services/competitionApi.js';
import {demoState} from './lib/demo.js';
import {Header, Hero} from './components/Layout.jsx';
import {TeamPanel} from './components/TeamPanel.jsx';
import {AvailabilityPanel} from './components/AvailabilityPanel.jsx';
import {Metrics, SchedulePanel} from './components/SchedulePanel.jsx';
import {TravelPanel} from './components/TravelPanel.jsx';
import {TechnicalNote} from './components/TechnicalNote.jsx';

const CalendarPanel = lazy(() => import('./components/CalendarPanel.jsx').then(module => ({default: module.CalendarPanel})));

export default function App() {
  const {state, status, error, reload, update, locked} = useCompetition();
  const [validationError, setValidationError] = useState('');
  const [demoStep, setDemoStep] = useState(null);
  const [legacy, setLegacy] = useState(readLegacyCompetition);
  const valid = state ? validCoordinates(state.teams) : false;
  const options = useMemo(() => orientations(valid ? state.teams : defaults().teams, state?.results || {}), [state?.teams, state?.results, valid]);
  const selected = state?.optimized && valid ? options.best : options.baseline;
  const data = state ? schedule(state, selected) : null;
  const commit = async next => {
    try {validateState(next); setValidationError('');}
    catch (failure) {setValidationError(failure.message); return false;}
    return update(next);
  };
  const changeKickoff = (match, iso) => {
    const field = match.makeup ? 'makeupDates' : 'matchDates';
    return commit({...state, [field]: {...state[field], [match.id]: iso}});
  };
  const changeStart = iso => {
    if ((Object.keys(state.matchDates).length || Object.keys(state.makeupDates).length) &&
        !window.confirm('Changing the start resets individual match dates to the weekly schedule. Continue?')) return false;
    return commit({...state, roundDates: weeklyRoundDates(iso), matchDates: {}, makeupDates: {}});
  };
  const saveResult = (match, scores) => {
    const results = {...state.results};
    if (scores === null) delete results[match.id];
    else results[match.id] = {homeTeam: match.home, awayTeam: match.away, ...scores};
    return commit({...state, results});
  };
  const changeTeam = team => commit({...state, teams: state.teams.map(current => current.id === team.id ? team : current)});
  const toggleAvailability = (team, round) => commit({...state, unavailable: state.unavailable.map((row, id) => id === team ? row.map((value, index) => index === round ? !value : value) : row)});
  const beginDemo = async () => {
    if (!window.confirm('Load the demo? This replaces the saved competition for everyone using this server.')) return;
    if (await update(demoState(0))) setDemoStep(0);
  };
  const nextDemo = async () => {if (await update(demoState(demoStep + 1))) setDemoStep(demoStep + 1);};
  const reset = async () => {
    if (!window.confirm('Reset all team names, venues, and availability in the server file?')) return;
    if (await update(defaults())) setDemoStep(null);
  };
  const importLegacy = async () => {
    if (!window.confirm('Replace the server competition with the saved data from this browser?')) return;
    if (await update(legacy)) {
      setLegacy(null);
      try {localStorage.removeItem('roundhouse-v1');} catch { /* Import succeeds even if browser storage is read-only. */ }
    }
  };
  return <><Header status={status}/><main className="mx-auto max-w-[1440px] px-[5%]"><Hero/>
    {(error || validationError) && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{validationError || error}</span><button className="button-secondary" disabled={status === 'loading'} onClick={() => {setValidationError(''); reload();}}>Reload from server</button></div>}
    {!state ? <p className="py-10 text-sm text-muted">{status === 'loading' ? 'Loading your competition from the server…' : 'Start the backend, then reload to open your competition.'}</p> : <>
      {legacy && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 text-xs"><span>A competition from the previous version is saved in this browser.</span><div className="flex gap-3"><button className="button-secondary" disabled={locked} onClick={importLegacy}>Import browser data</button><button className="text-muted" onClick={() => setLegacy(null)}>Dismiss</button></div></div>}
      <Metrics conflicts={data.unresolved}/>
      <fieldset disabled={locked} className="min-w-0 border-0 p-0"><legend className="sr-only">Competition editor</legend><div className="grid gap-6 lg:grid-cols-[300px_1fr]"><aside className="space-y-6"><TeamPanel teams={state.teams} onTeamChange={changeTeam}/><TechnicalNote/></aside><div className="min-w-0 space-y-6"><AvailabilityPanel state={state} onToggle={toggleAvailability} onResolve={resolve => commit({...state, resolve})}/><SchedulePanel data={data} teams={state.teams} demoStep={demoStep} onDemo={beginDemo} onNextDemo={nextDemo} onCloseDemo={() => setDemoStep(null)} onKickoffChange={changeKickoff}/><Suspense fallback={<div role="status" className="rounded-xl border border-line bg-white p-6 text-xs text-muted">Loading calendar…</div>}><CalendarPanel state={state} matches={data.matches} onStartChange={changeStart} onKickoffChange={changeKickoff} locked={locked}/></Suspense><HomeAwayPanel teams={state.teams} selected={selected}/><ResultsPanel state={state} matches={data.matches} onSaveResult={saveResult}/><TravelPanel state={state} valid={valid} selected={selected} baseline={options.baseline} onOptimize={() => update({...state, optimized: true})}/></div></div><footer className="flex justify-between gap-4 py-8 text-[10px] text-muted"><span>Roundhouse / Small league. Complete picture.</span><button className="text-xs font-semibold text-green-800" onClick={reset}>Reset competition</button></footer></fieldset>
    </>}
  </main></>;
}
