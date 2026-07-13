import {
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
} from './data.js';
import {
  loadState,
  saveState,
  flushState,
  resetState,
  exportState,
  importState,
} from './storage.js';
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
  normalizeText,
  shuffle,
} from './engine.js';
import { localTutorReply, cloudTutorReply } from './tutor.js';

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

const mainContent = document.getElementById('main-content');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

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

const speak = (text, { rate = state.settings.speechRate, onEnd = null } = {}) => {
  if (!('speechSynthesis' in window)) {
    showToast('Speech is unavailable', 'This browser does not expose text-to-speech.', 'alert');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pl-PL';
  utterance.rate = Number(rate) || 0.86;
  const voices = window.speechSynthesis.getVoices();
  const polish = voices.find((voice) => voice.lang?.toLowerCase().startsWith('pl'));
  if (polish) utterance.voice = polish;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
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
          <div class="pattern-sentence">${escapeHtml(sentence)}</div>
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
          <button class="text-button" type="button" data-action="speak" data-text="${escapeHtml(sentence)}">Listen ${icon('volume')}</button>
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
            <div class="big-pattern">${escapeHtml(sentence)}</div>
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
  return state.conversation.transcripts[personaId];
};

const renderConversationMessage = (message, persona) => {
  if (message.sender === 'correction') {
    return `
      <div class="correction-card">
        <strong>${message.correction ? 'Tiny correction' : 'Coach note'}</strong>
        <p>${escapeHtml(message.feedback)}${message.suggestion ? ` <b>Try:</b> ${escapeHtml(message.suggestion)}` : ''}</p>
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
        <p class="message-polish">${escapeHtml(message.text)}</p>
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
            ${!transcript.completed && state.conversation.level === 'guided' ? `
              <div class="response-suggestions">
                ${currentTurn.suggestions.map((suggestion) => `<button class="response-chip" type="button" data-action="talk-suggestion" data-text="${escapeHtml(suggestion.pl)}">${escapeHtml(suggestion.pl)}</button>`).join('')}
              </div>
            ` : ''}
            <div class="talk-composer">
              <div class="composer-box">
                <button class="mic-button" type="button" data-action="conversation-mic" aria-label="Dictate in Polish">${icon('mic')}</button>
                <textarea id="conversation-input" rows="1" placeholder="Answer in Polish… one short phrase is enough" ${transcript.completed ? 'disabled' : ''}></textarea>
                <button class="send-button" type="button" data-action="talk-send" aria-label="Send reply" ${transcript.completed ? 'disabled' : ''}>${icon('send')}</button>
              </div>
              <div class="composer-helper"><span>Enter to send · Shift+Enter for a new line</span><span>${state.conversation.level === 'guided' ? 'Suggestions visible' : state.conversation.level === 'natural' ? 'Translations visible' : 'Minimal support'}</span></div>
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

const renderTutorReply = (reply) => `
  <div class="tutor-bubble">
    <h4>${escapeHtml(reply.title || 'Tutor explanation')}</h4>
    ${state.settings.showDutch && reply.nl ? `<p><strong>NL</strong> ${escapeHtml(reply.nl)}</p>` : ''}
    ${state.settings.showEnglish && reply.en ? `<p><strong>EN</strong> ${escapeHtml(reply.en)}</p>` : ''}
    ${(reply.examples || []).map((example) => `
      <div class="example-block">
        <strong>${escapeHtml(example[0] || '')}</strong>
        <span>${state.settings.showDutch ? `NL ${escapeHtml(example[1] || '')}` : ''}${state.settings.showDutch && state.settings.showEnglish ? ' · ' : ''}${state.settings.showEnglish ? `EN ${escapeHtml(example[2] || '')}` : ''}</span>
        <button class="text-button" style="margin-top:5px" type="button" data-action="speak" data-text="${escapeHtml(example[0] || '')}">${icon('volume')} Listen</button>
      </div>
    `).join('')}
    ${reply.exercise ? `
      <div class="feedback-box">
        <h4>Quick check</h4>
        <p>${escapeHtml(reply.exercise.prompt || '')}</p>
        <div class="slot-row" style="margin:10px 0 0">
          ${(reply.exercise.options || []).map((option) => `<button class="slot-button" type="button" data-action="tutor-check" data-answer="${escapeHtml(reply.exercise.answer || '')}" data-option="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}
        </div>
      </div>
    ` : ''}
  </div>
`;

function renderTutor() {
  const messages = state.tutor.messages || [];
  const weak = getWeakItems(state, 3);
  const localMode = !state.settings.aiProxyUrl;
  const prompts = [
    'Why is it “do Polski”?',
    'Explain iść vs jechać in Dutch.',
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
            <span><strong>Blisko tutor</strong><span>Dutch-first · English-supported · remembers your weak spots</span></span>
          </div>
          <span class="local-pill">${localMode ? 'LOCAL · OFFLINE' : 'AI PROXY + LOCAL FALLBACK'}</span>
        </header>
        <div class="tutor-messages" id="tutor-messages">
          ${renderTutorReply(tutorWelcome())}
          ${messages.map((message) => message.role === 'user'
            ? `<div class="tutor-bubble user"><p>${escapeHtml(message.text)}</p></div>`
            : renderTutorReply(message.reply)).join('')}
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
  const evidenceUnits = state.stats.reviews
    + state.stats.speakingAttempts * 2
    + state.stats.conversationTurns * 1.5
    + Object.keys(state.progress.concepts).length * 2;
  const estimateEvidence = clamp(evidenceUnits / 110);
  const estimateConfidence = estimateEvidence < 0.25 ? 'early estimate' : estimateEvidence < 0.62 ? 'growing evidence' : 'well supported';
  const forecastCopy = estimatedDays
    ? `Realistic range: ${estimateLow}–${estimateHigh} days. The estimate becomes more personal after every speaking attempt and conversation.`
    : 'Your current evidence has reached the comfortable family-small-talk target.';
  const forecastCopyNl = estimatedDays
    ? `Realistische bandbreedte: ${estimateLow}–${estimateHigh} dagen. De schatting wordt persoonlijker na elke spreekoefening en elk gesprek.`
    : 'Je huidige resultaten hebben het doel voor ontspannen familiegesprekken bereikt.';
  const production = clamp(metrics.speaking * 0.48 + metrics.grammar * 0.27 + metrics.conversationReadiness * 0.25);
  const snapshotSkills = [
    { title: 'Reading', secondary: 'Lezen', value: metrics.reading },
    { title: 'Producing', secondary: 'Produceren', value: production },
    { title: 'Listening', secondary: 'Luisteren', value: metrics.listening },
    { title: 'Speaking', secondary: 'Spreken', value: metrics.speaking },
  ];
  const detailedSkills = [
    { id: 'speaking', title: 'Speaking', value: metrics.speaking, icon: 'mic', detail: `${state.stats.speakingAttempts} attempts` },
    { id: 'listening', title: 'Listening', value: metrics.listening, icon: 'headphones', detail: 'meaning at natural speed' },
    { id: 'reading', title: 'Reading', value: metrics.reading, icon: 'book', detail: `${state.stats.wordsSeen.length} items seen` },
    { id: 'grammar', title: 'Grammar', value: metrics.grammar, icon: 'brain', detail: `${Object.keys(state.progress.concepts).length} patterns touched` },
    { id: 'conversation', title: 'Conversation', value: metrics.conversationReadiness, icon: 'message', detail: `${state.stats.conversationTurns} turns` },
  ];
  const hasSkillEvidence = snapshotSkills.some((skill) => skill.value > 0.01);
  const strongestSkill = hasSkillEvidence
    ? [...snapshotSkills].sort((a, b) => b.value - a.value)[0]
    : { title: 'Baseline pending', secondary: 'Nog te meten', value: 0 };
  const weakestSkill = hasSkillEvidence
    ? [...snapshotSkills].sort((a, b) => a.value - b.value)[0]
    : { title: 'Speaking', secondary: 'Spreken', value: 0 };
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
                <span><strong>${escapeHtml(skill.title)}</strong><small lang="nl">${escapeHtml(skill.secondary)}</small></span>
                <div class="snapshot-skill-track"><i style="width:${Math.round(skill.value * 100)}%"></i></div>
                <b>${Math.round(skill.value * 100)}%</b>
              </div>
            `).join('')}
          </div>
          <div class="snapshot-skill-note">${hasSkillEvidence ? `Next leverage point: <strong>${escapeHtml(weakestSkill.title)}</strong>. Blisko will quietly weight this skill more often in review and conversation practice.` : `Complete one short review and one speaking attempt to establish a personal skill baseline.`}</div>
        </article>
      </section>

      <section class="progress-overview">
        <article class="card cefr-card" style="--cefr-progress:${Math.round(metrics.cefrProgress * 100)}%">
          <div>
            <p class="eyebrow progress-page-eyebrow">ESTIMATED COMMUNICATIVE LEVEL <small lang="nl">GESCHAT COMMUNICATIEF NIVEAU</small></p>
            <h2>${levelLabel} → ${metrics.nextCefr}</h2>
            <p>This is a conservative estimate from active recall, speaking, listening, grammar patterns, and completed scenarios—not a claim based on lesson count.</p>
            <div class="cefr-scale">
              ${['A0','A1','A2','B1','B2','C1'].map((label) => `<span class="${levelLabel === label ? 'active' : ''}">${label}</span>`).join('')}
            </div>
          </div>
          <div class="cefr-badge"><strong>${levelLabel}</strong><span>${Math.round(metrics.cefrProgress * 100)}% to ${metrics.nextCefr}</span></div>
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
        <span class="word-polish"><strong>${escapeHtml(word.pl)}</strong><span>${escapeHtml(word.example)}</span></span>
        <span class="word-translation"><strong>${escapeHtml(word.nl)}</strong><span>${escapeHtml(word.en)}</span></span>
        <span class="word-kind">${escapeHtml(word.type)}</span>
        <span class="word-topic">${escapeHtml(word.topic)}</span>
        <span class="word-mastery"><span class="progress-track"><span style="width:${Math.round((progress?.confidence || 0) * 100)}%"></span></span><span>${progress ? `${Math.round(progress.confidence * 100)}%` : 'new'}</span></span>
      </button>
    `;
  }).join('');
}

const startSession = ({ mode = 'smart', topic = null, itemIds = null, length = 8, title = null } = {}) => {
  const language = primaryLanguage();
  const exercises = itemIds?.length
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
    startedAt: Date.now(),
    summarySaved: false,
  };
  document.body.style.overflow = 'hidden';
  renderSession();
};

const currentExercise = () => session?.exercises?.[session.index] || null;

const renderSession = () => {
  if (!session) return;
  const complete = session.index >= session.exercises.length;
  if (complete && !session.summarySaved) finalizeSession();

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
        ${complete ? `<div class="session-footer-inner"><button class="primary-button" type="button" data-action="finish-session">Back to coach ${icon('arrow')}</button></div>` : renderSessionFooter()}
      </footer>
    </div>
  `;
  hydrateStaticIcons(modalRoot);
  if (!complete && currentExercise()?.type === 'typing' && !session.answered) {
    setTimeout(() => document.getElementById('session-answer')?.focus(), 30);
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

  return `
    <article class="exercise-card">
      <div class="exercise-eyebrow"><span>${escapeHtml(exercise.instruction)}</span><span class="exercise-skill">${escapeHtml(exercise.skill)}</span></div>
      <p class="exercise-prompt">${exercise.type === 'listening' ? 'Catch the message, not every sound.' : exercise.type === 'speaking' ? 'Read once, then look away if you can.' : 'Use the whole phrase as a speaking block.'}</p>
      <div class="exercise-main-text">${escapeHtml(exercise.mainText)}</div>
      ${visibleSubText ? `<div class="exercise-subtext${testsMeaning && !session.answered ? ' protected' : ''}">${escapeHtml(visibleSubText)}</div>` : '<div class="exercise-subtext empty" aria-hidden="true"></div>'}
      ${interaction}
      ${session.answered ? renderExerciseFeedback(exercise) : ''}
    </article>
  `;
};

const renderExerciseFeedback = (exercise) => {
  const result = session.answerResult || { correct: true, message: 'Done.' };
  const feedbackClass = result.correct ? 'correct' : 'wrong';
  const item = ITEM_MAP.get(exercise.itemId);
  const concept = (item?.grammar || []).map((id) => CONCEPT_MAP.get(id)).find(Boolean);
  const testsMeaning = exercise.answerKind === 'meaning'
    || ((exercise.type === 'choice' || exercise.type === 'listening')
      && /choose the meaning/i.test(exercise.instruction || ''));
  const meaningReveal = testsMeaning && item
    ? `<div class="feedback-meaning"><span><strong>NL</strong> ${escapeHtml(item.nl || '')}</span><span><strong>EN</strong> ${escapeHtml(item.en || '')}</span></div>`
    : '';
  return `
    <div class="feedback-box ${feedbackClass}">
      <h4>${result.correct ? 'Good retrieval' : result.close ? 'Almost there' : 'Build this memory again'}</h4>
      <p>${escapeHtml(result.message || '')}</p>
      ${!result.correct || exercise.type === 'speaking' ? `<span class="feedback-answer">${escapeHtml(exercise.answer)}</span>` : ''}
      ${meaningReveal}
      ${concept ? `<p style="margin-top:7px"><strong>Why:</strong> ${escapeHtml(primaryLanguage() === 'nl' ? concept.nl : concept.en)}</p>` : ''}
    </div>
  `;
};

const renderSessionFooter = () => {
  if (!session.answered) {
    return `<div class="session-footer-inner"><span class="rating-prompt">Answer first. Then tell the coach how the memory felt.</span><button class="ghost-button" type="button" data-action="skip-exercise">Skip for now</button></div>`;
  }
  return `
    <div class="session-footer-inner">
      <span class="rating-prompt">How did this retrieval feel?</span>
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
  const strong = session.results.filter((result) => result.rating >= 2).length;
  const newItems = session.results.filter((result) => result.wasNew).length;
  const metrics = getMetrics(state);
  return `
    <section class="session-summary">
      <div class="summary-icon">✓</div>
      <h2>Dobra robota, ${escapeHtml(state.profile.name)}.</h2>
      <p>The coach has already changed future intervals and noted where a new sentence context is needed.</p>
      <div class="summary-grid">
        <div class="summary-stat"><strong>${correct}/${session.exercises.length}</strong><span>retrieved correctly</span></div>
        <div class="summary-stat"><strong>${strong}</strong><span>stable memories</span></div>
        <div class="summary-stat"><strong>${session.minutes || 0} min</strong><span>focused practice</span></div>
      </div>
      <div class="feedback-box correct" style="text-align:left;margin-bottom:20px">
        <h4>What changed</h4>
        <p>${newItems ? `${newItems} new item${newItems === 1 ? '' : 's'} entered your memory model. ` : ''}${metrics.unlockedConversations ? `You can now handle ${metrics.unlockedConversations} tracked scenarios at basic readiness.` : 'Your first conversation-readiness signals are now being collected.'}</p>
      </div>
      <div class="button-row" style="justify-content:center">
        <button class="primary-button" type="button" data-action="finish-session">Return to coach</button>
        <button class="secondary-button" type="button" data-action="session-to-talk">Use it in conversation</button>
      </div>
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
};

const answerChoice = (option) => {
  if (!session || session.answered) return;
  const exercise = currentExercise();
  const result = evaluateAnswer(option, exercise.answer);
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
  session.answerResult = evaluateAnswer(value, currentExercise().answer);
  session.answered = true;
  haptic(session.answerResult.correct ? 8 : [20, 35, 20]);
  renderSession();
};

const checkOrderedAnswer = () => {
  if (!session || session.answered) return;
  const value = session.orderSelected.map((token) => token.value).join(' ');
  session.answerResult = evaluateAnswer(value, currentExercise().answer);
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

const rateCurrentExercise = (rating) => {
  if (!session || !session.answered) return;
  const exercise = currentExercise();
  const itemProgressBefore = state.progress.items[exercise.itemId];
  const result = session.answerResult || { correct: true, score: 0.7 };
  reviewItem(state, exercise.itemId, rating, {
    type: exercise.type,
    correct: result.correct,
    score: result.score,
  });
  if (exercise.type === 'listening') recordSkillEvidence(state, 'listening', result.correct ? Math.max(0.65, result.score || 0.8) : result.score || 0.2);
  if (exercise.type === 'speaking') recordSkillEvidence(state, 'speaking', rating / 3);
  if (exercise.type === 'typing' || exercise.type === 'ordering') recordSkillEvidence(state, 'grammar', result.correct ? result.score || 0.8 : result.score || 0.2);
  recordSkillEvidence(state, 'reading', result.correct ? 0.8 : 0.3);

  session.results.push({
    itemId: exercise.itemId,
    correct: Boolean(result.correct),
    rating: Number(rating),
    wasNew: !itemProgressBefore,
  });
  if (result.correct) session.score += Number(rating) + 1;
  session.index += 1;
  resetExerciseState();
  save();
  renderSession();
};

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

const renderMatchingGame = () => {
  if (activeGame.finished) {
    const label = activeGame.type === 'memory' ? 'memory pairs' : 'meaning pairs';
    return `
      <section class="session-summary" style="margin:auto">
        <div class="summary-icon">✓</div>
        <h2>All ${label} found.</h2>
        <p>${activeGame.moves} moves gave the coach evidence about what your brain links automatically.</p>
        <div class="button-row" style="justify-content:center"><button class="primary-button" type="button" data-action="finish-game">Done</button><button class="secondary-button" type="button" data-action="restart-game" data-game="${activeGame.type}">Play again</button></div>
      </section>
    `;
  }
  return `
    <div>
      <div class="section-heading"><div><h3>${activeGame.matchedPairs} / ${activeGame.tiles.length / 2} pairs</h3><p>${activeGame.type === 'memory' ? 'Reveal two cards and connect Polish to meaning.' : 'Select one Polish tile and one meaning tile.'}</p></div><span class="soft-pill" style="padding:6px 9px;background:var(--green-soft);color:var(--green);font-size:9px">${activeGame.moves} moves</span></div>
      <div class="match-grid">
        ${activeGame.tiles.map((tile) => {
          const selected = activeGame.selectedIds.includes(tile.id);
          const visible = tile.revealed || selected || tile.matched;
          return `
            <button class="match-tile ${selected ? 'selected' : ''} ${tile.matched ? 'matched' : ''}" type="button" data-action="game-tile" data-tile="${tile.id}" ${tile.matched || activeGame.locked ? 'disabled' : ''}>
              ${visible ? escapeHtml(tile.text) : '• • •'}
            </button>
          `;
        }).join('')}
      </div>
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
        <p>Speed is only useful after meaning. Missed items were moved closer in the adaptive queue.</p>
        <div class="button-row" style="justify-content:center"><button class="primary-button" type="button" data-action="finish-game">Done</button><button class="secondary-button" type="button" data-action="restart-game" data-game="rapid">Again</button></div>
      </section>
    `;
  }
  const item = activeGame.items[activeGame.index];
  const options = rapidOptions(item);
  return `
    <div>
      <div class="rapid-timer"><span style="--time:${100 - activeGame.index / activeGame.items.length * 100}%"></span></div>
      <div class="rapid-card"><strong>${escapeHtml(item.pl)}</strong><span>${escapeHtml(item.type)} · ${activeGame.index + 1} / ${activeGame.items.length}</span><button class="text-button" type="button" data-action="speak" data-text="${escapeHtml(item.pl)}">${icon('volume')} Listen</button></div>
      <div class="answer-options" style="margin-top:13px">
        ${options.map((option, index) => {
          const correct = normalizeText(option, { loose: true }) === normalizeText(primaryTranslation(item), { loose: true });
          const selected = activeGame.selected === option;
          const className = activeGame.answered ? correct ? 'correct' : selected ? 'wrong' : '' : '';
          return `<button class="answer-option ${className}" type="button" data-action="rapid-answer" data-option="${escapeHtml(option)}" ${activeGame.answered ? 'disabled' : ''}><span class="option-letter">${String.fromCharCode(65 + index)}</span><strong>${escapeHtml(option)}</strong></button>`;
        }).join('')}
      </div>
    </div>
  `;
};

const handleGameTile = (tileId) => {
  if (!activeGame || activeGame.locked || activeGame.finished) return;
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
      reviewItem(state, first.pairId, 2, { type: 'game', correct: true, score: 1 });
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
      save();
    }
    renderGameModal();
  }, match ? 280 : 720);
};

const handleRapidAnswer = (option) => {
  if (!activeGame || activeGame.type !== 'rapid' || activeGame.answered) return;
  const item = activeGame.items[activeGame.index];
  const correct = normalizeText(option, { loose: true }) === normalizeText(primaryTranslation(item), { loose: true });
  activeGame.answered = true;
  activeGame.selected = option;
  if (correct) activeGame.score += 1;
  reviewItem(state, item.id, correct ? 2 : 0, { type: 'rapid', correct, score: correct ? 1 : 0 });
  haptic(correct ? 8 : [18, 30, 18]);
  renderGameModal();
  setTimeout(() => {
    if (!activeGame || activeGame.type !== 'rapid') return;
    activeGame.index += 1;
    activeGame.answered = false;
    activeGame.selected = null;
    if (activeGame.index >= activeGame.items.length) {
      activeGame.finished = true;
      addActivity(state, { games: 1, minutes: Math.max(2, Math.round((Date.now() - activeGame.startedAt) / 60_000)) });
      save();
    }
    renderGameModal();
  }, 620);
};

const openSettings = () => {
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
        <div class="form-field" style="margin-top:12px"><label for="settings-rate">Polish speech speed · ${Math.round(state.settings.speechRate * 100)}%</label><input id="settings-rate" type="range" min="0.55" max="1.05" step="0.05" value="${state.settings.speechRate}"></div>
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
          <div class="form-field"><label>Local backup</label><div class="button-row"><button class="secondary-button" type="button" data-action="export-data">${icon('download')} Export</button><button class="secondary-button" type="button" data-action="import-data">${icon('upload')} Import</button></div><input id="import-file" class="hidden" type="file" accept="application/json"></div>
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
    state = importState(raw);
    setTheme(state.settings.theme);
    await save({ immediate: true });
    closeModal();
    updateShell();
    renderView();
    showToast('Backup restored', 'Your learner model is active again.', 'check');
  } catch (error) {
    showToast('Could not import backup', error.message || 'The file was not valid.', 'alert');
  }
};

const resetLearningData = async () => {
  if (!window.confirm('Reset all progress, tutor memory, and conversation history on this device?')) return;
  state = await resetState();
  setTheme(state.settings.theme);
  closeModal();
  navigate('dashboard', { replace: true });
  showToast('Learning data reset', 'You are back at a fresh starting point.', 'trash');
};

const openWordDetail = (wordId) => {
  const word = WORD_MAP.get(wordId);
  if (!word) return;
  const progress = state.progress.items[wordId];
  const phrases = PHRASES.filter((phrase) => phrase.words?.includes(wordId)).slice(0, 4);
  openModal(`
    <header class="modal-header">
      <div><h2>${escapeHtml(word.pl)}</h2><p>${escapeHtml(word.type)} · frequency rank ${word.frequency} in the curated starter set</p></div>
      <button class="modal-close" type="button" data-action="modal-close" aria-label="Close">${icon('close')}</button>
    </header>
    <div class="modal-body">
      <div class="page-intro card" style="margin-bottom:18px">
        <div><p class="eyebrow">POLISH IN CONTEXT</p><h2>${escapeHtml(word.pl)}</h2><p>NL ${escapeHtml(word.nl)} · EN ${escapeHtml(word.en)}</p></div>
        <button class="speaker-button" type="button" data-action="speak" data-text="${escapeHtml(word.pl)}">${icon('volume')}</button>
      </div>
      <div class="form-grid">
        <div class="language-explanation"><span class="lang-tag">EXAMPLE</span><p><strong>${escapeHtml(word.example || word.pl)}</strong></p><button class="text-button" type="button" data-action="speak" data-text="${escapeHtml(word.example || word.pl)}">${icon('volume')} Listen</button></div>
        <div class="language-explanation"><span class="lang-tag">MEMORY</span><p>${progress ? `${Math.round(progress.confidence * 100)}% confidence · ${progress.reps} reviews · ${progress.lapses} lapses` : 'New item. The coach has not tested this memory yet.'}</p></div>
      </div>
      ${phrases.length ? `<section style="margin-top:20px"><div class="section-heading"><div><h3>Useful sentences</h3><p>The word changes shape when the sentence needs it.</p></div></div><div class="insight-list">${phrases.map((phrase) => `<div class="insight-row"><span class="insight-bullet">›</span><p>${escapeHtml(phrase.pl)}<span>${escapeHtml(primaryTranslation(phrase))}</span></p></div>`).join('')}</div></section>` : ''}
    </div>
    <footer class="modal-footer"><button class="secondary-button" type="button" data-action="speak" data-text="${escapeHtml(word.example || word.pl)}">${icon('volume')} Hear example</button><button class="primary-button" type="button" data-action="review-word" data-word="${word.id}">Practise this word</button></footer>
  `, { label: word.pl });
};

const sendConversationReply = (providedText = null) => {
  const persona = PERSONAS.find((entry) => entry.id === state.conversation.selectedPersona) || PERSONAS[0];
  const conversation = CONVERSATIONS[persona.id];
  const transcript = ensureConversationState(persona.id);
  if (!conversation || !transcript || transcript.completed) return;

  const input = document.getElementById('conversation-input');
  const text = (providedText ?? input?.value ?? '').trim();
  if (!text) {
    showToast('Say one short Polish phrase', 'A partial answer is enough to keep the conversation moving.', 'message');
    return;
  }

  const turn = conversation.turns[transcript.turnIndex];
  const evaluation = evaluateConversationReply(text, turn);
  transcript.messages.push({ sender: 'user', text, at: new Date().toISOString() });
  transcript.messages.push({
    sender: 'correction',
    feedback: `${evaluation.feedback}${turn.coach ? ` ${turn.coach}` : ''}`,
    correction: evaluation.correction,
    suggestion: evaluation.accepted ? '' : evaluation.suggestion,
    at: new Date().toISOString(),
  });
  recordConversationTurn(state, persona.id, evaluation.score);
  addActivity(state, { minutes: 0.5 });

  let nextText = null;
  if (evaluation.accepted || state.conversation.level === 'guided') {
    transcript.turnIndex += 1;
    if (transcript.turnIndex >= conversation.turns.length) {
      transcript.completed = true;
      transcript.messages.push({ sender: 'system', text: 'Scenario complete · feedback has been added to your learner model.' });
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
    case 'speak':
      speak(target.dataset.text || '');
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
    case 'tutor-check': {
      const result = evaluateAnswer(target.dataset.option || '', target.dataset.answer || '');
      recordSkillEvidence(state, 'grammar', result.correct ? 0.9 : 0.2);
      save();
      showToast(result.correct ? 'Exactly' : 'Look at the sentence frame again', result.correct ? 'The pattern is becoming available for active use.' : `Best answer: ${target.dataset.answer}`, result.correct ? 'check' : 'lightbulb');
      break;
    }
    case 'open-settings':
      openSettings();
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
    case 'rapid-answer':
      handleRapidAnswer(target.dataset.option);
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
    case 'record-speech':
      startLocalRecording();
      break;
    case 'complete-speaking':
      completeSpeaking();
      break;
    case 'rate-exercise':
      rateCurrentExercise(Number(target.dataset.rating));
      break;
    case 'skip-exercise':
      skipCurrentExercise();
      break;
    case 'close-session':
      closeSession();
      break;
    case 'finish-session':
      closeSession({ force: true });
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
    if (session) closeSession();
    else if (modalRoot.innerHTML) closeModal();
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
    const registration = await navigator.serviceWorker.register('./sw.js');
    if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Offline app updated', 'The newest version will be used on your next launch.', 'download');
        }
      });
    });
  } catch {
    showToast('Offline installation unavailable', 'The app still works, but this browser could not register the cache.', 'alert');
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

const initialize = async () => {
  state = await loadState();
  setTheme(state.settings.theme || 'dark');
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

  hydrateStaticIcons(document);
  updateShell();
  renderView();
  setupInstallPrompt();
  registerServiceWorker();
  updateConnectionStatus();

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
