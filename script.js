const petSelect = document.getElementById('pet-select');
const customBtn = document.getElementById('custom-btn');
const customModal = document.getElementById('custom-modal');
const customName = document.getElementById('custom-name');
const customKeywords = document.getElementById('custom-keywords');
const saveCustom = document.getElementById('save-custom');
const closeModal = document.getElementById('close-modal');
const petVideo = document.getElementById('pet-video');
const petImg = document.getElementById('pet-img');
const status = document.getElementById('status');
const micBtn = document.getElementById('mic-btn');
const cameraBtn = document.getElementById('camera-btn');
const inputVideo = document.getElementById('input-video');
const barkSound = document.getElementById('bark-sound');
const eatingSound = document.getElementById('eating-sound');
const drinkingSound = document.getElementById('drinking-sound');

let currentPet = 'usako';
let currentState = 'n1';
let lastInteractionTime = Date.now();

let stateUntil = { p5: 0, p6: 0, p7: 0, p2: 0, p3: 0, p4: 0, n2: 0 };
let triggerFlags = { sleepNow: false };

let customNicknames = JSON.parse(localStorage.getItem('customNicknames') || '{}');

let recognition = null;
let faceMesh = null;
let camera = null;

// 撫で検知用
let touchStartX = 0;
let touchStartY = 0;
let isPetting = false;

// ペットデータ
const PET_DATA = {
  usako: { bark: 'assets/sounds/bark_rabbit.mp3', n1: 'assets/usako/n1.png', p2: 'assets/usako/p2.mp4', p5: 'assets/usako/p5.png', p6: 'assets/usako/p6.png', p7: 'assets/usako/p7.png', n3: 'assets/usako/n3.png' },
  kuro: { bark: 'assets/sounds/bark_rabbit.mp3', n1: 'assets/kuro/n1.png', /* 同様 */ },
  taro: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/taro/n1.png', /* 同様 */ },
  marple: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/marple/n1.png', /* 同様 */ },
  pochi: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/pochi/n1.png', /* 同様 */ },
  tama: { bark: 'assets/sounds/bark_cat.mp3', n1: 'assets/tama/n1.png', /* 同様 */ }
};

function getCurrentPetData() {
  const base = PET_DATA[currentPet];
  const custom = customNicknames[currentPet] || {};
  return {
    ...base,
    displayName: custom.displayName || currentPet.charAt(0).toUpperCase() + currentPet.slice(1),
    keywords: custom.keywords || []
  };
}

function loadMedia(src, isVideo = false) {
  if (isVideo || src.endsWith('.mp4')) {
    petVideo.src = src;
    petVideo.style.display = 'block';
    petImg.style.display = 'none';
    petVideo.play().catch(() => {});
  } else {
    petImg.src = src;
    petVideo.style.display = 'none';
    petImg.style.display = 'block';
  }
}

function setState(state) {
  if (currentState === state) return;
  currentState = state;
  const data = getCurrentPetData();
  eatingSound.pause();
  drinkingSound.pause();

  if (state === 'p5') loadMedia(data.p5 || data.n1);
  else if (state === 'p6') { loadMedia(data.p6 || data.n1); drinkingSound.play(); }
  else if (state === 'p7') loadMedia(data.p7 || data.n1);
  else if (state === 'p2') loadMedia(data.p2 || data.n1);
  else if (state === 'n3') loadMedia(data.n3 || data.n1);
  else loadMedia(data.n1);

  status.textContent = state === 'n3' ? 'Zzz... おやすみ〜' : state === 'p2' ? 'わーい！大好き！' : '反応中';
}

function determineState() {
  const now = Date.now();
  if (now < stateUntil.p5) return 'p5';
  if (now < stateUntil.p6) return 'p6';
  if (now < stateUntil.p7) return 'p7';
  if (now < stateUntil.p2) return 'p2';
  if (now < stateUntil.p3) return 'p3';
  if (now < stateUntil.p4) return 'p4';
  if (now < stateUntil.n2) return 'n2';

  const idle = (now - lastInteractionTime) / 1000;
  if (idle > 10 && idle <= 30) return 'p1';
  if (idle > 30 || triggerFlags.sleepNow) {
    triggerFlags.sleepNow = false;
    return 'n3';
  }
  return 'n1';
}

function triggerState(state, duration = 15) {
  stateUntil[state] = Date.now() + duration * 1000;
  lastInteractionTime = Date.now();
  setState(state);
}

function triggerP2() {
  triggerState('p2', 8);
  const barkPath = getCurrentPetData().bark;
  if (barkPath) {
    barkSound.src = barkPath;
    barkSound.play().catch(() => {});
  }
}

// 撫で検知
petArea.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  isPetting = true;
});

petArea.addEventListener('touchmove', (e) => {
  if (isPetting) {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 50 || dy > 50) {
      triggerP2();
      isPetting = false;
    }
  }
});

petArea.addEventListener('touchend', () => isPetting = false);

// 笑顔検知（変更なし）

// 音声認識（カスタムキーワード対応）
recognition.onresult = (e) => {
  const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
  lastInteractionTime = Date.now();

  const petData = getCurrentPetData();
  if (petData.keywords.some(k => text.includes(k.toLowerCase())) || text.includes(petData.displayName.toLowerCase())) {
    triggerP2();
  } else if (/かわいい|いい子|おりこう|大好き/.test(text)) {
    triggerP2();
  } // 他のコマンド省略
};

// カスタム設定UI
customBtn.addEventListener('click', () => {
  const petData = getCurrentPetData();
  customName.value = petData.displayName;
  customKeywords.value = petData.keywords.join(', ');
  customModal.style.display = 'block';
});

saveCustom.addEventListener('click', () => {
  customNicknames[currentPet] = {
    displayName: customName.value.trim(),
    keywords: customKeywords.value.split(',').map(k => k.trim()).filter(k => k)
  };
  localStorage.setItem('customNicknames', JSON.stringify(customNicknames));
  customModal.style.display = 'none';
  status.textContent = '設定保存しました！';
});

closeModal.addEventListener('click', () => customModal.style.display = 'none');

// 初期化
petSelect.addEventListener('change', (e) => {
  currentPet = e.target.value;
  setState('n1');
});
micBtn.addEventListener('click', startMic);
cameraBtn.addEventListener('click', startCamera);

setInterval(() => setState(determineState()), 500);
loadMedia(PET_DATA[currentPet].n1);