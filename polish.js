import { WORDS } from './data.js?v=1.5';

const POLISH_LETTER_RE = /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/;
const WORD_TOKEN_RE = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż-]+$/;

export const splitPolishTokens = (text = '') => String(text)
  .match(/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?:-[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)?|\d+|[^\s]/g) || [];

export const isPolishWordToken = (token = '') => WORD_TOKEN_RE.test(token) && POLISH_LETTER_RE.test(token);

const normalizeToken = (value = '') => String(value)
  .toLowerCase()
  .replace(/^[^a-ząćęłńóśźż]+|[^a-ząćęłńóśźż-]+$/gi, '')
  .trim();

const stripPolishDiacritics = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ł/g, 'l')
  .replace(/Ł/g, 'L');

const wordMeaningMap = new Map(WORDS.map((word) => [normalizeToken(word.pl), word]));

const entry = (token, lemma, pos, form, meaningEn, meaningNl, whyEn, whyNl, related = [], extra = {}) => ({
  token,
  lemma,
  pos,
  form,
  meaningEn,
  meaningNl,
  whyEn,
  whyNl,
  related,
  source: 'curated',
  ...extra,
});

const CURATED_ENTRIES = [
  entry('jestem', 'być', 'verb', '1st person singular · present', 'I am', 'ik ben', 'The ending -em already identifies the speaker, so Polish normally omits ja.', 'De uitgang -em laat al zien dat de spreker “ik” is; ja wordt daarom meestal weggelaten.', ['być', 'jesteś', 'jest', 'jesteśmy']),
  entry('jesteś', 'być', 'verb', '2nd person singular · present', 'you are', 'jij bent', 'The -eś ending addresses one person informally.', 'De uitgang -eś spreekt één persoon informeel aan.', ['być', 'jestem', 'jest']),
  entry('jest', 'być', 'verb', '3rd person singular · present', 'is', 'is', 'This is the neutral “is” form for he, she, it, or a singular noun.', 'Dit is de neutrale vorm “is” bij hij, zij, het of een enkelvoudig zelfstandig naamwoord.', ['być', 'jestem', 'są']),
  entry('są', 'być', 'verb', '3rd person plural · present', 'are', 'zijn', 'The plural subject is carried by the form są.', 'De meervoudige vorm wordt uitgedrukt met są.', ['być', 'jest', 'jesteśmy']),
  entry('była', 'być', 'verb', 'past · feminine singular', 'was', 'was', 'The -ła ending agrees with a feminine subject such as podróż.', 'De uitgang -ła past bij een vrouwelijk onderwerp, zoals podróż.', ['był', 'było', 'byli', 'być']),
  entry('było', 'być', 'verb', 'past · neuter singular / impersonal', 'was / it was', 'was / het was', 'The neuter -ło form is common in impersonal comments such as “it was beautiful”.', 'De onzijdige vorm -ło komt vaak voor in onpersoonlijke opmerkingen zoals “het was mooi”.', ['był', 'była', 'być']),
  entry('mam', 'mieć', 'verb', '1st person singular · present', 'I have', 'ik heb', 'The -m ending identifies “I”; no separate ja is needed.', 'De uitgang -m betekent al “ik”; een apart ja is niet nodig.', ['mieć', 'masz', 'ma', 'mamy']),
  entry('masz', 'mieć', 'verb', '2nd person singular · present', 'you have', 'jij hebt', 'This is the informal singular form used with ty.', 'Dit is de informele enkelvoudsvorm bij ty.', ['mieć', 'mam', 'ma']),
  entry('mamy', 'mieć', 'verb', '1st person plural · present', 'we have', 'wij hebben', 'The ending -my marks “we”.', 'De uitgang -my markeert “wij”.', ['mieć', 'mam', 'macie']),
  entry('mówię', 'mówić', 'verb', '1st person singular · present', 'I speak / say', 'ik spreek / zeg', 'The verb ending carries the speaker; the phrase often stands without ja.', 'De werkwoordsuitgang draagt de spreker; de zin staat vaak zonder ja.', ['mówić', 'mówisz', 'mówi', 'mówimy']),
  entry('mówić', 'mówić', 'verb', 'infinitive', 'to speak', 'spreken', 'After proszę or a modal expression, Polish commonly uses the infinitive.', 'Na proszę of een modale uitdrukking gebruikt Pools vaak de infinitief.', ['mówię', 'mówisz', 'powiedzieć']),
  entry('rozumiem', 'rozumieć', 'verb', '1st person singular · present', 'I understand', 'ik begrijp', 'The -em form means “I understand”; with nie it becomes a complete rescue phrase.', 'De vorm op -em betekent “ik begrijp”; met nie vormt dit een complete reddingszin.', ['rozumieć', 'rozumiesz', 'zrozumieć']),
  entry('lubię', 'lubić', 'verb', '1st person singular · present', 'I like', 'ik vind leuk / lekker', 'The thing liked normally follows in the accusative, which may change its ending.', 'Wat je leuk of lekker vindt staat meestal in de accusatief en kan daardoor van uitgang veranderen.', ['lubić', 'lubisz', 'polubić']),
  entry('chcę', 'chcieć', 'verb', '1st person singular · present', 'I want', 'ik wil', 'The desired thing or action follows this form; objects often use the accusative.', 'Het gewenste ding of de actie volgt hierna; objecten staan vaak in de accusatief.', ['chcieć', 'chcesz', 'chciałbym', 'chciałabym']),
  entry('chcesz', 'chcieć', 'verb', '2nd person singular · present', 'do you want', 'wil je', 'This asks one person informally what they want.', 'Hiermee vraag je één persoon informeel wat die wil.', ['chcieć', 'chcę', 'chcecie']),
  entry('chciałbym', 'chcieć', 'conditional verb', 'conditional · masculine speaker', 'I would like', 'ik zou graag willen', 'A male speaker uses -łbym to soften a request.', 'Een mannelijke spreker gebruikt -łbym om een verzoek zachter te maken.', ['chciałabym', 'chcę', 'chcieć']),
  entry('chciałabym', 'chcieć', 'conditional verb', 'conditional · feminine speaker', 'I would like', 'ik zou graag willen', 'A female speaker uses -łabym to soften a request.', 'Een vrouwelijke spreker gebruikt -łabym om een verzoek zachter te maken.', ['chciałbym', 'chcę', 'chcieć']),
  entry('mogę', 'móc', 'modal verb', '1st person singular · present', 'I can / may', 'ik kan / mag', 'A following action remains in the infinitive: mogę pomóc.', 'De volgende handeling blijft in de infinitief: mogę pomóc.', ['móc', 'możesz', 'może', 'można']),
  entry('możesz', 'móc', 'modal verb', '2nd person singular · present', 'you can', 'jij kunt', 'The next verb stays in the infinitive, as in możesz powtórzyć.', 'Het volgende werkwoord blijft in de infinitief, zoals in możesz powtórzyć.', ['móc', 'mogę', 'może']),
  entry('można', 'móc', 'impersonal modal', 'impersonal present', 'one can / is it possible', 'kan men / is het mogelijk', 'Można avoids naming I or you and therefore sounds useful and polite in public situations.', 'Można noemt geen ik of jij en klinkt daardoor handig en beleefd in openbare situaties.', ['móc', 'mogę', 'możesz']),
  entry('idę', 'iść', 'motion verb', '1st person singular · present', 'I am going on foot', 'ik ga te voet', 'Use iść for movement on foot. A destination after do takes the genitive.', 'Gebruik iść voor verplaatsing te voet. Een bestemming na do staat in de genitief.', ['iść', 'idziesz', 'idziemy', 'pójść']),
  entry('jadę', 'jechać', 'motion verb', '1st person singular · present', 'I am going by transport', 'ik ga met vervoer', 'Use jechać when a vehicle or transport is involved.', 'Gebruik jechać wanneer er een voertuig of vervoermiddel bij betrokken is.', ['jechać', 'jedziesz', 'jedziemy', 'pojechać']),
  entry('jedziemy', 'jechać', 'motion verb', '1st person plural · present', 'we are going by transport', 'wij gaan met vervoer', 'The -emy form marks “we”; a destination may follow with do + genitive or na + accusative.', 'De uitgang -emy markeert “wij”; een bestemming kan volgen met do + genitief of na + accusatief.', ['jechać', 'jadę', 'jedziesz']),
  entry('mieszkam', 'mieszkać', 'verb', '1st person singular · present', 'I live', 'ik woon', 'A static location commonly follows with w + locative.', 'Een vaste locatie volgt vaak met w + locatief.', ['mieszkać', 'mieszkasz', 'mieszkamy']),
  entry('pracuję', 'pracować', 'verb', '1st person singular · present', 'I work', 'ik werk', 'The -uję ending identifies the speaker. Locations after w often use the locative.', 'De uitgang -uję identificeert de spreker. Locaties na w staan vaak in de locatief.', ['pracować', 'pracujesz', 'praca']),
  entry('interesuję', 'interesować się', 'reflexive verb', '1st person singular · present', 'I am interested', 'ik ben geïnteresseerd', 'Learn the whole frame interesować się + instrumental.', 'Leer het hele patroon interesować się + instrumentalis.', ['interesować się', 'interesujesz się']),
  entry('zajmuję', 'zajmować się', 'reflexive verb', '1st person singular · present', 'I deal with / pursue', 'ik houd me bezig met', 'With się, the topic normally appears in the instrumental.', 'Met się staat het onderwerp doorgaans in de instrumentalis.', ['zajmować się', 'zajmujesz się']),
  entry('potrzebuję', 'potrzebować', 'verb', '1st person singular · present', 'I need', 'ik heb nodig', 'Potrzebować typically governs the genitive, unlike Dutch or English “need”.', 'Potrzebować regeert doorgaans de genitief, anders dan Nederlands of Engels “nodig hebben”.', ['potrzebować', 'potrzebujesz']),
  entry('proszę', 'prosić', 'polite expression / verb', '1st person singular or fixed polite form', 'please / I ask', 'alstublieft / ik vraag', 'As a polite marker it can introduce an infinitive or a requested item.', 'Als beleefdheidsmarkeerder kan het een infinitief of gewenst voorwerp inleiden.', ['prosić', 'poproszę', 'proszę bardzo']),
  entry('poproszę', 'prosić', 'polite future / request', 'perfective polite request', 'I will have / please give me', 'graag / ik neem', 'This fixed restaurant and shop form sounds natural for ordering.', 'Deze vaste vorm klinkt natuurlijk bij bestellen in een restaurant of winkel.', ['proszę', 'prosić']),
  entry('dziękuję', 'dziękować', 'verb / expression', '1st person singular · present', 'thank you', 'dank je / dank u', 'Polish uses a verb form where English and Dutch use a fixed social phrase.', 'Pools gebruikt een werkwoordsvorm waar Engels en Nederlands een vaste sociale uitdrukking gebruiken.', ['dziękować', 'dzięki']),
  entry('przepraszam', 'przepraszać', 'verb / expression', '1st person singular · present', 'sorry / excuse me', 'sorry / pardon', 'This is both an apology and an attention-getting expression.', 'Dit is zowel een verontschuldiging als een manier om iemands aandacht te trekken.', ['przepraszać', 'przeprosić']),
  entry('powtórzyć', 'powtórzyć', 'perfective verb', 'infinitive · completed action', 'to repeat once', 'één keer herhalen', 'The perfective infinitive asks for one complete repetition.', 'De perfectieve infinitief vraagt om één volledige herhaling.', ['powtarzać', 'powtórz']),
  entry('pomóc', 'pomóc', 'perfective verb', 'infinitive · completed help', 'to help', 'helpen', 'After mogę, the infinitive stays unchanged.', 'Na mogę blijft de infinitief onveranderd.', ['pomagać', 'pomogę']),
  entry('jechać', 'jechać', 'motion verb', 'infinitive · by transport', 'to go / drive', 'gaan / rijden met vervoer', 'After proszę or a modal, the infinitive expresses the requested movement.', 'Na proszę of een modaal werkwoord drukt de infinitief de gevraagde verplaatsing uit.', ['jadę', 'jedziemy', 'pojechać']),
  entry('skręcić', 'skręcić', 'perfective verb', 'infinitive · one completed turn', 'to turn', 'afslaan', 'The perfective form presents the turn as one complete action.', 'De perfectieve vorm stelt de bocht voor als één afgeronde handeling.', ['skręcać', 'skręć']),
  entry('boli', 'boleć', 'verb', '3rd person singular · present', 'hurts', 'doet pijn', 'The body part is grammatically the thing that hurts; mnie means “me”.', 'Het lichaamsdeel is grammaticaal datgene wat pijn doet; mnie betekent “mij”.', ['boleć', 'bolą', 'mnie']),
  entry('czuję', 'czuć', 'verb', '1st person singular · present', 'I feel', 'ik voel', 'With się this becomes the reflexive frame “I feel”.', 'Met się vormt dit het wederkerige patroon “ik voel me”.', ['czuć', 'czujesz', 'czuć się']),
  entry('cieszę', 'cieszyć się', 'reflexive verb', '1st person singular · present', 'I am happy / glad', 'ik ben blij', 'The reflexive particle się belongs to the verb frame.', 'Het wederkerige deeltje się hoort bij het werkwoordspatroon.', ['cieszyć się', 'cieszysz się']),
  entry('się', 'się', 'reflexive particle', 'unstressed reflexive marker', 'oneself / reflexive marker', 'zich / wederkerig deeltje', 'This short particle is part of many Polish verb frames and normally does not carry sentence stress.', 'Dit korte deeltje hoort bij veel Poolse werkwoordspatronen en krijgt normaal geen zinsaccent.', ['uczyć się', 'czuć się', 'interesować się']),
  entry('nie', 'nie', 'negation particle', 'negation', 'not / do not', 'niet / geen', 'Polish normally places nie directly before the verb or word it negates.', 'Pools plaatst nie doorgaans direct voor het werkwoord of woord dat ontkend wordt.', ['tak', 'nigdy']),
  entry('czy', 'czy', 'question particle / conjunction', 'yes-no question marker or “or”', 'whether / question marker / or', 'of / vraagpartikel', 'At the start it turns a statement into a yes-no question without English-style inversion.', 'Aan het begin maakt czy een ja-neevraag zonder Engelse inversie.', ['co', 'jak', 'gdzie']),
  entry('jak', 'jak', 'question word / conjunction', 'how / like / as', 'how / as', 'hoe / zoals', 'Its exact meaning comes from the sentence: a question, comparison, or clause link.', 'De precieze betekenis komt uit de zin: vraag, vergelijking of verbindingswoord.', ['jaki', 'jaka', 'jakie']),
  entry('gdzie', 'gdzie', 'question word', 'location question', 'where', 'waar', 'Polish needs no do/does auxiliary: gdzie + verb is already complete.', 'Pools heeft geen do/does-hulpwerkwoord nodig: gdzie + werkwoord is al compleet.', ['dokąd', 'skąd']),
  entry('ile', 'ile', 'question word', 'quantity question', 'how much / how many', 'hoeveel', 'The following noun may take a special case form depending on the number.', 'Het volgende zelfstandig naamwoord kan afhankelijk van het getal een andere naamvalsvorm krijgen.', ['dużo', 'mało']),
  entry('co', 'co', 'pronoun / question word', 'what', 'what', 'wat', 'The surrounding verb determines whether a following noun changes case.', 'Het omliggende werkwoord bepaalt of een volgend zelfstandig naamwoord van naamval verandert.', ['czym', 'czego']),
  entry('do', 'do', 'preposition', 'governs genitive', 'to / into / until', 'naar / tot', 'A destination after do takes the genitive: Polska → Polski, sklep → sklepu.', 'Een bestemming na do staat in de genitief: Polska → Polski, sklep → sklepu.', ['Polski', 'sklepu', 'domu']),
  entry('w', 'w', 'preposition', 'locative for static place; accusative for some movement', 'in / at', 'in / op', 'For a static location, w normally triggers the locative: Polska → Polsce.', 'Bij een vaste locatie veroorzaakt w meestal de locatief: Polska → Polsce.', ['we', 'Polsce', 'Holandii']),
  entry('na', 'na', 'preposition', 'locative or accusative depending on meaning', 'on / at / to', 'op / naar', 'Static location often uses locative; movement toward an event or surface often uses accusative.', 'Een vaste locatie gebruikt vaak de locatief; beweging naar een evenement of oppervlak vaak de accusatief.', ['snowboardzie', 'wakacje']),
  entry('z', 'z', 'preposition', 'instrumental “with” or genitive “from”', 'with / from', 'met / uit', 'The meaning decides the case: z rodziną = with family; z Holandii = from the Netherlands.', 'De betekenis bepaalt de naamval: z rodziną = met familie; z Holandii = uit Nederland.', ['ze', 'rodziną', 'Holandii']),
  entry('dla', 'dla', 'preposition', 'governs genitive', 'for', 'voor', 'The person or group after dla takes the genitive.', 'De persoon of groep na dla staat in de genitief.', ['osób', 'mnie', 'ciebie']),
  entry('o', 'o', 'preposition', 'often governs locative', 'about / for', 'over / om', 'In prosić o, the requested thing appears after o, usually in the accusative.', 'In prosić o staat het gevraagde na o, meestal in de accusatief.', ['rachunek']),
  entry('po', 'po', 'preposition / adverbial element', 'often governs locative', 'after / around / in a language', 'na / rond / in een taal', 'In po polsku, the fixed adverbial form means “in Polish”.', 'In po polsku betekent de vaste bijwoordelijke vorm “in het Pools”.', ['polsku']),
  entry('za', 'za', 'preposition', 'case depends on meaning', 'for / behind / in', 'voor / achter / over', 'In dziękuję za, the thing thanked for uses the accusative.', 'In dziękuję za staat datgene waarvoor je dankt in de accusatief.', ['prezent', 'zaproszenie']),
  entry('Polski', 'Polska', 'proper noun', 'genitive singular', 'Poland', 'Polen', 'The preposition do requires the genitive: do Polski.', 'Het voorzetsel do vereist de genitief: do Polski.', ['Polska', 'Polsce', 'polski']),
  entry('Polsce', 'Polska', 'proper noun', 'locative singular', 'in Poland', 'in Polen', 'A static place after w uses the locative: w Polsce.', 'Een vaste plaats na w gebruikt de locatief: w Polsce.', ['Polska', 'Polski']),
  entry('Holandii', 'Holandia', 'proper noun', 'genitive or locative singular', 'the Netherlands', 'Nederland', 'The same form works after z “from” and w “in”; context identifies the case.', 'Dezelfde vorm werkt na z “uit” en w “in”; de context bepaalt de naamval.', ['Holandia']),
  entry('pracy', 'praca', 'noun', 'genitive singular', 'work', 'werk', 'After do, praca changes to pracy: do pracy.', 'Na do verandert praca in pracy: do pracy.', ['praca', 'pracę']),
  entry('sklepu', 'sklep', 'noun', 'genitive singular', 'shop', 'winkel', 'A destination after do takes the genitive: do sklepu.', 'Een bestemming na do staat in de genitief: do sklepu.', ['sklep', 'sklepie']),
  entry('sklepie', 'sklep', 'noun', 'locative singular', 'in the shop', 'in de winkel', 'A static location after w uses the locative: w sklepie.', 'Een vaste locatie na w gebruikt de locatief: w sklepie.', ['sklep', 'sklepu']),
  entry('babci', 'babcia', 'noun', 'genitive or dative singular', 'grandma / grandma’s', 'oma / van oma', 'After do it marks the destination “to grandma’s”.', 'Na do markeert het de bestemming “naar oma”.', ['babcia', 'babcią']),
  entry('babcią', 'babcia', 'noun', 'instrumental singular', 'with grandma', 'met oma', 'The preposition z meaning “with” requires the instrumental.', 'Het voorzetsel z in de betekenis “met” vereist de instrumentalis.', ['babcia', 'babci']),
  entry('domu', 'dom', 'noun', 'genitive or locative singular', 'home / house', 'thuis / huis', 'In do domu it is genitive; in w domu it is locative. The form happens to be the same.', 'In do domu is het genitief; in w domu locatief. De vorm is toevallig hetzelfde.', ['dom', 'domem']),
  entry('kawę', 'kawa', 'noun', 'accusative singular', 'coffee', 'koffie', 'A feminine noun ending in -a commonly changes to -ę as a direct object.', 'Een vrouwelijk woord op -a verandert als lijdend voorwerp vaak in -ę.', ['kawa', 'kawy', 'kawą']),
  entry('wodę', 'woda', 'noun', 'accusative singular', 'water', 'water', 'The direct object form changes -a to -ę.', 'De lijdend-voorwerpsvorm verandert -a in -ę.', ['woda', 'wody', 'wodą']),
  entry('herbaty', 'herbata', 'noun', 'genitive singular', 'tea', 'thee', 'After chcieć in this offer, the genitive is natural for an unspecified amount.', 'Na chcieć is in dit aanbod de genitief natuurlijk bij een onbepaalde hoeveelheid.', ['herbata', 'herbatę']),
  entry('kawy', 'kawa', 'noun', 'genitive singular', 'coffee', 'koffie', 'Here the genitive presents coffee as an unspecified amount in an offer.', 'Hier geeft de genitief koffie als een onbepaalde hoeveelheid in een aanbod weer.', ['kawa', 'kawę']),
  entry('rodziną', 'rodzina', 'noun', 'instrumental singular', 'with family', 'met familie', 'After z meaning “with”, the noun takes the instrumental ending -ą.', 'Na z in de betekenis “met” krijgt het zelfstandig naamwoord de instrumentalisuitgang -ą.', ['rodzina', 'rodziny']),
  entry('sportami', 'sport', 'noun', 'instrumental plural', 'sports', 'sporten', 'Interesować się requires the instrumental; plural sport becomes sportami.', 'Interesować się vereist de instrumentalis; meervoud sport wordt sportami.', ['sport', 'sporty', 'sportem']),
  entry('motorowymi', 'motorowy', 'adjective', 'instrumental plural', 'motor / motorsport', 'motor- / motorsport', 'The adjective agrees with sportami in case and number.', 'Het bijvoeglijk naamwoord past zich aan sportami aan in naamval en getal.', ['motorowy', 'motorowe', 'motorowych']),
  entry('muzyką', 'muzyka', 'noun', 'instrumental singular', 'music', 'muziek', 'The verb interesować się requires the instrumental ending -ą.', 'Het werkwoord interesować się vereist de instrumentalisuitgang -ą.', ['muzyka', 'muzyki']),
  entry('kulturą', 'kultura', 'noun', 'instrumental singular', 'culture', 'cultuur', 'After interesować się, the noun uses the instrumental.', 'Na interesować się staat het zelfstandig naamwoord in de instrumentalis.', ['kultura', 'kultury']),
  entry('polską', 'polski', 'adjective', 'instrumental feminine singular', 'Polish', 'Pools', 'The adjective agrees with the feminine instrumental noun kulturą.', 'Het bijvoeglijk naamwoord past bij het vrouwelijke instrumentaliswoord kulturą.', ['polski', 'polska', 'polskie']),
  entry('snowboardzie', 'snowboard', 'noun', 'locative singular', 'on a snowboard / snowboarding', 'op een snowboard / snowboarden', 'The activity frame jeździć na takes the locative here.', 'Het activiteitspatroon jeździć na gebruikt hier de locatief.', ['snowboard', 'snowboardu']),
  entry('wakacje', 'wakacje', 'plural noun', 'accusative plural in na wakacje', 'holiday', 'vakantie', 'Movement to a holiday uses the fixed frame na wakacje.', 'Beweging naar vakantie gebruikt het vaste patroon na wakacje.', ['wakacjach']),
  entry('osób', 'osoba', 'noun', 'genitive plural', 'people / persons', 'personen', 'After numbers such as dwóch, Polish commonly uses the genitive plural.', 'Na getallen zoals dwóch gebruikt Pools doorgaans de genitief meervoud.', ['osoba', 'osoby', 'osobami']),
  entry('dwóch', 'dwa', 'numeral', 'genitive / masculine-personal form', 'two', 'twee', 'In dla dwóch osób, both the numeral and noun fit the genitive phrase governed by dla.', 'In dla dwóch osób passen zowel het telwoord als zelfstandig naamwoord in de genitiefgroep na dla.', ['dwa', 'dwie']),
  entry('głowa', 'głowa', 'noun', 'nominative singular', 'head', 'hoofd', 'In boli mnie głowa, the body part is the grammatical subject and stays nominative.', 'In boli mnie głowa is het lichaamsdeel grammaticaal het onderwerp en blijft het nominatief.', ['głowy', 'głową']),
  entry('gardło', 'gardło', 'noun', 'nominative singular', 'throat', 'keel', 'In boli mnie gardło, the body part is the subject of boli.', 'In boli mnie gardło is het lichaamsdeel het onderwerp van boli.', ['gardła', 'gardłem']),
  entry('mnie', 'ja', 'pronoun', 'accusative / genitive form', 'me', 'mij', 'In the pain pattern it marks the person affected: boli mnie.', 'In het pijnpatroon markeert het de getroffen persoon: boli mnie.', ['ja', 'mi', 'mną']),
  entry('wszystkiego', 'wszystko', 'pronoun', 'genitive singular after negation', 'everything', 'alles', 'Polish negation often changes an accusative object into the genitive.', 'Poolse ontkenning verandert een accusatief object vaak in de genitief.', ['wszystko', 'wszystkim']),
  entry('tego', 'ten', 'demonstrative pronoun', 'genitive singular', 'this / that', 'dit / dat', 'With nie znać, the object commonly appears in the genitive.', 'Bij nie znać staat het object doorgaans in de genitief.', ['ten', 'to', 'tym']),
  entry('słowa', 'słowo', 'noun', 'genitive singular', 'word', 'woord', 'Negated znać commonly governs the genitive: nie znam słowa.', 'Ontkend znać regeert doorgaans de genitief: nie znam słowa.', ['słowo', 'słowem']),
  entry('polsku', 'polski', 'adverbial form', 'fixed form after po', 'in Polish', 'in het Pools', 'Po polsku is a fixed adverbial expression, not a normal adjective-noun pair.', 'Po polsku is een vaste bijwoordelijke uitdrukking, geen gewone bijvoeglijk-naamwoordgroep.', ['polski', 'Polska']),
  entry('wolniej', 'wolno', 'adverb', 'comparative', 'more slowly', 'langzamer', 'The -ej comparative changes “slowly” into “more slowly”.', 'De vergrotende trap op -ej verandert “langzaam” in “langzamer”.', ['wolno', 'najwolniej']),
  entry('najbliższy', 'bliski', 'adjective', 'superlative · masculine nominative singular', 'nearest', 'dichtstbijzijnde', 'It agrees with masculine singular sklep and carries the superlative prefix naj-.', 'Het past bij mannelijk enkelvoud sklep en draagt het superlatiefvoorvoegsel naj-.', ['bliski', 'bliższy', 'najbliższa']),
  entry('polskie', 'polski', 'adjective', 'non-masculine-personal plural accusative/nominative', 'Polish', 'Poolse', 'The ending agrees with a plural noun such as tradycje or jedzenie in its sentence role.', 'De uitgang past bij een meervoudig zelfstandig naamwoord zoals tradycje of bij de zinsrol.', ['polski', 'polska', 'polskiego']),
  entry('pyszne', 'pyszny', 'adjective', 'neuter nominative singular', 'delicious', 'heerlijk', 'It agrees with neuter to in the pattern to jest pyszne.', 'Het past bij het onzijdige to in het patroon to jest pyszne.', ['pyszny', 'pyszna']),
  entry('długa', 'długi', 'adjective', 'feminine nominative singular', 'long', 'lang', 'It agrees with the feminine noun podróż.', 'Het past bij het vrouwelijke zelfstandig naamwoord podróż.', ['długi', 'długie']),
  entry('spokojna', 'spokojny', 'adjective', 'feminine nominative singular', 'calm', 'rustig', 'It agrees with the feminine noun podróż.', 'Het past bij het vrouwelijke zelfstandig naamwoord podróż.', ['spokojny', 'spokojne']),
  entry('źle', 'zły', 'adverb', 'adverbial form', 'badly / unwell', 'slecht / niet goed', 'The adverb describes how the speaker feels, not a noun.', 'Het bijwoord beschrijft hoe de spreker zich voelt, niet een zelfstandig naamwoord.', ['zły', 'zła', 'dobrze']),
  entry('dobrze', 'dobry', 'adverb', 'adverbial form', 'well', 'goed', 'The adverb describes an action or state; it does not agree with a noun.', 'Het bijwoord beschrijft een handeling of toestand en past zich niet aan een zelfstandig naamwoord aan.', ['dobry', 'dobra', 'źle']),
  entry('jeszcze', 'jeszcze', 'adverb', 'time / addition adverb', 'yet / still / more', 'nog / nog steeds', 'Its translation depends on position: “yet”, “still”, or “more”.', 'De vertaling hangt van de positie af: “nog”, “nog steeds” of “meer”.', ['już']),
  entry('już', 'już', 'adverb', 'time adverb', 'already / now / enough', 'al / nu / genoeg', 'Context decides whether it means already, now, or “that is enough”.', 'De context bepaalt of het “al”, “nu” of “dat is genoeg” betekent.', ['jeszcze']),
  entry('bardzo', 'bardzo', 'adverb', 'degree adverb', 'very / very much', 'heel / erg', 'It strengthens an adjective, adverb, or verb without changing form.', 'Het versterkt een bijvoeglijk naamwoord, bijwoord of werkwoord zonder van vorm te veranderen.', []),
  entry('trochę', 'trochę', 'quantity adverb / pronoun', 'indeclinable quantity', 'a little / some', 'een beetje / wat', 'It often combines with a genitive quantity, though short fixed requests may omit the noun.', 'Het combineert vaak met een genitiefhoeveelheid, al laten korte vaste verzoeken het zelfstandig naamwoord soms weg.', []),
];

