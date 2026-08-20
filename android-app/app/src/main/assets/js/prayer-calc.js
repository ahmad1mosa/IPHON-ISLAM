// محرك حساب مواقيت الصلاة والقبلة الفلكي الدقيق العالمي - GS إسلام
// متوافق مع كافة دول العالم ويدعم التوقيت الصيفي (DST) والشتوي التلقائي

const PRAYER_METHODS = {
  Jordan: { name: "وزارة الأوقاف الأردنية (الأردن)", fajrAngle: 18.0, ishaAngle: 18.0 },
  Palestine: { name: "المسجد الأقصى والقدس وفلسطين", fajrAngle: 18.0, ishaAngle: 17.5 },
  UmmAlQura: { name: "أم القرى (مكة المكرمة والسعودية والخليج)", fajrAngle: 18.5, ishaInterval: 90 },
  Egypt: { name: "الهيئة العامة المصرية للمساحة (مصر)", fajrAngle: 19.5, ishaAngle: 17.5 },
  MWL: { name: "رابطة العالم الإسلامي (بلاد الشام وأوروبا)", fajrAngle: 18.0, ishaAngle: 17.0 },
  Dubai: { name: "دائرة الشؤون الإسلامية بدبي والإمارات", fajrAngle: 18.2, ishaAngle: 18.2 },
  Kuwait: { name: "وزارة الأوقاف والشؤون الإسلامية بالكويت", fajrAngle: 18.0, ishaAngle: 17.5 },
  Qatar: { name: "وزارة الأوقاف القطرية", fajrAngle: 18.0, ishaInterval: 90 },
  Turkey: { name: "رئاسة الشؤون الدينية التركية (Diyanet)", fajrAngle: 18.0, ishaAngle: 17.0 },
  Karachi: { name: "جامعة العلوم الإسلامية بكراتشي (باكستان والهند)", fajrAngle: 18.0, ishaAngle: 18.0 },
  ISNA: { name: "الجمعية الإسلامية لأمريكا الشمالية (ISNA)", fajrAngle: 15.0, ishaAngle: 15.0 },
  France: { name: "اتحاد المنظمات الإسلامية بفرنسا وأوروبا", fajrAngle: 12.0, ishaAngle: 12.0 }
};

