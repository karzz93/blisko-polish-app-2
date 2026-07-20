import {
  APP_VERSION,
  PLACEMENT_QUESTIONS,
  NAV_ITEMS,
  TOPICS,
  WORDS,
  PHRASES,
  GRAMMAR_CONCEPTS,
  PATTERNS,
  REAL_LIFE_SCENARIOS,
  PERSONAS,
  CONVERSATIONS,
  RESCUE_PHRASES,
  GAME_TYPES,
} from './data.js?v=1.4.1';
import {
  loadState,
  saveState,
  flushState,
  resetState,
  exportState,
  importState,
  validateBackup,
  createSafetyBackup,
  listSafetyBackups,
  restoreLatestSafetyBackup,
  ensureAutomaticBackup,
  markStartupHealthy,
  getStorageHealth,
} from './storage.js?v=1.4.1';
import {
  ITEM_MAP,
  WORD_MAP,
  PHRASE_MAP,
  CONCEPT_MAP,
  buildSession,
  makeExercise,
  reviewItem,
  evaluateAnswer,
  getDueItems,
  getReviewQueue,
  getWeakItems,
  getTopicReadiness,
  getScenarioReadiness,
  getPersonaReadiness,
  getMetrics,
  getCoachInsights,
  getRecommendedTopic,
  getActivityDays,
  evaluateConversationReply,
  recordConversationTurn,
  recordSkillEvidence,
  addActivity,
  getPatternSentence,
  getPatternTranslation,
  generateExerciseHint,
  generateConversationHint,
  generateTutorExerciseHint,
  recordHintUse,
  recordAlmostKnown,
  recordPatternPractice,
  getHintEvidenceWeight,
  getAdaptiveSupportLevel,
  getExerciseSkill,
  applyPlacementResult,
  normalizeText,
  shuffle,
} from './engine.js?v=1.4.1';
import { localTutorReply, cloudTutorReply } from './tutor.js?v=1.4.1';
import {
  SOUND_LESSONS,
  analyzePolishWord,
  analyzePolishSentence,
  getSoundLesson,
  getSoundLessonForWord,
  splitPolishTokens,
  isPolishWordToken,
} from './polish.js?v=1.4.1';

const ICON_PATHS = {
  home: '<path d="M3 10.8 12 3l9 7.8v8.7a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z"/><path d="M9 21v-6h6v6"/>',
  sparkles: '<path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2z"/><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8z"/><path d="m19 13-.7 1.8-1.8.7 1.8.7L19 18l.7-1.8 1.8-.7-1.8-.7z"/>',
  repeat: '<path d="M17 2.5 21 6l-4 3.5"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 21.5-4-3.5 4-3.5"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  message: '<path d="M20.5 14.5a3 3 0 0 1-3 3H9L4 21v-3.5a3 3 0 0 1-2-2.8V7a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3z"/><path d="M7 9h10M7 13h6"/>',
  bot: '<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M9 12h.01M15 12h.01M8 16h8"/>',
  game: '<path d="M8.5 7h7a5.5 5.5 0 0 1 5.3 7l-1 3.4a2.2 2.2 0 0 1-3.6 1L14.5 17h-5l-1.7 1.4a2.2 2.2 0 0 1-3.6-1L3.2 14a5.5 5.5 0 0 1 5.3-7Z"/><path d="M8 11v4M6 13h4M16.5 11.5h.01M18.5 14h.01"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H11v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M20 4.5A2.5 2.5 0 0 0 17.5 2H13v18h4.5A2.5 2.5 0 0 1 20 22z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/>',
  mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v7H5a1 1 0 0 1-1-1zM20 14h-3v7h2a1 1 0 0 0 1-1z"/>',
  brain: '<path d="M9.5 4A3.5 3.5 0 0 0 6 7.5v.7A3.5 3.5 0 0 0 4.5 15H5a4 4 0 0 0 4 4V4.2A2.8 2.8 0 0 1 9.5 4ZM14.5 4A3.5 3.5 0 0 1 18 7.5v.7a3.5 3.5 0 0 1 1.5 6.8H19a4 4 0 0 1-4 4V4.2a2.8 2.8 0 0 0-.5-.2Z"/><path d="M9 8H7M15 8h2M9 13H6M15 13h3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  bolt: '<path d="m13 2-9 12h8l-1 8 9-12h-8z"/>',
  cards: '<rect x="4" y="3" width="14" height="18" rx="2" transform="rotate(-7 11 12)"/><rect x="8" y="3" width="12" height="18" rx="2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v4M12 17h.01"/>',
  lightbulb: '<path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.7-1.5 1.7-1.5 2.5h-4c0-.8-.6-1.8-1.5-2.5Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  flag: '<path d="M5 22V3M5 4h12l-2 4 2 4H5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7l1-3h4l1 3"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 4.1 1.9c-1.2.8-1.8 1.2-1.8 2.6M12 17h.01"/>',
};

const icon = (name, className = '') => `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.help}</svg>`;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const polishInteractive = (text = '', { className = '' } = {}) => {
  const source = String(text || '');
  if (!source) return '';
  const wordPattern = /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?:-[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)?/g;
  let output = '';
  let lastIndex = 0;
  let match;
  while ((match = wordPattern.exec(source))) {
    output += escapeHtml(source.slice(lastIndex, match.index));
    const token = match[0];
    output += `<button class="morph-token ${className}" type="button" data-action="open-morphology" data-word="${escapeHtml(token)}" data-sentence="${escapeHtml(source)}" aria-label="Explain Polish form ${escapeHtml(token)}">${escapeHtml(token)}</button>`;
    lastIndex = match.index + token.length;
  }
  output += escapeHtml(source.slice(lastIndex));
  return output;
};

const ratio = (value, total) => total ? Math.round((Number(value || 0) / Number(total)) * 100) : 0;

const percent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const formatNumber = (value) => new Intl.NumberFormat('en-NL').format(value || 0);
const formatDateRelative = (iso) => {
  if (!iso) return 'New';
  const diff = new Date(iso).getTime() - Date.now();
  const absolute = Math.abs(diff);
  if (absolute < 60_000) return diff <= 0 ? 'Now' : 'In a moment';
  if (absolute < 3_600_000) return `${diff < 0 ? '' : 'in '}${Math.round(absolute / 60_000)} min${diff < 0 ? ' ago' : ''}`;
  if (absolute < 86_400_000) return `${diff < 0 ? '' : 'in '}${Math.round(absolute / 3_600_000)} hr${diff < 0 ? ' ago' : ''}`;
  return `${diff < 0 ? '' : 'in '}${Math.round(absolute / 86_400_000)} d${diff < 0 ? ' ago' : ''}`;
};

let state;
let currentView = 'dashboard';
let deferredInstallPrompt = null;
let session = null;
let selectedPatternId = PATTERNS[0].id;
let patternSelections = {};
let activeGame = null;
let libraryQuery = '';
let libraryFilter = 'all';
let mediaRecorder = null;
let recordingStream = null;
let recordingChunks = [];
let recognition = null;
let tutorAbortController = null;
let largestVisualViewportHeight = 0;
let placementSession = null;
let appHealthSnapshot = null;
let activeListeningLab = null;
let activeSoundLab = null;
let morphologyContext = null;
let availablePolishVoices = [];

const mainContent = document.getElementById('main-content');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');
const morphologyRoot = document.createElement('div');
morphologyRoot.id = 'morphology-root';
document.body.appendChild(morphologyRoot);

const PAGE_META = {
  dashboard: ['YOUR COACH', 'Today'],
  learn: ['PERSONAL PATH', 'Learn'],
  review: ['MEMORY ENGINE', 'Review'],
  talk: ['FLAGSHIP MODE', 'Talk'],
  tutor: ['BILINGUAL COACH', 'Tutor'],
  games: ['QUICK PRACTICE', 'Mini games'],
  progress: ['REAL-WORLD PROGRESS', 'Progress'],
  library: ['YOUR POLISH', 'Word library'],
};

const primaryLanguage = () => state.settings.showDutch ? 'nl' : 'en';
const secondaryLanguage = () => primaryLanguage() === 'nl' ? 'en' : 'nl';
const primaryTranslation = (item) => item?.[primaryLanguage()] || item?.nl || item?.en || '';
const secondaryTranslation = (item) => item?.[secondaryLanguage()] || '';


const evaluationContextFor = (exercise = {}) => ({
  language: exercise.answerKind === 'polish' || exercise.answerKind === 'speech' || ['typing', 'ordering', 'speaking'].includes(exercise.type)
    ? 'pl'
    : primaryLanguage(),
  answerKind: exercise.answerKind,
  acceptedAnswers: exercise.acceptedAnswers || exercise.source?.acceptedAnswers || [],
  alternatives: exercise.alternatives || exercise.source?.alternatives || [],
  grammar: exercise.grammar || exercise.source?.grammar || [],
  source: exercise.source || null,
  exercise,
});

const evaluateExerciseAnswer = (value, exercise = currentExercise()) => evaluateAnswer(
  value,
  exercise?.answer || '',
  evaluationContextFor(exercise || {}),
);

const formatDateTime = (iso) => {
  if (!iso) return 'Not yet';
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const topicColor = (topic) => {
  const color = topic?.color || 'green';
  const map = {
    green: ['var(--green)', 'var(--green-soft)'],
    coral: ['var(--coral)', 'var(--coral-soft)'],
    amber: ['var(--amber)', 'var(--amber-soft)'],
    blue: ['var(--blue)', 'var(--blue-soft)'],
    purple: ['var(--purple)', 'var(--purple-soft)'],
  };
  return map[color] || map.green;
};

const hydrateStaticIcons = (root = document) => {
  root.querySelectorAll('[data-icon]').forEach((node) => {
    const name = node.getAttribute('data-icon');
    node.innerHTML = icon(name);
  });
};

const haptic = (duration = 8) => {
  if (state?.settings?.haptics && navigator.vibrate) navigator.vibrate(duration);
};

const showToast = (title, detail = '', iconName = 'check') => {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon(iconName)}</span>
    <span><strong>${escapeHtml(title)}</strong>${detail ? `<span>${escapeHtml(detail)}</span>` : ''}</span>
  `;
  toastRoot.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
  }, 3200);
  setTimeout(() => toast.remove(), 3500);
};


const syncVisualViewport = ({ resetBaseline = false } = {}) => {
  const viewport = window.visualViewport;
  const height = Math.max(1, Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight));
  const top = Math.max(0, Math.round(viewport?.offsetTop || 0));
  if (resetBaseline || !largestVisualViewportHeight || height > largestVisualViewportHeight) {
    largestVisualViewportHeight = height;
  }
  const activeElement = document.activeElement;
  const editing = Boolean(activeElement?.matches?.('input, textarea, [contenteditable="true"]'));
  const keyboardOpen = Boolean(session && editing && largestVisualViewportHeight - height > 96);

  document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
  document.documentElement.style.setProperty('--visual-viewport-top', `${top}px`);
  document.documentElement.style.setProperty('--keyboard-height', `${Math.max(0, largestVisualViewportHeight - height)}px`);
  document.body.classList.toggle('session-keyboard-open', keyboardOpen);
};

const setupVisualViewport = () => {
  syncVisualViewport({ resetBaseline: true });
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', () => syncVisualViewport(), { passive: true });
  viewport?.addEventListener('scroll', () => syncVisualViewport(), { passive: true });
  window.addEventListener('resize', () => syncVisualViewport(), { passive: true });
  window.addEventListener('orientationchange', () => {
    largestVisualViewportHeight = 0;
    setTimeout(() => syncVisualViewport({ resetBaseline: true }), 180);
  });
  document.addEventListener('focusin', () => setTimeout(() => syncVisualViewport(), 40));
  document.addEventListener('focusout', () => setTimeout(() => syncVisualViewport(), 120));
};

const refreshPolishVoices = () => {
  if (!('speechSynthesis' in window)) {
    availablePolishVoices = [];
    return availablePolishVoices;
  }
  availablePolishVoices = window.speechSynthesis.getVoices()
    .filter((voice) => voice.lang?.toLowerCase().startsWith('pl'))
    .sort((left, right) => Number(right.localService) - Number(left.localService) || left.name.localeCompare(right.name));
  return availablePolishVoices;
};

const speechRateFor = (speed = 'natural') => {
  const base = Number(state?.settings?.speechRate || 0.86);
  if (speed === 'slow') return Math.max(0.48, base * 0.74);
  if (speed === 'fast') return Math.min(1.2, Math.max(0.96, base * 1.2));
  return Math.min(1.05, Math.max(0.72, base));
};

const speak = (text, {
  rate = state?.settings?.speechRate || 0.86,
  speed = null,
  voiceURI = state?.settings?.speechVoiceURI || '',
  onStart = null,
  onEnd = null,
  cancel = true,
} = {}) => {
  if (!('speechSynthesis' in window)) {
    showToast('Speech is unavailable', 'This browser does not expose text-to-speech.', 'alert');
    return null;
  }
  if (cancel) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text || ''));
  utterance.lang = 'pl-PL';
  utterance.rate = Number(speed ? speechRateFor(speed) : rate) || 0.86;
  const voices = refreshPolishVoices();
  const selected = voices.find((voice) => voice.voiceURI === voiceURI)
    || voices.find((voice) => voice.localService)
    || voices[0];
  if (selected) utterance.voice = selected;
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
};

const setTheme = (theme) => {
  state.settings.theme = theme;
  document.documentElement.dataset.theme = theme;
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.setAttribute('data-icon', theme === 'dark' ? 'sun' : 'moon');
    hydrateStaticIcons(themeIcon.parentElement);
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = theme === 'dark' ? '#101315' : '#f4f3ee';
};

const save = (options) => saveState(state, options);

const updateConnectionStatus = () => {
  const pill = document.getElementById('connection-pill');
  const label = document.getElementById('connection-label');
  if (!pill || !label) return;
  if (navigator.onLine) {
    pill.classList.remove('offline-live');
    label.textContent = 'Offline ready';
  } else {
    pill.classList.add('offline-live');
    label.textContent = 'Working offline';
  }
};

const renderNavigation = () => {
  const dueCount = getDueItems(state).length;
  const desktop = document.getElementById('desktop-nav');
  const mobile = document.getElementById('mobile-nav');

  desktop.innerHTML = NAV_ITEMS.map((item) => `
    <button class="nav-item ${currentView === item.id ? 'active' : ''}" type="button" data-action="go-view" data-view="${item.id}" aria-current="${currentView === item.id ? 'page' : 'false'}">
      ${icon(item.icon, 'nav-icon')}
      <span class="nav-label">${escapeHtml(item.label)}</span>
      ${item.badge === 'due' && dueCount ? `<span class="nav-badge">${Math.min(99, dueCount)}</span>` : ''}
    </button>
  `).join('');

  const mobileItems = NAV_ITEMS.filter((item) => ['dashboard','learn','review','talk','tutor','progress'].includes(item.id));
  mobile.innerHTML = mobileItems.map((item) => `
    <button class="nav-item ${currentView === item.id ? 'active' : ''}" type="button" data-action="go-view" data-view="${item.id}" aria-current="${currentView === item.id ? 'page' : 'false'}">
      ${icon(item.icon, 'nav-icon')}
      <span class="nav-label">${escapeHtml(item.shortLabel)}</span>
    </button>
  `).join('');
};

const updateShell = () => {
  const metrics = getMetrics(state);
  const [eyebrow, title] = PAGE_META[currentView] || PAGE_META.dashboard;
  document.getElementById('page-eyebrow').textContent = eyebrow;
  document.getElementById('page-title').textContent = title;
  document.getElementById('streak-count').textContent = state.stats.streak || 0;
  document.getElementById('profile-level').textContent = `${metrics.cefr} · ${metrics.masteredWords} words ready`;
  document.querySelector('.profile-avatar').textContent = (state.profile.name || 'K').trim().charAt(0).toUpperCase();
  document.querySelector('.profile-copy strong').textContent = state.profile.name || 'Kars';

  const goal = Math.max(5, state.profile.dailyGoal || 15);
  const today = Math.round(state.stats.minutesToday || 0);
  document.getElementById('sidebar-goal-label').textContent = `${today} / ${goal} min`;
  document.getElementById('sidebar-goal-bar').style.width = `${Math.min(100, today / goal * 100)}%`;
  document.getElementById('sidebar-nudge').textContent = today >= goal
    ? 'Daily goal reached. Everything else is a bonus.'
    : today === 0
      ? 'One useful sentence is enough to keep momentum.'
      : `${Math.max(1, goal - today)} focused minutes to your daily goal.`;

  renderNavigation();
  updateConnectionStatus();
};

const navigate = (view, { replace = false } = {}) => {
  const valid = PAGE_META[view] ? view : 'dashboard';
  currentView = valid;
  state.ui.lastView = valid;
  const hash = `#${valid}`;
  if (location.hash !== hash) {
    if (replace) history.replaceState(null, '', hash);
    else history.pushState(null, '', hash);
  }
  renderView();
  updateShell();
  save();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openModal = (content, { wide = false, label = 'Dialog' } = {}) => {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="modal-backdrop" role="presentation">
      <section class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}">
        ${content}
      </section>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  const focusTarget = modalRoot.querySelector('input, textarea, button, select');
  setTimeout(() => focusTarget?.focus(), 20);
};

const closeModal = () => {
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  modalRoot.innerHTML = '';
  document.body.style.overflow = '';
  activeGame = null;
  placementSession = null;
  activeListeningLab = null;
  activeSoundLab = null;
};

const closeMorphologyLens = () => {
  morphologyRoot.innerHTML = '';
  morphologyContext = null;
  document.body.classList.remove('morphology-open');
  if (!modalRoot.innerHTML) document.body.style.overflow = '';
};

const renderMorphologyOverlay = () => {
  if (!morphologyContext) return;
  const { sentence } = morphologyContext;
  const analyses = analyzePolishSentence(sentence);
  if (!analyses.length) {
    closeMorphologyLens();
    return;
  }
  const selectedIndex = Math.max(0, Math.min(analyses.length - 1, Number(morphologyContext.selectedIndex || 0)));
  morphologyContext.selectedIndex = selectedIndex;
  const selected = analyses[selectedIndex];
  const soundLesson = getSoundLessonForWord(selected.token);
  const pronunciationNotes = selected.pronunciation?.notes || [];
  morphologyRoot.innerHTML = `
    <div class="modal-backdrop morphology-backdrop" role="presentation">
      <section class="modal morphology-modal" role="dialog" aria-modal="true" aria-label="Polish form lens">
        <header class="modal-header morphology-header">
          <div><p class="eyebrow">POLISH FORM LENS</p><h2>${escapeHtml(selected.token)}</h2><p>Tap another word to see what its ending is doing in this sentence.</p></div>
          <button class="modal-close" type="button" data-action="close-morphology" aria-label="Close form lens">${icon('close')}</button>
        </header>
        <div class="modal-body morphology-body">
          <div class="morph-sentence" lang="pl">
            ${analyses.map((analysis, index) => `<button class="morph-sentence-token ${index === selectedIndex ? 'active' : ''}" type="button" data-action="select-morphology-token" data-index="${index}">${escapeHtml(analysis.token)}</button>`).join(' ')}
          </div>

          <section class="morph-identity-card">
            <div class="morph-word-stack"><strong>${escapeHtml(selected.token)}</strong><span>lemma: ${escapeHtml(selected.lemma || selected.token)}</span></div>
            <div class="morph-tags">
              <span>${escapeHtml(selected.pos || 'word form')}</span>
              <span>${escapeHtml(selected.form || 'context form')}</span>
              <span class="confidence-${escapeHtml(selected.confidence || 'limited')}">${selected.source === 'curated' ? 'verified in Blisko' : 'context estimate'}</span>
            </div>
          </section>

          <section class="morph-grid">
            <article class="morph-card primary">
              <span class="morph-card-label">WHAT IT MEANS HERE</span>
              <h3>${escapeHtml(selected.meaningEn || 'Meaning depends on context')}</h3>
              ${state.settings.showDutch ? `<p lang="nl"><strong>NL</strong> ${escapeHtml(selected.meaningNl || '')}</p>` : ''}
            </article>
            <article class="morph-card">
              <span class="morph-card-label">WHY THIS FORM WORKS</span>
              <p>${escapeHtml(selected.whyEn || '')}</p>
              ${state.settings.showDutch ? `<p class="morph-secondary" lang="nl">${escapeHtml(selected.whyNl || '')}</p>` : ''}
            </article>
          </section>

          <section class="morph-pronunciation-card">
            <div>
              <span class="morph-card-label">LISTENING ANCHOR</span>
              <h3>${escapeHtml(selected.pronunciation?.approximate || selected.token)}</h3>
              <p>${escapeHtml(selected.pronunciation?.cautionEn || '')}</p>
              ${state.settings.showDutch ? `<small lang="nl">${escapeHtml(selected.pronunciation?.cautionNl || '')}</small>` : ''}
            </div>
            <div class="morph-audio-actions">
              <button class="secondary-button compact" type="button" data-action="morphology-listen-word">${icon('volume')} Word</button>
              <button class="secondary-button compact" type="button" data-action="morphology-listen-sentence">${icon('headphones')} Sentence</button>
            </div>
          </section>

          ${pronunciationNotes.length ? `<div class="morph-note-list">${pronunciationNotes.map((note) => `<div><span>${icon('volume')}</span><p>${escapeHtml(note.en)}${state.settings.showDutch ? `<small lang="nl">${escapeHtml(note.nl)}</small>` : ''}</p></div>`).join('')}</div>` : ''}

          ${selected.related?.length ? `<section class="morph-related"><span class="morph-card-label">RELATED FORMS</span><div>${selected.related.map((form) => `<button type="button" data-action="open-morphology" data-word="${escapeHtml(form)}" data-sentence="${escapeHtml(form)}">${escapeHtml(form)}</button>`).join('')}</div></section>` : ''}

          ${soundLesson ? `<section class="morph-sound-link"><span>${icon('headphones')}</span><div><strong>${escapeHtml(soundLesson.symbol)} · ${escapeHtml(soundLesson.title)}</strong><p>This word belongs to a focused Polish sound lesson.</p></div><button class="secondary-button compact" type="button" data-action="open-sound-lesson" data-lesson="${escapeHtml(soundLesson.id)}">Open sound lesson</button></section>` : ''}
        </div>
        <footer class="modal-footer morphology-footer">
          <button class="ghost-button" type="button" data-action="morphology-practice">Practise this form</button>
          <button class="primary-button" type="button" data-action="close-morphology">Done</button>
        </footer>
      </section>
    </div>
  `;
  hydrateStaticIcons(morphologyRoot);
  document.body.classList.add('morphology-open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => morphologyRoot.querySelector('.modal-close')?.focus(), 20);
};

const openMorphologyLens = (word = '', sentence = '') => {
  const safeSentence = String(sentence || word || '').trim();
  const analyses = analyzePolishSentence(safeSentence);
  if (!analyses.length) {
    showToast('No Polish form found', 'Open the lens from a Polish word or sentence.', 'info');
    return;
  }
  const normalizedWord = normalizeText(word, { loose: false });
  const selectedIndex = Math.max(0, analyses.findIndex((analysis) => normalizeText(analysis.token) === normalizedWord));
  morphologyContext = { sentence: safeSentence, selectedIndex };
  renderMorphologyOverlay();
};

const practiseMorphologyContext = () => {
  if (!morphologyContext) return;
  const analysis = analyzePolishSentence(morphologyContext.sentence)[morphologyContext.selectedIndex || 0];
  if (!analysis) return;
  const normalizedToken = normalizeText(analysis.token, { loose: true });
  const normalizedLemma = normalizeText(analysis.lemma, { loose: true });
  const word = WORDS.find((item) => [item.pl].some((value) => [normalizedToken, normalizedLemma].includes(normalizeText(value, { loose: true }))));
  const relatedPhrases = PHRASES.filter((phrase) => {
    const text = normalizeText(phrase.pl, { loose: true });
    return text.split(' ').includes(normalizedToken) || text.split(' ').includes(normalizedLemma);
  }).slice(0, 3);
  const itemIds = [word?.id, ...relatedPhrases.map((phrase) => phrase.id)].filter(Boolean);
  closeMorphologyLens();
  if (!itemIds.length) {
    showToast('Form saved as a listening insight', 'This inferred form is not yet a standalone curriculum item.', 'brain');
    return;
  }
  startSession({ mode: 'smart', itemIds: [...new Set(itemIds)], title: `${analysis.lemma || analysis.token} · form practice` });
};

const ensureListeningStats = () => {
  state.stats.listeningLab = {
    sessions: 0, attempts: 0, correct: 0, dictations: 0, dictationCorrect: 0,
    naturalSpeedAttempts: 0, naturalSpeedCorrect: 0, fastSpeedAttempts: 0, fastSpeedCorrect: 0,
    replays: 0, shadowing: 0, lastAt: null,
    ...(state.stats.listeningLab || {}),
  };
  return state.stats.listeningLab;
};

const ensureSoundProgress = (lessonId) => {
  state.progress.sounds = state.progress.sounds || {};
  state.progress.sounds[lessonId] = {
    attempts: 0,
    correct: 0,
    confidence: 0,
    lastAt: null,
    ...(state.progress.sounds[lessonId] || {}),
  };
  return state.progress.sounds[lessonId];
};

const ensureSoundStats = () => {
  state.stats.soundLab = {
    attempts: 0,
    correct: 0,
    completedLessons: [],
    lastAt: null,
    ...(state.stats.soundLab || {}),
  };
  state.stats.soundLab.completedLessons = Array.isArray(state.stats.soundLab.completedLessons)
    ? state.stats.soundLab.completedLessons
    : [];
  return state.stats.soundLab;
};

const listeningCandidateScore = (phrase) => {
  const progress = state.progress.items[phrase.id];
  const skill = progress?.skills?.listening;
  const confidence = Number(skill?.confidence || 0);
  const attempts = Number(skill?.attempts || 0);
  const dueBoost = progress?.dueAt && new Date(progress.dueAt).getTime() <= Date.now() ? 0.2 : 0;
  const unseenBoost = attempts === 0 ? 0.22 : 0;
  return (1 - confidence) * 1.4 + dueBoost + unseenBoost + Number(phrase.priority || 0) / 500;
};

const buildListeningLabItems = ({ length = 6, mode = 'adaptive' } = {}) => {
  const pool = PHRASES
    .filter((phrase) => phrase.pl.split(/\s+/).length >= 2 && phrase.pl.split(/\s+/).length <= 10)
    .sort((left, right) => listeningCandidateScore(right) - listeningCandidateScore(left));
  const selected = [];
  const seenTopics = new Set();
  for (const phrase of pool) {
    if (selected.length >= length) break;
    if (seenTopics.has(phrase.topic) && pool.length - selected.length > length) continue;
    selected.push(phrase);
    seenTopics.add(phrase.topic);
  }
  for (const phrase of pool) {
    if (selected.length >= length) break;
    if (!selected.includes(phrase)) selected.push(phrase);
  }
  const patterns = mode === 'dictation'
    ? ['dictation', 'dictation', 'meaning', 'dictation', 'shadow', 'dictation']
    : ['meaning', 'dictation', 'meaning', 'shadow', 'dictation', 'meaning'];
  return selected.map((phrase, index) => {
    const type = patterns[index % patterns.length];
    const correctMeaning = primaryTranslation(phrase);
    const distractors = PHRASES
      .filter((candidate) => candidate.id !== phrase.id && candidate.topic !== phrase.topic)
      .map((candidate) => primaryTranslation(candidate))
      .filter((value, optionIndex, array) => value && value !== correctMeaning && array.indexOf(value) === optionIndex)
      .slice(index * 2, index * 2 + 4);
    return {
      id: `listen-${phrase.id}-${index}`,
      phrase,
      type,
      options: type === 'meaning' ? shuffle([correctMeaning, ...distractors.slice(0, 2)], `${phrase.id}-${index}`) : [],
      played: 0,
      speedPlays: { slow: 0, natural: 0, fast: 0 },
      lastSpeed: state.settings.listeningDefaultSpeed || 'natural',
      answered: false,
      result: null,
      revealed: false,
      typed: '',
    };
  });
};

const currentListeningItem = () => activeListeningLab?.items?.[activeListeningLab.index] || null;

const openListeningLab = (mode = 'adaptive') => {
  activeListeningLab = {
    mode,
    items: buildListeningLabItems({ mode }),
    index: 0,
    correct: 0,
    close: 0,
    startedAt: Date.now(),
    summarySaved: false,
  };
  renderListeningLabModal();
};

const closeListeningLab = () => {
  window.speechSynthesis?.cancel?.();
  activeListeningLab = null;
  closeModal();
};

const renderListeningResult = (item) => {
  const result = item.result || {};
  const feedbackClass = result.correct ? 'correct' : result.close ? 'close' : 'wrong';
  const morphology = Array.isArray(result.morphology) ? result.morphology : [];
  return `
    <section class="listening-result ${feedbackClass}">
      <div class="listening-result-head"><span>${icon(result.correct ? 'check' : result.close ? 'brain' : 'repeat')}</span><div><strong>${escapeHtml(result.verdict || (result.correct ? 'Message caught' : result.close ? 'Nearly there' : 'Listen once more next time'))}</strong><p>${escapeHtml(result.message || '')}</p></div></div>
      <div class="listening-transcript" lang="pl"><span>TRANSCRIPT</span><p>${polishInteractive(item.phrase.pl)}</p></div>
      <div class="listening-translation"><span><strong>EN</strong> ${escapeHtml(item.phrase.en)}</span>${state.settings.showDutch ? `<span lang="nl"><strong>NL</strong> ${escapeHtml(item.phrase.nl)}</span>` : ''}</div>
      ${morphology.length ? `<div class="listening-form-repairs">${morphology.map((detail) => `<button type="button" data-action="open-morphology" data-word="${escapeHtml(detail.expected || detail.learner || '')}" data-sentence="${escapeHtml(item.phrase.pl)}"><strong>${escapeHtml(detail.title || 'Form detail')}</strong><span>${escapeHtml(detail.en || '')}</span></button>`).join('')}</div>` : ''}
      <div class="listening-result-actions">
        <button class="secondary-button compact" type="button" data-action="listening-play" data-speed="natural">${icon('volume')} Hear again</button>
        <button class="primary-button" type="button" data-action="listening-next">${activeListeningLab.index + 1 >= activeListeningLab.items.length ? 'See summary' : 'Next sound'} ${icon('arrow')}</button>
      </div>
    </section>
  `;
};

const renderListeningLabSummary = () => {
  const stats = ensureListeningStats();
  const attempts = activeListeningLab.items.length;
  const independent = activeListeningLab.items.filter((item) => item.result?.correct && item.played <= 2 && !item.revealed).length;
  const natural = activeListeningLab.items.filter((item) => item.speedPlays.natural > 0).length;
  return `
    <div class="listening-summary">
      <span class="summary-orbit">${icon('headphones')}</span>
      <p class="eyebrow">LISTENING SESSION COMPLETE</p>
      <h2>You caught ${activeListeningLab.correct} of ${attempts} messages.</h2>
      <p>Blisko recorded speed, replays, dictation detail, and whether the transcript was needed. Those signals now shape future listening reviews.</p>
      <div class="listening-summary-grid">
        <div><strong>${activeListeningLab.correct}</strong><span>clear catches</span></div>
        <div><strong>${independent}</strong><span>independent</span></div>
        <div><strong>${natural}</strong><span>heard naturally</span></div>
        <div><strong>${stats.replays}</strong><span>lifetime replays</span></div>
      </div>
      <div class="button-row listening-summary-actions">
        <button class="secondary-button" type="button" data-action="open-sound-lab">${icon('volume')} Train sound contrasts</button>
        <button class="primary-button" type="button" data-action="close-listening-lab">Return to Learn ${icon('arrow')}</button>
      </div>
    </div>
  `;
};

const renderListeningLabModal = () => {
  if (!activeListeningLab) return;
  const complete = activeListeningLab.index >= activeListeningLab.items.length;
  const item = currentListeningItem();
  modalRoot.innerHTML = `
    <div class="session-modal listening-lab-modal" role="dialog" aria-modal="true" aria-label="Listening lab">
      <header class="session-topbar listening-topbar">
        <button class="icon-button" type="button" data-action="close-listening-lab" aria-label="Close listening lab">${icon('close')}</button>
        <div class="session-progress-wrap">
          <div class="progress-track"><span style="width:${complete ? 100 : Math.round(activeListeningLab.index / activeListeningLab.items.length * 100)}%"></span></div>
          <span>${complete ? activeListeningLab.items.length : activeListeningLab.index + 1} / ${activeListeningLab.items.length}</span>
        </div>
        <span class="session-score">${icon('headphones')} ${activeListeningLab.correct}</span>
      </header>
      <main class="session-stage listening-stage">
        ${complete ? renderListeningLabSummary() : `
          <article class="card listening-exercise-card">
            <div class="listening-kicker"><span>${item.type === 'dictation' ? 'WRITE WHAT YOU HEAR' : item.type === 'shadow' ? 'SHADOW THE RHYTHM' : 'CATCH THE MEANING'}</span><span>${escapeHtml(item.phrase.topic)}</span></div>
            <h2>${item.played ? 'Listen again only if you need it.' : 'The sentence stays hidden until you answer.'}</h2>
            <p>${item.type === 'dictation' ? 'Type the Polish sounds you can recover. Missing diacritics are accepted and explained.' : item.type === 'shadow' ? 'Hear the full line, reveal it only when needed, then say it in one breath.' : 'Choose the intention. Do not chase every individual sound.'}</p>

            <div class="listening-orb-wrap">
              <button class="listening-orb ${item.played ? 'played' : ''}" type="button" data-action="listening-play" data-speed="${escapeHtml(item.lastSpeed)}" aria-label="Play Polish sentence">${icon('volume')}<span>${item.played ? `${item.played} play${item.played === 1 ? '' : 's'}` : 'Play'}</span></button>
            </div>

            <div class="speed-ladder" aria-label="Listening speed">
              ${[
                ['slow', 'Slow', 'clarity'],
                ['natural', 'Natural', 'family pace'],
                ['fast', 'Stretch', 'real-life pressure'],
              ].map(([speed, label, detail]) => `<button class="${item.lastSpeed === speed ? 'active' : ''}" type="button" data-action="listening-play" data-speed="${speed}"><strong>${label}</strong><span>${detail}</span><small>${item.speedPlays[speed] || 0}×</small></button>`).join('')}
            </div>

            ${item.type === 'meaning' ? `
              <div class="listening-answer-options">
                ${item.options.map((option, index) => `<button type="button" data-action="listening-choice" data-option="${escapeHtml(option)}" ${!item.played || item.answered ? 'disabled' : ''}><span>${String.fromCharCode(65 + index)}</span><strong>${escapeHtml(option)}</strong></button>`).join('')}
              </div>
            ` : item.type === 'dictation' ? `
              <form class="answer-input-wrap listening-dictation-form" data-action="listening-dictation-form">
                <input id="listening-answer" class="answer-input" name="answer" type="text" value="${escapeHtml(item.typed || '')}" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type what you hear…" ${!item.played || item.answered ? 'disabled' : ''}>
                <button class="primary-button" type="submit" ${!item.played || item.answered ? 'disabled' : ''}>Check</button>
              </form>
            ` : `
              <div class="shadow-panel">
                ${item.revealed ? `<div class="shadow-model" lang="pl">${polishInteractive(item.phrase.pl)}</div>` : `<button class="secondary-button" type="button" data-action="listening-reveal" ${!item.played ? 'disabled' : ''}>Reveal line for shadowing</button>`}
                ${item.revealed ? `<p>Say it once with the model, then once without looking. Rate the rhythm honestly.</p><div class="shadow-ratings"><button type="button" data-action="listening-shadow-rate" data-rating="0">Not yet</button><button type="button" data-action="listening-shadow-rate" data-rating="1">Needed the line</button><button type="button" data-action="listening-shadow-rate" data-rating="2">One breath</button></div>` : '<p>The reveal is recorded as support, not failure.</p>'}
              </div>
            `}

            ${item.answered ? renderListeningResult(item) : `<div class="listening-footnote">${icon('info')} <span>Playback uses the best Polish voice installed in your browser. You can choose another voice in Settings.</span></div>`}
          </article>
        `}
      </main>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  hydrateStaticIcons(modalRoot);
  requestAnimationFrame(() => document.getElementById('listening-answer')?.focus({ preventScroll: true }));
};

const playListeningItem = (speed = 'natural') => {
  const item = currentListeningItem();
  if (!item || item.answered && !activeListeningLab) return;
  item.played += 1;
  item.lastSpeed = ['slow', 'natural', 'fast'].includes(speed) ? speed : 'natural';
  item.speedPlays[item.lastSpeed] = Number(item.speedPlays[item.lastSpeed] || 0) + 1;
  const stats = ensureListeningStats();
  if (item.played > 1) stats.replays += 1;
  speak(item.phrase.pl, { speed: item.lastSpeed });
  renderListeningLabModal();
};

const recordListeningItemResult = (item, result, { skillKey = 'listening', rating = null } = {}) => {
  if (!item || item.answered) return;
  item.answered = true;
  item.result = result;
  const stats = ensureListeningStats();
  stats.attempts += 1;
  stats.correct += result.correct ? 1 : 0;
  stats.lastAt = new Date().toISOString();
  if (item.type === 'dictation') {
    stats.dictations += 1;
    stats.dictationCorrect += result.correct ? 1 : 0;
  }
  if (item.lastSpeed === 'natural') {
    stats.naturalSpeedAttempts += 1;
    stats.naturalSpeedCorrect += result.correct ? 1 : 0;
  }
  if (item.lastSpeed === 'fast') {
    stats.fastSpeedAttempts += 1;
    stats.fastSpeedCorrect += result.correct ? 1 : 0;
  }
  if (skillKey === 'pronunciation') stats.shadowing += 1;

  const effectiveRating = rating ?? (result.correct ? 2 : result.close ? 1 : 0);
  reviewItem(state, item.phrase.id, effectiveRating, {
    type: skillKey === 'pronunciation' ? 'speaking' : 'listening',
    skillKey,
    correct: result.correct,
    score: result.score ?? (result.correct ? 0.86 : result.close ? 0.58 : 0.18),
    source: item.type === 'dictation' ? 'listening dictation' : item.type === 'shadow' ? 'listening shadowing' : 'listening meaning',
    errorType: result.errorType || null,
  });
  activeListeningLab.correct += result.correct ? 1 : 0;
  activeListeningLab.close += result.close ? 1 : 0;
  addActivity(state, { minutes: 0.6, speaking: skillKey === 'pronunciation' ? 1 : 0 });
  save();
  renderListeningLabModal();
};

const answerListeningChoice = (option) => {
  const item = currentListeningItem();
  if (!item || item.answered || !item.played) return;
  const expected = primaryTranslation(item.phrase);
  const result = evaluateAnswer(option, expected, { language: primaryLanguage() });
  recordListeningItemResult(item, {
    ...result,
    verdict: result.correct ? 'Meaning caught' : 'The sound pointed somewhere else',
    message: result.correct ? 'You recovered the intention without seeing the Polish text.' : `The message meant “${expected}”. Listen once more while reading the transcript.`,
  });
};

const submitListeningDictation = (form) => {
  const item = currentListeningItem();
  if (!item || item.answered || !item.played) return;
  const value = String(new FormData(form).get('answer') || '').trim();
  if (!value) return;
  item.typed = value;
  const result = evaluateAnswer(value, item.phrase.pl, {
    language: 'pl',
    acceptedAnswers: item.phrase.acceptedAnswers || [],
    grammar: item.phrase.grammar || [],
    source: item.phrase,
  });
  recordListeningItemResult(item, result);
};

const revealListeningShadow = () => {
  const item = currentListeningItem();
  if (!item || item.answered || !item.played) return;
  item.revealed = true;
  renderListeningLabModal();
};

const rateListeningShadow = (rating) => {
  const item = currentListeningItem();
  if (!item || item.answered || !item.revealed) return;
  const safe = Math.max(0, Math.min(2, Number(rating) || 0));
  const score = safe === 2 ? 0.86 : safe === 1 ? 0.58 : 0.24;
  recordListeningItemResult(item, {
    correct: safe >= 1,
    close: safe === 1,
    score,
    errorType: safe === 2 ? 'shadow_independent' : safe === 1 ? 'shadow_supported' : 'shadow_retry',
    verdict: safe === 2 ? 'Rhythm held together' : safe === 1 ? 'Supported shadow completed' : 'Keep the phrase shorter for now',
    message: safe === 2
      ? 'You produced the line in one breath after listening.'
      : safe === 1
        ? 'The visible line helped. Blisko will keep pronunciation practice supported for now.'
        : 'This sound block will return in a shorter, slower form.',
    expected: item.phrase.pl,
  }, { skillKey: 'pronunciation', rating: safe === 2 ? 2 : safe === 1 ? 1 : 0 });
};

const advanceListeningLab = () => {
  if (!activeListeningLab) return;
  const item = currentListeningItem();
  if (item && !item.answered) return;
  activeListeningLab.index += 1;
  if (activeListeningLab.index >= activeListeningLab.items.length && !activeListeningLab.summarySaved) {
    const stats = ensureListeningStats();
    stats.sessions += 1;
    stats.lastAt = new Date().toISOString();
    activeListeningLab.summarySaved = true;
    addActivity(state, { minutes: Math.max(3, Math.round((Date.now() - activeListeningLab.startedAt) / 60_000)) });
    save({ immediate: true });
  }
  renderListeningLabModal();
};

const renderSoundLabGallery = () => `
  <header class="modal-header">
    <div><p class="eyebrow">POLISH SOUND LAB</p><h2>Train contrasts Dutch ears tend to merge.</h2><p>Each lesson combines a listening anchor, bilingual explanation, examples, and a two-question sound check.</p></div>
    <button class="modal-close" type="button" data-action="close-sound-lab" aria-label="Close sound lab">${icon('close')}</button>
  </header>
  <div class="modal-body sound-gallery-body">
    <section class="sound-overview-card">
      <div><strong>${ensureSoundStats().completedLessons.length} / ${SOUND_LESSONS.length}</strong><span>sound families checked</span></div>
      <p>These scores stay separate from vocabulary. Recognizing a sentence does not automatically mean its sounds are stable.</p>
    </section>
    <div class="sound-lesson-grid">
      ${SOUND_LESSONS.map((lesson) => {
        const progress = ensureSoundProgress(lesson.id);
        return `<button class="sound-lesson-card" type="button" data-action="open-sound-lesson" data-lesson="${escapeHtml(lesson.id)}"><span class="sound-symbol">${escapeHtml(lesson.symbol)}</span><strong>${escapeHtml(lesson.title)}</strong><p>${escapeHtml(lesson.en)}</p><div class="sound-progress"><span class="progress-track"><span style="width:${Math.round(progress.confidence * 100)}%"></span></span><b>${Math.round(progress.confidence * 100)}%</b></div></button>`;
      }).join('')}
    </div>
  </div>
  <footer class="modal-footer"><button class="primary-button" type="button" data-action="close-sound-lab">Done</button></footer>
`;

const renderSoundLesson = () => {
  const lesson = getSoundLesson(activeSoundLab.lessonId);
  const quiz = lesson.quiz[activeSoundLab.quizIndex] || lesson.quiz[0];
  const progress = ensureSoundProgress(lesson.id);
  return `
    <header class="modal-header sound-lesson-header">
      <button class="icon-button" type="button" data-action="sound-back" aria-label="Back to sound lessons">${icon('arrow')}</button>
      <div><p class="eyebrow">${escapeHtml(lesson.symbol)} · SOUND ${activeSoundLab.quizIndex + 1} OF ${lesson.quiz.length}</p><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.en)}</p>${state.settings.showDutch ? `<small lang="nl">${escapeHtml(lesson.nl)}</small>` : ''}</div>
      <button class="modal-close" type="button" data-action="close-sound-lab" aria-label="Close sound lab">${icon('close')}</button>
    </header>
    <div class="modal-body sound-lesson-body">
      <section class="sound-comparison-card"><span>${icon('alert')}</span><div><strong>Dutch-ear warning</strong><p>${escapeHtml(lesson.dutchTrap)}</p></div></section>
      <section class="sound-examples">
        ${lesson.examples.map((example) => `<button type="button" data-action="sound-example" data-text="${escapeHtml(example.word)}"><span class="sound-example-word">${escapeHtml(example.word)}</span><span>${escapeHtml(example.en)}${state.settings.showDutch ? ` · ${escapeHtml(example.nl)}` : ''}</span><small>${escapeHtml(example.cue)}</small>${icon('volume')}</button>`).join('')}
      </section>
      <section class="sound-quiz-card ${activeSoundLab.result ? (activeSoundLab.result.correct ? 'correct' : 'wrong') : ''}">
        <div class="sound-quiz-head"><div><span>QUICK SOUND CHECK</span><h3>Which spelling did you hear?</h3></div><button class="listening-orb small" type="button" data-action="sound-quiz-play">${icon('volume')}<span>${activeSoundLab.plays ? `${activeSoundLab.plays}×` : 'Play'}</span></button></div>
        <div class="sound-quiz-options">
          ${quiz.options.map((option) => {
            const selected = activeSoundLab.selected === option;
            const isCorrect = option === quiz.answer;
            const className = activeSoundLab.result ? isCorrect ? 'correct' : selected ? 'wrong' : '' : '';
            return `<button class="${className}" type="button" data-action="sound-quiz-answer" data-option="${escapeHtml(option)}" ${!activeSoundLab.plays || activeSoundLab.result ? 'disabled' : ''}><strong>${escapeHtml(option)}</strong></button>`;
          }).join('')}
        </div>
        ${activeSoundLab.result ? `<div class="sound-quiz-feedback"><strong>${activeSoundLab.result.correct ? 'Contrast caught' : `The model said ${escapeHtml(quiz.answer)}`}</strong><p>${activeSoundLab.result.correct ? 'This sound distinction has stronger evidence now.' : 'Replay the model and compare the sound block rather than every letter.'}</p><button class="primary-button" type="button" data-action="sound-next">${activeSoundLab.quizIndex + 1 >= lesson.quiz.length ? 'Finish lesson' : 'Next check'} ${icon('arrow')}</button></div>` : '<p class="sound-quiz-note">Play the audio before choosing. The written examples above remain visible because this lesson trains sound-to-spelling mapping.</p>'}
      </section>
      <div class="sound-mastery-strip"><span>Current evidence</span><div class="progress-track"><span style="width:${Math.round(progress.confidence * 100)}%"></span></div><b>${Math.round(progress.confidence * 100)}%</b></div>
    </div>
  `;
};

const renderSoundLabModal = () => {
  if (!activeSoundLab) return;
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal wide sound-lab-modal" role="dialog" aria-modal="true" aria-label="Polish sound lab">${activeSoundLab.lessonId ? renderSoundLesson() : renderSoundLabGallery()}</section></div>`;
  document.body.style.overflow = 'hidden';
  hydrateStaticIcons(modalRoot);
};

