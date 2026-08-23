const loader = document.getElementById('loader');
const startButton = document.getElementById('startButton');

if (startButton && loader) {
  startButton.addEventListener('click', () => {
    loader.classList.add('hidden');

    window.setTimeout(() => {
      document.getElementById('start')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 180);
  });
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: .14 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const watchFrame = document.getElementById('tilsmeeWatchframe');

function sendToWatch(message) {
  if (watchFrame && watchFrame.contentWindow) {
    watchFrame.contentWindow.postMessage(message, '*');
  }
}

const weatherText = {
  0:'Klar',1:'Überwiegend klar',2:'Teilweise bewölkt',3:'Bewölkt',
  45:'Nebel',48:'Reifnebel',51:'Leichter Nieselregen',53:'Nieselregen',
  55:'Starker Nieselregen',61:'Leichter Regen',63:'Regen',65:'Starker Regen',
  71:'Leichter Schneefall',73:'Schneefall',75:'Starker Schneefall',
  80:'Regenschauer',81:'Starke Regenschauer',82:'Heftige Regenschauer',
  95:'Gewitter',96:'Gewitter mit Hagel',99:'Starkes Gewitter'
};

async function fetchWeather(lat, lon, label='') {
  const status = document.getElementById('weatherStatus');
  status.textContent = 'Wetter wird aktualisiert …';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error();

    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const condition = weatherText[data.current.weather_code] || 'Wetter';

    sendToWatch({
      type: 'tilsmee-weather',
      temperature: temp,
      condition
    });

    status.textContent = label ? `Wetter für ${label}` : 'Wetter anhand deines Standorts';
  } catch {
    status.textContent = 'Wetter konnte nicht geladen werden.';
  }
}

function loadWeather() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => fetchWeather(position.coords.latitude, position.coords.longitude),
      () => fetchWeather(51.52, 6.32, 'Geldern'),
      {timeout:7000,maximumAge:900000}
    );
  } else {
    fetchWeather(51.52, 6.32, 'Geldern');
  }
}

loadWeather();

const weatherButton = document.getElementById('weatherButton');
if (weatherButton) weatherButton.addEventListener('click', loadWeather);

async function loadBattery() {
  const apply = value => sendToWatch({type:'tilsmee-battery', value});

  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      const update = () => apply(Math.round(battery.level * 100));
      update();
      battery.addEventListener('levelchange', update);
    } else {
      apply(100);
    }
  } catch {
    apply(100);
  }
}

loadBattery();

/* Daten nachladen, sobald das Watchface-iframe bereit ist */
if (watchFrame) {
  watchFrame.addEventListener('load', () => {
    loadWeather();
    loadBattery();
  });
}

const layers = document.querySelectorAll('.layer');
const editorWatch = document.getElementById('editorWatch');
const stageLabel = document.getElementById('stageLabel');

const labels = {
  all:'Gesamtansicht',
  time:'Uhrzeit',
  date:'Datum',
  weather:'Wetter',
  steps:'Schritte',
  battery:'Akku'
};

layers.forEach(layer => {
  layer.addEventListener('click', () => {
    layers.forEach(item => item.classList.remove('active'));
    layer.classList.add('active');

    const value = layer.dataset.layer;
    editorWatch.dataset.active = value;
    stageLabel.textContent = labels[value];
  });
});


/* =========================================================
   TILSMEE 1.1.0 – PUNKT 2
   Reaktion auf Klick des Gehirns im Watchface
   ========================================================= */

const watchAssistant = document.getElementById('watchAssistant');
const watchframeModule = document.querySelector('.watchframe-module');
const smartwatchHardware = document.querySelector('.smartwatch-hardware');
let watchAssistantTimer;

window.addEventListener('message', event => {
  const data = event.data || {};

  if (data.type === 'tilsmee-brain-click') {
    if (watchframeModule) {
      watchframeModule.classList.remove('tilsmee-activated');
      void watchframeModule.offsetWidth;
      watchframeModule.classList.add('tilsmee-activated');
    }

    if (smartwatchHardware) {
      smartwatchHardware.classList.remove('tilsmee-activated');
      void smartwatchHardware.offsetWidth;
      smartwatchHardware.classList.add('tilsmee-activated');
    }

    if (watchAssistant) {
      watchAssistant.classList.add('show');
      clearTimeout(watchAssistantTimer);
      watchAssistantTimer = setTimeout(() => {
        watchAssistant.classList.remove('show');
      }, 2600);
    }
  }
});

