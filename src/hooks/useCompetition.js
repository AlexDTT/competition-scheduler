import {useCallback, useEffect, useRef, useState} from 'react';
import {loadCompetition, saveCompetition} from '../services/competitionApi.js';

export function useCompetition() {
  const [record, setRecord] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const current = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const reload = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setStatus('loading'); setError('');
    try {
      const loaded = await loadCompetition();
      if (mounted.current) {current.current = loaded; setRecord(loaded); setStatus('saved');}
    } catch (failure) {if (mounted.current) {setError(failure.message); setStatus('error');}}
    finally {busy.current = false;}
  }, []);
  useEffect(() => {mounted.current = true; reload(); return () => {mounted.current = false;};}, [reload]);
  const update = useCallback(async next => {
    if (busy.current || !current.current) return false;
    busy.current = true;
    setStatus('saving'); setError('');
    try {
      const saved = await saveCompetition(next, current.current.revision);
      if (mounted.current) {current.current = saved; setRecord(saved); setStatus('saved');}
      return true;
    } catch (failure) {
      if (mounted.current) {setError(failure.message); setStatus(failure.status === 409 ? 'conflict' : 'error');}
      return false;
    } finally {busy.current = false;}
  }, []);
  return {state: record?.state, status, error, reload, update, locked: !record || ['loading', 'saving', 'conflict'].includes(status)};
}