const openSoundLab = (lessonId = null) => {
  closeMorphologyLens();
  activeListeningLab = null;
  activeSoundLab = { lessonId, quizIndex: 0, selected: null, result: null, plays: 0 };
  renderSoundLabModal();
};

const closeSoundLab = () => {
  window.speechSynthesis?.cancel?.();
  activeSoundLab = null;
  closeModal();
};

const playSoundQuiz = () => {
  if (!activeSoundLab?.lessonId) return;
  const lesson = getSoundLesson(activeSoundLab.lessonId);
  const quiz = lesson.quiz[activeSoundLab.quizIndex];
  if (!quiz) return;
  activeSoundLab.plays += 1;
  speak(quiz.audio, { speed: 'natural' });
  renderSoundLabModal();
};

const answerSoundQuiz = (option) => {
  if (!activeSoundLab?.lessonId || activeSoundLab.result || !activeSoundLab.plays) return;
  const lesson = getSoundLesson(activeSoundLab.lessonId);
  const quiz = lesson.quiz[activeSoundLab.quizIndex];
  const correct = option === quiz.answer;
  activeSoundLab.selected = option;
  activeSoundLab.result = { correct };
  const progress = ensureSoundProgress(lesson.id);
  const stats = ensureSoundStats();
  progress.attempts += 1;
  progress.correct += correct ? 1 : 0;
  progress.confidence = clamp(progress.confidence * 0.72 + (correct ? 0.92 : 0.18) * 0.28);
  progress.lastAt = new Date().toISOString();
  stats.attempts += 1;
  stats.correct += correct ? 1 : 0;
  stats.lastAt = progress.lastAt;
  recordSkillEvidence(state, 'pronunciation', correct ? 0.84 : 0.24, { correct, source: `sound lesson ${lesson.id}` });
  addActivity(state, { minutes: 0.4 });
  save();
  renderSoundLabModal();
};

const advanceSoundQuiz = () => {
  if (!activeSoundLab?.lessonId || !activeSoundLab.result) return;
  const lesson = getSoundLesson(activeSoundLab.lessonId);
  if (activeSoundLab.quizIndex + 1 >= lesson.quiz.length) {
    const stats = ensureSoundStats();
    if (!stats.completedLessons.includes(lesson.id)) stats.completedLessons.push(lesson.id);
    save();
    activeSoundLab = { lessonId: null, quizIndex: 0, selected: null, result: null, plays: 0 };
  } else {
    activeSoundLab.quizIndex += 1;
    activeSoundLab.selected = null;
    activeSoundLab.result = null;
    activeSoundLab.plays = 0;
  }
  renderSoundLabModal();
};

const renderView = () => {
  const renderers = {
    dashboard: renderDashboard,
    learn: renderLearn,
    review: renderReview,
    talk: renderTalk,
    tutor: renderTutor,
    games: renderGames,
    progress: renderProgress,
    library: renderLibrary,
  };
  mainContent.innerHTML = (renderers[currentView] || renderDashboard)();
  mainContent.focus({ preventScroll: true });
  hydrateStaticIcons(mainContent);
  if (currentView === 'talk') scrollChatToBottom();
  if (currentView === 'tutor') scrollTutorToBottom();
};

