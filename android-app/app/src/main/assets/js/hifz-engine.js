// محرك خطط الحفظ والمراجعة واختبار المحفوظ وشارات الحفّاظ والتسميع الذكي - GS إسلام
class HifzEngine {
  constructor() {
    this.plans = [];
    this.activePlanId = "juz30";
    this.memorizedAyahs = {}; // { "surahNumber": [ayahNums] }
    this.hafizBadges = {}; // { "surah_ayah_word": { level: 1|2|3, note: "", date: "" } }
    this.streakCount = 1;
    this.lastActiveDate = new Date().toDateString();

    // إعدادات التسميع الذكي
    this.recitationStrictness = "medium"; // easy | medium | strict
    this.recitationMode = "voice"; // voice | text
    this.activeRecitation = {
      surahNumber: 1,
      startAyah: 1,
      endAyah: 7,
      currentAyah: 1,
      wordsState: [], // [{ text, status: 'pending'|'correct'|'corrected'|'error', recognizedText }]
      isListening: false
    };

    // إعدادات اختبار المحفوظ
    this.activeQuiz = {
      mode: "complete_ayah",
      surahs: [1, 112, 113, 114],
      questions: [],
      currentIndex: 0,
      score: 0,
      totalQuestions: 5,
      mistakes: []
    };

    this.loadData();
  }

  loadData() {
    try {
      const savedPlans = localStorage.getItem("gs_hifz_plans");
      if (savedPlans) this.plans = JSON.parse(savedPlans);
      else this.initDefaultPlans();

      const savedActivePlan = localStorage.getItem("gs_active_plan_id");
      if (savedActivePlan) this.activePlanId = savedActivePlan;

      const savedMemorized = localStorage.getItem("gs_memorized_ayahs");
      if (savedMemorized) this.memorizedAyahs = JSON.parse(savedMemorized);

      const savedBadges = localStorage.getItem("gs_hafiz_badges");
      if (savedBadges) this.hafizBadges = JSON.parse(savedBadges);

      const savedStrictness = localStorage.getItem("gs_recitation_strictness");
      if (savedStrictness) this.recitationStrictness = savedStrictness;

      const savedStreak = localStorage.getItem("gs_hifz_streak");
      if (savedStreak) this.streakCount = parseInt(savedStreak, 10);
    } catch (e) {
      this.initDefaultPlans();
    }
  }

  saveData() {
    try {
      localStorage.setItem("gs_hifz_plans", JSON.stringify(this.plans));
      localStorage.setItem("gs_active_plan_id", this.activePlanId);
      localStorage.setItem("gs_memorized_ayahs", JSON.stringify(this.memorizedAyahs));
      localStorage.setItem("gs_hafiz_badges", JSON.stringify(this.hafizBadges));
      localStorage.setItem("gs_recitation_strictness", this.recitationStrictness);
      localStorage.setItem("gs_hifz_streak", this.streakCount.toString());
    } catch (e) {}
  }

  initDefaultPlans() {
    this.plans = [
      {
        id: "juz30",
        name: "خطة حفظ جزء عمّ (الجزء 30)",
        icon: "🌟",
        startSurah: 78,
        endSurah: 114,
        totalAyahs: 564,
        dailyTargetAyahs: 10,
        desc: "الخطة الذهبية الأساسية لإتقان حفظ جزء عم كاملاً بتدرج ميسر."
      },
      {
        id: "juz29",
        name: "خطة حفظ جزء تبارك (الجزء 29)",
        icon: "✨",
        startSurah: 67,
        endSurah: 77,
        totalAyahs: 431,
        dailyTargetAyahs: 8,
        desc: "حفظ متقن لجزء تبارك من سورة الملك حتى سورة المرسلات."
      },
      {
        id: "baqarah",
        name: "خطة حفظ سورة البقرة المباركة",
        icon: "👑",
        startSurah: 2,
        endSurah: 2,
        totalAyahs: 286,
        dailyTargetAyahs: 5,
        desc: "سنام القرآن وحصن المسلم المنيع بحفظ يومي منتظم."
      },
      {
        id: "monthly_revision",
        name: "خطة المراجعة الشهرية للقرآن",
        icon: "🔄",
        startSurah: 1,
        endSurah: 114,
        totalAyahs: 6236,
        dailyTargetAyahs: 200,
        desc: "تثبيت ومراجعة مستمرة لكامل السور والمحفوظ."
      }
    ];
  }

  // ==================== 1. خطط الحفظ والمراجعة ومتابعة الإنجاز ====================
  getActivePlan() {
    return this.plans.find(p => p.id === this.activePlanId) || this.plans[0];
  }

