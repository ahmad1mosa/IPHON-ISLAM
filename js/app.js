// التطبيق الرئيسي الشامل - GS إسلام (GS ISLAM)
const APP_VERSION = "3.2.1";

document.addEventListener("DOMContentLoaded", () => {
  checkVersionUpdate();

  // 1. حالة التطبيق العامة
  const state = {
    currentTab: "prayer",
    selectedCity: DEFAULT_CITIES[0],
    calculationMethod: "Jordan",
    asrJuristic: 1, // 1 = الشافعي/الجمهور، 2 = الحنفي
    theme: "dark",
    adhanMasterEnabled: true, // المفتاح المنزلق الرئيسي لتنبيهات الأذان
    vibrationEnabled: true,    // المفتاح المنزلق للاهتزاز
    notificationsEnabled: true,// المفتاح المنزلق لإشعارات النظام
    prayerAlerts: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    adhanVolume: 1.0, // 0.0 إلى 1.0
    selectedAdhanVoice: "makkah",
    lastTriggeredPrayer: "",
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
        // إعادة تعيين المدينة الافتراضية للتأكد من تصحيح أي منطقة زمنية قديمة تالفة
        localStorage.setItem("gs_selected_city", JSON.stringify(DEFAULT_CITIES[0]));
        state.selectedCity = DEFAULT_CITIES[0];
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

  // الاستماع لتغيير اللغة وإعادة ترجمة وتحديث كافة القوائم والتطبيقات ديناميكياً
  window.addEventListener("languageChanged", () => {
    updateDateDisplay();
    calculateAndRenderPrayers();
    renderCitySelect();
    if (window.renderSurahList) window.renderSurahList();
    if (window.QuranManager) window.QuranManager.updateLastReadBanner();
    if (window.renderAdhkarAccordions) window.renderAdhkarAccordions();
    if (window.renderKhatmahUI) window.renderKhatmahUI();
    if (window.renderHifzUI) window.renderHifzUI();
    if (window.renderLibraryUI) window.renderLibraryUI();
    if (window.updateTasbeehUI) window.updateTasbeehUI();
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
        // التحقق من وجود timeZoneId في المدينة
        const matched = DEFAULT_CITIES.find(c => c.name === state.selectedCity.name || c.nameEn === state.selectedCity.nameEn);
        if (matched) {
          state.selectedCity = matched;
        }
      } else {
        state.selectedCity = DEFAULT_CITIES[0]; // عمّان (الأردن)
      }
      const savedMethod = localStorage.getItem("gs_calc_method");
      if (savedMethod && PRAYER_METHODS[savedMethod]) {
        state.calculationMethod = savedMethod;
      } else if (state.selectedCity && state.selectedCity.defaultMethod) {
        state.calculationMethod = state.selectedCity.defaultMethod;
      } else {
        state.calculationMethod = "Jordan";
      }

      const savedAsr = localStorage.getItem("gs_asr_juristic");
      if (savedAsr) state.asrJuristic = parseInt(savedAsr, 10);

      const savedTheme = localStorage.getItem("gs_theme");
      if (savedTheme) state.theme = savedTheme;

      const savedMaster = localStorage.getItem("gs_adhan_master");
      if (savedMaster !== null) state.adhanMasterEnabled = savedMaster === "true";

      const savedVibrate = localStorage.getItem("gs_adhan_vibrate");
      if (savedVibrate !== null) state.vibrationEnabled = savedVibrate === "true";

      const savedNotify = localStorage.getItem("gs_adhan_notify");
      if (savedNotify !== null) state.notificationsEnabled = savedNotify === "true";

      const savedPrayerAlerts = localStorage.getItem("gs_prayer_alerts");
      if (savedPrayerAlerts) {
        try {
          state.prayerAlerts = Object.assign({ fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true }, JSON.parse(savedPrayerAlerts));
        } catch (e) {}
      }

      const savedAdhanVolume = localStorage.getItem("gs_adhan_volume");
      if (savedAdhanVolume !== null) state.adhanVolume = parseFloat(savedAdhanVolume);

      const savedAdhanVoice = localStorage.getItem("gs_adhan_voice");
      if (savedAdhanVoice) state.selectedAdhanVoice = savedAdhanVoice;
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

        // مزامنة مظهر المصحف تلقائياً عند تغيير مظهر التطبيق العام
        const readerModal = document.getElementById("quran-reader-modal");
        const toggleThemeBtn = document.getElementById("btn-toggle-mushaf-theme");
        if (readerModal) {
          if (state.theme === "dark") {
            readerModal.classList.remove("mushaf-paper-theme");
            if (toggleThemeBtn) toggleThemeBtn.innerHTML = "📜";
            localStorage.setItem("gs_mushaf_theme", "dark");
          } else {
            readerModal.classList.add("mushaf-paper-theme");
            if (toggleThemeBtn) toggleThemeBtn.innerHTML = "🌙";
            localStorage.setItem("gs_mushaf_theme", "paper");
          }
        }
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
    const settingsCitySelect = document.getElementById("city-select-input");
    const isArabic = window.I18nManager.currentLang === "ar" || window.I18nManager.currentLang === "ur";
    const locText = document.getElementById("current-location-name");

    if (locText) {
      locText.textContent = isArabic ? state.selectedCity.name : (state.selectedCity.nameEn || state.selectedCity.name);
    }

    if (settingsCitySelect) {
      settingsCitySelect.innerHTML = "";

      if (state.selectedCity.isGps) {
        const gpsOpt = document.createElement("option");
        gpsOpt.value = "GPS";
        gpsOpt.textContent = `📍 ${state.selectedCity.name}`;
        gpsOpt.selected = true;
        settingsCitySelect.appendChild(gpsOpt);
      }

      DEFAULT_CITIES.forEach((c, idx) => {
        const opt = document.createElement("option");
        opt.value = idx.toString();
        opt.textContent = isArabic ? c.name : (c.nameEn || c.name);
        if (!state.selectedCity.isGps && c.name === state.selectedCity.name) {
          opt.selected = true;
        }
        settingsCitySelect.appendChild(opt);
      });

      settingsCitySelect.onchange = (e) => {
        const val = e.target.value;
        if (val === "GPS") return;
        const idx = parseInt(val, 10);
        const city = DEFAULT_CITIES[idx];
        if (city) {
          state.selectedCity = city;
          if (city.defaultMethod && PRAYER_METHODS[city.defaultMethod]) {
            state.calculationMethod = city.defaultMethod;
            try {
              localStorage.setItem("gs_calc_method", city.defaultMethod);
            } catch (err) {}
            const calcMethodSelect = document.getElementById("calc-method-select");
            if (calcMethodSelect) calcMethodSelect.value = city.defaultMethod;
          }
          try {
            localStorage.setItem("gs_selected_city", JSON.stringify(city));
          } catch (err) {}
          calculateAndRenderPrayers();
        }
      };
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
    const isArabic = i18n.currentLang === "ar" || i18n.currentLang === "ur";

    if (!navigator.geolocation) {
      alert(isArabic ? "خاصية تحديد الموقع غير مدعومة في هذا المتصفح." : "GPS is not supported in this browser.");
      return;
    }

    if (locText) {
      locText.textContent = isArabic ? "جاري تحديد موقعك عبر GPS... ⏳" : "Locating your position via GPS... ⏳";
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const localTz = -(new Date().getTimezoneOffset() / 60);

        state.selectedCity = {
          name: isArabic ? "موقعي الحالي (GPS)" : "Current Location (GPS)",
          nameEn: "Current Location (GPS)",
          lat: lat,
          lng: lng,
          timezone: localTz,
          isGps: true
        };

        try {
          localStorage.setItem("gs_selected_city", JSON.stringify(state.selectedCity));
        } catch (e) {}

        // محاولة جلب اسم المدينة بدقة عبر Reverse Geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
          headers: { "Accept-Language": isArabic ? "ar" : "en" }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.address) {
              const cityName = data.address.city || data.address.town || data.address.state || data.address.country || "موقعي الحالي";
              const countryName = data.address.country || "";
              state.selectedCity.name = countryName ? `${cityName} (${countryName})` : cityName;
              state.selectedCity.nameEn = cityName;
              try {
                localStorage.setItem("gs_selected_city", JSON.stringify(state.selectedCity));
              } catch (e) {}
              renderCitySelect();
              calculateAndRenderPrayers();
            }
          })
          .catch(() => {});

        renderCitySelect();
        calculateAndRenderPrayers();
      },
      (err) => {
        console.warn("GPS error", err);
        if (locText) {
          locText.textContent = isArabic ? "تعذر تحديد الموقع تلقائياً" : "Could not determine location";
        }
        calculateAndRenderPrayers();
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function calculateAndRenderPrayers() {
    const today = new Date();
    const city = state.selectedCity;
    const isArabic = window.I18nManager.currentLang === "ar" || window.I18nManager.currentLang === "ur";
    const locText = document.getElementById("current-location-name");
    if (locText) locText.textContent = isArabic ? city.name : (city.nameEn || city.name);

    // حساب فرق التوقيت الصيفي / الشتوي بدقة تامة
    const resolvedTz = window.PrayerCalculator.resolveTimezoneOffset(city, today);

    const result = window.PrayerCalculator.calculateTimes(
      today,
      city.lat,
      city.lng,
      resolvedTz,
      state.calculationMethod,
      state.asrJuristic
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

  /* -------------------------------------------------------------
     مشغل الأذان المبارك والتنبيهات المباشرة (Adhan Engine)
  ------------------------------------------------------------- */
  let adhanPlayer = new Audio();
  let isTestingAdhan = false;
  let isAdhanPlaying = false;
  let audioUnlocked = false;

  function unlockAudioSystem() {
    if (audioUnlocked) return;
    try {
      adhanPlayer.src = "audio/makkah.mp3";
      adhanPlayer.load();
      const p = adhanPlayer.play();
      if (p !== undefined) {
        p.then(() => {
          adhanPlayer.pause();
          adhanPlayer.currentTime = 0;
          audioUnlocked = true;
        }).catch(() => {
          audioUnlocked = true;
        });
      } else {
        audioUnlocked = true;
      }
    } catch (e) {}
  }

  window.addEventListener("touchstart", unlockAudioSystem, { once: true, passive: true });
  window.addEventListener("click", unlockAudioSystem, { once: true });

  function triggerVibrationPattern() {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate([600, 300, 600, 300, 600, 300, 1000]);
      }
    } catch (e) {}
  }

  function playSynthesizedChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.35);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.35 + 0.85);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.35);
        osc.stop(ctx.currentTime + i * 0.35 + 0.9);
      });
    } catch (e) {}
  }

  function playAdhanAudio(voiceId) {
    if (state.adhanMode === "silent") {
      return;
    }

    if (state.adhanMode === "vibrate") {
      triggerVibrationPattern();
      return;
    }

    const voice = (window.ADHAN_VOICES || []).find(v => v.id === (voiceId || state.selectedAdhanVoice)) || (window.ADHAN_VOICES && window.ADHAN_VOICES[0]);
    if (!voice) return;

    try {
      adhanPlayer.pause();
      adhanPlayer.src = voice.url;
      adhanPlayer.volume = Math.max(0, Math.min(1, state.adhanVolume !== undefined ? state.adhanVolume : 1.0));
      adhanPlayer.currentTime = 0;
      adhanPlayer.load();

      isAdhanPlaying = true;
      triggerVibrationPattern();

      const playPromise = adhanPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Adhan audio fallback:", err);
          playSynthesizedChime();
        });
      }

      adhanPlayer.onended = () => {
        isAdhanPlaying = false;
        isTestingAdhan = false;
        updateAdhanTestBtnUI();
        closeAdhanModal();
      };
    } catch (e) {
      playSynthesizedChime();
    }
  }

  function stopAdhanAudio() {
    try {
      adhanPlayer.pause();
      adhanPlayer.currentTime = 0;
    } catch (e) {}
    isAdhanPlaying = false;
    isTestingAdhan = false;
    updateAdhanTestBtnUI();
  }

  function updateAdhanTestBtnUI() {
    const testBtn = document.getElementById("btn-test-adhan");
    const testLabel = document.getElementById("test-adhan-label");
    if (testBtn && testLabel) {
      if (isTestingAdhan || isAdhanPlaying) {
        testLabel.textContent = "إيقاف صوت الأذان ⏹️";
        testBtn.style.background = "#ef4444";
      } else {
        testLabel.textContent = "تجربة صوت الأذان 🔊";
        testBtn.style.background = "";
      }
    }
  }

  function triggerAdhanAlert(prayerName, prayerKey) {
    if (!state.adhanMasterEnabled) return;
    if (state.prayerAlerts && state.prayerAlerts[prayerKey] === false) return;

    const todayDateStr = new Date().toDateString();
    const currentHM = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
    const triggerId = `${prayerKey}_${todayDateStr}_${currentHM}`;
    if (state.lastTriggeredPrayer === triggerId) return;
    state.lastTriggeredPrayer = triggerId;

    // 1. تشغيل صوت الأذان
    playAdhanAudio(state.selectedAdhanVoice);

    // 2. تشغيل نمط الاهتزاز إذا كان مفعلاً
    if (state.vibrationEnabled) {
      triggerVibrationPattern();
    }

    // 3. فتح نافذة التنبيه المرئية
    const modal = document.getElementById("adhan-alert-modal");
    const prayerText = document.getElementById("adhan-modal-prayer-text");
    const cityText = document.getElementById("adhan-modal-city-text");
    if (modal) {
      if (prayerText) prayerText.textContent = `صلاة ${prayerName}`;
      if (cityText) cityText.textContent = `حان الآن موعد الأذان المبارك في ${state.selectedCity.name}`;
      modal.classList.add("active");
    }

    // 4. إرسال إشعار للنظام وشاشة القفل إذا كان مفعلاً
    if (state.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`🕌 موعد أذان صلاة ${prayerName}`, {
          body: `حان الآن موعد رفع الأذان المبارك في ${state.selectedCity.name}`,
          icon: "icons/icon-512.png",
          badge: "icons/icon-512.png"
        });
      } catch (e) {}
    }
  }

  function closeAdhanModal() {
    const modal = document.getElementById("adhan-alert-modal");
    if (modal) modal.classList.remove("active");
    stopAdhanAudio();
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

    // فحص دقيق للحظة رفع الأذان
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const prayerTimesMap = {
      fajr: { name: "الفجر", time: window.PrayerCalculator.formatFloatHours(state.rawTimes.fajr) },
      dhuhr: { name: "الظهر", time: window.PrayerCalculator.formatFloatHours(state.rawTimes.dhuhr) },
      asr: { name: "العصر", time: window.PrayerCalculator.formatFloatHours(state.rawTimes.asr) },
      maghrib: { name: "المغرب", time: window.PrayerCalculator.formatFloatHours(state.rawTimes.maghrib) },
      isha: { name: "العشاء", time: window.PrayerCalculator.formatFloatHours(state.rawTimes.isha) }
    };

    const todayDateStr = now.toDateString();
    Object.keys(prayerTimesMap).forEach(key => {
      const triggerId = `${key}_${todayDateStr}_${prayerTimesMap[key].time}`;
      if (prayerTimesMap[key].time === currentHM && state.lastTriggeredPrayer !== triggerId) {
        triggerAdhanAlert(prayerTimesMap[key].name, key);
      }
    });
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

      // علامات 30° بالأحمر
      if (isMajor30) {
        line.setAttribute("stroke", "#ef4444");
        line.setAttribute("stroke-width", "2");
      } else if (isMajor10) {
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.75)");
        line.setAttribute("stroke-width", "1.2");
      } else {
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.35)");
        line.setAttribute("stroke-width", "0.8");
      }
      ticksGroup.appendChild(line);

      // أرقام كل 30° — 0،90،180،270 بالأحمر، الباقي أبيض
      if (isMajor30) {
        const numR = r - 26;
        const nx = cx + numR * Math.cos(rad);
        const ny = cy + numR * Math.sin(rad);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", nx.toFixed(1));
        text.setAttribute("y", (ny + 4).toFixed(1));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "11");
        text.setAttribute("font-weight", "700");
        text.setAttribute("fill", deg % 90 === 0 ? "#ef4444" : "#ffffff");
        text.setAttribute("font-family", "Outfit, -apple-system, sans-serif");
        text.textContent = deg.toString();
        labelsGroup.appendChild(text);
      }
    }

    // الحروف الكاردينالية باللون الأحمر البارز: N أعلى (0°)، E يمين (90°)، S أسفل (180°)، W يسار (270°)
    const cardinalDefs = [
      { letter: "N", deg: 0,   color: "#ef4444", size: 17, weight: 900 },
      { letter: "E", deg: 90,  color: "#ef4444", size: 16, weight: 900 },
      { letter: "S", deg: 180, color: "#ef4444", size: 16, weight: 900 },
      { letter: "W", deg: 270, color: "#ef4444", size: 16, weight: 900 }
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
      text.setAttribute("stroke", "rgba(0, 0, 0, 0.4)");
      text.setAttribute("stroke-width", "0.5");
      text.setAttribute("font-family", "Outfit, -apple-system, sans-serif");
      text.textContent = c.letter;
      labelsGroup.appendChild(text);

      // مثلث أحمر علوي عند قمة البوصلة (0° للشمال)
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

    // سهم القبلة الذهبي والأخضر يشير لمكة المكرمة بدقة
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

  // دالة الاتجاه الجغرافي الدقيقة المتزامنة
  function getDirectionLabel(deg) {
    const d = (deg + 360) % 360;
    if (d < 22.5 || d >= 337.5) return "N";
    if (d < 67.5) return "NE";
    if (d < 112.5) return "E";
    if (d < 157.5) return "SE";
    if (d < 202.5) return "S";
    if (d < 247.5) return "SW";
    if (d < 292.5) return "W";
    return "NW";
  }

  function updateCompassNeedle() {
    const compassDisc = document.getElementById("compass-dial-disc");
    const degDisplay = document.getElementById("compass-deg-display");
    const dirDisplay = document.getElementById("compass-dir-display");
    const qiblaBadge = document.getElementById("qibla-degree-text");

    let dialRotation = 0;

    if (state.compassMode === "static") {
      dialRotation = 0;
    } else {
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
        qiblaBadge.innerHTML = `🧭 اتجاه القبلة: ${state.qiblaBearing}° (${state.selectedCity?.name || ""})`;
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

    let isTouchPressed = false;
    let lastTapTimestamp = 0;

    function handleTapDown(e) {
      if (e && e.cancelable) e.preventDefault();

      // إذا كان الإصبع لا يزال ملامساً للشاشة (ضغط مطول)، لا تعد إطلاقاً
      if (isTouchPressed) return;

      const now = Date.now();
      // حماية سريعة ضد ارتداد الإشارات الكهربائية (60ms) مع دعم التسبيح السريع
      if (now - lastTapTimestamp < 60) return;

      isTouchPressed = true;
      lastTapTimestamp = now;

      // زيادة العداد بمقدار 1 فقط لا غير
      tasbeeh.increment();
      updateUI();

      if (btnTap) {
        btnTap.style.transform = "scale(0.93)";
      }
    }

    function handleTapUp(e) {
      if (e && e.cancelable) e.preventDefault();
      // فك القفل عند رفع الإصبع عن الشاشة للاستعداد للنقرة القادمة
      isTouchPressed = false;
      if (btnTap) {
        btnTap.style.transform = "";
      }
    }

    if (btnTap) {
      // الاستجابة الفورية عند أول لمس
      btnTap.addEventListener("pointerdown", handleTapDown, { passive: false });
      btnTap.addEventListener("pointerup", handleTapUp, { passive: false });
      btnTap.addEventListener("pointercancel", handleTapUp, { passive: false });
      btnTap.addEventListener("pointerleave", handleTapUp, { passive: false });

      // منع أي تكرار اصطناعي من حدث click
      btnTap.addEventListener("click", (e) => {
        if (e && e.cancelable) e.preventDefault();
      });
    }

    // إتاحة الدالة عالمياً
    window.handleTasbeehClick = handleTapDown;

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        tasbeeh.reset(true);
        prevRounds = 0;
        updateUI();
        if (resetBtn) {
          const origText = resetBtn.textContent;
          resetBtn.textContent = "✓ تم التصفير";
          setTimeout(() => { resetBtn.textContent = origText; }, 1200);
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
    window.handleTasbeehClick = handleTapDown;
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
        quran.setFontSize((quran.fontSize || 36) + 2);
        if (fontSlider) fontSlider.value = quran.fontSize;
      });
    }
    if (fontDecreaseBtn) {
      fontDecreaseBtn.addEventListener("click", () => {
        quran.setFontSize((quran.fontSize || 36) - 2);
        if (fontSlider) fontSlider.value = quran.fontSize;
      });
    }
    if (fontSlider) {
      fontSlider.value = quran.fontSize || 36;
      fontSlider.addEventListener("input", (e) => {
        quran.setFontSize(parseInt(e.target.value, 10));
      });
    }
    document.querySelectorAll(".font-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const size = parseInt(btn.getAttribute("data-size"), 10);
        quran.setFontSize(size);
        if (fontSlider) fontSlider.value = size;
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

    // ==================== 1. شريط التبويبات الفرعية لقسم القرآن ====================
    const subtabBtns = document.querySelectorAll(".quran-subtab-btn");
    const subpanes = document.querySelectorAll(".quran-subpane");

    subtabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-subtab");
        subtabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        subpanes.forEach(p => p.style.display = "none");
        const activePane = document.getElementById(`quran-pane-${target}`);
        if (activePane) activePane.style.display = "block";

        if (target === "khatmah") renderKhatmahUI();
        if (target === "hifz") renderHifzUI();
        if (target === "recite") initRecitationUI();
        if (target === "quiz") initQuizUI();
        if (target === "library") renderLibraryUI();
      });
    });

    // ==================== نمط البحث (السور أو بحث شامل في آيات القرآن) ====================
    let currentSearchMode = "surahs"; // "surahs" | "global"
    const searchModeSurahsBtn = document.getElementById("btn-search-mode-surahs");
    const searchModeGlobalBtn = document.getElementById("btn-search-mode-global");
    const globalSearchResultsBox = document.getElementById("global-quran-search-results");
    let globalSearchDebounceTimer = null;

    if (searchModeSurahsBtn && searchModeGlobalBtn) {
      searchModeSurahsBtn.addEventListener("click", () => {
        currentSearchMode = "surahs";
        searchModeSurahsBtn.classList.add("active");
        searchModeGlobalBtn.classList.remove("active");
        if (searchInput) searchInput.placeholder = "ابحث عن اسم السورة أو رقمها...";
        if (globalSearchResultsBox) globalSearchResultsBox.style.display = "none";
        if (surahListContainer) surahListContainer.style.display = "grid";
        renderSurahList(searchInput ? searchInput.value : "");
      });

      searchModeGlobalBtn.addEventListener("click", () => {
        currentSearchMode = "global";
        searchModeGlobalBtn.classList.add("active");
        searchModeSurahsBtn.classList.remove("active");
        if (searchInput) searchInput.placeholder = "ابحث عن أي كلمة أو آية في كامل القرآن الكريم...";
        if (surahListContainer) surahListContainer.style.display = "none";
        if (globalSearchResultsBox) globalSearchResultsBox.style.display = "flex";
        performGlobalSearch(searchInput ? searchInput.value : "");
      });
    }

    // زر مسح نص البحث السريع
    const clearSearchBtn = document.getElementById("btn-clear-quran-search");
    if (searchInput && clearSearchBtn) {
      searchInput.addEventListener("input", (e) => {
        const val = e.target.value;
        clearSearchBtn.style.display = val.trim().length > 0 ? "block" : "none";
        if (currentSearchMode === "surahs") {
          renderSurahList(val);
        } else {
          clearTimeout(globalSearchDebounceTimer);
          globalSearchDebounceTimer = setTimeout(() => {
            performGlobalSearch(val);
          }, 250);
        }
      });

      clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearSearchBtn.style.display = "none";
        if (currentSearchMode === "surahs") {
          renderSurahList("");
        } else {
          performGlobalSearch("");
        }
      });
    }

    async function performGlobalSearch(query) {
      if (!globalSearchResultsBox) return;
      query = (query || "").trim();

      if (query.length < 2) {
        globalSearchResultsBox.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 24px 12px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <span style="font-size: 1.8rem; display: block; margin-bottom: 6px;">🔍</span>
            اكتب أي كلمة أو عبارة قرآنية (مثل: <strong>الصابرين</strong>، <strong>ألا بذكر الله</strong>، <strong>الجنة</strong>) للبحث الفوري في كامل آيات القرآن الـ 6236!
          </div>
        `;
        return;
      }

      globalSearchResultsBox.innerHTML = `
        <div style="text-align: center; color: var(--gold-light); font-size: 0.9rem; padding: 20px;">
          ⏳ جاري البحث في كامل آيات وسور القرآن الكريم...
        </div>
      `;

      const results = await window.QuranSearchEngine.searchGlobal(query);
      if (!results || results.matches.length === 0) {
        globalSearchResultsBox.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 24px 12px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <span style="font-size: 1.8rem; display: block; margin-bottom: 6px;">⚠️</span>
            لم يتم العثور على أي نتائج لكلمة "<strong>${query}</strong>". يرجى التحقق من كتابة الكلمة.
          </div>
        `;
        return;
      }

      globalSearchResultsBox.innerHTML = `
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--gold-light); margin-bottom: 4px;">
          ✨ تم العثور على <strong>${results.count}</strong> موضعاً في القرآن الكريم:
        </div>
      `;

      results.matches.slice(0, 50).forEach(m => {
        const card = document.createElement("div");
        card.className = "search-result-card";
        card.innerHTML = `
          <div class="search-result-header">
            <span class="search-result-surah">سورة ${m.surahName} • الآية ${m.ayahNumber}</span>
            <span class="badge" style="font-size: 0.72rem; padding: 2px 8px;">انقر للقراءة ↗</span>
          </div>
          <div class="search-result-text">
            ${m.highlightedText}
          </div>
        `;

        card.addEventListener("click", () => {
          openSurahReader(m.surahNumber, m.ayahNumber);
        });

        globalSearchResultsBox.appendChild(card);
      });
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
      if (titleEl) titleEl.textContent = surahMeta ? `سورة ${surahMeta.name}` : `سورة ${surahNumber}`;
      if (contentEl) {
        contentEl.innerHTML = `<div style="text-align:center; padding: 40px 0; color: var(--text-gold);">جاري تحميل السورة الكريمة...</div>`;
      }

      const surahData = await quran.fetchSurah(surahNumber);
      if (!contentEl) return;

      contentEl.style.fontSize = `${quran.fontSize}px`;
      contentEl.innerHTML = "";

      // 1. ترويسة السورة العثمانية المزخرفة المذهبة المطابقة للمصاحف الشريفة
      if (surahMeta) {
        const isMeccan = surahMeta.revelationType === "Meccan";
        const typeText = isMeccan ? "مَكِّيَّةٌ" : "مَدَنِيَّةٌ";
        const banner = document.createElement("div");
        banner.className = "mushaf-surah-header-frame";
        banner.innerHTML = `
          <div class="surah-frame-arabesque left-wing">⚜️</div>
          <div class="surah-frame-center-box">
            <div class="surah-title-calligraphy">سُورَةُ ${surahMeta.name}</div>
            <div class="surah-subtitle-meta">آياتها ${quran.toArabicDigits(surahMeta.numberOfAyahs)} • ${typeText} • ترتيبها ${quran.toArabicDigits(surahMeta.number)}</div>
          </div>
          <div class="surah-frame-arabesque right-wing">⚜️</div>
        `;
        contentEl.appendChild(banner);
      }

      // 2. البسملة المباركة بإطار مذهب
      if (surahNumber !== 9 && surahNumber !== 1) {
        const basmalah = document.createElement("div");
        basmalah.className = "basmalah-container golden-basmalah-frame";
        basmalah.innerHTML = `<span class="basmalah-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>`;
        contentEl.appendChild(basmalah);
      }

      // حاوية صفحة المصحف المزخرفة
      const pageFrame = document.createElement("div");
      pageFrame.className = "mushaf-page-frame";

      // 3. عرض آيات السورة الكريمة مع شارات الحفّاظ ورموز الآيات المزخرفة
      surahData.ayahs.forEach(a => {
        const ayahSpan = document.createElement("span");
        ayahSpan.className = "ayah-text";
        ayahSpan.id = `ayah-${a.numberInSurah}`;

        // فحص وجود شارة تنبيه للحافظ على هذه الآية
        const badge = window.HifzEngine ? window.HifzEngine.getBadge(surahNumber, a.numberInSurah, 0) : null;
        if (badge) {
          const badgeIcon = badge.level === 1 ? "⚠️" : badge.level === 2 ? "⚡" : "🔴";
          const badgeEl = document.createElement("span");
          badgeEl.className = `hafiz-badge-marker lvl-${badge.level}`;
          badgeEl.textContent = badgeIcon;
          badgeEl.title = badge.note || "علامة تنبيه الحافظ";
          badgeEl.addEventListener("click", (e) => {
            e.stopPropagation();
            openHafizBadgeModal(surahNumber, a.numberInSurah, 0, a.text);
          });
          ayahSpan.appendChild(badgeEl);
        }

        const rawAyahText = quran.cleanAyahText(a.text, surahNumber, a.numberInSurah);
        const formattedText = quran.formatGoldenQuranText(rawAyahText);
        const textNode = document.createElement("span");
        textNode.innerHTML = ` ${formattedText} `;
        ayahSpan.appendChild(textNode);

        const numSymbol = document.createElement("span");
        numSymbol.className = "golden-ayah-flower";
        numSymbol.innerHTML = quran.getAyahMedallionSvg(a.numberInSurah);
        numSymbol.title = `الآية ${a.numberInSurah}`;

        ayahSpan.appendChild(numSymbol);

        // النقر على الآية للتلاوة
        ayahSpan.addEventListener("click", () => {
          quran.playAyah(surahNumber, a.numberInSurah);
        });

        // النقر المطول لوضع علامة تنبيه الحافظ
        ayahSpan.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          openHafizBadgeModal(surahNumber, a.numberInSurah, 0, a.text);
        });

        pageFrame.appendChild(ayahSpan);
      });

      contentEl.appendChild(pageFrame);

      quran.setLastRead(surahNumber, surahData.name, targetAyah);

      setTimeout(() => {
        const targetEl = document.getElementById(`ayah-${targetAyah}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);
    }

    window.openSurahReader = openSurahReader;

    // ==================== 2. نافذة علامة تنبيه الحافظ ====================
    let activeBadgeContext = { surahNumber: 1, ayahNumber: 1, wordIndex: 0, level: 1 };
    const badgeModal = document.getElementById("hafiz-badge-modal");
    const closeBadgeModalBtn = document.getElementById("btn-close-hafiz-badge-modal");
    const saveBadgeBtn = document.getElementById("btn-save-hafiz-badge");
    const deleteBadgeBtn = document.getElementById("btn-delete-hafiz-badge");
    const badgeNoteInput = document.getElementById("hafiz-badge-note-input");

    function openHafizBadgeModal(surahNumber, ayahNumber, wordIndex = 0, ayahText = "") {
      activeBadgeContext = { surahNumber, ayahNumber, wordIndex, level: 1 };
      const existing = window.HifzEngine.getBadge(surahNumber, ayahNumber, wordIndex);
      if (existing) {
        activeBadgeContext.level = existing.level;
        if (badgeNoteInput) badgeNoteInput.value = existing.note || "";
      } else {
        if (badgeNoteInput) badgeNoteInput.value = "";
      }

      // تحديد الزر النشط للمستوى
      document.querySelectorAll(".level-select-btn").forEach(btn => {
        btn.classList.toggle("selected", parseInt(btn.getAttribute("data-level"), 10) === activeBadgeContext.level);
      });

      if (badgeModal) badgeModal.classList.add("active");
    }

    document.querySelectorAll(".level-select-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const lvl = parseInt(btn.getAttribute("data-level"), 10);
        activeBadgeContext.level = lvl;
        document.querySelectorAll(".level-select-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    if (closeBadgeModalBtn) {
      closeBadgeModalBtn.addEventListener("click", () => {
        if (badgeModal) badgeModal.classList.remove("active");
      });
    }

    if (saveBadgeBtn) {
      saveBadgeBtn.addEventListener("click", () => {
        const note = badgeNoteInput ? badgeNoteInput.value : "";
        window.HifzEngine.setHafizBadge(
          activeBadgeContext.surahNumber,
          activeBadgeContext.ayahNumber,
          activeBadgeContext.wordIndex,
          activeBadgeContext.level,
          note
        );
        if (badgeModal) badgeModal.classList.remove("active");
        if (readerModal && readerModal.classList.contains("active")) {
          openSurahReader(activeBadgeContext.surahNumber, activeBadgeContext.ayahNumber);
        }
        renderHifzUI();
      });
    }

    if (deleteBadgeBtn) {
      deleteBadgeBtn.addEventListener("click", () => {
        window.HifzEngine.removeHafizBadge(
          activeBadgeContext.surahNumber,
          activeBadgeContext.ayahNumber,
          activeBadgeContext.wordIndex
        );
        if (badgeModal) badgeModal.classList.remove("active");
        if (readerModal && readerModal.classList.contains("active")) {
          openSurahReader(activeBadgeContext.surahNumber, activeBadgeContext.ayahNumber);
        }
        renderHifzUI();
      });
    }

    // ==================== 3. نافذة التفسير الشامل والترجمات العالمية ====================
    const tafsirModal = document.getElementById("tafsir-modal");
    const closeTafsirModalBtn = document.getElementById("btn-close-tafsir-modal");
    const tafsirBtn = document.getElementById("quran-tafsir-btn");
    const tafsirEditionSelect = document.getElementById("tafsir-edition-select");
    const copyTafsirBtn = document.getElementById("btn-copy-tafsir");
    const prevTafsirAyahBtn = document.getElementById("btn-tafsir-prev-ayah");
    const nextTafsirAyahBtn = document.getElementById("btn-tafsir-next-ayah");

    let tafsirCurrentSurah = 1;
    let tafsirCurrentAyah = 1;

    function populateTafsirEditions() {
      if (!tafsirEditionSelect || !window.QuranTafsirEngine) return;
      tafsirEditionSelect.innerHTML = "";

      const editions = window.QuranTafsirEngine.getEditionsList();
      const groupTafasir = document.createElement("optgroup");
      groupTafasir.label = "📚 كتب التفسير المعتمدة";

      const groupTrans = document.createElement("optgroup");
      groupTrans.label = "🌐 ترجمات معاني القرآن الكريم العالمية";

      editions.forEach(ed => {
        const opt = document.createElement("option");
        opt.value = ed.id;
        opt.textContent = `${ed.name} (${ed.author})`;
        if (ed.id === window.QuranTafsirEngine.activeEditionId) opt.selected = true;

        if (ed.type === "tafsir") {
          groupTafasir.appendChild(opt);
        } else {
          groupTrans.appendChild(opt);
        }
      });

      tafsirEditionSelect.appendChild(groupTafasir);
      tafsirEditionSelect.appendChild(groupTrans);

      tafsirEditionSelect.onchange = (e) => {
        window.QuranTafsirEngine.activeEditionId = e.target.value;
        loadTafsirContent(tafsirCurrentSurah, tafsirCurrentAyah);
      };
    }

    async function openTafsirModal(surahNumber, ayahNumber) {
      tafsirCurrentSurah = parseInt(surahNumber, 10) || 1;
      tafsirCurrentAyah = parseInt(ayahNumber, 10) || 1;

      populateTafsirEditions();
      if (tafsirModal) tafsirModal.classList.add("active");
      await loadTafsirContent(tafsirCurrentSurah, tafsirCurrentAyah);
    }

    async function loadTafsirContent(surahNumber, ayahNumber) {
      const titleEl = document.getElementById("tafsir-modal-title");
      const contextEl = document.getElementById("tafsir-verse-context");
      const contentEl = document.getElementById("tafsir-text-content");

      const surahMeta = SURAH_LIST.find(s => s.number === surahNumber);
      const sName = surahMeta ? surahMeta.name : surahNumber;
      const totalAyahs = surahMeta ? surahMeta.numberOfAyahs : 7;

      if (titleEl) titleEl.textContent = `📚 سورة ${sName} • الآية ${ayahNumber} من ${totalAyahs}`;

      if (contextEl) {
        contextEl.innerHTML = "⏳ جاري تحميل نص الآية...";
        if (quran.cachedSurahs[surahNumber]) {
          const aObj = quran.cachedSurahs[surahNumber].ayahs.find(a => a.numberInSurah === ayahNumber);
          if (aObj) {
            contextEl.innerHTML = `﴿ ${quran.formatGoldenQuranText(aObj.text)} ﴾`;
          }
        } else {
          contextEl.innerHTML = `﴿ سورة ${sName} • الآية ${ayahNumber} ﴾`;
        }
      }

      if (contentEl) {
        contentEl.innerHTML = `
          <div style="text-align: center; color: var(--gold-light); padding: 20px;">
            ⏳ جاري تحميل التفسير / الترجمة...
          </div>
        `;
      }

      const activeEdition = window.QuranTafsirEngine.activeEditionId;
      const tafsirText = await window.QuranTafsirEngine.fetchAyahText(surahNumber, ayahNumber, activeEdition);

      if (contentEl) {
        contentEl.innerHTML = tafsirText.replace(/\n/g, "<br>");
      }
    }

    if (prevTafsirAyahBtn) {
      prevTafsirAyahBtn.onclick = () => {
        if (tafsirCurrentAyah > 1) {
          tafsirCurrentAyah -= 1;
          loadTafsirContent(tafsirCurrentSurah, tafsirCurrentAyah);
        } else if (tafsirCurrentSurah > 1) {
          tafsirCurrentSurah -= 1;
          const prevMeta = SURAH_LIST.find(s => s.number === tafsirCurrentSurah);
          tafsirCurrentAyah = prevMeta ? prevMeta.numberOfAyahs : 1;
          loadTafsirContent(tafsirCurrentSurah, tafsirCurrentAyah);
        }
      };
    }

    if (nextTafsirAyahBtn) {
      nextTafsirAyahBtn.onclick = () => {
        const surahMeta = SURAH_LIST.find(s => s.number === tafsirCurrentSurah);
        const totalAyahs = surahMeta ? surahMeta.numberOfAyahs : 7;
        if (tafsirCurrentAyah < totalAyahs) {
          tafsirCurrentAyah += 1;
          loadTafsirContent(tafsirCurrentSurah, tafsirCurrentAyah);
        } else if (tafsirCurrentSurah < 114) {
          tafsirCurrentSurah += 1;
          tafsirCurrentAyah = 1;
          loadTafsirContent(tafsirCurrentSurah, tafsirCurrentAyah);
        }
      };
    }

    if (copyTafsirBtn) {
      copyTafsirBtn.onclick = () => {
        const contentEl = document.getElementById("tafsir-text-content");
        if (contentEl && contentEl.textContent.trim()) {
          navigator.clipboard.writeText(contentEl.textContent.trim());
          copyTafsirBtn.textContent = "✅ تم النسخ!";
          setTimeout(() => {
            copyTafsirBtn.textContent = "📋 نسخ";
          }, 2000);
        }
      };
    }

    if (tafsirBtn) {
      tafsirBtn.onclick = () => {
        openTafsirModal(quran.currentSurah, quran.currentAyah);
      };
    }

    const quranDuaaBtn = document.getElementById("quran-duaa-btn");
    if (quranDuaaBtn) {
      quranDuaaBtn.onclick = () => {
        const readerModal = document.getElementById("mushaf-reader-modal");
        if (readerModal) readerModal.classList.remove("active");
        switchTab("quran");
        const khatmahTabBtn = document.getElementById("btn-subtab-khatmah");
        if (khatmahTabBtn) khatmahTabBtn.click();
      };
    }

    if (closeTafsirModalBtn) {
      closeTafsirModalBtn.onclick = () => {
        if (tafsirModal) tafsirModal.classList.remove("active");
      };
    }

    // ==================== 4. لوحة خطط الحفظ ومراجعة شارات الحفّاظ ====================
    function renderHifzUI() {
      const hifz = window.HifzEngine;
      if (!hifz) return;

      const activePlan = hifz.getActivePlan();
      const progress = hifz.calculatePlanProgress(activePlan);

      const planNameEl = document.getElementById("hifz-active-plan-name");
      const streakEl = document.getElementById("hifz-streak-display");
      const barFill = document.getElementById("hifz-progress-bar-fill");
      const ayahsStats = document.getElementById("hifz-stats-ayahs");
      const percentStats = document.getElementById("hifz-stats-percent");

      if (planNameEl) planNameEl.textContent = `${activePlan.icon} ${activePlan.name}`;
      if (streakEl) streakEl.textContent = `🔥 الالتزام: ${hifz.streakCount} يوم`;
      if (barFill) barFill.style.width = `${progress.percentage}%`;
      if (ayahsStats) ayahsStats.textContent = `تم حفظ: ${progress.memorizedCount} من ${progress.totalAyahs} آية`;
      if (percentStats) percentStats.textContent = `نسبة الإنجاز: ${progress.percentage}%`;

      // عرض شبكة الخطط
      const plansContainer = document.getElementById("hifz-plans-container");
      if (plansContainer) {
        plansContainer.innerHTML = "";
        hifz.plans.forEach(p => {
          const pProg = hifz.calculatePlanProgress(p);
          const card = document.createElement("div");
          card.className = `plan-card ${p.id === hifz.activePlanId ? 'active' : ''}`;
          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: var(--text-main); font-size: 0.92rem;">${p.icon} ${p.name}</strong>
              <span style="font-size: 0.76rem; font-weight: 800; color: var(--gold-light);">${pProg.percentage}%</span>
            </div>
            <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">${p.desc}</div>
          `;
          card.addEventListener("click", () => {
            hifz.setActivePlan(p.id);
            renderHifzUI();
          });
          plansContainer.appendChild(card);
        });
      }

      // عرض تفاصيل وسور الخطة النشطة
      const planDetailTitle = document.getElementById("hifz-selected-plan-title");
      const planSurahsList = document.getElementById("hifz-plan-surahs-list");
      const openPlanReaderBtn = document.getElementById("btn-open-active-plan-reader");

      if (planDetailTitle) {
        planDetailTitle.textContent = `📜 سور ${activePlan.name} (${progress.memorizedCount}/${progress.totalAyahs} آية)`;
      }

      if (openPlanReaderBtn) {
        openPlanReaderBtn.onclick = () => {
          const surahs = hifz.getPlanSurahs(activePlan);
          const firstIncomplete = surahs.find(s => !s.isComplete) || surahs[0];
          if (firstIncomplete) {
            openSurahReader(firstIncomplete.number, 1);
          }
        };
      }

      if (planSurahsList) {
        planSurahsList.innerHTML = "";
        const surahs = hifz.getPlanSurahs(activePlan);
        surahs.forEach(s => {
          const sRow = document.createElement("div");
          sRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);";

          const leftWrap = document.createElement("div");
          leftWrap.style.cssText = "display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1;";
          leftWrap.innerHTML = `
            <div class="surah-number-badge" style="width: 28px; height: 28px; font-size: 0.8rem;">${s.number}</div>
            <div>
              <strong style="color: var(--text-main); font-size: 0.9rem;">سورة ${s.name}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${s.numberOfAyahs} آية • تم حفظ: ${s.memorizedCount} (${s.percentage}%)</div>
            </div>
          `;
          leftWrap.addEventListener("click", () => {
            openSurahReader(s.number, 1);
          });

          const rightWrap = document.createElement("div");
          rightWrap.style.cssText = "display: flex; align-items: center; gap: 6px;";

          const toggleBtn = document.createElement("button");
          toggleBtn.className = s.isComplete ? "badge" : "custom-select";
          toggleBtn.style.cssText = `padding: 4px 10px; font-size: 0.74rem; font-weight: 800; cursor: pointer; border-radius: 20px; ${s.isComplete ? 'background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981;' : 'background: rgba(255, 255, 255, 0.06); color: var(--text-muted); border: 1px solid var(--border-color);'}`;
          toggleBtn.textContent = s.isComplete ? "✅ تم الحفظ" : "🔘 تحديد كـ تم الحفظ";

          toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            hifz.toggleSurahMemorized(s.number);
            renderHifzUI();
          });

          rightWrap.appendChild(toggleBtn);
          sRow.appendChild(leftWrap);
          sRow.appendChild(rightWrap);
          planSurahsList.appendChild(sRow);
        });
      }

      // عرض مواضع تنبيه الحفاظ المسجلة
      const badgesContainer = document.getElementById("hafiz-badges-list-container");
      const badgesCount = document.getElementById("hafiz-badges-total-count");
      const allBadges = hifz.getAllBadgesList();

      if (badgesCount) badgesCount.textContent = `${allBadges.length} مواضع`;
      if (badgesContainer) {
        badgesContainer.innerHTML = "";
        if (allBadges.length === 0) {
          badgesContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 14px 0;">
              لم يتم تسجيل أي مواضع تنبيه بعد. يمكنك وضع علامة على أي آية من شاشة قراءة القرآن!
            </div>
          `;
        } else {
          allBadges.forEach(b => {
            const surahMeta = SURAH_LIST.find(s => s.number === b.surahNumber);
            const sName = surahMeta ? surahMeta.name : b.surahNumber;
            const lvlIcon = b.level === 1 ? "🟡 تردد" : b.level === 2 ? "🟠 خطأ متكرر" : "🔴 نسيان تام";

            const row = document.createElement("div");
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer;";
            row.innerHTML = `
              <div>
                <strong style="color: var(--gold-light); font-size: 0.85rem;">سورة ${sName} • آية ${b.ayahNumber}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${b.note || 'بدون ملاحظة'} • ${b.date}</div>
              </div>
              <span style="font-size: 0.75rem; font-weight: 800;">${lvlIcon}</span>
            `;
            row.addEventListener("click", () => {
              openSurahReader(b.surahNumber, b.ayahNumber);
            });
            badgesContainer.appendChild(row);
          });
        }
      }
    }

    // ==================== 4.5. مدير ختمة القرآن الكريم وتتبع الأوراد ====================
    function renderKhatmahUI() {
      const km = window.KhatmahManager;
      if (!km) return;

      const prog = km.getProgress();
      const wird = km.getDailyWird(km.currentDay);

      // 1. تحديث عناصر بطاقة الختمة الرئيسية
      const titleEl = document.getElementById("khatmah-active-title");
      const datesEl = document.getElementById("khatmah-active-dates");
      const totalBadge = document.getElementById("khatmah-completed-total-badge");
      const barFill = document.getElementById("khatmah-progress-bar-fill");
      const statsDays = document.getElementById("khatmah-stats-days");
      const statsPercent = document.getElementById("khatmah-stats-percent");

      if (titleEl) titleEl.textContent = `✨ ختمة القرآن الكريم (${km.targetDays} يوماً)`;
      if (datesEl) datesEl.textContent = `بدأت في: ${km.startDate} • المتبقي: ${prog.remainingDays} يوم`;
      if (totalBadge) totalBadge.textContent = `🏆 ختمات سابقة: ${km.totalKhatmahsCompleted}`;
      if (barFill) barFill.style.width = `${prog.percentage}%`;
      if (statsDays) statsDays.textContent = `أتممت: ${prog.completedDaysCount} من ${km.targetDays} يوماً`;
      if (statsPercent) statsPercent.textContent = `نسبة الإنجاز: ${prog.percentage}%`;

      // 2. تحديث بطاقة ورد اليوم
      const wirdDayTag = document.getElementById("khatmah-wird-day-tag");
      const wirdStatusBadge = document.getElementById("khatmah-wird-status-badge");
      const wirdTitle = document.getElementById("khatmah-wird-title");
      const wirdDesc = document.getElementById("khatmah-wird-desc");
      const isTodayDone = km.isDayCompleted(km.currentDay);

      if (wirdDayTag) wirdDayTag.textContent = `📅 ورد اليوم ${km.currentDay} من ${km.targetDays}:`;
      if (wirdStatusBadge) {
        wirdStatusBadge.textContent = isTodayDone ? "✅ تم الإنجاز" : "⏳ قيد القراءة";
        wirdStatusBadge.style.background = isTodayDone ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)";
        wirdStatusBadge.style.color = isTodayDone ? "#10b981" : "#fbbf24";
      }
      if (wirdTitle) wirdTitle.textContent = wird.juzRangeName;
      if (wirdDesc) wirdDesc.textContent = wird.desc;

      const readTodayBtn = document.getElementById("btn-read-today-wird");
      if (readTodayBtn) {
        readTodayBtn.onclick = () => {
          openSurahReader(wird.startSurah, wird.startAyah);
        };
      }

      const toggleDoneBtn = document.getElementById("btn-toggle-today-wird-done");
      if (toggleDoneBtn) {
        toggleDoneBtn.onclick = () => {
          km.toggleDayCompleted(km.currentDay);
          renderKhatmahUI();
        };
      }

      // 3. أزرار المدد المحددة مسبقاً (Presets)
      document.querySelectorAll(".khatmah-preset-btn").forEach(btn => {
        const days = parseInt(btn.getAttribute("data-days"), 10);
        btn.classList.toggle("active", days === km.targetDays);
        btn.onclick = () => {
          km.startNewKhatmah(days);
          renderKhatmahUI();
        };
      });

      // 4. جدول الأوراد لجميع الأيام
      const scheduleList = document.getElementById("khatmah-days-schedule-list");
      if (scheduleList) {
        scheduleList.innerHTML = "";
        for (let d = 1; d <= km.targetDays; d++) {
          const dWird = km.getDailyWird(d);
          const isDone = km.isDayCompleted(d);

          const row = document.createElement("div");
          row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid ${isDone ? '#10b981' : 'var(--border-color)'};`;

          const leftWrap = document.createElement("div");
          leftWrap.style.cssText = "display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1;";
          leftWrap.innerHTML = `
            <div class="surah-number-badge" style="width: 28px; height: 28px; font-size: 0.78rem; ${isDone ? 'background: rgba(16, 185, 129, 0.2); color: #10b981; border-color: #10b981;' : ''}">${d}</div>
            <div>
              <strong style="color: var(--text-main); font-size: 0.88rem;">${dWird.juzRangeName}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${dWird.desc}</div>
            </div>
          `;
          leftWrap.addEventListener("click", () => {
            openSurahReader(dWird.startSurah, dWird.startAyah);
          });

          const rightWrap = document.createElement("div");
          rightWrap.style.cssText = "display: flex; align-items: center; gap: 6px;";

          const chkBtn = document.createElement("button");
          chkBtn.className = isDone ? "badge" : "custom-select";
          chkBtn.style.cssText = `padding: 4px 10px; font-size: 0.74rem; font-weight: 800; cursor: pointer; border-radius: 20px; ${isDone ? 'background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981;' : 'background: rgba(255, 255, 255, 0.06); color: var(--text-muted); border: 1px solid var(--border-color);'}`;
          chkBtn.textContent = isDone ? "✅ أتممت" : "🔘 إتمام";

          chkBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            km.toggleDayCompleted(d);
            renderKhatmahUI();
          });

          rightWrap.appendChild(chkBtn);
          row.appendChild(leftWrap);
          row.appendChild(rightWrap);
          scheduleList.appendChild(row);
        }
      }

      // 5. دعاء ختم القرآن
      const duaaContent = document.getElementById("khatmah-duaa-content");
      if (duaaContent && !duaaContent.textContent.trim()) {
        duaaContent.textContent = km.getDuaaText();
      }

      const copyDuaaBtn = document.getElementById("btn-copy-duaa-khatm");
      if (copyDuaaBtn) {
        copyDuaaBtn.onclick = () => {
          navigator.clipboard.writeText(km.getDuaaText());
          copyDuaaBtn.textContent = "✅ تم النسخ!";
          setTimeout(() => {
            copyDuaaBtn.textContent = "📋 نسخ الدعاء";
          }, 2000);
        };
      }

      const resetBtn = document.getElementById("btn-reset-khatmah");
      if (resetBtn) {
        resetBtn.onclick = () => {
          if (confirm("هل تود حقاً إعادة ضبط وتصفير الختمة الحالية للبدء من جديد؟")) {
            km.resetKhatmah();
            renderKhatmahUI();
          }
        };
      }
    }

    // ==================== 5. محرك التسميع الذكي المتطور (Smart Recitation) ====================
    let recognitionInstance = null;
    let isRecitationRecording = false;

    function initRecitationUI() {
      const hifz = window.HifzEngine;
      const select = document.getElementById("recite-surah-select");
      const search = document.getElementById("recite-surah-search");
      const clearSearch = document.getElementById("btn-clear-recite-search");
      const micBtn = document.getElementById("btn-toggle-recitation-mic");
      const statusLabel = document.getElementById("recitation-status-label");
      const stage = document.getElementById("recitation-words-stage");

      // بطاقات مستوى الدقة
      document.querySelectorAll(".strictness-card").forEach(card => {
        card.addEventListener("click", () => {
          document.querySelectorAll(".strictness-card").forEach(c => c.classList.remove("active"));
          card.classList.add("active");
          hifz.recitationStrictness = card.getAttribute("data-strictness");
          hifz.saveData();
        });
      });

      if (select) {
        select.innerHTML = "";
        SURAH_LIST.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.number;
          opt.textContent = `${s.number}. ${s.name}`;
          select.appendChild(opt);
        });

        select.addEventListener("change", (e) => {
          loadRecitationSurah(parseInt(e.target.value, 10));
        });
      }

      if (search && clearSearch) {
        search.addEventListener("input", (e) => {
          const q = e.target.value.trim().toLowerCase();
          clearSearch.style.display = q.length > 0 ? "block" : "none";
          const match = SURAH_LIST.find(s => s.name.includes(q) || s.number.toString() === q);
          if (match && select) {
            select.value = match.number.toString();
            loadRecitationSurah(match.number);
          }
        });
        clearSearch.addEventListener("click", () => {
          search.value = "";
          clearSearch.style.display = "none";
        });
      }

      async function loadRecitationSurah(surahNum) {
        const surahData = await quran.fetchSurah(surahNum);
        if (!stage || !surahData || !surahData.ayahs) return;

        stage.innerHTML = "";
        surahData.ayahs.forEach(a => {
          const ayahWrap = document.createElement("div");
          ayahWrap.className = "recite-ayah-wrap";
          ayahWrap.id = `recite-ayah-${a.numberInSurah}`;
          ayahWrap.style.marginBottom = "10px";

          const words = a.text.split(" ");
          words.forEach((w, wIdx) => {
            const wSpan = document.createElement("span");
            wSpan.className = "word-recite-pending";
            wSpan.id = `recite-w-${a.numberInSurah}-${wIdx}`;
            wSpan.textContent = `${w} `;
            ayahWrap.appendChild(wSpan);
          });

          const arabicNum = quran.toArabicDigits ? quran.toArabicDigits(a.numberInSurah) : a.numberInSurah;
          const numSym = document.createElement("span");
          numSym.className = "golden-ayah-flower";
          numSym.innerHTML = `<span class="rosette-digit">${arabicNum}</span>`;
          ayahWrap.appendChild(numSym);

          stage.appendChild(ayahWrap);
        });
      }

      loadRecitationSurah(1); // تحميل سورة الفاتحة افتراضياً

      // التعامل مع الميكروفون والتعرف الصوتي
      if (micBtn) {
        micBtn.onclick = () => {
          if (isRecitationRecording) {
            stopSpeechRecognition();
          } else {
            startSpeechRecognition();
          }
        };
      }

      function startSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
          alert("التعرف الصوتي غير مدعوم في هذا المتصفح. يرجى استخدام متصفح كروم أو سفاري.");
          return;
        }

        try {
          recognitionInstance = new SpeechRec();
          recognitionInstance.lang = "ar-SA";
          recognitionInstance.continuous = true;
          recognitionInstance.interimResults = true;

          recognitionInstance.onstart = () => {
            isRecitationRecording = true;
            if (micBtn) micBtn.classList.add("recording");
            if (statusLabel) statusLabel.textContent = "جاري الاستماع للتلاوة والتسميع... 🎙️";
          };

          recognitionInstance.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
            }
            processRecitationUtterance(transcript);
          };

          recognitionInstance.onerror = (e) => {
            console.warn("Speech error:", e);
            stopSpeechRecognition();
          };

          recognitionInstance.onend = () => {
            if (isRecitationRecording) {
              try { recognitionInstance.start(); } catch (err) {}
            }
          };

          recognitionInstance.start();
        } catch (e) {
          console.warn("Failed to start speech recognition:", e);
        }
      }

      function stopSpeechRecognition() {
        isRecitationRecording = false;
        if (recognitionInstance) {
          try { recognitionInstance.stop(); } catch (e) {}
        }
        if (micBtn) micBtn.classList.remove("recording");
        if (statusLabel) statusLabel.textContent = "تم إيقاف التسميع • اضغط لبدء التسميع";
      }

      function processRecitationUtterance(utteredText) {
        if (!stage) return;
        const pendingWords = stage.querySelectorAll(".word-recite-pending, .word-recite-error");
        if (!pendingWords || pendingWords.length === 0) return;

        const currentWordEl = pendingWords[0];
        const expectedWord = currentWordEl.textContent.trim();

        const res = hifz.compareRecitation(expectedWord, utteredText, hifz.recitationStrictness);
        if (res.isAyahPassed) {
          currentWordEl.className = "word-recite-corrected";
        } else {
          currentWordEl.className = "word-recite-error";
        }
      }
    }

    // ==================== 6. ساحة اختبار المحفوظ وتقييم الدرجات ====================
    function initQuizUI() {
      const hifz = window.HifzEngine;
      const startBtn = document.getElementById("btn-start-quiz");
      const restartBtn = document.getElementById("btn-restart-quiz");
      const setupSec = document.getElementById("quiz-setup-section");
      const arenaSec = document.getElementById("quiz-active-arena");
      const resultSec = document.getElementById("quiz-result-section");

      if (startBtn) {
        startBtn.onclick = () => {
          const scope = document.getElementById("quiz-surah-scope").value;
          let surahs = [1, 112, 113, 114];
          if (scope === "juz30") surahs = Array.from({length: 37}, (_, i) => i + 78);
          if (scope === "juz29") surahs = Array.from({length: 11}, (_, i) => i + 67);
          if (scope === "baqarah") surahs = [2];

          hifz.generateQuizQuestions(surahs, 5);
          if (setupSec) setupSec.style.display = "none";
          if (resultSec) resultSec.style.display = "none";
          if (arenaSec) arenaSec.style.display = "block";
          renderCurrentQuizQuestion();
        };
      }

      if (restartBtn) {
        restartBtn.onclick = () => {
          if (resultSec) resultSec.style.display = "none";
          if (setupSec) setupSec.style.display = "block";
        };
      }

      function renderCurrentQuizQuestion() {
        const q = hifz.activeQuiz.questions[hifz.activeQuiz.currentIndex];
        if (!q) return;

        const counter = document.getElementById("quiz-question-counter");
        const score = document.getElementById("quiz-current-score");
        const prompt = document.getElementById("quiz-question-prompt");
        const verse = document.getElementById("quiz-verse-text");
        const optsContainer = document.getElementById("quiz-options-container");

        if (counter) counter.textContent = `السؤال ${hifz.activeQuiz.currentIndex + 1} من ${hifz.activeQuiz.totalQuestions}`;
        if (score) score.textContent = `النقاط: ${hifz.activeQuiz.score}`;
        if (prompt) prompt.textContent = q.prompt;
        if (verse) verse.textContent = q.questionVerse;

        if (optsContainer) {
          optsContainer.innerHTML = "";
          q.options.forEach(optText => {
            const btn = document.createElement("button");
            btn.className = "quiz-option-btn";
            btn.textContent = `﴿ ${optText} ﴾`;
            btn.onclick = () => {
              const res = hifz.submitAnswer(optText);
              if (res.isCorrect) {
                btn.classList.add("correct");
              } else {
                btn.classList.add("wrong");
              }

              setTimeout(() => {
                if (res.isFinished) {
                  showQuizResult(res.evaluation);
                } else {
                  renderCurrentQuizQuestion();
                }
              }, 700);
            };
            optsContainer.appendChild(btn);
          });
        }
      }

      function showQuizResult(evalRes) {
        if (arenaSec) arenaSec.style.display = "none";
        if (resultSec) resultSec.style.display = "block";

        const percentEl = document.getElementById("quiz-final-percentage");
        const gradeEl = document.getElementById("quiz-final-grade");
        const summaryEl = document.getElementById("quiz-final-summary");
        const mistakesContainer = document.getElementById("quiz-mistakes-container");

        if (percentEl) percentEl.textContent = `${evalRes.percentage}%`;
        if (gradeEl) gradeEl.textContent = `${evalRes.grade} • ${evalRes.badge}`;
        if (summaryEl) summaryEl.textContent = `أجبت بشكل صحيح على ${evalRes.score} من ${evalRes.total} أسئلة.`;

        if (mistakesContainer) {
          mistakesContainer.innerHTML = "";
          if (evalRes.mistakes.length > 0) {
            mistakesContainer.innerHTML = `<div style="font-size: 0.88rem; font-weight: 800; color: #ef4444; margin-bottom: 6px;">مواضع بحاجة لمراجعة:</div>`;
            evalRes.mistakes.forEach(m => {
              const box = document.createElement("div");
              box.style.cssText = "padding: 8px 10px; background: var(--bg-card); border: 1px solid #ef4444; border-radius: var(--radius-sm); margin-bottom: 6px; font-size: 0.8rem;";
              box.innerHTML = `
                <div><strong>${m.surahName}:</strong> ${m.question}</div>
                <div style="color: #10b981; margin-top: 2px;">✓ الإجابة الصحيحة: ${m.correctAnswer}</div>
              `;
              mistakesContainer.appendChild(box);
            });
          }
        }
      }
    }

    // ==================== 7. دليل الاستخدام والمكتبة الإسلامية ====================
    function renderLibraryUI() {
      if (typeof ISLAMIC_LIBRARY === "undefined") return;

      const guideContainer = document.getElementById("guide-cards-container");
      const hadithContainer = document.getElementById("hadith-list-container");

      if (guideContainer) {
        guideContainer.innerHTML = "";
        ISLAMIC_LIBRARY.guideCards.forEach(c => {
          const card = document.createElement("div");
          card.className = "guide-feature-card";
          card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="guide-card-icon">${c.icon}</span>
              <span class="guide-card-title">${c.title}</span>
            </div>
            <div class="guide-card-desc">${c.summary}</div>
          `;
          guideContainer.appendChild(card);
        });
      }

      if (hadithContainer && ISLAMIC_LIBRARY.hadithCollections) {
        hadithContainer.innerHTML = "";
        const nawawi = ISLAMIC_LIBRARY.hadithCollections[0];
        if (nawawi && nawawi.items) {
          nawawi.items.forEach(h => {
            const hCard = document.createElement("div");
            hCard.style.cssText = "padding: 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.85rem; line-height: 1.6;";
            hCard.innerHTML = `
              <div style="font-weight: 800; color: var(--gold-light); margin-bottom: 4px;">الحديث ${h.num}: ${h.title}</div>
              <div style="color: var(--text-main);">${h.text}</div>
              <div style="font-size: 0.74rem; color: var(--emerald-primary); margin-top: 4px; font-weight: 700;">[ ${h.source} ]</div>
            `;
            hadithContainer.appendChild(hCard);
          });
        }
      }
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
        const origText = bookmarkBtn.innerHTML;
        bookmarkBtn.innerHTML = `✓ تم الحفظ`;
        setTimeout(() => { bookmarkBtn.innerHTML = origText; }, 1500);
      });
    }

    if (reciterSelect) {
      reciterSelect.innerHTML = "";
      if (typeof RECITERS_LIST !== "undefined") {
        RECITERS_LIST.forEach(r => {
          const opt = document.createElement("option");
          opt.value = r.id;
          opt.textContent = `${r.name}`;
          if (r.id === quran.currentReciter) opt.selected = true;
          reciterSelect.appendChild(opt);
        });
      }
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

    // ==================== مظهر المصحف الورقي العاجي الدافئ / الوضع الليلي الفاخر ====================
    const toggleThemeBtn = document.getElementById("btn-toggle-mushaf-theme");
    const savedMushafTheme = localStorage.getItem("gs_mushaf_theme") || (state.theme === "dark" ? "dark" : "paper");

    if (readerModal) {
      if (savedMushafTheme === "paper") {
        readerModal.classList.add("mushaf-paper-theme");
        if (toggleThemeBtn) {
          toggleThemeBtn.innerHTML = "🌙";
          toggleThemeBtn.title = "التبديل إلى الوضع الليلي المظلم";
        }
      } else {
        readerModal.classList.remove("mushaf-paper-theme");
        if (toggleThemeBtn) {
          toggleThemeBtn.innerHTML = "📜";
          toggleThemeBtn.title = "التبديل إلى مظهر المصحف الورقي العاجي الدافئ";
        }
      }
    }

    if (toggleThemeBtn && readerModal) {
      toggleThemeBtn.addEventListener("click", () => {
        const isPaper = readerModal.classList.toggle("mushaf-paper-theme");
        localStorage.setItem("gs_mushaf_theme", isPaper ? "paper" : "dark");
        toggleThemeBtn.innerHTML = isPaper ? "🌙" : "📜";
        toggleThemeBtn.title = isPaper ? "التبديل إلى الوضع الليلي المظلم" : "التبديل إلى مظهر المصحف الورقي العاجي الدافئ";
      });
    }

    // إتاحة دوال إعادة الرسم عالمياً لتحديث الواجهات واللغات فوراً
    window.renderSurahList = renderSurahList;
    window.renderKhatmahUI = renderKhatmahUI;
    window.renderHifzUI = renderHifzUI;
    window.renderLibraryUI = renderLibraryUI;
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
        const catTitle = i18n.t("cat_" + cat.id + "_title") || cat.title;
        const catDesc = i18n.t("cat_" + cat.id + "_desc") || cat.desc;

        const accordion = document.createElement("div");
        accordion.className = "adhkar-category-accordion";
        accordion.id = `adhkar-acc-${cat.id}`;

        accordion.innerHTML = `
          <div class="adhkar-accordion-header">
            <div class="adhkar-accordion-left">
              <div class="adhkar-cat-icon-box">${cat.icon}</div>
              <div class="adhkar-cat-text">
                <span class="adhkar-cat-title">${catTitle}</span>
                <span class="adhkar-cat-desc">${catDesc}</span>
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
            adhkar.resetCategory(cat.id);
            updateCategoryProgressUI(cat.id);
            renderCategoryCards(cat.id);
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

    const asrMethodSelect = document.getElementById("asr-method-select");
    if (asrMethodSelect) {
      asrMethodSelect.value = state.asrJuristic.toString();
      asrMethodSelect.addEventListener("change", (e) => {
        state.asrJuristic = parseInt(e.target.value, 10);
        try {
          localStorage.setItem("gs_asr_juristic", state.asrJuristic.toString());
        } catch (err) {}
        calculateAndRenderPrayers();
      });
    }

    // ==================== المفاتيح المنزلقة الذكية (Sliding Toggle Switches) ====================
    const masterToggle = document.getElementById("adhan-master-toggle");
    const adhanSubtitle = document.getElementById("adhan-status-subtitle");
    const adhanControlsContainer = document.getElementById("adhan-controls-container");
    const vibrateToggle = document.getElementById("adhan-vibrate-toggle");
    const notifyToggle = document.getElementById("adhan-notify-toggle");

    const updateMasterUI = () => {
      const isEnabled = state.adhanMasterEnabled;
      if (masterToggle) masterToggle.checked = isEnabled;
      if (adhanControlsContainer) {
        adhanControlsContainer.style.opacity = isEnabled ? "1" : "0.45";
        adhanControlsContainer.style.pointerEvents = isEnabled ? "auto" : "none";
      }
      if (adhanSubtitle) {
        adhanSubtitle.textContent = isEnabled ? "الأذان مفعل بالكامل مع دخول كل صلاة 🔔" : "تنبيهات الأذان متوقفة حالياً 🔕";
      }
    };

    if (masterToggle) {
      updateMasterUI();
      masterToggle.addEventListener("change", (e) => {
        state.adhanMasterEnabled = e.target.checked;
        try {
          localStorage.setItem("gs_adhan_master", state.adhanMasterEnabled.toString());
        } catch (err) {}
        updateMasterUI();
        if (state.adhanMasterEnabled && "Notification" in window) {
          Notification.requestPermission();
        }
      });
    }

    if (vibrateToggle) {
      vibrateToggle.checked = state.vibrationEnabled;
      vibrateToggle.addEventListener("change", (e) => {
        state.vibrationEnabled = e.target.checked;
        try {
          localStorage.setItem("gs_adhan_vibrate", state.vibrationEnabled.toString());
        } catch (err) {}
      });
    }

    if (notifyToggle) {
      notifyToggle.checked = state.notificationsEnabled;
      notifyToggle.addEventListener("change", (e) => {
        state.notificationsEnabled = e.target.checked;
        try {
          localStorage.setItem("gs_adhan_notify", state.notificationsEnabled.toString());
        } catch (err) {}
        if (state.notificationsEnabled && "Notification" in window) {
          Notification.requestPermission();
        }
      });
    }

    // المفاتيح المنزلقة المصغرة لكل صلاة
    ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach(pKey => {
      const pToggle = document.getElementById(`toggle-prayer-${pKey}`);
      if (pToggle) {
        pToggle.checked = state.prayerAlerts[pKey] !== false;
        pToggle.addEventListener("change", (e) => {
          state.prayerAlerts[pKey] = e.target.checked;
          try {
            localStorage.setItem("gs_prayer_alerts", JSON.stringify(state.prayerAlerts));
          } catch (err) {}
        });
      }
    });

    // شريط مستوى صوت الأذان
    const volumeSlider = document.getElementById("adhan-volume-slider");
    const volumeVal = document.getElementById("adhan-volume-val");
    if (volumeSlider && volumeVal) {
      const volPercent = Math.round(state.adhanVolume * 100);
      volumeSlider.value = volPercent.toString();
      volumeVal.textContent = `${volPercent}%`;

      volumeSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        state.adhanVolume = val / 100;
        volumeVal.textContent = `${val}%`;
        adhanPlayer.volume = state.adhanVolume;
        try {
          localStorage.setItem("gs_adhan_volume", state.adhanVolume.toString());
        } catch (err) {}
      });
    }

    const adhanVoiceSelect = document.getElementById("adhan-voice-select");
    if (adhanVoiceSelect && window.ADHAN_VOICES) {
      adhanVoiceSelect.innerHTML = "";
      window.ADHAN_VOICES.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = v.name;
        if (v.id === state.selectedAdhanVoice) opt.selected = true;
        adhanVoiceSelect.appendChild(opt);
      });

      adhanVoiceSelect.addEventListener("change", (e) => {
        state.selectedAdhanVoice = e.target.value;
        try {
          localStorage.setItem("gs_adhan_voice", e.target.value);
        } catch (err) {}
        if (isAdhanPlaying || isTestingAdhan) {
          playAdhanAudio(state.selectedAdhanVoice);
        }
      });
    }

    const testAdhanBtn = document.getElementById("btn-test-adhan");
    if (testAdhanBtn) {
      testAdhanBtn.addEventListener("click", () => {
        unlockAudioSystem();
        if (isTestingAdhan || isAdhanPlaying) {
          stopAdhanAudio();
          closeAdhanModal();
        } else {
          isTestingAdhan = true;
          playAdhanAudio(state.selectedAdhanVoice);
          updateAdhanTestBtnUI();

          const modal = document.getElementById("adhan-alert-modal");
          const prayerText = document.getElementById("adhan-modal-prayer-text");
          const cityText = document.getElementById("adhan-modal-city-text");
          if (modal) {
            if (prayerText) prayerText.textContent = "تجربة صوت الأذان والتنبيهات 🔊";
            if (cityText) cityText.textContent = `جاري تشغيل صوت الأذان المبارك والاهتزاز بنجاح في ${state.selectedCity.name}`;
            modal.classList.add("active");
          }
        }
      });
    }

    const closeAdhanBtn = document.getElementById("btn-close-adhan-modal");
    if (closeAdhanBtn) {
      closeAdhanBtn.addEventListener("click", closeAdhanModal);
    }

    // زر تحديث التطبيق ومسح الكاش للآيفون والأجهزة الذكية
    const forceUpdateBtn = document.getElementById("btn-force-update-cache");
    if (forceUpdateBtn) {
      forceUpdateBtn.addEventListener("click", async () => {
        forceUpdateBtn.textContent = "جاري التحديث ومسح الذاكرة... ⏳";
        try {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
          if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let reg of registrations) {
              await reg.unregister();
            }
          }
          localStorage.removeItem("gs_cache_ver");
          setTimeout(() => {
            window.location.reload(true);
          }, 300);
        } catch (e) {
          window.location.reload(true);
        }
      });
    }
  }
});
