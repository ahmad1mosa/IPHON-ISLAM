// محرك الأذكار والتفاعل مع العدادات اليومية - تطبيق gsاسلم
class AdhkarManager {
  constructor() {
    this.currentCategory = "morning";
    this.countersState = {}; // { [dhikrId]: remainingCount }
    this.completedCount = {};
    this.loadState();
  }

  loadState() {
    try {
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem("gs_adhkar_date");
      if (savedDate === today) {
        const saved = localStorage.getItem("gs_adhkar_counts");
        if (saved) this.countersState = JSON.parse(saved);
      } else {
        // يوم جديد، إعادة ضبط العدادات
        this.resetDaily();
        localStorage.setItem("gs_adhkar_date", today);
      }
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem("gs_adhkar_counts", JSON.stringify(this.countersState));
      localStorage.setItem("gs_adhkar_date", new Date().toDateString());
    } catch (e) {}
  }

  resetDaily() {
    this.countersState = {};
    this.saveState();
  }

  getRemainingCount(item) {
    if (this.countersState[item.id] !== undefined) {
      return this.countersState[item.id];
    }
    return item.count;
  }

  decrementCount(item) {
    let current = this.getRemainingCount(item);
    if (current > 0) {
      current--;
      this.countersState[item.id] = current;
      this.saveState();

      if (window.SmartTasbeeh) {
        if (current === 0) {
          window.SmartTasbeeh.playCompletionChime();
          window.SmartTasbeeh.triggerHaptic(true);
        } else {
          window.SmartTasbeeh.playClickSound();
          window.SmartTasbeeh.triggerHaptic(false);
        }
      }
      return { remaining: current, isDone: current === 0 };
    }
    return { remaining: 0, isDone: true };
  }

  resetCategory(catId) {
    const items = ADHKAR_DATA.items[catId] || [];
    items.forEach(item => {
      delete this.countersState[item.id];
    });
    this.saveState();
  }

  getCategoryProgress(catId) {
    const items = ADHKAR_DATA.items[catId] || [];
    if (items.length === 0) return { total: 0, done: 0, percent: 100 };

    let totalDhikrs = items.length;
    let completedDhikrs = 0;

    items.forEach(item => {
      const rem = this.getRemainingCount(item);
      if (rem === 0) completedDhikrs++;
    });

    const percent = Math.round((completedDhikrs / totalDhikrs) * 100);
    return { total: totalDhikrs, done: completedDhikrs, percent };
  }
}

window.AdhkarManager = new AdhkarManager();
