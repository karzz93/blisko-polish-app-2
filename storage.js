const DB_NAME = 'blisko-polish-coach';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const STATE_KEY = 'app-state-v1';
const FALLBACK_KEY = 'blisko-app-state-v1';

const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const createDefaultState = () => ({
  schemaVersion: 3,
  profile: {
    name: 'Kars',
    nativeLanguage: 'nl',
    supportLanguage: 'en',
    speakerGender: 'male',
    dailyGoal: 15,
    familyNames: {
      motherInLaw: 'Mother-in-law',
      fatherInLaw: 'Father-in-law',
      grandmother: 'Grandmother',
    },
    interests: ['motorsport', 'snowboarding', 'festivals', 'bonsai'],
  },
  settings: {
    theme: 'dark',
    speechRate: 0.86,
    showDutch: true,
    showEnglish: true,
    autoSpeak: false,
    haptics: true,
    aiProxyUrl: '',
    aiModelLabel: 'Local coach',
  },
  onboarding: {
    completed: true,
    diagnosticLevel: 'starter',
  },
  progress: {
    items: {},
    concepts: {},
    topics: {},
    personas: {},
    patterns: {},
    confusionPairs: {},
  },
  stats: {
    streak: 0,
    bestStreak: 0,
    lastStudyDate: null,
    minutesToday: 0,
    minutesDate: todayKey(),
    totalMinutes: 0,
    sessions: 0,
    reviews: 0,
    correct: 0,
    incorrect: 0,
    wordsSeen: [],
    phrasesSeen: [],
    speakingAttempts: 0,
    conversationTurns: 0,
    gamesPlayed: 0,
    hintsUsed: 0,
    hintLevelCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    almostKnown: 0,
    hintRecoveries: 0,
    activeRecallCompletions: 0,
    almostKnownByContext: {},
    activity: [],
  },
  tutor: {
    messages: [],
    rememberedIssues: [],
    exerciseStates: {},
  },
  conversation: {
    selectedPersona: 'mother-in-law',
    level: 'guided',
    transcripts: {},
  },
  ui: {
    lastView: 'dashboard',
    dismissedMilestones: [],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const deepMerge = (base, saved) => {
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (base && typeof base === 'object') {
    const result = { ...base };
    if (saved && typeof saved === 'object') {
      Object.keys(saved).forEach((key) => {
        result[key] = key in base ? deepMerge(base[key], saved[key]) : saved[key];
      });
    }
    return result;
  }
  return saved === undefined ? base : saved;
};


const scaffoldLevelFromScore = (score = 0) => {
  const safeScore = Math.max(0, Number(score) || 0);
  if (safeScore >= 1.8) return 2;
  if (safeScore >= 0.5) return 1;
  return 0;
};

const seedScaffoldScore = (progress = {}) => {
  if (Number.isFinite(Number(progress.scaffoldScore))) return Math.max(0, Math.min(4.5, Number(progress.scaffoldScore)));
  const weights = { 1: 0.1, 2: 0.3, 3: 0.6, 4: 1, 5: 1.4 };
  const recentHints = Array.isArray(progress.hintHistory) ? progress.hintHistory.slice(-6) : [];
  let score = recentHints.reduce((sum, entry) => sum + (weights[Math.max(1, Math.min(5, Number(entry?.level) || 1))] || 0), 0);
  if (!recentHints.length) {
    const lastLevel = Math.max(0, Math.min(5, Number(progress.lastHintLevel || progress.maxHintLevel || 0)));
    score += weights[lastLevel] || 0;
    score += Math.min(0.8, Number(progress.hintedReviews || 0) * 0.18);
  }
  return Math.max(0, Math.min(4.5, score));
};

const migrateScaffoldProgress = (progress = {}) => {
  progress.scaffoldScore = seedScaffoldScore(progress);
  progress.scaffoldLevel = scaffoldLevelFromScore(progress.scaffoldScore);
  progress.supportEpisodes = Number(progress.supportEpisodes || progress.hintedReviews || 0);
  progress.independentSuccesses = Number(progress.independentSuccesses || 0);
  progress.lastScaffoldReason = progress.lastScaffoldReason || (progress.scaffoldLevel ? 'Previous hint history' : null);
  progress.lastScaffoldAt = progress.lastScaffoldAt || null;
  return progress;
};

const migrateState = (state) => {
  state.schemaVersion = 3;
  state.progress = state.progress || {};
  state.progress.items = state.progress.items || {};
  state.progress.concepts = state.progress.concepts || {};
  state.progress.topics = state.progress.topics || {};
  state.progress.personas = state.progress.personas || {};
  state.progress.patterns = state.progress.patterns || {};
  state.progress.confusionPairs = state.progress.confusionPairs || {};

  Object.values(state.progress.items).forEach((progress) => {
    progress.history = Array.isArray(progress.history) ? progress.history : [];
    progress.hintHistory = Array.isArray(progress.hintHistory) ? progress.hintHistory : [];
    progress.hintsUsed = Number(progress.hintsUsed || 0);
    progress.hintedReviews = Number(progress.hintedReviews || 0);
    progress.maxHintLevel = Number(progress.maxHintLevel || 0);
    progress.lastHintLevel = Number(progress.lastHintLevel || 0);
    progress.almostKnown = Number(progress.almostKnown || 0);
    progress.activeRecallRecoveries = Number(progress.activeRecallRecoveries || 0);
    migrateScaffoldProgress(progress);
  });

  Object.values(state.progress.patterns).forEach((progress) => {
    progress.history = Array.isArray(progress.history) ? progress.history : [];
    progress.hintsUsed = Number(progress.hintsUsed || 0);
    progress.maxHintLevel = Number(progress.maxHintLevel || 0);
    progress.almostKnown = Number(progress.almostKnown || 0);
    migrateScaffoldProgress(progress);
  });

  state.stats = state.stats || {};
  state.stats.hintsUsed = Number(state.stats.hintsUsed || 0);
  state.stats.hintLevelCounts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    ...(state.stats.hintLevelCounts || {}),
  };
  state.stats.almostKnown = Number(state.stats.almostKnown || 0);
  state.stats.hintRecoveries = Number(state.stats.hintRecoveries || 0);
  state.stats.activeRecallCompletions = Number(state.stats.activeRecallCompletions || 0);
  state.stats.almostKnownByContext = state.stats.almostKnownByContext || {};

  state.tutor = state.tutor || {};
  state.tutor.messages = Array.isArray(state.tutor.messages) ? state.tutor.messages : [];
  state.tutor.rememberedIssues = Array.isArray(state.tutor.rememberedIssues) ? state.tutor.rememberedIssues : [];
  state.tutor.exerciseStates = state.tutor.exerciseStates || {};

  state.conversation = state.conversation || {};
  state.conversation.transcripts = state.conversation.transcripts || {};
  Object.values(state.conversation.transcripts).forEach((transcript) => {
    transcript.hintsByTurn = transcript.hintsByTurn || {};
  });
  return state;
};

const openDatabase = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    resolve(null);
    return;
  }

  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

let databasePromise;

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = openDatabase().catch(() => null);
  }
  return databasePromise;
};

