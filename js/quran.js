// محرك تصفح وقراءة وسماع القرآن الكريم - تطبيق GS إسلام
class QuranManager {
  constructor() {
    this.currentSurah = 1;
    this.currentReciter = "ar.alafasy";
    this.fontSize = 28; // px
    this.audioPlayer = new Audio();
    this.isPlaying = false;
    this.cachedSurahs = {};
    this.bookmarks = [];
    this.lastRead = { surahNumber: 1, surahName: "سورة الفاتحة", ayahNumber: 1, date: "" };

    this.loadSettings();
    this.setupAudioListeners();
  }

  loadSettings() {
    try {
      const savedFontSize = localStorage.getItem("gs_quran_font_size");
      if (savedFontSize) this.fontSize = parseInt(savedFontSize, 10);

      const savedReciter = localStorage.getItem("gs_quran_reciter");
      if (savedReciter) this.currentReciter = savedReciter;

      const savedBookmarks = localStorage.getItem("gs_quran_bookmarks");
      if (savedBookmarks) this.bookmarks = JSON.parse(savedBookmarks);

      const savedLastRead = localStorage.getItem("gs_quran_last_read");
      if (savedLastRead) this.lastRead = JSON.parse(savedLastRead);

      const savedCurrentSurah = localStorage.getItem("gs_quran_last_surah");
      if (savedCurrentSurah) this.currentSurah = parseInt(savedCurrentSurah, 10);
    } catch (e) {}
  }

  saveSettings() {
    try {
      localStorage.setItem("gs_quran_font_size", this.fontSize);
      localStorage.setItem("gs_quran_reciter", this.currentReciter);
      localStorage.setItem("gs_quran_bookmarks", JSON.stringify(this.bookmarks));
      localStorage.setItem("gs_quran_last_read", JSON.stringify(this.lastRead));
      localStorage.setItem("gs_quran_last_surah", this.currentSurah);
    } catch (e) {}
  }

  setLastRead(surahNumber, surahName, ayahNumber = 1) {
    this.lastRead = {
      surahNumber: parseInt(surahNumber, 10),
      surahName: surahName || `سورة ${surahNumber}`,
      ayahNumber: parseInt(ayahNumber, 10) || 1,
      date: new Date().toLocaleDateString("ar-SA")
    };
    this.saveSettings();
    this.updateLastReadBanner();
  }

  updateLastReadBanner() {
    const banner = document.getElementById("quran-last-read-card");
    const titleEl = document.getElementById("last-read-surah-title");
    if (banner && titleEl && this.lastRead && this.lastRead.surahNumber) {
      banner.style.display = "flex";
      const i18n = window.I18nManager;
      const ayahWord = i18n ? i18n.t("ayah") : "الآية";
      titleEl.textContent = `${this.lastRead.surahName} • ${ayahWord} ${this.lastRead.ayahNumber}`;
    }
  }

