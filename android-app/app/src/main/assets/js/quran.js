// محرك تصفح وقراءة وسماع القرآن الكريم المتزامن مع الآيات - تطبيق GS إسلام
class QuranManager {
  constructor() {
    this.currentSurah = 1;
    this.currentAyah = 1;
    this.totalAyahsInSurah = 7;
    this.currentReciter = "ar.alafasy";
    this.fontSize = 36; // px - الحجم الافتراضي الواضح لمصحف التجويد الذهبي
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
      // 1. الانتقال التلقائي المستمر للآية التالية بسلاسة تامة وتظليلها
      if (this.currentAyah < this.totalAyahsInSurah) {
        this.playAyah(this.currentSurah, this.currentAyah + 1);
      } else {
        // 2. إذا انتهت السورة بالكامل، الانتقال التلقائي للسورة التالية
        if (this.currentSurah < 114) {
          const nextSurahNum = this.currentSurah + 1;
          if (typeof window.openSurahReader === "function") {
            window.openSurahReader(nextSurahNum, 1).then(() => {
              this.playAyah(nextSurahNum, 1);
            });
          } else {
            this.playAyah(nextSurahNum, 1);
          }
        } else {
          this.isPlaying = false;
          this.updateAudioUI();
          this.removeAyahHighlight();
        }
      }
    });

    this.audioPlayer.addEventListener("error", (e) => {
      console.warn("Audio playback error, attempting next or retry:", e);
      if (this.isPlaying && this.currentAyah < this.totalAyahsInSurah) {
        setTimeout(() => {
          this.playAyah(this.currentSurah, this.currentAyah + 1);
        }, 800);
      } else {
        this.isPlaying = false;
        this.updateAudioUI();
      }
    });
  }

  // تحويل الأرقام إلى الأرقام المشرقية العربية المستخدمة في مصحف المدينة والمصحف الذهبي
  toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[parseInt(d, 10)]);
  }

  // دالة تنظيف النص وإزالة البسملة المكررة والفواصل الداخلية بين الحروف
  cleanAyahText(text, surahNumber, ayahNumber) {
    if (!text) return "";
    let cleaned = String(text)
      .replace(/[\r\n\t]+/g, "")
      .replace(/[\u200A\u200B\u200C\u200E\u200F\u2060\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    surahNumber = parseInt(surahNumber, 10);
    ayahNumber = parseInt(ayahNumber, 10);

    // في سورة الفاتحة فقط (السورة 1)، البسملة هي الآية رقم 1
    if (surahNumber === 1 && ayahNumber === 1) {
      return cleaned;
    }

    // في كافة السور الأخرى (مثل البقرة، آل عمران، الملك، يس...) نزيل البسملة المكررة من بداية الآية 1
    if (ayahNumber === 1) {
      const basmalahRegex = /^[\s]*ب[\u0600-\u06FF\s]*?(?:ر[\u064B-\u065F]*ح[\u064B-\u065F]*[ممن][\u0600-\u06FF\s]*?)ر[\u064B-\u065F]*ح[\u064B-\u065F]*[يیى][\u064B-\u065F]*م[\u064B-\u065F]*\s*/iu;
      cleaned = cleaned.replace(basmalahRegex, "").trim();
    }

    return cleaned;
  }

  // توافق رجعي لدالة cleanAyahBasmalah
  cleanAyahBasmalah(text, surahNumber, ayahNumber) {
    return this.cleanAyahText(text, surahNumber, ayahNumber);
  }

  // تنسيق وتلوين نصوص الآيات بخط المصحف الشريف المتصل بدون تقطيع الحروف
  formatGoldenQuranText(text) {
    if (!text) return "";
    let formatted = text;

    // 1. تلوين علامات الوقف والوصل والرموز القرآنية (Waqf & Sakt Signs)
    const waqfRegex = /([\u06D6-\u06ED\u06E9\u06DB\u06DC\u06DF\u06E0\u06E2\u06E8\u08D4-\u08E1])/g;
    formatted = formatted.replace(waqfRegex, '<span class="quran-waqf-sign">$1</span>');

    // 2. إبراز لفظ الجلالة والأسماء الإلهية المقدسة باللون الذهبي البراق كالمصحف الذهبي (كلمات كاملة بدون قطع الاتصال)
    const divineRegex = /(\b(?:اللَّهِ|اللَّهُ|اللَّهَ|لِلَّهِ|بِاللَّهِ|فَلِلَّهِ|وَاللَّهُ|وَاللَّهِ|تَاللَّهِ|رَبِّ|رَبَّنَا|رَبَّكُمْ|رَبِّكَ|رَبِّكُمَا|ٱللَّهِ|ٱللَّهُ|ٱللَّهَ|ٱلرَّحْمَٰنِ|ٱلرَّحِيمِ|الرَّحْمَٰنِ|الرَّحِيمِ|الْغَفُورُ|الْعَزِيزُ|الْحَكِيمُ|الْعَلِيمُ|الْقَدِيرُ|الْخَبِيرُ|السَّمِيعُ|الْبَصِيرُ|الْمَلِكُ|الْقُدُّوسُ|السَّلَامُ|الْمُؤْمِنُ|الْمُهَيْمِنُ|الْجَبَّارُ|الْمُتَكَبِّرُ|الْخَالِقُ|الْبَارِئُ|الْمُصَوِّرُ|الْأَعْلَى|الْكَبِيرُ|الْمُتَعَالِ)\b)/g;
    formatted = formatted.replace(divineRegex, '<span class="quran-word-divine">$1</span>');

    return formatted;
  }

  // جلب نص السورة (مع دعم الكاش والعمل بدون إنترنت وإزالة البسملة المكررة)
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
      const cached = this.cachedSurahs[surahNumber];
      cached.ayahs = cached.ayahs.map(a => ({
        ...a,
        text: this.cleanAyahText(a.text, surahNumber, a.numberInSurah)
      }));
      return cached;
    }

    // 2. فحص السور المحفوظة في قاعدة البيانات المدمجة المباشرة (OFFLINE_SURAHS)
    if (typeof OFFLINE_SURAHS !== "undefined" && OFFLINE_SURAHS[surahNumber]) {
      const offlineData = OFFLINE_SURAHS[surahNumber];
      const cleaned = {
        ...offlineData,
        ayahs: offlineData.ayahs.map(a => ({
          ...a,
          text: this.cleanAyahText(a.text, surahNumber, a.numberInSurah)
        }))
      };
      this.cachedSurahs[surahNumber] = cleaned;
      return cleaned;
    }

    // 3. فحص التخزين المحلي
    try {
      const localData = localStorage.getItem(`gs_surah_${surahNumber}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        parsed.ayahs = parsed.ayahs.map(a => ({
          ...a,
          text: this.cleanAyahText(a.text, surahNumber, a.numberInSurah)
        }));
        this.cachedSurahs[surahNumber] = parsed;
        return parsed;
      }
    } catch (e) {}

    // 4. جلب من خادم القرآن الكريم السحابي (Al-Quran Cloud API)
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
              text: this.cleanAyahText(a.text, surahNumber, a.numberInSurah)
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
      console.warn("Could not fetch online surah from primary API, trying secondary...", e);
    }

    // 5. محاولة جلب بديلة سريعة
    try {
      const response2 = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmani/${surahNumber}.json`);
      if (response2.ok) {
        const json2 = await response2.json();
        if (json2 && json2.chapter) {
          const surahObj = {
            number: surahNumber,
            name: surahMeta ? surahMeta.name : `سورة ${surahNumber}`,
            englishName: surahMeta ? surahMeta.englishName : `Surah ${surahNumber}`,
            ayahs: json2.chapter.map(a => ({
              numberInSurah: a.verse,
              text: this.cleanAyahText(a.text, surahNumber, a.verse)
            }))
          };

          this.cachedSurahs[surahNumber] = surahObj;
          try {
            localStorage.setItem(`gs_surah_${surahNumber}`, JSON.stringify(surahObj));
          } catch (e) {}

          return surahObj;
        }
      }
    } catch (e2) {
      console.warn("Secondary API fetch failed:", e2);
    }

    // Fallback في حال تعذر الاتصال
    return {
      number: surahNumber,
      name: surahMeta ? surahMeta.name : `سورة ${surahNumber}`,
      ayahs: [
        { numberInSurah: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
        { numberInSurah: 2, text: "تلاوة وقراءة السورة تتطلب اتصالاً بالإنترنت للمرة الأولى ليتم حفظها تلقائياً على هاتفك للعمل أوفلاين." }
      ]
    };
  }

  getReciterSubfolder(reciterId) {
    if (typeof RECITERS_LIST !== "undefined") {
      const r = RECITERS_LIST.find(rec => rec.id === reciterId);
      if (r && r.folder) return r.folder;
    }
    return "Alafasy_128kbps";
  }

  getAyahAudioUrl(surahNumber, ayahNumber) {
    const sPadded = String(surahNumber).padStart(3, "0");
    const aPadded = String(ayahNumber).padStart(3, "0");
    const folder = this.getReciterSubfolder(this.currentReciter);
    return `https://everyayah.com/data/${folder}/${sPadded}${aPadded}.mp3`;
  }

  // تلاوة آية محددة مع التظليل والتمرير اللحظي التلقائي
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
    this.audioPlayer.load();

    const p = this.audioPlayer.play();
    if (p !== undefined) {
      p.catch(e => console.warn("Audio play prevented:", e));
    }

    this.isPlaying = true;
    this.updateAudioUI();
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
    } else if (this.currentSurah < 114) {
      const nextSurahNum = this.currentSurah + 1;
      if (typeof window.openSurahReader === "function") {
        window.openSurahReader(nextSurahNum, 1).then(() => {
          this.playAyah(nextSurahNum, 1);
        });
      } else {
        this.playAyah(nextSurahNum, 1);
      }
    }
  }

  prevAyah() {
    if (this.currentAyah > 1) {
      this.playAyah(this.currentSurah, this.currentAyah - 1);
    } else if (this.currentSurah > 1) {
      const prevSurahNum = this.currentSurah - 1;
      const prevMeta = SURAH_LIST.find(s => s.number === prevSurahNum);
      const lastAyah = prevMeta ? prevMeta.numberOfAyahs : 1;
      if (typeof window.openSurahReader === "function") {
        window.openSurahReader(prevSurahNum, lastAyah).then(() => {
          this.playAyah(prevSurahNum, lastAyah);
        });
      } else {
        this.playAyah(prevSurahNum, lastAyah);
      }
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
