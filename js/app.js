document.addEventListener("DOMContentLoaded", () => {
  if (typeof LEXICON_DATA === "undefined" || !Array.isArray(LEXICON_DATA)) {
    console.error("找不到 LEXICON_DATA，請確認 js/data.js 是否正確載入。");
    return;
  }

  let currentIndex = 0;
  let currentAudio = null;

  const alphabetList = document.getElementById("alphabet-list");
  const wordImage = document.getElementById("word-image");
  const imageFallback = document.getElementById("image-fallback");
  const fallbackCaption = document.getElementById("fallback-caption");
  const expectedImgPath = document.getElementById("expected-img-path");
  const artNote = document.getElementById("art-note");

  const letterBadge = document.getElementById("letter-badge");
  const wordTitle = document.getElementById("word-title");
  const wordPhonetic = document.getElementById("word-phonetic");
  const wordPos = document.getElementById("word-pos");
  const wordMeaning = document.getElementById("word-meaning");

  const playSource = document.getElementById("play-source");
  const quoteEn = document.getElementById("quote-en");
  const quoteZh = document.getElementById("quote-zh");
  const wordCommentary = document.getElementById("word-commentary");
  const audioStatus = document.getElementById("audio-status");
  const progressIndicator = document.getElementById("progress-indicator");

  const playWordBtn = document.getElementById("play-word-btn");
  const playQuoteBtn = document.getElementById("play-quote-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  // 1. 生成 A-Z 導覽列按鈕
  function renderAlphabetNav() {
    if (!alphabetList) return;
    alphabetList.innerHTML = "";
    LEXICON_DATA.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "alphabet-btn";
      btn.textContent = item.letter;
      btn.addEventListener("click", () => loadEntry(index));
      alphabetList.appendChild(btn);
    });
  }

  // 2. 載入指定字母的資料與油畫
  function loadEntry(index) {
    stopAudio();
    currentIndex = index;
    const item = LEXICON_DATA[index];
    if (!item) return;

    const letterLower = item.letter.toLowerCase();

    if (alphabetList) {
      const buttons = alphabetList.querySelectorAll("button");
      buttons.forEach((btn, idx) => {
        btn.classList.toggle("active", idx === index);
      });
    }

    if (letterBadge) letterBadge.textContent = item.letter;
    if (wordTitle) wordTitle.textContent = item.word;
    if (wordPhonetic) wordPhonetic.textContent = item.phonetic;
    if (wordPos) wordPos.textContent = item.pos;
    if (wordMeaning) wordMeaning.textContent = item.meaning;
    if (playSource) playSource.textContent = item.play;
    if (quoteEn) quoteEn.textContent = item.quoteEn;
    if (quoteZh) quoteZh.textContent = item.quoteZh;
    if (wordCommentary) wordCommentary.textContent = item.commentary;
    if (artNote) artNote.textContent = item.artCaption;
    if (progressIndicator) progressIndicator.textContent = `${index + 1} / ${LEXICON_DATA.length}`;

    if (wordImage) {
      wordImage.classList.remove("hidden");
      wordImage.style.display = "block";
      if (imageFallback) imageFallback.classList.add("hidden");

      const candidates = [
        item.image,
        `assets/images/${letterLower}.jpg`,
        `assets/images/${letterLower}.png`,
        `assets/images/${letterLower}.jpeg`,
        `assets/images/${item.letter}.jpg`
      ].filter(Boolean);

      let tryIdx = 0;
      wordImage.onerror = () => {
        tryIdx++;
        if (tryIdx < candidates.length) {
          wordImage.src = candidates[tryIdx];
        } else {
          wordImage.onerror = null;
          wordImage.style.display = "none";
          if (imageFallback) {
            imageFallback.classList.remove("hidden");
            if (fallbackCaption) fallbackCaption.textContent = item.artCaption;
            if (expectedImgPath) expectedImgPath.textContent = item.image;
          }
        }
      };

      wordImage.alt = item.artCaption;
      wordImage.src = candidates[0];
    }

    if (audioStatus) {
      audioStatus.textContent = `單字音檔：${item.wordAudio} ｜ 金句音檔：${item.quoteAudio}`;
    }
  }

  // 3. 停止播放音檔
  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (playWordBtn) playWordBtn.classList.remove("playing");
    if (playQuoteBtn) playQuoteBtn.classList.remove("playing");
  }

  // 4. 僅播放您自己上傳的 MP3 音檔（不再觸發瀏覽器內建語音）
  function playOwnMp3(type, triggerBtn) {
    stopAudio();
    const item = LEXICON_DATA[currentIndex];
    if (!item) return;

    const audioPath = type === "word" ? item.wordAudio : item.quoteAudio;

    if (triggerBtn) triggerBtn.classList.add("playing");
    if (audioStatus) audioStatus.textContent = `正在載入您的音檔：${audioPath}...`;

    const audio = new Audio(audioPath);
    currentAudio = audio;

    audio.onplaying = () => {
      if (audioStatus) audioStatus.textContent = `正在播放您的音檔：${audioPath}`;
    };

    audio.onended = () => {
      if (triggerBtn) triggerBtn.classList.remove("playing");
      if (audioStatus) audioStatus.textContent = `播放完畢：${audioPath}`;
      currentAudio = null;
    };

    audio.onerror = () => {
      if (triggerBtn) triggerBtn.classList.remove("playing");
      if (audioStatus) audioStatus.textContent = `尚未放入音檔，請將 MP3 存為：${audioPath}`;
      currentAudio = null;
    };

    audio.play().catch((err) => {
      console.warn("音檔播放失敗：", err);
      if (triggerBtn) triggerBtn.classList.remove("playing");
      if (audioStatus) audioStatus.textContent = `找不到音檔：${audioPath}`;
      currentAudio = null;
    });
  }

  // 5. 綁定按鈕事件
  if (playWordBtn) playWordBtn.addEventListener("click", () => playOwnMp3("word", playWordBtn));
  if (playQuoteBtn) playQuoteBtn.addEventListener("click", () => playOwnMp3("quote", playQuoteBtn));

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      loadEntry((currentIndex - 1 + LEXICON_DATA.length) % LEXICON_DATA.length);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      loadEntry((currentIndex + 1) % LEXICON_DATA.length);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && prevBtn) prevBtn.click();
    if (e.key === "ArrowRight" && nextBtn) nextBtn.click();
  });

  renderAlphabetNav();
  loadEntry(0);
});