document.addEventListener('click', event => {
  if (!watchAssistant || !watchAssistant.classList.contains('show')) return;
  if (!event.target.closest('.watch-area')) {
    watchAssistant.classList.remove('show');
  }
});


/* TILSMEE 1.1.0 — PUNKT 4: INTERAKTIVE VISION */
const visionItems=[
 {k:'PERSÖNLICH',t:'Eine KI, die dich wirklich kennt.',x:'TILSMEE verbindet deine Projekte, Vorlieben und Arbeitsweise zu einer persönlichen Begleitung, die mit dir weiterdenkt.',d:['DU','TILSMEE']},
 {k:'PRIVAT',t:'Persönlich bedeutet auch: unter deiner Kontrolle.',x:'Die Vision verbindet persönliche Unterstützung mit einem klaren Anspruch an Vertrauen, Kontrolle und einen bewussten Umgang mit deinen Daten.',d:['DEINE DATEN','DEINE KONTROLLE']},
 {k:'ALLTAG',t:'Nicht nur antworten. Mitdenken.',x:'Ob Arbeit, Ideen, Projekte oder tägliche Aufgaben: TILSMEE soll dort unterstützen, wo du gerade weitermachen möchtest.',d:['IDEE','TILSMEE','AKTION']},
 {k:'ÜBERALL',t:'Eine KI. Mehrere Geräte. Eine Identität.',x:'TILSMEE ist dein Begleiter. Überall. Auf Smartphone, Smartwatch, PC und im Auto-Infotainment bleibt deine persönliche KI mit dir verbunden.',d:['SMARTPHONE','SMARTWATCH','PC','AUTO-INFOTAINMENT']}
];
const vCards=[...document.querySelectorAll('.vision-card-v110')],vDeck=document.getElementById('visionDeck'),vFocus=document.getElementById('visionFocus'),vX=document.getElementById('visionX'),vPrev=document.getElementById('visionPrev'),vNext=document.getElementById('visionNext'),vCount=document.getElementById('visionCount'),vKicker=document.getElementById('visionKicker'),vTitle=document.getElementById('visionTitle'),vText=document.getElementById('visionText'),vDemo=document.getElementById('visionDemo');let vActive=0,vTouch=0;
function vRender(i){vActive=(i+visionItems.length)%visionItems.length;const o=visionItems[vActive];vCount.textContent=String(vActive+1).padStart(2,'0')+' / 04';vKicker.textContent=o.k;vTitle.textContent=o.t;vText.textContent=o.x;vDemo.innerHTML=o.d.map((n,j)=>{const node=n==='SMARTPHONE'?'<button type="button" class="vision-node-v110 device-demo-trigger" data-device-demo="smartphone">SMARTPHONE</button>':n==='SMARTWATCH'?'<button type="button" class="vision-node-v110 device-demo-trigger" data-device-demo="smartwatch">SMARTWATCH</button>':n==='PC'?'<button type="button" class="vision-node-v110 device-demo-trigger" data-device-demo="pc">PC</button>':n==='AUTO-INFOTAINMENT'?'<button type="button" class="vision-node-v110 device-demo-trigger" data-device-demo="auto">AUTO-INFOTAINMENT</button>':'<span class="vision-node-v110 '+(n==='TILSMEE'?'hot':'')+'">'+n+'</span>';return node+(j<o.d.length-1?'<span class="vision-link-v110"></span>':'')}).join('')}
function vOpen(i){vRender(i);vDeck.classList.add('muted');vFocus.classList.add('show');vFocus.setAttribute('aria-hidden','false')}
function vClose(){vDeck.classList.remove('muted');vFocus.classList.remove('show');vFocus.setAttribute('aria-hidden','true')}
vCards.forEach((c,i)=>c.addEventListener('click',()=>vOpen(i)));vX?.addEventListener('click',vClose);vPrev?.addEventListener('click',()=>vRender(vActive-1));vNext?.addEventListener('click',()=>vRender(vActive+1));document.addEventListener('keydown',e=>{if(!vFocus?.classList.contains('show'))return;if(e.key==='Escape')vClose();if(e.key==='ArrowLeft')vRender(vActive-1);if(e.key==='ArrowRight')vRender(vActive+1)});vFocus?.addEventListener('touchstart',e=>vTouch=e.changedTouches[0].screenX,{passive:true});vFocus?.addEventListener('touchend',e=>{const d=e.changedTouches[0].screenX-vTouch;if(Math.abs(d)>45)vRender(d<0?vActive+1:vActive-1)},{passive:true});


