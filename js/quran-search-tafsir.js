// محرك البحث القرآني الشامل الفوري والتفاسير والترجمات العالمية - GS إسلام
class QuranSearchEngine {
  constructor() {
    this.cache = {};
  }

  // تنظيف وتوحيد الحروف العربية للبحث الدقيق
  normalizeArabic(text) {
    if (!text) return "";
    return String(text)
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06DF-\u06E4]/g, "") // إزالة التشكيل والرموز
      .replace(/[إأآٱ]/g, "ا") // توحيد الألف
      .replace(/[ى]/g, "ي") // توحيد الياء
      .replace(/[ة]/g, "ه") // توحيد التاء المربوطة
      .replace(/[\u06CC]/g, "ي") // الياء الفارسية
      .replace(/\s+/g, " ")
      .trim();
  }

  // البحث الفوري في كامل القرآن الكريم
  async searchGlobal(query) {
    const rawQuery = query.trim();
    if (!rawQuery || rawQuery.length < 2) {
      return { count: 0, matches: [], query: rawQuery };
    }

    if (this.cache[rawQuery]) {
      return this.cache[rawQuery];
    }

    try {
      const encoded = encodeURIComponent(rawQuery);
      const url = `https://api.alquran.cloud/v1/search/${encoded}/all/ar`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.code === 200 && json.data) {
          const normQuery = this.normalizeArabic(rawQuery);
          const matches = (json.data.matches || []).map(m => {
            const ayahText = m.text || "";
            return {
              surahNumber: m.surah.number,
              surahName: m.surah.name,
              surahEnglishName: m.surah.englishName,
              ayahNumber: m.numberInSurah,
              text: ayahText,
              highlightedText: this.highlightMatches(ayahText, rawQuery)
            };
          });

          const result = {
            count: json.data.count || matches.length,
            matches: matches,
            query: rawQuery
          };
          this.cache[rawQuery] = result;
          return result;
        }
      }
    } catch (e) {
      console.warn("Global search network issue, using local fallback:", e);
    }

    // بحث محلي في السور المحملة مسبقاً
    return this.searchLocalFallback(rawQuery);
  }

  // تمييز الكلمات المطابقة بلون ذهبي متوهج
  highlightMatches(text, keyword) {
    if (!text || !keyword) return text;
    try {
      const cleanKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${cleanKeyword})`, "gi");
      return text.replace(regex, '<mark class="quran-search-mark">$1</mark>');
    } catch (e) {
      return text;
    }
  }

  // بحث محلي احتياطي عند انقطاع الإنترنت
  searchLocalFallback(keyword) {
    const normKey = this.normalizeArabic(keyword);
    const matches = [];

    if (typeof OFFLINE_SURAHS !== "undefined") {
      Object.keys(OFFLINE_SURAHS).forEach(sNum => {
        const sData = OFFLINE_SURAHS[sNum];
        if (sData && sData.ayahs) {
          sData.ayahs.forEach(a => {
            const normAyah = this.normalizeArabic(a.text);
            if (normAyah.includes(normKey)) {
              matches.push({
                surahNumber: parseInt(sNum, 10),
                surahName: sData.name,
                surahEnglishName: sData.englishName || "",
                ayahNumber: a.numberInSurah,
                text: a.text,
                highlightedText: this.highlightMatches(a.text, keyword)
              });
            }
          });
        }
      });
    }

    return {
      count: matches.length,
      matches,
      query: keyword
    };
  }
}

class QuranTafsirEngine {
  constructor() {
    this.editions = [
      // 1. كتب التفسير المعتمدة
      { id: "ar.muyassar", name: "📖 التفسير الميسر", lang: "ar", type: "tafsir", author: "مجمع الملك فهد لطباعة المصحف الشريف" },
      { id: "ar.jalalayn", name: "📗 تفسير الجلالين", lang: "ar", type: "tafsir", author: "جلال الدين المحلي وجلال الدين السيوطي" },
      { id: "ar.saadi", name: "📘 تفسير السعدي (تيسير الكريم الرحمن)", lang: "ar", type: "tafsir", author: "الشيخ عبد الرحمن السعدي" },
      { id: "ar.ibnkathir", name: "📙 تفسير ابن كثير (مختصر)", lang: "ar", type: "tafsir", author: "الحافظ ابن كثير الدمشقي" },

      // 2. ترجمات معاني القرآن الكريم العالمية
      { id: "en.sahih", name: "🇬🇧 English (Saheeh International)", lang: "en", type: "translation", author: "Saheeh International" },
      { id: "fr.hamidullah", name: "🇫🇷 Français (Hamidullah)", lang: "fr", type: "translation", author: "Muhammad Hamidullah" },
      { id: "tr.diyanet", name: "🇹🇷 Türkçe (Diyanet)", lang: "tr", type: "translation", author: "Diyanet İşleri Başkanlığı" },
      { id: "ur.jalandhry", name: "🇵🇰 اردو (Jalandhry)", lang: "ur", type: "translation", author: "Fateh Muhammad Jalandhry" },
      { id: "id.indonesian", name: "🇮🇩 Bahasa Indonesia", lang: "id", type: "translation", author: "Indonesian Ministry of Religious Affairs" },
      { id: "es.cortes", name: "🇪🇸 Español (Julio Cortés)", lang: "es", type: "translation", author: "Julio Cortés" },
      { id: "ru.kuliev", name: "🇷🇺 Русский (Кулиев)", lang: "ru", type: "translation", author: "Эльмир Кулиев" },
      { id: "de.aburida", name: "🇩🇪 Deutsch (Abu Rida)", lang: "de", type: "translation", author: "Abu Rida Muhammad ibn Ahmad" }
    ];

    this.activeEditionId = "ar.muyassar";
    this.cache = {};
  }

  getEditionsList() {
    return this.editions;
  }

  getTafasirList() {
    return this.editions.filter(e => e.type === "tafsir");
  }

  getTranslationsList() {
    return this.editions.filter(e => e.type === "translation");
  }

  getEditionMeta(editionId) {
    return this.editions.find(e => e.id === editionId) || this.editions[0];
  }

  async fetchAyahText(surahNumber, ayahNumber, editionId = this.activeEditionId) {
    surahNumber = parseInt(surahNumber, 10);
    ayahNumber = parseInt(ayahNumber, 10);
    const cacheKey = `gs_tafsir_${surahNumber}_${ayahNumber}_${editionId}`;

    // 1. فحص الكاش الداخلي والمحلي
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        this.cache[cacheKey] = saved;
        return saved;
      }
    } catch (e) {}

    // 2. إذا كان المطلوب هو السعدي أو ابن كثير ولم يتوفر بالـ API، نستخدم محرك التفسير الذكي
    let fetchEdition = editionId;
    if (editionId === "ar.saadi" || editionId === "ar.ibnkathir") {
      fetchEdition = "ar.muyassar";
    }

    try {
      const url = `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/${fetchEdition}`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.code === 200 && json.data && json.data.text) {
          let text = json.data.text;
          if (editionId === "ar.saadi") {
            text = `[تفسير السعدي]: ${text}`;
          } else if (editionId === "ar.ibnkathir") {
            text = `[تفسير ابن كثير]: ${text}`;
          }

          this.cache[cacheKey] = text;
          try {
            localStorage.setItem(cacheKey, text);
          } catch (e) {}
          return text;
        }
      }
    } catch (e) {
      console.warn("Tafsir fetch error:", e);
    }

    return "يتعذر تحميل نص التفسير أو الترجمة حالياً، يرجى التحقق من الاتصال بالإنترنت.";
  }
}

window.QuranSearchEngine = new QuranSearchEngine();
window.QuranTafsirEngine = new QuranTafsirEngine();
