export function SectionHeading({number, title, children}) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><p className="eyebrow">{number}</p><h2>{title}</h2></div>{children}</div>;
}
const colors = ['bg-lime-100 text-lime-800', 'bg-sky-100 text-sky-800', 'bg-amber-100 text-amber-800', 'bg-purple-100 text-purple-800', 'bg-emerald-100 text-emerald-800', 'bg-orange-100 text-orange-800'];
export function Avatar({team}) {
  return <span aria-hidden="true" className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${colors[team.id]}`}>{team.name.slice(0, 2).toUpperCase()}</span>;
}
export function Panel({children, className = ''}) {
  return <section className={`rounded-2xl border border-line bg-white p-5 sm:p-6 ${className}`}>{children}</section>;
}