/* TILSMEE 1.1.0 — PUNKT 4.1: SMARTPHONE-ZUKUNFTSDEMO */
const deviceConceptPanel=document.getElementById('deviceConceptPanel');
const deviceConceptClose=document.getElementById('deviceConceptClose');

document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-device-demo="smartphone"]');
  if(trigger){
    e.stopPropagation();
    deviceConceptPanel?.classList.add('show');
    deviceConceptPanel?.setAttribute('aria-hidden','false');
  }
});

deviceConceptClose?.addEventListener('click',()=>{
  deviceConceptPanel?.classList.remove('show');
  deviceConceptPanel?.setAttribute('aria-hidden','true');
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && deviceConceptPanel?.classList.contains('show')){
    deviceConceptPanel.classList.remove('show');
    deviceConceptPanel.setAttribute('aria-hidden','true');
    e.stopImmediatePropagation();
  }
});


/* =========================================================
   TILSMEE 1.1.0 – PUNKT 4.1a
   Smartphone Detail-Zoom
   ========================================================= */

const phoneZoomBackdrop=document.getElementById('phoneZoomBackdrop');
const phoneZoomClose=document.getElementById('phoneZoomClose');
const phoneZoomMount=document.getElementById('phoneZoomMount');

function openPhoneZoom(){
  const phone=document.querySelector('.device-concept-panel.show .phone-shell');
  if(!phone || !phoneZoomMount || !phoneZoomBackdrop) return;

  phoneZoomMount.innerHTML='';
  phoneZoomMount.appendChild(phone.cloneNode(true));

  phoneZoomBackdrop.classList.add('show');
  phoneZoomBackdrop.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

function closePhoneZoom(){
  if(!phoneZoomBackdrop) return;
  phoneZoomBackdrop.classList.remove('show');
  phoneZoomBackdrop.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

document.addEventListener('click',e=>{
  const phone=e.target.closest('.device-concept-panel.show .phone-concept');
  if(phone){
    e.stopPropagation();
    openPhoneZoom();
  }
});

phoneZoomClose?.addEventListener('click',closePhoneZoom);

phoneZoomBackdrop?.addEventListener('click',e=>{
  if(e.target===phoneZoomBackdrop) closePhoneZoom();
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && phoneZoomBackdrop?.classList.contains('show')){
    closePhoneZoom();
    e.stopImmediatePropagation();
  }
});


/* PUNKT 4.1b – robuste direkte Zoom-Bindung */
const phoneConceptDirect=document.querySelector('#deviceConceptPanel .phone-concept');

if(phoneConceptDirect){
  phoneConceptDirect.setAttribute('role','button');
  phoneConceptDirect.setAttribute('tabindex','0');
  phoneConceptDirect.setAttribute('aria-label','Smartphone vergrößern');

  phoneConceptDirect.addEventListener('click',e=>{
    e.stopPropagation();
    openPhoneZoom();
  });

  phoneConceptDirect.addEventListener('keydown',e=>{
    if(e.key==='Enter' || e.key===' '){
      e.preventDefault();
      openPhoneZoom();
    }
  });
}


/* TILSMEE 1.1.0 — PUNKT 4.2: SMARTWATCH-ZUKUNFTSDEMO */
const watchConceptPanel=document.getElementById('watchConceptPanel');
const watchConceptClose=document.getElementById('watchConceptClose');
const watchConceptVisual=document.getElementById('watchConceptVisual');
const watchZoomBackdrop=document.getElementById('watchZoomBackdrop');
const watchZoomClose=document.getElementById('watchZoomClose');
const watchZoomMount=document.getElementById('watchZoomMount');

document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-device-demo="smartwatch"]');
  if(trigger){e.stopPropagation();watchConceptPanel?.classList.add('show');watchConceptPanel?.setAttribute('aria-hidden','false');}
});
function closeWatchConcept(){watchConceptPanel?.classList.remove('show');watchConceptPanel?.setAttribute('aria-hidden','true');}
watchConceptClose?.addEventListener('click',closeWatchConcept);
function openWatchZoom(){
  const watch=document.querySelector('#watchConceptPanel .concept-watch');
  if(!watch||!watchZoomMount||!watchZoomBackdrop)return;
  watchZoomMount.innerHTML='';watchZoomMount.appendChild(watch.cloneNode(true));
  watchZoomBackdrop.classList.add('show');watchZoomBackdrop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function closeWatchZoom(){watchZoomBackdrop?.classList.remove('show');watchZoomBackdrop?.setAttribute('aria-hidden','true');document.body.style.overflow='';}
watchConceptVisual?.addEventListener('click',openWatchZoom);
watchConceptVisual?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openWatchZoom();}});
watchZoomClose?.addEventListener('click',closeWatchZoom);
watchZoomBackdrop?.addEventListener('click',e=>{if(e.target===watchZoomBackdrop)closeWatchZoom();});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&watchZoomBackdrop?.classList.contains('show')){closeWatchZoom();e.stopImmediatePropagation();return;}
 if(e.key==='Escape'&&watchConceptPanel?.classList.contains('show')){closeWatchConcept();e.stopImmediatePropagation();}
});


