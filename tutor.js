import { TUTOR_TOPICS, GRAMMAR_CONCEPTS, PHRASES, WORDS, PATTERNS } from './data.js';
import { normalizeText, similarity, getWeakItems, getMetrics } from './engine.js';

const STOP_WORDS = new Set([
  // English
  'a', 'an', 'and', 'are', 'can', 'could', 'do', 'does', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'me', 'my',
  'of', 'on', 'please', 'say', 'tell', 'the', 'this', 'to', 'what', 'when', 'where', 'which', 'why', 'with', 'would',
  // Dutch
  'aan', 'als', 'de', 'dit', 'een', 'en', 'het', 'hoe', 'ik', 'in', 'is', 'kan', 'kun', 'met', 'mij', 'mijn', 'naar',
  'of', 'om', 'op', 'te', 'uit', 'van', 'voor', 'waar', 'wat', 'welke', 'waarom', 'zeg',
  // Polish function words that are rarely useful as a sole intent signal
  'a', 'czy', 'do', 'i', 'jak', 'na', 'o', 'po', 'w', 'z',
]);

const GRAMMAR_TERMS = new Set([
  'accusative', 'biernik', 'genitive', 'dopełniacz', 'dopelniacz', 'instrumental', 'narzędnik', 'narzednik',
  'locative', 'miejscownik', 'nominative', 'mianownik', 'imperative', 'tryb', 'conditional', 'reflexive',
  'negation', 'plural', 'pronoun', 'pronouns', 'voornaamwoord', 'voornaamwoorden', 'past', 'tense', 'verleden',
  'adjective', 'adjectives', 'bijvoeglijk', 'modal', 'infinitive', 'infinitief', 'formal', 'formeel', 'polite', 'beleefd',
]);

