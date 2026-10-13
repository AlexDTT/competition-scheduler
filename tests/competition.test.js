import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,fixtures,distance,orientations,makeupRounds,schedule,validCoordinates} from '../shared/competition.js';
test('circle schedule covers every pairing and every team exactly once per round',()=>{
 const matches=fixtures();assert.equal(matches.length,15);assert.equal(new Set(matches.map(m=>[m.a,m.b].sort().join('-'))).size,15);
 for(let r=0;r<5;r++){const round=matches.filter(m=>m.round===r);assert.equal(round.length,3);assert.equal(new Set(round.flatMap(m=>[m.a,m.b])).size,6);}
 for(let t=0;t<6;t++)assert.equal(matches.filter(m=>m.a===t||m.b===t).length,5);
});
test('renaming preserves fixtures and one match counts once when both teams are unavailable',()=>{
 const state=defaults(),orientation=orientations(state.teams).baseline,m=fixtures()[0];state.teams[0].name='<Atlas United>';state.unavailable[m.a][0]=true;state.unavailable[m.b][0]=true;
 const result=schedule(state,orientation);assert.equal(result.affected,1);assert.equal(result.unresolved,1);assert.deepEqual(result.matches.map(({id,a,b})=>({id,a,b})),fixtures().map(({id,a,b})=>({id,a,b})));
});
test('makeup resolution preserves 15 matches, removes clashes, and restores cleared fixtures',()=>{
 const state=defaults(),orientation=orientations(state.teams).baseline;state.unavailable[0][1]=true;state.resolve=true;
 let result=schedule(state,orientation);assert.equal(result.postponed,1);assert.equal(result.unresolved,0);assert.equal(result.makeup.length,1);assert.equal(result.original[1].length,2);
 state.unavailable[0][1]=false;result=schedule(state,orientation);assert.equal(result.makeup.length,0);assert.equal(result.original[1].length,3);
});
test('minimum makeup rounds handle odd cycles and the entire competition',()=>{
 assert.equal(makeupRounds([{id:0,a:0,b:1},{id:1,a:1,b:2},{id:2,a:2,b:0}]).length,3);
 const rounds=makeupRounds(fixtures());assert.equal(rounds.length,5);
 rounds.forEach(round=>assert.equal(new Set(round.flatMap(m=>[m.a,m.b])).size,round.length*2));
 const state=defaults();state.resolve=true;state.unavailable=Array.from({length:6},()=>Array(5).fill(true));const result=schedule(state,orientations(state.teams).baseline);
 assert.equal(result.postponed,15);assert.equal(result.original.flat().length,0);assert.equal(result.makeup.flat().length,15);assert.equal(new Set(result.makeup.flat().map(m=>m.id)).size,15);
});
test('exhaustive travel optimization balances home games and minimizes maximum team travel',()=>{
 const state=defaults(),{baseline,best}=orientations(state.teams);assert.ok(best.maximum<=baseline.maximum);assert.equal(best.total,baseline.total);best.homeCounts.forEach(n=>assert.ok(n===2||n===3));assert.equal(best.homeCounts.reduce((s,n)=>s+n),15);
 const matches=fixtures();let optimum=Infinity;
 for(let mask=0;mask<32768;mask++){
  const home=Array(6).fill(0),travel=Array(6).fill(0);
  matches.forEach((m,i)=>{const h=mask&(1<<i)?m.b:m.a,a=h===m.a?m.b:m.a;home[h]++;travel[a]+=2*distance(state.teams[h],state.teams[a]);});
  if(home.every(n=>n===2||n===3))optimum=Math.min(optimum,Math.max(...travel));
 }
 assert.ok(Math.abs(best.maximum-optimum)<1e-8);
});
test('coordinates reject missing or out-of-range values; distances are symmetric and finite',()=>{
 const state=defaults();assert.ok(validCoordinates(state.teams));assert.equal(distance(state.teams[0],state.teams[0]),0);assert.equal(distance(state.teams[0],state.teams[1]),distance(state.teams[1],state.teams[0]));
 for(const value of [null,NaN,Infinity,91]){state.teams[0].lat=value;assert.equal(validCoordinates(state.teams),false);}
 state.teams[0].lat=0;state.teams[0].lon=181;assert.equal(validCoordinates(state.teams),false);
 assert.ok(Number.isFinite(distance({lat:0,lon:0},{lat:0,lon:180})));
});
