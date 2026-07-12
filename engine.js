import {
  WORDS,
  PHRASES,
  GRAMMAR_CONCEPTS,
  REAL_LIFE_SCENARIOS,
  TOPICS,
  PATTERNS,
} from './data.js';
import { getTodayKey } from './storage.js';

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

export const ITEM_MAP = new Map([
  ...WORDS.map((item) => [item.id, { ...item, itemType: 'word' }]),
  ...PHRASES.map((item) => [item.id, { ...item, itemType: 'phrase' }]),
]);

export const WORD_MAP = new Map(WORDS.map((item) => [item.id, item]));
export const PHRASE_MAP = new Map(PHRASES.map((item) => [item.id, item]));
export const CONCEPT_MAP = new Map(GRAMMAR_CONCEPTS.map((item) => [item.id, item]));
export const TOPIC_MAP = new Map(TOPICS.map((item) => [item.id, item]));
export const PATTERN_MAP = new Map(PATTERNS.map((item) => [item.id, item]));

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const seededRandom = (seed) => {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) value = ((value << 5) - value + seed.charCodeAt(i)) | 0;
  return () => {
    value = Math.imul(48271, value || 1) % 2147483647;
    return (value & 2147483647) / 2147483647;
  };
};

export const shuffle = (array, seed = `${Date.now()}-${Math.random()}`) => {
  const random = seededRandom(seed);
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const stripDiacritics = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ł/g, 'l')
  .replace(/Ł/g, 'L');

export const normalizeText = (value = '', { loose = false } = {}) => {
  let normalized = String(value)
    .toLowerCase()
    .replace(/[„”"'!?.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (loose) normalized = stripDiacritics(normalized);
  return normalized;
};

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
};

export const similarity = (a, b) => {
  const left = normalizeText(a, { loose: true });
  const right = normalizeText(b, { loose: true });
  if (!left && !right) return 1;
  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length, 1);
};

export const evaluateAnswer = (input, expected) => {
  const exactInput = normalizeText(input);
  const exactExpected = normalizeText(expected);
  const looseInput = normalizeText(input, { loose: true });
  const looseExpected = normalizeText(expected, { loose: true });
  const exact = exactInput === exactExpected;
  const diacriticsOnly = !exact && looseInput === looseExpected;
  const score = similarity(input, expected);
  const correct = exact || diacriticsOnly || score >= 0.9;
  const close = !correct && score >= 0.68;
  return {
    correct,
    close,
    exact,
    diacriticsOnly,
    score,
    message: exact
      ? 'Natural and correct.'
      : diacriticsOnly
        ? 'Correct meaning. Add the Polish letters when you can.'
        : close
          ? 'Very close—compare the ending and word order.'
          : 'Not yet. Notice the whole phrase, especially the ending.',
  };
};

export const ensureItemProgress = (state, itemId) => {
  if (!state.progress.items[itemId]) {
    state.progress.items[itemId] = {
      reps: 0,
      lapses: 0,
      correct: 0,
      incorrect: 0,
      stability: 0.25,
      difficulty: 5,
      confidence: 0,
      dueAt: new Date(0).toISOString(),
      lastReviewedAt: null,
      lastRating: null,
      history: [],
    };
  }
  return state.progress.items[itemId];
};

export const ensureConceptProgress = (state, conceptId) => {
  if (!state.progress.concepts[conceptId]) {
    state.progress.concepts[conceptId] = {
      reviews: 0,
      mistakes: 0,
      confidence: 0,
      lastSeenAt: null,
    };
  }
  return state.progress.concepts[conceptId];
};

export const ensureTopicProgress = (state, topicId) => {
  if (!state.progress.topics[topicId]) {
    state.progress.topics[topicId] = {
      reviews: 0,
      correct: 0,
      confidence: 0,
      lastSeenAt: null,
    };
  }
  return state.progress.topics[topicId];
};

export const updateStreak = (state, eventDate = new Date()) => {
  const today = getTodayKey();
  const eventLocal = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * MINUTE_MS).toISOString().slice(0, 10);
  if (eventLocal !== today) return;

  if (state.stats.lastStudyDate === today) return;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = new Date(yesterdayDate.getTime() - yesterdayDate.getTimezoneOffset() * MINUTE_MS).toISOString().slice(0, 10);

  state.stats.streak = state.stats.lastStudyDate === yesterday ? state.stats.streak + 1 : 1;
  state.stats.bestStreak = Math.max(state.stats.bestStreak || 0, state.stats.streak);
  state.stats.lastStudyDate = today;
};

