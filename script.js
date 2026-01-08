// DOM要素取得
const petSelect = document.getElementById('pet-select');
const petArea = document.getElementById('pet-area');
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

let touchStartX = 0;
let touchStartY = 0;
let isPetting = false;

// 鳴き声エコー防止フラグ
let isBarking = false;

// ペットデータ
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

// エコー完全防止 + 連発防止
function triggerP2() {
  if (isBarking) return;  // 鳴き声中はスキップ
  triggerState('p2', 8);
  isBarking = true;
  const barkPath = PET_DATA[currentPet].bark;
  if (barkPath) {
    barkSound.pause();
    barkSound.currentTime = 0;
    barkSound.src = barkPath;
    barkSound.play().catch(() => {});
    barkSound.onended = () => {
      isBarking = false;
    };
  } else {
    // 無音の場合も少し待つ
    setTimeout(() => { isBarking = false; }, 1000);
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

// 笑顔検知感度UP
function isSmileAndEyeOpen(landmarks) {
  if (!landmarks) return false;
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const mouthTop = landmarks[13];
  const smileRatio = Math.hypot(rightMouth.x - leftMouth.x, rightMouth.y - leftMouth.y) /
                     Math.hypot(mouthTop.y - landmarks[14].y, mouthTop.x - landmarks[14].x);

  const leftEyeOpen = Math.hypot(landmarks[159].y - landmarks[145].y);
  const rightEyeOpen = Math.hypot(landmarks[386].y - landmarks[374].y);
  const eyeOpenRatio = (leftEyeOpen + rightEyeOpen) / 2;

  return smileRatio > 2.0 && eyeOpenRatio > 0.008;
}

function onResults(results) {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    if (isSmileAndEyeOpen(results.multiFaceLandmarks[0])) {
      triggerP2();
    }
  }
}

// カメラ起動
async function startCamera() {
  if (camera) {
    camera.stop();
    if (faceMesh) faceMesh.close();
    camera = null;
    faceMesh = null;
    cameraBtn.classList.remove('active');
    status.textContent = 'カメラオフ';
    return;
  }

  faceMesh = new FaceMesh({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onResults);

  camera = new Camera(inputVideo, {
    onFrame: async () => {
      await faceMesh.send({image: inputVideo});
    },
    width: 320,
    height: 240
  });
  await camera.start().catch((err) => {
    status.textContent = 'カメラエラー: 許可を確認して再タップしてください';
    console.error(err);
  });
  cameraBtn.classList.add('active');
  status.textContent = '笑顔を見せてね！';
}

// 音声認識強化
function startMic() {
  if (recognition) {
    recognition.stop();
    recognition = null;
    micBtn.classList.remove('active');
    status.textContent = 'マイクオフ';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
    lastInteractionTime = Date.now();

    const petData = getCurrentPetData();
    const allKeywords = ['かわいい', 'いい子', 'おりこう', '大好き', '好き', '可愛い', 'いいね', 'えらい', 'すごい', ...petData.keywords.map(k => k.toLowerCase()), petData.displayName.toLowerCase()];

    if (allKeywords.some(k => text.includes(k))) {
      triggerP2();
    } else if (/ごはん|ご飯|おいしい|めし|飯/.test(text)) {
      triggerState('p5', 15);
    } else if (/水|お水|みず|飲/.test(text)) {
      triggerState('p6', 15);
    } else if (/トイレ|おしっこ|うんち|シー|しー/.test(text)) {
      triggerState('p7', 15);
    } else if (/ねんね|寝んね|ねむい|おやすみ|やすみ/.test(text)) {
      triggerFlags.sleepNow = true;
      setState('n3');
    }
  };

  recognition.onerror = (event) => {
    status.textContent = 'マイクエラー: ' + event.error + '. 許可を確認して再タップ！';
  };

  recognition.start();
  micBtn.classList.add('active');
  status.textContent = '音声認識中！話しかけてね';
}

// カスタム設定UI
customBtn.addEventListener('click', () => {
  const petData = getCurrentPetData();
  customName.value = petData.displayName || '';
  customKeywords.value = petData.keywords.join(', ');
  customModal.style.display = 'flex';
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

// ボタンイベント
micBtn.addEventListener('click', startMic);
cameraBtn.addEventListener('click', startCamera);

// ペット変更
petSelect.addEventListener('change', (e) => {
  currentPet = e.target.value;
  setState('n1');
  status.textContent = 'ペットを変更しました！';
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadMedia(PET_DATA[currentPet].n1);
  setInterval(() => setState(determineState()), 500);
  status.textContent = '準備完了！ペットを選んで遊んでね';
});