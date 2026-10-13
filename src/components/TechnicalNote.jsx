import {useState} from 'react';
import {Panel} from './ui.jsx';
export function TechnicalNote() {
  const [open, setOpen] = useState(false);
  return <Panel className="!bg-lime-50"><p className="eyebrow">UNDER THE HOOD</p><h2>One rotation. Every pairing.</h2><p className="mt-3 text-xs leading-7 text-muted">The circle method fixes one team and rotates the other five. Each rotation creates three matches, so every pair meets once in five rounds.</p><button className="mt-3 text-xs font-semibold text-green-800" aria-expanded={open} onClick={() => setOpen(!open)}>See the technical choice ↗</button>{open && <div className="mt-3 space-y-3 text-xs leading-7 text-muted"><p>Team IDs keep fixtures stable when names change. Makeup rounds use an exact search to find the fewest rounds without double-booking a team.</p><p>Balanced home/away assignments are searched exhaustively: just 32,768 possibilities.</p><p>React calls a JavaScript API using fetch. The server saves JSON with atomic file replacement so incomplete writes do not replace the saved competition.</p></div>}</Panel>;
}
