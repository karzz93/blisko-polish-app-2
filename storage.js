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
  schemaVersion: 1,
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
    activity: [],
  },
  tutor: {
    messages: [],
    rememberedIssues: [],
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
  const state = deepMerge(defaults, saved || {});

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
  return deepMerge(createDefaultState(), parsed.state);
};

export const getTodayKey = todayKey;
