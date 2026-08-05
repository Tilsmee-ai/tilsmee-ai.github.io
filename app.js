'use strict';

const $ = (selector) => document.querySelector(selector);
const pad = (value) => String(value).padStart(2, '0');

const state = {
  steps: 6842,
  heart: 72,
  calories: 428,
  activity: 68,
  battery: 82
};

function updateClock() {
  const now = new Date();
  $('#hours').textContent = pad(now.getHours());
  $('#minutes').textContent = pad(now.getMinutes());
  $('#seconds').textContent = pad(now.getSeconds());
  $('#dateText').textContent = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long'
  }).format(now).toUpperCase().replace(',', ' ·');
}

function renderMetrics() {
  $('#stepsValue').textContent = new Intl.NumberFormat('de-DE').format(state.steps);
  $('#heartValue').textContent = state.heart;
  $('#calorieValue').textContent = state.calories;
  $('#activityPercent').textContent = `${state.activity}%`;
  const circumference = 2 * Math.PI * 51;
  $('#activityProgress').style.strokeDasharray = circumference;
  $('#activityProgress').style.strokeDashoffset = circumference * (1 - state.activity / 100);
  $('#batteryValue').textContent = `${state.battery}%`;
  $('#batteryFill').style.width = `${state.battery}%`;
}

function showAssistantMessage(text) {
  const message = $('#assistantMessage');
  message.textContent = text;
  message.classList.add('show');
  clearTimeout(showAssistantMessage.timer);
  showAssistantMessage.timer = setTimeout(() => message.classList.remove('show'), 2600);
}

function runDemo() {
  const screen = $('#watchScreen');
  screen.classList.add('demo-active');
  $('#connectionText').textContent = 'Tilsmee hört zu …';
  showAssistantMessage('Hallo Markus. Was kann ich für dich tun?');

  state.steps += Math.floor(Math.random() * 24) + 8;
  state.heart = Math.floor(Math.random() * 8) + 69;
  state.calories += Math.floor(Math.random() * 4) + 1;
  state.activity = Math.min(100, state.activity + 1);
  renderMetrics();

  setTimeout(() => {
    screen.classList.remove('demo-active');
    $('#connectionText').textContent = 'Tilsmee ist bereit';
  }, 1500);
}

function weatherCodeToData(code) {
  if ([0].includes(code)) return ['☀', 'Klar'];
  if ([1, 2, 3].includes(code)) return ['◒', 'Bewölkt'];
  if ([45, 48].includes(code)) return ['≋', 'Nebel'];
  if ([51, 53, 55, 56, 57].includes(code)) return ['⋰', 'Nieselregen'];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['☂', 'Regen'];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['❄', 'Schnee'];
  if ([95, 96, 99].includes(code)) return ['ϟ', 'Gewitter'];
  return ['☁', 'Wetter'];
}

async function loadWeather(latitude, longitude) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Wetterdienst nicht erreichbar');
    const data = await response.json();
    const [icon, label] = weatherCodeToData(data.current.weather_code);
    $('#temperature').textContent = `${Math.round(data.current.temperature_2m)}°`;
    $('#weatherIcon').textContent = icon;
    $('#weatherLabel').textContent = label;
  } catch (error) {
    console.warn(error.message);
  }
}

function initializeWeather() {
  if (!('geolocation' in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => loadWeather(coords.latitude, coords.longitude),
    () => loadWeather(51.52, 6.33),
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
  );
}

function initializeBattery() {
  if (!navigator.getBattery) return;
  navigator.getBattery().then((battery) => {
    const update = () => {
      state.battery = Math.round(battery.level * 100);
      renderMetrics();
    };
    update();
    battery.addEventListener('levelchange', update);
  }).catch(() => {});
}

$('#demoButton').addEventListener('click', runDemo);
$('#brainButton').addEventListener('click', runDemo);
document.querySelectorAll('.metric').forEach((button) => {
  button.addEventListener('click', () => showAssistantMessage(`${button.dataset.label}: Detailansicht vorbereitet.`));
});

updateClock();
renderMetrics();
initializeWeather();
initializeBattery();
setInterval(updateClock, 1000);
