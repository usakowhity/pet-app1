// DOM要素取得（すべて冒頭で定義）
const petSelect = document.getElementById('pet-select');
const petArea = document.getElementById('pet-area');  // 撫で検知必須
const customBtn = document.getElementById('custom-btn');  // ← 追加！！
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

let touchStartX = 0;
let touchStartY = 0;
let isPetting = false;

// ペットデータ（あなたのassets構成に一致）
const PET_DATA = {
  usako: { bark: 'assets/sounds/bark_rabbit.mp3', n1: 'assets/usako/n1.png', p2: 'assets/usako/p2.mp4', p5: 'assets/usako/p5.mp4', p6: 'assets/usako/p6.png', p7: 'assets/usako/p7.png', n3: 'assets/usako/n3.mp4' },
  kuro: { bark: 'assets/sounds/bark_rabbit.mp3', n1: 'assets/kuro/n1.mp4', p2: 'assets/kuro/p2.mp4', p5: 'assets/kuro/p5.mp4', p6: 'assets/kuro/p6.png', p7: 'assets/kuro/p7.png', n3: 'assets/kuro/n3.mp4' },
  taro: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/taro/n1.png', p2: 'assets/taro/p2.png', p5: 'assets/taro/p5.png', p6: 'assets/taro/p6.png', p7: 'assets/taro/p7.png', n3: 'assets/taro/n3.png' },
  marple: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/marple/n1.png', p2: 'assets/marple/p2.png', p5: 'assets/marple/p5.png', p6: 'assets/marple/p6.png', p7: 'assets/marple/p7.png', n3: 'assets/marple/n3.png' },
  pochi: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/pochi/n1.png', p2: 'assets/pochi/p2.png', p5: 'assets/pochi/p5.png', p6: 'assets/pochi/p6.png', p7: 'assets/pochi/p7.png', n3: 'assets/pochi/n3.png' },
  tama: { bark: 'assets/sounds/bark_cat.mp3', n1: 'assets/tama/n1.png', p2: 'assets/tama/p2.png', p5: 'assets/tama/p5.png', p6: 'assets/tama/p6.png', p7: 'assets/tama/p7.png', n3: 'assets/tama/n3.png' }
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
  if (!src) src = 'assets/common/placeholder.png';
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
  const data = PET_DATA[currentPet];
  eatingSound.pause();
  drinkingSound.pause();

  let src;
  if (state === 'p5') src = data.p5;
  else if (state === 'p6') src = data.p6;
  else if (state === 'p7') src = data.p7;
  else if (state === 'p2') src = data.p2;
  else if (state === 'n3') src = data.n3;
  else src = data.n1;

  const isVideo = src && src.endsWith('.mp4');
  loadMedia(src, isVideo);

  if (state === 'p6') drinkingSound.play().catch(() => {});
  if (state === 'p5') eatingSound.play().catch(() => {});

  status.textContent = state === 'n3' ? 'Zzz... おやすみ〜' : state === 'p2' ? 'わーい！大好き！' : '反応中';
}

function determineState() {
  const now = Date.now();
  if (now < stateUntil.p5) return 'p5';
  if (now < stateUntil.p6) return 'p6';
  if (now < stateUntil.p7) return 'p7';
  if (now < stateUntil.p2) return 'p2';

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
  const barkPath = PET_DATA[currentPet].bark;
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

// カスタム設定UI強化
customBtn.addEventListener('click', () => {
  const petData = getCurrentPetData();
  customName.value = petData.displayName || '';
  customKeywords.value = petData.keywords.join(', ');
  customModal.style.display = 'flex';  // 中央寄せ
  status.textContent = '呼び名を設定中...';
});

saveCustom.addEventListener('click', () => {
  const newName = customName.value.trim();
  const newKeywords = customKeywords.value.split(',').map(k => k.trim()).filter(k => k);

  customNicknames[currentPet] = {
    displayName: newName || currentPet,
    keywords: newKeywords
  };
  localStorage.setItem('customNicknames', JSON.stringify(customNicknames));
  customModal.style.display = 'none';
  status.textContent = `${newName || currentPet}の設定を保存しました！`;
});

closeModal.addEventListener('click', () => {
  customModal.style.display = 'none';
});

// マイク・カメラボタン視覚フィードバック
micBtn.addEventListener('click', () => {
  micBtn.classList.toggle('active');
  status.textContent = micBtn.classList.contains('active') ? '音声認識中！話しかけてね' : 'マイクオフ';
  startMic();  // 関数呼び出し
});

cameraBtn.addEventListener('click', () => {
  cameraBtn.classList.toggle('active');
  status.textContent = cameraBtn.classList.contains('active') ? '笑顔を見せてね！' : 'カメラオフ';
  startCamera();
});

// 笑顔検知・音声認識関数（変更なし、省略）

// 初期化
petSelect.addEventListener('change', (e) => {
  currentPet = e.target.value;
  setState('n1');
});

document.addEventListener('DOMContentLoaded', () => {
  loadMedia(PET_DATA[currentPet].n1);
  setInterval(() => setState(determineState()), 500);
  status.textContent = '準備完了！ペットを選んで遊んでね';
});