const CURATED_MAP = new Map(CURATED_ENTRIES.map((item) => [normalizeToken(item.token), item]));

const functionWordFallbacks = new Map([
  ['a', ['conjunction', 'and / while', 'en / terwijl']],
  ['ale', ['conjunction', 'but', 'maar']],
  ['i', ['conjunction', 'and', 'en']],
  ['lub', ['conjunction', 'or', 'of']],
  ['oraz', ['conjunction', 'and / as well as', 'en / evenals']],
  ['że', ['conjunction', 'that', 'dat']],
  ['tu', ['adverb', 'here', 'hier']],
  ['tutaj', ['adverb', 'here', 'hier']],
  ['tam', ['adverb', 'there', 'daar']],
  ['dzisiaj', ['adverb', 'today', 'vandaag']],
  ['dziś', ['adverb', 'today', 'vandaag']],
  ['jutro', ['adverb', 'tomorrow', 'morgen']],
  ['wczoraj', ['adverb', 'yesterday', 'gisteren']],
  ['teraz', ['adverb', 'now', 'nu']],
  ['raz', ['noun/adverb', 'time / once', 'keer / eens']],
  ['tak', ['particle', 'yes / so', 'ja / zo']],
  ['to', ['pronoun / particle', 'this / it / that is', 'dit / het / dat is']],
  ['pan', ['formal pronoun/noun', 'sir / formal you', 'meneer / formeel u']],
  ['pani', ['formal pronoun/noun', 'madam / formal you', 'mevrouw / formeel u']],
]);