export const addActivity = (state, { minutes = 0, reviews = 0, speaking = 0, conversations = 0, games = 0 } = {}) => {
  const today = getTodayKey();
  if (state.stats.minutesDate !== today) {
    state.stats.minutesDate = today;
    state.stats.minutesToday = 0;
  }

  state.stats.minutesToday += minutes;
  state.stats.totalMinutes += minutes;
  state.stats.reviews += reviews;
  state.stats.speakingAttempts += speaking;
  state.stats.conversationTurns += conversations;
  state.stats.gamesPlayed += games;

  let day = state.stats.activity.find((entry) => entry.date === today);
  if (!day) {
    day = { date: today, minutes: 0, reviews: 0, speaking: 0, conversations: 0, games: 0 };
    state.stats.activity.push(day);
  }
  day.minutes += minutes;
  day.reviews += reviews;
  day.speaking += speaking;
  day.conversations += conversations;
  day.games += games;
  state.stats.activity = state.stats.activity
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-45);

  if (minutes > 0 || reviews > 0 || speaking > 0 || conversations > 0 || games > 0) updateStreak(state);
};

export const reviewItem = (state, itemId, rating, exercise = {}) => {
  const item = ITEM_MAP.get(itemId);
  if (!item) return null;
  const progress = ensureItemProgress(state, itemId);
  const now = new Date();
  const wasNew = progress.reps === 0;
  const numericRating = clamp(Number(rating), 0, 3);

  let intervalDays;
  if (numericRating === 0) {
    progress.lapses += 1;
    progress.incorrect += 1;
    progress.stability = Math.max(0.08, progress.stability * 0.38);
    progress.difficulty = clamp(progress.difficulty + 0.75, 1, 10);
    progress.confidence = clamp(progress.confidence - 0.18);
    intervalDays = 8 / 1440;
    state.stats.incorrect += 1;
  } else if (numericRating === 1) {
    progress.correct += exercise.correct === false ? 0 : 1;
    progress.incorrect += exercise.correct === false ? 1 : 0;
    progress.stability = wasNew ? 0.45 : Math.max(0.4, progress.stability * 1.22);
    progress.difficulty = clamp(progress.difficulty + 0.18, 1, 10);
    progress.confidence = clamp(progress.confidence + (exercise.correct === false ? -0.02 : 0.045));
    intervalDays = Math.max(0.35, progress.stability);
    if (exercise.correct === false) state.stats.incorrect += 1;
    else state.stats.correct += 1;
  } else if (numericRating === 2) {
    progress.correct += 1;
    progress.stability = wasNew
      ? 1
      : Math.max(1, progress.stability * (1.85 + (6 - progress.difficulty) * 0.06));
    progress.difficulty = clamp(progress.difficulty - 0.12, 1, 10);
    progress.confidence = clamp(progress.confidence + 0.115);
    intervalDays = progress.stability;
    state.stats.correct += 1;
  } else {
    progress.correct += 1;
    progress.stability = wasNew
      ? 4
      : Math.max(3, progress.stability * (2.55 + (6 - progress.difficulty) * 0.08));
    progress.difficulty = clamp(progress.difficulty - 0.38, 1, 10);
    progress.confidence = clamp(progress.confidence + 0.17);
    intervalDays = progress.stability;
    state.stats.correct += 1;
  }

  progress.reps += 1;
  progress.lastReviewedAt = now.toISOString();
  progress.lastRating = numericRating;
  progress.dueAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  progress.history.push({
    at: now.toISOString(),
    rating: numericRating,
    exerciseType: exercise.type || null,
    correct: exercise.correct ?? null,
    score: exercise.score ?? null,
  });
  progress.history = progress.history.slice(-30);

  if (item.itemType === 'word' && !state.stats.wordsSeen.includes(itemId)) state.stats.wordsSeen.push(itemId);
  if (item.itemType === 'phrase' && !state.stats.phrasesSeen.includes(itemId)) state.stats.phrasesSeen.push(itemId);

  const conceptIds = item.grammar || [];
  conceptIds.forEach((conceptId) => {
    const conceptProgress = ensureConceptProgress(state, conceptId);
    conceptProgress.reviews += 1;
    conceptProgress.lastSeenAt = now.toISOString();
    if (numericRating === 0 || exercise.correct === false) conceptProgress.mistakes += 1;
    const target = numericRating === 0 ? 0 : numericRating === 1 ? 0.42 : numericRating === 2 ? 0.76 : 0.94;
    conceptProgress.confidence = clamp(conceptProgress.confidence * 0.78 + target * 0.22);
  });

  if (item.topic) {
    const topicProgress = ensureTopicProgress(state, item.topic);
    topicProgress.reviews += 1;
    topicProgress.correct += numericRating >= 2 ? 1 : 0;
    topicProgress.lastSeenAt = now.toISOString();
    const target = numericRating === 0 ? 0 : numericRating === 1 ? 0.38 : numericRating === 2 ? 0.74 : 0.92;
    topicProgress.confidence = clamp(topicProgress.confidence * 0.8 + target * 0.2);
  }

  addActivity(state, {
    reviews: 1,
    speaking: exercise.type === 'speaking' ? 1 : 0,
  });

  return {
    progress,
    intervalDays,
    intervalLabel: formatInterval(intervalDays),
  };
};

