const pageLoader = document.getElementById('pageLoader');
window.addEventListener('load', () => {
  setTimeout(() => pageLoader.classList.add('hidden'), 950);
});

document.getElementById('year').textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('hoursMinutes').textContent = `${hh}:${mm}`;
  document.getElementById('seconds').textContent = ss;

  const formatter = new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  document.getElementById('dateText').textContent = formatter.format(now).toUpperCase();
}
updateClock();
setInterval(updateClock, 1000);

const weatherMap = {
  0: ['☀', 'Klar'],
  1: ['🌤', 'Überwiegend klar'],
  2: ['⛅', 'Teilweise bewölkt'],
  3: ['☁', 'Bewölkt'],
  45: ['🌫', 'Nebel'],
  48: ['🌫', 'Reifnebel'],
  51: ['🌦', 'Leichter Nieselregen'],
  53: ['🌦', 'Nieselregen'],
  55: ['🌧', 'Starker Nieselregen'],
  61: ['🌦', 'Leichter Regen'],
  63: ['🌧', 'Regen'],
  65: ['🌧', 'Starker Regen'],
  71: ['🌨', 'Leichter Schneefall'],
  73: ['🌨', 'Schneefall'],
  75: ['❄', 'Starker Schneefall'],
  80: ['🌦', 'Regenschauer'],
  81: ['🌧', 'Starke Regenschauer'],
  82: ['⛈', 'Heftige Regenschauer'],
  95: ['⛈', 'Gewitter'],
  96: ['⛈', 'Gewitter mit Hagel'],
  99: ['⛈', 'Starkes Gewitter']
};

async function fetchWeather(lat, lon, locationLabel = '') {
  const status = document.getElementById('weatherStatus');
  status.textContent = 'Wetter wird aktualisiert …';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Wetterdienst nicht erreichbar');
    const data = await response.json();

    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const [icon, text] = weatherMap[code] || ['◌', 'Wetter'];

    document.getElementById('weatherText').textContent = `${text} · ${temp} °C`;
    status.textContent = locationLabel ? `Wetter für ${locationLabel}` : 'Wetter anhand deines Standorts';
  } catch {
    document.getElementById('weatherText').textContent = 'Wetter nicht verfügbar';
    status.textContent = 'Wetter konnte nicht geladen werden.';
  }
}

function loadWeather() {
  const status = document.getElementById('weatherStatus');

  if ('geolocation' in navigator) {
    status.textContent = 'Standortfreigabe wird geprüft …';
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(51.52, 6.32, 'Geldern'),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 900000 }
    );
  } else {
    fetchWeather(51.52, 6.32, 'Geldern');
  }
}
loadWeather();
document.getElementById('weatherButton').addEventListener('click', loadWeather);

async function loadBattery() {
  const watchBattery = document.getElementById('watchBattery');

  const applyBattery = value => {
    watchBattery.textContent = `${value}%`;
  };

  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      const update = () => applyBattery(Math.round(battery.level * 100));
      update();
      battery.addEventListener('levelchange', update);
    } else {
      applyBattery(84);
    }
  } catch {
    applyBattery(84);
  }
}
loadBattery();

const stepsElement = document.getElementById('steps');
const stepDuration = 3000;
const maxSteps = 12345;
let stepStart = performance.now();

function animateSteps(now) {
  const elapsed = (now - stepStart) % stepDuration;
  const progress = elapsed / stepDuration;
  const eased = 1 - Math.pow(1 - progress, 3);
  const value = Math.floor(maxSteps * eased);
  stepsElement.textContent = value.toLocaleString('de-DE');

  if (elapsed < 20 && now - stepStart > stepDuration) {
    stepStart = now;
  }
  requestAnimationFrame(animateSteps);
}
requestAnimationFrame(animateSteps);

const watchTilt = document.getElementById('watchTilt');
const watchShell = watchTilt.querySelector('.watch-shell');

watchTilt.addEventListener('pointermove', event => {
  const rect = watchTilt.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  watchShell.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateZ(8px)`;
});

watchTilt.addEventListener('pointerleave', () => {
  watchShell.style.transform = '';
});




const layerButtons = document.querySelectorAll('.layer-button');
const editorLabel = document.getElementById('editorLabel');
const editorWatch = document.getElementById('editorWatch');
const layerLabels = {background:'Hintergrund',time:'Uhrzeit',date:'Datum',weather:'Wetter',steps:'Schritte',battery:'Akku'};
function setEditorLayer(layer){editorLabel.textContent=layerLabels[layer]||'Hintergrund';editorWatch.dataset.activeLayer=layer;}
layerButtons.forEach(button=>{button.addEventListener('click',()=>{layerButtons.forEach(item=>item.classList.remove('active'));button.classList.add('active');setEditorLayer(button.dataset.layer);});});
setEditorLayer('background');