/* TILSMEE 1.1.0 — PUNKT 4.3: PC-ZUKUNFTSDEMO */
const pcConceptPanel=document.getElementById('pcConceptPanel');
const pcConceptClose=document.getElementById('pcConceptClose');
const pcConceptVisual=document.getElementById('pcConceptVisual');
const pcZoomBackdrop=document.getElementById('pcZoomBackdrop');
const pcZoomClose=document.getElementById('pcZoomClose');
const pcZoomMount=document.getElementById('pcZoomMount');

document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-device-demo="pc"]');
  if(trigger){e.stopPropagation();pcConceptPanel?.classList.add('show');pcConceptPanel?.setAttribute('aria-hidden','false');}
});
function closePcConcept(){pcConceptPanel?.classList.remove('show');pcConceptPanel?.setAttribute('aria-hidden','true');}
pcConceptClose?.addEventListener('click',closePcConcept);

function openPcZoom(){
  const pc=document.querySelector('#pcConceptPanel .pc-device');
  if(!pc||!pcZoomMount||!pcZoomBackdrop)return;
  pcZoomMount.innerHTML='';pcZoomMount.appendChild(pc.cloneNode(true));
  pcZoomBackdrop.classList.add('show');pcZoomBackdrop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function closePcZoom(){pcZoomBackdrop?.classList.remove('show');pcZoomBackdrop?.setAttribute('aria-hidden','true');document.body.style.overflow='';}
pcConceptVisual?.addEventListener('click',openPcZoom);
pcConceptVisual?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPcZoom();}});
pcZoomClose?.addEventListener('click',closePcZoom);
pcZoomBackdrop?.addEventListener('click',e=>{if(e.target===pcZoomBackdrop)closePcZoom();});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&pcZoomBackdrop?.classList.contains('show')){closePcZoom();e.stopImmediatePropagation();return;}
 if(e.key==='Escape'&&pcConceptPanel?.classList.contains('show')){closePcConcept();e.stopImmediatePropagation();}
});


/* TILSMEE 1.1.0 — PUNKT 4.4: AUTO-INFOTAINMENT */
const autoConceptPanel=document.getElementById('autoConceptPanel');
const autoConceptClose=document.getElementById('autoConceptClose');
const infotainmentFrame=document.getElementById('infotainmentFrame');
const autoZoomBackdrop=document.getElementById('autoZoomBackdrop');
const autoZoomClose=document.getElementById('autoZoomClose');
const autoZoomMount=document.getElementById('autoZoomMount');

document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-device-demo="auto"]');
  if(trigger){
    e.stopPropagation();
    autoConceptPanel?.classList.add('show');
    autoConceptPanel?.setAttribute('aria-hidden','false');
  }
});

function closeAutoConcept(){
  autoConceptPanel?.classList.remove('show');
  autoConceptPanel?.setAttribute('aria-hidden','true');
}
autoConceptClose?.addEventListener('click',closeAutoConcept);