export const formatInterval = (days) => {
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 1440))} min`;
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} hr`;
  if (days < 30) return `${Math.round(days)} d`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
};

export const getDueItems = (state, { now = new Date(), includeNew = false } = {}) => {
  const nowMs = now.getTime();
  const due = [];
  ITEM_MAP.forEach((item, id) => {
    const progress = state.progress.items[id];
    if (!progress) {
      if (includeNew) due.push({ item, progress: null, overdueMs: 0, score: 0 });
      return;
    }
    const dueMs = new Date(progress.dueAt).getTime();
    if (dueMs <= nowMs) {
      const overdueMs = Math.max(0, nowMs - dueMs);
      const weakness = (1 - progress.confidence) * 50 + progress.lapses * 8;
      due.push({ item, progress, overdueMs, score: weakness + overdueMs / DAY_MS });
    }
  });
  return due.sort((a, b) => b.score - a.score);
};

const itemPriorityScore = (state, item, { topic = null } = {}) => {
  const progress = state.progress.items[item.id];
  const unseenBonus = progress ? 0 : 58;
  const weakness = progress ? (1 - progress.confidence) * 45 + progress.lapses * 7 : 0;
  const dueBonus = progress && new Date(progress.dueAt).getTime() <= Date.now() ? 70 : 0;
  const priority = item.priority ?? Math.max(1, 125 - (item.frequency || 120));
  const topicBonus = topic && item.topic === topic ? 72 : 0;
  const phraseBonus = item.itemType === 'phrase' ? 18 : 0;
  const verbBonus = item.type === 'verb' ? 12 : 0;
  const familyBonus = ['family','greetings','food','visiting','questions'].includes(item.topic) ? 12 : 0;
  const staleness = progress?.lastReviewedAt
    ? Math.min(20, (Date.now() - new Date(progress.lastReviewedAt).getTime()) / DAY_MS)
    : 0;
  return unseenBonus + weakness + dueBonus + priority * 0.35 + topicBonus + phraseBonus + verbBonus + familyBonus + staleness;
};

const chooseExerciseType = (item, progress, index, mode) => {
  if (mode === 'speaking') return index % 2 === 0 ? 'speaking' : 'typing';
  if (mode === 'listening') return index % 2 === 0 ? 'listening' : 'choice';
  if (mode === 'review') {
    if (!progress || progress.confidence < 0.25) return index % 2 ? 'choice' : 'typing';
    return ['typing','ordering','listening','speaking'][index % 4];
  }
  if (!progress || progress.reps === 0) return index % 3 === 0 ? 'listening' : 'choice';
  if (progress.confidence < 0.35) return index % 2 ? 'choice' : 'typing';
  if (progress.confidence < 0.7) return ['typing','ordering','listening'][index % 3];
  return ['typing','speaking','ordering','listening'][index % 4];
};

