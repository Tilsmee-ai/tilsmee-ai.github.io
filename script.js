const loader = document.getElementById('pageLoader');
window.addEventListener('load', () => setTimeout(() => loader.classList.add('hidden'), 1100));

document.getElementById('year').textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.navigation');
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, {threshold:.12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const stage = document.getElementById('logoStage');
const logo = stage.querySelector('.logo-depth');

stage.addEventListener('pointermove', e => {
  const r = stage.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - .5;
  const y = (e.clientY - r.top) / r.height - .5;
  logo.style.animation = 'none';
  logo.style.transform = `rotateY(${x*8}deg) rotateX(${-y*8}deg) translateZ(10px)`;
});
stage.addEventListener('pointerleave', () => {
  logo.style.transform = '';
  setTimeout(() => logo.style.animation = '', 180);
});