function renderDashboard() {
  const metrics = getMetrics(state);
  const dueCount = getDueItems(state).length;
  const recommended = getRecommendedTopic(state);
  const insights = getCoachInsights(state);
  const readiness = metrics.conversationReadiness;
  const goal = Math.max(5, state.profile.dailyGoal || 15);
  const remaining = Math.max(0, goal - Math.round(state.stats.minutesToday || 0));
  const pattern = PATTERNS[0];
  const selections = patternSelections[pattern.id] || pattern.default;
  const sentence = getPatternSentence(pattern, selections);
  const translationNl = getPatternTranslation(pattern, selections, 'nl');
  const translationEn = getPatternTranslation(pattern, selections, 'en');
  const nextScenario = REAL_LIFE_SCENARIOS
    .map((scenario) => ({ scenario, score: getScenarioReadiness(state, scenario) }))
    .sort((a, b) => b.score - a.score)[0];
  const placement = state.onboarding?.placement || {};
  const placementLevel = placement.estimatedLevel === 'Pre-A1' ? 'A0' : placement.estimatedLevel;
  const placementCompleted = Boolean(placement.completedAt);
  const placementMode = placementCompleted ? 'recalibration' : 'placement';

  return `
    <div class="view section-stack">
      <section class="hero-grid">
        <article class="card hero-card">
          <div class="hero-copy">
            <span class="hero-kicker">Built for your family conversations</span>
            <h2>Cześć, ${escapeHtml(state.profile.name)}. Learn what you will <em>actually say.</em></h2>
            <p>Your coach is prioritizing ${escapeHtml(recommended.title.toLowerCase())}, conversation rescue phrases, and the patterns most likely to unlock your next real exchange.</p>
            <div class="hero-actions">
              <button class="primary-button lime" type="button" data-action="start-session" data-mode="smart">
                ${icon('play')} Start smart session · ${remaining || 5} min
              </button>
              <button class="secondary-button" type="button" data-action="go-view" data-view="talk">
                ${icon('message')} Talk to family
              </button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="readiness-orbit" style="--readiness:${Math.max(4, Math.round(readiness * 100))}%">
              <div class="orbit-content">
                <strong>${Math.round(readiness * 100)}%</strong>
                <span>family conversation readiness</span>
              </div>
              <span class="orbit-person one">👩</span>
              <span class="orbit-person two">👵</span>
              <span class="orbit-person three">👨</span>
            </div>
          </div>
        </article>

        <article class="card today-card">
          <div class="card-kicker">
            <span>Today’s shortest path</span>
            <span class="soft-pill">Adaptive</span>
          </div>
          <h3>${dueCount ? 'Protect what you know' : 'Build your first speaking blocks'}</h3>
          <p>${dueCount ? `${dueCount} memories are due before the coach adds carefully chosen new material.` : 'A compact session mixing useful phrases, listening, and one sentence pattern.'}</p>
          <div class="path-list">
            <div class="path-step">
              <span class="path-step-icon">${icon('repeat')}</span>
              <span class="path-step-copy"><strong>${dueCount || 2} memory checks</strong><span>Only weak or valuable items</span></span>
              <span>2 min</span>
            </div>
            <div class="path-step">
              <span class="path-step-icon">${icon('sparkles')}</span>
              <span class="path-step-copy"><strong>${escapeHtml(recommended.title)}</strong><span>One reusable sentence pattern</span></span>
              <span>4 min</span>
            </div>
            <div class="path-step">
              <span class="path-step-icon">${icon('mic')}</span>
              <span class="path-step-copy"><strong>Say it before you see it</strong><span>Private, local recording</span></span>
              <span>2 min</span>
            </div>
          </div>
          <button class="primary-button" type="button" data-action="start-session" data-mode="smart">
            Begin today’s path ${icon('arrow')}
          </button>
        </article>
      </section>

      <section class="card calibration-banner ${metrics.recalibrationDue ? 'needs-check' : ''}">
        <span class="calibration-banner-icon">${icon('target')}</span>
        <div class="calibration-banner-copy">
          <span class="progress-overline">${placementCompleted ? 'PERSONAL LEVEL CALIBRATION' : 'START WITH WHAT YOU ALREADY KNOW'}</span>
          <h3>${placementCompleted ? `Current evidence: ${escapeHtml(placementLevel || metrics.cefr)} · ${Math.round(metrics.evidenceConfidence * 100)}% confidence` : 'Take a short level check before Blisko decides what is easy or hard.'}</h3>
          <p>${placementCompleted
            ? `${metrics.recalibrationDue ? 'Your last check is ready to be refreshed.' : `Last calibrated ${formatDateRelative(placement.completedAt)}.`} Daily practice still has more weight than the diagnostic.`
            : 'Eleven compact checks measure reading, listening, guided and free production, grammar, and pronunciation confidence.'}</p>
        </div>
        <button class="${placementCompleted && !metrics.recalibrationDue ? 'secondary-button' : 'primary-button'} calibration-banner-action" type="button" data-action="open-placement" data-mode="${placementMode}">
          ${placementCompleted ? (metrics.recalibrationDue ? 'Recalibrate level' : 'Check level again') : 'Start 4-minute check'} ${icon('arrow')}
        </button>
      </section>

      <section class="metric-grid">
        <button class="card metric-card" type="button" data-action="go-view" data-view="library">
          <div class="metric-head"><span class="metric-icon">${icon('book')}</span><span class="metric-trend">active recall</span></div>
          <strong class="metric-value">${formatNumber(metrics.masteredWords)}</strong>
          <p>words ready to use</p>
          <div class="progress-track"><span style="width:${Math.min(100, metrics.masteredWords)}%"></span></div>
        </button>
        <button class="card metric-card" type="button" data-action="go-view" data-view="progress">
          <div class="metric-head"><span class="metric-icon">${icon('brain')}</span><span class="metric-trend">patterns, not tables</span></div>
          <strong class="metric-value">${Math.round(metrics.grammarMastery * 100)}%</strong>
          <p>grammar pattern mastery</p>
          <div class="progress-track"><span style="width:${Math.round(metrics.grammarMastery * 100)}%"></span></div>
        </button>
        <button class="card metric-card" type="button" data-action="go-view" data-view="talk">
          <div class="metric-head"><span class="metric-icon">${icon('message')}</span><span class="metric-trend">real scenarios</span></div>
          <strong class="metric-value">${metrics.unlockedConversations}</strong>
          <p>conversations you can handle</p>
          <div class="progress-track"><span style="width:${Math.min(100, metrics.unlockedConversations / REAL_LIFE_SCENARIOS.length * 100)}%"></span></div>
        </button>
        <button class="card metric-card" type="button" data-action="go-view" data-view="progress">
          <div class="metric-head"><span class="metric-icon">${icon('flag')}</span><span class="metric-trend">conservative estimate</span></div>
          <strong class="metric-value">${metrics.cefr}</strong>
          <p>estimated CEFR level</p>
          <div class="progress-track"><span style="width:${Math.round(metrics.cefrProgress * 100)}%"></span></div>
        </button>
      </section>

      <section class="two-column">
        <article class="card coach-card">
          <div class="coach-top">
            <span class="coach-avatar">B</span>
            <div class="coach-copy">
              <div class="coach-label">What your coach noticed</div>
              <h3>${state.stats.reviews ? 'Your next session has already changed.' : 'Your curriculum starts with leverage, not alphabet drills.'}</h3>
              <p>Blisko weighs memory strength, conversation value, grammar friction, and your interests every time it chooses the next exercise.</p>
              <button class="text-button" type="button" data-action="go-view" data-view="tutor">Ask why something works ${icon('arrow')}</button>
            </div>
          </div>
          <div class="insight-list">
            ${insights.map((insight, index) => `
              <div class="insight-row">
                <span class="insight-bullet">${index + 1}</span>
                <p>${escapeHtml(insight.title)}<span>${escapeHtml(insight.detail)}</span></p>
              </div>
            `).join('')}
          </div>
        </article>

        <article class="card pattern-card" id="dashboard-pattern-card">
          <div class="pattern-header">
            <span class="pattern-label">Sentence pattern of the day</span>
            <button class="speaker-button" type="button" data-action="speak" data-text="${escapeHtml(sentence)}" aria-label="Listen to ${escapeHtml(sentence)}">${icon('volume')}</button>
          </div>
          <div class="pattern-sentence" lang="pl">${polishInteractive(sentence)}</div>
          <div class="pattern-translation">NL ${escapeHtml(translationNl)} · EN ${escapeHtml(translationEn)}</div>
          <div class="slot-row">
            ${pattern.slots.destination.map((option) => `
              <button class="slot-button ${selections.destination === option.value ? 'active' : ''}" type="button" data-action="pattern-slot" data-pattern="${pattern.id}" data-slot="destination" data-value="${escapeHtml(option.value)}">${escapeHtml(option.source || option.value)}</button>
            `).join('')}
          </div>
          <div class="pattern-note">${icon('lightbulb')} <span>${escapeHtml(pattern.noteNl)} ${escapeHtml(pattern.noteEn)}</span></div>
        </article>
      </section>

      <section>
        <div class="section-heading">
          <div><h2>Your conversation map</h2><p>Readiness is tracked by person and situation, not by meaningless XP.</p></div>
          <button class="text-button" type="button" data-action="go-view" data-view="progress">Full progress ${icon('arrow')}</button>
        </div>
        <div class="family-strip">
          ${PERSONAS.map((persona) => {
            const score = getPersonaReadiness(state, persona);
            return `
              <button class="person-card" type="button" data-action="open-persona" data-persona="${persona.id}">
                <span class="person-avatar">${persona.emoji}<span class="person-level-dot" style="opacity:${Math.max(.25, score)}"></span></span>
                <span class="person-copy">
                  <strong>${escapeHtml(persona.name)}</strong>
                  <span>${escapeHtml(persona.scenario)}</span>
                  <span class="person-progress"><span class="progress-track"><span style="width:${Math.round(score * 100)}%"></span></span><b>${Math.round(score * 100)}%</b></span>
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <section class="page-intro card">
        <div>
          <p class="eyebrow">A MOTIVATING NUMBER THAT MATTERS</p>
          <h2>${metrics.estimatedWeeks ? `About ${metrics.estimatedWeeks} weeks until comfortable family small talk.` : 'You have reached the comfortable small-talk target.'}</h2>
          <p>This estimate updates from speaking attempts, memory stability, and scenario readiness. At ${goal} focused minutes per day, your next closest scenario is “${escapeHtml(nextScenario.scenario.title)}”.</p>
        </div>
        <div class="intro-stat"><strong>${Math.round(nextScenario.score * 100)}%</strong><span>closest scenario readiness</span></div>
      </section>
    </div>
  `;
}

function renderLearn() {
  const metrics = getMetrics(state);
  const recommended = getRecommendedTopic(state);
  const pattern = PATTERNS.find((entry) => entry.id === selectedPatternId) || PATTERNS[0];
  const selections = patternSelections[pattern.id] || pattern.default;
  const sentence = getPatternSentence(pattern, selections);
  const translationNl = getPatternTranslation(pattern, selections, 'nl');
  const translationEn = getPatternTranslation(pattern, selections, 'en');

  return `
    <div class="view section-stack">
      <section class="page-intro card">
        <div>
          <p class="eyebrow">MEANING BEFORE TERMINOLOGY</p>
          <h2>Build sentences you can use this week.</h2>
          <p>Every lesson starts from a real intention—arrive, ask, help, compliment, recover—then introduces only the grammar needed to say it naturally.</p>
        </div>
        <div class="intro-stat"><strong>${metrics.knownPhrases}</strong><span>speaking blocks retained</span></div>
      </section>

      <section>
        <div class="section-heading">
          <div><h2>Your next best moves</h2><p>The order changes as the coach learns where you hesitate.</p></div>
        </div>
        <div class="focus-grid">
          <button class="card focus-card" type="button" data-action="start-topic" data-topic="${recommended.id}" style="--focus:var(--green);--focus-soft:var(--green-soft)">
            <span class="focus-icon">${icon('sparkles')}</span>
            <h3>${escapeHtml(recommended.title)}</h3>
            <p>The highest-value topic for your current family-conversation map.</p>
            <span class="focus-footer"><span>Adaptive · 8 exercises</span><b>Start ${icon('arrow')}</b></span>
          </button>
          <button class="card focus-card" type="button" data-action="start-rescue-session" style="--focus:var(--coral);--focus-soft:var(--coral-soft)">
            <span class="focus-icon">${icon('help')}</span>
            <h3>Conversation rescue kit</h3>
            <p>Stay in Polish when the other person is too fast or a word disappears.</p>
            <span class="focus-footer"><span>5 survival phrases</span><b>Practise ${icon('arrow')}</b></span>
          </button>
          <button class="card focus-card" type="button" data-action="start-session" data-mode="speaking" style="--focus:var(--purple);--focus-soft:var(--purple-soft)">
            <span class="focus-icon">${icon('mic')}</span>
            <h3>One-breath speaking</h3>
            <p>Record short, useful phrases locally and compare rhythm rather than chasing a perfect accent.</p>
            <span class="focus-footer"><span>Private on this device</span><b>Speak ${icon('arrow')}</b></span>
          </button>
          <button class="card focus-card" type="button" data-action="open-listening-lab" style="--focus:var(--blue);--focus-soft:var(--blue-soft)">
            <span class="focus-icon">${icon('headphones')}</span>
            <h3>Listening speed ladder</h3>
            <p>Catch useful family phrases at slow, natural, and stretch speed without seeing the transcript first.</p>
            <span class="focus-footer"><span>Dictation · meaning · shadowing</span><b>Listen ${icon('arrow')}</b></span>
          </button>
        </div>
      </section>

      <section>
        <div class="section-heading">
          <div><h2>Real-life curriculum</h2><p>Choose a situation. The engine still adapts the exact exercises.</p></div>
          <button class="text-button" type="button" data-action="go-view" data-view="talk">Practise as a conversation ${icon('arrow')}</button>
        </div>
        <div class="topic-grid">
          ${TOPICS.map((topic) => {
            const readiness = getTopicReadiness(state, topic.id);
            return `
              <button class="topic-card" type="button" data-action="start-topic" data-topic="${topic.id}">
                <span class="topic-score">${Math.round(readiness * 100)}% ready</span>
                <span class="topic-emoji">${topic.emoji}</span>
                <strong>${escapeHtml(topic.title)}</strong>
                <p>${escapeHtml(topic.subtitle)}</p>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <section>
        <div class="section-heading">
          <div><h2>Sentence pattern lab</h2><p>Swap one part at a time and feel the structure before learning the label.</p></div>
          <div class="button-row">
            <button class="text-button" type="button" data-action="speak" data-text="${escapeHtml(sentence)}">Listen ${icon('volume')}</button>
            <button class="secondary-button compact" type="button" data-action="practice-pattern" data-pattern="${pattern.id}">${icon('lightbulb')} Practise with hints</button>
          </div>
        </div>
        <article class="card pattern-lab">
          <div class="pattern-list">
            ${PATTERNS.map((entry) => `
              <button class="${entry.id === pattern.id ? 'active' : ''}" type="button" data-action="select-pattern" data-pattern="${entry.id}">
                <strong>${escapeHtml(entry.title)}</strong>
                <span>${escapeHtml(entry.subtitle)}</span>
              </button>
            `).join('')}
          </div>
          <div class="pattern-stage">
            <span class="pattern-label">${escapeHtml(pattern.subtitle)}</span>
            <div class="big-pattern" lang="pl">${polishInteractive(sentence)}</div>
            <div class="big-translation">NL ${escapeHtml(translationNl)} · EN ${escapeHtml(translationEn)}</div>
            <div class="slot-builder">
              ${Object.entries(pattern.slots).map(([slot, options]) => options.map((option) => `
                <button class="slot-token ${selections[slot] === option.value ? 'variable' : ''}" type="button" data-action="pattern-slot" data-pattern="${pattern.id}" data-slot="${slot}" data-value="${escapeHtml(option.value)}">
                  ${escapeHtml(option.source || option.value)}
                </button>
              `).join('')).join('')}
            </div>
            <div class="explanation-pair">
              <div class="language-explanation"><span class="lang-tag">NEDERLANDS</span><p>${escapeHtml(pattern.noteNl)}</p></div>
              <div class="language-explanation"><span class="lang-tag">ENGLISH</span><p>${escapeHtml(pattern.noteEn)}</p></div>
            </div>
          </div>
        </article>
      </section>

      <section>
        <div class="section-heading">
          <div><h2>Polish sound and form intelligence</h2><p>Train what Dutch ears merge, then tap endings to see why Polish changes shape.</p></div>
        </div>
        <div class="intelligence-grid">
          <button class="card intelligence-card sound" type="button" data-action="open-sound-lab">
            <span class="intelligence-icon">${icon('volume')}</span>
            <div><span class="progress-overline">8 SOUND FAMILIES</span><h3>Hear the difference before you imitate it.</h3><p>ł versus l, hard and soft consonants, nasal vowels, y versus i, and difficult clusters.</p></div>
            <span class="intelligence-arrow">${icon('arrow')}</span>
          </button>
          <button class="card intelligence-card form" type="button" data-action="open-morphology" data-word="Polski" data-sentence="Jutro jadę do Polski.">
            <span class="intelligence-icon">${icon('brain')}</span>
            <div><span class="progress-overline">TAP-TO-EXPLAIN GRAMMAR</span><h3>Why “do Polski” and not “do Polska”?</h3><p>Open the new Form Lens for a word-by-word explanation with Dutch and English comparisons.</p></div>
            <span class="intelligence-arrow">${icon('arrow')}</span>
          </button>
        </div>
      </section>

      <section>
        <div class="section-heading">
          <div><h2>Scenario lessons</h2><p>A complete conversational intention in under ten focused minutes.</p></div>
        </div>
        <div class="family-strip">
          ${REAL_LIFE_SCENARIOS.map((scenario) => {
            const readiness = getScenarioReadiness(state, scenario);
            return `
              <button class="person-card" type="button" data-action="start-scenario" data-scenario="${scenario.id}">
                <span class="person-avatar">${scenario.emoji}</span>
                <span class="person-copy">
                  <strong>${escapeHtml(scenario.title)}</strong>
                  <span>${scenario.minutes} min · ${scenario.phrases.length} core phrases</span>
                  <span class="person-progress"><span class="progress-track"><span style="width:${Math.round(readiness * 100)}%"></span></span><b>${Math.round(readiness * 100)}%</b></span>
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderReview() {
  const due = getDueItems(state);
  const weak = getWeakItems(state, 4);
  const queue = getReviewQueue(state, 9);
  const metrics = getMetrics(state);
  const nextDue = queue.find((entry) => entry.progress && !entry.due);

  return `
    <div class="view section-stack">
      <section class="review-layout">
        <article class="card review-hero">
          <div>
            <p class="eyebrow">SPACED RETRIEVAL, NOT BUSYWORK</p>
            <h2>${due.length ? `${due.length} memories are ready.` : 'Your memory is clear for now.'}</h2>
            <p>${due.length ? 'The queue favours items you forget, but changes the sentence around them so you learn flexible use rather than card recognition.' : `The coach can introduce a few high-value phrases now. Your next scheduled review is ${nextDue ? formatDateRelative(nextDue.progress.dueAt) : 'after your first session'}.`}</p>
            <div class="button-row">
              <button class="primary-button" type="button" data-action="start-session" data-mode="review">${icon('repeat')} ${due.length ? 'Review now' : 'Start a memory session'}</button>
              <button class="secondary-button" type="button" data-action="open-listening-lab">${icon('headphones')} Listening review</button>
              <button class="secondary-button" type="button" data-action="start-session" data-mode="speaking">${icon('mic')} Speaking review</button>
            </div>
          </div>
          <div class="due-stack" aria-hidden="true">
            <div class="due-card"></div>
            <div class="due-card"></div>
            <div class="due-card"><span><strong>${due.length}</strong><span>due now</span></span></div>
          </div>
        </article>

        <article class="card weak-card">
          <h3>Memory leaks</h3>
          <p>Patterns the coach will deliberately vary and revisit.</p>
          ${weak.length ? `<div class="weak-list">
            ${weak.map(({ item, progress }) => `
              <div class="weak-row">
                <span class="weak-icon">${progress.lapses || '!'}</span>
                <span class="weak-copy"><strong>${escapeHtml(item.pl)}</strong><span>${escapeHtml(primaryTranslation(item))}</span></span>
                <span class="weak-score">${Math.round(progress.confidence * 100)}%</span>
              </div>
            `).join('')}
          </div>` : `
            <div class="empty-state" style="min-height:150px;padding:10px 0 0">
              <span class="empty-state-icon">${icon('brain')}</span>
              <h3>No confusion pattern yet</h3>
              <p>After a few reviews, repeated mistakes will appear here automatically.</p>
            </div>
          `}
        </article>
      </section>

      <section class="card queue-card">
        <div class="section-heading">
          <div><h2>Adaptive queue</h2><p>Ordered by due date, memory weakness, frequency, and conversation value.</p></div>
          <span class="soft-pill" style="padding:6px 9px;background:var(--green-soft);color:var(--green);font-size:9px">${Math.round(metrics.accuracy * 100)}% recent accuracy</span>
        </div>
        <div class="queue-list">
          ${queue.map(({ item, progress, due: isDue }) => `
            <div class="queue-row">
              <span class="queue-type">${icon(item.itemType === 'phrase' ? 'message' : item.type === 'verb' ? 'bolt' : 'book')}</span>
              <span class="queue-word"><strong>${escapeHtml(item.pl)}</strong><span>${escapeHtml(primaryTranslation(item))}</span></span>
              <span class="queue-strength">
                <span class="progress-track"><span style="width:${Math.round((progress?.confidence || 0) * 100)}%"></span></span>
                <span>${progress ? `${Math.round(progress.confidence * 100)}% stable` : 'new item'}</span>
              </span>
              <span class="queue-due">${progress ? (isDue ? 'Due now' : formatDateRelative(progress.dueAt)) : 'Next new'}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="page-intro card">
        <div>
          <p class="eyebrow">WHY THIS QUEUE IS DIFFERENT</p>
          <h2>A forgotten word returns inside a new intention.</h2>
          <p>If “kawę” slips, Blisko might first ask you to order coffee, later offer it to family, and finally contrast it with “kawy” after “chcesz”. The memory target stays; the conversation changes.</p>
        </div>
        <div class="intro-stat"><strong>${state.stats.reviews}</strong><span>review decisions recorded</span></div>
      </section>
    </div>
  `;
}

const personaDisplayName = (persona) => {
  if (persona.id === 'mother-in-law') return state.profile.familyNames.motherInLaw || persona.name;
  if (persona.id === 'father-in-law') return state.profile.familyNames.fatherInLaw || persona.name;
  if (persona.id === 'grandmother') return state.profile.familyNames.grandmother || persona.name;
  return persona.name;
};

const ensureConversationState = (personaId) => {
  const conversation = CONVERSATIONS[personaId];
  if (!conversation) return null;
  if (!state.conversation.transcripts[personaId]) {
    const firstTurn = conversation.turns[0];
    state.conversation.transcripts[personaId] = {
      turnIndex: 0,
      completed: false,
      hintsByTurn: {},
      messages: [{
        sender: 'role',
        text: firstTurn.role,
        nl: firstTurn.nl,
        en: firstTurn.en,
        turnIndex: 0,
        at: new Date().toISOString(),
      }],
    };
  }
  const transcript = state.conversation.transcripts[personaId];
  if (!transcript.hintsByTurn || typeof transcript.hintsByTurn !== 'object') transcript.hintsByTurn = {};
  if (!Array.isArray(transcript.messages)) transcript.messages = [];
  return transcript;
};

const ensureConversationHintState = (personaId = state.conversation.selectedPersona) => {
  const transcript = ensureConversationState(personaId);
  if (!transcript) return null;
  const key = String(transcript.turnIndex || 0);
  if (!transcript.hintsByTurn[key]) {
    transcript.hintsByTurn[key] = {
      level: 0,
      stack: [],
      partialIndex: 0,
      recallPhase: null,
      activeRecallCompleted: false,
    };
  }
  const hintState = transcript.hintsByTurn[key];
  if (!Array.isArray(hintState.stack)) hintState.stack = [];
  hintState.level = clamp(Number(hintState.level || 0), 0, 5);
  hintState.partialIndex = Number(hintState.partialIndex || 0);
  hintState.activeRecallCompleted = Boolean(hintState.activeRecallCompleted);
  return hintState;
};

const renderConversationHintPanel = (persona, transcript, turn) => {
  if (transcript.completed) return '';
  const hintState = ensureConversationHintState(persona.id);
  if (!hintState) return '';
  const hint = hintState.stack.at(-1);
  const primaryCopy = hint ? (state.settings.showEnglish ? hint.en : hint.nl) : '';
  const secondaryCopy = hint && state.settings.showEnglish && state.settings.showDutch ? hint.nl : '';
  const hidingModel = hintState.level === 5 && hintState.recallPhase === 'recall';
  const studyModel = hintState.level === 5 && hintState.recallPhase === 'study';
  return `
    <section class="conversation-support">
      ${hint ? `
        <div class="progressive-hint conversation-hint level-${hint.level}" aria-live="polite">
          <div class="hint-head">
            <span class="hint-icon">${icon(hint.level >= 4 ? 'brain' : 'lightbulb')}</span>
            <span><strong>Hint ${hint.level} of 5</strong><small>${escapeHtml(hint.title || '')}</small></span>
            ${renderHintMeter(hint.level)}
          </div>
          <p class="hint-primary">${escapeHtml(hidingModel ? 'The model reply is hidden. Answer the person in your own voice now.' : primaryCopy || '')}</p>
          ${!hidingModel && secondaryCopy ? `<p class="hint-secondary" lang="nl">${escapeHtml(secondaryCopy)}</p>` : ''}
          ${studyModel ? `
            <div class="conversation-model-recall">
              <strong>${escapeHtml(hint.answer || turn.suggestions?.[0]?.pl || '')}</strong>
              <p>Read it once. Then hide it and reply without copying.</p>
              <button class="primary-button" type="button" data-action="begin-conversation-recall">Hide model and answer ${icon('arrow')}</button>
            </div>
          ` : ''}
        </div>
      ` : ''}
      <button class="progressive-hint-button conversation-hint-button level-${hintState.level}" type="button" data-action="conversation-hint" ${hintState.level >= 5 ? 'disabled' : ''}>
        ${icon('lightbulb')}
        <span><strong>${hintState.level >= 5 ? 'Full support used' : HINT_STEP_LABELS[Math.min(hintState.level, HINT_STEP_LABELS.length - 1)]}</strong><small>${hintState.level} / 5 · support only when needed</small></span>
      </button>
    </section>
  `;
};

const renderConversationMessage = (message, persona) => {
  if (message.sender === 'correction') {
    return `
      <div class="correction-card ${message.hintLevel ? 'hinted' : ''}">
        <strong>${message.correction ? 'Tiny correction' : 'Coach note'}</strong>
        <p>${escapeHtml(message.feedback)}${message.suggestion ? ` <b>Try:</b> ${escapeHtml(message.suggestion)}` : ''}</p>
        ${message.hintLevel ? `<span class="correction-support-note">Hint level ${message.hintLevel}${message.activeRecallCompleted ? ' · model hidden before reply' : ''}</span>` : ''}
        ${message.almostKnown ? `<span class="almost-recorded">${icon('brain')} Marked as almost known</span>` : `<button class="almost-inline-button" type="button" data-action="conversation-almost" data-persona="${escapeHtml(message.personaId || persona.id)}" data-message="${escapeHtml(message.id || '')}">${icon('brain')} I almost knew this</button>`}
      </div>
    `;
  }
  if (message.sender === 'system') {
    return `<div class="scenario-banner">${escapeHtml(message.text)}</div>`;
  }
  const isUser = message.sender === 'user';
  const name = isUser ? state.profile.name : personaDisplayName(persona);
  return `
    <div class="chat-message ${isUser ? 'user' : 'role'}">
      <div class="message-meta"><span>${escapeHtml(name)}</span><span>·</span><span>${isUser ? 'your reply' : escapeHtml(persona.polishRole)}</span></div>
      <div class="message-bubble">
        <p class="message-polish" lang="pl">${polishInteractive(message.text)}</p>
        ${!isUser && state.conversation.level !== 'stretch' && (state.settings.showDutch || state.settings.showEnglish) ? `<p class="message-translation">${state.settings.showDutch ? `NL ${escapeHtml(message.nl || '')}` : ''}${state.settings.showDutch && state.settings.showEnglish ? ' · ' : ''}${state.settings.showEnglish ? `EN ${escapeHtml(message.en || '')}` : ''}</p>` : ''}
      </div>
      ${!isUser ? `<div class="message-actions"><button type="button" data-action="speak" data-text="${escapeHtml(message.text)}">${icon('volume')} Listen</button></div>` : ''}
    </div>
  `;
};

function renderTalk() {
  const persona = PERSONAS.find((entry) => entry.id === state.conversation.selectedPersona) || PERSONAS[0];
  const conversation = CONVERSATIONS[persona.id];
  const transcript = ensureConversationState(persona.id);
  const currentTurn = conversation.turns[Math.min(transcript.turnIndex, conversation.turns.length - 1)];
  const readiness = getPersonaReadiness(state, persona);

  return `
    <div class="view">
      <section class="card talk-shell">
        <aside class="talk-sidebar">
          <div class="talk-sidebar-head">
            <h2>Conversation simulator</h2>
            <p>Choose who you need to understand in real life.</p>
          </div>
          <div class="persona-list">
            ${PERSONAS.map((entry) => {
              const score = getPersonaReadiness(state, entry);
              return `
                <button class="persona-button ${entry.id === persona.id ? 'active' : ''}" type="button" data-action="select-persona" data-persona="${entry.id}">
                  <span class="persona-avatar">${entry.emoji}</span>
                  <span class="persona-copy"><strong>${escapeHtml(personaDisplayName(entry))}</strong><span>${escapeHtml(entry.scenario)}</span></span>
                  <span class="persona-readiness" style="--persona-score:${Math.round(score * 100)}%"></span>
                </button>
              `;
            }).join('')}
          </div>
        </aside>

        <div class="talk-main">
          <header class="talk-head">
            <div class="talk-person">
              <span class="persona-avatar">${persona.emoji}</span>
              <span class="talk-person-copy"><strong>${escapeHtml(personaDisplayName(persona))} · ${escapeHtml(persona.polishRole)}</strong><span>${escapeHtml(persona.scenario)} · ${Math.round(readiness * 100)}% ready</span></span>
            </div>
            <div class="talk-controls">
              <div class="difficulty-toggle" aria-label="Conversation support level">
                ${['guided','natural','stretch'].map((level) => `<button class="${state.conversation.level === level ? 'active' : ''}" type="button" data-action="set-talk-level" data-level="${level}">${level}</button>`).join('')}
              </div>
              <button class="square-button" type="button" data-action="talk-reset" title="Restart conversation">${icon('repeat')}</button>
            </div>
          </header>

          <div class="chat-area" id="conversation-chat">
            <div class="scenario-banner">${escapeHtml(conversation.scenarioTitle)} The coach adapts support to “${escapeHtml(state.conversation.level)}” mode.</div>
            ${transcript.messages.map((message) => renderConversationMessage(message, persona)).join('')}
            ${transcript.completed ? `
              <div class="session-summary" style="align-self:center;margin:10px auto">
                <div class="summary-icon">✓</div>
                <h2>Conversation survived.</h2>
                <p>You reached the end without leaving the Polish conversation. Replay it later with less support and different answers.</p>
                <button class="primary-button" type="button" data-action="talk-reset">Try a new version</button>
              </div>
            ` : ''}
          </div>

          <div>
            ${renderConversationHintPanel(persona, transcript, currentTurn)}
            <div class="talk-composer">
              ${(() => {
                const hintState = ensureConversationHintState(persona.id);
                const studyingModel = hintState?.level === 5 && hintState?.recallPhase === 'study';
                return `
                  <div class="composer-box ${studyingModel ? 'support-locked' : ''}">
                    <button class="mic-button" type="button" data-action="conversation-mic" aria-label="Dictate in Polish" ${transcript.completed || studyingModel ? 'disabled' : ''}>${icon('mic')}</button>
                    <textarea id="conversation-input" rows="1" placeholder="${studyingModel ? 'Hide the model reply before answering…' : 'Answer in Polish… one short phrase is enough'}" ${transcript.completed || studyingModel ? 'disabled' : ''}></textarea>
                    <button class="send-button" type="button" data-action="talk-send" aria-label="Send reply" ${transcript.completed || studyingModel ? 'disabled' : ''}>${icon('send')}</button>
                  </div>
                `;
              })()}
              <div class="composer-helper"><span>Enter to send · Shift+Enter for a new line</span><span>${state.conversation.level === 'guided' ? 'Progressive support available' : state.conversation.level === 'natural' ? 'Translations visible · hints optional' : 'Minimal support · hints optional'}</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

const scrollChatToBottom = () => {
  const chat = document.getElementById('conversation-chat');
  if (chat) requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; });
};

const tutorWelcome = () => ({
  mode: 'local',
  title: `Cześć, ${state.profile.name}. Ask me why, not just what.`,
  nl: 'Ik leg Pools uit vanuit het Nederlands en gebruik Engels wanneer dat duidelijker is. Plak een zin, vraag naar een uitgang, of laat me een fout vereenvoudigen.',
  en: 'I explain Polish through Dutch and use English when it makes the contrast clearer. Paste a sentence, ask about an ending, or ask me to simplify a mistake.',
  examples: [
    ['Jadę do Polski.', 'Ik ga naar Polen (met vervoer).', "I'm going to Poland by transport."],
  ],
  exercise: null,
});

const ensureTutorExerciseState = (key) => {
  if (!state.tutor.exerciseStates || typeof state.tutor.exerciseStates !== 'object') state.tutor.exerciseStates = {};
  if (!state.tutor.exerciseStates[key]) {
    state.tutor.exerciseStates[key] = {
      level: 0,
      stack: [],
      partialIndex: 0,
      answered: false,
      selected: '',
      result: null,
      recallPhase: null,
      recallValue: '',
      recallResult: null,
      activeRecallCompleted: false,
      almostKnown: false,
    };
  }
  const exerciseState = state.tutor.exerciseStates[key];
  if (!Array.isArray(exerciseState.stack)) exerciseState.stack = [];
  exerciseState.level = clamp(Number(exerciseState.level || 0), 0, 5);
  return exerciseState;
};

const renderTutorExerciseHint = (exercise, key, exerciseState) => {
  const hint = exerciseState.stack.at(-1);
  if (!hint) return '';
  const hideModel = exerciseState.level === 5 && exerciseState.recallPhase === 'recall';
  const primaryCopy = state.settings.showEnglish ? hint.en : hint.nl;
  const secondaryCopy = state.settings.showEnglish && state.settings.showDutch ? hint.nl : '';
  return `
    <div class="progressive-hint tutor-progressive-hint level-${hint.level}">
      <div class="hint-head">
        <span class="hint-icon">${icon(hint.level >= 4 ? 'brain' : 'lightbulb')}</span>
        <span><strong>Hint ${hint.level} of 5</strong><small>${escapeHtml(hint.title || '')}</small></span>
        ${renderHintMeter(hint.level)}
      </div>
      <p class="hint-primary">${escapeHtml(hideModel ? 'The answer is hidden. Retrieve it once before checking.' : primaryCopy || '')}</p>
      ${!hideModel && secondaryCopy ? `<p class="hint-secondary" lang="nl">${escapeHtml(secondaryCopy)}</p>` : ''}
    </div>
  `;
};

const renderTutorQuickCheck = (exercise, key) => {
  const exerciseState = ensureTutorExerciseState(key);
  const studyingModel = exerciseState.level === 5 && exerciseState.recallPhase === 'study';
  const recallingModel = exerciseState.level === 5 && exerciseState.recallPhase === 'recall';
  const result = exerciseState.result;
  return `
    <div class="feedback-box tutor-quick-check ${exerciseState.answered ? (result?.correct ? 'correct' : 'wrong') : ''}">
      <div class="tutor-check-head"><div><h4>Quick check</h4><p>${escapeHtml(exercise.prompt || '')}</p></div><span class="support-badge">adaptive support</span></div>
      ${renderTutorExerciseHint(exercise, key, exerciseState)}
      ${studyingModel ? `
        <div class="hint-recall-card study tutor-recall-card">
          <span class="hint-recall-label">STUDY BRIEFLY</span>
          <strong class="hint-answer-display">${escapeHtml(exercise.answer || '')}</strong>
          <p>The answer will disappear. Retrieve it rather than copying it.</p>
          <button class="primary-button" type="button" data-action="begin-tutor-recall" data-key="${escapeHtml(key)}">Hide it and recall ${icon('arrow')}</button>
        </div>
      ` : recallingModel && !exerciseState.answered ? `
        <form class="answer-input-wrap hint-recall-form tutor-hint-recall-form" data-action="tutor-hint-recall-form" data-key="${escapeHtml(key)}">
          <input class="answer-input ${exerciseState.recallResult && !exerciseState.recallResult.correct ? 'wrong' : ''}" name="answer" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escapeHtml(exerciseState.recallValue || '')}" placeholder="Type the answer from memory…">
          <button class="primary-button" type="submit">Recall</button>
        </form>
        ${exerciseState.recallResult && !exerciseState.recallResult.correct ? `<div class="hint-retry-note">${escapeHtml(exerciseState.recallResult.message || 'Not yet—try the pattern once more.')}</div>` : ''}
      ` : !exerciseState.answered ? `
        <div class="slot-row tutor-options" style="margin:10px 0 0">
          ${(exercise.options || []).map((option) => `<button class="slot-button" type="button" data-action="tutor-check" data-key="${escapeHtml(key)}" data-option="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}
        </div>
      ` : `
        <div class="tutor-check-result ${result?.correct ? 'correct' : 'wrong'}">
          <strong>${result?.correct ? 'Good retrieval' : result?.close ? 'Almost there' : 'Build it once more'}</strong>
          <p>${escapeHtml(result?.message || '')}</p>
          ${!result?.correct ? `<span>Answer: ${escapeHtml(exercise.answer || '')}</span>` : ''}
          ${exerciseState.level ? `<small>Hint level ${exerciseState.level}${exerciseState.activeRecallCompleted ? ' · active recall completed' : ''}</small>` : '<small>Independent answer</small>'}
        </div>
        ${exerciseState.almostKnown ? `<span class="almost-recorded">${icon('brain')} Marked as almost known</span>` : `<button class="almost-inline-button" type="button" data-action="tutor-almost" data-key="${escapeHtml(key)}">${icon('brain')} I almost knew this</button>`}
      `}
      ${!exerciseState.answered ? `
        <button class="progressive-hint-button tutor-hint-button level-${exerciseState.level}" type="button" data-action="tutor-hint" data-key="${escapeHtml(key)}" ${exerciseState.level >= 5 ? 'disabled' : ''}>
          ${icon('lightbulb')}<span><strong>${exerciseState.level >= 5 ? 'Full support used' : HINT_STEP_LABELS[Math.min(exerciseState.level, HINT_STEP_LABELS.length - 1)]}</strong><small>${exerciseState.level} / 5</small></span>
        </button>
      ` : ''}
    </div>
  `;
};

const renderTutorReply = (reply, key = 'welcome') => `
  <div class="tutor-bubble">
    <h4>${escapeHtml(reply.title || 'Tutor explanation')}</h4>
    ${state.settings.showEnglish && reply.en ? `<p class="tutor-language-primary"><strong>EN</strong> ${escapeHtml(reply.en)}</p>` : ''}
    ${state.settings.showDutch && reply.nl ? `<p class="tutor-language-secondary"><strong>NL</strong> ${escapeHtml(reply.nl)}</p>` : ''}
    ${(reply.examples || []).map((example) => `
      <div class="example-block">
        <strong lang="pl">${polishInteractive(example[0] || '')}</strong>
        <span>${state.settings.showEnglish ? `EN ${escapeHtml(example[2] || '')}` : ''}${state.settings.showDutch && state.settings.showEnglish ? ' · ' : ''}${state.settings.showDutch ? `NL ${escapeHtml(example[1] || '')}` : ''}</span>
        <button class="text-button" style="margin-top:5px" type="button" data-action="speak" data-text="${escapeHtml(example[0] || '')}">${icon('volume')} Listen</button>
      </div>
    `).join('')}
    ${reply.exercise ? renderTutorQuickCheck(reply.exercise, key) : ''}
  </div>
`;

function renderTutor() {
  const messages = state.tutor.messages || [];
  const weak = getWeakItems(state, 3);
  const localMode = !state.settings.aiProxyUrl;
  const prompts = [
    'How do I count from 1 to 10?',
    'Why is it “do Polski”?',
    'Explain iść vs jechać.',
    'Correct: Lubię kawa.',
    'How do I talk about my hobbies?',
    'Give me a family dinner exercise.',
  ];

  return `
    <div class="view tutor-layout">
      <section class="card tutor-chat">
        <header class="tutor-head">
          <div class="tutor-identity">
            <span class="coach-avatar">B</span>
            <span><strong>Blisko tutor</strong><span>English-first · Dutch-supported · remembers your weak spots</span></span>
          </div>
          <span class="local-pill">${localMode ? 'LOCAL · OFFLINE' : 'AI PROXY + LOCAL FALLBACK'}</span>
        </header>
        <div class="tutor-messages" id="tutor-messages">
          ${renderTutorReply(tutorWelcome(), 'welcome')}
          ${messages.map((message, index) => message.role === 'user'
            ? `<div class="tutor-bubble user"><p>${escapeHtml(message.text)}</p></div>`
            : renderTutorReply(message.reply, message.at || `assistant-${index}`)).join('')}
        </div>
        <div class="tutor-composer">
          <div class="composer-box">
            <button class="mic-button" type="button" data-action="tutor-mic" aria-label="Dictate a tutor question">${icon('mic')}</button>
            <textarea id="tutor-input" rows="1" placeholder="Ask about a sentence, ending, pronunciation, or mistake…"></textarea>
            <button class="send-button" type="button" data-action="tutor-send" aria-label="Send question">${icon('send')}</button>
          </div>
          <div class="composer-helper"><span>Core explanations work offline.</span><button class="text-button" type="button" data-action="open-settings">Configure optional AI proxy ${icon('settings')}</button></div>
        </div>
      </section>

      <aside class="tutor-side">
        <section class="card prompt-card">
          <h3>Try asking</h3>
          <p>Questions that reveal useful Polish patterns.</p>
          <div class="prompt-list">
            ${prompts.map((prompt) => `<button class="prompt-button" type="button" data-action="tutor-prompt" data-text="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join('')}
          </div>
        </section>
        <section class="card tutor-memory-card">
          <h3>What the tutor remembers</h3>
          <p>This memory stays on your device by default.</p>
          <div class="memory-list">
            ${weak.length ? weak.map(({ item, progress }) => `
              <div class="memory-row"><span class="memory-dot"></span><p><strong>${escapeHtml(item.pl)}</strong> has ${progress.lapses || 1} lapse${progress.lapses === 1 ? '' : 's'} and ${Math.round(progress.confidence * 100)}% confidence.</p></div>
            `).join('') : `
              <div class="memory-row"><span class="memory-dot"></span><p>You are a Dutch speaker using English as a support language.</p></div>
              <div class="memory-row"><span class="memory-dot"></span><p>Your main goal is natural conversation with Polish family-in-law.</p></div>
              <div class="memory-row"><span class="memory-dot"></span><p>Your interests include motorsport, snowboarding, festivals, and bonsai.</p></div>
            `}
          </div>
        </section>
        <section class="card tutor-memory-card">
          <h3>Generate something new</h3>
          <p>Local templates recombine known vocabulary; an optional proxy can create freer material.</p>
          <div class="button-row">
            <button class="secondary-button" type="button" data-action="start-session" data-mode="smart">New exercises</button>
            <button class="secondary-button" type="button" data-action="go-view" data-view="talk">New dialogue</button>
          </div>
        </section>
      </aside>
    </div>
  `;
}

const scrollTutorToBottom = () => {
  const container = document.getElementById('tutor-messages');
  if (container) requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
};

function renderGames() {
  return `
    <div class="view section-stack">
      <section class="page-intro card">
        <div>
          <p class="eyebrow">PLAY WITH A PURPOSE</p>
          <h2>Fast games that expose useful weaknesses.</h2>
          <p>Each game feeds the same learner model as your lessons. A mismatch, hesitation, or repeated pair becomes evidence for the next review session.</p>
        </div>
        <div class="intro-stat"><strong>${state.stats.gamesPlayed || 0}</strong><span>games completed</span></div>
      </section>

      <section>
        <div class="section-heading">
          <div><h2>Choose a quick challenge</h2><p>No XP farming. Every minute updates memory, listening, or speaking confidence.</p></div>
        </div>
        <div class="game-grid">
          ${GAME_TYPES.map((game) => {
            const [color, soft] = topicColor({ color: game.color });
            return `
              <button class="card game-card" type="button" data-action="start-game" data-game="${game.id}" style="--game:${color};--game-soft:${soft}">
                <span class="game-top"><span class="game-icon">${icon(game.icon)}</span><span class="game-time">${game.minutes} min</span></span>
                <h3>${escapeHtml(game.title)}</h3>
                <p>${escapeHtml(game.description)}</p>
                <span class="game-footer"><span>${escapeHtml(game.skill)}</span><b>Play ${icon('arrow')}</b></span>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <section class="two-column">
        <article class="card coach-card">
          <div class="coach-top">
            <span class="coach-avatar">B</span>
            <div class="coach-copy">
              <div class="coach-label">Invisible adaptation</div>
              <h3>The game watches what you confuse, not just what you miss.</h3>
              <p>If you repeatedly pair jadę with “walking”, the coach creates an iść–jechać contrast. If kawę and kawy collide, it schedules two different intentions: ordering and offering.</p>
              <button class="text-button" type="button" data-action="start-game" data-game="matching">Test the matching engine ${icon('arrow')}</button>
            </div>
          </div>
        </article>
        <article class="card pattern-card">
          <div class="pattern-header"><span class="pattern-label">Surprise feature</span><span class="soft-pill" style="padding:5px 8px;background:var(--purple-soft);color:var(--purple);font-size:8px">CONFUSION TWINS</span></div>
          <div class="pattern-sentence" style="font-size:26px">Not every wrong answer is the same.</div>
          <div class="pattern-translation">Blisko records which two meanings or forms your brain swaps, then teaches the difference inside a mini-dialogue.</div>
          <button class="secondary-button" type="button" data-action="go-view" data-view="review">See adaptive review</button>
        </article>
      </section>
    </div>
  `;
}

function renderProgress() {
  const metrics = getMetrics(state);
  const activity = getActivityDays(state, 14);
  const maxMinutes = Math.max(15, ...activity.map((day) => day.minutes));
  const totalWords = WORDS.length;
  const wordProgress = WORDS
    .map((word) => ({ word, progress: state.progress.items[word.id] }))
    .filter(({ progress }) => progress && progress.reps > 0);
  const startedWords = wordProgress.length;
  const strongWords = wordProgress.filter(({ progress }) => progress.reps >= 3 && progress.confidence >= 0.72).length;
  const fragileWords = wordProgress.filter(({ progress }) => progress.lapses > 0 || progress.confidence < 0.35).length;
  const learningWords = Math.max(0, startedWords - metrics.masteredWords);
  const unseenWords = Math.max(0, totalWords - startedWords);
  const transcripts = Object.values(state.conversation.transcripts || {});
  const simulatedConversations = transcripts.filter((transcript) => transcript?.messages?.some((message) => message.sender === 'user')).length;
  const completedConversations = transcripts.filter((transcript) => transcript?.completed).length;
  const activeDays = activity.filter((day) => day.minutes > 0 || day.reviews > 0 || day.speaking > 0 || day.conversations > 0 || day.games > 0).length;
  const recentMinutes = activity.reduce((sum, day) => sum + Number(day.minutes || 0), 0);
  const dailyGoal = Math.max(5, Number(state.profile.dailyGoal) || 15);
  const observedDailyPace = recentMinutes / activity.length;
  const paceForEstimate = activeDays >= 3 && observedDailyPace >= 2 ? observedDailyPace : dailyGoal;
  const paceSource = activeDays >= 3 && observedDailyPace >= 2
    ? `${observedDailyPace.toFixed(1)} focused min/day over the last 14 days`
    : `${dailyGoal} focused min/day from your goal`;
  const targetReadiness = 0.76;
  const comfortProgress = clamp(metrics.conversationReadiness / targetReadiness);
  const remainingFocusedMinutes = Math.max(0, (targetReadiness - metrics.conversationReadiness) * 2800);
  const estimatedDays = remainingFocusedMinutes === 0 ? 0 : Math.max(7, Math.ceil(remainingFocusedMinutes / Math.max(1, paceForEstimate)));
  const estimateLow = estimatedDays ? Math.max(7, Math.round(estimatedDays * 0.8)) : 0;
  const estimateHigh = estimatedDays ? Math.max(estimateLow + 1, Math.round(estimatedDays * 1.25)) : 0;
  const levelLabel = metrics.cefr === 'Pre-A1' ? 'A0' : metrics.cefr;
  const placement = state.onboarding?.placement || {};
  const placementLevelLabel = placement.estimatedLevel === 'Pre-A1' ? 'A0' : placement.estimatedLevel;
  const placementMode = placement.completedAt ? 'recalibration' : 'placement';
  const placementDateCopy = placement.completedAt ? formatDateRelative(placement.completedAt) : 'not checked yet';
  const estimateEvidence = metrics.evidenceConfidence;
  const estimateConfidence = estimateEvidence < 0.25 ? 'early estimate' : estimateEvidence < 0.62 ? 'growing evidence' : 'well supported';
  const forecastCopy = estimatedDays
    ? `Realistic range: ${estimateLow}–${estimateHigh} days. The estimate becomes more personal after every speaking attempt and conversation.`
    : 'Your current evidence has reached the comfortable family-small-talk target.';
  const forecastCopyNl = estimatedDays
    ? `Realistische bandbreedte: ${estimateLow}–${estimateHigh} dagen. De schatting wordt persoonlijker na elke spreekoefening en elk gesprek.`
    : 'Je huidige resultaten hebben het doel voor ontspannen familiegesprekken bereikt.';
  const snapshotSkills = [
    { id: 'reading', title: 'Reading recognition', secondary: 'Leesherkenning', value: metrics.reading, attempts: metrics.skills.reading.attempts },
    { id: 'listening', title: 'Listening', secondary: 'Luisteren', value: metrics.listening, attempts: metrics.skills.listening.attempts },
    { id: 'guidedProduction', title: 'Guided production', secondary: 'Begeleid produceren', value: metrics.guidedProduction, attempts: metrics.skills.guidedProduction.attempts },
    { id: 'freeProduction', title: 'Free production', secondary: 'Zelf produceren', value: metrics.freeProduction, attempts: metrics.skills.freeProduction.attempts },
    { id: 'pronunciation', title: 'Pronunciation', secondary: 'Uitspraak', value: metrics.pronunciation, attempts: metrics.skills.pronunciation.attempts },
  ];
  const detailedSkills = [
    { id: 'reading', title: 'Reading recognition', value: metrics.reading, icon: 'book', detail: `${metrics.skills.reading.attempts} measured attempts` },
    { id: 'listening', title: 'Listening', value: metrics.listening, icon: 'headphones', detail: `${metrics.skills.listening.attempts} measured attempts` },
    { id: 'guidedProduction', title: 'Guided production', value: metrics.guidedProduction, icon: 'grid', detail: `${metrics.skills.guidedProduction.attempts} supported retrievals` },
    { id: 'freeProduction', title: 'Free production', value: metrics.freeProduction, icon: 'message', detail: `${metrics.skills.freeProduction.attempts} independent answers` },
    { id: 'pronunciation', title: 'Pronunciation confidence', value: metrics.pronunciation, icon: 'mic', detail: `${metrics.skills.pronunciation.attempts} speaking signals` },
    { id: 'grammar', title: 'Grammar in use', value: metrics.grammar, icon: 'brain', detail: `${Object.keys(state.progress.concepts).length} patterns touched` },
    { id: 'conversation', title: 'Conversation', value: metrics.conversationReadiness, icon: 'users', detail: `${state.stats.conversationTurns} turns` },
  ];
  const hasSkillEvidence = snapshotSkills.some((skill) => skill.value > 0.01);
  const strongestSkill = hasSkillEvidence
    ? [...snapshotSkills].sort((a, b) => b.value - a.value)[0]
    : { title: 'Baseline pending', secondary: 'Nog te meten', value: 0 };
  const weakestSkill = hasSkillEvidence
    ? [...snapshotSkills].sort((a, b) => a.value - b.value)[0]
    : { title: 'Free production', secondary: 'Zelf produceren', value: 0 };
  const leastMeasuredSkill = [...snapshotSkills].sort((a, b) => a.attempts - b.attempts)[0];
  const readyCanDoCount = metrics.canDo.filter((task) => task.ready).length;
  const conceptRows = GRAMMAR_CONCEPTS
    .map((concept) => ({ concept, progress: state.progress.concepts[concept.id] || { confidence: 0, reviews: 0, mistakes: 0 } }))
    .sort((a, b) => b.progress.reviews - a.progress.reviews || b.concept.priority - a.concept.priority)
    .slice(0, 7);
  const scenarios = REAL_LIFE_SCENARIOS
    .map((scenario) => ({ scenario, score: getScenarioReadiness(state, scenario) }))
    .sort((a, b) => b.score - a.score);
  const unlocked = scenarios.filter(({ score }) => score >= 0.56);
  const nextScenario = scenarios.find(({ score }) => score < 0.56) || scenarios[0];
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  const newlyStable = wordProgress.filter(({ progress }) => (
    progress.reps >= 2
    && progress.confidence >= 0.48
    && progress.lastReviewedAt
    && new Date(progress.lastReviewedAt).getTime() >= sevenDaysAgo
  )).length;
  const masteryTotal = Math.max(1, totalWords);
  const stableButNotStrong = Math.max(0, metrics.masteredWords - strongWords);
  const masterySegments = {
    strong: strongWords / masteryTotal * 100,
    stable: stableButNotStrong / masteryTotal * 100,
    learning: learningWords / masteryTotal * 100,
    unseen: unseenWords / masteryTotal * 100,
  };
  const reviewHistory = Object.values(state.progress.items || {}).flatMap((progress) => Array.isArray(progress.history) ? progress.history : []);
  const evidenceReviews = reviewHistory.filter((entry) => entry.correct !== null && entry.correct !== undefined);
  const independentCorrect = evidenceReviews.filter((entry) => entry.correct && Number(entry.hintLevel || 0) === 0).length;
  const hintedReviews = evidenceReviews.filter((entry) => Number(entry.hintLevel || 0) > 0).length;
  const averageHintLevel = hintedReviews
    ? evidenceReviews.filter((entry) => Number(entry.hintLevel || 0) > 0).reduce((sum, entry) => sum + Number(entry.hintLevel || 0), 0) / hintedReviews
    : 0;
  const independenceRate = evidenceReviews.length ? independentCorrect / evidenceReviews.length : 0;
  const hintLevelCounts = state.stats.hintLevelCounts || {};
  const totalHintRequests = Math.max(1, Object.values(hintLevelCounts).reduce((sum, value) => sum + Number(value || 0), 0));
  const listeningStats = ensureListeningStats();
  const soundStats = ensureSoundStats();
  const naturalListeningAccuracy = ratio(listeningStats.naturalSpeedCorrect, listeningStats.naturalSpeedAttempts);
  const fastListeningAccuracy = ratio(listeningStats.fastSpeedCorrect, listeningStats.fastSpeedAttempts);
  const dictationAccuracy = ratio(listeningStats.dictationCorrect, listeningStats.dictations);
  const soundAccuracy = ratio(soundStats.correct, soundStats.attempts);
  const soundCompletion = Math.round((soundStats.completedLessons.length / Math.max(1, SOUND_LESSONS.length)) * 100);

  return `
    <div class="view section-stack progress-page">
      <section class="progress-snapshot">
        <div class="progress-snapshot-heading">
          <div>
            <p class="eyebrow progress-page-eyebrow">PROGRESS <small lang="nl">VOORTGANG</small></p>
            <h2><span>Your Polish, in numbers</span><small lang="nl">Jouw Pools, in cijfers</small></h2>
            <p class="progress-intro"><span>Based on what you can genuinely recall, understand, and say—not on lessons merely opened.</span><small lang="nl">Gebaseerd op wat je echt kunt terughalen, verstaan en zeggen.</small></p>
          </div>
          <span class="evidence-chip">${Math.round(estimateEvidence * 100)}% evidence · ${escapeHtml(estimateConfidence)}</span>
        </div>

        <article class="card comfort-forecast-card" style="--comfort-angle:${Math.round(comfortProgress * 360)}deg">
          <div class="comfort-forecast-copy">
            <span class="progress-overline">TIME TO COMFORTABLE FAMILY CONVERSATIONS<small lang="nl">Tot comfortabele familiegesprekken</small></span>
            <div class="comfort-forecast-number">
              <strong>${estimatedDays ? `≈ ${estimatedDays}` : 'Now'}</strong>
              <span>${estimatedDays ? 'days' : 'ready'}</span>
            </div>
            <p><span>${escapeHtml(forecastCopy)}</span><small class="secondary-sentence" lang="nl">${escapeHtml(forecastCopyNl)}</small></p>
          </div>
          <div class="comfort-readiness-ring" aria-label="${Math.round(comfortProgress * 100)} percent ready for comfortable family conversations">
            <div><strong>${Math.round(comfortProgress * 100)}%</strong><span>ready</span></div>
          </div>
          <div class="comfort-forecast-footer">
            <div class="comfort-linear-track"><span style="width:${Math.round(comfortProgress * 100)}%"></span></div>
            <span>${escapeHtml(paceSource)}</span>
          </div>
        </article>

        <div class="progress-stat-grid">
          <button class="card progress-stat-card" type="button" data-action="go-view" data-view="library">
            <span class="progress-stat-label">VOCABULARY <small lang="nl">WOORDENSCHAT</small></span>
            <span class="progress-stat-value"><strong>${metrics.masteredWords}</strong><b>/ ${totalWords}</b></span>
            <span class="progress-stat-detail">${learningWords} learning · ${fragileWords} need support</span>
            <span class="progress-stat-icon">${icon('book')}</span>
          </button>
          <article class="card progress-stat-card">
            <span class="progress-stat-label">ESTIMATED LEVEL <small lang="nl">GESCHAT NIVEAU</small></span>
            <span class="progress-stat-value"><strong>${levelLabel}</strong></span>
            <span class="progress-stat-detail">${Math.round(metrics.cefrProgress * 100)}% toward ${metrics.nextCefr} · ${escapeHtml(estimateConfidence)}</span>
            <span class="progress-stat-icon">${icon('flag')}</span>
          </article>
          <article class="card progress-stat-card">
            <span class="progress-stat-label">STREAK <small lang="nl">ACTIEVE REEKS</small></span>
            <span class="progress-stat-value"><strong>🔥 ${state.stats.streak || 0}</strong></span>
            <span class="progress-stat-detail">best ${state.stats.bestStreak || 0} days · ${activeDays}/14 active recently</span>
            <span class="progress-stat-icon">${icon('calendar')}</span>
          </article>
          <button class="card progress-stat-card" type="button" data-action="go-view" data-view="talk">
            <span class="progress-stat-label">CONVERSATIONS <small lang="nl">GESPREKKEN</small></span>
            <span class="progress-stat-value"><strong>💬 ${simulatedConversations}</strong></span>
            <span class="progress-stat-detail">${completedConversations} completed · ${metrics.unlockedConversations} scenarios ready</span>
            <span class="progress-stat-icon">${icon('message')}</span>
          </button>
        </div>

        <article class="card snapshot-skills-card">
          <div class="snapshot-skills-head">
            <div><span class="progress-overline">SKILLS<small lang="nl">Vaardigheden</small></span><p><span>Your estimate separates understanding from producing Polish.</span><small class="secondary-sentence" lang="nl">De schatting maakt onderscheid tussen Pools begrijpen en zelf produceren.</small></p></div>
            <span class="soft-pill">${hasSkillEvidence ? `strongest: ${escapeHtml(strongestSkill.title)}` : escapeHtml(strongestSkill.title)}</span>
          </div>
          <div class="snapshot-skill-list">
            ${snapshotSkills.map((skill) => `
              <div class="snapshot-skill-row">
                <span><strong>${escapeHtml(skill.title)}</strong><small lang="nl">${escapeHtml(skill.secondary)} · ${skill.attempts} checks</small></span>
                <div class="snapshot-skill-track"><i style="width:${Math.round(skill.value * 100)}%"></i></div>
                <b>${Math.round(skill.value * 100)}%</b>
              </div>
            `).join('')}
          </div>
          <div class="snapshot-skill-note">${hasSkillEvidence ? `Next leverage point: <strong>${escapeHtml(weakestSkill.title)}</strong>. Blisko will quietly weight this skill more often in review and conversation practice.` : `Complete one short review and one speaking attempt to establish a personal skill baseline.`}</div>
        </article>

        <article class="card support-independence-card">
          <div class="support-independence-head">
            <div><span class="progress-overline">SUPPORT INDEPENDENCE<small lang="nl">Zelfstandig zonder hulp</small></span><h3>${evidenceReviews.length ? `${Math.round(independenceRate * 100)}% independent retrieval` : 'No hint baseline yet'}</h3><p><span>Hints are not failures. This measures how often useful Polish returns before support is needed.</span><small class="secondary-sentence" lang="nl">Hints zijn geen fouten. Dit meet hoe vaak bruikbaar Pools terugkomt vóórdat hulp nodig is.</small></p></div>
            <div class="support-independence-score" style="--independence:${Math.round(independenceRate * 100)}%"><strong>${independentCorrect}</strong><span>independent wins</span></div>
          </div>
          <div class="support-independence-track"><span style="width:${Math.round(independenceRate * 100)}%"></span></div>
          <div class="support-evidence-grid">
            <div><strong>${hintedReviews}</strong><span>hinted reviews</span></div>
            <div><strong>${averageHintLevel ? averageHintLevel.toFixed(1) : '—'}</strong><span>average level needed</span></div>
            <div><strong>${state.stats.hintRecoveries || 0}</strong><span>active-recall recoveries</span></div>
            <div><strong>${state.stats.almostKnown || 0}</strong><span>almost-known signals</span></div>
          </div>
          <div class="hint-level-distribution" aria-label="Hint request distribution">
            ${[1,2,3,4,5].map((level) => `<span title="Hint ${level}: ${Number(hintLevelCounts[level] || 0)} requests"><i style="height:${Math.max(8, Number(hintLevelCounts[level] || 0) / totalHintRequests * 100)}%"></i><b>${level}</b></span>`).join('')}
          </div>
        </article>

        <article class="card listening-intelligence-card">
          <div class="listening-intelligence-head">
            <div><span class="progress-overline">LISTENING INTELLIGENCE<small lang="nl">Luisterintelligentie</small></span><h3>${listeningStats.attempts ? `${naturalListeningAccuracy}% at natural speed` : 'Build a real listening baseline'}</h3><p><span>Blisko now separates slow recognition, natural-speed understanding, dictation detail, and sound contrasts.</span><small class="secondary-sentence" lang="nl">Blisko meet langzaam herkennen, natuurlijk tempo, dicteerdetail en klankcontrasten afzonderlijk.</small></p></div>
            <button class="secondary-button compact" type="button" data-action="open-listening-lab">${icon('headphones')} Start listening lab</button>
          </div>
          <div class="listening-evidence-grid">
            <div><span>Natural speed</span><strong>${listeningStats.naturalSpeedAttempts ? `${naturalListeningAccuracy}%` : '—'}</strong><small>${listeningStats.naturalSpeedAttempts} checks</small></div>
            <div><span>Stretch speed</span><strong>${listeningStats.fastSpeedAttempts ? `${fastListeningAccuracy}%` : '—'}</strong><small>${listeningStats.fastSpeedAttempts} checks</small></div>
            <div><span>Dictation detail</span><strong>${listeningStats.dictations ? `${dictationAccuracy}%` : '—'}</strong><small>${listeningStats.dictations} attempts</small></div>
            <div><span>Sound contrasts</span><strong>${soundStats.attempts ? `${soundAccuracy}%` : '—'}</strong><small>${soundStats.completedLessons.length}/${SOUND_LESSONS.length} lessons</small></div>
          </div>
          <div class="listening-evidence-bars">
            <div><span>Natural family pace</span><div class="progress-track"><span style="width:${naturalListeningAccuracy}%"></span></div><b>${naturalListeningAccuracy}%</b></div>
            <div><span>Sound-family coverage</span><div class="progress-track"><span style="width:${soundCompletion}%"></span></div><b>${soundCompletion}%</b></div>
          </div>
          <div class="button-row"><button class="text-button" type="button" data-action="open-sound-lab">Open Polish Sound Lab ${icon('arrow')}</button><span class="listening-replay-note">${listeningStats.replays} replays used · replaying is evidence, not failure</span></div>
        </article>
      </section>

      <section class="progress-overview">
        <article class="card cefr-card" style="--cefr-progress:${Math.round(metrics.cefrProgress * 100)}%">
          <div>
            <p class="eyebrow progress-page-eyebrow">ESTIMATED COMMUNICATIVE LEVEL <small lang="nl">GESCHAT COMMUNICATIEF NIVEAU</small></p>
            <h2>${levelLabel} → ${metrics.nextCefr}</h2>
            <p>This is a conservative estimate from active recall, listening, guided and free production, pronunciation, grammar patterns, and completed scenarios—not a claim based on lesson count.</p>
            <div class="cefr-scale">
              ${['A0','A1','A2','B1','B2','C1'].map((label) => `<span class="${levelLabel === label ? 'active' : ''}">${label}</span>`).join('')}
            </div>
            <div class="cefr-calibration-row">
              <span><strong>${placement.completedAt ? `Last diagnostic: ${escapeHtml(placementLevelLabel || levelLabel)}` : 'No diagnostic baseline yet'}</strong><small>${placement.completedAt ? `${placementDateCopy} · normal practice now updates the estimate continuously` : 'An 11-question check gives the model a safer starting point.'}</small></span>
              <button class="secondary-button compact" type="button" data-action="open-placement" data-mode="${placementMode}">${placement.completedAt ? (metrics.recalibrationDue ? 'Recalibrate' : 'Check again') : 'Take level check'}</button>
            </div>
          </div>
          <div class="cefr-badge"><strong>${levelLabel}</strong><span>${Math.round(metrics.cefrProgress * 100)}% to ${metrics.nextCefr}</span><small>${Math.round(metrics.evidenceConfidence * 100)}% evidence confidence</small></div>
        </article>

        <article class="card conversation-card">
          <span class="pattern-label progress-bilingual-label">NEXT REAL-WORLD WIN<small lang="nl">Volgende winst in het echte leven</small></span>
          <div class="conversation-count"><strong>${Math.round(nextScenario.score * 100)}%</strong><span>${escapeHtml(nextScenario.scenario.title)} readiness</span></div>
          <p>${metrics.estimatedWeeks ? `At your measured or chosen pace, the model estimates about ${estimatedDays} days to comfortable family small talk.` : 'Your current scenario model has reached the comfortable small-talk target.'}</p>
          <div class="conversation-tags">
            ${unlocked.length ? unlocked.slice(0, 6).map(({ scenario }) => `<span class="conversation-tag">${scenario.emoji} ${escapeHtml(scenario.title)}</span>`).join('') : '<span class="conversation-tag">First scenario unlocks at 56% readiness</span>'}
          </div>
          <button class="secondary-button progress-next-button" type="button" data-action="go-view" data-view="talk">Practise this scenario ${icon('arrow')}</button>
        </article>
      </section>

      <section class="can-do-calibration-grid">
        <article class="card can-do-card">
          <div class="section-heading">
            <div><p class="eyebrow progress-page-eyebrow">REAL-LIFE CAN-DO EVIDENCE <small lang="nl">Bewijs uit echte situaties</small></p><h2>${readyCanDoCount} of ${metrics.canDo.length} practical abilities ready</h2><p>CEFR estimates become useful only when they describe what you can actually do.</p></div>
            <span class="can-do-score">${readyCanDoCount}/${metrics.canDo.length}</span>
          </div>
          <div class="can-do-list">
            ${metrics.canDo.map((task) => `<div class="can-do-row ${task.ready ? 'ready' : ''}"><span>${task.ready ? icon('check') : icon('lock')}</span><p>${escapeHtml(task.label)}</p><b>${task.ready ? 'Ready' : 'Building'}</b></div>`).join('')}
          </div>
        </article>
        <article class="card evidence-quality-card">
          <span class="progress-overline">EVIDENCE QUALITY<small lang="nl">Kwaliteit van de meting</small></span>
          <h3>${Math.round(metrics.evidenceConfidence * 100)}% confidence in this estimate</h3>
          <p>The model lowers certainty when a skill has too few attempts. It never fills an evidence gap with vocabulary count alone.</p>
          <div class="evidence-quality-meter"><span style="width:${Math.round(metrics.evidenceConfidence * 100)}%"></span></div>
          <div class="evidence-quality-facts">
            <span><strong>Least measured</strong><b>${escapeHtml(leastMeasuredSkill.title)} · ${leastMeasuredSkill.attempts} checks</b></span>
            <span><strong>Diagnostic</strong><b>${placement.completedAt ? `${escapeHtml(placementLevelLabel || levelLabel)} · ${placementDateCopy}` : 'Not completed'}</b></span>
            <span><strong>Recalibration</strong><b>${metrics.recalibrationDue ? 'Recommended now' : 'Not needed yet'}</b></span>
          </div>
          <button class="${metrics.recalibrationDue ? 'primary-button' : 'secondary-button'}" type="button" data-action="open-placement" data-mode="${placementMode}">${placement.completedAt ? 'Recalibrate across all skills' : 'Create a diagnostic baseline'} ${icon('arrow')}</button>
        </article>
      </section>

      <section class="mastery-snapshot-grid">
        <article class="card mastery-distribution-card">
          <div class="section-heading"><div><h2>Memory distribution<small lang="nl">Geheugenverdeling</small></h2><p>Where every curriculum word currently sits.</p></div><span class="soft-pill">+${newlyStable} stable this week</span></div>
          <div class="mastery-segmented-track" aria-label="Vocabulary mastery distribution">
            <span class="segment-strong" style="width:${masterySegments.strong}%"></span>
            <span class="segment-stable" style="width:${masterySegments.stable}%"></span>
            <span class="segment-learning" style="width:${masterySegments.learning}%"></span>
            <span class="segment-unseen" style="width:${masterySegments.unseen}%"></span>
          </div>
          <div class="mastery-legend">
            <span><i class="strong"></i><b>${strongWords}</b> strong</span>
            <span><i class="stable"></i><b>${stableButNotStrong}</b> stable</span>
            <span><i class="learning"></i><b>${learningWords}</b> learning</span>
            <span><i class="unseen"></i><b>${unseenWords}</b> unseen</span>
          </div>
        </article>
        <article class="card estimate-method-card">
          <span class="progress-overline">WHY THE NUMBER MOVES<small lang="nl">Waarom de schatting verandert</small></span>
          <h3>Real evidence changes the forecast.</h3>
          <div class="estimate-factor"><span>Conversation readiness</span><b>${Math.round(metrics.conversationReadiness * 100)}%</b><div class="progress-track"><span style="width:${Math.round(metrics.conversationReadiness * 100)}%"></span></div></div>
          <div class="estimate-factor"><span>Speaking evidence</span><b>${Math.round(metrics.speaking * 100)}%</b><div class="progress-track"><span style="width:${Math.round(metrics.speaking * 100)}%"></span></div></div>
          <div class="estimate-factor"><span>Stable sentence material</span><b>${Math.round(clamp((metrics.masteredWords / 100) * 0.45 + (metrics.knownPhrases / 48) * 0.55) * 100)}%</b><div class="progress-track"><span style="width:${Math.round(clamp((metrics.masteredWords / 100) * 0.45 + (metrics.knownPhrases / 48) * 0.55) * 100)}%"></span></div></div>
        </article>
      </section>

      <section class="skill-grid">
        ${detailedSkills.map((skill) => `
          <article class="card skill-card">
            <div class="skill-card-head"><span>${icon(skill.icon)}</span><b>${Math.round(skill.value * 100)}%</b></div>
            <strong>${escapeHtml(skill.title)}</strong>
            <p>${escapeHtml(skill.detail)}</p>
            <div class="progress-track"><span style="width:${Math.round(skill.value * 100)}%"></span></div>
          </article>
        `).join('')}
      </section>

      <section class="chart-grid">
        <article class="card chart-card">
          <div class="section-heading"><div><h2>Focused minutes<small lang="nl">Gerichte minuten</small></h2><p>The last fourteen days on this device.</p></div><span class="soft-pill" style="padding:6px 9px;background:var(--green-soft);color:var(--green);font-size:9px">${Math.round(state.stats.totalMinutes)} min total</span></div>
          <div class="activity-chart">
            ${activity.map((day) => `
              <div class="chart-column" title="${day.date}: ${day.minutes} minutes">
                <div class="chart-bar-wrap"><div class="chart-bar" style="--height:${Math.max(3, day.minutes / maxMinutes * 100)}%"></div></div>
                <span>${day.dayLabel}</span>
              </div>
            `).join('')}
          </div>
        </article>

        <article class="card chart-card">
          <div class="section-heading"><div><h2>Grammar patterns<small lang="nl">Grammaticapatronen</small></h2><p>Confidence grows through sentences, not rule memorization.</p></div></div>
          <div class="mastery-list">
            ${conceptRows.map(({ concept, progress }) => `
              <div class="mastery-row">
                <span class="mastery-copy"><strong>${escapeHtml(concept.title)}</strong><span>${progress.reviews} encounters · ${progress.mistakes} friction points</span></span>
                <span class="mastery-score">${Math.round(progress.confidence * 100)}%</span>
                <span class="progress-track"><span style="width:${Math.round(progress.confidence * 100)}%"></span></span>
              </div>
            `).join('')}
          </div>
        </article>
      </section>

      <section class="metric-grid progress-bottom-metrics">
        <article class="card metric-card"><div class="metric-head"><span class="metric-icon">${icon('book')}</span><span class="metric-trend">usable vocabulary</span></div><strong class="metric-value">${metrics.masteredWords}</strong><p>words stable enough to retrieve</p></article>
        <article class="card metric-card"><div class="metric-head"><span class="metric-icon">${icon('message')}</span><span class="metric-trend">sentence chunks</span></div><strong class="metric-value">${metrics.knownPhrases}</strong><p>phrases ready to speak</p></article>
        <article class="card metric-card"><div class="metric-head"><span class="metric-icon">${icon('target')}</span><span class="metric-trend">memory evidence</span></div><strong class="metric-value">${Math.round(metrics.accuracy * 100)}%</strong><p>review accuracy</p></article>
        <article class="card metric-card"><div class="metric-head"><span class="metric-icon">${icon('calendar')}</span><span class="metric-trend">best ${state.stats.bestStreak || 0}</span></div><strong class="metric-value">${state.stats.streak || 0}</strong><p>day conversation streak</p></article>
      </section>
    </div>
  `;
}

function renderLibrary() {
  return `
    <div class="view section-stack">
      <section class="page-intro card">
        <div>
          <p class="eyebrow">HIGH-FREQUENCY, FAMILY-FIRST</p>
          <h2>Your useful Polish, in context.</h2>
          <p>The starter corpus is curated around verbs, family, everyday conversation, polite phrases, and your own interests. Every item connects to an example or sentence pattern.</p>
        </div>
        <div class="intro-stat"><strong>${WORDS.length}</strong><span>curated starter words</span></div>
      </section>

      <section>
        <div class="library-toolbar">
          <label class="search-box">${icon('search')}<input id="library-search" type="search" value="${escapeHtml(libraryQuery)}" placeholder="Search Polish, Dutch, or English…" aria-label="Search word library"></label>
          <select id="library-filter" class="filter-select" aria-label="Filter words">
            <option value="all" ${libraryFilter === 'all' ? 'selected' : ''}>All types</option>
            <option value="verb" ${libraryFilter === 'verb' ? 'selected' : ''}>Verbs first</option>
            <option value="noun" ${libraryFilter === 'noun' ? 'selected' : ''}>Nouns</option>
            <option value="expression" ${libraryFilter === 'expression' ? 'selected' : ''}>Expressions</option>
            <option value="adjective" ${libraryFilter === 'adjective' ? 'selected' : ''}>Adjectives</option>
            <option value="known" ${libraryFilter === 'known' ? 'selected' : ''}>Learned</option>
            <option value="weak" ${libraryFilter === 'weak' ? 'selected' : ''}>Weak</option>
          </select>
          <button class="secondary-button" type="button" data-action="start-session" data-mode="smart">${icon('play')} Learn next</button>
        </div>
        <div class="card word-table">
          <div class="word-row header"><span>Polish</span><span>Meaning</span><span>Type</span><span>Topic</span><span>Mastery</span></div>
          <div id="word-list">${renderWordRows()}</div>
        </div>
      </section>
    </div>
  `;
}

function renderWordRows() {
  const query = normalizeText(libraryQuery, { loose: true });
  const rows = WORDS.filter((word) => {
    const progress = state.progress.items[word.id];
    const searchable = normalizeText(`${word.pl} ${word.nl} ${word.en} ${word.type} ${word.topic}`, { loose: true });
    if (query && !searchable.includes(query)) return false;
    if (libraryFilter === 'known') return progress?.confidence >= 0.48;
    if (libraryFilter === 'weak') return progress && (progress.lapses > 0 || progress.confidence < 0.4);
    if (libraryFilter !== 'all' && libraryFilter !== word.type) return false;
    return true;
  });

  if (!rows.length) {
    return `<div class="empty-state"><span class="empty-state-icon">${icon('search')}</span><h3>No matching words</h3><p>Try a Polish form, a Dutch or English meaning, or a broader filter.</p></div>`;
  }

  return rows.map((word) => {
    const progress = state.progress.items[word.id];
    return `
      <button class="word-row" type="button" data-action="open-word" data-word="${word.id}">
        <span class="word-polish"><strong lang="pl">${escapeHtml(word.pl)}</strong><span lang="pl">${escapeHtml(word.example)}</span></span>
        <span class="word-translation"><strong>${escapeHtml(word.nl)}</strong><span>${escapeHtml(word.en)}</span></span>
        <span class="word-kind">${escapeHtml(word.type)}</span>
        <span class="word-topic">${escapeHtml(word.topic)}</span>
        <span class="word-mastery"><span class="progress-track"><span style="width:${Math.round((progress?.confidence || 0) * 100)}%"></span></span><span>${progress ? `${Math.round(progress.confidence * 100)}%` : 'new'}</span></span>
      </button>
    `;
  }).join('');
}

const startSession = ({ mode = 'smart', topic = null, itemIds = null, length = 8, title = null, customExercises = null } = {}) => {
  const language = primaryLanguage();
  const exercises = customExercises?.length
    ? customExercises
    : itemIds?.length
    ? itemIds
      .map((id) => ITEM_MAP.get(id))
      .filter(Boolean)
      .map((item, index) => makeExercise(item, state.progress.items[item.id], index, { mode, language }))
    : buildSession(state, { topic, length, mode, language });

  if (!exercises.length) {
    showToast('No material found', 'Try a broader topic or the smart session.', 'alert');
    return;
  }

  session = {
    mode,
    topic,
    title: title || (topic ? TOPICS.find((entry) => entry.id === topic)?.title : null) || (mode === 'review' ? 'Adaptive review' : mode === 'speaking' ? 'Speaking workout' : 'Smart session'),
    exercises,
    index: 0,
    score: 0,
    results: [],
    answered: false,
    answerResult: null,
    selectedOption: null,
    typedAnswer: '',
    orderSelected: [],
    recordingUrl: null,
    hintLevel: 0,
    hintStack: [],
    hintPartialIndex: 0,
    hintRecallPhase: null,
    hintRecallValue: '',
    hintRecallResult: null,
    hintRecallTokens: [],
    hintRecallOrderSelected: [],
    hintRecallCompleted: false,
    autofocusTarget: exercises[0]?.type === 'typing' ? 'answer' : null,
    startedAt: Date.now(),
    summarySaved: false,
  };
  document.body.style.overflow = 'hidden';
  renderSession();
};

const startPatternChallenge = (patternId = selectedPatternId) => {
  const pattern = PATTERNS.find((entry) => entry.id === patternId) || PATTERNS[0];
  const selections = patternSelections[pattern.id] || pattern.default;
  const answer = getPatternSentence(pattern, selections);
  const cleanAnswer = answer.replace(/[.!?]+$/g, '');
  const translationNl = getPatternTranslation(pattern, selections, 'nl');
  const translationEn = getPatternTranslation(pattern, selections, 'en');
  const primary = primaryLanguage() === 'nl' ? translationNl : translationEn;
  const secondary = primaryLanguage() === 'nl' ? translationEn : translationNl;
  const tokens = cleanAnswer.split(/\s+/).filter(Boolean)
    .map((value, index) => ({ id: `${pattern.id}-${index}-${value}`, value }));
  const patternProgress = state.progress.patterns?.[pattern.id] || null;
  const adaptiveSupportLevel = getAdaptiveSupportLevel(patternProgress);
  const baseExerciseType = tokens.length >= 3 ? 'ordering' : 'typing';

  const alternatives = [];
  Object.entries(pattern.slots || {}).forEach(([slotId, options]) => {
    (options || []).forEach((option) => {
      if (option.value === selections[slotId]) return;
      const candidate = getPatternSentence(pattern, { ...selections, [slotId]: option.value }).replace(/[.!?]+$/g, '');
      if (candidate !== cleanAnswer && !alternatives.includes(candidate)) alternatives.push(candidate);
    });
  });

  let exerciseType = baseExerciseType;
  if (adaptiveSupportLevel >= 2 && alternatives.length >= 2) exerciseType = 'choice';
  else if (adaptiveSupportLevel >= 1 && baseExerciseType === 'typing' && tokens.length >= 2) exerciseType = 'ordering';

  const exercise = {
    id: `${pattern.id}-${Date.now()}`,
    itemId: null,
    itemType: 'pattern',
    patternId: pattern.id,
    topic: pattern.topic || 'questions',
    grammar: pattern.grammar || [],
    source: {
      itemType: 'phrase',
      type: 'sentence pattern',
      topic: pattern.topic || 'questions',
      pl: answer,
      nl: translationNl,
      en: translationEn,
      grammar: pattern.grammar || [],
    },
    translations: { nl: translationNl, en: translationEn },
    type: exerciseType,
    originalExerciseType: baseExerciseType,
    adaptiveSupportLevel,
    adaptiveSupportAdjusted: exerciseType !== baseExerciseType,
    adaptiveSupportReason: exerciseType === 'choice'
      ? 'Repeated hint use changed free recall into recognition.'
      : exerciseType !== baseExerciseType
        ? 'Repeated hint use changed typing into word selection.'
        : '',
    direction: 'meaning-to-pl',
    answerKind: 'polish',
    skill: exerciseType === 'choice' ? 'Guided pattern recall' : 'Pattern practice',
    instruction: exerciseType === 'choice' ? 'Choose the reusable pattern' : 'Build the reusable pattern',
    mainText: primary,
    subText: secondary,
    answer: cleanAnswer,
    tokens: shuffle(tokens, `${pattern.id}-${Date.now()}`),
    options: exerciseType === 'choice'
      ? shuffle([cleanAnswer, ...alternatives.slice(0, 2)], `${pattern.id}-adaptive-choice-${Date.now()}`)
      : undefined,
    audioText: answer,
  };
  startSession({
    mode: 'pattern',
    title: `${pattern.title} · guided challenge`,
    customExercises: [exercise],
  });
};


const PLACEMENT_SKILL_LABELS = {
  reading: 'Reading recognition',
  listening: 'Listening',
  guidedProduction: 'Guided production',
  freeProduction: 'Free production',
  pronunciation: 'Pronunciation confidence',
  grammar: 'Grammar patterns',
};

const currentPlacementQuestion = () => placementSession?.questions?.[placementSession.index] || null;

const openPlacementTest = (mode = 'placement') => {
  placementSession = {
    mode,
    questions: PLACEMENT_QUESTIONS.map((question) => ({
      ...question,
      tokens: question.type === 'ordering'
        ? shuffle((question.tokens || []).map((value, index) => ({ id: `${question.id}-${index}`, value })), `${question.id}-${Date.now()}`)
        : question.tokens,
    })),
    index: 0,
    results: [],
    answered: false,
    answerResult: null,
    selected: null,
    typedAnswer: '',
    orderSelected: [],
    summary: null,
    startedAt: Date.now(),
  };
  document.body.style.overflow = 'hidden';
  renderPlacementTest();
};

const placementAnswerScore = (result) => {
  if (result.correct) return result.errorType === 'minor_spelling' ? 0.9 : 1;
  if (result.close) return Math.max(0.46, Math.min(0.68, Number(result.score || 0.55)));
  return Math.max(0, Math.min(0.25, Number(result.score || 0) * 0.3));
};

const recordPlacementAnswer = (value, { score = null, selfRated = false } = {}) => {
  if (!placementSession || placementSession.answered) return;
  const question = currentPlacementQuestion();
  if (!question) return;
  const result = selfRated
    ? {
      correct: Number(score) >= 0.58,
      close: Number(score) >= 0.35 && Number(score) < 0.58,
      score: clamp(Number(score) || 0),
      errorType: 'self_rated_speaking',
      verdict: Number(score) >= 0.78 ? 'Comfortable aloud' : Number(score) >= 0.45 ? 'Possible with effort' : 'Not available yet',
      message: 'This self-rating is used only as early pronunciation evidence. Future speaking attempts will replace it.',
      messageNl: 'Deze zelfbeoordeling is alleen vroege uitspraak-informatie. Latere spreekoefeningen vervangen dit bewijs.',
      expected: question.audioText || question.mainText,
    }
    : evaluateAnswer(value, question.answer || '', {
      language: ['typing', 'ordering'].includes(question.type) ? 'pl' : 'en',
      acceptedAnswers: question.acceptedAnswers || [],
      grammar: question.conceptId ? [question.conceptId] : [],
      answerKind: ['typing', 'ordering'].includes(question.type) ? 'polish' : 'meaning',
    });
  const finalScore = score === null ? placementAnswerScore(result) : clamp(Number(score) || 0);
  placementSession.selected = value;
  placementSession.typedAnswer = question.type === 'typing' ? String(value || '') : placementSession.typedAnswer;
  placementSession.answerResult = result;
  placementSession.answered = true;
  placementSession.results.push({
    questionId: question.id,
    level: question.level,
    skill: question.skill,
    weight: question.weight || 1,
    score: finalScore,
    correct: result.correct,
    close: result.close,
    errorType: result.errorType || null,
    itemId: question.itemId || null,
    conceptId: question.conceptId || null,
  });
  haptic(result.correct ? 8 : result.close ? 5 : [18, 30, 18]);
  renderPlacementTest();
};

const advancePlacementTest = () => {
  if (!placementSession) return;
  if (!placementSession.answered) {
    const question = currentPlacementQuestion();
    placementSession.results.push({
      questionId: question?.id,
      level: question?.level,
      skill: question?.skill,
      weight: question?.weight || 1,
      score: 0,
      correct: false,
      close: false,
      errorType: 'skipped',
      itemId: question?.itemId || null,
      conceptId: question?.conceptId || null,
    });
  }
  if (placementSession.index >= placementSession.questions.length - 1) {
    placementSession.summary = applyPlacementResult(state, placementSession.results, { mode: placementSession.mode });
    placementSession.index = placementSession.questions.length;
    save({ immediate: true });
    renderPlacementTest();
    return;
  }
  placementSession.index += 1;
  placementSession.answered = false;
  placementSession.answerResult = null;
  placementSession.selected = null;
  placementSession.typedAnswer = '';
  placementSession.orderSelected = [];
  renderPlacementTest();
  if (currentPlacementQuestion()?.type === 'typing') setTimeout(() => document.getElementById('placement-answer')?.focus(), 40);
};

const closePlacementTest = ({ toProgress = false } = {}) => {
  placementSession = null;
  modalRoot.innerHTML = '';
  document.body.style.overflow = '';
  if (toProgress) navigate('progress');
};

const renderPlacementSummary = () => {
  const summary = placementSession.summary;
  const level = summary.estimatedLevel === 'Pre-A1' ? 'A0' : summary.estimatedLevel;
  const rows = Object.entries(summary.skillScores || {})
    .map(([skill, value]) => `
      <div class="placement-skill-row">
        <span><strong>${escapeHtml(PLACEMENT_SKILL_LABELS[skill] || skill)}</strong><small>${Math.round(value * 100)}% diagnostic evidence</small></span>
        <div class="progress-track"><span style="width:${Math.round(value * 100)}%"></span></div>
      </div>
    `).join('');
  const levelRows = ['A0', 'A1', 'A2'].map((band) => {
    const value = Number(summary.levelScores?.[band] || 0);
    return `<div class="placement-band-row"><span>${band}</span><div class="progress-track"><span style="width:${Math.round(value * 100)}%"></span></div><b>${Math.round(value * 100)}%</b></div>`;
  }).join('');
  return `
    <main class="placement-stage placement-summary-stage">
      <section class="card placement-summary-card">
        <span class="placement-result-icon">${icon('target')}</span>
        <p class="eyebrow">CONSERVATIVE LEVEL CHECK</p>
        <h2>Your current estimate is <strong>${escapeHtml(level)}</strong></h2>
        <p>Blisko measured retrieval across ${Object.keys(summary.skillScores || {}).length} skills. It did not count opened lessons or guessed vocabulary as mastery.</p>
        <div class="placement-level-meter"><span style="width:${Math.round(summary.score * 100)}%"></span></div>
        <div class="placement-summary-meta"><span>${Math.round(summary.evidenceConfidence * 100)}% diagnostic coverage</span><span>${summary.answered}/${PLACEMENT_QUESTIONS.length} checks answered</span></div>
        <div class="placement-band-list"><span class="progress-overline">PERFORMANCE BY DIFFICULTY</span>${levelRows}</div>
        <div class="placement-skill-list">${rows}</div>
        <div class="feedback-coach-note">
          <strong>What happens next</strong>
          <p>The result calibrates difficulty and progress estimates. Normal practice will gradually outweigh this short diagnostic.</p>
          ${state.settings.showDutch ? '<small lang="nl">Het resultaat kalibreert de moeilijkheid en voortgangsschatting. Gewone oefeningen wegen na verloop van tijd zwaarder.</small>' : ''}
        </div>
      </section>
    </main>
    <footer class="placement-footer"><button class="primary-button" type="button" data-action="placement-finish">See calibrated progress ${icon('arrow')}</button></footer>
  `;
};

const renderPlacementQuestion = (question) => {
  const result = placementSession.answerResult;
  let interaction = '';
  if (question.type === 'choice' || question.type === 'listening') {
    interaction = `
      ${question.type === 'listening' ? `<button class="listen-button placement-listen" type="button" data-action="speak" data-text="${escapeHtml(question.audioText)}" aria-label="Play Polish audio">${icon('volume')}</button>` : ''}
      <div class="answer-options placement-options">
        ${question.options.map((option, index) => {
          const selected = placementSession.selected === option;
          const correct = normalizeText(option, { loose: true }) === normalizeText(question.answer, { loose: true });
          const className = placementSession.answered ? (correct ? 'correct' : selected ? 'wrong' : '') : '';
          return `<button class="answer-option ${className}" type="button" data-action="placement-choice" data-option="${escapeHtml(option)}" ${placementSession.answered ? 'disabled' : ''}><span class="option-letter">${String.fromCharCode(65 + index)}</span><strong>${escapeHtml(option)}</strong></button>`;
        }).join('')}
      </div>`;
  } else if (question.type === 'typing') {
    interaction = `
      <form class="answer-input-wrap placement-answer-form" data-action="placement-typing-form">
        <input id="placement-answer" name="answer" class="answer-input ${placementSession.answered ? result?.correct ? 'correct' : 'wrong' : ''}" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escapeHtml(placementSession.typedAnswer || '')}" placeholder="Type the Polish sentence…" ${placementSession.answered ? 'disabled' : ''}>
        <button class="primary-button" type="submit" ${placementSession.answered ? 'disabled' : ''}>Check</button>
      </form>`;
  } else if (question.type === 'ordering') {
    const selectedIds = new Set(placementSession.orderSelected.map((token) => token.id));
    interaction = `
      <div class="order-zone placement-order-zone">${placementSession.orderSelected.map((token) => `<button class="word-chip" type="button" data-action="placement-order-remove" data-token="${escapeHtml(token.id)}" ${placementSession.answered ? 'disabled' : ''}>${escapeHtml(token.value)}</button>`).join('') || '<span class="hint-empty-copy">Tap the words in sentence order.</span>'}</div>
      <div class="order-bank">${question.tokens.filter((token) => !selectedIds.has(token.id)).map((token) => `<button class="word-chip" type="button" data-action="placement-order-add" data-token="${escapeHtml(token.id)}" ${placementSession.answered ? 'disabled' : ''}>${escapeHtml(token.value)}</button>`).join('')}</div>
      <button class="primary-button placement-order-check" type="button" data-action="placement-order-check" ${placementSession.answered || !placementSession.orderSelected.length ? 'disabled' : ''}>Check sentence</button>`;
  } else {
    interaction = `
      <div class="placement-speaking-panel">
        <button class="record-orb" type="button" data-action="speak" data-text="${escapeHtml(question.audioText)}">${icon('volume')}</button>
        <strong>Listen once, then say it aloud.</strong>
        <p>Choose the description that is most honest. This is an early confidence signal, not a pronunciation exam.</p>
        <div class="placement-speaking-ratings">
          <button class="secondary-button" type="button" data-action="placement-speaking" data-score="0.18" ${placementSession.answered ? 'disabled' : ''}>Not yet</button>
          <button class="secondary-button" type="button" data-action="placement-speaking" data-score="0.55" ${placementSession.answered ? 'disabled' : ''}>With effort</button>
          <button class="primary-button" type="button" data-action="placement-speaking" data-score="0.88" ${placementSession.answered ? 'disabled' : ''}>Comfortable</button>
        </div>
      </div>`;
  }

  const feedback = placementSession.answered ? `
    <div class="feedback-box ${result?.correct ? 'correct' : 'wrong'} placement-feedback">
      <div class="feedback-verdict-row"><h4>${escapeHtml(result?.verdict || (result?.correct ? 'Correct' : result?.close ? 'Close' : 'Not yet'))}</h4><span class="feedback-error-chip">${escapeHtml((result?.errorType || 'diagnostic').replaceAll('_', ' '))}</span></div>
      <p>${escapeHtml(result?.message || '')}</p>
      ${state.settings.showDutch && result?.messageNl ? `<p class="feedback-secondary" lang="nl">${escapeHtml(result.messageNl)}</p>` : ''}
      ${question.answer ? `<div class="feedback-model-answer"><span>Model answer</span><strong>${escapeHtml(question.answer)}</strong></div>` : ''}
    </div>` : '';

  return `
    <main class="placement-stage">
      <article class="card placement-question-card">
        <div class="exercise-eyebrow"><span>${escapeHtml(question.instruction)}</span><span class="exercise-skill">${escapeHtml(PLACEMENT_SKILL_LABELS[question.skill] || question.skill)}</span></div>
        <p class="placement-level-tag">${escapeHtml(question.level)} evidence · no hints in this calibration</p>
        <div class="exercise-main-text">${escapeHtml(question.mainText)}</div>
        ${interaction}
        ${feedback}
      </article>
    </main>
    <footer class="placement-footer">
      ${placementSession.answered
        ? `<button class="primary-button" type="button" data-action="placement-next">${placementSession.index === placementSession.questions.length - 1 ? 'See result' : 'Next check'} ${icon('arrow')}</button>`
        : `<button class="ghost-button" type="button" data-action="placement-next">I do not know this yet</button>`}
    </footer>`;
};

const renderPlacementTest = () => {
  if (!placementSession) return;
  const complete = placementSession.index >= placementSession.questions.length && placementSession.summary;
  modalRoot.innerHTML = `
    <div class="placement-modal" role="dialog" aria-modal="true" aria-label="Polish level check">
      <header class="placement-topbar">
        <button class="icon-button" type="button" data-action="placement-close" aria-label="Close level check">${icon('close')}</button>
        <div class="session-progress-wrap">
          <div class="progress-track"><span style="width:${complete ? 100 : Math.round(placementSession.index / placementSession.questions.length * 100)}%"></span></div>
          <span>${complete ? 'Complete' : `${placementSession.index + 1} / ${placementSession.questions.length}`}</span>
        </div>
        <span class="placement-mode-chip">${placementSession.mode === 'recalibration' ? 'Recalibrate' : 'Level check'}</span>
      </header>
      ${complete ? renderPlacementSummary() : renderPlacementQuestion(currentPlacementQuestion())}
    </div>`;
  hydrateStaticIcons(modalRoot);
};

const currentExercise = () => session?.exercises?.[session.index] || null;

const HINT_STEP_LABELS = [
  'Need a hint',
  'Show the structure',
  'Reveal one anchor',
  'Explain the pattern',
  'Show answer + recall',
];

const sessionHintButtonLabel = () => HINT_STEP_LABELS[Math.min(session?.hintLevel || 0, HINT_STEP_LABELS.length - 1)];

const renderHintMeter = (level = 0) => `
  <div class="hint-meter" aria-label="Hint level ${level} of 5">
    ${Array.from({ length: 5 }, (_, index) => `<span class="${index < level ? 'used' : ''} ${index + 1 === level ? 'current' : ''}"></span>`).join('')}
  </div>
`;

const renderSessionHintRecall = (exercise) => {
  if (session.hintLevel < 5 || session.answered) return '';
  if (session.hintRecallPhase === 'study') {
    const hint = session.hintStack.at(-1);
    return `
      <div class="hint-recall-card study">
        <span class="hint-recall-label">STUDY BRIEFLY</span>
        <strong class="hint-answer-display">${escapeHtml(hint?.answer || exercise.answer)}</strong>
        ${exercise.answerKind !== 'meaning' ? `<span class="hint-answer-translation">${state.settings.showEnglish ? `EN ${escapeHtml(exercise.translations?.en || '')}` : ''}${state.settings.showEnglish && state.settings.showDutch ? ' · ' : ''}${state.settings.showDutch ? `NL ${escapeHtml(exercise.translations?.nl || '')}` : ''}</span>` : ''}
        <p>The answer will disappear. Retrieve it once before the review is saved.</p>
        <button class="primary-button" type="button" data-action="begin-hint-recall">Hide it and recall ${icon('arrow')}</button>
      </div>
    `;
  }

  if (session.hintRecallPhase !== 'recall') return '';

  let interaction = '';
  if (exercise.type === 'speaking') {
    interaction = `
      <div class="hint-recall-speaking">
        <button class="record-orb" type="button" data-action="complete-hint-recall-speaking" aria-label="Mark spoken recall complete">${icon('mic')}</button>
        <strong>Say the line from memory now.</strong>
        <p>Do not chase a perfect accent. Recover the whole speaking block once.</p>
      </div>
    `;
  } else if (exercise.type === 'ordering') {
    const selectedIds = new Set(session.hintRecallOrderSelected.map((token) => token.id));
    interaction = `
      <div class="order-zone hint-recall-zone" aria-label="Your recalled sentence">
        ${session.hintRecallOrderSelected.map((token) => `<button class="word-chip" type="button" data-action="hint-order-remove" data-token="${escapeHtml(token.id)}">${escapeHtml(token.value)}</button>`).join('') || '<span class="hint-empty-copy">Rebuild the sentence without looking back.</span>'}
      </div>
      <div class="order-bank">
        ${(session.hintRecallTokens || []).filter((token) => !selectedIds.has(token.id)).map((token) => `<button class="word-chip" type="button" data-action="hint-order-add" data-token="${escapeHtml(token.id)}">${escapeHtml(token.value)}</button>`).join('')}
      </div>
      <div class="button-row hint-recall-actions"><button class="ghost-button" type="button" data-action="show-hint-answer-again">Show once more</button><button class="primary-button" type="button" data-action="check-hint-order" ${session.hintRecallOrderSelected.length ? '' : 'disabled'}>Check recall</button></div>
    `;
  } else {
    interaction = `
      <form class="answer-input-wrap hint-recall-form" data-action="hint-recall-form">
        <input id="hint-recall-answer" class="answer-input ${session.hintRecallResult && !session.hintRecallResult.correct ? 'wrong' : ''}" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escapeHtml(session.hintRecallValue || '')}" placeholder="${exercise.answerKind === 'meaning' ? 'Type the meaning from memory…' : 'Type the Polish from memory…'}">
        <button class="primary-button" type="submit">Recall</button>
      </form>
      <div class="button-row hint-recall-actions"><button class="ghost-button" type="button" data-action="show-hint-answer-again">Show once more</button></div>
    `;
  }

  return `
    <div class="hint-recall-card recall">
      <span class="hint-recall-label">ACTIVE RECALL</span>
      ${interaction}
      ${session.hintRecallResult && !session.hintRecallResult.correct ? `<div class="hint-retry-note">${escapeHtml(session.hintRecallResult.message || 'Not yet—compare the shape and try once more.')}</div>` : ''}
    </div>
  `;
};

const renderSessionHintPanel = (exercise) => {
  if (!session.hintStack.length) return '';
  const hint = session.hintStack.at(-1);
  const primaryCopy = state.settings.showEnglish ? hint.en : hint.nl;
  const secondaryCopy = state.settings.showEnglish && state.settings.showDutch ? hint.nl : '';
  const hideCopyForRecall = hint.level === 5 && session.hintRecallPhase === 'recall';
  return `
    <section class="progressive-hint level-${hint.level}" aria-live="polite">
      <div class="hint-head">
        <span class="hint-icon">${icon(hint.level >= 4 ? 'brain' : 'lightbulb')}</span>
        <span><strong>Hint ${hint.level} of 5</strong><small>${escapeHtml(hint.title || '')}</small></span>
        ${renderHintMeter(hint.level)}
      </div>
      ${hideCopyForRecall ? `<p class="hint-primary">The model answer is hidden. Retrieve it once now.</p>` : `<p class="hint-primary">${escapeHtml(primaryCopy || '')}</p>${secondaryCopy ? `<p class="hint-secondary" lang="nl">${escapeHtml(secondaryCopy)}</p>` : ''}`}
    </section>
    ${renderSessionHintRecall(exercise)}
  `;
};


const renderCompleteSessionFooter = () => `
  <div class="session-footer-inner complete-mode">
    <button class="primary-button complete-primary" type="button" data-action="finish-session">
      <span>Return to Today</span>${icon('arrow')}
    </button>
    <button class="secondary-button complete-secondary" type="button" data-action="session-to-talk">
      ${icon('message')} Use it in conversation
    </button>
  </div>
`;

const renderSession = () => {
  if (!session) return;
  const complete = session.index >= session.exercises.length;
  if (complete && !session.summarySaved) finalizeSession();
  const focusTarget = session.autofocusTarget;
  session.autofocusTarget = null;

  modalRoot.innerHTML = `
    <div class="session-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(session.title)}">
      <header class="session-topbar">
        <button class="icon-button" type="button" data-action="close-session" aria-label="Close session">${icon('close')}</button>
        <div class="session-progress-wrap">
          <div class="progress-track"><span style="width:${complete ? 100 : Math.round(session.index / session.exercises.length * 100)}%"></span></div>
          <span>${Math.min(session.index + 1, session.exercises.length)} / ${session.exercises.length}</span>
        </div>
        <span class="session-score">${icon('target')} ${session.score}</span>
      </header>
      <main class="session-stage">
        ${complete ? renderSessionSummary() : renderExercise(currentExercise())}
      </main>
      <footer class="session-footer">
        ${complete ? renderCompleteSessionFooter() : renderSessionFooter()}
      </footer>
    </div>
  `;
  hydrateStaticIcons(modalRoot);
  requestAnimationFrame(() => syncVisualViewport());

  if (!complete && focusTarget === 'recall' && session.hintRecallPhase === 'recall' && !session.answered) {
    setTimeout(() => {
      document.getElementById('hint-recall-answer')?.focus({ preventScroll: true });
      syncVisualViewport();
    }, 50);
  } else if (!complete && focusTarget === 'answer' && currentExercise()?.type === 'typing' && !session.answered) {
    setTimeout(() => {
      document.getElementById('session-answer')?.focus({ preventScroll: true });
      syncVisualViewport();
    }, 50);
  }
};

const renderExercise = (exercise) => {
  if (!exercise) return '';
  let interaction = '';

  // Never expose a translation while that translation is the answer.
  // The instruction check also protects sessions created by older app versions.
  const testsMeaning = exercise.answerKind === 'meaning'
    || ((exercise.type === 'choice' || exercise.type === 'listening')
      && /choose the meaning/i.test(exercise.instruction || ''));
  const visibleSubText = !session.answered && testsMeaning
    ? (exercise.safeHint || (exercise.itemType === 'word' ? exercise.source?.type : 'Translation hidden until you answer.'))
    : (exercise.subText || '');

  const mainTextMarkup = ((exercise.answerKind === 'meaning' && exercise.type !== 'listening') || exercise.type === 'speaking')
    ? polishInteractive(exercise.mainText)
    : escapeHtml(exercise.mainText);

  if (exercise.type === 'choice' || exercise.type === 'listening') {
    interaction = `
      ${exercise.type === 'listening' ? `<button class="listen-button" type="button" data-action="speak" data-text="${escapeHtml(exercise.audioText)}" aria-label="Play Polish audio">${icon('volume')}</button>` : ''}
      <div class="answer-options">
        ${exercise.options.map((option, index) => {
          const selected = session.selectedOption === option;
          const isCorrect = normalizeText(option, { loose: true }) === normalizeText(exercise.answer, { loose: true });
          const className = session.answered
            ? isCorrect ? 'correct' : selected ? 'wrong' : ''
            : '';
          return `
            <button class="answer-option ${className}" type="button" data-action="session-choice" data-option="${escapeHtml(option)}" ${session.answered ? 'disabled' : ''}>
              <span class="option-letter">${String.fromCharCode(65 + index)}</span>
              <strong>${escapeHtml(option)}</strong>
            </button>
          `;
        }).join('')}
      </div>
    `;
  } else if (exercise.type === 'typing') {
    interaction = `
      <form class="answer-input-wrap" data-action="session-typing-form">
        <input id="session-answer" class="answer-input ${session.answered ? session.answerResult?.correct ? 'correct' : 'wrong' : ''}" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escapeHtml(session.typedAnswer || '')}" placeholder="Type the Polish sentence…" ${session.answered ? 'disabled' : ''}>
        <button class="primary-button" type="submit" ${session.answered ? 'disabled' : ''}>Check</button>
      </form>
    `;
  } else if (exercise.type === 'ordering') {
    const selectedIds = new Set(session.orderSelected.map((token) => token.id));
    interaction = `
      <div class="order-zone" aria-label="Your sentence">
        ${session.orderSelected.map((token) => `<button class="word-chip" type="button" data-action="order-remove" data-token="${escapeHtml(token.id)}" ${session.answered ? 'disabled' : ''}>${escapeHtml(token.value)}</button>`).join('') || '<span style="color:var(--muted);font-size:10px;padding:8px">Tap words below to build the sentence.</span>'}
      </div>
      <div class="order-bank">
        ${exercise.tokens.filter((token) => !selectedIds.has(token.id)).map((token) => `<button class="word-chip" type="button" data-action="order-add" data-token="${escapeHtml(token.id)}" ${session.answered ? 'disabled' : ''}>${escapeHtml(token.value)}</button>`).join('')}
      </div>
      <div class="button-row" style="margin-top:12px;justify-content:flex-end"><button class="primary-button" type="button" data-action="check-order" ${session.answered || !session.orderSelected.length ? 'disabled' : ''}>Check sentence</button></div>
    `;
  } else if (exercise.type === 'speaking') {
    interaction = `
      <div class="speaking-panel">
        <button class="record-orb" type="button" data-action="record-speech" aria-label="Record yourself">${icon('mic')}</button>
        <strong>${session.answered ? 'Recording saved locally for this exercise' : 'Tap, speak, and tap again—or let it stop automatically'}</strong>
        <p>No audio leaves this device. Compare rhythm and confidence, not accent perfection.</p>
        ${session.recordingUrl ? `<audio controls src="${session.recordingUrl}" style="width:min(100%,360px);margin-top:13px"></audio>` : ''}
        <div class="button-row" style="margin-top:13px;justify-content:center">
          <button class="secondary-button" type="button" data-action="speak" data-text="${escapeHtml(exercise.audioText)}">${icon('volume')} Hear model</button>
          ${!session.answered ? `<button class="ghost-button" type="button" data-action="complete-speaking">I said it without recording</button>` : ''}
        </div>
      </div>
    `;
  }

  const adaptiveSupportNote = exercise.adaptiveSupportAdjusted ? `
    <div class="adaptive-scaffold-note level-${Number(exercise.adaptiveSupportLevel || 1)}">
      <span class="adaptive-scaffold-icon">${icon('sparkles')}</span>
      <span>
        <strong>${Number(exercise.adaptiveSupportLevel || 0) >= 2 ? 'Recognition first' : 'Word tiles this time'}</strong>
        <small>${escapeHtml(exercise.adaptiveSupportReason || 'Blisko made this step smaller because this sentence needed support before.')}</small>
        ${state.settings.showDutch ? `<em lang="nl">Na een paar zelfstandige goede antwoorden wordt de oefening weer moeilijker.</em>` : ''}
      </span>
    </div>
  ` : '';

  return `
    <article class="exercise-card">
      <div class="exercise-eyebrow"><span>${escapeHtml(exercise.instruction)}</span><span class="exercise-skill">${escapeHtml(exercise.skill)}</span></div>
      ${adaptiveSupportNote}
      <p class="exercise-prompt">${exercise.type === 'listening' ? 'Catch the message, not every sound.' : exercise.type === 'speaking' ? 'Read once, then look away if you can.' : 'Use the whole phrase as a speaking block.'}</p>
      <div class="exercise-main-text" ${((exercise.answerKind === 'meaning' && exercise.type !== 'listening') || exercise.type === 'speaking') ? 'lang="pl"' : ''}>${mainTextMarkup}</div>
      ${visibleSubText ? `<div class="exercise-subtext${testsMeaning && !session.answered ? ' protected' : ''}">${escapeHtml(visibleSubText)}</div>` : '<div class="exercise-subtext empty" aria-hidden="true"></div>'}
      ${renderSessionHintPanel(exercise)}
      ${session.hintLevel === 5 && !session.answered ? '' : interaction}
      ${session.answered ? renderExerciseFeedback(exercise) : ''}
    </article>
  `;
};

const renderExerciseFeedback = (exercise) => {
  const result = session.answerResult || { correct: true, message: 'Done.', errorType: 'exact' };
  const feedbackClass = result.correct ? 'correct' : 'wrong';
  const item = ITEM_MAP.get(exercise.itemId);
  const concept = result.concept || (item?.grammar || []).map((id) => CONCEPT_MAP.get(id)).find(Boolean);
  const testsMeaning = exercise.answerKind === 'meaning'
    || ((exercise.type === 'choice' || exercise.type === 'listening')
      && /choose the meaning/i.test(exercise.instruction || ''));
  const meaningReveal = testsMeaning && item
    ? `<div class="feedback-meaning"><span><strong>NL</strong> ${escapeHtml(item.nl || '')}</span><span><strong>EN</strong> ${escapeHtml(item.en || '')}</span></div>`
    : '';
  const hintSummary = session.hintLevel
    ? `<div class="feedback-hint-summary">${icon('lightbulb')} Hint level ${session.hintLevel} used${session.hintRecallCompleted ? ' · active recall completed' : ''}. The next interval will stay appropriately shorter.</div>`
    : '<div class="feedback-hint-summary independent">Retrieved without support.</div>';
  const verdict = result.verdict || (result.correct ? 'Good retrieval' : result.close ? 'Almost there' : 'Build this memory again');
  const showModel = !result.correct || !['exact', 'accepted_alternative'].includes(result.errorType || '') || exercise.type === 'speaking';
  const secondaryFeedback = state.settings.showDutch && result.messageNl
    ? `<p class="feedback-secondary" lang="nl">${escapeHtml(result.messageNl)}</p>`
    : '';
  const errorLabel = (result.errorType || '').replaceAll('_', ' ');
  const conceptExplanation = concept
    ? `<div class="feedback-coach-note"><strong>${escapeHtml(concept.title || 'Why this form works')}</strong><p>${escapeHtml(state.settings.showEnglish === false ? concept.nl : concept.en)}</p>${state.settings.showDutch && state.settings.showEnglish && concept.nl ? `<small lang="nl">${escapeHtml(concept.nl)}</small>` : ''}${concept.commonMistake ? `<em>${escapeHtml(concept.commonMistake)}</em>` : ''}</div>`
    : '';
  const morphologyExplanation = Array.isArray(result.morphology) && result.morphology.length
    ? `<div class="feedback-morphology"><div class="feedback-morphology-head"><span>${icon('brain')}</span><div><strong>Form detective</strong><small>Tap a repair to inspect the ending in context.</small></div></div>${result.morphology.map((detail) => `<button type="button" data-action="open-morphology" data-word="${escapeHtml(detail.expected || detail.learner || '')}" data-sentence="${escapeHtml(result.expected || exercise.answer || '')}"><span>${escapeHtml(detail.title || 'Polish form')}</span><p>${escapeHtml(detail.en || '')}</p>${state.settings.showDutch && detail.nl ? `<small lang="nl">${escapeHtml(detail.nl)}</small>` : ''}</button>`).join('')}</div>`
    : '';
  return `
    <div class="feedback-box ${feedbackClass}">
      <div class="feedback-verdict-row"><h4>${escapeHtml(verdict)}</h4>${errorLabel ? `<span class="feedback-error-chip">${escapeHtml(errorLabel)}</span>` : ''}</div>
      <p>${escapeHtml(result.message || '')}</p>
      ${secondaryFeedback}
      ${showModel ? `<div class="feedback-model-answer"><span>Model answer · tap a word to explain it</span><strong lang="pl">${polishInteractive(result.expected || exercise.answer)}</strong></div>` : ''}
      ${meaningReveal}
      ${morphologyExplanation}
      ${conceptExplanation}
      ${hintSummary}
    </div>
  `;
};

const renderSessionFooter = () => {
  if (!session.answered) {
    const hintLocked = session.hintLevel >= 5;
    return `
      <div class="session-footer-inner pre-answer">
        <span class="rating-prompt">Try first, then ask for only as much support as you need.</span>
        <button class="progressive-hint-button level-${session.hintLevel}" type="button" data-action="request-hint" ${hintLocked ? 'disabled' : ''}>${icon('lightbulb')} <span><strong>${hintLocked ? 'Full support active' : sessionHintButtonLabel()}</strong><small>${session.hintLevel} / 5 used</small></span></button>
        <button class="ghost-button" type="button" data-action="skip-exercise">Skip for now</button>
      </div>
    `;
  }
  return `
    <div class="session-footer-inner rating-mode">
      <span class="rating-prompt">How did this retrieval feel?</span>
      <button class="almost-button" type="button" data-action="rate-almost">${icon('brain')}<span><strong>I almost knew it</strong><small>review sooner</small></span></button>
      <button class="rating-button again" type="button" data-action="rate-exercise" data-rating="0"><strong>Again</strong><span>8 min</span></button>
      <button class="rating-button hard" type="button" data-action="rate-exercise" data-rating="1"><strong>Hard</strong><span>today</span></button>
      <button class="rating-button good" type="button" data-action="rate-exercise" data-rating="2"><strong>Good</strong><span>later</span></button>
      <button class="rating-button easy" type="button" data-action="rate-exercise" data-rating="3"><strong>Easy</strong><span>much later</span></button>
    </div>
  `;
};

const finalizeSession = () => {
  if (!session || session.summarySaved) return;
  const minutes = Math.max(2, Math.round((Date.now() - session.startedAt) / 60_000), Math.ceil(session.exercises.length * 0.45));
  state.stats.sessions += 1;
  addActivity(state, { minutes });
  session.minutes = minutes;
  session.summarySaved = true;
  save({ immediate: true });
};

const renderSessionSummary = () => {
  const correct = session.results.filter((result) => result.correct).length;
  const strong = session.results.filter((result) => result.rating >= 2 && (result.hintLevel || 0) <= 1).length;
  const newItems = session.results.filter((result) => result.wasNew).length;
  const hinted = session.results.filter((result) => (result.hintLevel || 0) > 0).length;
  const recovered = session.results.filter((result) => result.activeRecallCompleted).length;
  const almost = session.results.filter((result) => result.confidenceState === 'almost').length;
  const independent = session.results.filter((result) => (result.hintLevel || 0) === 0 && result.correct).length;
  const metrics = getMetrics(state);
  const supportCopy = hinted
    ? `${hinted} item${hinted === 1 ? '' : 's'} needed support${recovered ? `; ${recovered} were recovered through active recall` : ''}. ${almost ? `${almost} “almost knew it” signal${almost === 1 ? '' : 's'} will bring material back sooner.` : 'Future reviews will reduce the support gradually.'}`
    : `All ${independent} correct retrieval${independent === 1 ? '' : 's'} were independent. That is the strongest evidence the coach can collect.`;
  return `
    <section class="session-summary">
      <div class="summary-icon">✓</div>
      <h2>Dobra robota, ${escapeHtml(state.profile.name)}.</h2>
      <p>The coach has already changed future intervals and noted how much support each memory needed.</p>
      <div class="summary-grid">
        <div class="summary-stat"><strong>${correct}/${session.exercises.length}</strong><span>retrieved correctly</span></div>
        <div class="summary-stat"><strong>${strong}</strong><span>strong without heavy hints</span></div>
        <div class="summary-stat"><strong>${session.minutes || 0} min</strong><span>focused practice</span></div>
      </div>
      <div class="hint-session-recap ${hinted ? 'supported' : 'independent'}">
        <span>${icon(hinted ? 'lightbulb' : 'brain')}</span>
        <div><strong>${hinted ? 'Support became evidence' : 'Independent retrieval'}</strong><p>${escapeHtml(supportCopy)}</p></div>
      </div>
      <div class="feedback-box correct" style="text-align:left;margin-bottom:20px">
        <h4>What changed</h4>
        <p>${newItems ? `${newItems} new item${newItems === 1 ? '' : 's'} entered your memory model. ` : ''}${metrics.unlockedConversations ? `You can now handle ${metrics.unlockedConversations} tracked scenarios at basic readiness.` : 'Your first conversation-readiness signals are now being collected.'}</p>
      </div>
      <p class="summary-action-note">Your next action is ready below.</p>
    </section>
  `;
};

const resetExerciseState = () => {
  if (session.recordingUrl) URL.revokeObjectURL(session.recordingUrl);
  session.answered = false;
  session.answerResult = null;
  session.selectedOption = null;
  session.typedAnswer = '';
  session.orderSelected = [];
  session.recordingUrl = null;
  session.hintLevel = 0;
  session.hintStack = [];
  session.hintPartialIndex = 0;
  session.hintRecallPhase = null;
  session.hintRecallValue = '';
  session.hintRecallResult = null;
  session.hintRecallTokens = [];
  session.hintRecallOrderSelected = [];
  session.hintRecallCompleted = false;
  session.autofocusTarget = currentExercise()?.type === 'typing' ? 'answer' : null;
};

const requestSessionHint = () => {
  if (!session || session.answered || session.hintLevel >= 5) return;
  const exercise = currentExercise();
  if (!exercise) return;
  const nextLevel = session.hintLevel + 1;
  const progress = exercise.itemId ? state.progress.items[exercise.itemId] : null;
  const hint = generateExerciseHint(exercise, progress, nextLevel, {
    partialIndex: session.hintPartialIndex,
    interfaceLanguage: 'en',
  });
  session.hintLevel = nextLevel;
  session.hintStack.push(hint);
  session.autofocusTarget = null;
  if (nextLevel === 3) session.hintPartialIndex += 1;
  if (nextLevel === 5) {
    session.hintRecallPhase = 'study';
    session.hintRecallCompleted = false;
    session.hintRecallResult = null;
  }
  recordHintUse(state, {
    itemId: exercise.itemId,
    level: nextLevel,
    exerciseType: exercise.type,
    context: session.mode === 'review' ? 'review' : 'session',
    conceptId: exercise.grammar?.[0] || null,
    patternId: exercise.patternId || null,
  });
  save();
  haptic(6);
  renderSession();
};

const beginSessionHintRecall = () => {
  if (!session || session.hintLevel < 5 || session.answered) return;
  const exercise = currentExercise();
  const cleanAnswer = String(exercise?.answer || '').replace(/[.!?]+$/g, '').trim();
  session.hintRecallPhase = 'recall';
  session.hintRecallValue = '';
  session.hintRecallResult = null;
  session.hintRecallOrderSelected = [];
  session.hintRecallTokens = shuffle(
    cleanAnswer.split(/\s+/).filter(Boolean).map((value, index) => ({ id: `hint-${index}-${value}`, value })),
    `${exercise?.id || 'hint'}-active-recall`,
  );
  session.autofocusTarget = !['speaking', 'ordering'].includes(exercise?.type) ? 'recall' : null;
  renderSession();
};

const showSessionHintAnswerAgain = () => {
  if (!session || session.hintLevel < 5 || session.answered) return;
  session.hintRecallPhase = 'study';
  session.hintRecallValue = '';
  session.hintRecallResult = null;
  session.hintRecallOrderSelected = [];
  renderSession();
};

const completeSessionHintRecall = (result, { speaking = false } = {}) => {
  if (!session || session.answered) return;
  const accepted = speaking || result.correct || result.close;
  if (!accepted) {
    session.hintRecallResult = result;
    renderSession();
    return;
  }
  session.hintRecallCompleted = true;
  session.hintRecallPhase = 'complete';
  session.answerResult = {
    ...result,
    correct: true,
    close: !speaking && !result.correct,
    score: speaking ? 0.64 : Math.max(result.score || 0, result.correct ? 0.82 : 0.7),
    message: speaking
      ? 'Recovered aloud after full support. This will return soon for a more independent attempt.'
      : result.correct
        ? 'Recovered after full support. The coach will schedule a shorter interval so it becomes independent.'
        : 'Close enough for the recovery step. The item will return soon so the ending becomes automatic.',
  };
  session.answered = true;
  haptic(10);
  renderSession();
};

const checkSessionHintRecall = () => {
  if (!session || session.answered || session.hintRecallPhase !== 'recall') return;
  const input = document.getElementById('hint-recall-answer');
  const value = input?.value?.trim() || '';
  if (!value) {
    showToast('Retrieve something first', 'Even an imperfect attempt strengthens the active-recall step.', 'lightbulb');
    return;
  }
  session.hintRecallValue = value;
  completeSessionHintRecall(evaluateExerciseAnswer(value));
};

const checkSessionHintOrder = () => {
  if (!session || session.answered || session.hintRecallPhase !== 'recall') return;
  const value = session.hintRecallOrderSelected.map((token) => token.value).join(' ');
  if (!value) return;
  completeSessionHintRecall(evaluateExerciseAnswer(value));
};

const completeSessionHintRecallSpeaking = () => {
  completeSessionHintRecall({ correct: true, close: false, score: 0.64 }, { speaking: true });
};

const answerChoice = (option) => {
  if (!session || session.answered) return;
  const exercise = currentExercise();
  const result = evaluateExerciseAnswer(option, exercise);
  session.selectedOption = option;
  session.answerResult = result;
  session.answered = true;
  haptic(result.correct ? 8 : [20, 35, 20]);
  renderSession();
};

const checkTypedAnswer = () => {
  if (!session || session.answered) return;
  const input = document.getElementById('session-answer');
  const value = input?.value?.trim() || '';
  if (!value) {
    showToast('Type an answer first', 'A rough attempt gives the coach useful evidence.', 'alert');
    return;
  }
  session.typedAnswer = value;
  session.answerResult = evaluateExerciseAnswer(value);
  session.answered = true;
  haptic(session.answerResult.correct ? 8 : [20, 35, 20]);
  renderSession();
};

const checkOrderedAnswer = () => {
  if (!session || session.answered) return;
  const value = session.orderSelected.map((token) => token.value).join(' ');
  session.answerResult = evaluateExerciseAnswer(value);
  session.answered = true;
  haptic(session.answerResult.correct ? 8 : [20, 35, 20]);
  renderSession();
};

const completeSpeaking = (score = 0.68) => {
  if (!session || session.answered) return;
  session.answerResult = {
    correct: true,
    close: false,
    score,
    message: 'Speaking completed. Use your confidence rating below to control the next interval.',
  };
  session.answered = true;
  renderSession();
};

const startLocalRecording = async () => {
  if (!session || session.answered) return;
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showToast('Recording is unavailable', 'Use “I said it” to self-rate this speaking turn.', 'alert');
    return;
  }

  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingChunks = [];
    mediaRecorder = new MediaRecorder(recordingStream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size) recordingChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordingChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      session.recordingUrl = URL.createObjectURL(blob);
      recordingStream?.getTracks().forEach((track) => track.stop());
      recordingStream = null;
      mediaRecorder = null;
      completeSpeaking(0.72);
    };
    mediaRecorder.start();
    const button = modalRoot.querySelector('[data-action="record-speech"]');
    button?.classList.add('recording');
    button?.setAttribute('aria-label', 'Stop recording');
    showToast('Recording locally', 'Tap again to stop. It will also stop after six seconds.', 'mic');
    setTimeout(() => {
      if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    }, 6000);
  } catch {
    showToast('Microphone permission was not available', 'You can still say the phrase and self-rate it.', 'alert');
  }
};

const rateCurrentExercise = (rating, confidenceState = null) => {
  if (!session || !session.answered) return;
  const exercise = currentExercise();
  const itemProgressBefore = exercise.itemId ? state.progress.items[exercise.itemId] : null;
  const patternProgressBefore = exercise.patternId ? state.progress.patterns?.[exercise.patternId] : null;
  const result = session.answerResult || { correct: true, score: 0.7 };
  const reviewEvidence = {
    type: exercise.type,
    correct: result.correct,
    score: result.score,
    hintLevel: session.hintLevel,
    hintsUsed: session.hintStack.length,
    activeRecallCompleted: session.hintRecallCompleted,
    confidenceState,
    adaptiveSupportLevel: Number(exercise.adaptiveSupportLevel || 0),
    originalExerciseType: exercise.originalExerciseType || null,
    skillKey: getExerciseSkill(exercise),
    errorType: result.errorType || null,
    source: session.mode === 'review' ? 'review session' : 'smart session',
  };
  if (exercise.itemId) reviewItem(state, exercise.itemId, rating, reviewEvidence);
  else if (exercise.patternId) {
    recordPatternPractice(state, exercise.patternId, rating, reviewEvidence);
    if (session.hintRecallCompleted) {
      state.stats.activeRecallCompletions = Number(state.stats.activeRecallCompletions || 0) + 1;
      if (result.correct) state.stats.hintRecoveries = Number(state.stats.hintRecoveries || 0) + 1;
    }
  }

  // Compute this once for every exercise. Item reviews also use it later
  // when scoring the completed session. Keeping it inside the pattern-only
  // branch caused the rating buttons to throw for normal vocabulary items.
  const evidenceWeight = getHintEvidenceWeight(session.hintLevel);

  // Item-specific skill evidence is recorded inside reviewItem so a reading
  // success never masks weak listening or free production for the same phrase.
  if (!exercise.itemId) {
    const almostWeight = confidenceState === 'almost' ? 0.62 : 1;
    const skillKey = getExerciseSkill(exercise);
    const skillScore = (result.correct ? Math.max(0.65, result.score || Number(rating) / 3) : result.score || 0.2) * evidenceWeight * almostWeight;
    recordSkillEvidence(state, skillKey, skillScore, {
      correct: result.correct,
      hintLevel: session.hintLevel,
      source: 'pattern practice',
    });
    if (exercise.type === 'typing' || exercise.type === 'ordering') {
      recordSkillEvidence(state, 'grammar', skillScore, { correct: result.correct, hintLevel: session.hintLevel, source: 'pattern practice' });
    }
  }

  session.results.push({
    itemId: exercise.itemId,
    patternId: exercise.patternId || null,
    correct: Boolean(result.correct),
    rating: Number(rating),
    confidenceState,
    hintLevel: session.hintLevel,
    activeRecallCompleted: session.hintRecallCompleted,
    adaptiveSupportLevel: Number(exercise.adaptiveSupportLevel || 0),
    originalExerciseType: exercise.originalExerciseType || null,
    wasNew: exercise.itemId ? !itemProgressBefore : !patternProgressBefore,
  });
  if (result.correct) session.score += Math.max(1, Math.round((Number(rating) + 1) * evidenceWeight));
  session.index += 1;
  resetExerciseState();
  save();
  renderSession();
};

const rateCurrentExerciseAlmost = () => rateCurrentExercise(1, 'almost');

const skipCurrentExercise = () => {
  if (!session) return;
  session.answerResult = { correct: false, close: false, score: 0, message: 'Skipped. The item will stay near the front of the queue.' };
  session.answered = true;
  renderSession();
};

const closeSession = ({ force = false } = {}) => {
  if (!session) return;
  const complete = session.index >= session.exercises.length;
  if (!force && !complete && session.index > 0 && !window.confirm('End this session? Your completed reviews are already saved.')) return;
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  if (session.recordingUrl) URL.revokeObjectURL(session.recordingUrl);
  session = null;
  modalRoot.innerHTML = '';
  document.body.style.overflow = '';
  document.body.classList.remove('session-keyboard-open');
  syncVisualViewport();
  updateShell();
  renderView();
};

const openGame = (gameId) => {
  if (gameId === 'ordering') {
    const itemIds = PHRASES
      .filter((phrase) => phrase.pl.split(/\s+/).length >= 4)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 7)
      .map((phrase) => phrase.id);
    startSession({ mode: 'review', itemIds, title: 'Sentence ordering' });
    return;
  }
  if (gameId === 'listening') {
    startSession({ mode: 'listening', length: 7, title: 'Listening quiz' });
    return;
  }
  if (gameId === 'family-challenge') {
    state.conversation.selectedPersona = 'mother-in-law';
    delete state.conversation.transcripts['mother-in-law'];
    navigate('talk');
    return;
  }

  const wordPool = getReviewQueue(state, 20)
    .map((entry) => entry.item)
    .filter((item) => item.itemType === 'word');
  const fallback = WORDS.slice().sort((a, b) => a.frequency - b.frequency);
  const selected = [...wordPool, ...fallback]
    .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, gameId === 'rapid' ? 10 : 6);

  if (gameId === 'rapid') {
    activeGame = {
      type: 'rapid',
      items: selected,
      index: 0,
      score: 0,
      answered: false,
      selected: null,
      result: null,
      hintLevel: 0,
      hintStack: [],
      hintPartialIndex: 0,
      hintRecallPhase: null,
      hintRecallValue: '',
      hintRecallResult: null,
      activeRecallCompleted: false,
      finished: false,
      startedAt: Date.now(),
    };
  } else {
    const tiles = shuffle(selected.flatMap((item) => [
      { id: `${item.id}-pl`, pairId: item.id, side: 'pl', text: item.pl, matched: false, revealed: gameId !== 'memory' },
      { id: `${item.id}-meaning`, pairId: item.id, side: 'meaning', text: primaryTranslation(item), matched: false, revealed: gameId !== 'memory' },
    ]), `${gameId}-${Date.now()}`);
    activeGame = {
      type: gameId,
      tiles,
      selectedIds: [],
      matchedPairs: 0,
      moves: 0,
      locked: false,
      hintLevel: 0,
      hintStack: [],
      hintTargetPairId: null,
      hintRecallPhase: null,
      hintActiveRecallCompleted: false,
      lastMatch: null,
      finished: false,
      startedAt: Date.now(),
    };
  }
  renderGameModal();
};

const renderGameModal = () => {
  if (!activeGame) return;
  const gameInfo = GAME_TYPES.find((game) => game.id === activeGame.type);
  openModal(`
    <header class="modal-header">
      <div><h2>${escapeHtml(gameInfo?.title || 'Mini game')}</h2><p>${escapeHtml(gameInfo?.description || '')}</p></div>
      <button class="modal-close" type="button" data-action="modal-close" aria-label="Close">${icon('close')}</button>
    </header>
    <div class="modal-body game-modal-content">
      ${activeGame.type === 'rapid' ? renderRapidGame() : renderMatchingGame()}
    </div>
  `, { wide: true, label: gameInfo?.title || 'Mini game' });
};

const rapidExerciseForItem = (item) => ({
  id: `rapid-${item.id}`,
  itemId: item.id,
  itemType: 'word',
  type: 'choice',
  answerKind: 'meaning',
  skill: 'Rapid vocabulary',
  answer: primaryTranslation(item),
  source: { ...item, itemType: 'word' },
  translations: { nl: item.nl || '', en: item.en || '' },
  grammar: item.grammar || [],
});

const resetRapidHintState = () => {
  if (!activeGame || activeGame.type !== 'rapid') return;
  activeGame.hintLevel = 0;
  activeGame.hintStack = [];
  activeGame.hintPartialIndex = 0;
  activeGame.hintRecallPhase = null;
  activeGame.hintRecallValue = '';
  activeGame.hintRecallResult = null;
  activeGame.activeRecallCompleted = false;
};

const renderRapidHintPanel = (item) => {
  const hint = activeGame.hintStack?.at(-1);
  if (!hint) return '';
  const hideModel = activeGame.hintLevel === 5 && activeGame.hintRecallPhase === 'recall';
  const primaryCopy = state.settings.showEnglish ? hint.en : hint.nl;
  const secondaryCopy = state.settings.showEnglish && state.settings.showDutch ? hint.nl : '';
  return `
    <div class="progressive-hint game-progressive-hint level-${hint.level}">
      <div class="hint-head"><span class="hint-icon">${icon(hint.level >= 4 ? 'brain' : 'lightbulb')}</span><span><strong>Hint ${hint.level} of 5</strong><small>${escapeHtml(hint.title || '')}</small></span>${renderHintMeter(hint.level)}</div>
      <p class="hint-primary">${escapeHtml(hideModel ? 'The meaning is hidden. Type it from memory before continuing.' : primaryCopy || '')}</p>
      ${!hideModel && secondaryCopy ? `<p class="hint-secondary" lang="nl">${escapeHtml(secondaryCopy)}</p>` : ''}
    </div>
  `;
};

const maskGameText = (value = '', keepFirst = false) => String(value).split(/(\s+)/).map((part) => {
  if (/^\s+$/.test(part)) return part;
  const letters = [...part];
  if (!letters.length) return part;
  return `${keepFirst ? letters[0] : ''}${'_'.repeat(Math.max(2, letters.length - (keepFirst ? 1 : 0)))}`;
}).join('');

const getMatchingHintTarget = () => {
  if (!activeGame || activeGame.type === 'rapid') return null;
  const unmatchedPairIds = [...new Set(activeGame.tiles.filter((tile) => !tile.matched).map((tile) => tile.pairId))];
  if (!unmatchedPairIds.length) return null;
  if (!activeGame.hintTargetPairId || !unmatchedPairIds.includes(activeGame.hintTargetPairId)) {
    activeGame.hintTargetPairId = unmatchedPairIds
      .slice()
      .sort((left, right) => (state.progress.items[left]?.confidence || 0) - (state.progress.items[right]?.confidence || 0))[0];
  }
  return ITEM_MAP.get(activeGame.hintTargetPairId) || null;
};

const buildMatchingHint = (item, level) => {
  const meaning = primaryTranslation(item);
  const secondary = secondaryTranslation(item);
  const firstPl = [...String(item.pl || '')][0] || '';
  const firstMeaning = [...String(meaning || '')][0] || '';
  if (level === 1) return {
    level, title: 'Gentle nudge',
    en: `Look for a ${item.type || 'word'} pair. The Polish side begins with “${firstPl}”; the meaning begins with “${firstMeaning}”.`,
    nl: `Zoek een paar met een ${item.type || 'woord'}. De Poolse kant begint met “${firstPl}”; de betekenis met “${firstMeaning}”.`,
  };
  if (level === 2) return {
    level, title: 'Pair structure',
    en: `Match this shape: ${maskGameText(item.pl, true)} ↔ ${maskGameText(meaning, true)}`,
    nl: `Koppel deze vorm: ${maskGameText(item.pl, true)} ↔ ${maskGameText(meaning, true)}`,
  };
  if (level === 3) return {
    level, title: 'One anchor card',
    en: `The Polish anchor is “${item.pl}”. Find its meaning without revealing the pair yet.`,
    nl: `Het Poolse anker is “${item.pl}”. Zoek de betekenis zonder het hele paar al te tonen.`,
  };
  if (level === 4) return {
    level, title: 'Meaning in context',
    en: `${item.example ? `Picture the line “${item.example}”. ` : ''}Use the word as a ${item.type || 'conversation word'}, not as an isolated translation.`,
    nl: `${item.example ? `Denk aan de zin “${item.example}”. ` : ''}Gebruik het als ${item.type || 'gesprekswoord'}, niet als losse vertaling.`,
  };
  return {
    level, title: 'Pair, then active recall',
    en: `Study the pair briefly: ${item.pl} ↔ ${meaning}`,
    nl: `Bekijk het paar kort: ${item.pl} ↔ ${meaning}${secondary ? ` (${secondary})` : ''}`,
    answer: `${item.pl} ↔ ${meaning}`,
    requiresRecall: true,
  };
};

const resetMatchingHintState = () => {
  if (!activeGame || activeGame.type === 'rapid') return;
  activeGame.hintLevel = 0;
  activeGame.hintStack = [];
  activeGame.hintTargetPairId = null;
  activeGame.hintRecallPhase = null;
  activeGame.hintActiveRecallCompleted = false;
};

const renderMatchingHintPanel = () => {
  const item = getMatchingHintTarget();
  const hint = activeGame.hintStack?.at(-1);
  if (!item || !hint) return '';
  const hideModel = activeGame.hintLevel === 5 && activeGame.hintRecallPhase === 'recall';
  const studyModel = activeGame.hintLevel === 5 && activeGame.hintRecallPhase === 'study';
  const primaryCopy = state.settings.showEnglish ? hint.en : hint.nl;
  const secondaryCopy = state.settings.showEnglish && state.settings.showDutch ? hint.nl : '';
  return `
    <div class="progressive-hint game-progressive-hint level-${hint.level}">
      <div class="hint-head"><span class="hint-icon">${icon(hint.level >= 4 ? 'brain' : 'lightbulb')}</span><span><strong>Hint ${hint.level} of 5</strong><small>${escapeHtml(hint.title || '')}</small></span>${renderHintMeter(hint.level)}</div>
      <p class="hint-primary">${escapeHtml(hideModel ? 'The pair is hidden again. Find both cards now.' : primaryCopy || '')}</p>
      ${!hideModel && secondaryCopy ? `<p class="hint-secondary" lang="nl">${escapeHtml(secondaryCopy)}</p>` : ''}
      ${studyModel ? `<div class="conversation-model-recall"><strong>${escapeHtml(hint.answer || '')}</strong><p>Hide it before selecting the cards.</p><button class="primary-button" type="button" data-action="begin-matching-recall">Hide pair and find it ${icon('arrow')}</button></div>` : ''}
    </div>
  `;
};

const renderMatchingGame = () => {
  if (activeGame.finished) {
    const label = activeGame.type === 'memory' ? 'memory pairs' : 'meaning pairs';
    return `
      <section class="session-summary" style="margin:auto">
        <div class="summary-icon">✓</div>
        <h2>All ${label} found.</h2>
        <p>${activeGame.moves} moves gave the coach evidence about what your brain links automatically, including where support was needed.</p>
        <div class="button-row" style="justify-content:center"><button class="primary-button" type="button" data-action="finish-game">Done</button><button class="secondary-button" type="button" data-action="restart-game" data-game="${activeGame.type}">Play again</button></div>
      </section>
    `;
  }
  const studyingPair = activeGame.hintLevel === 5 && activeGame.hintRecallPhase === 'study';
  return `
    <div>
      <div class="section-heading"><div><h3>${activeGame.matchedPairs} / ${activeGame.tiles.length / 2} pairs</h3><p>${activeGame.type === 'memory' ? 'Reveal two cards and connect Polish to meaning.' : 'Select one Polish tile and one meaning tile.'}</p></div><span class="soft-pill" style="padding:6px 9px;background:var(--green-soft);color:var(--green);font-size:9px">${activeGame.moves} moves</span></div>
      ${renderMatchingHintPanel()}
      ${activeGame.lastMatch ? `
        <div class="game-match-feedback">
          <span>${icon('check')} ${escapeHtml(ITEM_MAP.get(activeGame.lastMatch.pairId)?.pl || 'Pair')} connected</span>
          ${activeGame.lastMatch.almostKnown ? `<small>${icon('brain')} almost-known signal saved</small>` : `<button type="button" data-action="game-almost" data-pair="${escapeHtml(activeGame.lastMatch.pairId)}">${icon('brain')} I almost knew this</button>`}
        </div>
      ` : ''}
      <div class="match-grid ${studyingPair ? 'support-locked' : ''}">
        ${activeGame.tiles.map((tile) => {
          const selected = activeGame.selectedIds.includes(tile.id);
          const visible = tile.revealed || selected || tile.matched;
          return `
            <button class="match-tile ${selected ? 'selected' : ''} ${tile.matched ? 'matched' : ''}" type="button" data-action="game-tile" data-tile="${tile.id}" ${tile.matched || activeGame.locked || studyingPair ? 'disabled' : ''}>
              ${visible ? escapeHtml(tile.text) : '• • •'}
            </button>
          `;
        }).join('')}
      </div>
      <button class="progressive-hint-button game-hint-button level-${activeGame.hintLevel || 0}" type="button" data-action="matching-hint" ${(activeGame.hintLevel || 0) >= 5 ? 'disabled' : ''}>${icon('lightbulb')}<span><strong>${(activeGame.hintLevel || 0) >= 5 ? 'Full support used' : HINT_STEP_LABELS[Math.min(activeGame.hintLevel || 0, HINT_STEP_LABELS.length - 1)]}</strong><small>${activeGame.hintLevel || 0} / 5 · targets your weakest remaining pair</small></span></button>
    </div>
  `;
};

const rapidOptions = (item) => {
  const distractors = WORDS
    .filter((candidate) => candidate.id !== item.id && candidate.type === item.type)
    .concat(WORDS.filter((candidate) => candidate.id !== item.id))
    .filter((candidate, index, array) => array.findIndex((entry) => entry.nl === candidate.nl) === index)
    .slice(0, 3)
    .map((candidate) => primaryTranslation(candidate));
  return shuffle([primaryTranslation(item), ...distractors], `${item.id}-rapid`);
};

const renderRapidGame = () => {
  if (activeGame.finished) {
    return `
      <section class="session-summary" style="margin:auto">
        <div class="summary-icon">⚡</div>
        <h2>${activeGame.score} / ${activeGame.items.length} at speed.</h2>
        <p>Speed is only useful after meaning. Missed and heavily hinted items were moved closer in the adaptive queue.</p>
        <div class="button-row" style="justify-content:center"><button class="primary-button" type="button" data-action="finish-game">Done</button><button class="secondary-button" type="button" data-action="restart-game" data-game="rapid">Again</button></div>
      </section>
    `;
  }
  const item = activeGame.items[activeGame.index];
  const options = rapidOptions(item);
  const studyingModel = activeGame.hintLevel === 5 && activeGame.hintRecallPhase === 'study';
  const recallingModel = activeGame.hintLevel === 5 && activeGame.hintRecallPhase === 'recall';
  return `
    <div>
      <div class="rapid-timer"><span style="--time:${100 - activeGame.index / activeGame.items.length * 100}%"></span></div>
      <div class="rapid-card"><strong>${escapeHtml(item.pl)}</strong><span>${escapeHtml(item.type)} · ${activeGame.index + 1} / ${activeGame.items.length}</span><button class="text-button" type="button" data-action="speak" data-text="${escapeHtml(item.pl)}">${icon('volume')} Listen</button></div>
      ${renderRapidHintPanel(item)}
      ${studyingModel ? `
        <div class="hint-recall-card study game-recall-card">
          <span class="hint-recall-label">STUDY BRIEFLY</span>
          <strong class="hint-answer-display">${escapeHtml(primaryTranslation(item))}</strong>
          <p>The meaning will disappear. Type it once from memory.</p>
          <button class="primary-button" type="button" data-action="begin-rapid-recall">Hide it and recall ${icon('arrow')}</button>
        </div>
      ` : recallingModel && !activeGame.answered ? `
        <form class="answer-input-wrap hint-recall-form rapid-hint-recall-form" data-action="rapid-hint-recall-form">
          <input class="answer-input ${activeGame.hintRecallResult && !activeGame.hintRecallResult.correct ? 'wrong' : ''}" name="answer" type="text" autocomplete="off" value="${escapeHtml(activeGame.hintRecallValue || '')}" placeholder="Type the meaning from memory…">
          <button class="primary-button" type="submit">Recall</button>
        </form>
        ${activeGame.hintRecallResult && !activeGame.hintRecallResult.correct ? `<div class="hint-retry-note">${escapeHtml(activeGame.hintRecallResult.message || 'Not yet—try once more.')}</div>` : ''}
      ` : `
        <div class="answer-options" style="margin-top:13px">
          ${options.map((option, index) => {
            const correct = normalizeText(option, { loose: true }) === normalizeText(primaryTranslation(item), { loose: true });
            const selected = activeGame.selected === option;
            const className = activeGame.answered ? correct ? 'correct' : selected ? 'wrong' : '' : '';
            return `<button class="answer-option ${className}" type="button" data-action="rapid-answer" data-option="${escapeHtml(option)}" ${activeGame.answered ? 'disabled' : ''}><span class="option-letter">${String.fromCharCode(65 + index)}</span><strong>${escapeHtml(option)}</strong></button>`;
          }).join('')}
        </div>
      `}
      ${activeGame.answered ? `
        <div class="game-answer-footer">
          <div class="game-answer-result ${activeGame.result?.correct ? 'correct' : 'wrong'}"><strong>${activeGame.result?.correct ? 'Good retrieval' : 'Not yet'}</strong><span>${activeGame.hintLevel ? `Hint level ${activeGame.hintLevel}${activeGame.activeRecallCompleted ? ' · active recall completed' : ''}` : 'Independent attempt'}</span></div>
          <div class="button-row"><button class="almost-button compact" type="button" data-action="rapid-almost">${icon('brain')}<span><strong>I almost knew it</strong><small>bring it back sooner</small></span></button><button class="primary-button" type="button" data-action="rapid-next">${activeGame.index + 1 >= activeGame.items.length ? 'Finish' : 'Next word'} ${icon('arrow')}</button></div>
        </div>
      ` : `
        <button class="progressive-hint-button game-hint-button level-${activeGame.hintLevel || 0}" type="button" data-action="rapid-hint" ${(activeGame.hintLevel || 0) >= 5 ? 'disabled' : ''}>${icon('lightbulb')}<span><strong>${(activeGame.hintLevel || 0) >= 5 ? 'Full support used' : HINT_STEP_LABELS[Math.min(activeGame.hintLevel || 0, HINT_STEP_LABELS.length - 1)]}</strong><small>${activeGame.hintLevel || 0} / 5</small></span></button>
      `}
    </div>
  `;
};

const requestMatchingHint = () => {
  if (!activeGame || activeGame.type === 'rapid' || activeGame.finished || activeGame.hintLevel >= 5) return;
  const item = getMatchingHintTarget();
  if (!item) return;
  const nextLevel = (activeGame.hintLevel || 0) + 1;
  const hint = buildMatchingHint(item, nextLevel);
  activeGame.hintLevel = nextLevel;
  activeGame.hintStack.push(hint);
  if (nextLevel === 5) {
    activeGame.hintRecallPhase = 'study';
    activeGame.hintActiveRecallCompleted = false;
  }
  recordHintUse(state, {
    itemId: item.id,
    level: nextLevel,
    exerciseType: activeGame.type,
    context: 'game',
    conceptId: item.grammar?.[0] || null,
  });
  save();
  haptic(6);
  renderGameModal();
};

const beginMatchingHintRecall = () => {
  if (!activeGame || activeGame.type === 'rapid' || activeGame.hintLevel < 5) return;
  activeGame.hintRecallPhase = 'recall';
  activeGame.hintActiveRecallCompleted = false;
  renderGameModal();
};

const markGameAlmostKnown = (pairId) => {
  if (!activeGame?.lastMatch || activeGame.lastMatch.pairId !== pairId || activeGame.lastMatch.almostKnown) return;
  activeGame.lastMatch.almostKnown = true;
  recordAlmostKnown(state, { itemId: pairId, context: 'game' });
  save();
  showToast('Marked as almost known', 'This pair will return sooner without erasing the success.', 'brain');
  renderGameModal();
};

const handleGameTile = (tileId) => {
  if (!activeGame || activeGame.locked || activeGame.finished) return;
  if (activeGame.hintLevel === 5 && activeGame.hintRecallPhase === 'study') return;
  const tile = activeGame.tiles.find((entry) => entry.id === tileId);
  if (!tile || tile.matched || activeGame.selectedIds.includes(tileId)) return;
  tile.revealed = true;
  activeGame.selectedIds.push(tileId);
  haptic(5);

  if (activeGame.selectedIds.length < 2) {
    renderGameModal();
    return;
  }

  activeGame.moves += 1;
  const [first, second] = activeGame.selectedIds.map((id) => activeGame.tiles.find((entry) => entry.id === id));
  const match = first.pairId === second.pairId && first.side !== second.side;
  activeGame.locked = true;
  renderGameModal();

  setTimeout(() => {
    if (!activeGame) return;
    if (match) {
      first.matched = true;
      second.matched = true;
      activeGame.matchedPairs += 1;
      const targetMatched = first.pairId === activeGame.hintTargetPairId;
      const hintLevel = targetMatched ? Number(activeGame.hintLevel || 0) : 0;
      const activeRecallCompleted = targetMatched && hintLevel === 5 && activeGame.hintRecallPhase === 'recall';
      if (activeRecallCompleted) activeGame.hintActiveRecallCompleted = true;
      reviewItem(state, first.pairId, 2, {
        type: activeGame.type,
        correct: true,
        score: 1,
        hintLevel,
        hintsUsed: targetMatched ? activeGame.hintStack.length : 0,
        activeRecallCompleted,
      });
      activeGame.lastMatch = { pairId: first.pairId, almostKnown: false };
      if (targetMatched) resetMatchingHintState();
      haptic(10);
    } else {
      if (activeGame.type === 'memory') {
        first.revealed = false;
        second.revealed = false;
      }
      const pairKey = [first.pairId, second.pairId].sort().join('|');
      state.progress.confusionPairs[pairKey] = (state.progress.confusionPairs[pairKey] || 0) + 1;
      haptic([18, 30, 18]);
    }
    activeGame.selectedIds = [];
    activeGame.locked = false;
    if (activeGame.matchedPairs === activeGame.tiles.length / 2) {
      activeGame.finished = true;
      addActivity(state, { games: 1, minutes: Math.max(2, Math.round((Date.now() - activeGame.startedAt) / 60_000)) });
    }
    save();
    renderGameModal();
  }, match ? 280 : 720);
};

const requestRapidHint = () => {
  if (!activeGame || activeGame.type !== 'rapid' || activeGame.finished || activeGame.answered || activeGame.hintLevel >= 5) return;
  const item = activeGame.items[activeGame.index];
  const exercise = rapidExerciseForItem(item);
  const nextLevel = (activeGame.hintLevel || 0) + 1;
  const hint = generateExerciseHint(exercise, state.progress.items[item.id] || null, nextLevel, {
    partialIndex: activeGame.hintPartialIndex || 0,
    interfaceLanguage: primaryLanguage(),
  });
  activeGame.hintLevel = nextLevel;
  activeGame.hintStack.push(hint);
  if (nextLevel === 3) activeGame.hintPartialIndex += 1;
  if (nextLevel === 5) {
    activeGame.hintRecallPhase = 'study';
    activeGame.activeRecallCompleted = false;
  }
  recordHintUse(state, {
    itemId: item.id,
    level: nextLevel,
    exerciseType: 'rapid',
    context: 'game',
    conceptId: item.grammar?.[0] || null,
  });
  save();
  haptic(6);
  renderGameModal();
};

const beginRapidHintRecall = () => {
  if (!activeGame || activeGame.type !== 'rapid' || activeGame.hintLevel < 5 || activeGame.answered) return;
  activeGame.hintRecallPhase = 'recall';
  activeGame.hintRecallValue = '';
  activeGame.hintRecallResult = null;
  renderGameModal();
  setTimeout(() => modalRoot.querySelector('.rapid-hint-recall-form input')?.focus(), 30);
};

const completeRapidAnswer = (value, { activeRecall = false } = {}) => {
  if (!activeGame || activeGame.type !== 'rapid' || activeGame.answered) return;
  const item = activeGame.items[activeGame.index];
  const result = evaluateAnswer(value, primaryTranslation(item), { language: primaryLanguage(), source: item });
  if (activeRecall && !result.correct && !result.close) {
    activeGame.hintRecallValue = String(value || '');
    activeGame.hintRecallResult = result;
    renderGameModal();
    return;
  }
  activeGame.answered = true;
  activeGame.selected = activeRecall ? null : value;
  activeGame.result = activeRecall && result.close ? { ...result, correct: true, close: true } : result;
  activeGame.activeRecallCompleted = activeRecall;
  if (result.correct || (activeRecall && result.close)) activeGame.score += 1;
  haptic(result.correct || result.close ? 8 : [18, 30, 18]);
  renderGameModal();
};

const handleRapidAnswer = (option) => completeRapidAnswer(option);

const submitRapidHintRecall = (form) => {
  if (!activeGame || activeGame.type !== 'rapid') return;
  const value = new FormData(form).get('answer') || '';
  activeGame.hintRecallValue = String(value);
  completeRapidAnswer(value, { activeRecall: true });
};

const advanceRapidGame = (confidenceState = null) => {
  if (!activeGame || activeGame.type !== 'rapid' || !activeGame.answered) return;
  const item = activeGame.items[activeGame.index];
  const result = activeGame.result || { correct: false, score: 0 };
  reviewItem(state, item.id, result.correct ? 2 : 0, {
    type: 'rapid',
    correct: result.correct,
    score: result.score || (result.correct ? 1 : 0),
    hintLevel: activeGame.hintLevel || 0,
    hintsUsed: activeGame.hintStack?.length || 0,
    activeRecallCompleted: activeGame.activeRecallCompleted,
    confidenceState,
  });
  activeGame.index += 1;
  activeGame.answered = false;
  activeGame.selected = null;
  activeGame.result = null;
  resetRapidHintState();
  if (activeGame.index >= activeGame.items.length) {
    activeGame.finished = true;
    addActivity(state, { games: 1, minutes: Math.max(2, Math.round((Date.now() - activeGame.startedAt) / 60_000)) });
  }
  save();
  renderGameModal();
};

const openSettings = () => {
  const voices = refreshPolishVoices();
  openModal(`
    <header class="modal-header">
      <div><h2>Coach settings</h2><p>Personalization and learning data stay on this device by default.</p></div>
      <button class="modal-close" type="button" data-action="modal-close" aria-label="Close">${icon('close')}</button>
    </header>
    <div class="modal-body">
      <section class="settings-section">
        <h3>Your conversation profile</h3>
        <p>These details shape examples, grammar forms, and simulator labels.</p>
        <div class="form-grid">
          <div class="form-field"><label for="settings-name">Your name</label><input id="settings-name" value="${escapeHtml(state.profile.name)}"></div>
          <div class="form-field"><label for="settings-gender">Forms used when you speak</label><select id="settings-gender"><option value="male" ${state.profile.speakerGender === 'male' ? 'selected' : ''}>Masculine (chciałbym, byłem)</option><option value="female" ${state.profile.speakerGender === 'female' ? 'selected' : ''}>Feminine (chciałabym, byłam)</option></select></div>
          <div class="form-field"><label for="settings-mother">Mother-in-law label or name</label><input id="settings-mother" value="${escapeHtml(state.profile.familyNames.motherInLaw)}"></div>
          <div class="form-field"><label for="settings-father">Father-in-law label or name</label><input id="settings-father" value="${escapeHtml(state.profile.familyNames.fatherInLaw)}"></div>
          <div class="form-field"><label for="settings-grandmother">Grandmother label or name</label><input id="settings-grandmother" value="${escapeHtml(state.profile.familyNames.grandmother)}"></div>
          <div class="form-field"><label for="settings-goal">Daily focused minutes</label><input id="settings-goal" type="number" min="5" max="90" value="${state.profile.dailyGoal}"></div>
        </div>
      </section>

      <section class="settings-section">
        <h3>Explanations and audio</h3>
        <p>The interface stays in English. Dutch is the primary comparison and translation language; English remains available as support where it explains the contrast better.</p>
        <div class="toggle-row"><span class="toggle-copy"><strong>Use Dutch first</strong><span>Primary comparison and translation language</span></span><label class="switch"><input id="settings-dutch" type="checkbox" ${state.settings.showDutch ? 'checked' : ''}><span class="switch-track"></span></label></div>
        <div class="toggle-row"><span class="toggle-copy"><strong>Show English support</strong><span>Useful for grammar terminology and direct contrasts</span></span><label class="switch"><input id="settings-english" type="checkbox" ${state.settings.showEnglish ? 'checked' : ''}><span class="switch-track"></span></label></div>
        <div class="toggle-row"><span class="toggle-copy"><strong>Auto-speak simulator turns</strong><span>Play each new Polish line automatically</span></span><label class="switch"><input id="settings-auto-speak" type="checkbox" ${state.settings.autoSpeak ? 'checked' : ''}><span class="switch-track"></span></label></div>
        <div class="toggle-row"><span class="toggle-copy"><strong>Gentle haptics</strong><span>Small vibration feedback on supported mobile devices</span></span><label class="switch"><input id="settings-haptics" type="checkbox" ${state.settings.haptics ? 'checked' : ''}><span class="switch-track"></span></label></div>
        <div class="form-grid audio-settings-grid" style="margin-top:12px">
          <div class="form-field"><label for="settings-rate">Base Polish speech speed · ${Math.round(state.settings.speechRate * 100)}%</label><input id="settings-rate" type="range" min="0.55" max="1.05" step="0.05" value="${state.settings.speechRate}"><small>The Listening Lab builds slow, natural, and stretch speeds around this baseline.</small></div>
          <div class="form-field"><label for="settings-listening-speed">Default listening speed</label><select id="settings-listening-speed"><option value="slow" ${state.settings.listeningDefaultSpeed === 'slow' ? 'selected' : ''}>Slow · clarity first</option><option value="natural" ${state.settings.listeningDefaultSpeed === 'natural' ? 'selected' : ''}>Natural · family pace</option><option value="fast" ${state.settings.listeningDefaultSpeed === 'fast' ? 'selected' : ''}>Stretch · real-life pressure</option></select></div>
          <div class="form-field full"><label for="settings-voice">Polish voice</label><select id="settings-voice"><option value="">Best available automatically</option>${voices.map((voice) => `<option value="${escapeHtml(voice.voiceURI)}" ${state.settings.speechVoiceURI === voice.voiceURI ? 'selected' : ''}>${escapeHtml(voice.name)}${voice.localService ? ' · on device' : ''}</option>`).join('')}</select><small>${voices.length ? `${voices.length} Polish voice${voices.length === 1 ? '' : 's'} detected on this device.` : 'No dedicated Polish voice was reported yet. Android may load voices after the first playback.'}</small></div>
        </div>
      </section>

      <section class="settings-section settings-evidence-section">
        <h3>Level calibration and evidence</h3>
        <p>Blisko measures reading, listening, guided production, free production, and pronunciation separately. A short diagnostic gives the model a safer starting point; ordinary practice then takes over.</p>
        <div class="settings-status-card">
          <span class="settings-status-icon">${icon('target')}</span>
          <span><strong>${state.onboarding?.placement?.completedAt ? `Last level check: ${escapeHtml(state.onboarding.placement.estimatedLevel === 'Pre-A1' ? 'A0' : state.onboarding.placement.estimatedLevel)}` : 'No level check completed'}</strong><small>${state.onboarding?.placement?.completedAt ? `${formatDateRelative(state.onboarding.placement.completedAt)} · ${Math.round((state.onboarding.placement.evidenceConfidence || 0) * 100)}% diagnostic evidence` : 'Eleven compact questions · about four minutes'}</small></span>
          <button class="secondary-button compact" type="button" data-action="open-placement" data-mode="${state.onboarding?.placement?.completedAt ? 'recalibration' : 'placement'}">${state.onboarding?.placement?.completedAt ? 'Recalibrate' : 'Start check'}</button>
        </div>
      </section>

      <section class="settings-section">
        <h3>Optional generative AI</h3>
        <p>The built-in tutor works offline. For open-ended generation, point the app at your own secure server-side proxy. Never put a private model key in browser code.</p>
        <div class="form-field full"><label for="settings-ai-url">AI proxy URL</label><input id="settings-ai-url" type="url" value="${escapeHtml(state.settings.aiProxyUrl)}" placeholder="https://your-domain.example/api/polish-tutor"><small>The proxy should accept JSON and return { title, nl, en, examples, exercise }.</small></div>
      </section>

      <section class="settings-section">
        <h3>Appearance and data</h3>
        <div class="form-grid">
          <div class="form-field"><label for="settings-theme">Theme</label><select id="settings-theme"><option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Dark</option><option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Light</option></select></div>
          <div class="form-field"><label>Portable backup</label><div class="button-row"><button class="secondary-button" type="button" data-action="export-data">${icon('download')} Export</button><button class="secondary-button" type="button" data-action="import-data">${icon('upload')} Import</button></div><input id="import-file" class="hidden" type="file" accept="application/json"></div>
        </div>
        <div class="settings-status-card app-health-preview">
          <span class="settings-status-icon">${icon('check')}</span>
          <span><strong>App health and automatic safety copies</strong><small>Installed build ${escapeHtml(APP_VERSION)} · last safe start ${state.system?.lastSuccessfulStartAt ? formatDateRelative(state.system.lastSuccessfulStartAt) : 'not recorded yet'}</small></span>
          <button class="secondary-button compact" type="button" data-action="open-health">Inspect</button>
        </div>
        <div class="button-row" style="margin-top:16px"><button class="danger-button" type="button" data-action="reset-data">${icon('trash')} Reset learning data</button></div>
      </section>
    </div>
    <footer class="modal-footer"><button class="ghost-button" type="button" data-action="modal-close">Cancel</button><button class="primary-button" type="button" data-action="save-settings">Save settings</button></footer>
  `, { wide: true, label: 'Coach settings' });
};

const saveSettings = () => {
  const name = document.getElementById('settings-name')?.value.trim() || 'Kars';
  const dailyGoal = Math.max(5, Math.min(90, Number(document.getElementById('settings-goal')?.value) || 15));
  const showDutch = Boolean(document.getElementById('settings-dutch')?.checked);
  const showEnglish = Boolean(document.getElementById('settings-english')?.checked);

  state.profile.name = name;
  state.profile.speakerGender = document.getElementById('settings-gender')?.value || 'male';
  state.profile.familyNames.motherInLaw = document.getElementById('settings-mother')?.value.trim() || 'Mother-in-law';
  state.profile.familyNames.fatherInLaw = document.getElementById('settings-father')?.value.trim() || 'Father-in-law';
  state.profile.familyNames.grandmother = document.getElementById('settings-grandmother')?.value.trim() || 'Grandmother';
  state.profile.dailyGoal = dailyGoal;
  state.settings.showDutch = showDutch || !showEnglish;
  state.settings.showEnglish = showEnglish || !showDutch;
  state.settings.autoSpeak = Boolean(document.getElementById('settings-auto-speak')?.checked);
  state.settings.haptics = Boolean(document.getElementById('settings-haptics')?.checked);
  state.settings.speechRate = Number(document.getElementById('settings-rate')?.value) || 0.86;
  state.settings.speechVoiceURI = document.getElementById('settings-voice')?.value || '';
  state.settings.listeningDefaultSpeed = ['slow','natural','fast'].includes(document.getElementById('settings-listening-speed')?.value)
    ? document.getElementById('settings-listening-speed').value
    : 'natural';
  state.settings.aiProxyUrl = document.getElementById('settings-ai-url')?.value.trim() || '';
  setTheme(document.getElementById('settings-theme')?.value || 'dark');
  save({ immediate: true });
  closeModal();
  updateShell();
  renderView();
  showToast('Settings saved', 'Future examples and sessions will use the updated profile.', 'check');
};

const exportBackup = () => {
  const blob = new Blob([exportState(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `blisko-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Backup exported', 'Keep the file somewhere private.', 'download');
};

const importBackupFile = async (file) => {
  if (!file) return;
  try {
    const raw = await file.text();
    const report = validateBackup(raw);
    if (!report.valid) throw new Error(report.issues[0] || 'The file was not a valid Blisko backup.');
    await createSafetyBackup(state, 'before portable backup import', APP_VERSION);
    state = importState(raw);
    state.system = state.system || {};
    state.system.previousVersion = state.system.installedVersion || state.system.previousVersion || null;
    state.system.installedVersion = APP_VERSION;
    state.system.lastMigrationAt = new Date().toISOString();
    setTheme(state.settings.theme);
    await save({ immediate: true });
    closeModal();
    updateShell();
    renderView();
    showToast('Backup restored', `${report.itemCount} tracked items validated and restored.`, 'check');
  } catch (error) {
    showToast('Could not import backup', error.message || 'The file was not valid.', 'alert');
  }
};

const resetLearningData = async () => {
  if (!window.confirm('Reset all progress, tutor memory, and conversation history on this device? A local safety copy will be kept.')) return;
  await createSafetyBackup(state, 'before learning-data reset', APP_VERSION).catch(() => null);
  state = await resetState();
  state.system.installedVersion = APP_VERSION;
  state.system.lastMigrationAt = new Date().toISOString();
  await save({ immediate: true });
  setTheme(state.settings.theme);
  closeModal();
  navigate('dashboard', { replace: true });
  showToast('Learning data reset', 'You are back at a fresh starting point.', 'trash');
};

const getActiveServiceWorkerBuild = async () => {
  if (!navigator.serviceWorker?.controller) return null;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve('unknown'), 700);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data?.build || 'unknown');
    };
    try {
      navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    } catch {
      clearTimeout(timeout);
      resolve('unknown');
    }
  });
};