  setupAudioListeners() {
    this.audioPlayer.addEventListener("play", () => {
      this.isPlaying = true;
      this.updateAudioUI();
    });

    this.audioPlayer.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateAudioUI();
    });

    this.audioPlayer.addEventListener("ended", () => {
      this.isPlaying = false;
      this.updateAudioUI();
    });

    this.audioPlayer.addEventListener("error", (e) => {
      console.warn("Audio playback error:", e);
      this.isPlaying = false;
      this.updateAudioUI();
    });
  }

  // جلب نص السورة (مع دعم الكاش والعمل بدون إنترنت)
  async fetchSurah(surahNumber) {
    surahNumber = parseInt(surahNumber, 10);
    this.currentSurah = surahNumber;
    this.saveSettings();

    // 1. فحص الكاش الداخلي
    if (this.cachedSurahs[surahNumber]) {
      return this.cachedSurahs[surahNumber];
    }

    // 2. فحص LocalStorage
    try {
      const localStored = localStorage.getItem(`gs_surah_${surahNumber}`);
      if (localStored) {
        const parsed = JSON.parse(localStored);
        this.cachedSurahs[surahNumber] = parsed;
        return parsed;
      }
    } catch (e) {}

    // 3. فحص السور المدمجة مسبقاً (Offline)
    if (window.OFFLINE_SURAHS && window.OFFLINE_SURAHS[surahNumber]) {
      return window.OFFLINE_SURAHS[surahNumber];
    }

    // 4. جلب عبر شبكة الإنترنت العالمية
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 200 && data.data) {
          const surahData = {
            number: data.data.number,
            name: data.data.name,
            englishName: data.data.englishName,
            ayahs: data.data.ayahs.map(a => ({
              number: a.number,
              numberInSurah: a.numberInSurah,
              text: a.text
            }))
          };
          this.cachedSurahs[surahNumber] = surahData;
          try {
            localStorage.setItem(`gs_surah_${surahNumber}`, JSON.stringify(surahData));
          } catch (err) {}
          return surahData;
        }
      }
    } catch (e) {
      console.warn("Could not fetch online surah, trying fallback", e);
    }

    // Fallback في حال تعذر الاتصال
    const surahMeta = SURAH_LIST.find(s => s.number === surahNumber);
    return {
      number: surahNumber,
      name: surahMeta ? surahMeta.name : `سورة ${surahNumber}`,
      ayahs: [
        { numberInSurah: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
        { numberInSurah: 2, text: "تلاوة وقراءة السورة تتطلب اتصالاً بالإنترنت للمرة الأولى ليتم حفظها تلقائياً على هاتفك." }
      ]
    };
  }

  // تشغيل تلاوة السورة
  playSurahAudio(surahNumber, reciterId = null) {
    if (reciterId) this.currentReciter = reciterId;
    const numPadded = String(surahNumber).padStart(3, "0");

    let audioUrl = "";
    if (this.currentReciter === "ar.alafasy") {
      audioUrl = `https://server8.mp3quran.net/afs/${numPadded}.mp3`;
    } else if (this.currentReciter === "ar.abdulbasitmurattal") {
      audioUrl = `https://server7.mp3quran.net/basit/${numPadded}.mp3`;
    } else if (this.currentReciter === "ar.husary") {
      audioUrl = `https://server13.mp3quran.net/husr/${numPadded}.mp3`;
    } else if (this.currentReciter === "ar.minshawi") {
      audioUrl = `https://server10.mp3quran.net/minsh/${numPadded}.mp3`;
    } else if (this.currentReciter === "ar.mahermuaiqly") {
      audioUrl = `https://server12.mp3quran.net/maher/${numPadded}.mp3`;
    } else if (this.currentReciter === "ar.abdurrahmaansudais") {
      audioUrl = `https://server11.mp3quran.net/sds/${numPadded}.mp3`;
    } else {
      audioUrl = `https://server8.mp3quran.net/afs/${numPadded}.mp3`;
    }

    if (this.audioPlayer.src === audioUrl && !this.audioPlayer.paused) {
      this.audioPlayer.pause();
    } else {
      this.audioPlayer.src = audioUrl;
      this.audioPlayer.play().catch(e => console.warn("Audio play prevented:", e));
    }
  }

  pauseAudio() {
    this.audioPlayer.pause();
  }

  setFontSize(size) {
    this.fontSize = Math.min(48, Math.max(18, size));
    this.saveSettings();
    const readerText = document.getElementById("quran-surah-content");
    if (readerText) {
      readerText.style.fontSize = `${this.fontSize}px`;
    }
    const fontDisplay = document.getElementById("quran-font-size-display");
    if (fontDisplay) {
      fontDisplay.textContent = `${this.fontSize}px`;
    }
    const fontSlider = document.getElementById("quran-font-slider");
    if (fontSlider) {
      fontSlider.value = this.fontSize;
    }
  }

  toggleBookmark(surahNumber, surahName, ayahNumber = 1) {
    const idx = this.bookmarks.findIndex(b => b.surahNumber === surahNumber);
    if (idx > -1) {
      this.bookmarks.splice(idx, 1);
    } else {
      this.bookmarks.push({
        surahNumber,
        surahName,
        ayahNumber,
        date: new Date().toLocaleDateString("ar-SA")
      });
    }
    this.saveSettings();
    return this.isBookmarked(surahNumber);
  }

  isBookmarked(surahNumber) {
    return this.bookmarks.some(b => b.surahNumber === surahNumber);
  }

  updateAudioUI() {
    const playBtn = document.getElementById("quran-play-btn");
    const playIcon = document.getElementById("quran-play-icon");

    if (playIcon) {
      if (this.isPlaying) {
        playIcon.textContent = "⏸️";
        if (playBtn) playBtn.setAttribute("title", "إيقاف مؤقت");
      } else {
        playIcon.textContent = "▶️";
        if (playBtn) playBtn.setAttribute("title", "تشغيل التلاوة");
      }
    }
  }
}

window.QuranManager = new QuranManager();
