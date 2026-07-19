const DB_NAME = 'blisko-polish-coach';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const STATE_KEY = 'app-state-v1';
const SAFETY_BACKUPS_KEY = 'safety-backups-v1';
const FALLBACK_KEY = 'blisko-app-state-v1';
const FALLBACK_BACKUPS_KEY = 'blisko-safety-backups-v1';
const CURRENT_SCHEMA_VERSION = 5;
const MAX_SAFETY_BACKUPS = 5;

const SKILL_KEYS = ['reading', 'listening', 'guidedProduction', 'freeProduction', 'pronunciation'];

const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const createSkillEntry = () => ({
  attempts: 0,
  correct: 0,
  incorrect: 0,
  score: 0,
  confidence: 0,
  hintsUsed: 0,
  lastAt: null,
});

const createSkillMap = () => Object.fromEntries(SKILL_KEYS.map((key) => [key, createSkillEntry()]));

export const createDefaultState = () => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
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
    speechVoiceURI: '',
    listeningDefaultSpeed: 'natural',
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
    placement: {
      completedAt: null,
      estimatedLevel: null,
      score: 0,
      evidenceConfidence: 0,
      skillScores: {},
      levelScores: {},
      history: [],
      lastMode: null,
    },
  },
  progress: {
    items: {},
    concepts: {},
    topics: {},
    personas: {},
    patterns: {},
    sounds: {},
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
    listeningLab: {
      sessions: 0, attempts: 0, correct: 0, dictations: 0, dictationCorrect: 0,
      naturalSpeedAttempts: 0, naturalSpeedCorrect: 0, fastSpeedAttempts: 0, fastSpeedCorrect: 0,
      replays: 0, shadowing: 0, lastAt: null,
    },
    soundLab: { attempts: 0, correct: 0, completedLessons: [], lastAt: null },
    hintsUsed: 0,
    hintLevelCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    almostKnown: 0,
    hintRecoveries: 0,
    activeRecallCompletions: 0,
    almostKnownByContext: {},
    skillEvidence: {
      ...createSkillMap(),
      grammar: createSkillEntry(),
      conversation: createSkillEntry(),
    },
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
  system: {
    installedVersion: null,
    previousVersion: null,
    lastMigrationAt: null,
    lastSafetyBackupAt: null,
    lastSafetyBackupReason: null,
    lastSuccessfulStartAt: null,
    updateHistory: [],
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

const migrateSkillEntry = (entry = {}) => ({
  ...createSkillEntry(),
  ...(entry || {}),
  attempts: Number(entry?.attempts || 0),
  correct: Number(entry?.correct || 0),
  incorrect: Number(entry?.incorrect || 0),
  score: Math.max(0, Math.min(1, Number(entry?.score ?? entry?.confidence ?? 0) || 0)),
  confidence: Math.max(0, Math.min(1, Number(entry?.confidence ?? entry?.score ?? 0) || 0)),
  hintsUsed: Number(entry?.hintsUsed || 0),
});

const migrateSkillMap = (skills = {}) => {
  const result = {};
  SKILL_KEYS.forEach((key) => { result[key] = migrateSkillEntry(skills?.[key]); });
  return result;
};

const migrateState = (state) => {
  const previousSchema = Number(state.schemaVersion || 1);
  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  state.progress = state.progress || {};
  state.progress.items = state.progress.items || {};
  state.progress.concepts = state.progress.concepts || {};
  state.progress.topics = state.progress.topics || {};
  state.progress.personas = state.progress.personas || {};
  state.progress.patterns = state.progress.patterns || {};
  state.progress.sounds = state.progress.sounds || {};
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
    progress.skills = migrateSkillMap(progress.skills);
    migrateScaffoldProgress(progress);
  });

  Object.values(state.progress.patterns).forEach((progress) => {
    progress.history = Array.isArray(progress.history) ? progress.history : [];
    progress.hintsUsed = Number(progress.hintsUsed || 0);
    progress.maxHintLevel = Number(progress.maxHintLevel || 0);
    progress.almostKnown = Number(progress.almostKnown || 0);
    migrateScaffoldProgress(progress);
  });

  Object.values(state.progress.sounds).forEach((progress) => {
    progress.attempts = Number(progress.attempts || 0);
    progress.correct = Number(progress.correct || 0);
    progress.confidence = Math.max(0, Math.min(1, Number(progress.confidence || 0)));
    progress.lastAt = progress.lastAt || null;
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
  state.stats.activity = Array.isArray(state.stats.activity) ? state.stats.activity : [];
  state.stats.wordsSeen = Array.isArray(state.stats.wordsSeen) ? state.stats.wordsSeen : [];
  state.stats.phrasesSeen = Array.isArray(state.stats.phrasesSeen) ? state.stats.phrasesSeen : [];
  state.stats.listeningLab = {
    sessions: 0, attempts: 0, correct: 0, dictations: 0, dictationCorrect: 0,
    naturalSpeedAttempts: 0, naturalSpeedCorrect: 0, fastSpeedAttempts: 0, fastSpeedCorrect: 0,
    replays: 0, shadowing: 0, lastAt: null,
    ...(state.stats.listeningLab || {}),
  };
  ['sessions','attempts','correct','dictations','dictationCorrect','naturalSpeedAttempts','naturalSpeedCorrect','fastSpeedAttempts','fastSpeedCorrect','replays','shadowing'].forEach((key) => {
    state.stats.listeningLab[key] = Number(state.stats.listeningLab[key] || 0);
  });
  state.stats.soundLab = {
    attempts: 0, correct: 0, completedLessons: [], lastAt: null,
    ...(state.stats.soundLab || {}),
  };
  state.stats.soundLab.attempts = Number(state.stats.soundLab.attempts || 0);
  state.stats.soundLab.correct = Number(state.stats.soundLab.correct || 0);
  state.stats.soundLab.completedLessons = Array.isArray(state.stats.soundLab.completedLessons)
    ? [...new Set(state.stats.soundLab.completedLessons)]
    : [];

  state.settings = state.settings || {};
  state.settings.speechVoiceURI = state.settings.speechVoiceURI || '';
  state.settings.listeningDefaultSpeed = ['slow','natural','fast'].includes(state.settings.listeningDefaultSpeed)
    ? state.settings.listeningDefaultSpeed
    : 'natural';

  const legacyEvidence = state.stats.skillEvidence || {};
  const speakingLegacy = legacyEvidence.speaking || {};
  state.stats.skillEvidence = {
    reading: migrateSkillEntry(legacyEvidence.reading),
    listening: migrateSkillEntry(legacyEvidence.listening),
    guidedProduction: migrateSkillEntry(legacyEvidence.guidedProduction),
    freeProduction: migrateSkillEntry(legacyEvidence.freeProduction || legacyEvidence.grammar),
    pronunciation: migrateSkillEntry(legacyEvidence.pronunciation || speakingLegacy),
    grammar: migrateSkillEntry(legacyEvidence.grammar),
    conversation: migrateSkillEntry(legacyEvidence.conversation || speakingLegacy),
  };

  state.onboarding = state.onboarding || {};
  state.onboarding.placement = {
    completedAt: null,
    estimatedLevel: null,
    score: 0,
    evidenceConfidence: 0,
    skillScores: {},
    levelScores: {},
    history: [],
    lastMode: null,
    ...(state.onboarding.placement || {}),
  };
  state.onboarding.placement.history = Array.isArray(state.onboarding.placement.history)
    ? state.onboarding.placement.history.slice(-6)
    : [];

  state.tutor = state.tutor || {};
  state.tutor.messages = Array.isArray(state.tutor.messages) ? state.tutor.messages : [];
  state.tutor.rememberedIssues = Array.isArray(state.tutor.rememberedIssues) ? state.tutor.rememberedIssues : [];
  state.tutor.exerciseStates = state.tutor.exerciseStates || {};

  state.conversation = state.conversation || {};
  state.conversation.transcripts = state.conversation.transcripts || {};
  Object.values(state.conversation.transcripts).forEach((transcript) => {
    transcript.hintsByTurn = transcript.hintsByTurn || {};
  });

  state.system = {
    installedVersion: null,
    previousVersion: null,
    lastMigrationAt: null,
    lastSafetyBackupAt: null,
    lastSafetyBackupReason: null,
    lastSuccessfulStartAt: null,
    updateHistory: [],
    ...(state.system || {}),
  };
  state.system.updateHistory = Array.isArray(state.system.updateHistory) ? state.system.updateHistory.slice(-10) : [];
  if (previousSchema < CURRENT_SCHEMA_VERSION && !state.system.lastMigrationAt) {
    state.system.lastMigrationAt = new Date().toISOString();
  }
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
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

let databasePromise;

const getDatabase = async () => {
  if (!databasePromise) databasePromise = openDatabase().catch(() => null);
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

const fallbackBackupsGet = () => {
  try {
    const raw = localStorage.getItem(FALLBACK_BACKUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const fallbackBackupsSet = (value) => {
  try {
    localStorage.setItem(FALLBACK_BACKUPS_KEY, JSON.stringify(value.slice(0, 2)));
    return true;
  } catch {
    return false;
  }
};

const cloneValue = (value) => (typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value)));

const simpleFingerprint = (value) => {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const readSafetyBackups = async () => {
  try {
    const saved = await idbGet(SAFETY_BACKUPS_KEY);
    if (Array.isArray(saved)) return saved;
  } catch {
    // fall through to localStorage
  }
  return fallbackBackupsGet();
};

const writeSafetyBackups = async (backups) => {
  const limited = backups.slice(0, MAX_SAFETY_BACKUPS);
  try {
    await idbSet(SAFETY_BACKUPS_KEY, limited);
  } catch {
    // local fallback below
  }
  fallbackBackupsSet(limited);
  return limited;
};

const storeSafetySnapshot = async (rawState, reason, appVersion = null) => {
  if (!rawState || typeof rawState !== 'object') return null;
  const snapshot = cloneValue(rawState);
  const backup = {
    id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    reason,
    appVersion: appVersion || snapshot.system?.installedVersion || null,
    schemaVersion: Number(snapshot.schemaVersion || 1),
    fingerprint: simpleFingerprint(snapshot),
    state: snapshot,
  };
  const existing = await readSafetyBackups();
  await writeSafetyBackups([backup, ...existing].slice(0, MAX_SAFETY_BACKUPS));
  return backup;
};

export const createSafetyBackup = async (state, reason = 'manual', appVersion = null) => {
  const backup = await storeSafetySnapshot(state, reason, appVersion);
  if (backup && state?.system) {
    state.system.lastSafetyBackupAt = backup.createdAt;
    state.system.lastSafetyBackupReason = reason;
  }
  return backup;
};

export const listSafetyBackups = async () => {
  const backups = await readSafetyBackups();
  return backups.map(({ state, ...metadata }) => ({ ...metadata, itemCount: Object.keys(state?.progress?.items || {}).length }));
};

export const restoreLatestSafetyBackup = async () => {
  const backups = await readSafetyBackups();
  if (!backups.length) throw new Error('No safety copy is available on this device.');
  return migrateState(deepMerge(createDefaultState(), cloneValue(backups[0].state)));
};

export const ensureAutomaticBackup = async (state, {
  appVersion = null,
  maxAgeHours = 24,
  reason = 'automatic daily safety copy',
} = {}) => {
  const last = state?.system?.lastSafetyBackupAt ? new Date(state.system.lastSafetyBackupAt).getTime() : 0;
  if (last && Date.now() - last < maxAgeHours * 3_600_000) return null;
  return createSafetyBackup(state, reason, appVersion);
};

export const loadState = async ({ appVersion = null } = {}) => {
  const defaults = createDefaultState();
  let saved = null;
  try {
    saved = await idbGet(STATE_KEY);
  } catch {
    saved = null;
  }
  if (!saved) saved = fallbackGet();

  const savedSchema = Number(saved?.schemaVersion || 1);
  const savedVersion = saved?.system?.installedVersion || null;
  const versionChanged = Boolean(saved && appVersion && savedVersion && savedVersion !== appVersion);
  const schemaChanged = Boolean(saved && savedSchema < CURRENT_SCHEMA_VERSION);
  if (saved && (versionChanged || schemaChanged)) {
    try {
      await storeSafetySnapshot(
        saved,
        versionChanged ? `before update ${savedVersion || 'unknown'} → ${appVersion}` : `before schema ${savedSchema} → ${CURRENT_SCHEMA_VERSION}`,
        savedVersion,
      );
    } catch {
      // A failed backup must not prevent the app from opening.
    }
  }

  const state = migrateState(deepMerge(defaults, saved || {}));
  if (appVersion && state.system.installedVersion !== appVersion) {
    const previous = state.system.installedVersion;
    state.system.previousVersion = previous || state.system.previousVersion || null;
    state.system.installedVersion = appVersion;
    state.system.lastMigrationAt = new Date().toISOString();
    state.system.updateHistory.push({
      at: state.system.lastMigrationAt,
      from: previous || 'first tracked build',
      to: appVersion,
    });
    state.system.updateHistory = state.system.updateHistory.slice(-10);
  }

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
  const snapshot = cloneValue(state);
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

export const markStartupHealthy = async (state, appVersion = null) => {
  if (!state.system) state.system = createDefaultState().system;
  state.system.lastSuccessfulStartAt = new Date().toISOString();
  if (appVersion) state.system.installedVersion = appVersion;
  return saveState(state, { immediate: true });
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

export const validateBackup = (raw) => {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const issues = [];
  if (!parsed || parsed.app !== 'Blisko') issues.push('The file is not labelled as a Blisko backup.');
  if (!parsed?.state || typeof parsed.state !== 'object') issues.push('The learning state is missing.');
  if (parsed?.state && !parsed.state.progress) issues.push('Progress data is missing.');
  if (parsed?.state && !parsed.state.stats) issues.push('Learning statistics are missing.');
  const schemaVersion = Number(parsed?.schemaVersion || parsed?.state?.schemaVersion || 0);
  if (schemaVersion > CURRENT_SCHEMA_VERSION) issues.push('This backup was created by a newer Blisko version.');
  return {
    valid: issues.length === 0,
    issues,
    parsed,
    schemaVersion,
    itemCount: Object.keys(parsed?.state?.progress?.items || {}).length,
    fingerprint: parsed?.state ? simpleFingerprint(parsed.state) : null,
  };
};

export const exportState = (state) => {
  const payload = {
    app: 'Blisko',
    schemaVersion: state.schemaVersion,
    appVersion: state.system?.installedVersion || null,
    exportedAt: new Date().toISOString(),
    fingerprint: simpleFingerprint(state),
    state,
  };
  return JSON.stringify(payload, null, 2);
};

export const importState = (raw) => {
  const report = validateBackup(raw);
  if (!report.valid) throw new Error(report.issues[0] || 'This does not look like a Blisko backup.');
  const imported = migrateState(deepMerge(createDefaultState(), report.parsed.state));
  imported.system.lastMigrationAt = new Date().toISOString();
  return imported;
};

export const getStorageHealth = async (state = null) => {
  const backups = await listSafetyBackups();
  let indexedDbAvailable = false;
  try {
    indexedDbAvailable = Boolean(await getDatabase());
  } catch {
    indexedDbAvailable = false;
  }
  let persisted = false;
  try {
    persisted = Boolean(await navigator.storage?.persisted?.());
  } catch {
    persisted = false;
  }
  return {
    indexedDbAvailable,
    localFallbackAvailable: (() => {
      try {
        const key = '__blisko_health__';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    })(),
    persisted,
    backupCount: backups.length,
    latestBackup: backups[0] || null,
    lastSuccessfulStartAt: state?.system?.lastSuccessfulStartAt || null,
    schemaVersion: state?.schemaVersion || CURRENT_SCHEMA_VERSION,
  };
};

export const getTodayKey = todayKey;
export const getCurrentSchemaVersion = () => CURRENT_SCHEMA_VERSION;
