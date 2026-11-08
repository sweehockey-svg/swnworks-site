import assert from "node:assert/strict";
import {parseScorers} from "./goals.mjs";
const goal=(id,name,score)=>`<b><a href="https://sportsgamer.gg/players/${id}">${name}</a> ${score}</b>`;
const row=(h,a)=>`<tr><td class="text-right match-action">${h}</td><td>00:14</td><td class="text-left match-action">${a}</td></tr>`;
const fixture=`<a class="profile-name" href="https://sportsgamer.gg/leagues/527/teams/7103">A</a>
<td class="text-center match-score"><h1><span>1</span>-<span>2</span></h1></td>
<a class="profile-name" href="https://sportsgamer.gg/leagues/527/teams/6709">B</a>
<h2>Game summary</h2>
${row("",goal(8,"#27 Li &amp; Co","0-1"))}
${row('<b><a href="https://sportsgamer.gg/players/17">#17 Oskar</a></b> 2min Slashing',"")}
${row(goal(17,"#17 Oskar","1-1"),"")}
${row("",goal(8,"#27 Li &amp; Co","1-2")+" (<a href='https://sportsgamer.gg/players/9'>Assist</a>) GWG")}
<h2>Player stats</h2>`;
assert.deepEqual(parseScorers(fixture,527),{7103:[{id:17,name:"Oskar",goals:1}],6709:[{id:8,name:"Li & Co",goals:2}]});
assert.equal(parseScorers(fixture,520),null);
assert.equal(parseScorers(fixture.replace("1-2</b>","1-3</b>"),527),null);
assert.equal(parseScorers(fixture.replace("<span>2</span>","<span>3</span>"),527),null);
console.log("PASS goal events only, stable team IDs, correct totals, and fail-closed reports");