function openAutoZoom(){
  const screen=document.querySelector('#autoConceptPanel .infotainment-frame');
  if(!screen||!autoZoomMount||!autoZoomBackdrop)return;
  autoZoomMount.innerHTML='';
  autoZoomMount.appendChild(screen.cloneNode(true));
  autoZoomBackdrop.classList.add('show');
  autoZoomBackdrop.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeAutoZoom(){
  autoZoomBackdrop?.classList.remove('show');
  autoZoomBackdrop?.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

infotainmentFrame?.addEventListener('click',openAutoZoom);
infotainmentFrame?.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){
    e.preventDefault();
    openAutoZoom();
  }
});

autoZoomClose?.addEventListener('click',closeAutoZoom);
autoZoomBackdrop?.addEventListener('click',e=>{
  if(e.target===autoZoomBackdrop)closeAutoZoom();
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&autoZoomBackdrop?.classList.contains('show')){
    closeAutoZoom();
    e.stopImmediatePropagation();
    return;
  }
  if(e.key==='Escape'&&autoConceptPanel?.classList.contains('show')){
    closeAutoConcept();
    e.stopImmediatePropagation();
  }
});


/* =========================================================
   TILSMEE 1.1.0 – PUNKT 5
   Studio layer controls for V8 preview
   ========================================================= */
const studioEditorWatch=document.getElementById('editorWatch');
const studioStageLabel=document.getElementById('stageLabel');
const studioLayerButtons=[...document.querySelectorAll('#studio .layer')];

const studioLayerNames={
  all:'Gesamtansicht',
  time:'Uhrzeit',
  date:'Datum',
  weather:'Wetter',
  metrics:'Aktivität',
  battery:'Akku'
};

studioLayerButtons.forEach(button=>{
  button.addEventListener('click',()=>{
    const layer=button.dataset.layer || 'all';

    studioLayerButtons.forEach(b=>b.classList.remove('active'));
    button.classList.add('active');

    studioEditorWatch?.setAttribute('data-active',layer);
    if(studioStageLabel){
      studioStageLabel.textContent=studioLayerNames[layer] || 'Gesamtansicht';
    }
  });
});


/* Interaktive Roadmap – Stand 1.1.0, Punkte 1–8 abgeschlossen */
const roadmapModal=document.getElementById('roadmapModal');
const roadmapModalInner=document.getElementById('roadmapModalInner');
const roadmapModalClose=document.getElementById('roadmapModalClose');

function closeRoadmapModal(){
  roadmapModal?.classList.remove('show');
  roadmapModal?.setAttribute('aria-hidden','true');
}

function openRoadmapModal(type){
  if(!roadmapModal||!roadmapModalInner)return;

  if(type==='homepage'){
    roadmapModalInner.innerHTML=`
      <span class="roadmap-demo-label">AKTUELLER STAND · VERSION 1.1.0</span>
      <h3 class="roadmap-demo-title">Homepage und Markenauftritt</h3>
      <p class="roadmap-demo-lead">Die öffentliche TILSMEE-Basis ist aufgebaut. Die freigegebenen Bereiche werden kontrolliert weiterentwickelt und bleiben als stabile Grundlage erhalten.</p>
      <div class="roadmap-status-grid">
        <div class="roadmap-status-card"><small>01 · START</small><strong>Markenauftritt</strong><span>TILSMEE Design, Startscreen und zentrale Smartwatch-Präsentation.</span></div>
        <div class="roadmap-status-card"><small>02–04 · VISION</small><strong>Gerätewelt</strong><span>Smartphone, Smartwatch, PC und Auto-Infotainment als Zukunftskonzepte.</span></div>
        <div class="roadmap-status-card"><small>05 · STUDIO</small><strong>WatchFace Studio</strong><span>V8-Uhr als Live-Vorschau mit kontrollierbaren Ebenen.</span></div>
      </div>
      <div class="roadmap-progress">
        <div class="roadmap-progress-head"><span>Homepage 1.1.0 · Entwicklungsstand</span><strong>Punkte 1–8 abgeschlossen</strong></div>
        <div class="roadmap-progress-track"><i></i></div>
      </div>`;
  }

  if(type==='ai'){
    roadmapModalInner.innerHTML=`
      <div class="ai-vision-shell">
        <div class="ai-vision-brain">
          <img src="brain-master.png" alt="TILSMEE Gehirn">
        </div>
        <div class="ai-console">
          <div class="ai-console-top">
            <div class="ai-console-brand"><img src="brain-master.png" alt=""><strong>TILSMEE</strong></div>
            <span class="ai-console-ready"><i></i> BEREIT</span>
          </div>
          <span class="roadmap-demo-label">ZUKUNFTSVISION · KONZEPT</span>
          <h4>Wie kann ich dir helfen?</h4>
          <p>Deine persönliche KI verbindet Sprache, Wissen, Projekte und Geräte zu einem gemeinsamen System.</p>
          <div class="ai-function-grid">
            <div class="ai-function"><b>Sprache</b><span>Natürlich mit TILSMEE sprechen</span></div>
            <div class="ai-function"><b>Projekte</b><span>Arbeitsstände weiterführen</span></div>
            <div class="ai-function"><b>Wissen</b><span>Zusammenhänge erhalten</span></div>
            <div class="ai-function"><b>Geräte</b><span>Überall dieselbe Assistenz</span></div>
          </div>
          <div class="ai-input-demo"><span>Nachricht an TILSMEE …</span><b>●</b></div>
        </div>
      </div>`;
  }

  roadmapModal.classList.add('show');
  roadmapModal.setAttribute('aria-hidden','false');
  roadmapModal.scrollTop=0;
}