const normalizeForMatch = (value = '', options = {}) => normalizeText(value, options)
  .replace(/[-–—/]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokenize = (text, { loose = true, keepShort = false } = {}) => normalizeForMatch(text, { loose })
  .split(' ')
  .filter((token) => token && (keepShort || token.length > 1));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasWholePhrase = (message, phrase) => {
  if (!message || !phrase) return false;
  const expression = phrase
    .split(' ')
    .filter(Boolean)
    .map(escapeRegExp)
    .join('\\s+');
  return new RegExp(`(?:^|\\s)${expression}(?=$|\\s)`, 'u').test(message);
};

const meaningfulTokens = (value) => tokenize(value).filter((token) => !STOP_WORDS.has(token));

const keywordScore = (message, keyword) => {
  const rawMessage = normalizeForMatch(message);
  const rawKeyword = normalizeForMatch(keyword);
  const looseMessage = normalizeForMatch(message, { loose: true });
  const looseKeyword = normalizeForMatch(keyword, { loose: true });
  if (!looseMessage || !looseKeyword) return 0;

  // A single Polish letter such as ł must match as its own token. It must never
  // become a substring match for ordinary words such as "till".
  if (rawKeyword.length === 1) {
    return tokenize(rawMessage, { loose: false, keepShort: true }).includes(rawKeyword) ? 10 : 0;
  }

  const keywordTokens = looseKeyword.split(' ').filter(Boolean);
  const messageTokens = new Set(tokenize(looseMessage, { keepShort: true }));

  if (keywordTokens.length > 1) {
    if (hasWholePhrase(looseMessage, looseKeyword)) return 9 + Math.min(3, keywordTokens.length - 1);

    const significant = keywordTokens.filter((token) => !STOP_WORDS.has(token));
    if (significant.length >= 2 && significant.every((token) => messageTokens.has(token))) {
      return 4 + significant.length;
    }
    return 0;
  }

  const [token] = keywordTokens;
  if (!token || STOP_WORDS.has(token)) return 0;
  if (!messageTokens.has(token)) return 0;
  return token.length >= 6 ? 5 : token.length >= 4 ? 4 : 3;
};

const overlapScore = (message, topic) => {
  const scores = topic.keywords.map((keyword) => keywordScore(message, keyword)).filter(Boolean);
  if (!scores.length) return 0;
  scores.sort((a, b) => b - a);
  // Reward corroborating keywords without allowing a pile of weak words to
  // outweigh one exact intent phrase.
  return scores[0] + scores.slice(1, 3).reduce((total, score) => total + Math.min(2, score * 0.25), 0);
};

const confidentTopicMatch = (message) => {
  const ranked = TUTOR_TOPICS
    .map((topic) => ({ topic, score: overlapScore(message, topic) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const runnerUp = ranked[1];
  if (!best || best.score < 3) return null;
  if (runnerUp && best.score < 8 && best.score - runnerUp.score < 1.25) return null;
  return best.topic;
};

const grammarFallback = (message) => {
  const messageTokens = new Set(meaningfulTokens(message));
  if (!messageTokens.size) return null;

  const ranked = GRAMMAR_CONCEPTS
    .map((concept) => {
      const searchable = `${concept.id.replaceAll('_', ' ')} ${concept.title} ${(concept.visual || []).join(' ')}`;
      const conceptTokens = new Set(meaningfulTokens(searchable));
      let score = 0;
      messageTokens.forEach((token) => {
        if (!conceptTokens.has(token)) return;
        score += GRAMMAR_TERMS.has(token) ? 4 : token.length >= 7 ? 1.5 : 0.75;
      });
      return { concept, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const runnerUp = ranked[1];
  if (!best || best.score < 2) return null;
  if (runnerUp && best.score < 4 && best.score - runnerUp.score < 0.75) return null;
  return best.concept;
};

const detectSentenceIssue = (message) => {
  const checks = [
    {
      test: /\bdo\s+polska\b/i,
      title: 'Use do Polski, not do Polska',
      nl: 'Na do komt de genitief. Daarom verandert Polska in Polski. Voor een reis met vervoer is de volledige natuurlijke zin: Jadę do Polski.',
      en: 'The preposition do takes the genitive, so Polska changes to Polski. For a trip by transport, the full natural sentence is Jadę do Polski.',
      examples: [['Jadę do Polski.', 'Ik ga naar Polen.', "I'm going to Poland."], ['Idę do sklepu.', 'Ik loop naar de winkel.', "I'm walking to the shop."]],
    },
    {
      test: /\blubi[eę]\s+kawa\b/i,
      title: 'Use Lubię kawę',
      nl: 'Kawa is een vrouwelijk woord op -a. Als direct object na lubię verandert -a meestal in -ę: kawa → kawę.',
      en: 'Kawa is a feminine noun ending in -a. As the direct object after lubię, -a usually becomes -ę: kawa → kawę.',
      examples: [['Lubię kawę.', 'Ik houd van koffie.', 'I like coffee.'], ['Lubię herbatę.', 'Ik houd van thee.', 'I like tea.']],
    },
    {
      test: /\bjestem\s+\w+\s+lat\b/i,
      title: 'Polish “has” an age',
      nl: 'Zeg Mam … lat. Pools gebruikt mieć (hebben) voor leeftijd, niet być (zijn).',
      en: 'Say Mam … lat. Polish uses mieć (to have) for age, not być (to be).',
      examples: [['Mam trzydzieści lat.', 'Ik ben dertig.', "I'm thirty."], ['Ile masz lat?', 'Hoe oud ben je?', 'How old are you?']],
    },
    {
      test: /\bja\s+(jestem|mam|lubi[eę]|pracuj[eę]|mieszkam)\b/i,
      title: 'Your sentence is correct; “ja” is probably unnecessary',
      nl: 'De werkwoordsvorm laat al zien dat jij het bent. Laat ja weg in een neutrale zin en bewaar het voor nadruk of contrast.',
      en: 'The verb form already marks “I”. Omit ja in a neutral sentence and keep it for emphasis or contrast.',
      examples: [['Mieszkam w Holandii.', 'Ik woon in Nederland.', 'I live in the Netherlands.'], ['Ja gotuję, a ty odpoczywasz.', 'Ík kook, jij rust.', 'I cook, while you rest.']],
    },
  ];
  return checks.find((check) => check.test.test(message)) || null;
};

const cleanCapturedQuery = (value = '') => value
  .trim()
  .replace(/^[“”„"']+|[“”„"'.?!]+$/g, '')
  .trim();

const extractWithPatterns = (message, patterns) => {
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return cleanCapturedQuery(match[1]);
  }
  return '';
};

const findBestSourceEntry = (query) => {
  const normalizedQuery = normalizeForMatch(query, { loose: true });
  if (!normalizedQuery) return null;
  const entries = [...PHRASES, ...WORDS];

  const ranked = entries
    .map((entry) => {
      const sourceValues = [entry.en, entry.nl].filter(Boolean);
      let score = 0;
      let sourceLength = Number.POSITIVE_INFINITY;

      sourceValues.forEach((value) => {
        const normalizedValue = normalizeForMatch(value, { loose: true });
        let candidate = similarity(normalizedQuery, normalizedValue);
        if (normalizedValue === normalizedQuery) {
          candidate = 1;
        } else if (normalizedValue.length >= 4 && (hasWholePhrase(normalizedValue, normalizedQuery) || hasWholePhrase(normalizedQuery, normalizedValue))) {
          const shorter = Math.min(normalizedValue.length, normalizedQuery.length);
          const longer = Math.max(normalizedValue.length, normalizedQuery.length);
          candidate = 0.82 + (0.16 * (shorter / longer));
        }
        if (candidate > score || (candidate === score && normalizedValue.length < sourceLength)) {
          score = candidate;
          sourceLength = normalizedValue.length;
        }
      });

      return { entry, score, sourceLength };
    })
    .sort((a, b) => b.score - a.score || a.sourceLength - b.sourceLength || a.entry.pl.length - b.entry.pl.length);

  return ranked[0]?.score >= 0.78 ? ranked[0].entry : null;
};

const findBestPolishEntry = (query) => {
  const normalizedQuery = normalizeForMatch(query, { loose: true });
  if (!normalizedQuery) return null;
  const entries = [...PHRASES, ...WORDS];

  const exact = entries.find((entry) => normalizeForMatch(entry.pl, { loose: true }) === normalizedQuery);
  if (exact) return exact;

  const ranked = entries
    .map((entry) => ({ entry, score: similarity(normalizedQuery, entry.pl) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 0.86 ? ranked[0].entry : null;
};

const directVocabularyReply = (message) => {
  const pronunciationQuery = extractWithPatterns(message, [
    /how\s+(?:do|can)\s+i\s+pronounce\s+(.+?)\s*[?.!]*$/i,
    /how\s+to\s+pronounce\s+(.+?)\s*[?.!]*$/i,
    /hoe\s+spreek\s+(?:ik|je)\s+(.+?)\s+uit\s*[?.!]*$/i,
    /uitspraak\s+van\s+(.+?)\s*[?.!]*$/i,
  ]);

  if (pronunciationQuery) {
    const entry = findBestPolishEntry(pronunciationQuery);
    if (entry) {
      return {
        mode: 'local',
        title: `Pronounce and repeat: ${entry.pl}`,
        en: 'Tap Listen, then repeat the whole Polish chunk aloud. Match the rhythm first; perfect individual sounds can come later.',
        nl: 'Tik op Listen en herhaal daarna het hele Poolse blok hardop. Neem eerst het ritme over; de losse klanken kunnen daarna nauwkeuriger worden.',
        examples: [[entry.pl, entry.nl, entry.en]],
        exercise: null,
      };
    }
  }

  const sourceQuery = extractWithPatterns(message, [
    /how\s+(?:do|can)\s+i\s+say\s+(.+?)\s+in\s+polish\s*[?.!]*$/i,
    /how\s+to\s+say\s+(.+?)\s+in\s+polish\s*[?.!]*$/i,
    /what\s+is\s+(.+?)\s+in\s+polish\s*[?.!]*$/i,
    /hoe\s+zeg\s+(?:ik|je)\s+(.+?)\s+in\s+het\s+pools\s*[?.!]*$/i,
    /vertaal\s+(.+?)\s+naar\s+het\s+pools\s*[?.!]*$/i,
  ]);

  if (sourceQuery) {
    const entry = findBestSourceEntry(sourceQuery);
    if (entry) {
      return {
        mode: 'local',
        title: `Say it in Polish: ${entry.pl}`,
        en: `Use “${entry.pl}”. Learn it as one useful speaking block rather than translating every word separately.`,
        nl: `Gebruik “${entry.pl}”. Leer het als één bruikbaar spreekblok in plaats van ieder woord apart te vertalen.`,
        examples: [[entry.pl, entry.nl, entry.en]],
        exercise: null,
      };
    }
  }

  const polishQuery = extractWithPatterns(message, [
    /what\s+does\s+(.+?)\s+mean\s*[?.!]*$/i,
    /what\s+is\s+the\s+meaning\s+of\s+(.+?)\s*[?.!]*$/i,
    /wat\s+betekent\s+(.+?)\s*[?.!]*$/i,
    /betekenis\s+van\s+(.+?)\s*[?.!]*$/i,
  ]);

  if (polishQuery) {
    const entry = findBestPolishEntry(polishQuery);
    if (entry) {
      return {
        mode: 'local',
        title: `${entry.pl} — meaning and use`,
        en: `It means “${entry.en}”. The Dutch equivalent is “${entry.nl}”.`,
        nl: `Het betekent “${entry.nl}”. De Engelse vertaling is “${entry.en}”.`,
        examples: [[entry.pl, entry.nl, entry.en]],
        exercise: null,
      };
    }
  }

  return null;
};

const exactPolishItemReply = (message) => {
  const normalized = normalizeForMatch(message, { loose: true });
  if (!normalized || normalized.split(' ').length > 8) return null;

  const entries = [...PHRASES, ...WORDS]
    .filter((entry) => normalizeForMatch(entry.pl, { loose: true }) === normalized)
    .sort((a, b) => b.pl.length - a.pl.length);
  const entry = entries[0];
  if (!entry) return null;

  return {
    mode: 'local',
    title: `${entry.pl} — useful meaning`,
    en: `This means “${entry.en}”.`,
    nl: `Dit betekent “${entry.nl}”.`,
    examples: [[entry.pl, entry.nl, entry.en]],
    exercise: null,
  };
};

const personalizeFallback = (message, state) => {
  const metrics = getMetrics(state);
  const weak = getWeakItems(state, 1)[0];
  const normalized = normalizeForMatch(message, { loose: true });

  if (/what should i learn|wat moet ik leren|next|volgende|study plan|leerplan/.test(normalized)) {
    return {
      title: 'Your highest-value next step',
      nl: weak
        ? `Herhaal eerst “${weak.item.pl}”, omdat dit patroon al ${weak.progress.lapses || 1} keer is weggezakt. Ga daarna naar een korte familiesimulatie; jouw huidige niveau is ${metrics.cefr}.`
        : 'Begin met herstelzinnen en de aankomst bij familie. Daarmee kun je een echt gesprek langer gaande houden dan met losse woorden.',
      en: weak
        ? `Review “${weak.item.pl}” first because it has already lapsed ${weak.progress.lapses || 1} time(s). Then do a short family simulation; your current estimate is ${metrics.cefr}.`
        : 'Start with conversation-repair phrases and arriving at the family home. They keep a real conversation alive better than isolated words.',
      examples: [
        ['Proszę mówić wolniej.', 'Spreek alstublieft langzamer.', 'Please speak more slowly.'],
        ['Możesz powtórzyć?', 'Kun je dat herhalen?', 'Can you repeat that?'],
      ],
      exercise: null,
    };
  }

  if (/motorsport|racing|formula|snowboard|festival|bonsai|hobby|hobbies/.test(normalized)) {
    return {
      title: 'Turn your hobbies into family small talk',
      nl: 'Leer geen lange woordenlijst. Gebruik één frame en verwissel alleen het onderwerp: Interesuję się… of Lubię…. Zo kun je meteen doorvragen en vergelijken.',
      en: 'Do not learn a long list. Use one frame and swap only the interest: Interesuję się… or Lubię…. That lets you compare interests immediately.',
      examples: [
        ['Interesuję się sportami motorowymi.', 'Ik ben geïnteresseerd in motorsport.', "I'm interested in motorsport."],
        ['Jeżdżę na snowboardzie.', 'Ik snowboard.', 'I snowboard.'],
        ['Zajmuję się bonsai.', 'Ik houd me bezig met bonsai.', 'I care for bonsai.'],
      ],
      exercise: { prompt: 'Complete with your own interest: Interesuję się …', answer: 'sportami motorowymi', options: ['sporty motorowe', 'sportami motorowymi', 'sportów motorowych'] },
    };
  }

  return null;
};

export const localTutorReply = (message, state) => {
  const issue = detectSentenceIssue(message);
  if (issue) return { ...issue, mode: 'local', exercise: null };

  const directVocabulary = directVocabularyReply(message);
  if (directVocabulary) return directVocabulary;

  const personalized = personalizeFallback(message, state);
  if (personalized) return { ...personalized, mode: 'local' };

  const topic = confidentTopicMatch(message);
  if (topic) return { ...topic, mode: 'local' };

  const concept = grammarFallback(message);
  if (concept) {
    return {
      mode: 'local',
      title: concept.title,
      nl: concept.nl,
      en: concept.en,
      examples: concept.examples.map((example) => [example.pl, example.nl, example.en]),
      exercise: null,
    };
  }

  const exactItem = exactPolishItemReply(message);
  if (exactItem) return exactItem;

  const pattern = PATTERNS[0];
  return {
    mode: 'local',
    title: 'I need one more detail',
    nl: 'De offline tutor geeft liever eerlijk aan dat hij te weinig context heeft dan een ongerelateerd antwoord te raden. Noem de Poolse zin, het woord of het onderwerp. Bijvoorbeeld: “Hoe tel ik tot tien?”, “Wat betekent dziękuję?” of “Waarom is het do Polski?”',
    en: 'The offline tutor would rather ask for context than guess an unrelated answer. Include the Polish sentence, word, or topic. For example: “How do I count to ten?”, “What does dziękuję mean?”, or “Why is it do Polski?”',
    examples: [[pattern.template.replace('{motion}', 'Jadę').replace('{destination}', 'Polski'), 'Ik ga naar Polen.', "I'm going to Poland."]],
    exercise: null,
  };
};

export const cloudTutorReply = async (message, state, signal) => {
  const endpoint = state.settings.aiProxyUrl?.trim();
  if (!endpoint) throw new Error('No AI proxy is configured.');

  const weakItems = getWeakItems(state, 5).map(({ item, progress }) => ({
    polish: item.pl,
    meaningNl: item.nl,
    meaningEn: item.en,
    lapses: progress.lapses,
    confidence: progress.confidence,
  }));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      learner: {
        nativeLanguage: 'Dutch',
        supportLanguage: 'English',
        primaryInterfaceLanguage: 'English',
        goal: 'real conversations with Polish family-in-law',
        interests: state.profile.interests,
        speakerGender: state.profile.speakerGender,
      },
      instructions: [
        'Answer the exact question before adding related teaching.',
        'If the question is ambiguous, ask one short clarification instead of guessing.',
        'Use English as the primary explanation and Dutch as secondary support.',
        'Never answer a different pronunciation or grammar topic merely because one letter overlaps.',
      ],
      weakItems,
      responseFormat: {
        title: 'string',
        en: 'Primary English explanation',
        nl: 'Secondary Dutch explanation',
        examples: [['Polish', 'Dutch', 'English']],
        exercise: { prompt: 'string', answer: 'string', options: ['string'] },
      },
    }),
    signal,
  });

  if (!response.ok) throw new Error(`AI proxy returned ${response.status}.`);
  const data = await response.json();
  const reply = data.reply || data;
  if (!reply || typeof reply !== 'object') throw new Error('The AI proxy returned an invalid response.');
  return { ...reply, mode: 'cloud' };
};