const openAppHealth = async () => {
  try {
    const [health, backups, workerBuild] = await Promise.all([
      getStorageHealth(state),
      listSafetyBackups(),
      getActiveServiceWorkerBuild(),
    ]);
    appHealthSnapshot = { ...health, backups, workerBuild };
    const stateAligned = !state.system?.installedVersion || state.system.installedVersion === APP_VERSION;
    const workerAligned = workerBuild === null || workerBuild === APP_VERSION;
    const versionAligned = stateAligned && workerAligned;
    const storageSafe = health.indexedDbAvailable || health.localFallbackAvailable;
    const statusItems = [
      { label: 'Code and learner model', value: stateAligned ? `Aligned on ${APP_VERSION}` : `Code ${APP_VERSION} · state ${state.system?.installedVersion || 'unknown'}`, ok: stateAligned },
      { label: 'Verified offline shell', value: workerBuild === null ? 'Not controlling this page yet' : workerBuild === 'unknown' ? 'Version could not be read' : `Build ${workerBuild}`, ok: workerAligned && workerBuild !== 'unknown', neutral: workerBuild === null || workerBuild === 'unknown' },
      { label: 'Primary storage', value: health.indexedDbAvailable ? 'IndexedDB available' : 'IndexedDB unavailable', ok: health.indexedDbAvailable },
      { label: 'Fallback storage', value: health.localFallbackAvailable ? 'localStorage available' : 'Fallback unavailable', ok: health.localFallbackAvailable },
      { label: 'Protected from cleanup', value: health.persisted ? 'Persistent storage granted' : 'Browser-managed storage', ok: health.persisted, neutral: true },
    ];
    openModal(`
      <header class="modal-header">
        <div><h2>App health and safety</h2><p>Check version alignment, local storage, recovery copies, and update readiness without deleting your learning data.</p></div>
        <button class="modal-close" type="button" data-action="modal-close" aria-label="Close">${icon('close')}</button>
      </header>
      <div class="modal-body app-health-body">
        <section class="health-hero ${versionAligned && storageSafe ? 'healthy' : 'attention'}">
          <span class="health-hero-icon">${icon(versionAligned && storageSafe ? 'check' : 'alert')}</span>
          <div><p class="eyebrow">BLISKO ${escapeHtml(APP_VERSION)}</p><h3>${versionAligned && storageSafe ? 'The app and learner model are aligned.' : 'One part of the app needs attention.'}</h3><p>${versionAligned && storageSafe ? 'Updates can replace app files while progress remains in local storage.' : 'Use the repair action below if the interface is incomplete or an update mixed old and new files.'}</p></div>
        </section>

        <section class="health-status-grid">
          ${statusItems.map((item) => `<div class="health-status-row ${item.ok ? 'ok' : item.neutral ? 'neutral' : 'warning'}"><span>${icon(item.ok ? 'check' : item.neutral ? 'info' : 'alert')}</span><p><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.value)}</small></p></div>`).join('')}
        </section>

        <section class="settings-section health-backup-section">
          <div class="section-heading"><div><h3>Automatic safety copies</h3><p>Blisko keeps rotating local snapshots before migrations and at least once per day. These are separate from the portable JSON export.</p></div><button class="secondary-button compact" type="button" data-action="create-safety-backup">Create now</button></div>
          ${backups.length ? `<div class="health-backup-list">${backups.map((backup, index) => `<div class="health-backup-row"><span class="health-backup-index">${index + 1}</span><p><strong>${escapeHtml(backup.reason || 'Safety copy')}</strong><small>${formatDateTime(backup.createdAt)} · build ${escapeHtml(backup.appVersion || 'unknown')} · ${backup.itemCount} tracked items</small></p>${index === 0 ? '<span class="soft-pill">Latest</span>' : ''}</div>`).join('')}</div>` : '<div class="empty-state compact-empty"><span class="empty-state-icon">' + icon('download') + '</span><h3>No safety copy yet</h3><p>Create one now or keep using the app; an automatic copy is made before the next migration.</p></div>'}
          <div class="health-action-row">
            <button class="secondary-button" type="button" data-action="restore-safety-backup" ${backups.length ? '' : 'disabled'}>${icon('repeat')} Restore latest safety copy</button>
            <button class="secondary-button" type="button" data-action="export-data">${icon('download')} Export portable backup</button>
          </div>
        </section>

        <section class="settings-section health-repair-section">
          <h3>Update repair</h3>
          <p>This clears only downloaded app-shell files and service workers, then fetches one matching version again. Vocabulary, reviews, streaks, conversations, and settings remain untouched.</p>
          <button class="danger-outline-button" type="button" data-action="repair-app-cache">${icon('repeat')} Repair downloaded app files</button>
        </section>

        <section class="health-footnote">
          <span>${icon('info')}</span><p><strong>Last successful start</strong><small>${health.lastSuccessfulStartAt ? formatDateTime(health.lastSuccessfulStartAt) : 'This build has not yet recorded a complete start.'} · schema ${health.schemaVersion}</small></p>
        </section>
      </div>
      <footer class="modal-footer"><button class="primary-button" type="button" data-action="modal-close">Done</button></footer>
    `, { wide: true, label: 'App health and safety' });
  } catch (error) {
    showToast('Health check unavailable', error.message || 'Storage information could not be read.', 'alert');
  }
};

