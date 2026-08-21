// مدير ختمة القرآن الكريم وتتبع الأوراد اليومية ودعاء الختم - GS إسلام
const JUZ_BOUNDARIES = [
  { juz: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141, name: "الجزء الأول (الم)" },
  { juz: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252, name: "الجزء الثاني (سيقول)" },
  { juz: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92, name: "الجزء الثالث (تلك الرسل)" },
  { juz: 4, startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23, name: "الجزء الرابع (لن تنالوا)" },
  { juz: 5, startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147, name: "الجزء الخامس (والمحصنات)" },
  { juz: 6, startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81, name: "الجزء السادس (لا يحب الله)" },
  { juz: 7, startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110, name: "الجزء السابع (وإذا سمعوا)" },
  { juz: 8, startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87, name: "الجزء الثامن (ولو أننا)" },
  { juz: 9, startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40, name: "الجزء التاسع (قال الملأ)" },
  { juz: 10, startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92, name: "الجزء العاشر (واعلموا)" },
  { juz: 11, startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5, name: "الجزء الحادي عشر (يعتذرون)" },
  { juz: 12, startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52, name: "الجزء الثاني عشر (وما من دابة)" },
  { juz: 13, startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52, name: "الجزء الثالث عشر (وما أبرئ نفسي)" },
  { juz: 14, startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128, name: "الجزء الرابع عشر (ربما)" },
  { juz: 15, startSurah: 16, startAyah: 1, endSurah: 18, endAyah: 74, name: "الجزء الخامس عشر (سبحان الذي)" },
  { juz: 16, startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135, name: "الجزء السادس عشر (قال ألم)" },
  { juz: 17, startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78, name: "الجزء السابع عشر (اقترب)" },
  { juz: 18, startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20, name: "الجزء الثامن عشر (قد أفلح)" },
  { juz: 19, startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55, name: "الجزء التاسع عشر (وقال الذين)" },
  { juz: 20, startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45, name: "الجزء العشرون (أمن خلق)" },
  { juz: 21, startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30, name: "الجزء الحادي والعشرون (اتل ما أوحي)" },
  { juz: 22, startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27, name: "الجزء الثاني والعشرون (ومن يقنت)" },
  { juz: 23, startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31, name: "الجزء الثالث والعشرون (وما أنزلنا)" },
  { juz: 24, startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46, name: "الجزء الرابع والعشرون (فمن أظلم)" },
  { juz: 25, startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37, name: "الجزء الخامس والعشرون (إليه يرد)" },
  { juz: 26, startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30, name: "الجزء السادس والعشرون (حم)" },
  { juz: 27, startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29, name: "الجزء السابع والعشرون (قال فما خطبكم)" },
  { juz: 28, startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12, name: "الجزء الثامن والعشرون (قد سمع)" },
  { juz: 29, startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50, name: "الجزء التاسع والعشرون (تبارك)" },
  { juz: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6, name: "الجزء الثلاثون (عمّ)" }
];

const DUAA_KHATM_QURAN = `اللَّهُمَّ ارْحَمْنِي بِالقُرْآنِ وَاجْعَلْهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً.
اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ، وَارْزُقْنِي تِلاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ العَالَمِينَ.
اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ المَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ.
اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ وَخَيْرَ عَمَلِي خَوَاتِمَهُ وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ.
اللَّهُمَّ إِنِّي أَسْأَلُكَ عِيشَةً هَنِيَّةً وَمِيتَةً سَوِيَّةً وَمَرَدّاً غَيْرَ مُخْزٍ وَلا فَاضِحٍ.
اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ المَسْأَلَةِ، وَخَيْرَ الدُّعَاءِ، وَخَيْرَ النَّجَاحِ، وَخَيْرَ العِلْمِ، وَخَيْرَ العَمَلِ، وَخَيْرَ الثَّوَابِ، وَخَيْرَ الحَيَاةِ، وَخَيْرَ المَمَاتِ، وَثَبِّتْنِي وَثَقِّلْ مَوَازِينِي، وَحَقِّقْ إِيمَانِي، وَارْفَعْ دَرَجَتِي، وَتَقَبَّلْ صَلاتِي، وَاغْفِرْ خَطِيئَاتِي، وَأَسْأَلُكَ العُلا مِنَ الجَنَّةِ.
اللَّهُمَّ إِنِّي أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ وَعَزَائِمَ مَغْفِرَتِكَ وَالسَّلامَةَ مِنْ كُلِّ إِثْمٍ وَالغَنِيمَةَ مِنْ كُلِّ بِرٍّ وَالفَوْزَ بِالجَنَّةِ وَالنَّجَاةَ مِنَ النَّارِ.
اللَّهُمَّ أَحْسِنْ عَاقِبَتَنَا فِي الأُمُورِ كُلِّهَا، وَأَجِرْنَا مِنْ خِزْيِ الدُّنْيَا وَعَذَابِ الآخِرَةِ.
اللَّهُمَّ لا تَدَعْ لَنَا ذَنْباً إِلاَّ غَفَرْتَهُ، وَلا هَمّاً إِلاَّ فَرَّجْتَهُ، وَلا دَيْناً إِلاَّ قَضَيْتَهُ، وَلا حَاجَةً مِنْ حَوَائِجِ الدُّنْيَا وَالآخِرَةِ هِيَ لَكَ رِضاً إِلاَّ قَضَيْتَهَا يَا أَرْحَمَ الرَّاحِمِينَ.
رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.
وَصَلَّى اللهُ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَأَصْحَابِهِ الأَخْيَارِ وَسَلَّمَ تَسْلِيماً كَثِيراً.`;

