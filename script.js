import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js';

const loader = document.getElementById('loader');
window.addEventListener('load', () => {
  setTimeout(() => loader.classList.add('hidden'), 1250);
});

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

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.cinematic').forEach(el => revealObserver.observe(el));

const mouse = { x: 0, y: 0 };
const glow = document.querySelector('.mouse-glow');
window.addEventListener('pointermove', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});

document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
  });
  card.addEventListener('pointerleave', () => card.style.transform = '');
});

/* Main WebGL scene */
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02060b, 0.045);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 12);

const root = new THREE.Group();
scene.add(root);

const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a8fff,
  emissive: 0x006dcc,
  emissiveIntensity: 2.2,
  metalness: .75,
  roughness: .25
});
const silverMaterial = new THREE.MeshStandardMaterial({
  color: 0xdbe8f5,
  emissive: 0x223344,
  emissiveIntensity: .35,
  metalness: .95,
  roughness: .18
});

const outerRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, .055, 18, 180), ringMaterial);
outerRing.rotation.x = .28;
outerRing.rotation.y = -.35;
root.add(outerRing);

const innerRing = new THREE.Mesh(new THREE.TorusGeometry(2.35, .025, 12, 160), silverMaterial);
innerRing.rotation.x = -.25;
innerRing.rotation.y = .45;
root.add(innerRing);

const nodeGroup = new THREE.Group();
root.add(nodeGroup);
const nodeGeometry = new THREE.SphereGeometry(.07, 18, 18);
const nodes = [];
for (let i = 0; i < 28; i++) {
  const angle = i * 0.75;
  const radius = 1.0 + (i % 5) * .18;
  const node = new THREE.Mesh(nodeGeometry, new THREE.MeshStandardMaterial({
    color: 0x7be8ff,
    emissive: 0x00aaff,
    emissiveIntensity: 2.5
  }));
  node.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.17) * 1.45, Math.sin(angle) * .65);
  nodeGroup.add(node);
  nodes.push(node);
}

const linePoints = nodes.map(n => n.position.clone());
const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1fc8ff, transparent: true, opacity: .55 });
nodeGroup.add(new THREE.Line(lineGeometry, lineMaterial));

const particlesCount = innerWidth < 700 ? 650 : 1300;
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount; i++) {
  positions[i * 3] = (Math.random() - .5) * 32;
  positions[i * 3 + 1] = (Math.random() - .5) * 22;
  positions[i * 3 + 2] = (Math.random() - .5) * 20;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const pMat = new THREE.PointsMaterial({ color: 0x43cfff, size: .025, transparent: true, opacity: .65 });
const particleField = new THREE.Points(pGeo, pMat);
scene.add(particleField);

scene.add(new THREE.AmbientLight(0x5bbfff, 1.0));
const light1 = new THREE.PointLight(0x00aaff, 80, 35);
light1.position.set(5, 4, 6);
scene.add(light1);
const light2 = new THREE.PointLight(0xffffff, 45, 30);
light2.position.set(-5, -2, 4);
scene.add(light2);

const clock = new THREE.Clock();
function animateMain() {
  const t = clock.getElapsedTime();
  root.rotation.y += (mouse.x * .35 - root.rotation.y) * .025;
  root.rotation.x += (-mouse.y * .22 - root.rotation.x) * .025;
  root.rotation.z = Math.sin(t * .35) * .06;
  outerRing.rotation.z += .0018;
  innerRing.rotation.z -= .0012;
  nodeGroup.rotation.z = Math.sin(t * .28) * .16;

  nodes.forEach((node, i) => {
    const wave = (Math.sin(t * 3.0 - i * .45) + 1) / 2;
    node.scale.setScalar(.75 + wave * .65);
    node.material.emissiveIntensity = 1.2 + wave * 5.5;
  });

  particleField.rotation.y += .00025;
  particleField.position.x += (mouse.x * .55 - particleField.position.x) * .008;
  particleField.position.y += (mouse.y * .35 - particleField.position.y) * .008;

  const scroll = window.scrollY / Math.max(document.body.scrollHeight - innerHeight, 1);
  camera.position.z = 12 - scroll * 2.2;
  camera.position.y = -scroll * 1.4;
  camera.lookAt(0, -scroll * 1.0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animateMain);
}
animateMain();

/* 3D watch scene */
const watchCanvas = document.getElementById('watch3d');
const watchRenderer = new THREE.WebGLRenderer({ canvas: watchCanvas, antialias: true, alpha: true });
watchRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
watchRenderer.outputColorSpace = THREE.SRGBColorSpace;
const watchScene = new THREE.Scene();
const watchCamera = new THREE.PerspectiveCamera(42, 1, .1, 100);
watchCamera.position.set(0, .2, 7.4);

const watchGroup = new THREE.Group();
watchScene.add(watchGroup);

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x151d28, metalness: .9, roughness: .22 });
const edgeMat = new THREE.MeshStandardMaterial({ color: 0x718091, metalness: 1, roughness: .17 });
const faceMat = new THREE.MeshStandardMaterial({ color: 0x01060c, metalness: .3, roughness: .35, emissive: 0x00182f, emissiveIntensity: 1.4 });
const cyanMat = new THREE.MeshStandardMaterial({ color: 0x5ee6ff, emissive: 0x00aaff, emissiveIntensity: 2.6 });