const inferVerbForm = (word) => {
  if (/ć$/.test(word)) return { form: 'infinitive', whyEn: 'The ending -ć is the normal infinitive marker.', whyNl: 'De uitgang -ć is de gewone infinitiefmarkeerder.' };
  if (/(uję|aję|am|em|ę)$/.test(word)) return { form: 'likely 1st person singular · present', whyEn: 'This ending commonly identifies the speaker as “I”.', whyNl: 'Deze uitgang markeert vaak de spreker als “ik”.' };
  if (/(ujesz|asz|esz|isz|ysz)$/.test(word)) return { form: 'likely 2nd person singular · present', whyEn: 'This ending commonly addresses one person informally.', whyNl: 'Deze uitgang spreekt vaak één persoon informeel aan.' };
  if (/(ujemy|amy|emy|imy|ymy)$/.test(word)) return { form: 'likely 1st person plural · present', whyEn: 'The ending commonly marks “we”.', whyNl: 'De uitgang markeert vaak “wij”.' };
  if (/(ują|ają|ą)$/.test(word)) return { form: 'likely 3rd person plural · present', whyEn: 'This ending commonly marks a plural subject.', whyNl: 'Deze uitgang markeert vaak een meervoudig onderwerp.' };
  return null;
};

const inferNominalForm = (word, previous = '') => {
  if (previous === 'do' || previous === 'dla' || previous === 'bez' || previous === 'od' || previous === 'u') {
    return { form: 'likely genitive after a governing preposition', whyEn: `The preposition ${previous} normally requires the genitive.`, whyNl: `Het voorzetsel ${previous} vereist doorgaans de genitief.` };
  }
  if (['w', 'we', 'na', 'o', 'po', 'przy'].includes(previous)) {
    return { form: 'likely locative in a static-place frame', whyEn: `In a static context, ${previous} commonly requires the locative.`, whyNl: `In een statische context vereist ${previous} vaak de locatief.` };
  }
  if (previous === 'z' || previous === 'ze') {
    return { form: 'instrumental “with” or genitive “from”', whyEn: 'The meaning of z decides whether this is instrumental (“with”) or genitive (“from”).', whyNl: 'De betekenis van z bepaalt of dit instrumentalis (“met”) of genitief (“uit”) is.' };
  }
  if (/ą$/.test(word)) return { form: 'likely instrumental feminine singular or accusative adjective form', whyEn: 'The ending -ą often marks feminine instrumental agreement.', whyNl: 'De uitgang -ą markeert vaak vrouwelijke instrumentalisovereenkomst.' };
  if (/ami$/.test(word)) return { form: 'likely instrumental plural', whyEn: 'The ending -ami is a strong instrumental-plural signal.', whyNl: 'De uitgang -ami is een duidelijk signaal voor instrumentalis meervoud.' };
  if (/ach$/.test(word)) return { form: 'likely locative plural', whyEn: 'The ending -ach commonly marks the locative plural.', whyNl: 'De uitgang -ach markeert vaak de locatief meervoud.' };
  if (/ów$/.test(word)) return { form: 'likely genitive plural', whyEn: 'The ending -ów commonly marks the genitive plural.', whyNl: 'De uitgang -ów markeert vaak de genitief meervoud.' };
  return null;
};

