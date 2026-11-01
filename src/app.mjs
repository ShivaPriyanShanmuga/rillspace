import './style.css';
import { WorldView } from './world.mjs';
import { DEFAULT, DT, DURATION, SIZE, COVER, makeWorld, comparison, step, stats, command, normalize, encodeScenario, decodeScenario } from './simulation.mjs';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const icons={bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',orbit:'<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-35 12 12)"/>',split:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',camera:'<path d="M4 6h4l2-3h4l2 3h4v14H4z"/><circle cx="12" cy="12" r="4"/>',play:'<path d="m9 5 10 7-10 7z" fill="currentColor" stroke="none"/>',pause:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',rewind:'<path d="M4 9V3m0 6h6M4 9a9 9 0 1 1-1 8"/>',mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v3M8 23h8"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',link:'<path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 8a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" transform="translate(1 2) scale(.9)"/>',layers:'<path d="m12 3 10 6-10 6L2 9zm-10 11 10 6 10-6M2 18l10 6 10-6"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.play}</svg>`;
$$('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let config=normalize(DEFAULT),worlds=comparison(config,0),running=false,compare=false,speed=2,accumulator=0,elapsed=0,trail=[],undo=[],saved=[],view=null,recognition=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function writeLocal(){try{localStorage.setItem('rillspace.current.v1',JSON.stringify({config,compare,trail:trail.slice(0,16),time:worlds.future.time}));}catch{}}
try{
  const current=JSON.parse(localStorage.getItem('rillspace.current.v1'));
  if(current?.config){config=normalize(current.config);compare=current.compare===true;trail=Array.isArray(current.trail)?current.trail.slice(0,16).filter(t=>typeof t.label==='string').map(t=>({label:t.label.slice(0,100),config:normalize(t.config)})):[];worlds=comparison(config,Math.max(0,Math.min(DURATION,Number(current.time)||0)));}
  const list=JSON.parse(localStorage.getItem('rillspace.saved.v1'));
  if(Array.isArray(list))saved=list.slice(0,20).filter(s=>typeof s.name==='string'&&typeof s.id==='string').map(s=>({id:s.id.slice(0,80),name:s.name.slice(0,80),config:normalize(s.config),time:Math.max(0,Math.min(DURATION,Number(s.time)||0))}));
}catch{toast('Starting a fresh world. Your browser storage was unavailable or unreadable.');}
if(location.hash.length>1){config=decodeScenario(location.hash);compare=config.cover!=='meadow'||config.dam;worlds=comparison(config,0);trail=[];}

const coverName=c=>({meadow:'Meadow',forest:'Forest',paved:'Paved hillside'}[c]);
const scenarioName=c=>`${coverName(c.cover)}${c.dam?' + dam':''}`;
function setCompare(value){compare=value;$('#compare-toggle').setAttribute('aria-checked',String(value));$('#original-label').hidden=!value;$('#split-divider').hidden=!value;$('#scene-shell').classList.toggle('comparing',value);$('#future-world-name').textContent=value?'Your future':'Your world';writeLocal();}
function refresh(){
  const base=stats(worlds.baseline),future=stats(worlds.future),time=worlds.future.time;
  $('#absorbed-value').innerHTML=`${future.absorbedPercent.toFixed(0)}<span>%</span>`;$('#runoff-value').innerHTML=`${future.outflowPercent.toFixed(0)}<span>%</span>`;
  $('#absorbed-baseline').textContent=`Original ${base.absorbedPercent.toFixed(0)}%`;$('#runoff-baseline').textContent=`Original ${base.outflowPercent.toFixed(0)}%`;
  $('#future-cover').textContent=`${coverName(config.cover)} · ${config.dam?'dam built':'no dam'}`;
  $('#cover-tag').textContent=coverName(config.cover);$('#rain-tag').textContent=`${config.intensity}× storm`;$('#dam-tag').hidden=!config.dam;
  $('#time-label').textContent=time===0?'Before the rain':time>=DURATION?'Storm complete':`${time.toFixed(0)}s into the experiment`;
  $('#run-status').textContent=running?'Same rainfall in both worlds':time===0?'Ready for your first experiment':time>=DURATION?'Rewind or make another decision':'Paused · drag the timeline to rewind';
  $('#live-tag').textContent=running?'RUNNING':time>=DURATION?'COMPLETE':time===0?'READY':'PAUSED';
  $('#play-button').innerHTML=icon(running?'pause':'play');$('#play-button').setAttribute('aria-label',running?'Pause the storm':time>=DURATION?'Replay the storm':'Start the storm');
  if(document.activeElement!==$('#timeline'))$('#timeline').value=String(time);
  $('#undo-button').disabled=undo.length===0;$('#saved-count').textContent=String(saved.length);
  if(time<2){$('#insight').textContent='Same storm, same starting state. Only your landscape decision changes.';}
  else if(config.cover==='meadow'&&!config.dam){$('#insight').textContent='The original and your world match. Try planting a forest or paving the hillside to create a counterfactual.';}
  else{const difference=base.outflow?((future.outflow-base.outflow)/base.outflow*100):0;$('#insight').textContent=`${Math.abs(difference).toFixed(0)}% ${difference<=0?'less':'more'} water has left your island so far. ${config.dam?'A barrier may also move water upstream.':'Both worlds received exactly the same rain.'}`;}
  drawChart();
}
function drawChart(){const max=Math.max(.01,...worlds.baseline.samples.map(p=>p.flow),...worlds.future.samples.map(p=>p.flow));for(const [name,world]of Object.entries(worlds)){const d=world.samples.map((p,i)=>`${i?'L':'M'}${(p.time/DURATION*270).toFixed(2)} ${(86-p.flow/max*74).toFixed(2)}`).join(' ');$(`#${name==='baseline'?'baseline':'future'}-line`).setAttribute('d',d||'M0 86');}}
function refreshTrail(){
  $('#decision-trail').innerHTML=trail.length?trail.slice(0,6).map((t,i)=>`<li><button data-trail="${i}">${escape(t.label)}</button><small>${i===0?'Current future':'Replay this possibility'}</small></li>`).join(''):'<li class="trail-empty">Every decision opens another possibility.</li>';
  $$('[data-trail]').forEach(b=>b.onclick=()=>change(trail[Number(b.dataset.trail)].config,'Revisited an earlier future'));
}
function stopVoice(){if(recognition){recognition.onend=null;try{recognition.stop();}catch{}recognition=null;}$('#voice-button').classList.remove('listening');$('#voice-label').textContent='Speak';}
function change(next,label){
  undo.push({config:{...config},trail:structuredClone(trail)});if(undo.length>20)undo.shift();
  config=normalize(next);worlds=comparison(config,0);accumulator=0;running=true;
  trail.unshift({label,config:{...config}});trail=trail.slice(0,16);setCompare(true);
  $('#decision-title').textContent=label;$('#decision-copy').textContent='A new future, starting from the same dry island. The original stays untouched.';
  refreshTrail();refresh();writeLocal();
}
function apply(text){
  const action=command(text);$('#command-feedback').classList.remove('error');
  if(!action){$('#command-feedback').textContent='I can change forest, meadow, pavement, dams and rain; or compare, pause, rewind and undo. Try “plant a forest”.';$('#command-feedback').classList.add('error');return false;}
  $('#command-feedback').textContent=action.label+' · applied to the running model.';
  if(action.type==='cover')change({...config,cover:action.value},action.label);
  else if(action.type==='dam')change({...config,dam:action.value},action.label);
  else if(action.type==='intensity')change({...config,intensity:action.value},action.label);
  else if(action.type==='reset'){undo.push({config:{...config},trail:structuredClone(trail)});config=normalize(DEFAULT);worlds=comparison(config,0);running=false;accumulator=0;trail=[];setCompare(false);$('#decision-title').innerHTML='What happens<br>if we change it?';$('#decision-copy').textContent='A forest, a paved hillside, a dam. Change one thing and replay the very same storm.';refreshTrail();}
  else if(action.type==='undo')undoLast();
  else if(action.type==='pause')running=false;
  else if(action.type==='compare')setCompare(!compare);
  else if(action.type==='rewind'){worlds=comparison(config,0);accumulator=0;running=true;}
  else if(action.type==='play'){if(worlds.future.time>=DURATION)worlds=comparison(config,0);running=true;}
  refresh();writeLocal();return true;
}
function undoLast(){const previous=undo.pop();if(!previous)return toast('Make a landscape decision first.');config=previous.config;trail=previous.trail;worlds=comparison(config,0);accumulator=0;running=true;setCompare(trail.length>0);$('#decision-title').textContent=trail[0]?.label||'Back to the original';refreshTrail();refresh();writeLocal();toast('Last decision undone. The same storm is replaying.');}
function dialog(title,kicker,html){stopVoice();$('#dialog-title').textContent=title;$('#dialog-kicker').textContent=kicker;$('#dialog-content').innerHTML=html;if(!$('#dialog').open)$('#dialog').showModal();}
$('#close-dialog').onclick=()=>$('#dialog').close();$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
function modelDialog(){
  const a=stats(worlds.future),b=stats(worlds.baseline),fmt=n=>n.toLocaleString(undefined,{maximumFractionDigits:3});
  dialog('Every drop has a destination.','LOOK UNDER THE SURFACE',`<p>Rillspace is an illustrative watershed experiment, computed locally on a ${SIZE} × ${SIZE} grid. Both worlds start dry, use seed ${config.seed}, and receive the same ${config.intensity}× storm. Your land cover and barrier are the changed variables.</p><table><thead><tr><th>Water accounting · model units</th><th>Original</th><th>Your future</th></tr></thead><tbody>${[['Rain added','rain'],['Still on the surface','stored'],['Absorbed by soil','absorbed'],['Left the boundary','outflow']].map(([label,key])=>`<tr><td>${label}</td><td>${fmt(b[key])}</td><td>${fmt(a[key])}</td></tr>`).join('')}<tr><td>Unaccounted water</td><td class="ledger-pass">${fmt(Math.abs(b.balanceError))}</td><td class="ledger-pass">${fmt(Math.abs(a.balanceError))}</td></tr></tbody></table><h3>What the model does</h3><p>Rain adds water. Soil absorbs it toward a bounded capacity. Surface water moves toward a lower water level through conservative, availability-limited neighbor transfers. Boundary flow leaves the island. The dam raises terrain cells; forest increases soil capacity and resistance; paving reduces absorption.</p><h3>What the numbers mean</h3><p>These are normalized model units, not real rainfall or flood depths. The model omits groundwater, momentum, drainage infrastructure and calibrated geography. It is a playground for testing assumptions, not a forecast or a planning tool.</p><h3>Voice and privacy</h3><p>Commands use an explicit local grammar, not a cloud AI model. Browser speech recognition may use your browser provider's service; typed commands and suggestion buttons always work. Experiments are saved in this browser. No camera, paid API, card or bank details are needed.</p><div class="dialog-actions"><button class="button primary" id="export-data">Export experiment data</button><button class="button secondary" id="model-reset">Return to the original</button></div>`);
  $('#export-data').onclick=()=>download('rillspace-experiment.json',new Blob([JSON.stringify({format:'rillspace-experiment-v1',config,time:worlds.future.time,baseline:b,future:a,baselineOutflow:worlds.baseline.samples,futureOutflow:worlds.future.samples,model:'Illustrative finite-volume watershed; not a real-world forecast.'},null,2)],{type:'application/json'}));
  $('#model-reset').onclick=()=>{apply('reset');$('#dialog').close();};
}
$('#model-button').onclick=modelDialog;
$('#about-button').onclick=()=>dialog('Same island. Same storm. One decision.','WELCOME TO RILLSPACE',`<p>Some changes are hard to picture until you can see them unfold. Rillspace turns a small “what if” into a living experiment.</p><ol><li><strong>Start the storm.</strong> Rain falls on the island and the water moves through a running model.</li><li><strong>Make one decision.</strong> Plant a forest, pave the hillside, or build a dam. Say it, type it, or tap a suggestion.</li><li><strong>Compare futures.</strong> Original and changed worlds replay identical rainfall. Orbit either view to inspect both from the same angle.</li><li><strong>Rewind, undo, repeat.</strong> Drag the timeline, revisit your trail, or save the experiment.</li></ol><div class="model-note"><p>Supported voice examples: “plant a forest”, “pave the hillside”, “build a dam”, “remove the dam”, “restore the meadow”, “double the rain”, “half the rain”, “compare worlds”, “pause”, “replay”, “undo” and “reset”.</p></div><p>The scene is generated geometry and the outcomes are computed, not prerecorded. This is an illustrative model with explicit assumptions. Open “Look under the surface” to inspect them.</p>`);
function download(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('#save-button').onclick=()=>{
  if(saved.length>=20)return toast('You have 20 saved experiments. Remove one in Saved experiments first.');
  const item={id:crypto.randomUUID(),name:`${scenarioName(config)} · ${config.intensity}× rain`,config:{...config},time:worlds.future.time};saved.unshift(item);
  try{localStorage.setItem('rillspace.saved.v1',JSON.stringify(saved));toast('Experiment saved on this device.');}catch{saved.shift();toast('Storage is unavailable. Copy an experiment link instead.');}refresh();
};
function savedDialog(){dialog('Your possible futures.','SAVED ON THIS DEVICE',saved.length?saved.map(s=>`<div class="saved-experiment"><div><strong>${escape(s.name)}</strong><small>${s.time.toFixed(0)}s · seed ${s.config.seed}</small></div><button class="button secondary" data-load="${escape(s.id)}">Open</button><button class="icon-button" data-remove="${escape(s.id)}" aria-label="Remove ${escape(s.name)}">×</button></div>`).join(''):'<p class="empty-saved">Nothing saved yet. Make a change and tap Save experiment to bookmark a possibility.</p>');
  $$('[data-load]').forEach(b=>b.onclick=()=>{const item=saved.find(s=>s.id===b.dataset.load);if(!item)return;undo.push({config:{...config},trail:structuredClone(trail)});config=normalize(item.config);worlds=comparison(config,item.time);running=false;trail=[{label:'Opened '+scenarioName(config),config:{...config}}];setCompare(true);refreshTrail();refresh();writeLocal();$('#dialog').close();});
  $$('[data-remove]').forEach(b=>b.onclick=()=>{const previous=saved;saved=saved.filter(s=>s.id!==b.dataset.remove);try{localStorage.setItem('rillspace.saved.v1',JSON.stringify(saved));savedDialog();refresh();}catch{saved=previous;toast('Could not update saved experiments.');}});
}
$('#saved-button').onclick=savedDialog;
$('#share-button').onclick=async()=>{const url=new URL(location.href);url.hash=encodeScenario(config);try{await navigator.clipboard.writeText(url.href);toast('Experiment link copied. It recreates your landscape from the start.');}catch{dialog('Copy this experiment link.','SAME STARTING CONDITIONS',`<p>The link recreates this landscape and storm from the beginning. It does not change who can access the private app.</p><label><span class="sr-only">Experiment link</span><input id="share-url" value="${escape(url.href)}" readonly style="width:100%;padding:12px;background:#18383f;border:1px solid #55716b;color:#d5eda0;border-radius:6px"></label>`);$('#share-url').select();}};
$('#snapshot-button').onclick=()=>{
  if(!view)return toast('The 3D view is not available. Export the experiment data instead.');
  const canvas=document.createElement('canvas');canvas.width=$('#world-canvas').width;canvas.height=$('#world-canvas').height+150;const c=canvas.getContext('2d');c.fillStyle='#102831';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage($('#world-canvas'),0,0);const f=stats(worlds.future);c.fillStyle='#d5eda0';c.font=`${Math.max(17,canvas.width/40)}px sans-serif`;c.fillText('RILLSPACE / Same island. Same storm. One decision.',24,canvas.height-108);c.fillStyle='#d9e7df';c.font=`${Math.max(13,canvas.width/55)}px sans-serif`;c.fillText(`${scenarioName(config)} · ${config.intensity}× storm · ${worlds.future.time.toFixed(0)}s · ${f.absorbedPercent.toFixed(1)}% absorbed · ${f.outflowPercent.toFixed(1)}% outflow`,24,canvas.height-70);c.fillStyle='#93adb1';c.fillText('Illustrative local model. Not a real-world forecast.',24,canvas.height-34);canvas.toBlob(blob=>{if(blob)download('rillspace-experiment.png',blob);});
};
$('#command-form').onsubmit=e=>{e.preventDefault();const input=$('#command-input');if(apply(input.value))input.value='';};
$$('[data-command]').forEach(b=>b.onclick=()=>apply(b.dataset.command));
$('#compare-toggle').onclick=()=>{setCompare(!compare);refresh();};
$('#view-reset').onclick=()=>view?.reset();
$('#play-button').onclick=()=>{if(running)running=false;else{if(worlds.future.time>=DURATION)worlds=comparison(config,0);running=true;}refresh();};
$('#replay-button').onclick=()=>apply('replay');$('#undo-button').onclick=undoLast;
$('#timeline').oninput=e=>{running=false;worlds=comparison(config,Number(e.target.value));accumulator=0;refresh();};$('#timeline').onchange=writeLocal;
$('#speed-button').onclick=()=>{speed=speed===2?4:speed===4?8:2;$('#speed-button').textContent=speed+'×';};
$('#voice-button').onclick=()=>{
  if(recognition)return stopVoice();const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){$('#command-feedback').textContent='Voice recognition is not available here. Type a command or tap a suggestion.';toast('Voice unavailable in this browser. Buttons and typing still work.');return;}
  recognition=new Speech();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;
  recognition.onresult=e=>{const text=[...e.results].map(r=>r[0].transcript).join(' ');$('#command-input').value=text;apply(text);};
  recognition.onerror=e=>{$('#command-feedback').textContent=e.error==='not-allowed'?'Microphone access was denied. Type a command or tap a suggestion.':'Could not hear a command. Try again, type, or tap a suggestion.';stopVoice();};
  recognition.onend=stopVoice;$('#voice-button').classList.add('listening');$('#voice-label').textContent='Listening';$('#command-feedback').textContent='Listening… try “plant a forest”.';
  try{recognition.start();}catch{stopVoice();toast('Could not start voice input. Type or tap a suggestion.');}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;stopVoice();writeLocal();refresh();}});