const getDistractors = (item, field, count = 3) => {
  const pool = item.itemType === 'phrase' ? PHRASES : WORDS;
  const sameTopic = pool.filter((candidate) => candidate.id !== item.id && candidate.topic === item.topic);
  const sameType = pool.filter((candidate) => candidate.id !== item.id && candidate.type && candidate.type === item.type);
  const fallback = pool.filter((candidate) => candidate.id !== item.id);
  const candidates = [...sameTopic, ...sameType, ...fallback]
    .filter((candidate, index, array) => array.findIndex((entry) => entry.id === candidate.id) === index)
    .filter((candidate) => candidate[field] && candidate[field] !== item[field]);
  return shuffle(candidates, `${item.id}-${field}`).slice(0, count).map((candidate) => candidate[field]);
};

const translationFor = (item, language = 'nl') => language === 'en' ? item.en : item.nl;

export const makeExercise = (item, progress, index = 0, { mode = 'smart', language = 'nl' } = {}) => {
  const preferredType = chooseExerciseType(item, progress, index, mode);
  const translation = translationFor(item, language);
  const dualTranslation = language === 'nl' ? item.en : item.nl;
  const base = {
    id: `${item.id}-${Date.now()}-${index}`,
    itemId: item.id,
    itemType: item.itemType,
    topic: item.topic,
    grammar: item.grammar || [],
    source: item,
    answer: item.pl,
  };

  if (preferredType === 'choice') {
    const direction = index % 2 === 0 ? 'pl-to-meaning' : 'meaning-to-pl';
    if (direction === 'pl-to-meaning') {
      const options = shuffle([translation, ...getDistractors(item, language, 3)], `${item.id}-choice-a`);
      return {
        ...base,
        type: 'choice',
        skill: 'Meaning',
        instruction: 'Choose the meaning',
        mainText: item.pl,
        subText: item.itemType === 'word' ? item.type : dualTranslation,
        answer: translation,
        options,
        audioText: item.pl,
      };
    }
    const options = shuffle([item.pl, ...getDistractors(item, 'pl', 3)], `${item.id}-choice-b`);
    return {
      ...base,
      type: 'choice',
      skill: 'Recall',
      instruction: 'Choose the natural Polish',
      mainText: translation,
      subText: dualTranslation,
      answer: item.pl,
      options,
      audioText: item.pl,
    };
  }

  if (preferredType === 'ordering' && item.itemType === 'phrase' && item.pl.split(/\s+/).length >= 3) {
    const cleanTokens = item.pl.replace(/[.!?]/g, '').split(/\s+/);
    return {
      ...base,
      type: 'ordering',
      skill: 'Sentence building',
      instruction: 'Build the sentence',
      mainText: translation,
      subText: dualTranslation,
      answer: item.pl.replace(/[.!?]/g, ''),
      tokens: shuffle(cleanTokens.map((token, tokenIndex) => ({ id: `${token}-${tokenIndex}`, value: token })), `${item.id}-order`),
      audioText: item.pl,
    };
  }

  if (preferredType === 'listening') {
    const options = shuffle([translation, ...getDistractors(item, language, 3)], `${item.id}-listening`);
    return {
      ...base,
      type: 'listening',
      skill: 'Listening',
      instruction: 'Listen and choose the meaning',
      mainText: 'Tap to listen',
      subText: 'You can replay it as often as you need.',
      answer: translation,
      options,
      audioText: item.pl,
    };
  }

  if (preferredType === 'speaking') {
    return {
      ...base,
      type: 'speaking',
      skill: 'Speaking',
      instruction: 'Say it out loud',
      mainText: item.pl,
      subText: `${translation} · ${dualTranslation}`,
      answer: item.pl,
      audioText: item.pl,
    };
  }

  return {
    ...base,
    type: 'typing',
    skill: 'Active recall',
    instruction: 'Write it in Polish',
    mainText: translation,
    subText: dualTranslation,
    answer: item.pl,
    audioText: item.pl,
  };
};

