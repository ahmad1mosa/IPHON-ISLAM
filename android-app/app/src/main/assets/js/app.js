// التطبيق الرئيسي الشامل - GS إسلام (GS ISLAM)
const APP_VERSION = "2.4.0";

document.addEventListener("DOMContentLoaded", () => {
  checkVersionUpdate();

  // 1. حالة التطبيق العامة
  const state = {
    currentTab: "prayer",
    selectedCity: DEFAULT_CITIES[0], // 🇵🇸 القدس الشريف (فلسطين)
    calculationMethod: "Egypt",
    theme: "dark",
    adhanSound: true,
    compassHeading: 0,
    qiblaBearing: 157,
    compassMode: "sensor",
    rawTimes: null
  };

  function checkVersionUpdate() {
    try {
      const savedVersion = localStorage.getItem("gs_app_version");
      if (savedVersion !== APP_VERSION) {
        localStorage.setItem("gs_app_version", APP_VERSION);
        if (!localStorage.getItem("gs_selected_city")) {
          localStorage.setItem("gs_selected_city", JSON.stringify(DEFAULT_CITIES[0]));
        }
      }
    } catch (e) {}
  }

  // تطبيق اللغة المحفوظة أولاً
  window.I18nManager.applyLanguage();

  // تحميل الإعدادات المحفوظة
  loadAppSettings();

  // تهيئة الأقسام
  initNavigation();
  initTheme();
  initLanguageSwitcher();
  initDateAndPrayer();
  initQiblaCompass();
  initTasbeehUI();
  initQuranUI();
  initAdhkarUI();
  initSettingsUI();
  setupBackButtonHandler();

  // تحديث التوقيت والعد التنازلي كل ثانية
  setInterval(() => {
    updateClockAndCountdown();
  }, 1000);

  // الاستماع لتغيير اللغة
  window.addEventListener("languageChanged", () => {
    updateDateDisplay();
    calculateAndRenderPrayers();
    renderCitySelect();
    if (window.QuranManager) window.QuranManager.updateLastReadBanner();
    if (window.renderAdhkarAccordions) window.renderAdhkarAccordions();
  });

  /* -------------------------------------------------------------
     التعامل مع زر الرجوع في الأندرويد والهاتف (Back Button Handler)
  ------------------------------------------------------------- */
  function setupBackButtonHandler() {
    window.handleAndroidBackPressed = function() {
      // 1. إذا كانت نافذة قراءة القرآن مفتوحة، أغلقها وعد لقائمة السور
      const readerModal = document.getElementById("quran-reader-modal");
      if (readerModal && readerModal.classList.contains("active")) {
        closeQuranReader();
        return true;
      }

      // 2. إذا كان هناك أي سلايد أذكار مفتوح، أغلقه
      const openAdhkarAcc = document.querySelector(".adhkar-category-accordion.open");
      if (openAdhkarAcc) {
        openAdhkarAcc.classList.remove("open");
        return true;
      }

      // 3. إذا كان هناك أي سلايد إعدادات مفتوح، أغلقه
      const openSettingsAcc = document.querySelector(".settings-accordion.open");
      if (openSettingsAcc) {
        openSettingsAcc.classList.remove("open");
        return true;
      }

      // 4. إذا كان المستخدم في تبويب آخر غير المواقيت، ارجع لتبويب المواقيت
      if (state.currentTab !== "prayer") {
        switchTab("prayer");
        return true;
      }

      // 5. السماح بالخروج الطبيعي من التطبيق إذا كان في الشاشة الرئيسية
      return false;
    };

    window.addEventListener("popstate", (e) => {
      window.handleAndroidBackPressed();
    });
  }

  /* -------------------------------------------------------------
     الإعدادات العامة وإدارة المظهر
  ------------------------------------------------------------- */
  function loadAppSettings() {
    try {
      const savedCity = localStorage.getItem("gs_selected_city");
      if (savedCity) {
        state.selectedCity = JSON.parse(savedCity);
      } else {
        state.selectedCity = DEFAULT_CITIES[0]; // القدس الشريف
      }
      const savedMethod = localStorage.getItem("gs_calc_method");
      if (savedMethod) state.calculationMethod = savedMethod;

      const savedTheme = localStorage.getItem("gs_theme");
      if (savedTheme) state.theme = savedTheme;

      const savedAdhanSound = localStorage.getItem("gs_adhan_sound");
      if (savedAdhanSound !== null) state.adhanSound = savedAdhanSound === "true";
    } catch (e) {}
  }

  function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.innerHTML = state.theme === "dark" ? "☀️" : "🌙";
      themeBtn.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", state.theme);
        themeBtn.innerHTML = state.theme === "dark" ? "☀️" : "🌙";
        try {
          localStorage.setItem("gs_theme", state.theme);
        } catch (e) {}
      });
    }
  }

  /* -------------------------------------------------------------
     مبدل اللغات المتعددة (Language Switcher)
  ------------------------------------------------------------- */
  function initLanguageSwitcher() {
    const langSelectHeader = document.getElementById("header-lang-select");
    const langSelectSettings = document.getElementById("settings-lang-select");

    const syncLangSelects = (val) => {
      if (langSelectHeader) langSelectHeader.value = val;
      if (langSelectSettings) langSelectSettings.value = val;
    };

    if (langSelectHeader) {
      langSelectHeader.value = window.I18nManager.currentLang;
      langSelectHeader.addEventListener("change", (e) => {
        window.I18nManager.setLanguage(e.target.value);
        syncLangSelects(e.target.value);
      });
    }

    if (langSelectSettings) {
      langSelectSettings.value = window.I18nManager.currentLang;
      langSelectSettings.addEventListener("change", (e) => {
        window.I18nManager.setLanguage(e.target.value);
        syncLangSelects(e.target.value);
      });
    }
  }

  /* -------------------------------------------------------------
     التنقل بين التبويبات (Bottom Navigation)
  ------------------------------------------------------------- */
  function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll(".nav-item").forEach(btn => {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    document.querySelectorAll(".tab-pane").forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* -------------------------------------------------------------
     مواقيت الصلاة، العد التنازلي، والقبلة
  ------------------------------------------------------------- */
  function initDateAndPrayer() {
    updateDateDisplay();
    calculateAndRenderPrayers();

    const gpsBtn = document.getElementById("btn-detect-location");
    if (gpsBtn) {
      gpsBtn.addEventListener("click", detectUserGPS);
    }

    // سلايد مواقيت الصلاة
    const prayerAccHeader = document.getElementById("prayer-accordion-header");
    const prayerAcc = document.getElementById("prayer-times-accordion");
    if (prayerAccHeader && prayerAcc) {
      prayerAccHeader.addEventListener("click", () => {
        prayerAcc.classList.toggle("open");
      });
    }

    renderCitySelect();
  }

  function renderCitySelect() {
    const citySelect = document.getElementById("city-select-input");
    if (citySelect) {
      citySelect.innerHTML = "";
      const isArabic = window.I18nManager.currentLang === "ar" || window.I18nManager.currentLang === "ur";

      DEFAULT_CITIES.forEach((c, idx) => {
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = isArabic ? c.name : (c.nameEn || c.name);
        if (c.name === state.selectedCity.name) opt.selected = true;
        citySelect.appendChild(opt);
      });

      citySelect.addEventListener("change", (e) => {
        const city = DEFAULT_CITIES[e.target.value];
        if (city) {
          state.selectedCity = city;
          try {
            localStorage.setItem("gs_selected_city", JSON.stringify(city));
          } catch (err) {}
          calculateAndRenderPrayers();
        }
      });
    }
  }

  function updateDateDisplay() {
    const date = new Date();
    const isArabic = window.I18nManager.currentLang === "ar" || window.I18nManager.currentLang === "ur";

    let hijriStr = "";
    try {
      hijriStr = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date);
    } catch (e) {
      hijriStr = "التاريخ الهجري المبارك";
    }

    let gregStr = "";
    try {
      const locale = isArabic ? "ar-EG" : (window.I18nManager.currentLang || "en-US");
      gregStr = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date);
    } catch (e) {
      gregStr = date.toLocaleDateString();
    }

    const hijriEl = document.getElementById("header-hijri-date");
    const gregEl = document.getElementById("header-greg-date");
    if (hijriEl) hijriEl.textContent = `🕌 ${hijriStr}`;
    if (gregEl) gregEl.textContent = gregStr;
  }

  function detectUserGPS() {
    const locText = document.getElementById("current-location-name");
    const i18n = window.I18nManager;
    if (!navigator.geolocation) {
      alert("GPS is not supported in this browser.");
      return;
    }

    if (locText) locText.textContent = i18n.t("locating");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const tz = -(new Date().getTimezoneOffset() / 60);

        state.selectedCity = {
          name: i18n.currentLang === "ar" ? "موقعي الحالي (GPS)" : "Current Location (GPS)",
          nameEn: "Current Location (GPS)",
          lat: lat,
          lng: lng,
          timezone: tz
        };
        try {
          localStorage.setItem("gs_selected_city", JSON.stringify(state.selectedCity));
        } catch (e) {}

        calculateAndRenderPrayers();
      },
      (err) => {
        console.warn("GPS error", err);
        calculateAndRenderPrayers();
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  function calculateAndRenderPrayers() {
    const today = new Date();
    const city = state.selectedCity;
    const isArabic = window.I18nManager.currentLang === "ar" || window.I18nManager.currentLang === "ur";
    const locText = document.getElementById("current-location-name");
    if (locText) locText.textContent = isArabic ? city.name : (city.nameEn || city.name);

    const result = window.PrayerCalculator.calculateTimes(
      today,
      city.lat,
      city.lng,
      city.timezone,
      state.calculationMethod
    );

    state.rawTimes = result.rawTimes;

    const i18n = window.I18nManager;
    const prayerMap = {
      fajr: { name: i18n.t("fajr"), icon: "🌌", time: result.fajr },
      sunrise: { name: i18n.t("sunrise"), icon: "🌅", time: result.sunrise },
      dhuhr: { name: i18n.t("dhuhr"), icon: "☀️", time: result.dhuhr },
      asr: { name: i18n.t("asr"), icon: "⛅", time: result.asr },
      maghrib: { name: i18n.t("maghrib"), icon: "🌇", time: result.maghrib },
      isha: { name: i18n.t("isha"), icon: "🌃", time: result.isha }
    };

    const container = document.getElementById("prayer-times-grid");
    if (container) {
      container.innerHTML = "";
      Object.keys(prayerMap).forEach(key => {
        const item = prayerMap[key];
        const card = document.createElement("div");
        card.className = "prayer-card";
        card.id = `prayer-card-${key}`;
        card.innerHTML = `
          <div class="prayer-icon">${item.icon}</div>
          <div class="prayer-info">
            <span class="prayer-name">${item.name}</span>
            <span class="prayer-time">${item.time}</span>
          </div>
        `;
        container.appendChild(card);
      });
    }

    state.qiblaBearing = window.PrayerCalculator.calculateQibla(city.lat, city.lng);
    const qiblaDegEl = document.getElementById("qibla-degree-text");
    if (qiblaDegEl) qiblaDegEl.textContent = `${state.qiblaBearing}° ${i18n.t("qiblaTowardsKaaba")}`;
    updateCompassNeedle();

    updateClockAndCountdown();
  }

  function updateClockAndCountdown() {
    if (!state.rawTimes) return;

    const res = window.PrayerCalculator.getNextPrayer(state.rawTimes);
    const countdownEl = document.getElementById("next-prayer-countdown");
    const nextNameEl = document.getElementById("next-prayer-name");

    if (countdownEl) countdownEl.textContent = res.countdownFormatted;
    if (nextNameEl && res.nextPrayer) nextNameEl.textContent = res.nextPrayer.name;

    document.querySelectorAll(".prayer-card").forEach(c => c.classList.remove("next-active"));
    if (res.nextPrayer) {
      const activeCard = document.getElementById(`prayer-card-${res.nextPrayer.key}`);
      if (activeCard) activeCard.classList.add("next-active");
    }
  }

  /* -------------------------------------------------------------
     بوصلة القبلة بطراز iOS المحدّثة مع الأرقام والدرجات
  ------------------------------------------------------------- */
  function initQiblaCompass() {
    // رسم علامات الدرجات في SVG
    buildCompassTicks();

    const toggleModeBtn = document.getElementById("btn-toggle-compass-mode");
    if (toggleModeBtn) {
      toggleModeBtn.addEventListener("click", () => {
        state.compassMode = state.compassMode === "sensor" ? "static" : "sensor";
        toggleModeBtn.textContent = state.compassMode === "sensor" ? "🔄 وضع الحساس" : "🕋 وضع ثابت";
        updateCompassNeedle();
      });
    }

    let smoothedWebHeading = -1;
    const handleOrientation = (event) => {
      if (state.compassMode !== "sensor") return;

      let heading = null;

      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        // iOS - قيمة مباشرة وصحيحة
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== null && event.alpha !== undefined) {
        if (event.absolute === true) {
          heading = (360 - event.alpha) % 360;
        } else {
          heading = (360 - event.alpha) % 360;
        }
      }

      if (heading === null) return;

      // فلترة وتنعيم الزوايا لمنع الاهتزاز في المتصفح والآيفون
      if (smoothedWebHeading < 0) {
        smoothedWebHeading = heading;
      } else {
        const diff = (heading - smoothedWebHeading + 540) % 360 - 180;
        if (Math.abs(diff) < 0.4) return;
        smoothedWebHeading = (smoothedWebHeading + 0.18 * diff + 360) % 360;
      }

      state.compassHeading = Math.round(smoothedWebHeading);
      updateCompassNeedle();
    };

    // استقبال درجات البوصلة مباشرة من هاردوير الأندرويد الأصلي المفلتر
    window.onAndroidHeadingUpdate = (heading) => {
      if (state.compassMode !== "sensor") return;
      state.compassHeading = Math.round(heading);
      updateCompassNeedle();
    };

    // الاستماع للحدثين في المتصفحات والآيفون - مطلق أولاً ثم نسبي كبديل
    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS 13+ يحتاج إذناً
        document.getElementById("btn-toggle-compass-mode").addEventListener("click", () => {
          DeviceOrientationEvent.requestPermission().then(response => {
            if (response === "granted") {
              window.addEventListener("deviceorientation", handleOrientation, true);
            }
          }).catch(console.error);
        }, { once: true });
      } else {
        window.addEventListener("deviceorientationabsolute", handleOrientation, true);
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    }
  }

  function buildCompassTicks() {
    const ticksGroup = document.getElementById("compass-ticks-group");
    const labelsGroup = document.getElementById("compass-labels-group");
    if (!ticksGroup || !labelsGroup) return;

    ticksGroup.innerHTML = "";
    labelsGroup.innerHTML = "";

    const cx = 140, cy = 140, r = 132;

    // رسم علامات الدرجات الدقيقة كل 2 درجة
    for (let deg = 0; deg < 360; deg += 2) {
      const rad = (deg - 90) * (Math.PI / 180);
      const isMajor30 = deg % 30 === 0;
      const isMajor10 = deg % 10 === 0;
      const tickLen = isMajor30 ? 15 : (isMajor10 ? 9 : 4.5);

      const x1 = cx + r * Math.cos(rad);
      const y1 = cy + r * Math.sin(rad);
      const x2 = cx + (r - tickLen) * Math.cos(rad);
      const y2 = cy + (r - tickLen) * Math.sin(rad);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1.toFixed(1));
      line.setAttribute("y1", y1.toFixed(1));
      line.setAttribute("x2", x2.toFixed(1));
      line.setAttribute("y2", y2.toFixed(1));

      if (isMajor30) {
        line.setAttribute("stroke", "#ffffff");
        line.setAttribute("stroke-width", "2");
      } else if (isMajor10) {
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.75)");
        line.setAttribute("stroke-width", "1.2");
      } else {
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.35)");
        line.setAttribute("stroke-width", "0.8");
      }
      ticksGroup.appendChild(line);

      // الأرقام كل 30 درجة (0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330)
      if (isMajor30) {
        const numR = r - 26;
        const nx = cx + numR * Math.cos(rad);
        const ny = cy + numR * Math.sin(rad);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", nx.toFixed(1));
        text.setAttribute("y", (ny + 4).toFixed(1));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "11");
        text.setAttribute("font-weight", "600");
        text.setAttribute("fill", "#ffffff");
        text.setAttribute("font-family", "Outfit, -apple-system, sans-serif");
        text.textContent = deg.toString();
        labelsGroup.appendChild(text);
      }
    }

    // الحروف الأساسية N, E, S, W والمثلث الأحمر
    const cardinalDefs = [
      { letter: "N", deg: 0, color: "#ef4444", size: 16, weight: 900 },
      { letter: "E", deg: 90, color: "#ffffff", size: 15, weight: 800 },
      { letter: "S", deg: 180, color: "#ffffff", size: 15, weight: 800 },
      { letter: "W", deg: 270, color: "#ffffff", size: 15, weight: 800 }
    ];

    cardinalDefs.forEach(c => {
      const rad = (c.deg - 90) * (Math.PI / 180);
      const lx = cx + (r - 46) * Math.cos(rad);
      const ly = cy + (r - 46) * Math.sin(rad);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", lx.toFixed(1));
      text.setAttribute("y", (ly + 5).toFixed(1));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", c.size.toString());
      text.setAttribute("font-weight", c.weight.toString());
      text.setAttribute("fill", c.color);
      text.setAttribute("font-family", "Outfit, -apple-system, sans-serif");
      text.textContent = c.letter;
      labelsGroup.appendChild(text);

      // مثلث أحمر عند 0° للشمال مثل الآيفون بالضبط (صورة 2)
      if (c.deg === 0) {
        const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const p1 = `${cx},${(cy - r + 4).toFixed(1)}`;
        const p2 = `${(cx - 5).toFixed(1)},${(cy - r - 3).toFixed(1)}`;
        const p3 = `${(cx + 5).toFixed(1)},${(cy - r - 3).toFixed(1)}`;
        tri.setAttribute("points", `${p1} ${p2} ${p3}`);
        tri.setAttribute("fill", "#ef4444");
        labelsGroup.appendChild(tri);
      }
    });

    renderQiblaOnDisc();
  }

  function renderQiblaOnDisc() {
    const qiblaGroup = document.getElementById("compass-qibla-marker-group");
    if (!qiblaGroup) return;
    qiblaGroup.innerHTML = "";

    const cx = 140, cy = 140, r = 132;
    const bearing = state.qiblaBearing || 157;
    const rad = (bearing - 90) * (Math.PI / 180);

    // سهم القبلة الذهبي والأخضر يشير لمكة المكرمة
    const arrowTipR = r - 8;
    const arrowBaseR = arrowTipR - 32;

    const tipX = cx + arrowTipR * Math.cos(rad);
    const tipY = cy + arrowTipR * Math.sin(rad);

    const normalRad = rad + Math.PI / 2;
    const halfWidth = 7;

    const baseX = cx + arrowBaseR * Math.cos(rad);
    const baseY = cy + arrowBaseR * Math.sin(rad);

    const pLeftX = baseX + halfWidth * Math.cos(normalRad);
    const pLeftY = baseY + halfWidth * Math.sin(normalRad);

    const pRightX = baseX - halfWidth * Math.cos(normalRad);
    const pRightY = baseY - halfWidth * Math.sin(normalRad);

    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("points", `${tipX.toFixed(1)},${tipY.toFixed(1)} ${pLeftX.toFixed(1)},${pLeftY.toFixed(1)} ${pRightX.toFixed(1)},${pRightY.toFixed(1)}`);
    arrow.setAttribute("fill", "#10b981");
    arrow.setAttribute("stroke", "#d4af37");
    arrow.setAttribute("stroke-width", "1.5");
    arrow.setAttribute("filter", "drop-shadow(0 0 8px rgba(16, 185, 129, 0.95))");
    qiblaGroup.appendChild(arrow);

    // أيقونة الكعبة المشرفة 🕋
    const kaabaR = arrowBaseR - 18;
    const kx = cx + kaabaR * Math.cos(rad);
    const ky = cy + kaabaR * Math.sin(rad);

    const kaabaText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    kaabaText.setAttribute("x", kx.toFixed(1));
    kaabaText.setAttribute("y", (ky + 6).toFixed(1));
    kaabaText.setAttribute("text-anchor", "middle");
    kaabaText.setAttribute("font-size", "17");
    kaabaText.textContent = "🕋";
    qiblaGroup.appendChild(kaabaText);
  }

  function getDirectionLabel(deg) {
    if (deg < 22.5 || deg >= 337.5) return "N";
    if (deg < 67.5) return "NE";
    if (deg < 112.5) return "E";
    if (deg < 157.5) return "SE";
    if (deg < 202.5) return "S";
    if (deg < 247.5) return "SW";
    if (deg < 292.5) return "W";
    return "NW";
  }

  function updateCompassNeedle() {
    const compassDisc = document.getElementById("compass-dial-disc");
    const degDisplay = document.getElementById("compass-deg-display");
    const dirDisplay = document.getElementById("compass-dir-display");
    const qiblaBadge = document.getElementById("qibla-degree-text");

    let dialRotation = 0;

    if (state.compassMode === "static") {
      // وضع ثابت: القرص لا يدور
      dialRotation = 0;
    } else {
      // وضع الحساس: القرص يدور عكس اتجاه الهاتف لتتوافق قمة البوصلة مع الاتجاه
      dialRotation = -state.compassHeading;
    }

    if (compassDisc) {
      compassDisc.style.transform = `rotate(${dialRotation}deg)`;
    }

    // تحديث رقم الدرجة الكبير
    const currentDeg = Math.round((state.compassHeading + 360) % 360);
    if (degDisplay) degDisplay.textContent = currentDeg;
    if (dirDisplay) dirDisplay.textContent = `° ${getDirectionLabel(currentDeg)}`;

    // فحص المحاذاة مع القبلة المشرفة
    if (qiblaBadge) {
      const qiblaDiff = Math.abs(((currentDeg - state.qiblaBearing + 540) % 360) - 180);
      if (qiblaDiff <= 4) {
        qiblaBadge.classList.add("aligned");
        qiblaBadge.innerHTML = `🕋 نحو الكعبة المشرفة (${state.qiblaBearing}°) ✓`;
      } else {
        qiblaBadge.classList.remove("aligned");
        qiblaBadge.innerHTML = `🧭 اتجاه القبلة: ${state.qiblaBearing}° (${state.selectedCity.name})`;
      }
    }
  }

  /* -------------------------------------------------------------
     المسبحة الإلكترونية التفاعلية المزدوجة (Dual Counter)
  ------------------------------------------------------------- */
  function initTasbeehUI() {
    const tasbeeh = window.SmartTasbeeh;
    const btnTap = document.getElementById("tasbeeh-tap-btn");
    const countDisplay = document.getElementById("tasbeeh-count-display");
    const roundDisplay = document.getElementById("tasbeeh-round-display");
    const miniRoundsDisplay = document.getElementById("tasbeeh-mini-rounds-count");
    const miniCircle = document.getElementById("tasbeeh-mini-circle");
    const targetDisplay = document.getElementById("tasbeeh-target-display");
    const dhikrTitle = document.getElementById("tasbeeh-active-dhikr");
    const progressCircle = document.getElementById("tasbeeh-progress-bar");
    const resetBtn = document.getElementById("tasbeeh-reset-btn");
    const soundToggleBtn = document.getElementById("tasbeeh-sound-btn");
    const vibrateToggleBtn = document.getElementById("tasbeeh-vibrate-btn");
    const dhikrSelector = document.getElementById("tasbeeh-dhikr-select");
    const targetSelect = document.getElementById("tasbeeh-target-select");
    const i18n = window.I18nManager;

    let prevRounds = tasbeeh.currentRound;

    function updateUI() {
      if (countDisplay) countDisplay.textContent = tasbeeh.currentCount;
      if (roundDisplay) roundDisplay.textContent = `${i18n.t("rounds")}: ${tasbeeh.currentRound}`;
      if (miniRoundsDisplay) miniRoundsDisplay.textContent = tasbeeh.currentRound;
      if (targetDisplay) targetDisplay.textContent = `${i18n.t("target")}: ${tasbeeh.target > 0 ? tasbeeh.target : '∞'}`;
      if (dhikrTitle) dhikrTitle.textContent = tasbeeh.selectedDhikr;

      if (progressCircle && tasbeeh.target > 0) {
        const totalLength = 2 * Math.PI * 110;
        const progress = Math.min(1, tasbeeh.currentCount / tasbeeh.target);
        const offset = totalLength * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;
      }

      // تأثير الوميض عند زيادة عدد الدورات في الدائرة الصغيرة
      if (tasbeeh.currentRound > prevRounds && miniCircle) {
        miniCircle.classList.add("pulse-glow");
        setTimeout(() => {
          miniCircle.classList.remove("pulse-glow");
        }, 600);
      }
      prevRounds = tasbeeh.currentRound;

      if (soundToggleBtn) soundToggleBtn.innerHTML = tasbeeh.soundEnabled ? "🔊" : "🔇";
      if (vibrateToggleBtn) vibrateToggleBtn.innerHTML = tasbeeh.vibrateEnabled ? "📳" : "🔕";
    }

    if (dhikrSelector) {
      dhikrSelector.innerHTML = "";
      tasbeeh.defaultDhikrs.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.text;
        opt.textContent = d.text;
        if (d.text === tasbeeh.selectedDhikr) opt.selected = true;
        dhikrSelector.appendChild(opt);
      });

      const customOpt = document.createElement("option");
      customOpt.value = "CUSTOM";
      customOpt.textContent = i18n.t("addCustomDhikr");
      dhikrSelector.appendChild(customOpt);

      dhikrSelector.addEventListener("change", (e) => {
        if (e.target.value === "CUSTOM") {
          const customText = prompt(i18n.t("customDhikrPrompt"));
          if (customText && customText.trim()) {
            tasbeeh.setDhikr(customText.trim());
          } else {
            dhikrSelector.value = tasbeeh.selectedDhikr;
          }
        } else {
          tasbeeh.setDhikr(e.target.value);
        }
        updateUI();
      });
    }

    if (targetSelect) {
      targetSelect.value = tasbeeh.target.toString();
      targetSelect.addEventListener("change", (e) => {
        tasbeeh.setTarget(parseInt(e.target.value, 10));
        updateUI();
      });
    }

    let lastTapTime = 0;
    function doTasbeehTap(e) {
      const now = Date.now();
      if (now - lastTapTime < 80) return;
      lastTapTime = now;
      if (e && e.cancelable) e.preventDefault();
      tasbeeh.increment();
      updateUI();
      if (btnTap) {
        btnTap.style.transform = "scale(0.93)";
        setTimeout(() => { if (btnTap) btnTap.style.transform = ""; }, 120);
      }
    }

    if (btnTap) {
      btnTap.addEventListener("click", doTasbeehTap);
      btnTap.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch") {
          doTasbeehTap(e);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm(i18n.t("confirmReset"))) {
          tasbeeh.reset(true);
          prevRounds = 0;
          updateUI();
        }
      });
    }

    if (soundToggleBtn) {
      soundToggleBtn.addEventListener("click", () => {
        tasbeeh.soundEnabled = !tasbeeh.soundEnabled;
        tasbeeh.saveSettings();
        updateUI();
      });
    }

    if (vibrateToggleBtn) {
      vibrateToggleBtn.addEventListener("click", () => {
        tasbeeh.vibrateEnabled = !tasbeeh.vibrateEnabled;
        tasbeeh.saveSettings();
        updateUI();
      });
    }

    // إتاحة الدالة عالمياً للاستدعاء الفوري المباشر
    window.handleTasbeehClick = doTasbeehTap;
    window.updateTasbeehUI = updateUI;

    updateUI();
  }

  /* -------------------------------------------------------------
     القرآن الكريم، استئناف القراءة، والتحكم السهل بالخط
  ------------------------------------------------------------- */
  function initQuranUI() {
    const quran = window.QuranManager;
    const surahListContainer = document.getElementById("quran-surahs-list");
    const searchInput = document.getElementById("quran-search-input");
    const readerModal = document.getElementById("quran-reader-modal");
    const closeReaderBtn = document.getElementById("close-quran-reader-btn");
    const backReaderBtn = document.getElementById("btn-reader-back");
    const reciterSelect = document.getElementById("quran-reciter-select");
    const playAudioBtn = document.getElementById("quran-play-btn");
    const fontIncreaseBtn = document.getElementById("quran-font-increase");
    const fontDecreaseBtn = document.getElementById("quran-font-decrease");
    const fontSlider = document.getElementById("quran-font-slider");
    const lastReadCard = document.getElementById("quran-last-read-card");
    const i18n = window.I18nManager;

    quran.updateLastReadBanner();

    if (lastReadCard) {
      lastReadCard.addEventListener("click", () => {
        if (quran.lastRead && quran.lastRead.surahNumber) {
          openSurahReader(quran.lastRead.surahNumber, quran.lastRead.ayahNumber);
        }
      });
    }

    if (fontIncreaseBtn) {
      fontIncreaseBtn.addEventListener("click", () => {
        quran.setFontSize(quran.fontSize + 2);
      });
    }
    if (fontDecreaseBtn) {
      fontDecreaseBtn.addEventListener("click", () => {
        quran.setFontSize(quran.fontSize - 2);
      });
    }
    if (fontSlider) {
      fontSlider.value = quran.fontSize;
      fontSlider.addEventListener("input", (e) => {
        quran.setFontSize(parseInt(e.target.value, 10));
      });
    }
    document.querySelectorAll(".font-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const size = parseInt(btn.getAttribute("data-size"), 10);
        quran.setFontSize(size);
        document.querySelectorAll(".font-preset-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // ==============================================================
    // التكبير والتصغير بإصبعين (Pinch-to-Zoom Gesture for Verses)
    // ==============================================================
    const surahContent = document.getElementById("quran-surah-content");
    let pinchStartDistance = 0;
    let pinchStartFontSize = 28;
    let isPinchZooming = false;

    function getTouchesDistance(e) {
      if (!e.touches || e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    if (surahContent) {
      surahContent.addEventListener("touchstart", (e) => {
        if (e.touches && e.touches.length === 2) {
          isPinchZooming = true;
          pinchStartDistance = getTouchesDistance(e);
          pinchStartFontSize = quran.fontSize || 28;
        }
      }, { passive: true });

      surahContent.addEventListener("touchmove", (e) => {
        if (isPinchZooming && e.touches && e.touches.length === 2) {
          const currentDistance = getTouchesDistance(e);
          if (pinchStartDistance > 20 && currentDistance > 20) {
            if (e.cancelable) e.preventDefault();
            const ratio = currentDistance / pinchStartDistance;
            const newFontSize = Math.round(pinchStartFontSize * ratio);
            const clamped = Math.min(54, Math.max(18, newFontSize));
            if (clamped !== quran.fontSize) {
              quran.setFontSize(clamped);
            }
          }
        }
      }, { passive: false });

      const stopPinch = () => {
        isPinchZooming = false;
      };

      surahContent.addEventListener("touchend", stopPinch);
      surahContent.addEventListener("touchcancel", stopPinch);
    }

    function renderSurahList(filter = "") {
      if (!surahListContainer) return;
      surahListContainer.innerHTML = "";

      const filtered = SURAH_LIST.filter(s => {
        const query = filter.trim().toLowerCase();
        return s.name.includes(query) ||
               s.englishName.toLowerCase().includes(query) ||
               s.number.toString() === query;
      });

      filtered.forEach(s => {
        const card = document.createElement("div");
        card.className = "surah-card";
        const isMeccan = s.revelationType === "Meccan";
        const typeLabel = isMeccan ? i18n.t("meccan") : i18n.t("medinan");

        card.innerHTML = `
          <div class="surah-card-right">
            <div class="surah-number-badge">${s.number}</div>
            <div class="surahs-titles">
              <div class="surah-name-arabic">${s.name}</div>
              <div class="surah-name-english">${s.englishName}</div>
            </div>
          </div>
          <div class="surah-meta">
            <span>${s.numberOfAyahs} ${i18n.t("verses")}</span>
            <span class="surah-type-badge">${typeLabel}</span>
          </div>
        `;

        card.addEventListener("click", () => {
          openSurahReader(s.number, 1);
        });

        surahListContainer.appendChild(card);
      });
    }

    renderSurahList();

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        renderSurahList(e.target.value);
      });
    }

    async function openSurahReader(surahNumber, targetAyah = 1) {
      if (!readerModal) return;
      readerModal.classList.add("active");
      document.body.style.overflow = "hidden";

      try {
        history.pushState({ modal: "quran_reader" }, "");
      } catch (e) {}

      const titleEl = document.getElementById("reader-surah-title");
      const contentEl = document.getElementById("quran-surah-content");

      const surahMeta = SURAH_LIST.find(s => s.number === surahNumber);
      if (titleEl) titleEl.textContent = surahMeta ? surahMeta.name : `سورة ${surahNumber}`;
      if (contentEl) {
        contentEl.innerHTML = `<div style="text-align:center; padding: 40px 0; color: var(--text-gold);">جاري تحميل السورة الكريمة...</div>`;
      }

      const surahData = await quran.fetchSurah(surahNumber);
      if (!contentEl) return;

      contentEl.style.fontSize = `${quran.fontSize}px`;
      contentEl.innerHTML = "";

      if (surahNumber !== 9 && surahNumber !== 1) {
        const basmalah = document.createElement("div");
        basmalah.className = "basmalah-container";
        basmalah.textContent = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
        contentEl.appendChild(basmalah);
      }

      surahData.ayahs.forEach(a => {
        const ayahSpan = document.createElement("span");
        ayahSpan.className = "ayah-text";
        ayahSpan.id = `ayah-${a.numberInSurah}`;
        ayahSpan.textContent = a.text + " ";

        const numSymbol = document.createElement("span");
        numSymbol.className = "ayah-number-symbol";
        numSymbol.textContent = `﴿${a.numberInSurah}﴾`;
        numSymbol.title = `الآية ${a.numberInSurah}`;

        ayahSpan.appendChild(numSymbol);

        // النقر على أي آية يبدأ تلاوتها فوراً ويظللها باللون الذهبي
        ayahSpan.addEventListener("click", () => {
          quran.playAyah(surahNumber, a.numberInSurah);
        });

        contentEl.appendChild(ayahSpan);
      });

      quran.setLastRead(surahNumber, surahData.name, targetAyah);

      setTimeout(() => {
        const targetEl = document.getElementById(`ayah-${targetAyah}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);

      contentEl.onscroll = () => {
        const ayahs = contentEl.querySelectorAll(".ayah-text");
        for (let el of ayahs) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 100 && rect.top <= 250) {
            const num = parseInt(el.id.replace("ayah-", ""), 10);
            if (num && num !== quran.lastRead.ayahNumber) {
              quran.setLastRead(surahNumber, surahData.name, num);
            }
            break;
          }
        }
      };
    }

    window.closeQuranReader = function() {
      if (readerModal) {
        readerModal.classList.remove("active");
        document.body.style.overflow = "";
        quran.pauseAudio();
        quran.removeAyahHighlight();
        quran.updateLastReadBanner();
      }
    };

    if (closeReaderBtn) closeReaderBtn.addEventListener("click", window.closeQuranReader);
    if (backReaderBtn) backReaderBtn.addEventListener("click", window.closeQuranReader);

    const prevAyahBtn = document.getElementById("quran-prev-ayah-btn");
    const nextAyahBtn = document.getElementById("quran-next-ayah-btn");
    const bookmarkBtn = document.getElementById("quran-bookmark-btn");

    if (prevAyahBtn) {
      prevAyahBtn.addEventListener("click", () => {
        quran.prevAyah();
      });
    }

    if (nextAyahBtn) {
      nextAyahBtn.addEventListener("click", () => {
        quran.nextAyah();
      });
    }

    if (bookmarkBtn) {
      bookmarkBtn.addEventListener("click", () => {
        const surahMeta = SURAH_LIST.find(s => s.number === quran.currentSurah);
        const name = surahMeta ? surahMeta.name : `سورة ${quran.currentSurah}`;
        quran.toggleBookmark(quran.currentSurah, name, quran.currentAyah);
        alert(`تم حفظ العلامة المرجعية: ${name} - الآية ${quran.currentAyah} 📌`);
      });
    }

    if (reciterSelect) {
      reciterSelect.innerHTML = `
        <option value="ar.alafasy">مشاري العفاسي</option>
        <option value="ar.abdulbasitmurattal">عبد الباسط عبد الصمد</option>
        <option value="ar.mahermuaiqly">ماهر المعيقلي</option>
        <option value="ar.husary">محمود خليل الحصري</option>
        <option value="ar.minshawi">محمد صديق المنشاوي</option>
        <option value="ar.abdurrahmaansudais">عبد الرحمن السديس</option>
      `;
      reciterSelect.value = quran.currentReciter;
      reciterSelect.addEventListener("change", (e) => {
        quran.currentReciter = e.target.value;
        quran.saveSettings();
        if (quran.isPlaying) {
          quran.playAyah(quran.currentSurah, quran.currentAyah);
        }
      });
    }

    if (playAudioBtn) {
      playAudioBtn.addEventListener("click", () => {
        quran.togglePlayPause(quran.currentSurah, 1);
      });
    }
  }

  /* -------------------------------------------------------------
     الأذكار اليومية بالسلايدات المغلقة (Adhkar Accordions)
  ------------------------------------------------------------- */
  function initAdhkarUI() {
    const container = document.getElementById("adhkar-accordion-container");
    const adhkar = window.AdhkarManager;
    const i18n = window.I18nManager;

    window.renderAdhkarAccordions = function() {
      if (!container || !window.ADHKAR_DATA || !window.ADHKAR_DATA.categories) return;
      container.innerHTML = "";

      window.ADHKAR_DATA.categories.forEach(cat => {
        const items = window.ADHKAR_DATA.items[cat.id] || [];
        const progress = adhkar.getCategoryProgress(cat.id);

        const accordion = document.createElement("div");
        accordion.className = "adhkar-category-accordion";
        accordion.id = `adhkar-acc-${cat.id}`;

        accordion.innerHTML = `
          <div class="adhkar-accordion-header">
            <div class="adhkar-accordion-left">
              <div class="adhkar-cat-icon-box">${cat.icon}</div>
              <div class="adhkar-cat-text">
                <span class="adhkar-cat-title">${cat.title}</span>
                <span class="adhkar-cat-desc">${cat.desc}</span>
              </div>
            </div>
            <div class="adhkar-accordion-right">
              <span class="adhkar-progress-pill" id="pill-${cat.id}">${progress.done}/${progress.total}</span>
              <span class="adhkar-chevron">▼</span>
            </div>
          </div>
          <div class="adhkar-accordion-body">
            <div class="accordion-progress-bar-box">
              <div class="progress-bar-track">
                <div class="progress-bar-fill" id="fill-${cat.id}" style="width: ${progress.percent}%"></div>
              </div>
              <div class="progress-ratio-text" id="ratio-${cat.id}">
                ${i18n.t("progressRatio")} <strong>${progress.done}</strong> ${i18n.t("of")} ${progress.total} (${progress.percent}%)
              </div>
            </div>

            <div class="adhkar-cards-container" id="cards-${cat.id}">
              <!-- بطاقات الأذكار -->
            </div>

            <div class="reset-category-btn-wrap">
              <button class="btn-gps btn-reset-adhkar" data-cat="${cat.id}">
                ${i18n.t("resetCategory")}
              </button>
            </div>
          </div>
        `;

        const header = accordion.querySelector(".adhkar-accordion-header");
        header.addEventListener("click", () => {
          const isOpen = accordion.classList.contains("open");
          document.querySelectorAll(".adhkar-category-accordion").forEach(a => a.classList.remove("open"));
          if (!isOpen) {
            accordion.classList.add("open");
            renderCategoryCards(cat.id);
          }
        });

        const resetBtn = accordion.querySelector(".btn-reset-adhkar");
        if (resetBtn) {
          resetBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm(i18n.t("confirmResetCategory"))) {
              adhkar.resetCategory(cat.id);
              updateCategoryProgressUI(cat.id);
              renderCategoryCards(cat.id);
            }
          });
        }

        container.appendChild(accordion);
      });
    };

    function renderCategoryCards(catId) {
      const cardsBox = document.getElementById(`cards-${catId}`);
      if (!cardsBox || !window.ADHKAR_DATA) return;
      cardsBox.innerHTML = "";

      const items = window.ADHKAR_DATA.items[catId] || [];

      items.forEach((item) => {
        const remaining = adhkar.getRemainingCount(item);
        const isDone = remaining === 0;

        const card = document.createElement("div");
        card.className = `adhkar-card ${isDone ? 'done' : ''}`;
        card.innerHTML = `
          <div class="adhkar-text">${item.text}</div>
          ${item.fadl ? `<div class="adhkar-fadl">✨ <strong>${i18n.t("fadl")}:</strong> ${item.fadl}</div>` : ''}
          <div class="adhkar-card-footer">
            <button class="dhikr-counter-btn ${isDone ? 'done' : ''}">
              ${isDone ? i18n.t("completed") : `${i18n.t("remaining")}: ${remaining}`}
            </button>
          </div>
        `;

        const countBtn = card.querySelector(".dhikr-counter-btn");
        if (countBtn) {
          countBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            adhkar.decrementCount(item);
            updateCategoryProgressUI(catId);
            renderCategoryCards(catId);
          });
        }

        cardsBox.appendChild(card);
      });
    }

    function updateCategoryProgressUI(catId) {
      const progress = adhkar.getCategoryProgress(catId);
      const pill = document.getElementById(`pill-${catId}`);
      const fill = document.getElementById(`fill-${catId}`);
      const ratio = document.getElementById(`ratio-${catId}`);

      if (pill) pill.textContent = `${progress.done}/${progress.total}`;
      if (fill) fill.style.width = `${progress.percent}%`;
      if (ratio) {
        ratio.innerHTML = `${i18n.t("progressRatio")} <strong>${progress.done}</strong> ${i18n.t("of")} ${progress.total} (${progress.percent}%)`;
      }
    }

    window.renderAdhkarAccordions();
  }

  /* -------------------------------------------------------------
     الإعدادات والسلايدات المغلقة (Settings Accordions)
  ------------------------------------------------------------- */
  function initSettingsUI() {
    const accordions = document.querySelectorAll(".settings-accordion");

    accordions.forEach(acc => {
      const header = acc.querySelector(".accordion-header");
      if (header) {
        header.addEventListener("click", () => {
          const isOpen = acc.classList.contains("open");
          accordions.forEach(a => a.classList.remove("open"));
          if (!isOpen) {
            acc.classList.add("open");
          }
        });
      }
    });

    const calcMethodSelect = document.getElementById("calc-method-select");
    if (calcMethodSelect) {
      calcMethodSelect.innerHTML = "";
      Object.keys(PRAYER_METHODS).forEach(k => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = PRAYER_METHODS[k].name;
        if (k === state.calculationMethod) opt.selected = true;
        calcMethodSelect.appendChild(opt);
      });

      calcMethodSelect.addEventListener("change", (e) => {
        state.calculationMethod = e.target.value;
        try {
          localStorage.setItem("gs_calc_method", e.target.value);
        } catch (err) {}
        calculateAndRenderPrayers();
      });
    }

    const notifToggle = document.getElementById("notifications-toggle");
    if (notifToggle) {
      notifToggle.checked = state.adhanSound;
      notifToggle.addEventListener("change", (e) => {
        state.adhanSound = e.target.checked;
        try {
          localStorage.setItem("gs_adhan_sound", state.adhanSound.toString());
        } catch (err) {}
        if (state.adhanSound && "Notification" in window) {
          Notification.requestPermission();
        }
      });
    }
  }
});
