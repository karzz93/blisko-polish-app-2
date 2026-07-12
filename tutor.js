import { TUTOR_TOPICS, GRAMMAR_CONCEPTS, PHRASES, PATTERNS } from './data.js';
import { normalizeText, similarity, getWeakItems, getMetrics } from './engine.js';

const tokenize = (text) => normalizeText(text, { loose: true })
  .split(' ')
  .filter((token) => token.length > 1);

const overlapScore = (message, topic) => {
  const normalized = normalizeText(message, { loose: true });
  const tokens = new Set(tokenize(message));
  let score = 0;
  topic.keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword, { loose: true });
    if (normalized.includes(normalizedKeyword)) score += normalizedKeyword.includes(' ') ? 5 : 2;
    normalizedKeyword.split(' ').forEach((token) => {
      if (tokens.has(token)) score += 0.6;
    });
  });
  return score;
};

const grammarFallback = (message) => {
  const normalized = normalizeText(message, { loose: true });
  return GRAMMAR_CONCEPTS
    .map((concept) => {
      const titleTokens = tokenize(concept.title);
      const score = titleTokens.reduce((total, token) => total + (normalized.includes(token) ? 1 : 0), 0);
      return { concept, score };
    })
    .sort((a, b) => b.score - a.score)[0];
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

const personalizeFallback = (message, state) => {
  const metrics = getMetrics(state);
  const weak = getWeakItems(state, 1)[0];
  const normalized = normalizeText(message, { loose: true });

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
      exercise: { prompt: 'Complete with your own interest: Interesuję się …', answer: 'sportami motorowymi', options: ['sporty motorowe','sportami motorowymi','sportów motorowych'] },
    };
  }

  return null;
};

export const localTutorReply = (message, state) => {
  const issue = detectSentenceIssue(message);
  if (issue) return { ...issue, mode: 'local', exercise: null };

  const personalized = personalizeFallback(message, state);
  if (personalized) return { ...personalized, mode: 'local' };

  const ranked = TUTOR_TOPICS
    .map((topic) => ({ topic, score: overlapScore(message, topic) }))
    .sort((a, b) => b.score - a.score);

  if (ranked[0]?.score >= 1.2) {
    return { ...ranked[0].topic, mode: 'local' };
  }

  const fallback = grammarFallback(message);
  if (fallback?.score > 0) {
    const concept = fallback.concept;
    return {
      mode: 'local',
      title: concept.title,
      nl: concept.nl,
      en: concept.en,
      examples: concept.examples.map((example) => [example.pl, example.nl, example.en]),
      exercise: null,
    };
  }

  const bestPhrase = PHRASES
    .map((phrase) => ({ phrase, score: similarity(message, `${phrase.pl} ${phrase.nl} ${phrase.en}`) }))
    .sort((a, b) => b.score - a.score)[0];

  if (bestPhrase?.score > 0.48) {
    return {
      mode: 'local',
      title: `A useful sentence: ${bestPhrase.phrase.pl}`,
      nl: bestPhrase.phrase.noteNl || `Leer dit als één spreekblok. De zin hoort bij het onderwerp “${bestPhrase.phrase.topic}” en is bewust gekozen voor echte gesprekken.`,
      en: bestPhrase.phrase.noteEn || `Learn this as one speaking chunk. It belongs to “${bestPhrase.phrase.topic}” and was selected for real conversation value.`,
      examples: [[bestPhrase.phrase.pl, bestPhrase.phrase.nl, bestPhrase.phrase.en]],
      exercise: null,
    };
  }

  const pattern = PATTERNS[0];
  return {
    mode: 'local',
    title: 'Let’s make the question concrete',
    nl: 'Ik kan lokaal grammatica, zinsbouw, uitspraak en veelvoorkomende fouten uitleggen. Zet de Poolse zin die je wilt begrijpen in je vraag, of vraag bijvoorbeeld: “Waarom is het do Polski?”',
    en: 'I can explain grammar, sentence structure, pronunciation, and common mistakes locally. Include the Polish sentence in your question, or ask something like “Why is it do Polski?”',
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
        goal: 'real conversations with Polish family-in-law',
        interests: state.profile.interests,
        speakerGender: state.profile.speakerGender,
      },
      weakItems,
      responseFormat: {
        title: 'string',
        nl: 'Dutch explanation',
        en: 'English explanation',
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
