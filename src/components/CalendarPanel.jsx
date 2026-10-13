import {useMemo, useRef, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import luxonPlugin from '@fullcalendar/luxon3';
import {Panel, SectionHeading} from './ui.jsx';
import {KickoffInput} from './KickoffInput.jsx';
import {TIME_ZONE, toLocalInput, fromLocalInput, displayKickoff} from '../../shared/calendar.js';
import {calendarEvents} from '../lib/calendarEvents.js';

export function CalendarPanel({state, matches, onStartChange, onKickoffChange, locked}) {
  const calendar = useRef(null);
  const [selection, setSelection] = useState(null);
  const events = useMemo(() => calendarEvents(state, matches), [state, matches]);
  const selectedMatch = selection ? matches.find(match => match.id === selection.matchId) : null;
  const openEvent = info => setSelection(info.event.extendedProps);
  const moveEvent = async info => {
    const match = matches.find(game => game.id === info.event.extendedProps.matchId);
    try {
      const iso = info.event.allDay
        ? fromLocalInput(`${info.event.startStr.slice(0, 10)}T${toLocalInput(match.kickoff).slice(11)}`)
        : info.event.start.toISOString();
      if (!(await onKickoffChange(match, iso))) info.revert();
    } catch {info.revert();}
  };
  return <Panel>
    <SectionHeading number="04 / THE CALENDAR" title="Every game has its day"><span className="text-[10px] text-muted">Lisbon time</span></SectionHeading>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <label className="text-xs text-muted">First round · weekly schedule
        <KickoffInput kickoff={state.roundDates[0]} label="First round date and time, Lisbon" onCommit={async iso => {
          const saved = await onStartChange(iso);
          if (saved) {calendar.current?.getApi().gotoDate(iso); setSelection(null);}
          return saved;
        }}/>
      </label>
      <p className="hint max-w-60">Postponed games need at least 72 hours before and after each participant’s other games.</p>
    </div>
    <div className="mb-4 flex flex-wrap gap-4 text-[10px] text-muted">
      <span><i className="mr-1 inline-block size-2 rounded-full bg-green-700"/>Scheduled</span>
      <span><i className="mr-1 inline-block size-2 rounded-full bg-amber-600"/>Makeup</span>
      <span><i className="mr-1 inline-block size-2 rounded-full bg-red-700"/>Unavailable</span>
    </div>
    <div className="competition-calendar">
      <FullCalendar
        ref={calendar}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin]}
        initialView="dayGridMonth"
        initialDate={state.roundDates[0]}
        timeZone={TIME_ZONE}
        firstDay={1}
        headerToolbar={{left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay'}}
        buttonText={{today: 'Today', month: 'Month', week: 'Week', day: 'Day'}}
        events={events}
        height="auto"
        dayMaxEvents={3}
        allDaySlot={false}
        nowIndicator
        editable={!locked}
        eventDurationEditable={false}
        eventTimeFormat={{hour: '2-digit', minute: '2-digit', hour12: false}}
        slotLabelFormat={{hour: '2-digit', minute: '2-digit', hour12: false}}
        slotMinTime="06:00:00"
        scrollTime="12:00:00"
        eventClick={openEvent}
        eventDrop={moveEvent}
        eventDidMount={info => {
          info.el.setAttribute('role', 'button');
          info.el.setAttribute('tabindex', '0');
          info.el.setAttribute('aria-label', `${info.event.title}, ${displayKickoff(info.event.start.toISOString())}`);
          info.el.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); openEvent(info);}
          });
        }}
      />
    </div>
    {selectedMatch && <div className="mt-4 rounded-lg border border-line bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold">{selection.kind === 'unavailable' ? 'Unavailable original slot' : 'Edit kickoff'} · Match {selectedMatch.id + 1}</h3><button className="text-xs text-muted" onClick={() => setSelection(null)}>Close</button></div>
      <p className="mt-2 text-xs">{state.teams[selectedMatch.home].name} vs {state.teams[selectedMatch.away].name}</p>
      {selection.kind === 'unavailable' ? <p className="mt-2 text-xs text-red-700">{selection.unavailable.map(id => state.teams[id].name).join(' & ')} unavailable in round {selection.round + 1}. This game has moved to {displayKickoff(selectedMatch.kickoff)}.</p> : <><p className="hint mt-2">Kickoff in Lisbon time. Changes are checked for rest and saved to the server.</p><KickoffInput kickoff={selectedMatch.kickoff} label={`Calendar match ${selectedMatch.id + 1} kickoff, Lisbon`} onCommit={iso => onKickoffChange(selectedMatch, iso)}/></>}
    </div>}
  </Panel>;
}