const approximatePronunciation = (value = '') => {
  let result = normalizeToken(value);
  const replacements = [
    [/dź/g, 'dzh-y'], [/dzi(?=[aeouąę])/g, 'dzh-y'], [/dż/g, 'j'],
    [/szcz/g, 'shch'], [/cz/g, 'ch'], [/sz/g, 'sh'], [/rz/g, 'zh'], [/ż/g, 'zh'],
    [/ś/g, 'sh-y'], [/si(?=[aeouąę])/g, 'sh-y'], [/ć/g, 'ch-y'], [/ci(?=[aeouąę])/g, 'ch-y'],
    [/ź/g, 'zh-y'], [/zi(?=[aeouąę])/g, 'zh-y'], [/ń/g, 'ny'], [/ni(?=[aeouąę])/g, 'ny'],
    [/ch/g, 'kh'], [/h/g, 'kh'], [/ł/g, 'w'], [/w/g, 'v'], [/j/g, 'y'],
    [/c/g, 'ts'], [/ą/g, 'on'], [/ę/g, 'en'], [/ó/g, 'oo'], [/u/g, 'oo'],
    [/y/g, 'ih'], [/r/g, 'r'],
  ];
  replacements.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
  return result;
};

const detectSoundNotes = (word = '') => {
  const lower = normalizeToken(word);
  const notes = [];
  if (lower.includes('ł')) notes.push({ en: 'ł is w-like, not an l sound.', nl: 'ł klinkt ongeveer als een Engelse w, niet als l.' });
  if (/sz/.test(lower)) notes.push({ en: 'sz is a firm “sh” sound.', nl: 'sz is een stevige “sj”-klank.' });
  if (/cz/.test(lower)) notes.push({ en: 'cz is a firm “ch” sound.', nl: 'cz is een stevige “tsj”-klank.' });
  if (/rz|ż/.test(lower)) notes.push({ en: 'rz/ż is a voiced “zh” sound.', nl: 'rz/ż is een stemhebbende “zj”-klank.' });
  if (/ś|si[aeouąę]/.test(lower)) notes.push({ en: 'ś/si is a softer, more palatal “sh”.', nl: 'ś/si is een zachtere, meer palatale “sj”.' });
  if (/ć|ci[aeouąę]/.test(lower)) notes.push({ en: 'ć/ci is a softer “ch” sound.', nl: 'ć/ci is een zachtere “tsj”-klank.' });
  if (/ą|ę/.test(lower)) notes.push({ en: 'The nasal vowel changes slightly before different consonants.', nl: 'De nasale klinker verandert iets vóór verschillende medeklinkers.' });
  if (lower.includes('y')) notes.push({ en: 'Polish y is a short central vowel, not English “ee”.', nl: 'Poolse y is een korte centrale klinker, niet “ie”.' });
  return notes;
};