document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-roadmap]');
  if(!trigger)return;

  const type=trigger.dataset.roadmap;
  if(type==='studio'){
    document.getElementById('studio')?.scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }

  if(type==='homepage'||type==='ai'){
    openRoadmapModal(type);
  }
});

roadmapModalClose?.addEventListener('click',closeRoadmapModal);

roadmapModal?.addEventListener('click',e=>{
  if(e.target===roadmapModal)closeRoadmapModal();
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&roadmapModal?.classList.contains('show')){
    closeRoadmapModal();
    e.stopImmediatePropagation();
  }
});

/* SEMIFINALE V2 — Vision / Geräte / Musik: Me, Myself and I */
const visionMusicPlayer=document.getElementById('visionMusicPlayer');
function musicTime(sec){
  if(!Number.isFinite(sec)) return '0:00';
  const m=Math.floor(sec/60), s=Math.floor(sec%60);
  return `${m}:${String(s).padStart(2,'0')}`;
}
function syncVisionMusicUI(){
  if(!visionMusicPlayer)return;
  const pct=visionMusicPlayer.duration ? (visionMusicPlayer.currentTime/visionMusicPlayer.duration)*100 : 0;
  document.querySelectorAll('[data-music-current]').forEach(el=>el.textContent=musicTime(visionMusicPlayer.currentTime));
  document.querySelectorAll('[data-music-duration]').forEach(el=>el.textContent=musicTime(visionMusicPlayer.duration||276.072));
  document.querySelectorAll('[data-music-progress] i').forEach(el=>el.style.width=`${pct}%`);
  document.querySelectorAll('.music-play-toggle').forEach(btn=>{
    btn.textContent=visionMusicPlayer.paused?'▶':'Ⅱ';
    btn.setAttribute('aria-label',visionMusicPlayer.paused?'Me, Myself and I abspielen':'Me, Myself and I pausieren');
  });
}
visionMusicPlayer?.addEventListener('loadedmetadata',syncVisionMusicUI);
visionMusicPlayer?.addEventListener('timeupdate',syncVisionMusicUI);
visionMusicPlayer?.addEventListener('play',syncVisionMusicUI);
visionMusicPlayer?.addEventListener('pause',syncVisionMusicUI);
visionMusicPlayer?.addEventListener('ended',syncVisionMusicUI);
document.addEventListener('click',e=>{
  const play=e.target.closest('.music-play-toggle');
  if(play&&visionMusicPlayer){
    e.preventDefault();e.stopPropagation();
    visionMusicPlayer.paused?visionMusicPlayer.play():visionMusicPlayer.pause();
    return;
  }
  const bar=e.target.closest('[data-music-progress]');
  if(bar&&visionMusicPlayer&&visionMusicPlayer.duration){
    e.preventDefault();e.stopPropagation();
    const r=bar.getBoundingClientRect();
    visionMusicPlayer.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*visionMusicPlayer.duration;
    syncVisionMusicUI();
  }
});
