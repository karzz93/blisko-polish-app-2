import {
  WORDS,
  PHRASES,
  GRAMMAR_CONCEPTS,
  REAL_LIFE_SCENARIOS,
  TOPICS,
  PATTERNS,
} from './data.js?v=1.3.0';
import { getTodayKey } from './storage.js?v=1.3.0';

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

const OPTIONAL_SUBJECT_PRONOUNS = new Set(['ja', 'ty', 'on', 'ona', 'ono', 'my', 'wy', 'oni', 'one']);

const answerTokens = (value = '') => normalizeText(value)
  .split(' ')
  .filter(Boolean);

const sameTokenBag = (left = '', right = '') => {
  const a = answerTokens(left).sort();
  const b = answerTokens(right).sort();
  return a.length > 1 && a.length === b.length && a.every((token, index) => token === b[index]);
};

// Polish permits substantial reordering, but small grammatical chunks are
// not free to scatter. In particular, a preposition must stay with the form it
// governs and negation normally stays directly with the predicate. This keeps
// the evaluator from accepting a random word scramble merely because all
// tokens are present.
const POLISH_FIXED_CHUNK_HEADS = new Set([
  'bez', 'dla', 'do', 'ku', 'na', 'nad', 'nie', 'o', 'od', 'po', 'pod', 'przed',
  'przez', 'przy', 'u', 'w', 'we', 'z', 'za', 'ze',
]);

const preservesPolishChunks = (input = '', expected = '') => {
  const inputTokens = answerTokens(input);
  const expectedTokens = answerTokens(expected);
  const fixedPairs = expectedTokens
    .map((token, index) => [token, expectedTokens[index + 1]])
    .filter(([head, tail]) => POLISH_FIXED_CHUNK_HEADS.has(head) && tail);
  return fixedPairs.every(([head, tail]) => inputTokens.some((token, index) => (
    token === head && inputTokens[index + 1] === tail
  )));
};

const withoutOptionalSubject = (value = '') => {
  const tokens = answerTokens(value);
  if (OPTIONAL_SUBJECT_PRONOUNS.has(tokens[0])) tokens.shift();
  return tokens.join(' ');
};

const uniqueAnswers = (answers = []) => answers
  .map((value) => String(value || '').trim())
  .filter(Boolean)
  .filter((value, index, array) => array.findIndex((candidate) => normalizeText(candidate) === normalizeText(value)) === index);

const genderCounterparts = (answer = '') => {
  const swaps = [
    [/\bchciałbym\b/gi, 'chciałabym'],
    [/\bchciałabym\b/gi, 'chciałbym'],
    [/\bbyłem\b/gi, 'byłam'],
    [/\bbyłam\b/gi, 'byłem'],
    [/\bzrobiłem\b/gi, 'zrobiłam'],
    [/\bzrobiłam\b/gi, 'zrobiłem'],
    [/\bzapomniałem\b/gi, 'zapomniałam'],
    [/\bzapomniałam\b/gi, 'zapomniałem'],
  ];
  return swaps
    .filter(([pattern]) => pattern.test(answer))
    .map(([pattern, replacement]) => answer.replace(pattern, replacement));
};

const differenceCounts = (inputTokens, expectedTokens) => {
  const inputCounts = new Map();
  const expectedCounts = new Map();
  inputTokens.forEach((token) => inputCounts.set(token, (inputCounts.get(token) || 0) + 1));
  expectedTokens.forEach((token) => expectedCounts.set(token, (expectedCounts.get(token) || 0) + 1));
  const missing = [];
  const extra = [];
  expectedCounts.forEach((count, token) => {
    const delta = count - (inputCounts.get(token) || 0);
    for (let index = 0; index < delta; index += 1) missing.push(token);
  });
  inputCounts.forEach((count, token) => {
    const delta = count - (expectedCounts.get(token) || 0);
    for (let index = 0; index < delta; index += 1) extra.push(token);
  });
  return { missing, extra };
};

const commonPrefixLength = (left = '', right = '') => {
  let index = 0;
  while (index < left.length && index < right.length && left[index] === right[index]) index += 1;
  return index;
};

const likelyEndingDifference = (inputToken = '', expectedToken = '') => {
  const left = stripDiacritics(inputToken.toLowerCase());
  const right = stripDiacritics(expectedToken.toLowerCase());
  if (!left || !right || left === right) return false;
  const prefix = commonPrefixLength(left, right);
  const minimum = Math.min(left.length, right.length);
  return minimum >= 4 && prefix >= Math.max(2, minimum - 3) && levenshtein(left, right) <= 3;
};

const getConceptFeedback = (context = {}) => {
  const ids = context.grammar || context.exercise?.grammar || context.source?.grammar || [];
  const concept = ids.map((id) => CONCEPT_MAP.get(id)).find(Boolean);
  return concept ? {
    id: concept.id,
    title: concept.title,
    en: concept.en,
    nl: concept.nl,
    commonMistake: concept.mistakes?.[0] || '',
  } : null;
};

const inferAnswerLanguage = (expected, context = {}) => {
  if (context.language) return context.language;
  if (context.answerKind === 'polish' || context.exercise?.answerKind === 'polish') return 'pl';
  if (/[ąćęłńóśźż]/i.test(expected)) return 'pl';
  return 'support';
};

