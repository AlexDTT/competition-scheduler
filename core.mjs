export function defaults() {
  return { teams: ['Atlas','Harbor','Summit','Comets','Forest','Phoenix'].map((name,id)=>({id,name,lat:38.7+id*.27,lon:-9.2+((id*3)%5)*.34})), unavailable: Array.from({length:6},()=>Array(5).fill(false)), resolve:false, optimized:false };
}
export function fixtures() {
  let ring=[0,1,2,3,4,5], matches=[];
  for(let round=0;round<5;round++) {
    for(let i=0;i<3;i++) matches.push({id:matches.length,round,a:ring[i],b:ring[5-i]});
    ring=[ring[0],ring[5],...ring.slice(1,5)];
  }
  return matches;
}
export function distance(a,b) {
  const rad=x=>x*Math.PI/180, dlat=rad(b.lat-a.lat), dlon=rad(b.lon-a.lon);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
export function validCoordinates(teams) {
  return teams.every(t=>Number.isFinite(t.lat)&&Number.isFinite(t.lon)&&Math.abs(t.lat)<=90&&Math.abs(t.lon)<=180);
}
// Exhaustive orientation search is tiny for 15 matches: 2^15 candidates.
export function orientations(teams) {
  const matches=fixtures(), costs=matches.map(m=>2*distance(teams[m.a],teams[m.b]));
  let baseline=null,best=null;
  for(let mask=0;mask<32768;mask++) {
    const homeCounts=Array(6).fill(0);
    matches.forEach((m,i)=>homeCounts[(mask>>i)&1?m.b:m.a]++);
    if(homeCounts.some(n=>n<2||n>3)) continue;
    const awayCounts=homeCounts.map(n=>5-n), total=costs.reduce((s,n)=>s+n,0);
    // Round-trip cost is symmetric: changing home/away cannot change the total.
    // Minimize the largest per-team travel burden among balanced assignments.
    const travel=Array(6).fill(0);
    matches.forEach((m,i)=>travel[(mask>>i)&1?m.a:m.b]+=costs[i]);
    const candidate={mask,homeCounts,awayCounts,travel,total,maximum:Math.max(...travel)};
    baseline??=candidate;
    if(!best||candidate.maximum<best.maximum-1e-9) best=candidate;
  }
  return {baseline,best};
}
export function makeupRounds(matches) {
  if(!matches.length) return [];
  const degree=Array(6).fill(0);matches.forEach(m=>{degree[m.a]++;degree[m.b]++;});
  const sorted=[...matches].sort((a,b)=>(degree[b.a]+degree[b.b])-(degree[a.a]+degree[a.b])||a.id-b.id);
  for(let count=Math.max(...degree,Math.ceil(matches.length/3));count<=matches.length;count++) {
    const rounds=Array.from({length:count},()=>[]), used=Array(count).fill(0);
    const place=index=>{
      if(index===sorted.length) return true;
      const m=sorted[index], bits=(1<<m.a)|(1<<m.b);let triedEmpty=false;
      for(let r=0;r<count;r++) {
        if(used[r]&bits) continue;
        if(!used[r]) {if(triedEmpty) continue;triedEmpty=true;}
        used[r]|=bits;rounds[r].push(m);
        if(place(index+1)) return true;
        rounds[r].pop();used[r]^=bits;
      }
      return false;
    };
    if(place(0)) return rounds.map(r=>r.sort((a,b)=>a.id-b.id));
  }
}
export function schedule(state,orientation) {
  const matches=fixtures().map(m=>({...m,home:(orientation.mask>>m.id)&1?m.b:m.a,away:(orientation.mask>>m.id)&1?m.a:m.b,conflicts:[m.a,m.b].filter(t=>state.unavailable[t][m.round])}));
  const affected=matches.filter(m=>m.conflicts.length), original=Array.from({length:5},(_,r)=>matches.filter(m=>m.round===r&&(!state.resolve||!m.conflicts.length)));
  return {matches,original,makeup:state.resolve?makeupRounds(affected):[],affected:affected.length,unresolved:state.resolve?0:affected.length,postponed:state.resolve?affected.length:0};
}
