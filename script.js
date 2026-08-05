'use strict';
const $ = id => document.getElementById(id);
const DAYS=['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
const MONTHS=['JANUAR','FEBRUAR','MÄRZ','APRIL','MAI','JUNI','JULI','AUGUST','SEPTEMBER','OKTOBER','NOVEMBER','DEZEMBER'];
const pad=n=>String(n).padStart(2,'0');
function updateClock(){
  const d=new Date();
  $('hours').textContent=pad(d.getHours());
  $('minutes').textContent=pad(d.getMinutes());
  $('seconds').textContent=pad(d.getSeconds());
  $('weekday').textContent=DAYS[d.getDay()];
  $('day').textContent=pad(d.getDate());
  $('month-year').textContent=`${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  $('year').textContent=d.getFullYear();
}
updateClock(); setInterval(updateClock,1000);

function formatNumber(n){return new Intl.NumberFormat('de-DE').format(n)}
let stepValue=8753;
setInterval(()=>{stepValue+=Math.floor(Math.random()*3);$('steps').textContent=formatNumber(stepValue)},12000);

async function updateBattery(){
  try{
    if(!navigator.getBattery) return;
    const b=await navigator.getBattery();
    const draw=()=>{const p=Math.round(b.level*100);$('battery-percent').textContent=`${p}%`;$('battery-fill').style.width=`${p}%`};
    draw(); b.addEventListener('levelchange',draw);
  }catch(e){console.warn('Battery API nicht verfügbar',e)}
}
updateBattery();

const weatherCodes={0:['☀','Klar'],1:['🌤','Überwiegend klar'],2:['⛅','Teilweise bewölkt'],3:['☁','Bewölkt'],45:['☁','Nebel'],48:['☁','Nebel'],51:['🌦','Nieselregen'],53:['🌦','Nieselregen'],55:['🌧','Nieselregen'],61:['🌧','Regen'],63:['🌧','Regen'],65:['🌧','Starker Regen'],71:['🌨','Schnee'],73:['🌨','Schnee'],75:['❄','Starker Schnee'],80:['🌦','Regenschauer'],81:['🌧','Regenschauer'],82:['🌧','Starke Schauer'],95:['⛈','Gewitter']};
async function loadWeather(){
  const status=$('weather-status');status.textContent='Wetterdaten werden geladen …';
  let lat=51.519,lon=6.323,place='Geldern';
  try{
    if(navigator.geolocation){
      const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000,maximumAge:600000}));
      lat=pos.coords.latitude;lon=pos.coords.longitude;place='deinem Standort';
    }
  }catch(_){place='Geldern';}
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const r=await fetch(url); if(!r.ok) throw new Error('Wetterdienst nicht erreichbar');
    const data=await r.json();
    const temp=Math.round(data.current.temperature_2m);const code=data.current.weather_code;const [icon,label]=weatherCodes[code]||['☁','Wetter'];
    $('temperature').textContent=`${temp}°`;$('weather-icon').textContent=icon;
    status.textContent=`${label} · ${temp} °C · ${place}`;
  }catch(e){status.textContent='Wetter konnte nicht geladen werden. Die Uhr läuft weiterhin lokal.';}
}
$('refresh-weather').addEventListener('click',loadWeather);loadWeather();

const menu=$('main-nav');document.querySelector('.menu-button').addEventListener('click',e=>{const open=menu.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('open')));
