// محرك تصفح وقراءة وسماع القرآن الكريم المتزامن مع الآيات - تطبيق GS إسلام
class QuranManager {
  constructor() {
    this.currentSurah = 1;
    this.currentAyah = 1;
    this.totalAyahsInSurah = 7;
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
      this.highlightActiveAyah(this.currentAyah);
    });

    this.audioPlayer.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateAudioUI();
    });

    this.audioPlayer.addEventListener("ended", () => {
      // الانتقال التلقائي للآية التالية بسلاسة وتظليلها
      if (this.currentAyah < this.totalAyahsInSurah) {
        this.playAyah(this.currentSurah, this.currentAyah + 1);
      } else {
        this.isPlaying = false;
        this.updateAudioUI();
        this.removeAyahHighlight();
      }
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

    const surahMeta = SURAH_LIST.find(s => s.number === surahNumber);
    if (surahMeta) {
      this.totalAyahsInSurah = surahMeta.numberOfAyahs;
    }

    // 1. فحص الكاش الداخلي
    if (this.cachedSurahs[surahNumber]) {
      return this.cachedSurahs[surahNumber];
    }

    // 2. فحص التخزين المحلي
    try {
      const localData = localStorage.getItem(`gs_surah_${surahNumber}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        this.cachedSurahs[surahNumber] = parsed;
        return parsed;
      }
    } catch (e) {}

    // 3. جلب من خادم القرآن الكريم السحابي (Al-Quran Cloud API)
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
      if (response.ok) {
        const json = await response.json();
        if (json.data && json.data.ayahs) {
          const surahObj = {
            number: json.data.number,
            name: json.data.name,
            englishName: json.data.englishName,
            ayahs: json.data.ayahs.map(a => ({
              numberInSurah: a.numberInSurah,
              text: a.text.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "").trim() || a.text
            }))
          };

          this.cachedSurahs[surahNumber] = surahObj;
          try {
            localStorage.setItem(`gs_surah_${surahNumber}`, JSON.stringify(surahObj));
          } catch (e) {}

          return surahObj;
        }
      }
    } catch (e) {
      console.warn("Could not fetch online surah, trying fallback", e);
    }

    // Fallback في حال تعذر الاتصال
    return {
      number: surahNumber,
      name: surahMeta ? surahMeta.name : `سورة ${surahNumber}`,
      ayahs: [
        { numberInSurah: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
        { numberInSurah: 2, text: "تلاوة وقراءة السورة تتطلب اتصالاً بالإنترنت للمرة الأولى ليتم حفظها تلقائياً على هاتفك." }
      ]
    };
  }

  getReciterSubfolder(reciterId) {
    switch (reciterId) {
      case "ar.alafasy":
        return "Alafasy_128kbps";
      case "ar.abdulbasitmurattal":
        return "Abdul_Basit_Murattal_192kbps";
      case "ar.husary":
        return "Husary_128kbps";
      case "ar.minshawi":
        return "Minshawy_Murattal_128kbps";
      case "ar.mahermuaiqly":
        return "MaherAlMuaiqly128kbps";
      case "ar.abdurrahmaansudais":
        return "Abdurrahmaan_As-Sudais_192kbps";
      default:
        return "Alafasy_128kbps";
    }
  }

  getAyahAudioUrl(surahNumber, ayahNumber) {
    const sPadded = String(surahNumber).padStart(3, "0");
    const aPadded = String(ayahNumber).padStart(3, "0");
    const folder = this.getReciterSubfolder(this.currentReciter);
    return `https://everyayah.com/data/${folder}/${sPadded}${aPadded}.mp3`;
  }

  // تلاوة آية محددة مع التظليل والتمرير اللحظي
  playAyah(surahNumber, ayahNumber) {
    surahNumber = parseInt(surahNumber, 10);
    ayahNumber = parseInt(ayahNumber, 10);
    this.currentSurah = surahNumber;
    this.currentAyah = ayahNumber;

    const surahMeta = SURAH_LIST.find(s => s.number === surahNumber);
    if (surahMeta) {
      this.totalAyahsInSurah = surahMeta.numberOfAyahs;
    }

    const audioUrl = this.getAyahAudioUrl(surahNumber, ayahNumber);
    this.audioPlayer.src = audioUrl;
    this.audioPlayer.play().catch(e => console.warn("Audio play prevented:", e));
    this.highlightActiveAyah(ayahNumber);
    this.setLastRead(surahNumber, surahMeta ? surahMeta.name : `سورة ${surahNumber}`, ayahNumber);
  }

  // تبديل التشغيل والإيقاف المؤقت
  togglePlayPause(surahNumber, startAyah = 1) {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      if (this.currentSurah === surahNumber && this.currentAyah) {
        this.playAyah(surahNumber, this.currentAyah);
      } else {
        this.playAyah(surahNumber, startAyah);
      }
    }
  }

  nextAyah() {
    if (this.currentAyah < this.totalAyahsInSurah) {
      this.playAyah(this.currentSurah, this.currentAyah + 1);
    }
  }

  prevAyah() {
    if (this.currentAyah > 1) {
      this.playAyah(this.currentSurah, this.currentAyah - 1);
    }
  }

  pauseAudio() {
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.updateAudioUI();
  }

  highlightActiveAyah(ayahNumber) {
    document.querySelectorAll(".ayah-text").forEach(el => el.classList.remove("active-reciting-ayah"));
    const activeEl = document.getElementById(`ayah-${ayahNumber}`);
    if (activeEl) {
      activeEl.classList.add("active-reciting-ayah");
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  removeAyahHighlight() {
    document.querySelectorAll(".ayah-text").forEach(el => el.classList.remove("active-reciting-ayah"));
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