const createManualSafetyBackup = async () => {
  try {
    await createSafetyBackup(state, 'manual safety copy', APP_VERSION);
    await save({ immediate: true });
    showToast('Safety copy created', 'A local recovery snapshot is ready on this device.', 'check');
    await openAppHealth();
  } catch (error) {
    showToast('Could not create safety copy', error.message || 'The browser blocked local storage.', 'alert');
  }
};

const restoreLatestLocalBackup = async () => {
  const backups = appHealthSnapshot?.backups || await listSafetyBackups();
  if (!backups.length) {
    showToast('No safety copy available', 'Create a safety copy or import a portable backup instead.', 'alert');
    return;
  }
  const latest = backups[0];
  if (!window.confirm(`Restore the safety copy from ${formatDateTime(latest.createdAt)}? Current changes made after that copy will be replaced.`)) return;
  try {
    const restored = await restoreLatestSafetyBackup();
    restored.system = restored.system || {};
    restored.system.previousVersion = restored.system.installedVersion || restored.system.previousVersion || null;
    restored.system.installedVersion = APP_VERSION;
    restored.system.lastMigrationAt = new Date().toISOString();
    state = restored;
    await save({ immediate: true });
    closeModal();
    showToast('Safety copy restored', 'Blisko will reopen with the recovered learner model.', 'check');
    setTimeout(() => location.reload(), 350);
  } catch (error) {
    showToast('Restore failed', error.message || 'The local safety copy could not be read.', 'alert');
  }
};

