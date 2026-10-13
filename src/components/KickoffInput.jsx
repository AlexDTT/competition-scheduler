import {useEffect, useState} from 'react';
import {fromLocalInput, toLocalInput} from '../../shared/calendar.js';
export function KickoffInput({kickoff, label, onCommit}) {
  const [draft, setDraft] = useState(toLocalInput(kickoff));
  const [error, setError] = useState('');
  useEffect(() => {setDraft(toLocalInput(kickoff)); setError('');}, [kickoff]);
  const commit = async () => {
    try {
      const iso = fromLocalInput(draft);
      if (iso !== kickoff && !(await onCommit(iso))) setDraft(toLocalInput(kickoff));
      setError('');
    } catch (failure) {setError(failure.message);}
  };
  return <div><input className="mt-2 w-full rounded-md border border-line bg-white px-2 py-1 text-[10px] text-ink" type="datetime-local" aria-label={label} aria-invalid={!!error} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}/>{error && <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p>}</div>;
}