export const buildSession = (state, {
  topic = null,
  length = 8,
  mode = 'smart',
  language = 'nl',
} = {}) => {
  const all = [...ITEM_MAP.values()];
  const ranked = all
    .filter((item) => !topic || item.topic === topic)
    .map((item) => ({ item, score: itemPriorityScore(state, item, { topic }) }))
    .sort((a, b) => b.score - a.score);

  const due = ranked.filter(({ item }) => {
    const progress = state.progress.items[item.id];
    return progress && new Date(progress.dueAt).getTime() <= Date.now();
  });
  const weak = ranked.filter(({ item }) => {
    const progress = state.progress.items[item.id];
    return progress && progress.confidence < 0.55 && !due.some((entry) => entry.item.id === item.id);
  });
  const newPhrases = ranked.filter(({ item }) => item.itemType === 'phrase' && !state.progress.items[item.id]);
  const newWords = ranked.filter(({ item }) => item.itemType === 'word' && !state.progress.items[item.id]);
  const established = ranked.filter(({ item }) => state.progress.items[item.id] && !due.some((entry) => entry.item.id === item.id));

  const selected = [];
  const addUnique = (entries, max) => {
    entries.slice(0, max).forEach(({ item }) => {
      if (selected.length < length && !selected.some((candidate) => candidate.id === item.id)) selected.push(item);
    });
  };

  addUnique(due, Math.ceil(length * 0.5));
  addUnique(weak, Math.ceil(length * 0.25));
  addUnique(newPhrases, Math.ceil(length * 0.45));
  addUnique(newWords, Math.ceil(length * 0.25));
  addUnique(established, length);
  addUnique(ranked, length);

  const balanced = selected.slice(0, length);
  return balanced.map((item, index) => makeExercise(item, state.progress.items[item.id], index, { mode, language }));
};

export const getReviewQueue = (state, limit = 8) => {
  const now = Date.now();
  const reviewed = [...ITEM_MAP.values()]
    .filter((item) => state.progress.items[item.id])
    .map((item) => {
      const progress = state.progress.items[item.id];
      const dueAt = new Date(progress.dueAt).getTime();
      const due = dueAt <= now;
      const weakness = (1 - progress.confidence) * 100 + progress.lapses * 12 + (due ? 60 : 0);
      return { item, progress, due, dueAt, weakness };
    })
    .sort((a, b) => b.weakness - a.weakness);

  if (reviewed.length >= limit) return reviewed.slice(0, limit);

  const newItems = [...ITEM_MAP.values()]
    .filter((item) => !state.progress.items[item.id])
    .sort((a, b) => itemPriorityScore(state, b) - itemPriorityScore(state, a))
    .slice(0, limit - reviewed.length)
    .map((item) => ({ item, progress: null, due: false, dueAt: null, weakness: 0 }));
  return [...reviewed, ...newItems];
};

export const getWeakItems = (state, limit = 4) => [...ITEM_MAP.values()]
  .map((item) => ({ item, progress: state.progress.items[item.id] }))
  .filter(({ progress }) => progress && (progress.lapses > 0 || progress.confidence < 0.45))
  .sort((a, b) => {
    const scoreA = a.progress.lapses * 20 + (1 - a.progress.confidence) * 100;
    const scoreB = b.progress.lapses * 20 + (1 - b.progress.confidence) * 100;
    return scoreB - scoreA;
  })
  .slice(0, limit);

export const getTopicReadiness = (state, topicId) => {
  const relevantPhrases = PHRASES.filter((phrase) => phrase.topic === topicId);
  const relevantWords = WORDS.filter((word) => word.topic === topicId).slice(0, 16);
  const phraseScores = relevantPhrases.map((phrase) => state.progress.items[phrase.id]?.confidence || 0);
  const wordScores = relevantWords.map((word) => state.progress.items[word.id]?.confidence || 0);
  const phraseWeight = phraseScores.length ? average(phraseScores) : 0;
  const wordWeight = wordScores.length ? average(wordScores) : 0;
  const direct = state.progress.topics[topicId]?.confidence || 0;
  return clamp(phraseWeight * 0.62 + wordWeight * 0.2 + direct * 0.18);
};

export const getScenarioReadiness = (state, scenario) => {
  const scores = scenario.phrases.map((id) => state.progress.items[id]?.confidence || 0);
  const topicReadiness = getTopicReadiness(state, scenario.topic);
  return clamp(average(scores) * 0.78 + topicReadiness * 0.22);
};