const DEFAULT_CITIES = [
  // 🇯🇴 المملكة الأردنية الهاشمية
  { name: "عمّان (الأردن)", nameEn: "Amman (Jordan)", lat: 31.9454, lng: 35.9284, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "إربد (الأردن)", nameEn: "Irbid (Jordan)", lat: 32.5568, lng: 35.8469, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "الزرقاء (الأردن)", nameEn: "Zarqa (Jordan)", lat: 32.0728, lng: 36.0880, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "العقبة (الأردن)", nameEn: "Aqaba (Jordan)", lat: 29.5321, lng: 35.0063, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "السلط (الأردن)", nameEn: "Salt (Jordan)", lat: 32.0392, lng: 35.7272, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "الكرك (الأردن)", nameEn: "Karak (Jordan)", lat: 31.1853, lng: 35.7048, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "مادبا (الأردن)", nameEn: "Madaba (Jordan)", lat: 31.7197, lng: 35.7941, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "معان (الأردن)", nameEn: "Maan (Jordan)", lat: 30.1927, lng: 35.7360, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "المفرق (الأردن)", nameEn: "Mafraq (Jordan)", lat: 32.3429, lng: 36.2081, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "عجلون (الأردن)", nameEn: "Ajloun (Jordan)", lat: 32.3326, lng: 35.7517, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "جرش (الأردن)", nameEn: "Jerash (Jordan)", lat: 32.2747, lng: 35.8961, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },
  { name: "الطفيلة (الأردن)", nameEn: "Tafilah (Jordan)", lat: 30.8375, lng: 35.6044, timeZoneId: "Asia/Amman", defaultMethod: "Jordan" },

  // 🇵🇸 فلسطين المباركة
  { name: "القدس الشريف (فلسطين)", nameEn: "Jerusalem (Palestine)", lat: 31.7683, lng: 35.2137, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "غزة (فلسطين)", nameEn: "Gaza (Palestine)", lat: 31.5017, lng: 34.4668, timeZoneId: "Asia/Gaza", defaultMethod: "Palestine" },
  { name: "الخليل (فلسطين)", nameEn: "Hebron (Palestine)", lat: 31.5326, lng: 35.0998, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "نابلس (فلسطين)", nameEn: "Nablus (Palestine)", lat: 32.2211, lng: 35.2544, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "رام الله (فلسطين)", nameEn: "Ramallah (Palestine)", lat: 31.9038, lng: 35.2034, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "جنين (فلسطين)", nameEn: "Jenin (Palestine)", lat: 32.4608, lng: 35.2974, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "بيت لحم (فلسطين)", nameEn: "Bethlehem (Palestine)", lat: 31.7054, lng: 35.2024, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "طولكرم (فلسطين)", nameEn: "Tulkarm (Palestine)", lat: 32.3124, lng: 35.0286, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "قلقيلية (فلسطين)", nameEn: "Qalqilya (Palestine)", lat: 32.1960, lng: 34.9815, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "أريحا (فلسطين)", nameEn: "Jericho (Palestine)", lat: 31.8611, lng: 35.4618, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "يافا (فلسطين)", nameEn: "Jaffa (Palestine)", lat: 32.0535, lng: 34.7554, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },
  { name: "حيفا (فلسطين)", nameEn: "Haifa (Palestine)", lat: 32.7940, lng: 34.9896, timeZoneId: "Asia/Jerusalem", defaultMethod: "Palestine" },

  // 🇸🇦 المملكة العربية السعودية
  { name: "مكة المكرمة (السعودية)", nameEn: "Makkah (Saudi Arabia)", lat: 21.4225, lng: 39.8262, timeZoneId: "Asia/Riyadh", defaultMethod: "UmmAlQura" },
  { name: "المدينة المنورة (السعودية)", nameEn: "Madinah (Saudi Arabia)", lat: 24.5247, lng: 39.5692, timeZoneId: "Asia/Riyadh", defaultMethod: "UmmAlQura" },
  { name: "الرياض (السعودية)", nameEn: "Riyadh (Saudi Arabia)", lat: 24.7136, lng: 46.6753, timeZoneId: "Asia/Riyadh", defaultMethod: "UmmAlQura" },
  { name: "جدة (السعودية)", nameEn: "Jeddah (Saudi Arabia)", lat: 21.4858, lng: 39.1925, timeZoneId: "Asia/Riyadh", defaultMethod: "UmmAlQura" },
  { name: "الدمام (السعودية)", nameEn: "Dammam (Saudi Arabia)", lat: 26.4207, lng: 50.0888, timeZoneId: "Asia/Riyadh", defaultMethod: "UmmAlQura" },

  // 🇪🇬 جمهورية مصر العربية
  { name: "القاهرة (مصر)", nameEn: "Cairo (Egypt)", lat: 30.0444, lng: 31.2357, timeZoneId: "Africa/Cairo", defaultMethod: "Egypt" },
  { name: "الإسكندرية (مصر)", nameEn: "Alexandria (Egypt)", lat: 31.2001, lng: 29.9187, timeZoneId: "Africa/Cairo", defaultMethod: "Egypt" },
  { name: "الجيزة (مصر)", nameEn: "Giza (Egypt)", lat: 30.0131, lng: 31.2089, timeZoneId: "Africa/Cairo", defaultMethod: "Egypt" },

  // 🇸🇾 🇱🇧 🇮🇶 باقي بلاد الشام والعراق
  { name: "دمشق (سوريا)", nameEn: "Damascus (Syria)", lat: 33.5138, lng: 36.2765, timeZoneId: "Asia/Damascus", defaultMethod: "MWL" },
  { name: "حلب (سوريا)", nameEn: "Aleppo (Syria)", lat: 36.2021, lng: 37.1343, timeZoneId: "Asia/Damascus", defaultMethod: "MWL" },
  { name: "بيروت (لبنان)", nameEn: "Beirut (Lebanon)", lat: 33.8938, lng: 35.5018, timeZoneId: "Asia/Beirut", defaultMethod: "MWL" },
  { name: "بغداد (العراق)", nameEn: "Baghdad (Iraq)", lat: 33.3152, lng: 44.3661, timeZoneId: "Asia/Baghdad", defaultMethod: "MWL" },
  { name: "الموصل (العراق)", nameEn: "Mosul (Iraq)", lat: 36.3400, lng: 43.1300, timeZoneId: "Asia/Baghdad", defaultMethod: "MWL" },
  { name: "البصرة (العراق)", nameEn: "Basra (Iraq)", lat: 30.5081, lng: 47.7835, timeZoneId: "Asia/Baghdad", defaultMethod: "MWL" },
  { name: "أربيل (العراق)", nameEn: "Erbil (Iraq)", lat: 36.1911, lng: 44.0092, timeZoneId: "Asia/Baghdad", defaultMethod: "MWL" },

  // 🇦🇪 🇶🇦 🇰🇼 🇧🇭 🇴🇲 🇾🇪 دول الخليج العربي واليمن
  { name: "أبوظبي (الإمارات)", nameEn: "Abu Dhabi (UAE)", lat: 24.4539, lng: 54.3773, timeZoneId: "Asia/Dubai", defaultMethod: "Dubai" },
  { name: "دبي (الإمارات)", nameEn: "Dubai (UAE)", lat: 25.2048, lng: 55.2708, timeZoneId: "Asia/Dubai", defaultMethod: "Dubai" },
  { name: "الدوحة (قطر)", nameEn: "Doha (Qatar)", lat: 25.2854, lng: 51.5310, timeZoneId: "Asia/Qatar", defaultMethod: "Qatar" },
  { name: "الكويت (الكويت)", nameEn: "Kuwait City (Kuwait)", lat: 29.3759, lng: 47.9774, timeZoneId: "Asia/Kuwait", defaultMethod: "Kuwait" },
  { name: "المنامة (البحرين)", nameEn: "Manama (Bahrain)", lat: 26.2285, lng: 50.5860, timeZoneId: "Asia/Bahrain", defaultMethod: "UmmAlQura" },
  { name: "مسقط (عُمان)", nameEn: "Muscat (Oman)", lat: 23.5859, lng: 58.4059, timeZoneId: "Asia/Muscat", defaultMethod: "UmmAlQura" },
  { name: "صنعاء (اليمن)", nameEn: "Sanaa (Yemen)", lat: 15.3694, lng: 44.1910, timeZoneId: "Asia/Aden", defaultMethod: "UmmAlQura" },
  { name: "عدن (اليمن)", nameEn: "Aden (Yemen)", lat: 12.7855, lng: 45.0187, timeZoneId: "Asia/Aden", defaultMethod: "UmmAlQura" },

  // 🇲🇦 🇩🇿 🇹🇳 🇱🇾 🇸🇩 دول المغرب العربي وشمال أفريقيا
  { name: "الرباط (المغرب)", nameEn: "Rabat (Morocco)", lat: 34.0209, lng: -6.8416, timeZoneId: "Africa/Casablanca", defaultMethod: "MWL" },
  { name: "الدار البيضاء (المغرب)", nameEn: "Casablanca (Morocco)", lat: 33.5731, lng: -7.5898, timeZoneId: "Africa/Casablanca", defaultMethod: "MWL" },
  { name: "الجزائر (الجزائر)", nameEn: "Algiers (Algeria)", lat: 36.7538, lng: 3.0588, timeZoneId: "Africa/Algiers", defaultMethod: "MWL" },
  { name: "وهران (الجزائر)", nameEn: "Oran (Algeria)", lat: 35.6987, lng: -0.6349, timeZoneId: "Africa/Algiers", defaultMethod: "MWL" },
  { name: "تونس (تونس)", nameEn: "Tunis (Tunisia)", lat: 36.8065, lng: 10.1815, timeZoneId: "Africa/Tunis", defaultMethod: "MWL" },
  { name: "طرابلس (ليبيا)", nameEn: "Tripoli (Libya)", lat: 32.8872, lng: 13.1913, timeZoneId: "Africa/Tripoli", defaultMethod: "MWL" },
  { name: "بنغازي (ليبيا)", nameEn: "Benghazi (Libya)", lat: 32.1167, lng: 20.0667, timeZoneId: "Africa/Tripoli", defaultMethod: "MWL" },
  { name: "الخرطوم (السودان)", nameEn: "Khartoum (Sudan)", lat: 15.5007, lng: 32.5599, timeZoneId: "Africa/Khartoum", defaultMethod: "Egypt" },
  { name: "نواكشوط (موريتانيا)", nameEn: "Nouakchott (Mauritania)", lat: 18.0735, lng: -15.9582, timeZoneId: "Africa/Nouakchott", defaultMethod: "MWL" },

  // 🇹🇷 🇮🇩 🇲🇾 🇵🇰 باقي الدول الإسلامية
  { name: "إسطنبول (تركيا)", nameEn: "Istanbul (Turkey)", lat: 41.0082, lng: 28.9784, timeZoneId: "Europe/Istanbul", defaultMethod: "Turkey" },
  { name: "أنقرة (تركيا)", nameEn: "Ankara (Turkey)", lat: 39.9334, lng: 32.8597, timeZoneId: "Europe/Istanbul", defaultMethod: "Turkey" },
  { name: "جاكرتا (إندونيسيا)", nameEn: "Jakarta (Indonesia)", lat: -6.2088, lng: 106.8456, timeZoneId: "Asia/Jakarta", defaultMethod: "MWL" },
  { name: "كوالالمبور (ماليزيا)", nameEn: "Kuala Lumpur (Malaysia)", lat: 3.1390, lng: 101.6869, timeZoneId: "Asia/Kuala_Lumpur", defaultMethod: "MWL" },
  { name: "كراتشي (باكستان)", nameEn: "Karachi (Pakistan)", lat: 24.8607, lng: 67.0011, timeZoneId: "Asia/Karachi", defaultMethod: "Karachi" },
  { name: "إسلام آباد (باكستان)", nameEn: "Islamabad (Pakistan)", lat: 33.6844, lng: 73.0479, timeZoneId: "Asia/Karachi", defaultMethod: "Karachi" },

  // 🇬🇧 🇫🇷 🇩🇪 🇪🇸 🇮🇹 🇺🇸 🇨🇦 🇦🇺 عواصم ومدن العالم
  { name: "لندن (بريطانيا)", nameEn: "London (UK)", lat: 51.5074, lng: -0.1278, timeZoneId: "Europe/London", defaultMethod: "MWL" },
  { name: "باريس (فرنسا)", nameEn: "Paris (France)", lat: 48.8566, lng: 2.3522, timeZoneId: "Europe/Paris", defaultMethod: "France" },
  { name: "برلين (ألمانيا)", nameEn: "Berlin (Germany)", lat: 52.5200, lng: 13.4050, timeZoneId: "Europe/Berlin", defaultMethod: "MWL" },
  { name: "مدريد (إسبانيا)", nameEn: "Madrid (Spain)", lat: 40.4168, lng: -3.7038, timeZoneId: "Europe/Madrid", defaultMethod: "MWL" },
  { name: "روما (إيطاليا)", nameEn: "Rome (Italy)", lat: 41.9028, lng: 12.4964, timeZoneId: "Europe/Rome", defaultMethod: "MWL" },
  { name: "أمستردام (هولندا)", nameEn: "Amsterdam (Netherlands)", lat: 52.3676, lng: 4.9041, timeZoneId: "Europe/Amsterdam", defaultMethod: "MWL" },
  { name: "موسكو (روسيا)", nameEn: "Moscow (Russia)", lat: 55.7558, lng: 37.6173, timeZoneId: "Europe/Moscow", defaultMethod: "MWL" },
  { name: "نيويورك (أمريكا)", nameEn: "New York (USA)", lat: 40.7128, lng: -74.0060, timeZoneId: "America/New_York", defaultMethod: "ISNA" },
  { name: "واشنطن (أمريكا)", nameEn: "Washington D.C. (USA)", lat: 38.9072, lng: -77.0369, timeZoneId: "America/New_York", defaultMethod: "ISNA" },
  { name: "شيكاغو (أمريكا)", nameEn: "Chicago (USA)", lat: 41.8781, lng: -87.6298, timeZoneId: "America/Chicago", defaultMethod: "ISNA" },
  { name: "لوس أنجلوس (أمريكا)", nameEn: "Los Angeles (USA)", lat: 34.0522, lng: -118.2437, timeZoneId: "America/Los_Angeles", defaultMethod: "ISNA" },
  { name: "تورونتو (كندا)", nameEn: "Toronto (Canada)", lat: 43.6532, lng: -79.3832, timeZoneId: "America/Toronto", defaultMethod: "ISNA" },
  { name: "سيدني (أستراليا)", nameEn: "Sydney (Australia)", lat: -33.8688, lng: 151.2093, timeZoneId: "Australia/Sydney", defaultMethod: "MWL" }
];