export const getPronunciationGuide = (word = '') => ({
  approximate: approximatePronunciation(word),
  label: 'approximate listening anchor',
  notes: detectSoundNotes(word),
  cautionEn: 'Use this only as a first listening anchor; the Polish audio model is more reliable than spelling through English or Dutch.',
  cautionNl: 'Gebruik dit alleen als eerste luisterhouvast; het Poolse audiomodel is betrouwbaarder dan spelling via Engels of Nederlands.',
});

const defaultMeaning = (normalized) => {
  const base = wordMeaningMap.get(normalized);
  if (base) return { en: base.en, nl: base.nl, lemma: base.pl, pos: base.type };
  const functionFallback = functionWordFallbacks.get(normalized);
  if (functionFallback) return { pos: functionFallback[0], en: functionFallback[1], nl: functionFallback[2], lemma: normalized };
  return { en: 'meaning depends on context', nl: 'betekenis hangt af van de context', lemma: normalized, pos: 'word form' };
};

export const analyzePolishWord = (word = '', sentence = '') => {
  const normalized = normalizeToken(word);
  const tokens = splitPolishTokens(sentence).filter(isPolishWordToken).map(normalizeToken);
  const index = tokens.indexOf(normalized);
  const previous = index > 0 ? tokens[index - 1] : '';
  const curated = CURATED_MAP.get(normalized);
  const pronunciation = getPronunciationGuide(normalized);
  if (curated) return { ...curated, pronunciation, confidence: 'high', sentence };

  const base = defaultMeaning(normalized);
  const verbGuess = inferVerbForm(normalized);
  const nominalGuess = inferNominalForm(normalized, previous);
  const guess = verbGuess || nominalGuess;
  return {
    token: word,
    lemma: base.lemma || normalized,
    pos: base.pos || (verbGuess ? 'verb' : 'word form'),
    form: guess?.form || 'form inferred from context',
    meaningEn: base.en,
    meaningNl: base.nl,
    whyEn: guess?.whyEn || 'Blisko has not yet stored a full paradigm for this form. Use the sentence and nearby prepositions as the safest guide.',
    whyNl: guess?.whyNl || 'Blisko heeft voor deze vorm nog geen volledig paradigma opgeslagen. Gebruik de zin en nabije voorzetsels als veiligste houvast.',
    related: base.lemma && base.lemma !== normalized ? [base.lemma] : [],
    source: 'inferred',
    confidence: guess ? 'medium' : 'limited',
    pronunciation,
    sentence,
  };
};

