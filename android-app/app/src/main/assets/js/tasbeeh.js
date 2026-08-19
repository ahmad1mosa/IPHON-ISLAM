// محرك المسبحة الإلكترونية التفاعلية الذكية - تطبيق gsاسلم
class SmartTasbeeh {
  constructor() {
    this.storageKey = "gs_tasbeeh_state";
    this.statsKey = "gs_tasbeeh_history";

    this.defaultDhikrs = [
      { id: "subhanallah", text: "سُبْحَانَ اللَّهِ", target: 33 },
      { id: "alhamdulillah", text: "الْحَمْدُ لِلَّهِ", target: 33 },
      { id: "allahuakbar", text: "اللَّهُ أَكْبَرُ", target: 33 },
      { id: "la_ilaha_illallah", text: "لَا إِلَهَ إِلَّا اللَّهُ", target: 100 },
      { id: "astaghfirullah", text: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", target: 100 },
      { id: "salawat", text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", target: 100 },
      { id: "hawqalah", text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ العَلِيِّ العَظِيمِ", target: 100 },
      { id: "subhan_wa_bihamdih", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ العَظِيمِ", target: 100 }
    ];

    this.audioCtx = null;
    this.soundEnabled = true;
    this.vibrateEnabled = true;

    this.currentCount = 0;
    this.currentRound = 0;
    this.target = 33;
    this.selectedDhikr = this.defaultDhikrs[0].text;
    this.totalDhikrToday = 0;

    this.initAudio();
    this.loadState();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
    }
  }

  ensureAudioRunning() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  // توليد صوت نقرة خشبية ناعمة متوافقة مع جميع الأجهزة
  playClickSound() {
    if (!this.soundEnabled) return;
    this.ensureAudioRunning();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      // نغمة مسبحة لطيفة ومريحة للأذن
      osc.frequency.setValueAtTime(580, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      // تجاهل أخطاء الصوت
    }
  }

  // نغمة رنين بهيجة عند إكمال الهدف
  playCompletionChime() {
    if (!this.soundEnabled) return;
    this.ensureAudioRunning();
    if (!this.audioCtx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // نغمات C E G C
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const startTime = this.audioCtx.currentTime + idx * 0.08;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch (e) {}
  }

  // اهتزاز لمسي ممتع (متوافق مع أندرويد ويدعم Safari إن وُجد)
  triggerHaptic(isCompletion = false) {
    if (!this.vibrateEnabled || !navigator.vibrate) return;
    try {
      if (isCompletion) {
        navigator.vibrate([60, 40, 80, 40, 140]);
      } else {
        navigator.vibrate(35);
      }
    } catch (e) {}
  }

  // زيادة العداد
  increment() {
    this.currentCount++;
    this.totalDhikrToday++;

    let completedGoal = false;

    // إذا وصلنا للهدف
    if (this.target > 0 && this.currentCount >= this.target) {
      this.currentRound++;
      this.currentCount = 0;
      completedGoal = true;
      this.playCompletionChime();
      this.triggerHaptic(true);
    } else {
      this.playClickSound();
      this.triggerHaptic(false);
    }

    this.saveState();
    return {
      count: this.currentCount,
      round: this.currentRound,
      target: this.target,
      totalToday: this.totalDhikrToday,
      completedGoal
    };
  }

  // تصفير العداد وتصفير الدورات بالكامل
  reset(resetRounds = true) {
    this.currentCount = 0;
    this.currentRound = 0;
    this.saveState();
    return {
      count: this.currentCount,
      round: this.currentRound,
      target: this.target,
      totalToday: this.totalDhikrToday
    };
  }

  setTarget(newTarget) {
    this.target = parseInt(newTarget, 10) || 0;
    this.saveState();
  }

  setDhikr(dhikrText) {
    this.selectedDhikr = dhikrText;
    this.saveState();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveState();
    return this.soundEnabled;
  }

  toggleVibrate() {
    this.vibrateEnabled = !this.vibrateEnabled;
    this.saveState();
    return this.vibrateEnabled;
  }

  saveSettings() {
    this.saveState();
  }

  saveState() {
    const state = {
      currentCount: this.currentCount,
      currentRound: this.currentRound,
      target: this.target,
      selectedDhikr: this.selectedDhikr,
      soundEnabled: this.soundEnabled,
      vibrateEnabled: this.vibrateEnabled,
      totalDhikrToday: this.totalDhikrToday,
      lastDate: new Date().toDateString()
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {}
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.currentCount = data.currentCount || 0;
        this.currentRound = data.currentRound || 0;
        this.target = data.target !== undefined ? data.target : 33;
        this.selectedDhikr = data.selectedDhikr || this.defaultDhikrs[0].text;
        this.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
        this.vibrateEnabled = data.vibrateEnabled !== undefined ? data.vibrateEnabled : true;

        if (data.lastDate === new Date().toDateString()) {
          this.totalDhikrToday = data.totalDhikrToday || 0;
        } else {
          this.totalDhikrToday = 0;
        }
      }
    } catch (e) {}
  }
}

window.SmartTasbeeh = new SmartTasbeeh();