  setActivePlan(planId) {
    this.activePlanId = planId;
    this.saveData();
  }

  toggleAyahMemorized(surahNumber, ayahNumber) {
    surahNumber = parseInt(surahNumber, 10);
    ayahNumber = parseInt(ayahNumber, 10);
    if (!this.memorizedAyahs[surahNumber]) {
      this.memorizedAyahs[surahNumber] = [];
    }
    const idx = this.memorizedAyahs[surahNumber].indexOf(ayahNumber);
    if (idx > -1) {
      this.memorizedAyahs[surahNumber].splice(idx, 1);
    } else {
      this.memorizedAyahs[surahNumber].push(ayahNumber);
    }
    this.saveData();
    return this.isAyahMemorized(surahNumber, ayahNumber);
  }

  isAyahMemorized(surahNumber, ayahNumber) {
    return !!(this.memorizedAyahs[surahNumber] && this.memorizedAyahs[surahNumber].includes(ayahNumber));
  }

  calculatePlanProgress(plan) {
    if (!plan) plan = this.getActivePlan();
    let memorizedCount = 0;
    for (let s = plan.startSurah; s <= plan.endSurah; s++) {
      if (this.memorizedAyahs[s]) {
        memorizedCount += this.memorizedAyahs[s].length;
      }
    }
    const percent = plan.totalAyahs > 0 ? Math.min(100, Math.round((memorizedCount / plan.totalAyahs) * 100)) : 0;
    return {
      memorizedCount,
      totalAyahs: plan.totalAyahs,
      percentage: percent,
      remaining: Math.max(0, plan.totalAyahs - memorizedCount)
    };
  }

  // ==================== 2. شارات وعلامات تنبيه الحفّاظ (مواضع التردد والخطأ) ====================
  setHafizBadge(surahNumber, ayahNumber, wordIndex, level, note = "") {
    const key = `${surahNumber}_${ayahNumber}_${wordIndex}`;
    this.hafizBadges[key] = {
      surahNumber: parseInt(surahNumber, 10),
      ayahNumber: parseInt(ayahNumber, 10),
      wordIndex: parseInt(wordIndex, 10),
      level: parseInt(level, 10), // 1 = أصفر (تردد), 2 = برتقالي (خطأ متكرر), 3 = أحمر (نسيان)
      note: note.trim(),
      date: new Date().toLocaleDateString("ar-SA")
    };
    this.saveData();
    return this.hafizBadges[key];
  }

  removeHafizBadge(surahNumber, ayahNumber, wordIndex) {
    const key = `${surahNumber}_${ayahNumber}_${wordIndex}`;
    if (this.hafizBadges[key]) {
      delete this.hafizBadges[key];
      this.saveData();
    }
  }

  getBadge(surahNumber, ayahNumber, wordIndex = 0) {
    const key = `${surahNumber}_${ayahNumber}_${wordIndex}`;
    return this.hafizBadges[key] || null;
  }

  getAllBadgesList() {
    return Object.keys(this.hafizBadges).map(k => this.hafizBadges[k]);
  }