export const getPersonaReadiness = (state, persona) => {
  const topicScore = getTopicReadiness(state, persona.topic);
  const conversation = state.progress.personas[persona.id];
  const practice = conversation ? clamp(conversation.turns / 24) * 0.25 + (conversation.averageScore || 0) * 0.25 : 0;
  return clamp(topicScore * 0.5 + practice);
};

const getSkillEvidence = (state) => {
  if (!state.stats.skillEvidence) {
    state.stats.skillEvidence = {
      speaking: { attempts: 0, score: 0 },
      listening: { attempts: 0, score: 0 },
      reading: { attempts: 0, score: 0 },
      grammar: { attempts: 0, score: 0 },
    };
  }
  return state.stats.skillEvidence;
};

export const recordSkillEvidence = (state, skill, score) => {
  const evidence = getSkillEvidence(state);
  const key = skill.toLowerCase();
  if (!evidence[key]) evidence[key] = { attempts: 0, score: 0 };
  const entry = evidence[key];
  entry.attempts += 1;
  entry.score = clamp(entry.score * 0.82 + clamp(score) * 0.18);
};

export const getMetrics = (state) => {
  const masteredWords = WORDS.filter((word) => {
    const progress = state.progress.items[word.id];
    return progress && progress.reps >= 2 && progress.confidence >= 0.48;
  }).length;
  const knownPhrases = PHRASES.filter((phrase) => {
    const progress = state.progress.items[phrase.id];
    return progress && progress.reps >= 2 && progress.confidence >= 0.52;
  }).length;
  const conceptEntries = Object.values(state.progress.concepts);
  const grammarMastery = average(conceptEntries.map((entry) => entry.confidence));
  const scenarioScores = REAL_LIFE_SCENARIOS.map((scenario) => getScenarioReadiness(state, scenario));
  const unlockedConversations = scenarioScores.filter((score) => score >= 0.56).length;
  const conversationReadiness = average(scenarioScores.slice(0, 8));
  const evidence = getSkillEvidence(state);
  const reviewedAccuracy = state.stats.correct + state.stats.incorrect > 0
    ? state.stats.correct / (state.stats.correct + state.stats.incorrect)
    : 0;

  const reading = clamp(
    average([...ITEM_MAP.values()].map((item) => state.progress.items[item.id]?.confidence || 0)) * 0.75
      + reviewedAccuracy * 0.25,
  );
  const listening = clamp((evidence.listening?.score || 0) * 0.75 + Math.min(1, state.stats.reviews / 80) * 0.25);
  const speaking = clamp((evidence.speaking?.score || 0) * 0.7 + Math.min(1, state.stats.speakingAttempts / 40) * 0.3);
  const grammar = clamp(grammarMastery);
  const overall = clamp(
    Math.min(1, masteredWords / 100) * 0.23
      + Math.min(1, knownPhrases / 48) * 0.25
      + grammar * 0.18
      + listening * 0.1
      + speaking * 0.12
      + conversationReadiness * 0.12,
  );

  let cefr = 'Pre-A1';
  let nextCefr = 'A1';
  let cefrProgress = clamp(overall / 0.22);
  if (overall >= 0.22 && overall < 0.48) {
    cefr = 'A1';
    nextCefr = 'A2';
    cefrProgress = clamp((overall - 0.22) / 0.26);
  } else if (overall >= 0.48 && overall < 0.68) {
    cefr = 'A2';
    nextCefr = 'B1';
    cefrProgress = clamp((overall - 0.48) / 0.2);
  } else if (overall >= 0.68 && overall < 0.84) {
    cefr = 'B1';
    nextCefr = 'B2';
    cefrProgress = clamp((overall - 0.68) / 0.16);
  } else if (overall >= 0.84) {
    cefr = 'B2';
    nextCefr = 'C1';
    cefrProgress = clamp((overall - 0.84) / 0.12);
  }

  const dailyGoal = Math.max(5, state.profile.dailyGoal || 15);
  const comfortGap = clamp(0.76 - conversationReadiness, 0, 0.76);
  const estimatedWeeks = comfortGap === 0 ? 0 : Math.max(2, Math.ceil((comfortGap * 1300) / (dailyGoal * 7)));

  return {
    masteredWords,
    knownPhrases,
    grammarMastery,
    unlockedConversations,
    conversationReadiness,
    reading,
    listening,
    speaking,
    grammar,
    overall,
    cefr,
    nextCefr,
    cefrProgress,
    estimatedWeeks,
    accuracy: reviewedAccuracy,
  };
};

