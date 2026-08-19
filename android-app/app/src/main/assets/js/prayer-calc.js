// محرك حساب مواقيت الصلاة والقبلة الفلكي الدقيق - تطبيق GS اسلم
// المدينة الافتراضية: فلسطين (القدس الشريف)

const PRAYER_METHODS = {
  UmmAlQura: { name: "أم القرى (مكة المكرمة)", fajrAngle: 18.5, ishaInterval: 90 },
  Egypt: { name: "الهيئة العامة المصرية للمساحة", fajrAngle: 19.5, ishaAngle: 17.5 },
  MWL: { name: "رابطة العالم الإسلامي", fajrAngle: 18, ishaAngle: 17 },
  Karachi: { name: "جامعة العلوم الإسلامية بكراتشي", fajrAngle: 18, ishaAngle: 18 },
  ISNA: { name: "الجمعية الإسلامية لأمريكا الشمالية", fajrAngle: 15, ishaAngle: 15 }
};

const DEFAULT_CITIES = [
  // 🇵🇸 فلسطين المباركة - المدن الافتراضية الأولى
  { name: "القدس الشريف (فلسطين)", nameEn: "Jerusalem (Palestine)", lat: 31.7683, lng: 35.2137, timezone: 3 },
  { name: "غزة (فلسطين)", nameEn: "Gaza (Palestine)", lat: 31.5017, lng: 34.4668, timezone: 3 },
  { name: "نابلس (فلسطين)", nameEn: "Nablus (Palestine)", lat: 32.2211, lng: 35.2544, timezone: 3 },
  { name: "الخليل (فلسطين)", nameEn: "Hebron (Palestine)", lat: 31.5326, lng: 35.0998, timezone: 3 },
  { name: "رام الله (فلسطين)", nameEn: "Ramallah (Palestine)", lat: 31.9038, lng: 35.2034, timezone: 3 },
  { name: "جنين (فلسطين)", nameEn: "Jenin (Palestine)", lat: 32.4608, lng: 35.2974, timezone: 3 },
  
  // باقي العواصم والمدن الإسلامية والعالمية
  { name: "مكة المكرمة (السعودية)", nameEn: "Makkah (Saudi Arabia)", lat: 21.4225, lng: 39.8262, timezone: 3 },
  { name: "المدينة المنورة (السعودية)", nameEn: "Madinah (Saudi Arabia)", lat: 24.5247, lng: 39.5692, timezone: 3 },
  { name: "الرياض (السعودية)", nameEn: "Riyadh (Saudi Arabia)", lat: 24.7136, lng: 46.6753, timezone: 3 },
  { name: "القاهرة (مصر)", nameEn: "Cairo (Egypt)", lat: 30.0444, lng: 31.2357, timezone: 3 },
  { name: "الإسكندرية (مصر)", nameEn: "Alexandria (Egypt)", lat: 31.2001, lng: 29.9187, timezone: 3 },
  { name: "عمّان (الأردن)", nameEn: "Amman (Jordan)", lat: 31.9454, lng: 35.9284, timezone: 3 },
  { name: "دمشق (سوريا)", nameEn: "Damascus (Syria)", lat: 33.5138, lng: 36.2765, timezone: 3 },
  { name: "بغداد (العراق)", nameEn: "Baghdad (Iraq)", lat: 33.3152, lng: 44.3661, timezone: 3 },
  { name: "أبوظبي (الإمارات)", nameEn: "Abu Dhabi (UAE)", lat: 24.4539, lng: 54.3773, timezone: 4 },
  { name: "دبي (الإمارات)", nameEn: "Dubai (UAE)", lat: 25.2048, lng: 55.2708, timezone: 4 },
  { name: "الدوحة (قطر)", nameEn: "Doha (Qatar)", lat: 25.2854, lng: 51.5310, timezone: 3 },
  { name: "الكويت (الكويت)", nameEn: "Kuwait City (Kuwait)", lat: 29.3759, lng: 47.9774, timezone: 3 },
  { name: "مسقط (عمان)", nameEn: "Muscat (Oman)", lat: 23.5859, lng: 58.4059, timezone: 4 },
  { name: "صنعاء (اليمن)", nameEn: "Sanaa (Yemen)", lat: 15.3694, lng: 44.1910, timezone: 3 },
  { name: "الرباط (المغرب)", nameEn: "Rabat (Morocco)", lat: 34.0209, lng: -6.8416, timezone: 1 },
  { name: "الجزائر (الجزائر)", nameEn: "Algiers (Algeria)", lat: 36.7538, lng: 3.0588, timezone: 1 },
  { name: "تونس (تونس)", nameEn: "Tunis (Tunisia)", lat: 36.8065, lng: 10.1815, timezone: 1 },
  { name: "طرابلس (ليبيا)", nameEn: "Tripoli (Libya)", lat: 32.8872, lng: 13.1913, timezone: 2 },
  { name: "الخرطوم (السودان)", nameEn: "Khartoum (Sudan)", lat: 15.5007, lng: 32.5599, timezone: 2 },
  { name: "إسطنبول (تركيا)", nameEn: "Istanbul (Turkey)", lat: 41.0082, lng: 28.9784, timezone: 3 },
  { name: "جاكرتا (إندونيسيا)", nameEn: "Jakarta (Indonesia)", lat: -6.2088, lng: 106.8456, timezone: 7 },
  { name: "كوالالمبور (ماليزيا)", nameEn: "Kuala Lumpur (Malaysia)", lat: 3.1390, lng: 101.6869, timezone: 8 },
  { name: "لندن (بريطانيا)", nameEn: "London (UK)", lat: 51.5074, lng: -0.1278, timezone: 1 },
  { name: "باريس (فرنسا)", nameEn: "Paris (France)", lat: 48.8566, lng: 2.3522, timezone: 2 }
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

  getSunPosition(julianDate) {
    const D = julianDate - 2451545.0;
    const g = (357.529 + 0.98560028 * D) % 360;
    const q = (280.459 + 0.98564736 * D) % 360;
    const L = (q + 1.915 * this.sinDeg(g) + 0.020 * this.sinDeg(2 * g)) % 360;
    const e = 23.439 - 0.00000036 * D;
    const d = this.asinDeg(this.sinDeg(e) * this.sinDeg(L));
    let RA = this.atan2Deg(this.cosDeg(e) * this.sinDeg(L), this.cosDeg(L)) / 15;
    RA = (RA + 24) % 24;
    const EqT = q / 15 - RA;
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

  calculateTimes(date, latitude, longitude, timezone, methodKey = "Egypt", asrJuristic = 1) {
    const method = PRAYER_METHODS[methodKey] || PRAYER_METHODS.Egypt;
    const jd = this.getJulianDate(date);
    const sun = this.getSunPosition(jd);

    // حساب وضبط المنطقة الزمنية بدقة تامة لمنع أي انحراف
    const lngEstimatedTz = Math.round(longitude / 15);
    let tz = (timezone !== undefined && timezone !== null && !isNaN(timezone)) ? Number(timezone) : lngEstimatedTz;
    
    // إذا كانت المنطقة الزمنية سالبة في دول الشرق الأوسط أو غير منطقية مقارنة بخط الطول، صححها تلقائياً
    if (longitude >= 20 && longitude <= 65 && tz <= 0) {
      tz = (lngEstimatedTz >= 2 && lngEstimatedTz <= 4) ? lngEstimatedTz : 3;
    } else if (Math.abs(tz - lngEstimatedTz) > 4) {
      tz = lngEstimatedTz;
    }

    const noon = 12 + tz - longitude / 15 - sun.equationOfTime;

    const timeForAltitude = (angle) => {
      const cosH = (this.sinDeg(angle) - this.sinDeg(latitude) * this.sinDeg(sun.declination)) /
                   (this.cosDeg(latitude) * this.cosDeg(sun.declination));
      if (cosH > 1 || cosH < -1) return null;
      return (1 / 15) * this.acosDeg(cosH);
    };

    const sunAngle = -0.833;
    const sunHalfDay = timeForAltitude(sunAngle);

    const sunrise = sunHalfDay !== null ? noon - sunHalfDay : noon - 6;
    const sunset = sunHalfDay !== null ? noon + sunHalfDay : noon + 6;

    let fajr;
    const fajrDiff = timeForAltitude(-method.fajrAngle);
    if (fajrDiff !== null) {
      fajr = noon - fajrDiff;
    } else {
      fajr = sunrise - 1.5;
    }

    const dhuhr = noon + (2 / 60);

    // حساب زاوية ارتفاع الشمس لوقت العصر بدقة فلكية تامة (ارتفاع موجب فوق الأفق)
    const asrAltitude = this.atanDeg(1 / (asrJuristic + this.tanDeg(Math.abs(latitude - sun.declination))));
    const asrDiff = timeForAltitude(asrAltitude);
    const asr = asrDiff !== null ? noon + asrDiff : noon + 3.6;

    const maghrib = sunset + (2 / 60);

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