export const analyzePolishSentence = (sentence = '') => splitPolishTokens(sentence)
  .filter(isPolishWordToken)
  .map((token, index) => ({ id: `${index}-${normalizeToken(token)}`, ...analyzePolishWord(token, sentence) }));

const sharedPrefixLength = (left = '', right = '') => {
  const a = stripPolishDiacritics(normalizeToken(left));
  const b = stripPolishDiacritics(normalizeToken(right));
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1;
  return index;
};

export const explainPolishDifference = (input = '', expected = '') => {
  const learner = splitPolishTokens(input).filter(isPolishWordToken);
  const model = splitPolishTokens(expected).filter(isPolishWordToken);
  const max = Math.max(learner.length, model.length);
  const details = [];
  for (let index = 0; index < max; index += 1) {
    const actual = learner[index] || '';
    const target = model[index] || '';
    if (normalizeToken(actual) === normalizeToken(target)) continue;
    if (!target) {
      details.push({
        learner: actual,
        expected: '',
        type: 'extra',
        title: `Extra word: ${actual}`,
        en: 'This word is not part of the neutral model sentence. It may change the meaning or emphasis.',
        nl: 'Dit woord hoort niet bij de neutrale modelzin en kan de betekenis of nadruk veranderen.',
      });
      continue;
    }
    if (!actual) {
      const analysis = analyzePolishWord(target, expected);
      details.push({
        learner: '',
        expected: target,
        type: 'missing',
        title: `Missing form: ${target}`,
        en: `${analysis.lemma !== target ? `This is a form of ${analysis.lemma}. ` : ''}${analysis.whyEn}`,
        nl: `${analysis.lemma !== target ? `Dit is een vorm van ${analysis.lemma}. ` : ''}${analysis.whyNl}`,
        analysis,
      });
      continue;
    }
    const analysis = analyzePolishWord(target, expected);
    const looseSame = stripPolishDiacritics(normalizeToken(actual)) === stripPolishDiacritics(normalizeToken(target));
    const prefix = sharedPrefixLength(actual, target);
    const likelyEnding = prefix >= Math.max(2, Math.min(normalizeToken(actual).length, normalizeToken(target).length) - 3);
    const type = looseSame ? 'diacritics' : likelyEnding ? 'ending' : 'form';
    details.push({
      learner: actual,
      expected: target,
      type,
      title: looseSame ? `Polish letters: ${actual} → ${target}` : likelyEnding ? `Ending: ${actual} → ${target}` : `Form: ${actual} → ${target}`,
      en: looseSame
        ? `The word is otherwise right. The Polish letter helps preserve the intended sound and spelling.`
        : `${analysis.lemma !== target ? `${target} belongs to the lemma ${analysis.lemma}. ` : ''}${analysis.whyEn}`,
      nl: looseSame
        ? 'Het woord klopt verder. De Poolse letter bewaart de bedoelde klank en spelling.'
        : `${analysis.lemma !== target ? `${target} hoort bij het lemma ${analysis.lemma}. ` : ''}${analysis.whyNl}`,
      analysis,
    });
  }
  return details.slice(0, 3);
};