const currentAppCacheScope = () => new URL('./', location.href).href;

const currentAppCachePrefix = () => {
  const path = new URL('./', location.href).pathname;
  const key = path
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .toLowerCase() || 'root';
  return `blisko-${key}-`;
};

const clearCurrentAppCaches = async () => {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  const prefix = currentAppCachePrefix();
  const scope = currentAppCacheScope();
  await Promise.all(names.map(async (name) => {
    if (name.startsWith(prefix)) {
      await caches.delete(name);
      return;
    }
    // Clean entries from origin-wide legacy caches without touching another
    // GitHub Pages repository that happens to share the same origin.
    if (/^blisko-(?:shell-flat|runtime)-v/i.test(name)) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      await Promise.all(requests
        .filter((request) => request.url.startsWith(scope))
        .map((request) => cache.delete(request)));
      if (!(await cache.keys()).length) await caches.delete(name);
    }
  }));
};

const repairAppCache = async () => {
  if (!window.confirm('Repair downloaded app files? Your learning data will stay on this device.')) return;
  try {
    await createSafetyBackup(state, 'before app-file repair', APP_VERSION);
    await save({ immediate: true });
    await flushState();
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const currentUrl = location.href;
      const relevantRegistrations = registrations.filter((registration) => currentUrl.startsWith(registration.scope));
      await Promise.all(relevantRegistrations.map((registration) => registration.unregister()));
    }
    await clearCurrentAppCaches();
    const url = new URL(location.href);
    url.searchParams.set('repair', APP_VERSION);
    url.searchParams.set('t', Date.now().toString());
    url.hash = `#${currentView || 'dashboard'}`;
    location.replace(url.toString());
  } catch (error) {
    showToast('Repair could not finish', error.message || 'Reload the hosted page once while online.', 'alert');
  }
};

