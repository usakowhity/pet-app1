// ... (冒頭のDOM取得はそのまま)

// カスタムボタン追加（これが抜けていた可能性大！！）
const customBtn = document.getElementById('custom-btn');
const customModal = document.getElementById('custom-modal');
const customName = document.getElementById('custom-name');
const customKeywords = document.getElementById('custom-keywords');
const saveCustom = document.getElementById('save-custom');
const closeModal = document.getElementById('close-modal');

// カスタム設定UI強化
customBtn.addEventListener('click', () => {
  const petData = getCurrentPetData();
  customName.value = petData.displayName || '';
  customKeywords.value = petData.keywords.join(', ');
  customModal.style.display = 'block';
  status.textContent = '呼び名を設定中...';
});

saveCustom.addEventListener('click', () => {
  customNicknames[currentPet] = {
    displayName: customName.value.trim() || currentPet,
    keywords: customKeywords.value.split(',').map(k => k.trim()).filter(k => k)
  };
  localStorage.setItem('customNicknames', JSON.stringify(customNicknames));
  customModal.style.display = 'none';
  status.textContent = `${customName.value || currentPet}の設定を保存しました！`;
});

closeModal.addEventListener('click', () => {
  customModal.style.display = 'none';
});

// マイク・カメラボタンにactiveクラス追加（視覚フィードバック）
micBtn.addEventListener('click', () => {
  micBtn.classList.toggle('active');
});
cameraBtn.addEventListener('click', () => {
  cameraBtn.classList.toggle('active');
});

// 音声認識スタート関数強化
function startMic() {
  if (recognition && recognition.running) {  // 停止処理追加
    recognition.stop();
    micBtn.classList.remove('active');
    status.textContent = '音声認識停止';
    return;
  }
  // ... (認識スタートコードそのまま)
  status.textContent = '話しかけてね！（例: かわいい, ねんね）';
}

// カメラスタート同様にステータス更新

// 初期化時にステータス設定
status.textContent = '準備完了！ペットを選んで遊んでね';

// ... (他のコードはそのまま)