export const SOUND_LESSONS = [
  {
    id: 'sound-l-vs-l', symbol: 'ł / l', title: 'The w-like ł and clear l', level: 'A0',
    en: 'Polish ł is usually close to English w. Polish l remains a clear l. This distinction changes words immediately.',
    nl: 'Poolse ł klinkt meestal ongeveer als een Engelse w. Poolse l blijft een duidelijke l. Dit verschil verandert woorden meteen.',
    dutchTrap: 'Dutch readers often pronounce both letters as l. Treat the slash through ł as a signal to move the lips toward w.',
    examples: [
      { word: 'był', en: 'he was', nl: 'hij was', cue: 'roughly “bihw”' },
      { word: 'łapa', en: 'paw', nl: 'poot', cue: 'roughly “WA-pa”' },
      { word: 'lubię', en: 'I like', nl: 'ik vind leuk', cue: 'starts with a real l' },
    ],
    quiz: [
      { audio: 'łapa', options: ['łapa', 'lapa', 'lampa'], answer: 'łapa' },
      { audio: 'lubię', options: ['łubię', 'lubię', 'był'], answer: 'lubię' },
    ],
  },
  {
    id: 'sound-sz-vs-soft-s', symbol: 'sz / ś-si', title: 'Firm sh versus soft sh', level: 'A1',
    en: 'sz is a firmer, more retracted “sh”. ś, or si before a vowel, is softer and produced closer to the hard palate.',
    nl: 'sz is een stevigere, meer naar achteren gevormde “sj”. ś, of si vóór een klinker, is zachter en meer palataal.',
    dutchTrap: 'Do not flatten both into the same Dutch sj. First exaggerate the contrast, then make it natural.',
    examples: [
      { word: 'szafa', en: 'wardrobe', nl: 'kast', cue: 'firm sz' },
      { word: 'proszę', en: 'please', nl: 'alstublieft', cue: 'firm sz' },
      { word: 'siostra', en: 'sister', nl: 'zus', cue: 'soft si' },
      { word: 'środa', en: 'Wednesday', nl: 'woensdag', cue: 'soft ś' },
    ],
    quiz: [
      { audio: 'szafa', options: ['szafa', 'siafa', 'środa'], answer: 'szafa' },
      { audio: 'siostra', options: ['szostra', 'siostra', 'szafa'], answer: 'siostra' },
    ],
  },
  {
    id: 'sound-cz-vs-soft-c', symbol: 'cz / ć-ci', title: 'Firm ch versus soft ch', level: 'A1',
    en: 'cz is a firm “ch”. ć, or ci before a vowel, is a softer palatal sound.',
    nl: 'cz is een stevige “tsj”. ć, of ci vóór een klinker, is een zachtere palatale klank.',
    dutchTrap: 'The spelling ci can represent the soft sound before a vowel; do not pronounce it as separate c + i.',
    examples: [
      { word: 'czas', en: 'time', nl: 'tijd', cue: 'firm cz' },
      { word: 'cztery', en: 'four', nl: 'vier', cue: 'firm cz' },
      { word: 'ciasto', en: 'cake', nl: 'taart', cue: 'soft ci' },
      { word: 'ćma', en: 'moth', nl: 'mot', cue: 'soft ć' },
    ],
    quiz: [
      { audio: 'cztery', options: ['cztery', 'ciatery', 'ćma'], answer: 'cztery' },
      { audio: 'ciasto', options: ['czasto', 'ciasto', 'czas'], answer: 'ciasto' },
    ],
  },
  {
    id: 'sound-zh-vs-soft-zh', symbol: 'ż-rz / ź-zi', title: 'Firm zh versus soft zh', level: 'A1',
    en: 'ż and rz normally share the same firm voiced sound. ź, or zi before a vowel, is its softer palatal partner.',
    nl: 'ż en rz delen doorgaans dezelfde stevige stemhebbende klank. ź, of zi vóór een klinker, is de zachtere palatale tegenhanger.',
    dutchTrap: 'English “vision” is a useful anchor for ż/rz, but ź/zi needs a lighter, more forward tongue position.',
    examples: [
      { word: 'żaba', en: 'frog', nl: 'kikker', cue: 'firm ż' },
      { word: 'rzeka', en: 'river', nl: 'rivier', cue: 'firm rz' },
      { word: 'źle', en: 'badly', nl: 'slecht', cue: 'soft ź' },
      { word: 'ziemia', en: 'earth', nl: 'aarde', cue: 'soft zi' },
    ],
    quiz: [
      { audio: 'rzeka', options: ['rzeka', 'zieka', 'źle'], answer: 'rzeka' },
      { audio: 'ziemia', options: ['rzemia', 'ziemia', 'żaba'], answer: 'ziemia' },
    ],
  },
  {
    id: 'sound-c', symbol: 'c / dz', title: 'ts and its voiced partner', level: 'A1',
    en: 'Polish c is the “ts” sound in cats. dz begins with the same tongue position but adds voice.',
    nl: 'Poolse c is de “ts”-klank. dz begint met dezelfde tongpositie maar wordt stemhebbend gemaakt.',
    dutchTrap: 'Never read Polish c as English k or s. Even at the start of a word, it stays ts.',
    examples: [
      { word: 'co', en: 'what', nl: 'wat', cue: 'starts ts-' },
      { word: 'cena', en: 'price', nl: 'prijs', cue: 'starts TS-e' },
      { word: 'dzwon', en: 'bell', nl: 'bel', cue: 'voiced dz' },
    ],
    quiz: [
      { audio: 'cena', options: ['cena', 'kena', 'sena'], answer: 'cena' },
      { audio: 'dzwon', options: ['cwon', 'dzwon', 'żwon'], answer: 'dzwon' },
    ],
  },
  {
    id: 'sound-nasal', symbol: 'ą / ę', title: 'Nasal vowels that adapt', level: 'A1',
    en: 'ą and ę are nasal vowels, but their exact sound changes before different consonants. Word-final ę is often only lightly nasal in natural speech.',
    nl: 'ą en ę zijn nasale klinkers, maar hun precieze klank verandert vóór verschillende medeklinkers. Woordeind-ę is in natuurlijke spraak vaak slechts licht nasaal.',
    dutchTrap: 'Do not force a full separate n after every nasal vowel. Listen for the following consonant and copy the whole syllable.',
    examples: [
      { word: 'mąż', en: 'husband', nl: 'echtgenoot', cue: 'ą before ż' },
      { word: 'ręka', en: 'hand', nl: 'hand', cue: 'ę before k sounds closer to en/eng' },
      { word: 'dziękuję', en: 'thank you', nl: 'dank je', cue: 'final ę is light' },
    ],
    quiz: [
      { audio: 'ręka', options: ['ręka', 'reka', 'rąka'], answer: 'ręka' },
      { audio: 'mąż', options: ['mąż', 'męź', 'maz'], answer: 'mąż' },
    ],
  },
  {
    id: 'sound-y-vs-i', symbol: 'y / i', title: 'Central y versus clear i', level: 'A1',
    en: 'Polish i is close to “ee” and often softens the consonant before it. Polish y is a shorter central vowel with no direct Dutch or English equivalent.',
    nl: 'Poolse i lijkt op “ie” en verzacht vaak de voorafgaande medeklinker. Poolse y is een kortere centrale klinker zonder exact Nederlands equivalent.',
    dutchTrap: 'Do not pronounce y as Dutch ie. Keep the tongue relaxed and slightly farther back.',
    examples: [
      { word: 'my', en: 'we', nl: 'wij', cue: 'central y' },
      { word: 'mi', en: 'to me', nl: 'mij', cue: 'clear i' },
      { word: 'być', en: 'to be', nl: 'zijn', cue: 'central y' },
      { word: 'pić', en: 'to drink', nl: 'drinken', cue: 'clear i' },
    ],
    quiz: [
      { audio: 'my', options: ['my', 'mi', 'ma'], answer: 'my' },
      { audio: 'pić', options: ['pyć', 'pić', 'pieć'], answer: 'pić' },
    ],
  },
  {
    id: 'sound-clusters', symbol: 'prz / szcz', title: 'Decode clusters as sound blocks', level: 'A1',
    en: 'Long Polish spellings become manageable when grouped into sound blocks. Read prze-pra-szam and szczę-ście rather than attacking each letter separately.',
    nl: 'Lange Poolse spelling wordt hanteerbaar als je klankblokken maakt. Lees prze-pra-szam en szczę-ście in plaats van elke letter apart aan te vallen.',
    dutchTrap: 'Slow down between blocks, not between every consonant. The goal is a smooth cluster, not a string of isolated sounds.',
    examples: [
      { word: 'przepraszam', en: 'sorry / excuse me', nl: 'sorry / pardon', cue: 'prze-pra-szam' },
      { word: 'szczęście', en: 'happiness / luck', nl: 'geluk', cue: 'szczę-ście' },
      { word: 'wszystko', en: 'everything', nl: 'alles', cue: 'wszy-stko' },
    ],
    quiz: [
      { audio: 'przepraszam', options: ['przepraszam', 'preprasam', 'przeprawiam'], answer: 'przepraszam' },
      { audio: 'wszystko', options: ['wszystko', 'wysztko', 'wsytsko'], answer: 'wszystko' },
    ],
  },
];

export const getSoundLesson = (id) => SOUND_LESSONS.find((lesson) => lesson.id === id) || SOUND_LESSONS[0];

export const getSoundLessonForWord = (word = '') => {
  const lower = normalizeToken(word);
  if (/ł/.test(lower)) return getSoundLesson('sound-l-vs-l');
  if (/sz|ś|si[aeouąę]/.test(lower)) return getSoundLesson('sound-sz-vs-soft-s');
  if (/cz|ć|ci[aeouąę]/.test(lower)) return getSoundLesson('sound-cz-vs-soft-c');
  if (/rz|ż|ź|zi[aeouąę]/.test(lower)) return getSoundLesson('sound-zh-vs-soft-zh');
  if (/ą|ę/.test(lower)) return getSoundLesson('sound-nasal');
  if (/y|i/.test(lower)) return getSoundLesson('sound-y-vs-i');
  if (/c|dz/.test(lower)) return getSoundLesson('sound-c');
  return null;
};
