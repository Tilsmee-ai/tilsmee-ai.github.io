const loader = document.getElementById('loader');
window.addEventListener('load', () => {
  setTimeout(() => loader.classList.add('hidden'), 900);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: .14 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function updateClock() {
  const now = new Date();
  document.getElementById('timeMain').textContent =
    `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  document.getElementById('timeSeconds').textContent =
    String(now.getSeconds()).padStart(2,'0');

  document.getElementById('watchDate').textContent =
    new Intl.DateTimeFormat('de-DE', {
      weekday:'short', day:'2-digit', month:'long', year:'numeric'
    }).format(now).toUpperCase();
}
updateClock();
setInterval(updateClock, 1000);

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

    document.getElementById('watchWeather').textContent = `${condition.toUpperCase()} · ${temp} °C`;
    status.textContent = label ? `Wetter für ${label}` : 'Wetter anhand deines Standorts';
  } catch {
    document.getElementById('watchWeather').textContent = 'WETTER NICHT VERFÜGBAR';
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
document.getElementById('weatherButton').addEventListener('click', loadWeather);

async function loadBattery() {
  const element = document.getElementById('batteryValue');
  const apply = value => element.textContent = `${value}%`;

  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      const update = () => apply(Math.round(battery.level * 100));
      update();
      battery.addEventListener('levelchange', update);
    } else {
      apply(84);
    }
  } catch {
    apply(84);
  }
}
loadBattery();

const stepCounter = document.getElementById('stepCounter');
const duration = 3000;
const maxSteps = 12345;
let cycleStart = performance.now();

function animateSteps(now) {
  const progress = Math.min((now - cycleStart) / duration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  stepCounter.textContent = Math.floor(maxSteps * eased).toLocaleString('de-DE');

  if (progress >= 1) cycleStart = now;
  requestAnimationFrame(animateSteps);
}
requestAnimationFrame(animateSteps);

const watchHover = document.getElementById('watchHover');
const watchCase = watchHover.querySelector('.watch-case');

watchHover.addEventListener('pointermove', event => {
  const rect = watchHover.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - .5;
  const y = (event.clientY - rect.top) / rect.height - .5;
  watchCase.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(7px)`;
});
watchHover.addEventListener('pointerleave', () => {
  watchCase.style.transform = '';
});

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