export const getCoachInsights = (state) => {
  const insights = [];
  const due = getDueItems(state).length;
  const weakItems = getWeakItems(state, 2);
  const conceptEntries = GRAMMAR_CONCEPTS
    .map((concept) => ({ concept, progress: state.progress.concepts[concept.id] }))
    .filter(({ progress }) => progress)
    .sort((a, b) => a.progress.confidence - b.progress.confidence);

  if (due > 0) {
    insights.push({
      title: `${due} item${due === 1 ? '' : 's'} need a timely review`,
      detail: 'Reviewing now protects them before the memory gets expensive to rebuild.',
      type: 'review',
    });
  }

  if (weakItems[0]) {
    const { item, progress } = weakItems[0];
    insights.push({
      title: `“${item.pl}” is becoming a confusion point`,
      detail: `${progress.lapses || 1} lapse${progress.lapses === 1 ? '' : 's'} detected. It will reappear in a new sentence, not as an isolated card.`,
      type: 'weak',
    });
  }

  if (conceptEntries[0]) {
    insights.push({
      title: `Your weakest pattern is ${conceptEntries[0].concept.title.toLowerCase()}`,
      detail: 'The next session will contrast it with a pattern you already know.',
      type: 'grammar',
    });
  }

  if (insights.length < 2) {
    insights.push({
      title: 'Start with phrases that rescue real conversations',
      detail: 'Slower, repeat, and “how do you say…” let you stay in Polish even before you know much Polish.',
      type: 'strategy',
    });
  }

  if (insights.length < 3) {
    insights.push({
      title: 'Your interests are already part of the curriculum',
      detail: 'Motorsport, snowboarding, festivals, and bonsai create memorable family small talk.',
      type: 'personal',
    });
  }

  return insights.slice(0, 3);
};

export const getRecommendedTopic = (state) => {
  const scored = TOPICS.map((topic) => {
    const readiness = getTopicReadiness(state, topic.id);
    const recency = state.progress.topics[topic.id]?.lastSeenAt
      ? (Date.now() - new Date(state.progress.topics[topic.id].lastSeenAt).getTime()) / DAY_MS
      : 30;
    return {
      topic,
      score: topic.priority * 0.7 + (1 - readiness) * 70 + Math.min(recency, 20),
    };
  });
  return scored.sort((a, b) => b.score - a.score)[0]?.topic || TOPICS[0];
};

export const getActivityDays = (state, days = 14) => {
  const activityMap = new Map(state.stats.activity.map((entry) => [entry.date, entry]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS).toISOString().slice(0, 10);
    const entry = activityMap.get(key) || { date: key, minutes: 0, reviews: 0, speaking: 0, conversations: 0, games: 0 };
    return {
      ...entry,
      dayLabel: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 1),
    };
  });
};

const COMMON_CORRECTIONS = [
  {
    pattern: /\bdo\s+polska\b/i,
    replacement: 'do Polski',
    message: 'After do, Polska changes to Polski (genitive).',
  },
  {
    pattern: /\bid[eę]\s+do\s+polski\b/i,
    replacement: 'jadę do Polski',
    message: 'For a trip by car, train, or plane, use jadę rather than idę.',
  },
  {
    pattern: /\blubi[eę]\s+kawa\b/i,
    replacement: 'lubię kawę',
    message: 'Kawa becomes kawę as the direct object after lubię.',
  },
  {
    pattern: /\bpoprosz[eę]\s+kawa\b/i,
    replacement: 'poproszę kawę',
    message: 'After poproszę, use the object form kawę.',
  },
  {
    pattern: /\bmam\s+rezerwacja\b/i,
    replacement: 'mam rezerwację',
    message: 'Rezerwacja becomes rezerwację as the object of mam.',
  },
  {
    pattern: /\bjestem\s+([a-ząćęłńóśźż]+)\s+lat\b/i,
    replacement: 'mam $1 lat',
    message: 'Polish says “I have X years”: mam … lat.',
  },
];