class KhatmahManager {
  constructor() {
    this.isActive = true;
    this.targetDays = 30; // 30, 15, 10, 7, or custom
    this.currentDay = 1;
    this.startDate = new Date().toLocaleDateString("ar-SA");
    this.completedDays = []; // [1, 2, 3...]
    this.totalKhatmahsCompleted = 0;
    this.khatmahHistory = [];

    this.loadData();
  }

  loadData() {
    try {
      const saved = localStorage.getItem("gs_khatmah_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.isActive = parsed.isActive ?? true;
        this.targetDays = parsed.targetDays || 30;
        this.currentDay = parsed.currentDay || 1;
        this.startDate = parsed.startDate || new Date().toLocaleDateString("ar-SA");
        this.completedDays = parsed.completedDays || [];
        this.totalKhatmahsCompleted = parsed.totalKhatmahsCompleted || 0;
        this.khatmahHistory = parsed.khatmahHistory || [];
      }
    } catch (e) {}
  }

  saveData() {
    try {
      localStorage.setItem("gs_khatmah_data", JSON.stringify({
        isActive: this.isActive,
        targetDays: this.targetDays,
        currentDay: this.currentDay,
        startDate: this.startDate,
        completedDays: this.completedDays,
        totalKhatmahsCompleted: this.totalKhatmahsCompleted,
        khatmahHistory: this.khatmahHistory
      }));
    } catch (e) {}
  }

  startNewKhatmah(targetDays = 30) {
    this.targetDays = parseInt(targetDays, 10) || 30;
    this.currentDay = 1;
    this.completedDays = [];
    this.startDate = new Date().toLocaleDateString("ar-SA");
    this.isActive = true;
    this.saveData();
  }

  resetKhatmah() {
    this.startNewKhatmah(this.targetDays);
  }

  toggleDayCompleted(dayNumber) {
    dayNumber = parseInt(dayNumber, 10);
    const idx = this.completedDays.indexOf(dayNumber);
    if (idx > -1) {
      this.completedDays.splice(idx, 1);
    } else {
      this.completedDays.push(dayNumber);
      if (dayNumber >= this.currentDay && this.currentDay < this.targetDays) {
        this.currentDay = dayNumber + 1;
      }
    }

    // فحص إتمام الختمة كاملة
    if (this.completedDays.length >= this.targetDays) {
      this.totalKhatmahsCompleted += 1;
      this.khatmahHistory.push({
        date: new Date().toLocaleDateString("ar-SA"),
        targetDays: this.targetDays,
        title: `ختمة مباركة في ${this.targetDays} يوماً`
      });
    }

    this.saveData();
    return this.isDayCompleted(dayNumber);
  }

  isDayCompleted(dayNumber) {
    return this.completedDays.includes(parseInt(dayNumber, 10));
  }

  getDailyWird(dayNumber) {
    dayNumber = parseInt(dayNumber, 10);
    const totalJuzs = 30;
    const juzPerDay = totalJuzs / this.targetDays;

    let startJuzIndex = Math.floor((dayNumber - 1) * juzPerDay);
    let endJuzIndex = Math.min(29, Math.floor(dayNumber * juzPerDay) - 1);
    if (endJuzIndex < startJuzIndex) endJuzIndex = startJuzIndex;

    const startInfo = JUZ_BOUNDARIES[startJuzIndex] || JUZ_BOUNDARIES[0];
    const endInfo = JUZ_BOUNDARIES[endJuzIndex] || JUZ_BOUNDARIES[29];

    const startSurahMeta = typeof SURAH_LIST !== "undefined" ? SURAH_LIST.find(s => s.number === startInfo.startSurah) : null;
    const endSurahMeta = typeof SURAH_LIST !== "undefined" ? SURAH_LIST.find(s => s.number === endInfo.endSurah) : null;

    const startSurahName = startSurahMeta ? startSurahMeta.name : `سورة ${startInfo.startSurah}`;
    const endSurahName = endSurahMeta ? endSurahMeta.name : `سورة ${endInfo.endSurah}`;

    let juzRangeName = "";
    if (startInfo.juz === endInfo.juz) {
      juzRangeName = `الجزء ${startInfo.juz}`;
    } else {
      juzRangeName = `من الجزء ${startInfo.juz} إلى الجزء ${endInfo.juz}`;
    }

    return {
      day: dayNumber,
      juzRangeName,
      startJuz: startInfo.juz,
      endJuz: endInfo.juz,
      startSurah: startInfo.startSurah,
      startAyah: startInfo.startAyah,
      endSurah: endInfo.endSurah,
      endAyah: endInfo.endAyah,
      startSurahName,
      endSurahName,
      title: `ورد اليوم ${dayNumber}: ${juzRangeName}`,
      desc: `من سورة ${startSurahName} (الآية ${startInfo.startAyah}) إلى سورة ${endSurahName} (الآية ${endInfo.endAyah})`
    };
  }

  getProgress() {
    const completedCount = this.completedDays.length;
    const percent = Math.min(100, Math.round((completedCount / this.targetDays) * 100));
    const remainingDays = Math.max(0, this.targetDays - completedCount);

    return {
      completedDaysCount: completedCount,
      targetDays: this.targetDays,
      currentDay: this.currentDay,
      percentage: percent,
      remainingDays,
      totalKhatmahsCompleted: this.totalKhatmahsCompleted,
      isCompleted: completedCount >= this.targetDays
    };
  }

  getDuaaText() {
    return DUAA_KHATM_QURAN;
  }
}

window.KhatmahManager = new KhatmahManager();