const openWordDetail = (wordId) => {
  const word = WORD_MAP.get(wordId);
  if (!word) return;
  const progress = state.progress.items[wordId];
  const phrases = PHRASES.filter((phrase) => phrase.words?.includes(wordId)).slice(0, 4);
  openModal(`
    <header class="modal-header">
      <div><h2 lang="pl">${polishInteractive(word.pl)}</h2><p>${escapeHtml(word.type)} · frequency rank ${word.frequency} in the curated starter set</p></div>
      <button class="modal-close" type="button" data-action="modal-close" aria-label="Close">${icon('close')}</button>
    </header>
    <div class="modal-body">
      <div class="page-intro card" style="margin-bottom:18px">
        <div><p class="eyebrow">POLISH IN CONTEXT</p><h2 lang="pl">${polishInteractive(word.pl)}</h2><p>NL ${escapeHtml(word.nl)} · EN ${escapeHtml(word.en)}</p></div>
        <button class="speaker-button" type="button" data-action="speak" data-text="${escapeHtml(word.pl)}">${icon('volume')}</button>
      </div>
      <div class="form-grid">
        <div class="language-explanation"><span class="lang-tag">EXAMPLE</span><p lang="pl"><strong>${polishInteractive(word.example || word.pl)}</strong></p><button class="text-button" type="button" data-action="speak" data-text="${escapeHtml(word.example || word.pl)}">${icon('volume')} Listen</button></div>
        <div class="language-explanation"><span class="lang-tag">MEMORY</span><p>${progress ? `${Math.round(progress.confidence * 100)}% confidence · ${progress.reps} reviews · ${progress.lapses} lapses` : 'New item. The coach has not tested this memory yet.'}</p></div>
      </div>
      ${phrases.length ? `<section style="margin-top:20px"><div class="section-heading"><div><h3>Useful sentences</h3><p>Tap any Polish word to inspect its form.</p></div></div><div class="insight-list">${phrases.map((phrase) => `<div class="insight-row"><span class="insight-bullet">›</span><p lang="pl">${polishInteractive(phrase.pl)}<span>${escapeHtml(primaryTranslation(phrase))}</span></p></div>`).join('')}</div></section>` : ''}
    </div>
    <footer class="modal-footer"><button class="secondary-button" type="button" data-action="open-morphology" data-word="${escapeHtml(word.pl)}" data-sentence="${escapeHtml(word.example || word.pl)}">${icon('brain')} Explain form</button><button class="secondary-button" type="button" data-action="speak" data-text="${escapeHtml(word.example || word.pl)}">${icon('volume')} Hear example</button><button class="primary-button" type="button" data-action="review-word" data-word="${word.id}">Practise this word</button></footer>
  `, { label: word.pl });
};