  // ==================== 3. محرك التسميع الذكي المتطور (Smart Recitation) ====================
  normalizeArabicText(text, strictness = "medium") {
    if (!text) return "";
    let clean = text.trim();

    if (strictness === "easy") {
      // تساهل كامل في التشكيل والهمزات والتاء المربوطة والألف اللينة
      clean = clean
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // إزالة الحركات والتنوين
        .replace(/[إأآٱ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/[^\u0621-\u064A\s]/g, "") // إزالة الرموز والأرقام
        .replace(/\s+/g, " ");
    } else if (strictness === "medium") {
      // مطابقة الكلمات والهمزات مع مرونة في التشكيل وعلامات الوقف
      clean = clean
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
        .replace(/[ٱ]/g, "ا")
        .replace(/\s+/g, " ");
    } else {
      // تدقيق متقن مع الحفاظ على بنية الكلمات
      clean = clean.replace(/[\u06D6-\u06ED]/g, "").replace(/\s+/g, " ");
    }
    return clean;
  }

  compareRecitation(expectedText, utteredText, strictness = "medium") {
    const normExpected = this.normalizeArabicText(expectedText, strictness);
    const normUttered = this.normalizeArabicText(utteredText, strictness);

    const expWords = normExpected.split(" ").filter(w => w.length > 0);
    const uttWords = normUttered.split(" ").filter(w => w.length > 0);

    const wordResults = [];
    let correctCount = 0;

    expWords.forEach((expW, idx) => {
      const uttW = uttWords[idx] || "";
      let isMatch = false;

      if (strictness === "easy") {
        isMatch = (expW === uttW) || (uttW && (expW.includes(uttW) || uttW.includes(expW)));
      } else {
        isMatch = (expW === uttW);
      }

      if (isMatch) correctCount++;

      wordResults.push({
        expected: expW,
        uttered: uttW,
        isCorrect: isMatch
      });
    });

    const isAyahPassed = correctCount === expWords.length || (strictness === "easy" && (correctCount / expWords.length) >= 0.75);

    return {
      isAyahPassed,
      accuracy: Math.round((correctCount / Math.max(1, expWords.length)) * 100),
      wordResults
    };
  }

  // ==================== 4. محرك اختبار المحفوظ والتقييم والعلامات (Quiz Arena) ====================
  generateQuizQuestions(surahNumbers = [1, 112, 113, 114], count = 5) {
    const questions = [];
    const surahPool = SURAH_LIST.filter(s => surahNumbers.includes(s.number));

    for (let i = 0; i < count; i++) {
      const randomSurah = surahPool[Math.floor(Math.random() * surahPool.length)] || SURAH_LIST[0];
      const offlineData = (typeof OFFLINE_SURAHS !== "undefined" && OFFLINE_SURAHS[randomSurah.number]) || null;
      
      let ayahText = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
      let nextAyahText = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";
      let ayahNum = 1;

      if (offlineData && offlineData.ayahs && offlineData.ayahs.length >= 2) {
        const rndIdx = Math.floor(Math.random() * (offlineData.ayahs.length - 1));
        ayahText = offlineData.ayahs[rndIdx].text;
        nextAyahText = offlineData.ayahs[rndIdx + 1].text;
        ayahNum = offlineData.ayahs[rndIdx].numberInSurah;
      }

      // توليد خيارات من سور أخرى
      const options = [nextAyahText];
      const wrongOptions = [
        "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        "قُلْ هُوَ اللَّهُ أَحَدٌ",
        "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ",
        "مِن شَرِّ مَا خَلَقَ"
      ].filter(o => o !== nextAyahText);

      while (options.length < 4 && wrongOptions.length > 0) {
        const opt = wrongOptions.pop();
        if (!options.includes(opt)) options.push(opt);
      }

      // خلط الخيارات عشوائياً
      options.sort(() => Math.random() - 0.5);

      questions.push({
        id: i + 1,
        type: "complete_ayah",
        surahNumber: randomSurah.number,
        surahName: randomSurah.name,
        ayahNumber: ayahNum,
        prompt: `أكمل الآية الكريمة التالية من سورة ${randomSurah.name}:`,
        questionVerse: `﴿ ${ayahText} ﴾`,
        correctAnswer: nextAyahText,
        options: options
      });
    }

    this.activeQuiz = {
      questions,
      currentIndex: 0,
      score: 0,
      totalQuestions: questions.length,
      mistakes: []
    };

    return this.activeQuiz;
  }

  submitAnswer(selectedOption) {
    const q = this.activeQuiz.questions[this.activeQuiz.currentIndex];
    if (!q) return null;

    const isCorrect = selectedOption.trim() === q.correctAnswer.trim();
    if (isCorrect) {
      this.activeQuiz.score++;
    } else {
      this.activeQuiz.mistakes.push({
        question: q.questionVerse,
        surahName: q.surahName,
        correctAnswer: q.correctAnswer,
        userAnswer: selectedOption
      });
    }

    this.activeQuiz.currentIndex++;
    const isFinished = this.activeQuiz.currentIndex >= this.activeQuiz.totalQuestions;

    let evaluation = null;
    if (isFinished) {
      const percentage = Math.round((this.activeQuiz.score / this.activeQuiz.totalQuestions) * 100);
      let grade = "ممتاز ⭐⭐⭐";
      let badge = "حافظ متقن 👑";
      if (percentage < 50) {
        grade = "بحاجة إلى مراجعة وتثبيت 📖";
        badge = "واصل التثبيت 💪";
      } else if (percentage < 80) {
        grade = "جيد جداً ⭐⭐";
        badge = "مجتهد ومثابر 🌟";
      }

      evaluation = {
        score: this.activeQuiz.score,
        total: this.activeQuiz.totalQuestions,
        percentage,
        grade,
        badge,
        mistakes: this.activeQuiz.mistakes
      };
    }

    return {
      isCorrect,
      isFinished,
      evaluation,
      nextQuestion: isFinished ? null : this.activeQuiz.questions[this.activeQuiz.currentIndex]
    };
  }
}

window.HifzEngine = new HifzEngine();