class PrayerCalculator {
  constructor() {
    this.degToRad = (d) => (d * Math.PI) / 180.0;
    this.radToDeg = (r) => (r * 180.0) / Math.PI;
    this.sinDeg = (d) => Math.sin(this.degToRad(d));
    this.cosDeg = (d) => Math.cos(this.degToRad(d));
    this.tanDeg = (d) => Math.tan(this.degToRad(d));
    this.acosDeg = (x) => this.radToDeg(Math.acos(Math.max(-1, Math.min(1, x))));
    this.asinDeg = (x) => this.radToDeg(Math.asin(Math.max(-1, Math.min(1, x))));
    this.atanDeg = (x) => this.radToDeg(Math.atan(x));
    this.atan2Deg = (y, x) => this.radToDeg(Math.atan2(y, x));
  }

  // حساب دقيق للوقت الفلكي ومعادلة الزمن وميل الشمس
  getSunPosition(julianDate) {
    const D = julianDate - 2451545.0;
    const g = (357.529 + 0.98560028 * D) % 360;
    const q = (280.459 + 0.98564736 * D) % 360;
    const L = (q + 1.915 * this.sinDeg(g) + 0.020 * this.sinDeg(2 * g)) % 360;
    const e = 23.439 - 0.00000036 * D;
    const d = this.asinDeg(this.sinDeg(e) * this.sinDeg(L));
    let RA = this.atan2Deg(this.cosDeg(e) * this.sinDeg(L), this.cosDeg(L)) / 15;
    RA = (RA + 24) % 24;

    let EqT = q / 15 - RA;
    // تصحيح التدوير الدوري لمعادلة الزمن (لا تتجاوز إطلاقاً 20 دقيقة أي ±0.33 ساعة)
    while (EqT > 12) EqT -= 24;
    while (EqT < -12) EqT += 24;

    return { declination: d, equationOfTime: EqT };
  }

  getJulianDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    const day = date.getDate();
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  }

  // حساب فرق التوقيت الصيفي / الشتوي التلقائي الدقيق
  resolveTimezoneOffset(city, date = new Date()) {
    if (city.isGps) {
      return -(date.getTimezoneOffset() / 60);
    }
    if (city.timeZoneId) {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: city.timeZoneId,
          year: "numeric", month: "numeric", day: "numeric",
          hour: "numeric", minute: "numeric", second: "numeric",
          hour12: false
        });
        const parts = formatter.formatToParts(date);
        const v = {};
        parts.forEach(p => v[p.type] = p.value);
        const hour = Number(v.hour === "24" ? 0 : v.hour);
        const targetUtc = Date.UTC(Number(v.year), Number(v.month) - 1, Number(v.day), hour, Number(v.minute), Number(v.second));
        const diffHours = (targetUtc - date.getTime()) / (3600 * 1000);
        if (!isNaN(diffHours) && Math.abs(diffHours) <= 14) {
          return Math.round(diffHours * 100) / 100;
        }
      } catch (e) {}
    }
    if (city.timezone !== undefined && city.timezone !== null && !isNaN(city.timezone)) {
      return Number(city.timezone);
    }
    return Math.round((city.lng || 0) / 15);
  }

  calculateTimes(date, latitude, longitude, timezone, methodKey = "Jordan", asrJuristic = 1) {
    const method = PRAYER_METHODS[methodKey] || PRAYER_METHODS.Jordan;
    const jd = this.getJulianDate(date);
    const sun = this.getSunPosition(jd);

    const tz = (timezone !== undefined && timezone !== null && !isNaN(timezone)) ? Number(timezone) : Math.round(longitude / 15);

    // وقت الزوال الحقيقي بدقة متناهية (Solar Noon)
    const noon = 12 + tz - longitude / 15 - sun.equationOfTime;

    const timeForAltitude = (angle) => {
      const cosH = (this.sinDeg(angle) - this.sinDeg(latitude) * this.sinDeg(sun.declination)) /
                   (this.cosDeg(latitude) * this.cosDeg(sun.declination));
      if (cosH > 1 || cosH < -1) return null;
      return (1 / 15) * this.acosDeg(cosH);
    };

    // زاوية قرص الشمس والشروق والغروب مع الانكسار الضوئي في الغلاف الجوي (-0.833 درجة)
    const sunAngle = -0.833;
    const sunHalfDay = timeForAltitude(sunAngle);

    const sunrise = sunHalfDay !== null ? noon - sunHalfDay : noon - 6;
    const sunset = sunHalfDay !== null ? noon + sunHalfDay : noon + 6;

    // الفجر الصادق
    let fajr;
    const fajrDiff = timeForAltitude(-method.fajrAngle);
    if (fajrDiff !== null) {
      fajr = noon - fajrDiff;
    } else {
      fajr = sunrise - 1.5;
    }

    // الظهر (دقيقتان بعد الزوال للاحتياط الشرعي)
    const dhuhr = noon + (2 / 60);

    // العصر (المعيار الفقهي للظل: الشافعي/الجمهور = 1، الحنفي = 2)
    const asrAltitude = this.atanDeg(1 / (asrJuristic + this.tanDeg(Math.abs(latitude - sun.declination))));
    const asrDiff = timeForAltitude(asrAltitude);
    const asr = asrDiff !== null ? noon + asrDiff : noon + 3.5;

    // المغرب (دقيقتان بعد الغروب لضمان اكتمال تواري القرص)
    const maghrib = sunset + (2 / 60);

    // العشاء (بالدرجة الفلكية أو الفارق الزمني المعتمد بأم القرى)
    let isha;
    if (method.ishaInterval) {
      isha = maghrib + method.ishaInterval / 60;
    } else {
      const ishaDiff = timeForAltitude(-method.ishaAngle);
      isha = ishaDiff !== null ? noon + ishaDiff : sunset + 1.5;
    }

    return {
      fajr: this.formatFloatHours(fajr),
      sunrise: this.formatFloatHours(sunrise),
      dhuhr: this.formatFloatHours(dhuhr),
      asr: this.formatFloatHours(asr),
      maghrib: this.formatFloatHours(maghrib),
      isha: this.formatFloatHours(isha),
      rawTimes: { fajr, sunrise, dhuhr, asr, maghrib, isha }
    };
  }

  formatFloatHours(hoursFloat) {
    let totalMinutes = Math.round(((hoursFloat + 24) % 24) * 60);
    let h = Math.floor(totalMinutes / 60) % 24;
    let m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  calculateQibla(latitude, longitude) {
    const meccaLat = 21.4225;
    const meccaLng = 39.8262;

    const lat1 = this.degToRad(latitude);
    const lat2 = this.degToRad(meccaLat);
    const dLng = this.degToRad(meccaLng - longitude);

    const y = Math.sin(dLng);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLng);
    let qibla = this.radToDeg(Math.atan2(y, x));
    return Math.round((qibla + 360) % 360);
  }

  getNextPrayer(rawTimes) {
    const now = new Date();
    const currentHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

    const i18n = window.I18nManager;
    const prayerOrder = [
      { key: "fajr", name: i18n ? i18n.t("fajr") : "الفجر", time: rawTimes.fajr },
      { key: "sunrise", name: i18n ? i18n.t("sunrise") : "الشروق", time: rawTimes.sunrise },
      { key: "dhuhr", name: i18n ? i18n.t("dhuhr") : "الظهر", time: rawTimes.dhuhr },
      { key: "asr", name: i18n ? i18n.t("asr") : "العصر", time: rawTimes.asr },
      { key: "maghrib", name: i18n ? i18n.t("maghrib") : "المغرب", time: rawTimes.maghrib },
      { key: "isha", name: i18n ? i18n.t("isha") : "العشاء", time: rawTimes.isha }
    ];

    let next = null;
    for (let p of prayerOrder) {
      if (p.time > currentHours) {
        next = p;
        break;
      }
    }

    let remainingHours = 0;
    if (next) {
      remainingHours = next.time - currentHours;
    } else {
      next = { key: "fajr", name: i18n ? i18n.t("fajr") : "الفجر", time: rawTimes.fajr };
      remainingHours = 24 - currentHours + rawTimes.fajr;
    }

    const totalSeconds = Math.max(0, Math.floor(remainingHours * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return {
      nextPrayer: next,
      countdownFormatted: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      totalSeconds
    };
  }
}

const ADHAN_VOICES = [
  { id: "makkah", name: "أذان المسجد الحرام (مكة المكرمة)", url: "audio/makkah.mp3" },
  { id: "madinah", name: "أذان المسجد النبوي الشريف (المدينة المنورة)", url: "audio/madinah.mp3" },
  { id: "alaqsa", name: "أذان المسجد الأقصى المبارك (القدس الشريف)", url: "audio/alaqsa.mp3" },
  { id: "egypt", name: "أذان مساجد مصر والقاهرة", url: "audio/egypt.mp3" },
  { id: "alafasy", name: "أذان الشيخ مشاري بن راشد العفاسي", url: "audio/alafasy.mp3" }
];

window.PrayerCalculator = new PrayerCalculator();
window.PRAYER_METHODS = PRAYER_METHODS;
window.DEFAULT_CITIES = DEFAULT_CITIES;
window.ADHAN_VOICES = ADHAN_VOICES;
