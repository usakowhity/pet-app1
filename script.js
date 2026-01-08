const petSelect = document.getElementById('pet-select');
const petArea = document.getElementById('pet-area');  // ← これを追加！！（撫で検知に必須）
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

// ペットデータ（パス確認済みでOK）
const PET_DATA = {
  usako: { bark: 'assets/sounds/bark_rabbit.mp3', n1: 'assets/usako/n1.png', p2: 'assets/usako/p2.mp4', p5: 'assets/usako/p5.png', p6: 'assets/usako/p6.png', p7: 'assets/usako/p7.png', n3: 'assets/usako/n3.mp4' },
  kuro: { bark: 'assets/sounds/bark_rabbit.mp3', n1: 'assets/kuro/n1.mp4', p2: 'assets/kuro/p2.mp4', p5: 'assets/kuro/p5.mp4', p6: 'assets/kuro/p6.png', p7: 'assets/kuro/p7.png', n3: 'assets/kuro/n3.mp4' },
  taro: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/taro/n1.png', p2: 'assets/taro/p2.png', p5: 'assets/taro/p5.png', p6: 'assets/taro/p6.png', p7: 'assets/taro/p7.png', n3: 'assets/taro/n3.png' },
  marple: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/marple/n1.png', p2: 'assets/marple/p2.png', p5: 'assets/marple/p5.png', p6: 'assets/marple/p6.png', p7: 'assets/marple/p7.png', n3: 'assets/marple/n3.png' },
  pochi: { bark: 'assets/sounds/bark_dog.mp3', n1: 'assets/pochi/n1.png', p2: 'assets/pochi/p2.png', p5: 'assets/pochi/p5.png', p6: 'assets/pochi/p6.png', p7: 'assets/pochi/p7.png', n3: 'assets/pochi/n3.png' },
  tama: { bark: 'assets/sounds/bark_cat.mp3', n1: 'assets/tama/n1.png', p2: 'assets/tama/p2.png', p5: 'assets/tama/p5.png', p6: 'assets/tama/p6.png', p7: 'assets/tama/p7.png', n3: 'assets/tama/n3.png' }
};

// 以下は変更なし（getCurrentPetData, loadMedia, setState, determineState, triggerState, triggerP2, 撫で検知, 笑顔検知, カメラ, 音声認識, カスタムUI, 初期化）

// 初期ロード
loadMedia(PET_DATA[currentPet].n1);

// 定期状態更新
setInterval(() => setState(determineState()), 500);