document.addEventListener("DOMContentLoaded", () => {
  const alphabetListEl = document.getElementById("alphabet-list");
  const lexiconCardEl = document.getElementById("lexicon-card");
  const letterBadgeEl = document.getElementById("letter-badge");
  const wordTitleEl = document.getElementById("word-title");
  const wordPhoneticEl = document.getElementById("word-phonetic");
  const wordPosEl = document.getElementById("word-pos");
  const wordMeaningEl = document.getElementById("word-meaning");
  const playSourceEl = document.getElementById("play-source");
  const quoteEnEl = document.getElementById("quote-en");
  const quoteZhEl = document.getElementById("quote-zh");
  const wordCommentaryEl = document.getElementById("word-commentary");
  const artNoteEl = document.getElementById("art-note");

  const wordImageEl = document.getElementById("word-image");
  const imageFallbackEl = document.getElementById("image-fallback");
  const fallbackCaptionEl = document.getElementById("fallback-caption");
  const expectedImgPathEl = document.getElementById("expected-img-path");

  const playWordBtn = document.getElementById("play-word-btn");
  const playQuoteBtn = document.getElementById("play-quote-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const progressIndicatorEl = document.getElementById("progress-indicator");
  const audioStatusEl = document.getElementById("audio-status");
  const audioPlayer = document.getElementById("audio-player");

  let currentIndex = 0;
  let activeAudioBtn = null;
  let activeAudioType = null; // "word" 或 "quote"
  let activeLabel = "";

  // 恢復兩顆音檔按鈕為預設外觀
  function resetAudioButtonsUI() {
    playWordBtn.classList.remove("playing", "paused");
    playWordBtn.innerHTML = `<span class="icon">🔊</span> 單字發音`;

    playQuoteBtn.classList.remove("playing", "paused");
    playQuoteBtn.innerHTML = `<span class="icon">🎙️</span> 朗讀金句`;
  }

  // 完全停止音檔（切換單字或翻頁時呼叫）
  function stopCurrentAudio() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.removeAttribute("src");
    activeAudioBtn = null;
    activeAudioType = null;
    activeLabel = "";
    resetAudioButtonsUI();
  }

  // 智慧切換播放 / 暫停 / 繼續接續播放
  function toggleLocalAudio(type, primarySrc, fallbackSrc, buttonEl, label) {
    // 情況 1：點擊的是「同一顆」正在播放或暫停中的按鈕 -> 執行暫停或繼續
    if (activeAudioType === type && audioPlayer.src) {
      if (!audioPlayer.paused) {
        // 正在播放 -> 暫停
        audioPlayer.pause();
        buttonEl.classList.remove("playing");
        buttonEl.classList.add("paused");
        buttonEl.innerHTML = type === "quote"
          ? `<span class="icon">▶</span> 繼續朗讀`
          : `<span class="icon">▶</span> 繼續發音`;
        audioStatusEl.textContent = `已暫停：${label}（再按一次繼續）`;
      } else {
        // 暫停中 -> 從原處接續播放
        audioPlayer.play().then(() => {
          buttonEl.classList.remove("paused");
          buttonEl.classList.add("playing");
          buttonEl.innerHTML = type === "quote"
            ? `<span class="icon">⏸</span> 暫停朗讀`
            : `<span class="icon">⏸</span> 暫停發音`;
          audioStatusEl.textContent = `正在聆聽：${label}…`;
        }).catch(() => {
          stopCurrentAudio();
        });
      }
      return;
    }

    // 情況 2：點擊的是新的音檔（或剛播完重新開始）
    stopCurrentAudio();
    activeAudioBtn = buttonEl;
    activeAudioType = type;
    activeLabel = label;

    buttonEl.classList.add("playing");
    buttonEl.innerHTML = type === "quote"
      ? `<span class="icon">⏸</span> 暫停朗讀`
      : `<span class="icon">⏸</span> 暫停發音`;
    audioStatusEl.textContent = `正在聆聽：${label}…`;

    audioPlayer.src = primarySrc;
    audioPlayer.play().catch(() => {
      if (fallbackSrc && fallbackSrc !== primarySrc) {
        audioPlayer.src = fallbackSrc;
        audioPlayer.play().catch(() => {
          stopCurrentAudio();
          audioStatusEl.textContent = `找不到音檔（${primarySrc} 或 ${fallbackSrc}），請確認檔案已上傳。`;
        });
      } else {
        stopCurrentAudio();
        audioStatusEl.textContent = `找不到音檔（${primarySrc}），請確認檔案已上傳。`;
      }
    });
  }

  // 音檔自然播放結束時，自動恢復按鈕狀態
  audioPlayer.addEventListener("ended", () => {
    stopCurrentAudio();
    audioStatusEl.textContent = "";
  });

  function buildAlphabetNav() {
    alphabetListEl.innerHTML = "";
    LEXICON_DATA.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "alpha-btn";
      btn.textContent = item.letter;
      btn.title = `${item.letter} — ${item.word}`;
      btn.dataset.index = index;
      btn.addEventListener("click", () => switchToIndex(index));
      alphabetListEl.appendChild(btn);
    });
  }

  function switchToIndex(index) {
    if (index === currentIndex && wordTitleEl.textContent === LEXICON_DATA[index].word) {
      return;
    }
    lexiconCardEl.classList.add("fade-switch");
    setTimeout(() => {
      renderEntry(index);
      lexiconCardEl.classList.remove("fade-switch");
    }, 140);
  }

  function renderEntry(index) {
    currentIndex = (index + LEXICON_DATA.length) % LEXICON_DATA.length;
    const entry = LEXICON_DATA[currentIndex];
    const lowerLetter = entry.letter.toLowerCase();

    stopCurrentAudio();
    audioStatusEl.textContent = "";

    const alphaBtns = alphabetListEl.querySelectorAll(".alpha-btn");
    alphaBtns.forEach((btn, idx) => {
      btn.classList.toggle("active", idx === currentIndex);
    });

    letterBadgeEl.textContent = entry.letter;
    wordTitleEl.textContent = entry.word;
    wordPhoneticEl.textContent = entry.phonetic;
    wordPosEl.textContent = entry.pos;
    wordMeaningEl.textContent = entry.meaning;
    playSourceEl.textContent = entry.play;
    quoteEnEl.textContent = `“${entry.quoteEn}”`;
    quoteZhEl.textContent = entry.quoteZh;
    wordCommentaryEl.textContent = entry.commentary;

    artNoteEl.textContent = "";
    artNoteEl.style.display = "none";

    progressIndicatorEl.textContent = `FOLIO ${currentIndex + 1} / ${LEXICON_DATA.length}`;

    const imgPath = entry.image || `assets/images/${lowerLetter}.jpg`;
    imageFallbackEl.classList.add("hidden");
    wordImageEl.style.display = "block";
    wordImageEl.alt = `${entry.word} 印象派油畫`;

    wordImageEl.onerror = () => {
      wordImageEl.style.display = "none";
      imageFallbackEl.classList.remove("hidden");
      fallbackCaptionEl.textContent = entry.artCaption || entry.word;
      expectedImgPathEl.textContent = imgPath;
    };
    wordImageEl.src = imgPath;

    // 綁定智慧切換按鈕（播放 / 暫停 / 繼續）
    playWordBtn.onclick = () => {
      toggleLocalAudio(
        "word",
        `assets/audio/words/${lowerLetter}.mp3`,
        entry.wordAudio,
        playWordBtn,
        `${entry.word} 單字發音`
      );
    };

    playQuoteBtn.onclick = () => {
      toggleLocalAudio(
        "quote",
        `assets/audio/quotes/${lowerLetter}_quote.mp3`,
        entry.quoteAudio,
        playQuoteBtn,
        `《${entry.play}》金句朗讀`
      );
    };
  }

  prevBtn.addEventListener("click", () => switchToIndex(currentIndex - 1));
  nextBtn.addEventListener("click", () => switchToIndex(currentIndex + 1));

  // 鍵盤操作：左右方向鍵翻頁 + A-Z 字母跳轉 + 空白鍵暫停/繼續金句朗讀
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      switchToIndex(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      switchToIndex(currentIndex + 1);
    } else if (event.code === "Space") {
      event.preventDefault();
      if (activeAudioType === "word") {
        playWordBtn.click();
      } else {
        playQuoteBtn.click();
      }
    } else if (/^[a-zA-Z]$/.test(event.key)) {
      const targetLetter = event.key.toUpperCase();
      const foundIndex = LEXICON_DATA.findIndex((item) => item.letter === targetLetter);
      if (foundIndex !== -1) {
        switchToIndex(foundIndex);
      }
    }
  });

  buildAlphabetNav();
  renderEntry(0);
});