const idbGet = async (key) => {
  const db = await getDatabase();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
};

const idbSet = async (key, value) => {
  const db = await getDatabase();
  if (!db) return false;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
};

const idbDelete = async (key) => {
  const db = await getDatabase();
  if (!db) return false;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
};

const fallbackGet = () => {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const fallbackSet = (value) => {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const loadState = async () => {
  const defaults = createDefaultState();
  let saved = null;
  try {
    saved = await idbGet(STATE_KEY);
  } catch {
    saved = null;
  }
  if (!saved) saved = fallbackGet();
  const state = migrateState(deepMerge(defaults, saved || {}));

  const today = todayKey();
  if (state.stats.minutesDate !== today) {
    state.stats.minutesDate = today;
    state.stats.minutesToday = 0;
  }
  return state;
};

let saveTimer = null;
let pendingState = null;

const persist = async (state) => {
  const snapshot = typeof structuredClone === 'function' ? structuredClone(state) : JSON.parse(JSON.stringify(state));
  snapshot.updatedAt = new Date().toISOString();
  let saved = false;
  try {
    saved = await idbSet(STATE_KEY, snapshot);
  } catch {
    saved = false;
  }
  fallbackSet(snapshot);
  return saved;
};

export const saveState = (state, { immediate = false } = {}) => {
  pendingState = state;
  if (saveTimer) clearTimeout(saveTimer);

  if (immediate) {
    saveTimer = null;
    return persist(pendingState);
  }

  return new Promise((resolve) => {
    saveTimer = setTimeout(async () => {
      saveTimer = null;
      resolve(await persist(pendingState));
    }, 180);
  });
};

export const flushState = async () => {
  if (!pendingState) return false;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  return persist(pendingState);
};

export const resetState = async () => {
  try {
    await idbDelete(STATE_KEY);
  } catch {
    // local fallback is cleared below
  }
  try {
    localStorage.removeItem(FALLBACK_KEY);
  } catch {
    // storage may be unavailable in private mode
  }
  return createDefaultState();
};

export const exportState = (state) => {
  const payload = {
    app: 'Blisko',
    schemaVersion: state.schemaVersion,
    exportedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(payload, null, 2);
};

export const importState = (raw) => {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!parsed || parsed.app !== 'Blisko' || !parsed.state) {
    throw new Error('This does not look like a Blisko backup.');
  }
  return migrateState(deepMerge(createDefaultState(), parsed.state));
};

export const getTodayKey = todayKey;
