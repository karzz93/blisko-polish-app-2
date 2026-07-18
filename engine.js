import {
  WORDS,
  PHRASES,
  GRAMMAR_CONCEPTS,
  REAL_LIFE_SCENARIOS,
  TOPICS,
  PATTERNS,
} from './data.js?v=1.2.2';
import { getTodayKey } from './storage.js?v=1.2.2';

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

const HINT_EVIDENCE_WEIGHTS = [1, 1, 0.92, 0.78, 0.62, 0.42];
const HINT_INTERVAL_CAPS = [Infinity, Infinity, 14, 5, 2, 0.75];

// Repeated hint use creates a per-item support pressure. The next encounter can
// then step down from free typing to word ordering or recognition. Independent
// retrieval gradually removes the scaffolding again.
const SCAFFOLD_HINT_PRESSURE = [0, 0.1, 0.3, 0.6, 1, 1.4];
const SCAFFOLD_MAX_SCORE = 4.5;

const scaffoldLevelFromScore = (score = 0) => {
  const safeScore = Math.max(0, Number(score) || 0);
  if (safeScore >= 1.8) return 2;
  if (safeScore >= 0.5) return 1;
  return 0;
};

export const getAdaptiveSupportLevel = (progress = null) => {
  if (!progress) return 0;
  const explicitLevel = Number(progress.scaffoldLevel);
  if (Number.isFinite(explicitLevel)) return clamp(Math.round(explicitLevel), 0, 2);
  return scaffoldLevelFromScore(progress.scaffoldScore);
};

const ensureScaffoldFields = (progress) => {
  if (!progress || typeof progress !== 'object') return progress;
  progress.scaffoldScore = clamp(Number(progress.scaffoldScore || 0), 0, SCAFFOLD_MAX_SCORE);
  progress.scaffoldLevel = scaffoldLevelFromScore(progress.scaffoldScore);
  progress.supportEpisodes = Number(progress.supportEpisodes || 0);
  progress.independentSuccesses = Number(progress.independentSuccesses || 0);
  progress.lastScaffoldReason = progress.lastScaffoldReason || null;
  progress.lastScaffoldAt = progress.lastScaffoldAt || null;
  return progress;
};

const applyHintPressure = (progress, level, reason = 'Repeated hints') => {
  ensureScaffoldFields(progress);
  const safeLevel = clamp(Math.round(Number(level) || 0), 0, 5);
  progress.scaffoldScore = clamp(
    progress.scaffoldScore + (SCAFFOLD_HINT_PRESSURE[safeLevel] || 0),
    0,
    SCAFFOLD_MAX_SCORE,
  );
  progress.scaffoldLevel = scaffoldLevelFromScore(progress.scaffoldScore);
  progress.lastScaffoldReason = reason;
  progress.lastScaffoldAt = new Date().toISOString();
  return progress.scaffoldLevel;
};

const updateScaffoldAfterReview = (progress, {
  rating = 0,
  correct = true,
  hintLevel = 0,
  confidenceState = null,
} = {}) => {
  ensureScaffoldFields(progress);
  const safeRating = clamp(Number(rating) || 0, 0, 3);
  const safeHintLevel = clamp(Math.round(Number(hintLevel) || 0), 0, 5);

  if (!correct || safeRating === 0) {
    progress.scaffoldScore = clamp(progress.scaffoldScore + 0.72, 0, SCAFFOLD_MAX_SCORE);
    progress.supportEpisodes += 1;
    progress.independentSuccesses = 0;
    progress.lastScaffoldReason = 'A difficult retrieval';
  } else if (confidenceState === 'almost') {
    progress.scaffoldScore = clamp(progress.scaffoldScore + 0.28, 0, SCAFFOLD_MAX_SCORE);
    progress.supportEpisodes += 1;
    progress.independentSuccesses = 0;
    progress.lastScaffoldReason = 'Almost known';
  } else if (safeHintLevel >= 2) {
    progress.supportEpisodes += 1;
    progress.independentSuccesses = 0;
    progress.lastScaffoldReason = 'Repeated hint support';
  } else if (safeHintLevel === 0) {
    const reduction = safeRating >= 3 ? 0.75 : safeRating >= 2 ? 0.45 : 0.18;
    progress.scaffoldScore = clamp(progress.scaffoldScore - reduction, 0, SCAFFOLD_MAX_SCORE);
    progress.independentSuccesses += 1;
    progress.lastScaffoldReason = 'Independent retrieval';
  } else if (safeRating >= 2) {
    progress.scaffoldScore = clamp(progress.scaffoldScore - 0.2, 0, SCAFFOLD_MAX_SCORE);
    progress.independentSuccesses = 0;
    progress.lastScaffoldReason = 'Lightly supported retrieval';
  }

  progress.scaffoldLevel = scaffoldLevelFromScore(progress.scaffoldScore);
  progress.lastScaffoldAt = new Date().toISOString();
  return progress.scaffoldLevel;
};

const POLISH_FUNCTION_WORDS = new Set([
  'a', 'ale', 'bo', 'czy', 'do', 'i', 'jak', 'jest', 'już', 'na', 'nie', 'o', 'od', 'po',
  'proszę', 'się', 'to', 'tu', 'w', 'we', 'z', 'za', 'że', 'jeszcze', 'bardzo', 'mogę',
]);

const ENGLISH_FUNCTION_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'but', 'can', 'do', 'for', 'from', 'i', 'in', 'is', 'it',
  'my', 'not', 'of', 'on', 'or', 'the', 'this', 'to', 'we', 'with', 'you', 'yet',
]);