const requestConversationHint = () => {
  const persona = PERSONAS.find((entry) => entry.id === state.conversation.selectedPersona) || PERSONAS[0];
  const conversation = CONVERSATIONS[persona.id];
  const transcript = ensureConversationState(persona.id);
  const hintState = ensureConversationHintState(persona.id);
  if (!conversation || !transcript || !hintState || transcript.completed || hintState.level >= 5) return;
  const turn = conversation.turns[transcript.turnIndex];
  const nextLevel = hintState.level + 1;
  const hint = generateConversationHint(turn, nextLevel, {
    partialIndex: hintState.partialIndex,
    history: state.progress.personas[persona.id] || null,
  });
  hintState.level = nextLevel;
  hintState.stack.push(hint);
  if (nextLevel === 3) hintState.partialIndex += 1;
  if (nextLevel === 5) {
    hintState.recallPhase = 'study';
    hintState.activeRecallCompleted = false;
  }
  recordHintUse(state, {
    level: nextLevel,
    exerciseType: 'conversation',
    context: 'conversation',
    personaId: persona.id,
  });
  save();
  haptic(6);
  renderTalkIntoView();
};

const beginConversationHintRecall = () => {
  const persona = PERSONAS.find((entry) => entry.id === state.conversation.selectedPersona) || PERSONAS[0];
  const hintState = ensureConversationHintState(persona.id);
  if (!hintState || hintState.level < 5) return;
  hintState.recallPhase = 'recall';
  hintState.activeRecallCompleted = false;
  save();
  renderTalkIntoView();
  setTimeout(() => document.getElementById('conversation-input')?.focus(), 30);
};

const markConversationAlmostKnown = (personaId, messageId) => {
  const transcript = ensureConversationState(personaId);
  const message = transcript?.messages?.find((entry) => entry.id === messageId);
  if (!message || message.almostKnown) return;
  message.almostKnown = true;
  recordAlmostKnown(state, { personaId, context: 'conversation' });
  save();
  showToast('Marked as almost known', 'This conversation intention will be weighted sooner without counting as a full failure.', 'brain');
  renderTalkIntoView();
};

const sendConversationReply = (providedText = null) => {
  const persona = PERSONAS.find((entry) => entry.id === state.conversation.selectedPersona) || PERSONAS[0];
  const conversation = CONVERSATIONS[persona.id];
  const transcript = ensureConversationState(persona.id);
  const hintState = ensureConversationHintState(persona.id);
  if (!conversation || !transcript || transcript.completed) return;

  if (hintState?.level === 5 && hintState.recallPhase === 'study') {
    showToast('Hide the model reply first', 'The final hint only becomes useful when you retrieve the sentence once yourself.', 'lightbulb');
    return;
  }

  const input = document.getElementById('conversation-input');
  const text = (providedText ?? input?.value ?? '').trim();
  if (!text) {
    showToast('Say one short Polish phrase', 'A partial answer is enough to keep the conversation moving.', 'message');
    return;
  }

  const turnIndex = transcript.turnIndex;
  const turn = conversation.turns[turnIndex];
  const evaluation = evaluateConversationReply(text, turn);
  const usedHintLevel = Number(hintState?.level || 0);
  const activeRecallCompleted = usedHintLevel === 5 && hintState?.recallPhase === 'recall';
  if (activeRecallCompleted) hintState.activeRecallCompleted = true;
  const correctionId = `correction-${persona.id}-${turnIndex}-${Date.now()}`;

  transcript.messages.push({
    sender: 'user',
    text,
    turnIndex,
    hintLevel: usedHintLevel,
    activeRecallCompleted,
    at: new Date().toISOString(),
  });
  transcript.messages.push({
    id: correctionId,
    sender: 'correction',
    personaId: persona.id,
    turnIndex,
    feedback: `${evaluation.feedback}${turn.coach ? ` ${turn.coach}` : ''}`,
    correction: evaluation.correction,
    suggestion: evaluation.accepted ? '' : evaluation.suggestion,
    hintLevel: usedHintLevel,
    activeRecallCompleted,
    almostKnown: false,
    at: new Date().toISOString(),
  });
  recordConversationTurn(state, persona.id, evaluation.score, {
    hintLevel: usedHintLevel,
    activeRecallCompleted,
  });
  addActivity(state, { minutes: 0.5 });

  let nextText = null;
  if (evaluation.accepted || state.conversation.level === 'guided') {
    transcript.turnIndex += 1;
    if (transcript.turnIndex >= conversation.turns.length) {
      transcript.completed = true;
      transcript.messages.push({ sender: 'system', text: 'Scenario complete · feedback and hint dependence have been added to your learner model.' });
      addActivity(state, { minutes: 2 });
    } else {
      const nextTurn = conversation.turns[transcript.turnIndex];
      transcript.messages.push({
        sender: 'role',
        text: nextTurn.role,
        nl: nextTurn.nl,
        en: nextTurn.en,
        turnIndex: transcript.turnIndex,
        at: new Date().toISOString(),
      });
      nextText = nextTurn.role;
    }
  }

  save();
  renderTalkIntoView();
  if (nextText && state.settings.autoSpeak) setTimeout(() => speak(nextText), 180);
};

const renderTalkIntoView = () => {
  if (currentView !== 'talk') return;
  mainContent.innerHTML = renderTalk();
  hydrateStaticIcons(mainContent);
  scrollChatToBottom();
};

const resetConversation = (personaId = state.conversation.selectedPersona) => {
  delete state.conversation.transcripts[personaId];
  ensureConversationState(personaId);
  save();
  renderTalkIntoView();
  const firstLine = CONVERSATIONS[personaId]?.turns?.[0]?.role;
  if (firstLine && state.settings.autoSpeak) setTimeout(() => speak(firstLine), 150);
};

const dictateToInput = (inputId) => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showToast('Speech-to-text is unavailable here', 'Type your reply, or use the offline speaking recorder in a lesson.', 'mic');
    return;
  }
  if (recognition) {
    recognition.abort();
    recognition = null;
  }
  const input = document.getElementById(inputId);
  if (!input) return;
  recognition = new Recognition();
  recognition.lang = 'pl-PL';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onstart = () => {
    const micButton = input.closest('.composer-box')?.querySelector('.mic-button');
    micButton?.classList.add('recording');
    showToast('Listening for Polish', 'Browser speech recognition may require an internet connection.', 'mic');
  };
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ');
    input.value = transcript;
  };
  recognition.onerror = () => {
    showToast('I could not hear that clearly', 'Try again or type a short answer.', 'alert');
  };
  recognition.onend = () => {
    input.closest('.composer-box')?.querySelector('.mic-button')?.classList.remove('recording');
    recognition = null;
    input.focus();
  };
  recognition.start();
};

const sendTutorMessage = async (providedText = null) => {
  const input = document.getElementById('tutor-input');
  const text = (providedText ?? input?.value ?? '').trim();
  if (!text) {
    showToast('Ask a concrete question', 'Including the Polish sentence gives the best explanation.', 'message');
    return;
  }

  state.tutor.messages.push({ role: 'user', text, at: new Date().toISOString() });
  if (input) input.value = '';
  state.tutor.messages = state.tutor.messages.slice(-30);
  save();
  if (currentView === 'tutor') {
    renderView();
    scrollTutorToBottom();
  }

  let reply;
  if (state.settings.aiProxyUrl && navigator.onLine) {
    tutorAbortController?.abort();
    tutorAbortController = new AbortController();
    try {
      reply = await cloudTutorReply(text, state, tutorAbortController.signal);
    } catch (error) {
      if (error.name === 'AbortError') return;
      reply = localTutorReply(text, state);
      showToast('Using the local tutor', 'The configured AI proxy was unavailable, so the offline explanation took over.', 'alert');
    }
  } else {
    reply = localTutorReply(text, state);
  }

  state.tutor.messages.push({ role: 'assistant', reply, at: new Date().toISOString() });
  if (reply.title && !state.tutor.rememberedIssues.includes(reply.title)) {
    state.tutor.rememberedIssues.unshift(reply.title);
    state.tutor.rememberedIssues = state.tutor.rememberedIssues.slice(0, 12);
  }
  save();
  if (currentView === 'tutor') {
    renderView();
    scrollTutorToBottom();
  }
};


const findTutorExercise = (key) => {
  const message = (state.tutor.messages || []).find((entry) => entry.role === 'assistant' && entry.at === key);
  return message?.reply?.exercise || null;
};

const rerenderTutorExercise = () => {
  save();
  if (currentView === 'tutor') {
    renderView();
    scrollTutorToBottom();
  }
};

const requestTutorHint = (key) => {
  const exercise = findTutorExercise(key);
  if (!exercise) return;
  const exerciseState = ensureTutorExerciseState(key);
  if (exerciseState.answered || exerciseState.level >= 5) return;
  const nextLevel = exerciseState.level + 1;
  const hint = generateTutorExerciseHint(exercise, nextLevel, { partialIndex: exerciseState.partialIndex });
  exerciseState.level = nextLevel;
  exerciseState.stack.push(hint);
  if (nextLevel === 3) exerciseState.partialIndex += 1;
  if (nextLevel === 5) {
    exerciseState.recallPhase = 'study';
    exerciseState.activeRecallCompleted = false;
  }
  recordHintUse(state, {
    level: nextLevel,
    exerciseType: 'tutor-quick-check',
    context: 'tutor',
    conceptId: exercise.grammar?.[0] || null,
  });
  haptic(6);
  rerenderTutorExercise();
};

const beginTutorHintRecall = (key) => {
  const exerciseState = ensureTutorExerciseState(key);
  if (exerciseState.level < 5 || exerciseState.answered) return;
  exerciseState.recallPhase = 'recall';
  exerciseState.recallValue = '';
  exerciseState.recallResult = null;
  rerenderTutorExercise();
  setTimeout(() => document.querySelector(`form[data-key="${CSS.escape(key)}"] input`)?.focus(), 30);
};

const answerTutorExercise = (key, value, { activeRecall = false } = {}) => {
  const exercise = findTutorExercise(key);
  if (!exercise) return;
  const exerciseState = ensureTutorExerciseState(key);
  if (exerciseState.answered) return;
  if (exerciseState.level === 5 && exerciseState.recallPhase === 'study') {
    showToast('Hide the answer first', 'Retrieve it once so the final hint becomes learning rather than copying.', 'lightbulb');
    return;
  }
  const answer = String(value || '').trim();
  if (!answer) return;
  const result = evaluateAnswer(answer, exercise.answer || '', {
    language: /[ąćęłńóśźż]/i.test(exercise.answer || '') ? 'pl' : primaryLanguage(),
    acceptedAnswers: exercise.acceptedAnswers || [],
    grammar: exercise.grammar || [],
    exercise,
  });
  if (activeRecall && !result.correct && !result.close) {
    exerciseState.recallValue = answer;
    exerciseState.recallResult = result;
    rerenderTutorExercise();
    return;
  }
  exerciseState.selected = answer;
  exerciseState.result = activeRecall && result.close ? { ...result, correct: true, close: true } : result;
  exerciseState.answered = true;
  exerciseState.activeRecallCompleted = activeRecall;
  if (activeRecall) {
    state.stats.activeRecallCompletions = Number(state.stats.activeRecallCompletions || 0) + 1;
    if (result.correct || result.close) state.stats.hintRecoveries = Number(state.stats.hintRecoveries || 0) + 1;
  }
  const weight = getHintEvidenceWeight(exerciseState.level);
  recordSkillEvidence(state, 'grammar', (result.correct ? 0.92 : result.close ? 0.62 : 0.22) * weight);
  haptic(result.correct || result.close ? 8 : [20, 35, 20]);
  rerenderTutorExercise();
};

const submitTutorHintRecall = (form) => {
  const key = form.dataset.key || '';
  const value = new FormData(form).get('answer') || '';
  const exerciseState = ensureTutorExerciseState(key);
  exerciseState.recallValue = String(value);
  answerTutorExercise(key, value, { activeRecall: true });
};

const markTutorAlmostKnown = (key) => {
  const exerciseState = ensureTutorExerciseState(key);
  if (!exerciseState.answered || exerciseState.almostKnown) return;
  exerciseState.almostKnown = true;
  recordAlmostKnown(state, { context: 'tutor' });
  rerenderTutorExercise();
  showToast('Marked as almost known', 'The coach keeps this signal between correct and incorrect.', 'brain');
};

const handleAction = (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case 'go-view':
      navigate(target.dataset.view);
      break;
    case 'start-session':
      startSession({ mode: target.dataset.mode || 'smart', topic: target.dataset.topic || null });
      break;
    case 'start-topic':
      startSession({ mode: 'smart', topic: target.dataset.topic, title: TOPICS.find((topic) => topic.id === target.dataset.topic)?.title });
      break;
    case 'start-rescue-session':
      startSession({
        mode: 'review',
        itemIds: ['p_repair_01','p_repair_02','p_repair_03','p_repair_04','p_repair_05'],
        title: 'Conversation rescue kit',
      });
      break;
    case 'start-scenario': {
      const scenario = REAL_LIFE_SCENARIOS.find((entry) => entry.id === target.dataset.scenario);
      if (scenario) startSession({ mode: 'smart', itemIds: scenario.phrases, title: scenario.title });
      break;
    }
    case 'pattern-slot': {
      const patternId = target.dataset.pattern;
      const slot = target.dataset.slot;
      patternSelections[patternId] = {
        ...(PATTERNS.find((entry) => entry.id === patternId)?.default || {}),
        ...(patternSelections[patternId] || {}),
        [slot]: target.dataset.value,
      };
      renderView();
      break;
    }
    case 'select-pattern':
      selectedPatternId = target.dataset.pattern;
      renderView();
      break;
    case 'practice-pattern':
      startPatternChallenge(target.dataset.pattern || selectedPatternId);
      break;
    case 'speak':
      speak(target.dataset.text || '');
      break;
    case 'open-morphology':
      openMorphologyLens(target.dataset.word || target.textContent || '', target.dataset.sentence || target.dataset.word || target.textContent || '');
      break;
    case 'close-morphology':
      closeMorphologyLens();
      break;
    case 'select-morphology-token':
      if (morphologyContext) {
        morphologyContext.selectedIndex = Number(target.dataset.index || 0);
        renderMorphologyOverlay();
      }
      break;
    case 'morphology-listen-word': {
      const analysis = morphologyContext ? analyzePolishSentence(morphologyContext.sentence)[morphologyContext.selectedIndex || 0] : null;
      if (analysis) speak(analysis.token, { speed: 'slow' });
      break;
    }
    case 'morphology-listen-sentence':
      if (morphologyContext?.sentence) speak(morphologyContext.sentence, { speed: 'natural' });
      break;
    case 'morphology-practice':
      practiseMorphologyContext();
      break;
    case 'open-listening-lab':
      openListeningLab(target.dataset.mode || 'adaptive');
      break;
    case 'close-listening-lab':
      closeListeningLab();
      break;
    case 'listening-play':
      playListeningItem(target.dataset.speed || 'natural');
      break;
    case 'listening-choice':
      answerListeningChoice(target.dataset.option || '');
      break;
    case 'listening-reveal':
      revealListeningShadow();
      break;
    case 'listening-shadow-rate':
      rateListeningShadow(Number(target.dataset.rating || 0));
      break;
    case 'listening-next':
      advanceListeningLab();
      break;
    case 'open-sound-lab':
      openSoundLab(target.dataset.lesson || null);
      break;
    case 'open-sound-lesson':
      openSoundLab(target.dataset.lesson || null);
      break;
    case 'close-sound-lab':
      closeSoundLab();
      break;
    case 'sound-back':
      if (activeSoundLab) {
        activeSoundLab = { lessonId: null, quizIndex: 0, selected: null, result: null, plays: 0 };
        renderSoundLabModal();
      }
      break;
    case 'sound-example':
      speak(target.dataset.text || '', { speed: 'slow' });
      break;
    case 'sound-quiz-play':
      playSoundQuiz();
      break;
    case 'sound-quiz-answer':
      answerSoundQuiz(target.dataset.option || '');
      break;
    case 'sound-next':
      advanceSoundQuiz();
      break;
    case 'open-persona':
      state.conversation.selectedPersona = target.dataset.persona;
      save();
      navigate('talk');
      break;
    case 'select-persona':
      state.conversation.selectedPersona = target.dataset.persona;
      ensureConversationState(target.dataset.persona);
      save();
      renderTalkIntoView();
      if (state.settings.autoSpeak) speak(CONVERSATIONS[target.dataset.persona]?.turns?.[0]?.role || '');
      break;
    case 'set-talk-level':
      state.conversation.level = target.dataset.level;
      save();
      renderTalkIntoView();
      break;
    case 'talk-reset':
      resetConversation();
      break;
    case 'talk-suggestion':
      sendConversationReply(target.dataset.text || '');
      break;
    case 'talk-send':
      sendConversationReply();
      break;
    case 'conversation-hint':
      requestConversationHint();
      break;
    case 'begin-conversation-recall':
      beginConversationHintRecall();
      break;
    case 'conversation-almost':
      markConversationAlmostKnown(target.dataset.persona || state.conversation.selectedPersona, target.dataset.message || '');
      break;
    case 'conversation-mic':
      dictateToInput('conversation-input');
      break;
    case 'tutor-send':
      sendTutorMessage();
      break;
    case 'tutor-mic':
      dictateToInput('tutor-input');
      break;
    case 'tutor-prompt':
      sendTutorMessage(target.dataset.text || '');
      break;
    case 'tutor-check':
      answerTutorExercise(target.dataset.key || '', target.dataset.option || '');
      break;
    case 'tutor-hint':
      requestTutorHint(target.dataset.key || '');
      break;
    case 'begin-tutor-recall':
      beginTutorHintRecall(target.dataset.key || '');
      break;
    case 'tutor-almost':
      markTutorAlmostKnown(target.dataset.key || '');
      break;
    case 'open-placement':
      openPlacementTest(target.dataset.mode || (state.onboarding?.placement?.completedAt ? 'recalibration' : 'placement'));
      break;
    case 'placement-choice':
      recordPlacementAnswer(target.dataset.option || '');
      break;
    case 'placement-order-add': {
      const question = currentPlacementQuestion();
      const token = question?.tokens?.find((entry) => entry.id === target.dataset.token);
      if (token && placementSession && !placementSession.answered && !placementSession.orderSelected.some((entry) => entry.id === token.id)) {
        placementSession.orderSelected.push(token);
        renderPlacementTest();
      }
      break;
    }
    case 'placement-order-remove':
      if (placementSession && !placementSession.answered) {
        placementSession.orderSelected = placementSession.orderSelected.filter((entry) => entry.id !== target.dataset.token);
        renderPlacementTest();
      }
      break;
    case 'placement-order-check':
      if (placementSession?.orderSelected?.length) {
        recordPlacementAnswer(placementSession.orderSelected.map((entry) => entry.value).join(' '));
      }
      break;
    case 'placement-speaking':
      recordPlacementAnswer('', { score: Number(target.dataset.score || 0), selfRated: true });
      break;
    case 'placement-next':
      advancePlacementTest();
      break;
    case 'placement-close': {
      const incomplete = placementSession && !placementSession.summary && placementSession.results.length > 0;
      if (!incomplete || window.confirm('Leave this level check? Your answers in this unfinished check will not be saved.')) closePlacementTest();
      break;
    }
    case 'placement-finish':
      closePlacementTest({ toProgress: true });
      break;
    case 'open-settings':
      openSettings();
      break;
    case 'open-health':
      openAppHealth();
      break;
    case 'create-safety-backup':
      createManualSafetyBackup();
      break;
    case 'restore-safety-backup':
      restoreLatestLocalBackup();
      break;
    case 'repair-app-cache':
      repairAppCache();
      break;
    case 'modal-close':
      closeModal();
      break;
    case 'modal-backdrop':
      if (event.target === target) closeModal();
      break;
    case 'start-game':
      openGame(target.dataset.game);
      break;
    case 'game-tile':
      handleGameTile(target.dataset.tile);
      break;
    case 'matching-hint':
      requestMatchingHint();
      break;
    case 'begin-matching-recall':
      beginMatchingHintRecall();
      break;
    case 'game-almost':
      markGameAlmostKnown(target.dataset.pair || '');
      break;
    case 'rapid-answer':
      handleRapidAnswer(target.dataset.option);
      break;
    case 'rapid-hint':
      requestRapidHint();
      break;
    case 'begin-rapid-recall':
      beginRapidHintRecall();
      break;
    case 'rapid-next':
      advanceRapidGame();
      break;
    case 'rapid-almost':
      advanceRapidGame('almost');
      break;
    case 'finish-game':
      closeModal();
      updateShell();
      renderView();
      break;
    case 'restart-game': {
      const game = target.dataset.game;
      closeModal();
      openGame(game);
      break;
    }
    case 'open-word':
      openWordDetail(target.dataset.word);
      break;
    case 'review-word': {
      const wordId = target.dataset.word;
      closeModal();
      startSession({ mode: 'review', itemIds: [wordId], title: `Practise ${WORD_MAP.get(wordId)?.pl || 'word'}` });
      break;
    }
    case 'session-choice':
      answerChoice(target.dataset.option || '');
      break;
    case 'order-add': {
      const exercise = currentExercise();
      const token = exercise?.tokens.find((entry) => entry.id === target.dataset.token);
      if (token && !session.orderSelected.some((entry) => entry.id === token.id)) {
        session.orderSelected.push(token);
        renderSession();
      }
      break;
    }
    case 'order-remove':
      session.orderSelected = session.orderSelected.filter((entry) => entry.id !== target.dataset.token);
      renderSession();
      break;
    case 'check-order':
      checkOrderedAnswer();
      break;
    case 'request-hint':
      requestSessionHint();
      break;
    case 'begin-hint-recall':
      beginSessionHintRecall();
      break;
    case 'show-hint-answer-again':
      showSessionHintAnswerAgain();
      break;
    case 'hint-order-add': {
      const token = session?.hintRecallTokens?.find((entry) => entry.id === target.dataset.token);
      if (token && !session.hintRecallOrderSelected.some((entry) => entry.id === token.id)) {
        session.hintRecallOrderSelected.push(token);
        renderSession();
      }
      break;
    }
    case 'hint-order-remove':
      session.hintRecallOrderSelected = session.hintRecallOrderSelected.filter((entry) => entry.id !== target.dataset.token);
      renderSession();
      break;
    case 'check-hint-order':
      checkSessionHintOrder();
      break;
    case 'complete-hint-recall-speaking':
      completeSessionHintRecallSpeaking();
      break;
    case 'record-speech':
      startLocalRecording();
      break;
    case 'complete-speaking':
      completeSpeaking();
      break;
    case 'rate-exercise':
      rateCurrentExercise(Number(target.dataset.rating));
      break;
    case 'rate-almost':
      rateCurrentExerciseAlmost();
      break;
    case 'skip-exercise':
      skipCurrentExercise();
      break;
    case 'close-session':
      closeSession();
      break;
    case 'finish-session':
      closeSession({ force: true });
      navigate('dashboard');
      break;
    case 'session-to-talk':
      closeSession({ force: true });
      navigate('talk');
      break;
    case 'save-settings':
      saveSettings();
      break;
    case 'export-data':
      exportBackup();
      break;
    case 'import-data':
      document.getElementById('import-file')?.click();
      break;
    case 'reset-data':
      resetLearningData();
      break;
    default:
      break;
  }
};

const handleSubmit = (event) => {
  const form = event.target.closest('form[data-action]');
  if (!form) return;
  event.preventDefault();
  if (form.dataset.action === 'session-typing-form') checkTypedAnswer();
  if (form.dataset.action === 'hint-recall-form') checkSessionHintRecall();
  if (form.dataset.action === 'tutor-hint-recall-form') submitTutorHintRecall(form);
  if (form.dataset.action === 'rapid-hint-recall-form') submitRapidHintRecall(form);
  if (form.dataset.action === 'listening-dictation-form') submitListeningDictation(form);
  if (form.dataset.action === 'placement-typing-form') {
    const answer = new FormData(form).get('answer') || '';
    recordPlacementAnswer(String(answer));
  }
};

const updateLibraryList = () => {
  const list = document.getElementById('word-list');
  if (!list) return;
  list.innerHTML = renderWordRows();
  hydrateStaticIcons(list);
};

const handleInput = (event) => {
  if (event.target.id === 'library-search') {
    libraryQuery = event.target.value;
    updateLibraryList();
  }
  if (event.target.id === 'session-answer' && session && !session.answered) {
    session.typedAnswer = event.target.value;
  }
  if (event.target.id === 'hint-recall-answer' && session && !session.answered) {
    session.hintRecallValue = event.target.value;
  }
  if (event.target.id === 'placement-answer' && placementSession && !placementSession.answered) {
    placementSession.typedAnswer = event.target.value;
  }
  if (event.target.id === 'listening-answer' && activeListeningLab) {
    const item = currentListeningItem();
    if (item && !item.answered) item.typed = event.target.value;
  }
};

const handleChange = (event) => {
  if (event.target.id === 'library-filter') {
    libraryFilter = event.target.value;
    updateLibraryList();
  }
  if (event.target.id === 'import-file') {
    importBackupFile(event.target.files?.[0]);
  }
};

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    if (morphologyContext) closeMorphologyLens();
    else if (activeListeningLab) closeListeningLab();
    else if (activeSoundLab) closeSoundLab();
    else if (session) closeSession();
    else if (placementSession) {
      const incomplete = !placementSession.summary && placementSession.results.length > 0;
      if (!incomplete || window.confirm('Leave this level check? Your answers in this unfinished check will not be saved.')) closePlacementTest();
    } else if (modalRoot.innerHTML) closeModal();
    return;
  }
  if (event.key === 'Enter' && !event.shiftKey && event.target.id === 'conversation-input') {
    event.preventDefault();
    sendConversationReply();
  }
  if (event.key === 'Enter' && !event.shiftKey && event.target.id === 'tutor-input') {
    event.preventDefault();
    sendTutorMessage();
  }
};

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  try {
    const reloadKey = `blisko-sw-reload-v${APP_VERSION}`;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, '1');
      location.reload();
    });
    const registration = await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`, { updateViaCache: 'none' });
    if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Verified update ready', 'All app files were downloaded as one matching build. Blisko will restart once.', 'download');
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
    registration.update().catch(() => null);
  } catch {
    showToast('Offline installation unavailable', 'The app still works, but this browser could not register the verified offline build.', 'alert');
  }
};

const setupInstallPrompt = () => {
  const button = document.getElementById('install-button');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    button.classList.add('install-visible');
  });
  button.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showToast('Install from your browser menu', 'Look for “Install app” or “Add to Home Screen”.', 'download');
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    button.classList.remove('install-visible');
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    button.classList.remove('install-visible');
    showToast('Blisko installed', 'Your coach is now one tap away and works offline.', 'check');
  });
};

const repairKnownTutorMisroutes = () => {
  const messages = state?.tutor?.messages;
  if (!Array.isArray(messages) || messages.length < 2) return false;
  let changed = false;

  for (let index = 1; index < messages.length; index += 1) {
    const previous = messages[index - 1];
    const current = messages[index];
    if (previous?.role !== 'user' || current?.role !== 'assistant') continue;

    const askedAboutCounting = /(?:count|numbers?).*(?:10|ten)|(?:tellen|cijfers|getallen).*(?:10|tien)/i.test(previous.text || '');
    const oldFalseMatch = /sound of polish ł/i.test(current.reply?.title || '');
    if (askedAboutCounting && oldFalseMatch) {
      current.reply = localTutorReply(previous.text, state);
      changed = true;
    }
  }
  return changed;
};

const initialize = async () => {
  state = await loadState({ appVersion: APP_VERSION });
  await save({ immediate: true });
  try {
    const automaticBackup = await ensureAutomaticBackup(state, { appVersion: APP_VERSION });
    if (automaticBackup) await save({ immediate: true });
  } catch {
    // A blocked safety copy must never block the learning app.
  }
  if (repairKnownTutorMisroutes()) await save({ immediate: true });
  setTheme(state.settings.theme || 'dark');
  refreshPolishVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshPolishVoices);
    setTimeout(refreshPolishVoices, 350);
  }
  const initialHash = location.hash.replace('#', '');
  currentView = PAGE_META[initialHash] ? initialHash : (PAGE_META[state.ui.lastView] ? state.ui.lastView : 'dashboard');
  if (location.hash !== `#${currentView}`) history.replaceState(null, '', `#${currentView}`);

  PATTERNS.forEach((pattern) => {
    patternSelections[pattern.id] = { ...pattern.default };
  });

  document.addEventListener('click', handleAction);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  window.addEventListener('popstate', () => {
    const view = location.hash.replace('#', '');
    currentView = PAGE_META[view] ? view : 'dashboard';
    renderView();
    updateShell();
  });
  window.addEventListener('beforeunload', () => flushState());
  window.addEventListener('scroll', () => document.querySelector('.topbar')?.classList.toggle('scrolled', window.scrollY > 3), { passive: true });

  document.getElementById('profile-button').addEventListener('click', openSettings);
  document.getElementById('theme-button').addEventListener('click', () => {
    setTheme(state.settings.theme === 'dark' ? 'light' : 'dark');
    save();
  });
  document.getElementById('mobile-logo').addEventListener('click', () => navigate('dashboard'));
  document.getElementById('streak-button').addEventListener('click', () => {
    showToast(`${state.stats.streak || 0}-day conversation streak`, state.stats.streak ? 'A day counts when you retrieve, speak, or complete a real turn.' : 'Complete one useful learning action today to start it.', 'calendar');
  });

  setupVisualViewport();
  hydrateStaticIcons(document);
  updateShell();
  renderView();
  setupInstallPrompt();
  registerServiceWorker();
  updateConnectionStatus();
  document.documentElement.dataset.bliskoReady = 'true';
  markStartupHealthy(state, APP_VERSION).catch(() => false);

  if (navigator.storage?.persist) navigator.storage.persist().catch(() => false);
};

initialize().catch((error) => {
  console.error(error);
  mainContent.innerHTML = `
    <div class="empty-state card" style="margin-top:30px">
      <span class="empty-state-icon">${icon('alert')}</span>
      <h3>Blisko could not start</h3>
      <p>${escapeHtml(error.message || 'An unexpected local storage error occurred.')}</p>
      <button class="primary-button" type="button" onclick="location.reload()">Reload app</button>
    </div>
  `;
});