const body = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, .55, 96), bodyMat);
body.rotation.x = Math.PI / 2;
watchGroup.add(body);
const edge = new THREE.Mesh(new THREE.TorusGeometry(2.18, .11, 18, 120), edgeMat);
watchGroup.add(edge);
const face = new THREE.Mesh(new THREE.CircleGeometry(2.02, 96), faceMat);
face.position.z = .31;
watchGroup.add(face);

const screenRing = new THREE.Mesh(new THREE.TorusGeometry(1.58, .025, 12, 100), cyanMat);
screenRing.position.z = .335;
watchGroup.add(screenRing);

function addBar(y, width) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(width, .055, .04), cyanMat);
  bar.position.set(0, y, .37);
  watchGroup.add(bar);
}
addBar(.55, 1.15); addBar(.30, .82); addBar(-.55, 1.35);

for (let i=0;i<3;i++) {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 16), cyanMat);
  dot.position.set(-.55 + i * .55, -.25, .39);
  watchGroup.add(dot);
}

watchScene.add(new THREE.AmbientLight(0x85cfff, 1.5));
const wl1 = new THREE.PointLight(0x00aaff, 60, 25); wl1.position.set(4,4,6); watchScene.add(wl1);
const wl2 = new THREE.PointLight(0xffffff, 35, 20); wl2.position.set(-4,-2,5); watchScene.add(wl2);

let watchPointer = {x:.25,y:-.15};
watchCanvas.addEventListener('pointermove', e => {
  const r = watchCanvas.getBoundingClientRect();
  watchPointer.x = ((e.clientX-r.left)/r.width-.5)*1.1;
  watchPointer.y = ((e.clientY-r.top)/r.height-.5)*1.0;
});

function resizeWatch() {
  const r = watchCanvas.getBoundingClientRect();
  const w = Math.max(r.width, 300);
  const h = Math.max(r.height, 300);
  watchRenderer.setSize(w, h, false);
  watchCamera.aspect = w / h;
  watchCamera.updateProjectionMatrix();
}
resizeWatch();

function animateWatch() {
  const t = clock.getElapsedTime();
  watchGroup.rotation.y += (watchPointer.x - watchGroup.rotation.y) * .035;
  watchGroup.rotation.x += (-watchPointer.y - watchGroup.rotation.x) * .035;
  watchGroup.rotation.z = Math.sin(t*.65)*.035;
  screenRing.material.emissiveIntensity = 2.1 + (Math.sin(t*2.2)+1)*.7;
  watchRenderer.render(watchScene, watchCamera);
  requestAnimationFrame(animateWatch);
}
animateWatch();

window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  resizeWatch();
});