export const evaluateAnswer = (input, expected, context = {}) => {
  const rawInput = String(input || '').trim();
  const rawExpected = String(expected || '').trim();
  const language = inferAnswerLanguage(rawExpected, context);
  const suppliedAlternatives = [
    ...(context.acceptedAnswers || []),
    ...(context.alternatives || []),
    ...(context.exercise?.acceptedAnswers || []),
    ...(context.source?.acceptedAnswers || []),
    ...(context.source?.alternatives || []),
  ];
  const variants = uniqueAnswers([
    rawExpected,
    ...suppliedAlternatives,
    ...(language === 'pl' ? genderCounterparts(rawExpected) : []),
  ]);
  const concept = getConceptFeedback(context);

  if (!rawInput) {
    return {
      correct: false,
      close: false,
      exact: false,
      diacriticsOnly: false,
      score: 0,
      errorType: 'empty',
      verdict: 'No answer yet',
      message: 'Make a rough attempt first. Even an imperfect answer gives the coach useful evidence.',
      messageNl: 'Doe eerst een ruwe poging. Ook een onvolmaakt antwoord geeft de coach nuttige informatie.',
      expected: rawExpected,
      concept,
    };
  }

  const exactInput = normalizeText(rawInput);
  const looseInput = normalizeText(rawInput, { loose: true });
  const ranked = variants
    .map((variant) => ({
      variant,
      exact: exactInput === normalizeText(variant),
      diacriticsOnly: exactInput !== normalizeText(variant) && looseInput === normalizeText(variant, { loose: true }),
      score: similarity(rawInput, variant),
    }))
    .sort((left, right) => Number(right.exact) - Number(left.exact)
      || Number(right.diacriticsOnly) - Number(left.diacriticsOnly)
      || right.score - left.score);
  const best = ranked[0] || { variant: rawExpected, exact: false, diacriticsOnly: false, score: 0 };
  const expectedTokens = answerTokens(best.variant);
  const inputTokens = answerTokens(rawInput);
  const exact = best.exact;
  const diacriticsOnly = best.diacriticsOnly;
  const isAlternative = normalizeText(best.variant) !== normalizeText(rawExpected);

  if (exact || isAlternative && exact) {
    return {
      correct: true,
      close: false,
      exact: !isAlternative,
      diacriticsOnly: false,
      score: 1,
      errorType: isAlternative ? 'accepted_alternative' : 'exact',
      verdict: isAlternative ? 'Natural alternative accepted' : 'Natural and correct',
      message: isAlternative
        ? 'That is a valid way to express the same intention. Blisko accepted it rather than forcing one model sentence.'
        : 'Natural and correct.',
      messageNl: isAlternative
        ? 'Dit is een geldige manier om dezelfde bedoeling uit te drukken. Blisko dwingt niet één modelzin af.'
        : 'Natuurlijk en correct.',
      expected: rawExpected,
      acceptedAnswer: best.variant,
      concept,
    };
  }

  if (diacriticsOnly) {
    return {
      correct: true,
      close: false,
      exact: false,
      diacriticsOnly: true,
      score: 0.97,
      errorType: 'diacritics',
      verdict: 'Correct, with Polish letters to polish',
      message: 'The sentence is correct. Add the Polish letters when you can; they carry useful sound and spelling information.',
      messageNl: 'De zin is correct. Voeg waar mogelijk de Poolse letters toe; ze geven belangrijke klank- en spellinginformatie.',
      expected: rawExpected,
      acceptedAnswer: best.variant,
      concept,
    };
  }

  if (language === 'pl' && sameTokenBag(rawInput, best.variant) && preservesPolishChunks(rawInput, best.variant)) {
    return {
      correct: true,
      close: false,
      exact: false,
      diacriticsOnly: false,
      score: 0.93,
      errorType: 'word_order',
      verdict: 'Correct words, different emphasis',
      message: `Polish word order is flexible. Your version is understandable; the neutral model order is “${rawExpected}”.`,
      messageNl: `De Poolse woordvolgorde is flexibel. Jouw versie is begrijpelijk; de neutrale modelvolgorde is “${rawExpected}”.`,
      expected: rawExpected,
      acceptedAnswer: rawInput,
      concept,
    };
  }

  if (language === 'pl') {
    const inputWithoutSubject = withoutOptionalSubject(rawInput);
    const expectedWithoutSubject = withoutOptionalSubject(best.variant);
    if (inputWithoutSubject && inputWithoutSubject === expectedWithoutSubject
      && normalizeText(rawInput) !== normalizeText(best.variant)) {
      return {
        correct: true,
        close: false,
        exact: false,
        diacriticsOnly: false,
        score: 0.95,
        errorType: 'pronoun_emphasis',
        verdict: 'Correct, with a different emphasis',
        message: 'Polish often drops the subject pronoun because the verb ending already identifies the person. Keeping it is correct when you want emphasis.',
        messageNl: 'Pools laat het onderwerp vaak weg omdat de werkwoordsuitgang de persoon al aangeeft. Het voornaamwoord behouden is correct als je nadruk wilt leggen.',
        expected: rawExpected,
        acceptedAnswer: rawInput,
        concept: concept || getConceptFeedback({ grammar: ['pronoun_drop'] }),
      };
    }
  }

  const score = best.score;
  const { missing, extra } = differenceCounts(inputTokens, expectedTokens);
  const alignedDifferences = inputTokens.length === expectedTokens.length
    ? inputTokens.map((token, index) => ({ input: token, expected: expectedTokens[index] })).filter((pair) => pair.input !== pair.expected)
    : [];
  const endingPairs = alignedDifferences.filter((pair) => likelyEndingDifference(pair.input, pair.expected));
  const minorTypo = score >= (language === 'pl' ? 0.97 : 0.95);

  if (minorTypo) {
    return {
      correct: true,
      close: false,
      exact: false,
      diacriticsOnly: false,
      score,
      errorType: 'minor_spelling',
      verdict: 'Meaning recovered; tiny spelling repair',
      message: `Your answer clearly recovered the sentence. Compare the spelling with “${best.variant}”.`,
      messageNl: `Je antwoord haalde de zin duidelijk terug. Vergelijk de spelling met “${best.variant}”.`,
      expected: rawExpected,
      acceptedAnswer: best.variant,
      concept,
    };
  }

  if (endingPairs.length && endingPairs.length >= Math.max(1, alignedDifferences.length - 1)) {
    const pair = endingPairs[0];
    return {
      correct: false,
      close: true,
      exact: false,
      diacriticsOnly: false,
      score: Math.max(score, 0.7),
      errorType: 'ending',
      verdict: 'The sentence frame is right; an ending changed',
      message: `You chose the right idea. Compare “${pair.input}” with “${pair.expected}”. In Polish, that ending often signals case, gender, number, or person.`,
      messageNl: `Je koos de juiste bedoeling. Vergelijk “${pair.input}” met “${pair.expected}”. In het Pools geeft die uitgang vaak naamval, geslacht, getal of persoon aan.`,
      expected: rawExpected,
      acceptedAnswer: best.variant,
      differences: endingPairs,
      concept,
    };
  }

  if (missing.length && !extra.length && missing.length <= 2) {
    return {
      correct: false,
      close: true,
      exact: false,
      diacriticsOnly: false,
      score: Math.max(score, 0.62),
      errorType: 'missing_word',
      verdict: 'Almost complete',
      message: `The intention is clear, but ${missing.length === 1 ? 'one word is' : 'two words are'} missing: ${missing.join(', ')}.`,
      messageNl: `De bedoeling is duidelijk, maar ${missing.length === 1 ? 'één woord ontbreekt' : 'twee woorden ontbreken'}: ${missing.join(', ')}.`,
      expected: rawExpected,
      missing,
      concept,
    };
  }

  if (extra.length && !missing.length && extra.length <= 2) {
    return {
      correct: false,
      close: true,
      exact: false,
      diacriticsOnly: false,
      score: Math.max(score, 0.62),
      errorType: 'extra_word',
      verdict: 'The core sentence is there',
      message: `The main sentence is present, but ${extra.length === 1 ? 'this extra word changes the shape' : 'these extra words change the shape'}: ${extra.join(', ')}.`,
      messageNl: `De kernzin staat er, maar ${extra.length === 1 ? 'dit extra woord verandert de vorm' : 'deze extra woorden veranderen de vorm'}: ${extra.join(', ')}.`,
      expected: rawExpected,
      extra,
      concept,
    };
  }

  const close = score >= (language === 'pl' ? 0.64 : 0.68);
  return {
    correct: false,
    close,
    exact: false,
    diacriticsOnly: false,
    score,
    errorType: close ? 'spelling_or_form' : 'different_answer',
    verdict: close ? 'Very close' : 'Build the whole speaking block again',
    message: close
      ? `Your answer is close. Compare the full form with “${best.variant}”, especially the changed word or ending.`
      : 'The intended meaning is not clear enough yet. Study the whole phrase as one useful speaking block.',
    messageNl: close
      ? `Je antwoord zit dichtbij. Vergelijk de volledige vorm met “${best.variant}”, vooral het veranderde woord of de uitgang.`
      : 'De bedoelde betekenis is nog niet duidelijk genoeg. Leer de hele zin als één bruikbaar spreekblok.',
    expected: rawExpected,
    acceptedAnswer: best.variant,
    concept,
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


export const ITEM_SKILL_KEYS = ['reading', 'listening', 'guidedProduction', 'freeProduction', 'pronunciation'];

const createItemSkillEntry = () => ({
  attempts: 0,
  correct: 0,
  incorrect: 0,
  score: 0,
  confidence: 0,
  hintsUsed: 0,
  lastAt: null,
});

const ensureItemSkills = (progress) => {
  progress.skills = progress.skills || {};
  ITEM_SKILL_KEYS.forEach((key) => {
    const saved = progress.skills[key] || {};
    progress.skills[key] = {
      ...createItemSkillEntry(),
      ...saved,
      attempts: Number(saved.attempts || 0),
      correct: Number(saved.correct || 0),
      incorrect: Number(saved.incorrect || 0),
      score: clamp(Number(saved.score ?? saved.confidence ?? 0)),
      confidence: clamp(Number(saved.confidence ?? saved.score ?? 0)),
      hintsUsed: Number(saved.hintsUsed || 0),
    };
  });
  return progress.skills;
};

export const getExerciseSkill = (exercise = {}) => {
  if (exercise.skillKey && ITEM_SKILL_KEYS.includes(exercise.skillKey)) return exercise.skillKey;
  if (exercise.type === 'listening' || exercise.direction === 'audio-to-meaning') return 'listening';
  if (exercise.type === 'speaking' || exercise.answerKind === 'speech') return 'pronunciation';
  if (exercise.type === 'typing') return 'freeProduction';
  if (exercise.type === 'ordering') return 'guidedProduction';
  if (exercise.type === 'choice' && exercise.direction === 'meaning-to-pl') return 'guidedProduction';
  return 'reading';
};

export const getItemSkillProfile = (progress = null) => {
  if (!progress) return Object.fromEntries(ITEM_SKILL_KEYS.map((key) => [key, createItemSkillEntry()]));
  return ensureItemSkills(progress);
};

export const getWeakestItemSkill = (progress = null) => {
  if (!progress) return null;
  const skills = ensureItemSkills(progress);
  const attempted = ITEM_SKILL_KEYS.filter((key) => Number(skills[key].attempts || 0) > 0);
  if (!attempted.length) return null;
  return attempted
    .map((key) => ({ key, value: skills[key].confidence + Math.min(0.08, skills[key].attempts * 0.006) }))
    .sort((left, right) => left.value - right.value)[0]?.key || null;
};

export const recordItemSkillEvidence = (state, itemId, skill, score, {
  correct = true,
  hintLevel = 0,
  confidenceState = null,
  source = 'practice',
} = {}) => {
  if (!itemId || !ITEM_MAP.has(itemId) || !ITEM_SKILL_KEYS.includes(skill)) return null;
  const progress = ensureItemProgress(state, itemId);
  const entry = ensureItemSkills(progress)[skill];
  const safeScore = clamp(Number(score) || 0);
  const safeHintLevel = clamp(Math.round(Number(hintLevel) || 0), 0, 5);
  const evidenceWeight = getHintEvidenceWeight(safeHintLevel) * (confidenceState === 'almost' ? 0.72 : 1);
  const weightedScore = clamp(safeScore * evidenceWeight);
  const blend = entry.attempts < 3 ? 0.34 : 0.2;
  entry.attempts += 1;
  entry.correct += correct ? 1 : 0;
  entry.incorrect += correct ? 0 : 1;
  entry.score = clamp(entry.score * (1 - blend) + weightedScore * blend);
  entry.confidence = clamp(entry.confidence * 0.76 + weightedScore * 0.24);
  entry.hintsUsed += safeHintLevel > 0 ? 1 : 0;
  entry.lastAt = new Date().toISOString();
  entry.lastSource = source;
  recordSkillEvidence(state, skill, weightedScore, { correct, hintLevel: safeHintLevel, source });
  return entry;
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
    skills: Object.fromEntries(ITEM_SKILL_KEYS.map((key) => [key, createItemSkillEntry()])),
  };
  state.progress.items[itemId] = {
    ...defaults,
    ...(state.progress.items[itemId] || {}),
  };
  if (!Array.isArray(state.progress.items[itemId].history)) state.progress.items[itemId].history = [];
  if (!Array.isArray(state.progress.items[itemId].hintHistory)) state.progress.items[itemId].hintHistory = [];
  ensureScaffoldFields(state.progress.items[itemId]);
  ensureItemSkills(state.progress.items[itemId]);
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
    skillKey: getExerciseSkill(exercise),
    errorType: exercise.errorType || null,
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

  const skillKey = getExerciseSkill(exercise);
  const ratingScore = numericRating === 0 ? 0.08 : numericRating === 1 ? 0.46 : numericRating === 2 ? 0.78 : 0.94;
  const observedScore = Number.isFinite(Number(exercise.score)) ? clamp(Number(exercise.score)) : ratingScore;
  const skillScore = exercise.correct === false ? Math.min(0.34, observedScore) : Math.max(ratingScore, observedScore * 0.86);
  recordItemSkillEvidence(state, itemId, skillKey, skillScore, {
    correct: exercise.correct !== false,
    hintLevel,
    confidenceState,
    source: exercise.source || 'review',
  });
  if (conceptIds.length) recordSkillEvidence(state, 'grammar', skillScore * hintWeight, {
    correct: exercise.correct !== false,
    hintLevel,
    source: 'sentence grammar',
  });

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

const exerciseTypeForSkill = (skill, item) => {
  if (skill === 'listening') return 'listening';
  if (skill === 'pronunciation') return 'speaking';
  if (skill === 'freeProduction') return 'typing';
  if (skill === 'guidedProduction') {
    const canOrder = item.itemType === 'phrase' && item.pl.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean).length >= 3;
    return canOrder ? 'ordering' : 'choice';
  }
  return 'choice';
};

const chooseBaseExerciseType = (item, progress, index, mode) => {
  if (mode === 'speaking') return { type: index % 2 === 0 ? 'speaking' : 'typing', targetSkill: index % 2 === 0 ? 'pronunciation' : 'freeProduction' };
  if (mode === 'listening') return { type: index % 2 === 0 ? 'listening' : 'choice', targetSkill: index % 2 === 0 ? 'listening' : 'reading' };

  const weakestSkill = getWeakestItemSkill(progress);
  const shouldTargetGap = Boolean(progress?.reps && weakestSkill && (mode === 'review' || index % 2 === 0));
  if (shouldTargetGap) return { type: exerciseTypeForSkill(weakestSkill, item), targetSkill: weakestSkill };

  if (mode === 'review') {
    if (!progress || progress.confidence < 0.25) return { type: index % 2 ? 'choice' : 'typing', targetSkill: index % 2 ? 'reading' : 'freeProduction' };
    const rotation = [
      { type: 'typing', targetSkill: 'freeProduction' },
      { type: 'ordering', targetSkill: 'guidedProduction' },
      { type: 'listening', targetSkill: 'listening' },
      { type: 'speaking', targetSkill: 'pronunciation' },
    ];
    return rotation[index % rotation.length];
  }
  if (!progress || progress.reps === 0) return index % 3 === 0
    ? { type: 'listening', targetSkill: 'listening' }
    : { type: 'choice', targetSkill: index % 2 === 0 ? 'reading' : 'guidedProduction' };
  if (progress.confidence < 0.35) return index % 2
    ? { type: 'choice', targetSkill: 'reading' }
    : { type: 'typing', targetSkill: 'freeProduction' };
  if (progress.confidence < 0.7) {
    const rotation = [
      { type: 'typing', targetSkill: 'freeProduction' },
      { type: 'ordering', targetSkill: 'guidedProduction' },
      { type: 'listening', targetSkill: 'listening' },
    ];
    return rotation[index % rotation.length];
  }
  const rotation = [
    { type: 'typing', targetSkill: 'freeProduction' },
    { type: 'speaking', targetSkill: 'pronunciation' },
    { type: 'ordering', targetSkill: 'guidedProduction' },
    { type: 'listening', targetSkill: 'listening' },
    { type: 'choice', targetSkill: 'reading' },
  ];
  return rotation[index % rotation.length];
};

const chooseExerciseType = (item, progress, index, mode) => {
  const basePlan = chooseBaseExerciseType(item, progress, index, mode);
  const originalType = basePlan.type;
  const targetSkill = basePlan.targetSkill || getExerciseSkill({ type: originalType });
  const adaptiveSupportLevel = getAdaptiveSupportLevel(progress);
  const canOrder = item.itemType === 'phrase' && item.pl.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean).length >= 3;
  let type = originalType;
  let effectiveSkill = targetSkill;

  // Listening and pronunciation stay modality-specific. Productive written
  // tasks step down after repeated hint use, while the skill gap remains known.
  if (!['listening', 'speaking'].includes(originalType)) {
    if (adaptiveSupportLevel >= 2 && ['typing', 'ordering'].includes(originalType)) {
      type = 'choice';
      effectiveSkill = 'guidedProduction';
    } else if (adaptiveSupportLevel >= 1 && originalType === 'typing') {
      type = canOrder ? 'ordering' : 'choice';
      effectiveSkill = 'guidedProduction';
    }
  }

  return {
    type,
    originalType,
    targetSkill,
    effectiveSkill,
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
    skillKey: exercisePlan.effectiveSkill || exercisePlan.targetSkill,
    targetSkill: exercisePlan.targetSkill,
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
    const direction = adaptivePolishRecognition
      ? 'meaning-to-pl'
      : exercisePlan.targetSkill === 'reading'
        ? 'pl-to-meaning'
        : exercisePlan.targetSkill === 'guidedProduction'
          ? 'meaning-to-pl'
          : (index % 2 === 0 ? 'pl-to-meaning' : 'meaning-to-pl');
    if (direction === 'pl-to-meaning') {
      const options = shuffle([translation, ...getDistractors(item, language, 3)], `${item.id}-choice-a`);
      return {
        ...base,
        type: 'choice',
        direction: 'pl-to-meaning',
        answerKind: 'meaning',
        skill: 'Reading recognition',
        skillKey: 'reading',
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
      skill: 'Guided production',
      skillKey: 'guidedProduction',
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
      skill: 'Guided production',
      skillKey: 'guidedProduction',
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
      skillKey: 'listening',
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
      skill: 'Pronunciation',
      skillKey: 'pronunciation',
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
    skill: 'Free production',
    skillKey: 'freeProduction',
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

const createGlobalSkillEntry = () => ({
  attempts: 0,
  correct: 0,
  incorrect: 0,
  score: 0,
  confidence: 0,
  hintsUsed: 0,
  lastAt: null,
});

const GLOBAL_SKILL_KEYS = [...ITEM_SKILL_KEYS, 'grammar', 'conversation'];

const getSkillEvidence = (state) => {
  if (!state.stats.skillEvidence) state.stats.skillEvidence = {};
  const legacySpeaking = state.stats.skillEvidence.speaking || null;
  GLOBAL_SKILL_KEYS.forEach((key) => {
    const saved = state.stats.skillEvidence[key]
      || (key === 'pronunciation' ? legacySpeaking : null)
      || (key === 'freeProduction' ? state.stats.skillEvidence.grammar : null)
      || {};
    state.stats.skillEvidence[key] = {
      ...createGlobalSkillEntry(),
      ...saved,
      attempts: Number(saved.attempts || 0),
      correct: Number(saved.correct || 0),
      incorrect: Number(saved.incorrect || 0),
      score: clamp(Number(saved.score ?? saved.confidence ?? 0)),
      confidence: clamp(Number(saved.confidence ?? saved.score ?? 0)),
      hintsUsed: Number(saved.hintsUsed || 0),
    };
  });
  return state.stats.skillEvidence;
};

const normalizeSkillKey = (skill = '') => {
  const key = String(skill).trim();
  if (key === 'speaking') return 'pronunciation';
  if (key === 'producing' || key === 'production') return 'freeProduction';
  return key;
};

export const recordSkillEvidence = (state, skill, score, {
  correct = null,
  hintLevel = 0,
  source = 'practice',
} = {}) => {
  const evidence = getSkillEvidence(state);
  const key = normalizeSkillKey(skill);
  if (!evidence[key]) evidence[key] = createGlobalSkillEntry();
  const entry = evidence[key];
  const safeScore = clamp(Number(score) || 0);
  const blend = entry.attempts < 4 ? 0.3 : 0.16;
  entry.attempts += 1;
  if (correct === true) entry.correct += 1;
  if (correct === false) entry.incorrect += 1;
  entry.score = clamp(entry.score * (1 - blend) + safeScore * blend);
  entry.confidence = clamp(entry.confidence * 0.78 + safeScore * 0.22);
  entry.hintsUsed += Number(hintLevel || 0) > 0 ? 1 : 0;
  entry.lastAt = new Date().toISOString();
  entry.lastSource = source;
  return entry;
};

const aggregateItemSkill = (state, skill) => {
  const entries = Object.values(state.progress.items || {})
    .map((progress) => progress?.skills?.[skill])
    .filter((entry) => entry && Number(entry.attempts || 0) > 0);
  if (!entries.length) return { score: 0, attempts: 0, items: 0 };
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(1, Math.sqrt(entry.attempts)), 0);
  const score = entries.reduce((sum, entry) => sum + clamp(entry.confidence ?? entry.score) * Math.max(1, Math.sqrt(entry.attempts)), 0) / totalWeight;
  return {
    score: clamp(score),
    attempts: entries.reduce((sum, entry) => sum + Number(entry.attempts || 0), 0),
    items: entries.length,
  };
};

const getPlacementFreshness = (placement) => {
  if (!placement?.completedAt) return 0;
  const ageDays = Math.max(0, (Date.now() - new Date(placement.completedAt).getTime()) / DAY_MS);
  return clamp(1 - ageDays / 180);
};

const blendSkillWithPlacement = (practiceScore, attempts, placementScore, freshness) => {
  if (!Number.isFinite(Number(placementScore))) return practiceScore;
  const evidenceSaturation = clamp(attempts / 16);
  const placementWeight = 0.42 * freshness * (1 - evidenceSaturation * 0.82);
  return clamp(practiceScore * (1 - placementWeight) + clamp(Number(placementScore)) * placementWeight);
};

const levelAnchor = (level) => ({
  'Pre-A1': 0.1,
  A0: 0.1,
  A1: 0.34,
  A2: 0.58,
  B1: 0.74,
  B2: 0.88,
}[level] ?? 0);

export const scorePlacementAnswers = (results = []) => {
  const valid = results.filter((entry) => entry && entry.skill && Number.isFinite(Number(entry.score)));
  const totalWeight = valid.reduce((sum, entry) => sum + Math.max(0.1, Number(entry.weight || 1)), 0) || 1;
  const score = clamp(valid.reduce((sum, entry) => sum + clamp(Number(entry.score)) * Math.max(0.1, Number(entry.weight || 1)), 0) / totalWeight);
  const skillScores = {};
  const skillEvidence = {};
  [...ITEM_SKILL_KEYS, 'grammar'].forEach((skill) => {
    const entries = valid.filter((entry) => entry.skill === skill);
    if (!entries.length) return;
    const weight = entries.reduce((sum, entry) => sum + Math.max(0.1, Number(entry.weight || 1)), 0);
    skillScores[skill] = clamp(entries.reduce((sum, entry) => sum + clamp(Number(entry.score)) * Math.max(0.1, Number(entry.weight || 1)), 0) / weight);
    skillEvidence[skill] = entries.length;
  });
  const levelScores = {};
  ['A0', 'A1', 'A2'].forEach((level) => {
    const entries = valid.filter((entry) => entry.level === level);
    if (!entries.length) return;
    const weight = entries.reduce((sum, entry) => sum + Math.max(0.1, Number(entry.weight || 1)), 0);
    levelScores[level] = clamp(entries.reduce((sum, entry) => sum + clamp(Number(entry.score)) * Math.max(0.1, Number(entry.weight || 1)), 0) / weight);
  });
  const coverage = Object.keys(skillScores).length / 6;
  const evidenceConfidence = clamp(valid.length / 11 * 0.72 + coverage * 0.28);
  const a0 = levelScores.A0 ?? 0;
  const a1 = levelScores.A1 ?? 0;
  const a2 = levelScores.A2 ?? 0;
  let estimatedLevel = 'Pre-A1';
  // This short diagnostic only contains evidence through A2, so it never
  // claims B1. Later real practice can move the ongoing estimate higher.
  if (a0 >= 0.72 && a1 >= 0.58 && a2 >= 0.48) estimatedLevel = 'A2';
  else if (a0 >= 0.55 && a1 >= 0.34) estimatedLevel = 'A1';
  return {
    score,
    skillScores,
    skillEvidence,
    levelScores,
    evidenceConfidence,
    estimatedLevel,
    answered: valid.length,
  };
};

export const applyPlacementResult = (state, results = [], { mode = 'placement' } = {}) => {
  const summary = scorePlacementAnswers(results);
  const completedAt = new Date().toISOString();
  state.onboarding = state.onboarding || {};
  state.onboarding.placement = state.onboarding.placement || { history: [] };
  const record = {
    completedAt,
    mode,
    estimatedLevel: summary.estimatedLevel,
    score: summary.score,
    evidenceConfidence: summary.evidenceConfidence,
    skillScores: summary.skillScores,
    levelScores: summary.levelScores,
    answered: summary.answered,
  };
  state.onboarding.placement.completedAt = completedAt;
  state.onboarding.placement.estimatedLevel = summary.estimatedLevel;
  state.onboarding.placement.score = summary.score;
  state.onboarding.placement.evidenceConfidence = summary.evidenceConfidence;
  state.onboarding.placement.skillScores = summary.skillScores;
  state.onboarding.placement.levelScores = summary.levelScores;
  state.onboarding.placement.lastMode = mode;
  state.onboarding.placement.history = [
    record,
    ...(Array.isArray(state.onboarding.placement.history) ? state.onboarding.placement.history : []),
  ].slice(0, 6);
  state.onboarding.diagnosticLevel = summary.estimatedLevel;

  results.forEach((entry) => {
    if (!entry?.skill || !Number.isFinite(Number(entry.score))) return;
    if (entry.itemId && ITEM_MAP.has(entry.itemId) && ITEM_SKILL_KEYS.includes(entry.skill)) {
      // Item evidence also updates the matching global skill once.
      recordItemSkillEvidence(state, entry.itemId, entry.skill, entry.score, {
        correct: entry.correct !== false,
        hintLevel: 0,
        source: 'level check',
      });
    } else {
      recordSkillEvidence(state, entry.skill, entry.score, {
        correct: entry.correct,
        hintLevel: 0,
        source: 'level check',
      });
    }
  });
  addActivity(state, { minutes: Math.max(3, Math.round(results.length * 0.35)) });
  return summary;
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
  const placement = state.onboarding?.placement || {};
  const placementFreshness = getPlacementFreshness(placement);
  const reviewedAccuracy = state.stats.correct + state.stats.incorrect > 0
    ? state.stats.correct / (state.stats.correct + state.stats.incorrect)
    : 0;

  const skillProfiles = {};
  ITEM_SKILL_KEYS.forEach((skill) => {
    const itemEvidence = aggregateItemSkill(state, skill);
    const global = evidence[skill] || createGlobalSkillEntry();
    const attempts = Math.max(itemEvidence.attempts, Number(global.attempts || 0));
    const practiceScore = itemEvidence.attempts
      ? clamp(itemEvidence.score * 0.76 + global.score * 0.24)
      : clamp(global.score);
    const finalScore = blendSkillWithPlacement(
      practiceScore,
      attempts,
      placement.skillScores?.[skill],
      placementFreshness,
    );
    skillProfiles[skill] = {
      score: finalScore,
      practiceScore,
      attempts,
      items: itemEvidence.items,
      evidenceConfidence: clamp(attempts / 18 * 0.8 + (placement.skillScores?.[skill] !== undefined ? placementFreshness * 0.2 : 0)),
    };
  });

  const reading = clamp(skillProfiles.reading.score || (
    average([...ITEM_MAP.values()].map((item) => state.progress.items[item.id]?.confidence || 0)) * 0.75
      + reviewedAccuracy * 0.25
  ));
  const listening = clamp(skillProfiles.listening.score);
  const guidedProduction = clamp(skillProfiles.guidedProduction.score);
  const freeProduction = clamp(skillProfiles.freeProduction.score);
  const pronunciation = clamp(skillProfiles.pronunciation.score);
  const speaking = clamp(freeProduction * 0.56 + pronunciation * 0.44);
  const grammarEvidence = evidence.grammar || createGlobalSkillEntry();
  const grammar = clamp(grammarMastery * 0.72 + grammarEvidence.score * 0.28);
  const conversation = clamp(conversationReadiness * 0.72 + (evidence.conversation?.score || 0) * 0.28);
  const production = clamp(guidedProduction * 0.28 + freeProduction * 0.48 + pronunciation * 0.24);

  let overall = clamp(
    Math.min(1, masteredWords / 100) * 0.17
      + Math.min(1, knownPhrases / 48) * 0.19
      + reading * 0.1
      + listening * 0.13
      + guidedProduction * 0.1
      + freeProduction * 0.13
      + pronunciation * 0.07
      + grammar * 0.06
      + conversation * 0.05,
  );
  if (placement.estimatedLevel && placementFreshness > 0) {
    const totalAttempts = ITEM_SKILL_KEYS.reduce((sum, skill) => sum + skillProfiles[skill].attempts, 0);
    const placementWeight = 0.28 * placementFreshness * (1 - clamp(totalAttempts / 70) * 0.8);
    overall = clamp(overall * (1 - placementWeight) + levelAnchor(placement.estimatedLevel) * placementWeight);
  }

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

  const totalSkillAttempts = ITEM_SKILL_KEYS.reduce((sum, skill) => sum + skillProfiles[skill].attempts, 0);
  const skillCoverage = ITEM_SKILL_KEYS.filter((skill) => skillProfiles[skill].attempts > 0 || placement.skillScores?.[skill] !== undefined).length / ITEM_SKILL_KEYS.length;
  const evidenceConfidence = clamp(
    Math.min(1, totalSkillAttempts / 70) * 0.56
      + skillCoverage * 0.24
      + Math.min(1, state.stats.conversationTurns / 20) * 0.1
      + (placement.evidenceConfidence || 0) * placementFreshness * 0.1,
  );

  const dailyGoal = Math.max(5, state.profile.dailyGoal || 15);
  const comfortGap = clamp(0.76 - conversationReadiness, 0, 0.76);
  const estimatedWeeks = comfortGap === 0 ? 0 : Math.max(2, Math.ceil((comfortGap * 2800) / (dailyGoal * 7)));
  const placementAgeDays = placement.completedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(placement.completedAt).getTime()) / DAY_MS))
    : null;

  const canDo = [
    { id: 'greet', label: 'Greet family and exchange basic courtesies', ready: Math.max(reading, guidedProduction) >= 0.22 },
    { id: 'repair', label: 'Ask someone to repeat or speak more slowly', ready: freeProduction >= 0.28 || knownPhrases >= 5 },
    { id: 'table', label: 'Handle a short exchange at the family table', ready: getTopicReadiness(state, 'food') >= 0.42 },
    { id: 'work', label: 'Answer a simple question about work or hobbies', ready: Math.max(getTopicReadiness(state, 'work'), getTopicReadiness(state, 'hobbies')) >= 0.45 },
    { id: 'followup', label: 'Understand and answer one natural follow-up question', ready: listening >= 0.5 && freeProduction >= 0.42 },
  ];

  return {
    masteredWords,
    knownPhrases,
    grammarMastery,
    unlockedConversations,
    conversationReadiness,
    reading,
    listening,
    guidedProduction,
    freeProduction,
    pronunciation,
    production,
    speaking,
    grammar,
    conversation,
    overall,
    cefr,
    nextCefr,
    cefrProgress,
    estimatedWeeks,
    accuracy: reviewedAccuracy,
    skills: skillProfiles,
    evidenceConfidence,
    placementLevel: placement.estimatedLevel || null,
    placementAgeDays,
    recalibrationDue: placementAgeDays === null || placementAgeDays >= 28,
    canDo,
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
      feedbackNl: 'Zeg of typ een kort Pools antwoord. Eén bruikbaar spreekblok is genoeg.',
      suggestion: turn.suggestions?.[0]?.pl || '',
      errorType: 'empty',
    };
  }

  let best = { score: 0, suggestion: turn.suggestions?.[0], evaluation: null };
  (turn.suggestions || []).forEach((suggestion) => {
    const intents = suggestion.intent || [];
    const hits = intents.filter((keyword) => normalized.includes(normalizeText(keyword, { loose: true }))).length;
    const keywordScore = intents.length ? hits / Math.min(2, intents.length) : 0;
    const evaluation = evaluateAnswer(text, suggestion.pl, {
      language: 'pl',
      acceptedAnswers: suggestion.alternatives || [],
      grammar: turn.grammar || [],
    });
    const phraseScore = evaluation.correct ? Math.max(0.9, evaluation.score) : evaluation.close ? Math.max(0.56, evaluation.score) : evaluation.score;
    const score = Math.max(keywordScore, phraseScore * 0.9);
    if (score > best.score) best = { score, suggestion, evaluation };
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
  const accepted = Boolean(best.evaluation?.correct || best.score >= 0.48 || (polishSignals && normalized.split(' ').length >= 2));
  const evaluatorFeedback = best.evaluation?.message;
  const evaluatorFeedbackNl = best.evaluation?.messageNl;

  return {
    score: clamp(best.score || (polishSignals ? 0.44 : 0.12)),
    accepted,
    feedback: correction
      ? correction
      : accepted
        ? (best.evaluation?.errorType === 'word_order'
          ? best.evaluation.message
          : 'That would keep the conversation moving naturally.')
        : evaluatorFeedback || 'The intention is not clear yet. Borrow the sentence frame and change one detail.',
    feedbackNl: correction
      ? 'De zin heeft de juiste bedoeling, maar één Poolse vorm moet veranderen.'
      : accepted
        ? (best.evaluation?.messageNl || 'Dit houdt het gesprek op een natuurlijke manier gaande.')
        : evaluatorFeedbackNl || 'De bedoeling is nog niet duidelijk. Gebruik het zinspatroon en verander één detail.',
    correction,
    correctedText,
    suggestion: best.suggestion?.pl || turn.suggestions?.[0]?.pl || '',
    errorType: correction ? 'grammar_correction' : best.evaluation?.errorType || (accepted ? 'intent_match' : 'different_answer'),
    evaluation: best.evaluation,
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
  recordSkillEvidence(state, 'freeProduction', weightedScore, { correct: score >= 0.42, hintLevel: safeHintLevel, source: 'conversation' });
  recordSkillEvidence(state, 'conversation', weightedScore, { correct: score >= 0.42, hintLevel: safeHintLevel, source: 'conversation' });
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
