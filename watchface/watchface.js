const ring=document.getElementById("secondRing");
const watch=document.getElementById("watch");
const brain=document.querySelector(".brain-module");
const brainButton=document.getElementById("brainButton");
const brainMessage=document.getElementById("brainMessage");

const pad=n=>String(n).padStart(2,"0");
const days=["SONNTAG","MONTAG","DIENSTAG","MITTWOCH","DONNERSTAG","FREITAG","SAMSTAG"];
const months=["JANUAR","FEBRUAR","MÄRZ","APRIL","MAI","JUNI","JULI","AUGUST","SEPTEMBER","OKTOBER","NOVEMBER","DEZEMBER"];

let brainMessageTimer;

function buildTicks(){
  ring.innerHTML="";
  const radius=watch.clientWidth/2-22;

  for(let i=0;i<60;i++){
    const tick=document.createElement("i");
    tick.className="tick"+(i%5===0?" major":"");
    tick.dataset.sec=i;
    tick.style.transform=
      `translate(-50%,-50%) rotate(${i*6}deg) translateY(-${radius}px)`;
    ring.appendChild(tick);
  }
}

function updateClock(){
  const now=new Date();
  const seconds=now.getSeconds();

  document.getElementById("time").textContent=
    `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById("seconds").textContent=pad(seconds);
  document.getElementById("weekday").textContent=days[now.getDay()];
  document.getElementById("day").textContent=pad(now.getDate());
  document.getElementById("monthYear").textContent=
    `${months[now.getMonth()]} ${now.getFullYear()}`;

  ring.querySelectorAll(".tick").forEach((tick,index)=>{
    tick.classList.toggle("active",index===seconds);
  });
}

function showBrainMessage(){
  brain.classList.add("pulse");
  brainMessage.classList.add("show");
  clearTimeout(brainMessageTimer);

  brainMessageTimer=setTimeout(()=>{
    brainMessage.classList.remove("show");
  },2200);
}

function buildCircuits(){
  const group=document.getElementById("circuitLines");
  let markup="";

  for(let i=0;i<14;i++){
    const x=45+i*46;
    const end=360+(i-6.5)*10;
    markup+=`<path d="M${x} 170 V${90+(i%4)*12} L${end} 28 V0"/>`;
  }

  group.innerHTML=markup;
}

function applyHomepageWeather(data){
  const temperature=document.getElementById("temperature");
  if(!temperature)return;

  const value=Number(data.temperature);
  if(Number.isFinite(value)){
    temperature.textContent=`${Math.round(value)}°C`;
  }
}

function applyHomepageBattery(data){
  const batteryValue=document.getElementById("batteryValue");
  if(!batteryValue)return;

  const value=Number(data.value);
  if(Number.isFinite(value)){
    batteryValue.textContent=`${Math.round(value)}%`;
  }
}

brainButton.addEventListener("click",()=>{
  showBrainMessage();
  window.parent.postMessage({type:"tilsmee-brain-click"},"*");
});

window.addEventListener("message",event=>{
  const data=event.data||{};

  if(data.type==="tilsmee-weather"){
    applyHomepageWeather(data);
  }

  if(data.type==="tilsmee-battery"){
    applyHomepageBattery(data);
  }
});

window.addEventListener("resize",buildTicks);

buildTicks();
buildCircuits();
updateClock();
setInterval(updateClock,250);
brain.classList.add("pulse");
