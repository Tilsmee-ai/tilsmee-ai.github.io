'use strict';

function byId(id) { return document.getElementById(id); }
function setText(id, value) { const el = byId(id); if (el) el.textContent = value; }

function hideLoader() {
  const loader = byId('pageLoader');
  if (loader) loader.classList.add('hidden');
}
window.addEventListener('load', () => setTimeout(hideLoader, 450));
setTimeout(hideLoader, 2200); // Sicherheitsabschaltung

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const weekdays = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
  const months = ['JANUAR','FEBRUAR','MÄRZ','APRIL','MAI','JUNI','JULI','AUGUST','SEPTEMBER','OKTOBER','NOVEMBER','DEZEMBER'];

  setText('hours', hours);
  setText('minutes', minutes);
  setText('seconds', seconds);
  setText('weekday', weekdays[now.getDay()]);
  setText('dayNumber', String(now.getDate()).padStart(2, '0'));
  setText('monthYear', `${months[now.getMonth()]} ${now.getFullYear()}`);
  setText('year', now.getFullYear());
}

function setupReveals() {
  const elements = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.14 });
  elements.forEach(el => observer.observe(el));
}

const weatherMap = {
  0:'Klar',1:'Überwiegend klar',2:'Teilweise bewölkt',3:'Bewölkt',45:'Nebel',48:'Reifnebel',
  51:'Leichter Nieselregen',53:'Nieselregen',55:'Starker Nieselregen',61:'Leichter Regen',
  63:'Regen',65:'Starker Regen',71:'Leichter Schneefall',73:'Schneefall',75:'Starker Schneefall',
  80:'Regenschauer',81:'Starke Regenschauer',82:'Heftige Regenschauer',95:'Gewitter',96:'Gewitter mit Hagel',99:'Starkes Gewitter'
};

async function resolveLocationName(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=de`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('location');
    const data = await response.json();
    return data.city || data.locality || data.principalSubdivision || 'Aktueller Standort';
  } catch (_) {
    return 'Aktueller Standort';
  }
}

async function fetchWeather(lat, lon, fixedLabel='') {
  setText('weatherStatus', 'Wetter wird aktualisiert …');
  try {
    const label = fixedLabel || await resolveLocationName(lat, lon);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('weather');
    const data = await response.json();
    if (!data.current || typeof data.current.temperature_2m !== 'number') throw new Error('weather-data');
    const temp = Math.round(data.current.temperature_2m);
    const description = weatherMap[data.current.weather_code] || 'Wetter';
    setText('temperature', `${temp}°C`);
    setText('weatherStatus', `${label} · ${description} · ${temp}°C`);
  } catch (_) {
    setText('temperature', '--°C');
    setText('weatherStatus', 'Live-Wetter derzeit nicht verfügbar');
  }
}

function loadWeather() {
  if ('geolocation' in navigator && location.protocol !== 'file:') {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(51.519, 6.323, 'Geldern'),
      { timeout: 7000, maximumAge: 600000, enableHighAccuracy: false }
    );
  } else {
    /* Lokal geöffnete HTML-Dateien dürfen den Standort meist nicht abfragen.
       Deshalb werden für den Test echte Live-Daten für Geldern geladen. */
    fetchWeather(51.519, 6.323, 'Geldern');
  }
}

async function loadBattery() {
  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      const update = () => setText('battery', `${Math.round(battery.level * 100)}%`);
      update();
      battery.addEventListener('levelchange', update);
    } else setText('battery', '100%');
  } catch (_) { setText('battery', '100%'); }
}

function animateSteps() {
  const el = byId('steps');
  if (!el) return;
  const target = 8729;
  const start = performance.now();
  const duration = 1600;
  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString('de-DE');
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function setupTilt() {
  const area = byId('watchTilt');
  const watch = byId('referenceWatch');
  if (!area || !watch) return;
  area.addEventListener('pointermove', event => {
    const rect = area.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    watch.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(8px)`;
  });
  area.addEventListener('pointerleave', () => { watch.style.transform = ''; });
}

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  setupReveals();
  animateSteps();
  setupTilt();
  setText('heartRate', '72');
  setText('calories', '456');
  loadBattery();
  loadWeather();
  const button = byId('weatherButton');
  if (button) button.addEventListener('click', loadWeather);
});