export const evaluateConversationReply = (text, turn) => {
  const normalized = normalizeText(text, { loose: true });
  if (!normalized) {
    return {
      score: 0,
      accepted: false,
      feedback: 'Say or type a short Polish answer. One useful chunk is enough.',
      suggestion: turn.suggestions?.[0]?.pl || '',
    };
  }

  let best = { score: 0, suggestion: turn.suggestions?.[0] };
  (turn.suggestions || []).forEach((suggestion) => {
    const intents = suggestion.intent || [];
    const hits = intents.filter((keyword) => normalized.includes(normalizeText(keyword, { loose: true }))).length;
    const keywordScore = intents.length ? hits / Math.min(2, intents.length) : 0;
    const phraseScore = similarity(text, suggestion.pl);
    const score = Math.max(keywordScore, phraseScore * 0.88);
    if (score > best.score) best = { score, suggestion };
  });

  let correction = null;
  let correctedText = text;
  for (const rule of COMMON_CORRECTIONS) {
    if (rule.pattern.test(correctedText)) {
      correctedText = correctedText.replace(rule.pattern, rule.replacement);
      correction = rule.message;
      break;
    }
  }

  const polishSignals = /[ąćęłńóśźż]|\b(tak|nie|dziękuję|prosze|proszę|mam|jestem|lubię|poproszę|dobrze|trochę|gdzie|czy|mogę|bardzo)\b/i.test(text);
  const accepted = best.score >= 0.42 || (polishSignals && normalized.split(' ').length >= 2);

  return {
    score: clamp(best.score || (polishSignals ? 0.44 : 0.12)),
    accepted,
    feedback: correction
      ? correction
      : accepted
        ? 'That would keep the conversation moving naturally.'
        : 'The intention is not clear yet. Borrow the sentence frame and change one detail.',
    correction,
    correctedText,
    suggestion: best.suggestion?.pl || turn.suggestions?.[0]?.pl || '',
  };
};

export const recordConversationTurn = (state, personaId, score) => {
  if (!state.progress.personas[personaId]) {
    state.progress.personas[personaId] = { turns: 0, averageScore: 0, lastPracticedAt: null };
  }
  const progress = state.progress.personas[personaId];
  progress.turns += 1;
  progress.averageScore = clamp(progress.averageScore * 0.82 + clamp(score) * 0.18);
  progress.lastPracticedAt = new Date().toISOString();
  addActivity(state, { conversations: 1 });
  recordSkillEvidence(state, 'speaking', score);
};

export const getPatternSentence = (pattern, selections = {}) => {
  const values = { ...pattern.default, ...selections };
  let sentence = pattern.template;
  Object.entries(values).forEach(([slot, value]) => {
    sentence = sentence.replace(`{${slot}}`, value);
  });
  return sentence;
};

export const getPatternTranslation = (pattern, selections = {}, language = 'nl') => {
  const values = { ...pattern.default, ...selections };
  const selected = Object.entries(values).map(([slot, value]) => {
    const option = pattern.slots[slot]?.find((entry) => entry.value === value);
    return option?.[language] || value;
  });

  if (pattern.id === 'pattern_go_to') {
    const motion = pattern.slots.motion.find((entry) => entry.value === values.motion)?.[language] || values.motion;
    const destination = pattern.slots.destination.find((entry) => entry.value === values.destination)?.[language] || values.destination;
    return language === 'nl' ? `${motion} ${destination}.` : `${motion} ${destination}.`;
  }
  if (pattern.id === 'pattern_like') return language === 'nl' ? `Ik houd van ${selected[0]}.` : `I like ${selected[0]}.`;
  if (pattern.id === 'pattern_can_i') return language === 'nl' ? `Kan / mag ik ${selected[0]}?` : `Can I ${selected[0]}?`;
  if (pattern.id === 'pattern_interests') return language === 'nl' ? `Ik ben geïnteresseerd in ${selected[0]}.` : `I'm interested in ${selected[0]}.`;
  if (pattern.id === 'pattern_pain') return selected[0];
  return selected.join(' · ');
};