window.addEventListener('pagehide',writeLocal);
$('#world-canvas').addEventListener('view-error',e=>{$('#view-error').textContent=e.detail;$('#view-error').hidden=false;running=false;refresh();});
setCompare(compare);refreshTrail();refresh();
if(trail[0]){$('#decision-title').textContent=trail[0].label;$('#decision-copy').textContent='A saved possibility, replayed from the same starting conditions. Change it again or rewind the storm.';}
try{view=new WorldView($('#world-canvas'));view.render(worlds.baseline,worlds.future,compare,elapsed,0);$('#scene-loading').hidden=true;}catch(error){$('#scene-loading').hidden=true;$('#view-error').textContent='This browser could not start WebGL 2. Try Safari on a recent iPhone or another browser. The commands, timeline and measured results still work below.';$('#view-error').hidden=false;console.warn('3D view unavailable:',error.message);}
let last=performance.now(),lastUI=0,lastStore=0;
function frame(now){if(now-last<33){requestAnimationFrame(frame);return;}const dt=Math.min(.1,(now-last)/1000);last=now;elapsed+=reduced?0:dt;
  if(running){accumulator+=dt*speed;let steps=0;while(accumulator>=DT&&steps<12){step(worlds.baseline);step(worlds.future);accumulator-=DT;steps++;}if(worlds.future.time>=DURATION){running=false;refresh();writeLocal();}}
  view?.render(worlds.baseline,worlds.future,compare,elapsed,running?dt:0);
  if(running&&now-lastUI>220){refresh();lastUI=now;}if(now-lastStore>4000){writeLocal();lastStore=now;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