const DUTCH_FUNCTION_WORDS = new Set([
  'aan', 'als', 'de', 'dit', 'een', 'en', 'het', 'ik', 'in', 'is', 'kan', 'met', 'naar',
  'niet', 'nog', 'of', 'om', 'op', 'te', 'van', 'voor', 'wat', 'we', 'je',
]);

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

const displayTokens = (value = '') => String(value)
  .match(/[A-Za-zÀ-žĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9]+(?:[’'][A-Za-zÀ-žĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9]+)?|[^\s]/g) || [];

const isWordToken = (token = '') => /[A-Za-zÀ-žĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9]/.test(token);

const joinDisplayTokens = (tokens = []) => tokens
  .join(' ')
  .replace(/\s+([,.!?;:])/g, '$1')
  .replace(/([({])\s+/g, '$1')
  .replace(/\s+([)}])/g, '$1')
  .trim();

const normalizedToken = (token = '') => normalizeText(token, { loose: true });

const functionWordsFor = (language = 'pl') => {
  if (language === 'en') return ENGLISH_FUNCTION_WORDS;
  if (language === 'nl') return DUTCH_FUNCTION_WORDS;
  return POLISH_FUNCTION_WORDS;
};

const maskToken = (token = '', { keepFirst = false } = {}) => {
  if (!isWordToken(token)) return token;
  const characters = [...token];
  const first = keepFirst ? characters[0] : '';
  const hiddenCount = Math.max(2, Math.min(10, characters.length - (keepFirst ? 1 : 0)));
  return `${first}${'_'.repeat(hiddenCount)}`;
};

const maskAnswerStructure = (answer = '', language = 'pl', revealIndexes = []) => {
  const tokens = displayTokens(answer);
  const functionWords = functionWordsFor(language);
  let wordIndex = -1;
  return joinDisplayTokens(tokens.map((token) => {
    if (!isWordToken(token)) return token;
    wordIndex += 1;
    const normalized = normalizedToken(token);
    if (revealIndexes.includes(wordIndex) || functionWords.has(normalized)) return token;
    return maskToken(token, { keepFirst: tokens.filter(isWordToken).length === 1 });
  }));
};

const maskEveryAnswerWord = (answer = '') => joinDisplayTokens(displayTokens(answer).map((token) => (
  isWordToken(token) ? maskToken(token) : token
)));

const maskAnswerWithPartialWord = (answer = '', language = 'pl', targetIndex = 0, prefixLength = 1) => {
  const tokens = displayTokens(answer);
  const functionWords = functionWordsFor(language);
  let wordIndex = -1;
  return joinDisplayTokens(tokens.map((token) => {
    if (!isWordToken(token)) return token;
    wordIndex += 1;
    if (wordIndex === targetIndex) {
      const characters = [...token];
      const safePrefixLength = Math.max(0, Math.min(prefixLength, Math.max(0, characters.length - 1)));
      if (!safePrefixLength) return maskToken(token);
      return `${characters.slice(0, safePrefixLength).join('')}${'_'.repeat(Math.max(2, characters.length - safePrefixLength))}`;
    }
    return functionWords.has(normalizedToken(token)) ? token : maskToken(token);
  }));
};

const wordEntries = (value = '') => displayTokens(value)
  .filter(isWordToken)
  .map((token, index) => ({ token, index, normalized: normalizedToken(token) }));

const redactAnswerSequence = (text = '', answer = '', replacement = '[target form]') => {
  const targetWords = wordEntries(answer).map((entry) => entry.normalized).filter(Boolean);
  if (!targetWords.length) return String(text || '');
  const tokens = displayTokens(text);
  const wordPositions = tokens
    .map((token, tokenIndex) => (isWordToken(token) ? { tokenIndex, normalized: normalizedToken(token) } : null))
    .filter(Boolean);
  const matches = [];
  for (let index = 0; index <= wordPositions.length - targetWords.length; index += 1) {
    const matchesTarget = targetWords.every((target, offset) => wordPositions[index + offset]?.normalized === target);
    if (matchesTarget) {
      matches.push({
        start: wordPositions[index].tokenIndex,
        end: wordPositions[index + targetWords.length - 1].tokenIndex,
      });
      index += targetWords.length - 1;
    }
  }
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    tokens.splice(match.start, match.end - match.start + 1, replacement);
  }
  return joinDisplayTokens(tokens);
};

const protectHintAnswer = (hint = {}, answer = '') => {
  if (Number(hint.level || 0) >= 5) return hint;
  const protectedHint = {
    ...hint,
    en: redactAnswerSequence(hint.en || '', answer, '[target form]'),
    nl: redactAnswerSequence(hint.nl || '', answer, '[doelvorm]'),
  };
  if (hint.structure) protectedHint.structure = redactAnswerSequence(hint.structure, answer, '___');
  if (hint.title) protectedHint.title = redactAnswerSequence(hint.title, answer, 'Support');
  if (normalizeText(hint.revealedWord || '', { loose: true }) === normalizeText(answer, { loose: true })) {
    protectedHint.revealedWord = '';
  }
  return protectedHint;
};

const getRevealWord = (answer = '', language = 'pl', seed = 0) => {
  const entries = wordEntries(answer);
  if (!entries.length) return null;
  const functionWords = functionWordsFor(language);
  const content = entries.filter((entry) => !functionWords.has(entry.normalized));
  const pool = content.length ? content : entries;
  return pool[Math.abs(Number(seed) || 0) % pool.length];
};

const sentenceChunkCount = (answer = '') => {
  const count = wordEntries(answer).length;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  return 3;
};

const targetLanguageForExercise = (exercise = {}, fallback = 'pl') => {
  if (exercise.answerKind === 'meaning') {
    const answer = normalizeText(exercise.answer || '');
    const nl = normalizeText(exercise.translations?.nl || '');
    const en = normalizeText(exercise.translations?.en || '');
    if (answer && answer === en) return 'en';
    if (answer && answer === nl) return 'nl';
    return fallback === 'en' ? 'en' : 'nl';
  }
  return 'pl';
};

const topicScene = (item = {}, answer = '') => {
  const topic = TOPIC_MAP.get(item.topic);
  if (!topic) return { en: 'a real conversation', nl: 'een echt gesprek' };
  const title = topic.title.toLowerCase();
  const subtitle = topic.subtitle.toLowerCase();
  const scene = `${title} — ${subtitle}`;
  const normalizedAnswer = normalizeText(answer, { loose: true });
  const normalizedScene = normalizeText(scene, { loose: true });
  const leaksAnswer = normalizedAnswer.length >= 2 && ` ${normalizedScene} `.includes(` ${normalizedAnswer} `);
  return leaksAnswer
    ? { en: 'a real conversation', nl: 'een echt gesprek' }
    : { en: scene, nl: `de situatie “${title}”` };
};

const typeCoachCopy = (item = {}) => {
  if (item.itemType === 'phrase') {
    return {
      en: 'Treat the line as one speaking block. Recover the intention first, then the exact endings.',
      nl: 'Behandel de zin als één spreekblok. Haal eerst de bedoeling terug en daarna pas de precieze uitgangen.',
    };
  }
  if (item.type === 'verb') {
    return {
      en: 'Find the verb core first. Polish often carries the person inside the verb ending, so an extra pronoun may be unnecessary.',
      nl: 'Zoek eerst de kern van het werkwoord. In het Pools zit de persoon vaak al in de uitgang, waardoor een extra voornaamwoord niet nodig is.',
    };
  }
  if (item.type === 'noun') {
    return {
      en: 'Picture the object in the scene, then check whether a preposition or verb may change its ending.',
      nl: 'Zie het voorwerp in de situatie voor je en controleer daarna of een voorzetsel of werkwoord de uitgang verandert.',
    };
  }
  if (item.type === 'expression') {
    return {
      en: 'Recall it as a fixed social reaction rather than translating each word separately.',
      nl: 'Haal het terug als een vaste sociale reactie in plaats van ieder woord apart te vertalen.',
    };
  }
  return {
    en: 'Recover the conversational intention first. Exact spelling comes after the useful meaning.',
    nl: 'Haal eerst de bedoeling van het gesprek terug. De precieze spelling komt daarna.',
  };
};

export const getHintEvidenceWeight = (level = 0) => HINT_EVIDENCE_WEIGHTS[clamp(Math.round(Number(level) || 0), 0, 5)];

export const generateExerciseHint = (exercise, progress = null, level = 1, {
  partialIndex = 0,
  interfaceLanguage = 'en',
} = {}) => {
  const safeLevel = clamp(Math.round(Number(level) || 1), 1, 5);
  const item = exercise?.source || ITEM_MAP.get(exercise?.itemId) || {};
  const answer = String(exercise?.answer || item.pl || '').trim();
  const targetLanguage = targetLanguageForExercise(exercise, interfaceLanguage);
  const words = wordEntries(answer);
  const firstWord = words[0]?.token || answer.slice(0, 1);
  const firstLetter = [...firstWord][0] || '';
  const reveal = getRevealWord(answer, targetLanguage, partialIndex + (progress?.hintsUsed || 0));
  const revealIndexes = reveal ? [reveal.index] : [];
  const concept = (exercise?.grammar || item.grammar || []).map((id) => CONCEPT_MAP.get(id)).find(Boolean);
  const scene = topicScene(item, answer);
  const historyLead = progress?.lapses >= 2
    ? `This memory has slipped ${progress.lapses} times, so use the sentence frame rather than forcing the whole answer at once.`
    : progress?.confidence >= 0.55
      ? 'You have retrieved this before. Let the opening chunk come back before you search for every ending.'
      : `Place the answer inside ${scene.en}.`;
  const historyLeadNl = progress?.lapses >= 2
    ? `Dit geheugen is al ${progress.lapses} keer weggezakt. Gebruik daarom eerst het zinsframe in plaats van het hele antwoord te forceren.`
    : progress?.confidence >= 0.55
      ? 'Je hebt dit eerder teruggehaald. Laat eerst het begin van de zin terugkomen voordat je iedere uitgang zoekt.'
      : `Plaats het antwoord in ${scene.nl}.`;

  if (safeLevel === 1) {
    const singleCharacterAnswer = words.length === 1 && [...(words[0]?.token || '')].length <= 1;
    const itemKind = item.type || item.itemType || 'connector';
    const listeningLine = exercise?.type === 'listening'
      ? `Replay it once more and listen for ${words.length === 1 ? 'one key sound' : `the first and last of ${words.length} words`}.`
      : singleCharacterAnswer
        ? `It is one very short ${itemKind}; use its job in the sentence. The letter stays hidden.`
        : `${words.length || 1} word${words.length === 1 ? '' : 's'}; the answer begins with “${firstLetter}”.`;
    const listeningLineNl = exercise?.type === 'listening'
      ? `Speel het nog één keer af en luister naar ${words.length === 1 ? 'één kernklank' : `het eerste en laatste van ${words.length} woorden`}.`
      : singleCharacterAnswer
        ? `Het is één heel kort woord van het type ${itemKind}; gebruik de functie in de zin. De letter blijft verborgen.`
        : `${words.length || 1} woord${words.length === 1 ? '' : 'en'}; het antwoord begint met “${firstLetter}”.`;
    return protectHintAnswer({
      level: safeLevel,
      title: 'Gentle nudge',
      en: `${historyLead} ${listeningLine}`,
      nl: `${historyLeadNl} ${listeningLineNl}`,
      answerShown: false,
    }, answer);
  }

  if (safeLevel === 2) {
    const firstStructure = maskAnswerStructure(answer, targetLanguage);
    const structure = normalizeText(firstStructure, { loose: true }) === normalizeText(answer, { loose: true })
      ? maskEveryAnswerWord(answer)
      : firstStructure;
    return protectHintAnswer({
      level: safeLevel,
      title: 'Sentence structure',
      en: `Use this frame: ${structure}`,
      nl: `Gebruik dit patroon: ${structure}`,
      structure,
      answerShown: false,
    }, answer);
  }

  if (safeLevel === 3) {
    if (words.length === 1) {
      const token = words[0]?.token || '';
      const characters = [...token];
      const itemKind = item.type || item.itemType || 'word';
      if (characters.length <= 1) {
        return protectHintAnswer({
          level: safeLevel,
          title: 'One key feature',
          en: `It is a one-letter ${itemKind}. Use its role in the sentence; the letter itself stays hidden until the final support step.`,
          nl: `Het is een ${itemKind} van één letter. Gebruik de functie in de zin; de letter zelf blijft verborgen tot de laatste hulpstap.`,
          structure: '__',
          revealedWord: '',
          answerShown: false,
        }, answer);
      }
      const prefixLength = characters.length <= 3 ? 1 : Math.min(2, Math.ceil(characters.length / 3));
      const prefix = characters.slice(0, prefixLength).join('');
      const structure = `${prefix}${'_'.repeat(Math.max(2, characters.length - prefixLength))}`;
      return protectHintAnswer({
        level: safeLevel,
        title: 'One key element',
        en: `The word opens with “${prefix}”. Complete the shape: ${structure}`,
        nl: `Het woord begint met “${prefix}”. Maak de vorm af: ${structure}`,
        structure,
        revealedWord: prefix,
        answerShown: false,
      }, answer);
    }

    const contentWords = words.filter((entry) => !functionWordsFor(targetLanguage).has(entry.normalized));
    if (reveal && contentWords.length <= 1) {
      const characters = [...reveal.token];
      if (characters.length <= 1) {
        const structure = maskAnswerStructure(answer, targetLanguage);
        return protectHintAnswer({
          level: safeLevel,
          title: 'One key feature',
          en: `The key word is only one letter, so it stays hidden. Use its position in this frame: ${structure}`,
          nl: `Het kernwoord is maar één letter en blijft daarom verborgen. Gebruik de positie in dit patroon: ${structure}`,
          structure,
          revealedWord: '',
          answerShown: false,
        }, answer);
      }
      const prefixLength = characters.length <= 3 ? 1 : Math.min(2, Math.ceil(characters.length / 3));
      const prefix = characters.slice(0, prefixLength).join('');
      const structure = maskAnswerWithPartialWord(answer, targetLanguage, reveal.index, prefixLength);
      return protectHintAnswer({
        level: safeLevel,
        title: 'One key element',
        en: `The key word opens with “${prefix}”. Complete the frame: ${structure}`,
        nl: `Het kernwoord begint met “${prefix}”. Maak het patroon af: ${structure}`,
        structure,
        revealedWord: prefix,
        answerShown: false,
      }, answer);
    }

    const structure = maskAnswerStructure(answer, targetLanguage, revealIndexes);
    return protectHintAnswer({
      level: safeLevel,
      title: 'One anchor word',
      en: reveal
        ? `Anchor word ${reveal.index + 1} is “${reveal.token}”. Now rebuild around it: ${structure}`
        : `Use this partial frame: ${structure}`,
      nl: reveal
        ? `Ankerwoord ${reveal.index + 1} is “${reveal.token}”. Bouw er nu omheen: ${structure}`
        : `Gebruik dit gedeeltelijke patroon: ${structure}`,
      structure,
      revealedWord: reveal?.token || '',
      answerShown: false,
    }, answer);
  }

  if (safeLevel === 4) {
    const fallback = typeCoachCopy(item);
    return protectHintAnswer({
      level: safeLevel,
      title: concept ? `Grammar coach · ${concept.title}` : 'Teaching hint',
      en: concept ? concept.en : fallback.en,
      nl: concept ? concept.nl : fallback.nl,
      chunks: sentenceChunkCount(answer),
      answerShown: false,
    }, answer);
  }

  return {
    level: safeLevel,
    title: 'Answer, then active recall',
    en: `Study the answer briefly, hide it, and retrieve it once: ${answer}`,
    nl: `Bekijk het antwoord kort, verberg het en haal het daarna één keer zelf terug: ${answer}`,
    answer,
    translations: exercise?.translations || { nl: item.nl || '', en: item.en || '' },
    answerShown: true,
    requiresRecall: true,
  };
};

export const generateConversationHint = (turn, level = 1, {
  partialIndex = 0,
  history = null,
} = {}) => {
  const suggestions = turn?.suggestions || [];
  const suggestion = suggestions[Math.abs(Number(history?.turns || 0)) % Math.max(1, suggestions.length)] || suggestions[0] || { pl: '' };
  const answer = suggestion.pl || '';
  const words = wordEntries(answer);
  const reveal = getRevealWord(answer, 'pl', partialIndex + (history?.hintsUsed || 0));
  const revealIndexes = reveal ? [reveal.index] : [];
  const safeLevel = clamp(Math.round(Number(level) || 1), 1, 5);

  if (safeLevel === 1) {
    return protectHintAnswer({
      level: safeLevel,
      title: 'Choose the intention',
      en: `${words.length || 1} Polish word${words.length === 1 ? '' : 's'}. Start with “${words[0]?.token?.[0] || ''}” and answer the question rather than translating it word for word.`,
      nl: `${words.length || 1} Pools${words.length === 1 ? ' woord' : 'e woorden'}. Begin met “${words[0]?.token?.[0] || ''}” en beantwoord de vraag in plaats van die woord voor woord te vertalen.`,
      answerShown: false,
    }, answer);
  }
  if (safeLevel === 2) {
    const firstStructure = maskAnswerStructure(answer, 'pl');
    const structure = normalizeText(firstStructure, { loose: true }) === normalizeText(answer, { loose: true })
      ? maskEveryAnswerWord(answer)
      : firstStructure;
    return protectHintAnswer({ level: safeLevel, title: 'Reply frame', en: `Reply frame: ${structure}`, nl: `Antwoordpatroon: ${structure}`, structure, answerShown: false }, answer);
  }
  if (safeLevel === 3) {
    const contentWords = words.filter((entry) => !functionWordsFor('pl').has(entry.normalized));
    if (reveal && contentWords.length <= 1) {
      const characters = [...reveal.token];
      if (characters.length <= 1) {
        const structure = maskAnswerStructure(answer, 'pl');
        return protectHintAnswer({
          level: safeLevel,
          title: 'One key feature',
          en: `The key word stays hidden because it is only one letter. Use its position: ${structure}`,
          nl: `Het kernwoord blijft verborgen omdat het maar één letter is. Gebruik de positie: ${structure}`,
          structure,
          answerShown: false,
        }, answer);
      }
      const prefixLength = characters.length <= 3 ? 1 : Math.min(2, Math.ceil(characters.length / 3));
      const prefix = characters.slice(0, prefixLength).join('');
      const structure = maskAnswerWithPartialWord(answer, 'pl', reveal.index, prefixLength);
      return protectHintAnswer({
        level: safeLevel,
        title: 'One key element',
        en: `The key word opens with “${prefix}”. Complete the reply: ${structure}`,
        nl: `Het kernwoord begint met “${prefix}”. Maak het antwoord af: ${structure}`,
        structure,
        answerShown: false,
      }, answer);
    }
    const structure = maskAnswerStructure(answer, 'pl', revealIndexes);
    return protectHintAnswer({
      level: safeLevel,
      title: 'One anchor word',
      en: `Use “${reveal?.token || words[0]?.token || ''}” as the anchor: ${structure}`,
      nl: `Gebruik “${reveal?.token || words[0]?.token || ''}” als anker: ${structure}`,
      structure,
      answerShown: false,
    }, answer);
  }
  if (safeLevel === 4) {
    return protectHintAnswer({
      level: safeLevel,
      title: 'Conversation coach',
      en: turn?.coach || 'Use a short natural chunk. One clear intention is enough to keep the conversation moving.',
      nl: 'Gebruik een kort natuurlijk zinsblok. Eén duidelijke bedoeling is genoeg om het gesprek gaande te houden.',
      answerShown: false,
    }, answer);
  }
  return {
    level: safeLevel,
    title: 'Model reply, then respond yourself',
    en: `A natural model reply is: ${answer}`,
    nl: `Een natuurlijk voorbeeldantwoord is: ${answer}`,
    answer,
    alternatives: suggestions.map((entry) => entry.pl).filter(Boolean),
    answerShown: true,
    requiresRecall: true,
  };
};

export const generateTutorExerciseHint = (exercise, level = 1, { partialIndex = 0 } = {}) => {
  const pseudoExercise = {
    answer: exercise?.answer || '',
    answerKind: /[ąćęłńóśźż]/i.test(exercise?.answer || '') ? 'polish' : 'meaning',
    type: 'typing',
    itemType: 'grammar',
    grammar: exercise?.grammar || [],
    source: { itemType: 'phrase', type: 'grammar pattern', topic: 'questions' },
    translations: {},
  };
  const hint = generateExerciseHint(pseudoExercise, null, level, { partialIndex, interfaceLanguage: 'en' });
  if (level === 4 && exercise?.prompt) {
    return {
      ...hint,
      title: 'Grammar coach',
      en: `Read the frame carefully: ${exercise.prompt} Compare the form after the verb or preposition before choosing an ending.`,
      nl: `Lees het patroon zorgvuldig: ${exercise.prompt} Vergelijk de vorm na het werkwoord of voorzetsel voordat je een uitgang kiest.`,
    };
  }
  return hint;
};

export const ensureItemProgress = (state, itemId) => {
  const defaults = {
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
    hintsUsed: 0,
    hintedReviews: 0,
    maxHintLevel: 0,
    lastHintLevel: 0,
    hintHistory: [],
    almostKnown: 0,
    activeRecallRecoveries: 0,
    scaffoldScore: 0,
    scaffoldLevel: 0,
    supportEpisodes: 0,
    independentSuccesses: 0,
    lastScaffoldReason: null,
    lastScaffoldAt: null,
  };
  state.progress.items[itemId] = {
    ...defaults,
    ...(state.progress.items[itemId] || {}),
  };
  if (!Array.isArray(state.progress.items[itemId].history)) state.progress.items[itemId].history = [];
  if (!Array.isArray(state.progress.items[itemId].hintHistory)) state.progress.items[itemId].hintHistory = [];
  ensureScaffoldFields(state.progress.items[itemId]);
  return state.progress.items[itemId];
};

export const ensureConceptProgress = (state, conceptId) => {
  state.progress.concepts[conceptId] = {
    reviews: 0,
    mistakes: 0,
    confidence: 0,
    lastSeenAt: null,
    hintsUsed: 0,
    maxHintLevel: 0,
    almostKnown: 0,
    ...(state.progress.concepts[conceptId] || {}),
  };
  return state.progress.concepts[conceptId];
};

export const ensureTopicProgress = (state, topicId) => {
  state.progress.topics[topicId] = {
    reviews: 0,
    correct: 0,
    confidence: 0,
    lastSeenAt: null,
    hintsUsed: 0,
    maxHintLevel: 0,
    ...(state.progress.topics[topicId] || {}),
  };
  return state.progress.topics[topicId];
};

export const ensurePatternProgress = (state, patternId) => {
  if (!state.progress.patterns) state.progress.patterns = {};
  state.progress.patterns[patternId] = {
    reviews: 0,
    correct: 0,
    confidence: 0,
    lastSeenAt: null,
    hintsUsed: 0,
    maxHintLevel: 0,
    almostKnown: 0,
    history: [],
    scaffoldScore: 0,
    scaffoldLevel: 0,
    supportEpisodes: 0,
    independentSuccesses: 0,
    lastScaffoldReason: null,
    lastScaffoldAt: null,
    ...(state.progress.patterns[patternId] || {}),
  };
  if (!Array.isArray(state.progress.patterns[patternId].history)) state.progress.patterns[patternId].history = [];
  ensureScaffoldFields(state.progress.patterns[patternId]);
  return state.progress.patterns[patternId];
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

const ensureHintStats = (state) => {
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
  return state.stats;
};

export const recordHintUse = (state, {
  itemId = null,
  level = 1,
  exerciseType = null,
  context = 'session',
  conceptId = null,
  patternId = null,
  personaId = null,
} = {}) => {
  const safeLevel = clamp(Math.round(Number(level) || 1), 1, 5);
  const stats = ensureHintStats(state);
  stats.hintsUsed += 1;
  stats.hintLevelCounts[safeLevel] = Number(stats.hintLevelCounts[safeLevel] || 0) + 1;
  stats.lastHintAt = new Date().toISOString();

  if (itemId && ITEM_MAP.has(itemId)) {
    const progress = ensureItemProgress(state, itemId);
    progress.hintsUsed += 1;
    progress.maxHintLevel = Math.max(progress.maxHintLevel || 0, safeLevel);
    progress.lastHintLevel = safeLevel;
    progress.hintHistory.push({
      at: stats.lastHintAt,
      level: safeLevel,
      exerciseType,
      context,
    });
    progress.hintHistory = progress.hintHistory.slice(-40);
    applyHintPressure(progress, safeLevel, safeLevel >= 3 ? 'Several hints on this item' : 'Hint support');
  }

  if (conceptId) {
    const progress = ensureConceptProgress(state, conceptId);
    progress.hintsUsed += 1;
    progress.maxHintLevel = Math.max(progress.maxHintLevel || 0, safeLevel);
  }

  if (patternId) {
    const progress = ensurePatternProgress(state, patternId);
    progress.hintsUsed += 1;
    progress.maxHintLevel = Math.max(progress.maxHintLevel || 0, safeLevel);
    applyHintPressure(progress, safeLevel, safeLevel >= 3 ? 'Several hints on this pattern' : 'Hint support');
  }

  if (personaId) {
    if (!state.progress.personas[personaId]) {
      state.progress.personas[personaId] = { turns: 0, averageScore: 0, lastPracticedAt: null };
    }
    const progress = state.progress.personas[personaId];
    progress.hintsUsed = Number(progress.hintsUsed || 0) + 1;
    progress.maxHintLevel = Math.max(Number(progress.maxHintLevel || 0), safeLevel);
  }

  return safeLevel;
};

export const recordAlmostKnown = (state, {
  itemId = null,
  conceptId = null,
  patternId = null,
  personaId = null,
  context = 'session',
} = {}) => {
  const stats = ensureHintStats(state);
  stats.almostKnown += 1;
  stats.lastAlmostKnownAt = new Date().toISOString();

  if (itemId && ITEM_MAP.has(itemId)) {
    const progress = ensureItemProgress(state, itemId);
    progress.almostKnown += 1;
    progress.dueAt = new Date(Math.min(
      new Date(progress.dueAt || 0).getTime() || Date.now(),
      Date.now() + 18 * 60 * 60 * 1000,
    )).toISOString();
  }
  if (conceptId) ensureConceptProgress(state, conceptId).almostKnown += 1;
  if (patternId) ensurePatternProgress(state, patternId).almostKnown += 1;
  if (personaId) {
    if (!state.progress.personas[personaId]) state.progress.personas[personaId] = { turns: 0, averageScore: 0, lastPracticedAt: null };
    state.progress.personas[personaId].almostKnown = Number(state.progress.personas[personaId].almostKnown || 0) + 1;
  }
  if (!state.stats.almostKnownByContext) state.stats.almostKnownByContext = {};
  state.stats.almostKnownByContext[context] = Number(state.stats.almostKnownByContext[context] || 0) + 1;
};

export const recordPatternPractice = (state, patternId, rating, exercise = {}) => {
  const progress = ensurePatternProgress(state, patternId);
  const hintLevel = clamp(Math.round(Number(exercise.hintLevel) || 0), 0, 5);
  const confidenceState = exercise.confidenceState || null;
  const correct = exercise.correct !== false;
  const weight = getHintEvidenceWeight(hintLevel);
  const rawRating = clamp(Number(rating), 0, 3);
  const target = confidenceState === 'almost'
    ? 0.44
    : rawRating === 0 ? 0.08 : rawRating === 1 ? 0.45 : rawRating === 2 ? 0.76 : 0.93;
  progress.reviews += 1;
  progress.correct += correct ? 1 : 0;
  progress.confidence = clamp(progress.confidence * 0.78 + target * 0.22 * weight);
  progress.lastSeenAt = new Date().toISOString();
  progress.maxHintLevel = Math.max(progress.maxHintLevel || 0, hintLevel);
  updateScaffoldAfterReview(progress, {
    rating: rawRating,
    correct,
    hintLevel,
    confidenceState,
  });
  progress.history.push({
    at: progress.lastSeenAt,
    rating: rawRating,
    correct,
    hintLevel,
    confidenceState,
    exerciseType: exercise.type || null,
    adaptiveSupportLevel: Number(exercise.adaptiveSupportLevel || 0),
  });
  progress.history = progress.history.slice(-30);
  if (confidenceState === 'almost') recordAlmostKnown(state, { patternId, context: 'pattern' });
  addActivity(state, { reviews: 1 });
  return progress;
};

export const reviewItem = (state, itemId, rating, exercise = {}) => {
  const item = ITEM_MAP.get(itemId);
  if (!item) return null;
  const progress = ensureItemProgress(state, itemId);
  const now = new Date();
  const wasNew = progress.reps === 0;
  const rawRating = clamp(Number(rating), 0, 3);
  const confidenceState = exercise.confidenceState || null;
  const numericRating = confidenceState === 'almost' ? 1 : rawRating;
  const hintLevel = clamp(Math.round(Number(exercise.hintLevel) || 0), 0, 5);
  const hintWeight = getHintEvidenceWeight(hintLevel);
  const previousConfidence = progress.confidence;
  const previousStability = progress.stability;

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

  if (hintLevel >= 2) {
    const confidenceDelta = progress.confidence - previousConfidence;
    const stabilityDelta = progress.stability - previousStability;
    if (confidenceDelta > 0) progress.confidence = clamp(previousConfidence + confidenceDelta * hintWeight);
    if (stabilityDelta > 0) progress.stability = Math.max(0.08, previousStability + stabilityDelta * hintWeight);
    intervalDays = Math.min(intervalDays * (0.55 + hintWeight * 0.45), HINT_INTERVAL_CAPS[hintLevel]);
    progress.difficulty = clamp(progress.difficulty + (hintLevel - 1) * 0.035, 1, 10);
  }

  if (confidenceState === 'almost') {
    progress.confidence = clamp(previousConfidence + (exercise.correct === false ? -0.015 : 0.025) * hintWeight);
    progress.stability = Math.max(0.08, previousStability + Math.max(0, progress.stability - previousStability) * 0.45);
    intervalDays = Math.min(intervalDays, 0.75);
    progress.almostKnown += 1;
    ensureHintStats(state).almostKnown += 1;
  }

  if (hintLevel > 0) {
    progress.hintedReviews += 1;
    progress.maxHintLevel = Math.max(progress.maxHintLevel || 0, hintLevel);
    progress.lastHintLevel = hintLevel;
    if (exercise.activeRecallCompleted) {
      progress.activeRecallRecoveries += 1;
      const stats = ensureHintStats(state);
      stats.activeRecallCompletions += 1;
      if (exercise.correct !== false) stats.hintRecoveries += 1;
    }
  }

  updateScaffoldAfterReview(progress, {
    rating: rawRating,
    correct: exercise.correct !== false,
    hintLevel,
    confidenceState,
  });

  progress.reps += 1;
  progress.lastReviewedAt = now.toISOString();
  progress.lastRating = numericRating;
  progress.dueAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  progress.history.push({
    at: now.toISOString(),
    rating: rawRating,
    effectiveRating: numericRating,
    exerciseType: exercise.type || null,
    correct: exercise.correct ?? null,
    score: exercise.score ?? null,
    hintLevel,
    hintsUsed: Number(exercise.hintsUsed || 0),
    confidenceState,
    activeRecallCompleted: Boolean(exercise.activeRecallCompleted),
    adaptiveSupportLevel: Number(exercise.adaptiveSupportLevel || 0),
    originalExerciseType: exercise.originalExerciseType || null,
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
    const target = confidenceState === 'almost'
      ? 0.44
      : numericRating === 0 ? 0 : numericRating === 1 ? 0.42 : numericRating === 2 ? 0.76 : 0.94;
    conceptProgress.confidence = clamp(conceptProgress.confidence * 0.78 + target * 0.22 * hintWeight);
    conceptProgress.maxHintLevel = Math.max(conceptProgress.maxHintLevel || 0, hintLevel);
    if (confidenceState === 'almost') conceptProgress.almostKnown += 1;
  });

  if (item.topic) {
    const topicProgress = ensureTopicProgress(state, item.topic);
    topicProgress.reviews += 1;
    topicProgress.correct += numericRating >= 2 ? 1 : 0;
    topicProgress.lastSeenAt = now.toISOString();
    const target = confidenceState === 'almost'
      ? 0.42
      : numericRating === 0 ? 0 : numericRating === 1 ? 0.38 : numericRating === 2 ? 0.74 : 0.92;
    topicProgress.confidence = clamp(topicProgress.confidence * 0.8 + target * 0.2 * hintWeight);
    topicProgress.maxHintLevel = Math.max(topicProgress.maxHintLevel || 0, hintLevel);
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

const chooseBaseExerciseType = (item, progress, index, mode) => {
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

const chooseExerciseType = (item, progress, index, mode) => {
  const originalType = chooseBaseExerciseType(item, progress, index, mode);
  const adaptiveSupportLevel = getAdaptiveSupportLevel(progress);
  const canOrder = item.itemType === 'phrase' && item.pl.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean).length >= 3;
  let type = originalType;

  // Listening and speaking stay modality-specific. Productive written tasks are
  // the ones stepped down after repeated hint use.
  if (!['listening', 'speaking'].includes(originalType)) {
    if (adaptiveSupportLevel >= 2 && ['typing', 'ordering'].includes(originalType)) type = 'choice';
    else if (adaptiveSupportLevel >= 1 && originalType === 'typing') type = canOrder ? 'ordering' : 'choice';
  }

  return {
    type,
    originalType,
    adaptiveSupportLevel,
    adjusted: type !== originalType,
  };
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
  const exercisePlan = chooseExerciseType(item, progress, index, mode);
  const preferredType = exercisePlan.type;
  const translation = translationFor(item, language);
  const dualTranslation = language === 'nl' ? item.en : item.nl;
  const base = {
    id: `${item.id}-${Date.now()}-${index}`,
    itemId: item.id,
    itemType: item.itemType,
    topic: item.topic,
    grammar: item.grammar || [],
    source: item,
    translations: { nl: item.nl || '', en: item.en || '' },
    answer: item.pl,
    originalExerciseType: exercisePlan.originalType,
    adaptiveSupportLevel: exercisePlan.adaptiveSupportLevel,
    adaptiveSupportAdjusted: exercisePlan.adjusted,
    adaptiveSupportReason: exercisePlan.adjusted
      ? (exercisePlan.adaptiveSupportLevel >= 2
        ? 'Repeated hint use changed free recall into recognition.'
        : 'Repeated hint use changed typing into word selection.')
      : '',
  };

  if (preferredType === 'choice') {
    const adaptivePolishRecognition = exercisePlan.adjusted
      && ['typing', 'ordering'].includes(exercisePlan.originalType);
    const direction = adaptivePolishRecognition ? 'meaning-to-pl' : (index % 2 === 0 ? 'pl-to-meaning' : 'meaning-to-pl');
    if (direction === 'pl-to-meaning') {
      const options = shuffle([translation, ...getDistractors(item, language, 3)], `${item.id}-choice-a`);
      return {
        ...base,
        type: 'choice',
        direction: 'pl-to-meaning',
        answerKind: 'meaning',
        skill: 'Meaning',
        instruction: 'Choose the meaning',
        mainText: item.pl,
        safeHint: item.itemType === 'word' ? item.type : 'Translation hidden until you answer.',
        subText: '',
        answer: translation,
        options,
        audioText: item.pl,
      };
    }
    const distractorCount = exercisePlan.adaptiveSupportLevel >= 2 ? 2 : 3;
    const options = shuffle([item.pl, ...getDistractors(item, 'pl', distractorCount)], `${item.id}-choice-b-${exercisePlan.adaptiveSupportLevel}`);
    return {
      ...base,
      type: 'choice',
      direction: 'meaning-to-pl',
      answerKind: 'polish',
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
      direction: 'meaning-to-pl',
      answerKind: 'polish',
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
      direction: 'audio-to-meaning',
      answerKind: 'meaning',
      skill: 'Listening',
      instruction: 'Listen and choose the meaning',
      mainText: 'Tap to listen',
      safeHint: 'You can replay it as often as you need.',
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
      direction: 'pl-to-speech',
      answerKind: 'speech',
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
    direction: 'meaning-to-pl',
    answerKind: 'polish',
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
  const estimatedWeeks = comfortGap === 0 ? 0 : Math.max(2, Math.ceil((comfortGap * 2800) / (dailyGoal * 7)));

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

export const recordConversationTurn = (state, personaId, score, {
  hintLevel = 0,
  confidenceState = null,
  activeRecallCompleted = false,
} = {}) => {
  if (!state.progress.personas[personaId]) {
    state.progress.personas[personaId] = { turns: 0, averageScore: 0, lastPracticedAt: null };
  }
  const progress = state.progress.personas[personaId];
  const safeHintLevel = clamp(Math.round(Number(hintLevel) || 0), 0, 5);
  const weightedScore = clamp(score) * getHintEvidenceWeight(safeHintLevel);
  progress.turns += 1;
  progress.averageScore = clamp(progress.averageScore * 0.82 + weightedScore * 0.18);
  progress.lastPracticedAt = new Date().toISOString();
  progress.hintedTurns = Number(progress.hintedTurns || 0) + (safeHintLevel > 0 ? 1 : 0);
  progress.maxHintLevel = Math.max(Number(progress.maxHintLevel || 0), safeHintLevel);
  if (confidenceState === 'almost') progress.almostKnown = Number(progress.almostKnown || 0) + 1;
  if (activeRecallCompleted) {
    progress.activeRecallRecoveries = Number(progress.activeRecallRecoveries || 0) + 1;
    const stats = ensureHintStats(state);
    stats.activeRecallCompletions += 1;
    if (clamp(score) >= 0.42) stats.hintRecoveries += 1;
  }
  addActivity(state, { conversations: 1 });
  recordSkillEvidence(state, 'speaking', weightedScore);
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
