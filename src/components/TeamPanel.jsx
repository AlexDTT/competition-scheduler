import {useEffect, useState} from 'react';
import {Avatar, Panel, SectionHeading} from './ui.jsx';

function TeamEditor({team, onChange}) {
  const [draft, setDraft] = useState({name: team.name, lat: team.lat ?? '', lon: team.lon ?? ''});
  useEffect(() => {setDraft({name: team.name, lat: team.lat ?? '', lon: team.lon ?? ''});}, [team]);
  const commit = () => {
    const next = {id: team.id, name: draft.name.trim() || `Team ${team.id + 1}`,
      lat: draft.lat === '' ? null : Number(draft.lat), lon: draft.lon === '' ? null : Number(draft.lon)};
    if (JSON.stringify(next) !== JSON.stringify(team)) onChange(next);
    else if (!draft.name.trim()) setDraft(current => ({...current, name: next.name}));
  };
  const enter = event => {if (event.key === 'Enter') event.currentTarget.blur();};
  return <div className="border-t border-line py-4">
    <div className="flex items-center gap-2"><Avatar team={team}/><input className="w-full min-w-0 rounded-md border border-transparent px-2 py-1 font-semibold hover:border-line" aria-label={`Team ${team.id + 1} name`} maxLength={40} value={draft.name} onChange={event => setDraft({...draft, name: event.target.value})} onBlur={commit} onKeyDown={enter}/></div>
    <div className="ml-10 mt-2 flex gap-2">{['lat', 'lon'].map(field => {
      const limit = field === 'lat' ? 90 : 180;
      const invalid = draft[field] === '' || !Number.isFinite(Number(draft[field])) || Math.abs(Number(draft[field])) > limit;
      return <label className="min-w-0 flex-1 text-[10px] text-muted" key={field}>{field === 'lat' ? 'Latitude' : 'Longitude'}<input className="coordinate-input" type="number" step="any" min={-limit} max={limit} aria-label={`${team.name} ${field === 'lat' ? 'latitude' : 'longitude'}`} aria-invalid={invalid} value={draft[field]} onChange={event => setDraft({...draft, [field]: event.target.value})} onBlur={commit} onKeyDown={enter}/></label>;
    })}</div>
  </div>;
}
export function TeamPanel({teams, onTeamChange}) {
  return <Panel><SectionHeading number="01 / THE LINEUP" title="Your teams"><span className="rounded-full border border-line px-2 py-1 text-[10px]">6 of 6</span></SectionHeading><p className="description">Edit a name or home venue. Changes save when you leave the field.</p>{teams.map(team => <TeamEditor key={team.id} team={team} onChange={onTeamChange}/>)}<p className="hint">Coordinates are fictional demo venues. Travel uses straight-line round-trip estimates.</p></Panel>;
}
