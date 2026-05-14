import { useState, useEffect } from 'react';

export default function MiddleAgesStudyApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [knownCards, setKnownCards] = useState(new Set());
  const [reviewCards, setReviewCards] = useState(new Set());

  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // --- DATA ---

  const studyData = {
    feudalism: [
      { term: 'Feudalism', definition: 'The political and social system of the Middle Ages in which the king gave land to nobles in exchange for loyalty and military service.' },
      { term: 'Nobles / Lords', definition: 'Received large pieces of land from the king. They gave smaller pieces of land (fiefs) to knights in exchange for protection.' },
      { term: 'Vassal', definition: 'A knight (or noble) who has accepted land and protection from a lord in exchange for loyalty and military service.' },
      { term: 'Fief', definition: 'Land given to a knight or vassal in exchange for loyalty and service to a lord.' },
      { term: 'Manor', definition: 'An area of land controlled by a lord where peasants lived and worked the fields.' },
      { term: 'Tithes', definition: 'A payment (usually 1/10 of income) given to the Church by peasants and others.' },
      { term: 'Code of Chivalry', definition: 'A set of rules of behavior that a knight had to live by — examples: avoid cheating, die with honor, avoid torture, protect the weak.' },
      { term: 'Feudal Pyramid', definition: 'Top to bottom: Church → Monarch → Nobility → Knights & Vassals → Merchants, Farmers, Craftsmen. Taxes and loyalty flow up; land flows down.' },
    ],
    church: [
      { term: 'The Pope', definition: 'The leader of the Catholic Church.' },
      { term: 'Sacraments', definition: 'Religious ceremonies and acts that Christians do throughout their life in the Church to serve God.' },
      { term: 'Excommunication', definition: 'When the Pope takes away a person\'s sacraments — cutting them off from the Church.' },
      { term: 'Interdict', definition: 'Like excommunication, but for a whole kingdom or region. Sacraments are taken away from everyone there.' },
      { term: 'Monasticism', definition: 'A way of life for monks and nuns. They woke up super early, went to bed late, and even woke up in the middle of the night for prayer and worship.' },
      { term: 'Monks and Art', definition: 'Monks made art, music, and copied books (like the Bible) to glorify God. They preserved learning and literature.' },
      { term: 'Church in Government', definition: 'Church leaders were often the only ones who could read and write, and they could excommunicate even kings.' },
      { term: 'Church and Education', definition: 'Members of the Church could read, write, and teach others, making them the educators of the Middle Ages.' },
      { term: 'Church Land and Wealth', definition: 'The Church owned the most land in Europe. Kings had to stay on good terms with the Church to keep their land and power.' },
      { term: 'Church and Unity', definition: 'People across many different countries were united because they were all part of the Catholic Church.' },
    ],
    events: [
      { term: 'The Dark Ages', definition: 'A nickname for the Middle Ages. Some say it fits because of the Black Death, heavy taxes, and lack of new technology. Others disagree because monks copied Bibles and peace treaties were made.' },
      { term: 'The Black Death', definition: 'The Bubonic Plague. Most likely carried by rats and fleas. About 1/3 (33%) of the European population died.' },
      { term: 'Causes (as people thought)', definition: 'People in the Middle Ages thought the Black Death was caused by dirtiness, but mostly believed they were being punished by God for sin.' },
      { term: 'Church Response to Plague', definition: 'The Church (especially nuns) helped care for the sick, and called people to repent of their sins.' },
      { term: 'The Hundred Years\' War', definition: 'A long war between England and France, fought over who would rule the French throne.' },
      { term: 'Joan of Arc', definition: 'A young French girl who helped lead and fight with the French army. She claimed to have visions from God. She gained so much power that she was arrested and killed (burned at the stake).' },
      { term: 'The Crusades', definition: 'A series of religious wars where European Christians traveled to take back the Holy Land (Jerusalem) from Muslim control.' },
      { term: 'Pope Urban II', definition: 'The Pope who called Christians to go on the First Crusade.' },
      { term: 'Pilgrims', definition: 'The Crusaders considered themselves pilgrims — religious travelers — so they could enter Jerusalem.' },
      { term: 'First Crusade', definition: 'Goal: rescue the Holy Land from the Turks. It was successful — Crusaders gained lots of land and divided it into smaller regions called Crusader States.' },
      { term: 'Crusader States', definition: 'Land in the Holy Land that the Crusaders divided into smaller regions to control after the First Crusade.' },
      { term: '2nd–8th Crusades', definition: 'Not really successful — they tried to do the same thing (capture more land) over and over again, and they mostly failed.' },
      { term: 'The Reconquista', definition: 'A movement to drive the Muslims out of Spain and place Spain under the control of Christian monarchs.' },
      { term: 'Impact of the Crusades', definition: 'They spread Christianity, increased trade, and connected Europe with the Middle East.' },
    ],
    magnaCarta: [
      { term: 'Magna Carta', definition: 'A constitutional document from the Middle Ages that formed the basis of government and contained legal and political rights.' },
      { term: 'Whose Power It Limited', definition: 'The Magna Carta limited the power of the government (the king) and gave rights to the people.' },
      { term: 'Inspired By It', definition: 'Later documents inspired by the Magna Carta include the U.S. Constitution and the Declaration of Independence.' },
      { term: 'Limited Government', definition: 'The government\'s powers are limited. Why important: it prevents corruption and over-reach of power.' },
      { term: 'The Rule of Law', definition: 'Everyone has to obey the law, no matter their position or circumstance. Why important: gives everyone equality and prevents corruption.' },
      { term: 'Individual Rights', definition: 'Everyone is born with natural rights that can\'t be taken away. The government doesn\'t grant life, liberty, and the right to own property — it protects them.' },
      { term: 'Shared Power', definition: 'Power has to be shared between different branches of government. Why important: prevents corruption and unjust decisions.' },
    ],
  };

  const quizQuestionBank = [
    { question: 'In feudalism, what did the king give to nobles in exchange for loyalty?', options: ['Gold', 'Land', 'Weapons', 'Servants'], correct: 1 },
    { question: 'What is a vassal?', options: ['A peasant who farms a manor', 'A traveling merchant', 'A knight who has accepted land and protection from a lord', 'A member of the clergy'], correct: 2 },
    { question: 'What is a fief?', options: ['A type of tax', 'Land given to a knight in exchange for loyalty', 'A religious ceremony', 'A medieval weapon'], correct: 1 },
    { question: 'What is a manor?', options: ['A church building', 'An area of land controlled by a lord where peasants live', 'A type of castle for the king only', 'A walled town'], correct: 1 },
    { question: 'Who sits at the very top of the Feudal Pyramid of Power?', options: ['The Monarch', 'The Nobility', 'The Church', 'The Knights'], correct: 2 },
    { question: 'In the feudal pyramid, what flows DOWN from higher levels to lower levels?', options: ['Taxes', 'Loyalty', 'Land', 'Sacraments'], correct: 2 },
    { question: 'What was the Code of Chivalry?', options: ['A set of laws for peasants', 'Rules of behavior a knight had to live by', 'A list of church sacraments', 'Tax rules for nobles'], correct: 1 },
    { question: 'Who was the leader of the Catholic Church?', options: ['The King', 'A noble', 'The Pope', 'A monk'], correct: 2 },
    { question: 'What is excommunication?', options: ['Being kicked out of a kingdom', 'When the Pope takes away a person\'s sacraments', 'A type of tax', 'A knight\'s ceremony'], correct: 1 },
    { question: 'What is an interdict?', options: ['Excommunication for an entire kingdom or region', 'A noble\'s land grant', 'A type of crusade', 'A prayer book'], correct: 0 },
    { question: 'Describe daily life for monks and nuns:', options: ['They slept in late and worked in the fields', 'They woke up super early, went to bed late, and woke in the middle of the night for prayer', 'They traveled constantly and rarely slept indoors', 'They lived with their families and prayed once a day'], correct: 1 },
    { question: 'Why were the Middle Ages SOMETIMES called the Dark Ages?', options: ['Sun rarely shined', 'Black Death, heavy taxes, and not much new technology', 'No one had candles', 'The Church banned daylight'], correct: 1 },
    { question: 'Which animals were the most likely carriers of the Bubonic Plague?', options: ['Cats and dogs', 'Cows and pigs', 'Rats and fleas', 'Birds and bats'], correct: 2 },
    { question: 'About what fraction of the European population died from the Black Death?', options: ['About 10%', 'About 1/3 (33%)', 'About half', 'About 75%'], correct: 1 },
    { question: 'What did people in the Middle Ages MOSTLY think caused the Black Death?', options: ['Bad weather', 'They were being punished by God for sin', 'A foreign invasion', 'Bad food'], correct: 1 },
    { question: 'Which countries fought in the Hundred Years\' War?', options: ['Spain and Portugal', 'England and France', 'Italy and Germany', 'Russia and Poland'], correct: 1 },
    { question: 'What was Joan of Arc famous for?', options: ['Leading the French army and claiming to have visions', 'Inventing gunpowder', 'Being the Queen of England', 'Writing the Magna Carta'], correct: 0 },
    { question: 'Who called Christians to go on the First Crusade?', options: ['King Richard', 'Pope Urban II', 'Joan of Arc', 'Charlemagne'], correct: 1 },
    { question: 'Where is the Holy Land that Crusaders wanted to reach?', options: ['Rome', 'Constantinople', 'Jerusalem', 'Mecca'], correct: 2 },
    { question: 'What were the Crusader States?', options: ['Castles built in Europe', 'Land in the Holy Land divided into smaller regions controlled by Crusaders', 'Catholic monasteries', 'French provinces'], correct: 1 },
    { question: 'Were the 2nd–8th Crusades generally successful?', options: ['Yes, they all captured more land', 'No, they tried the same thing over and over and mostly failed', 'Yes, they ended the Black Death', 'No, they were never fought'], correct: 1 },
    { question: 'What was the Reconquista?', options: ['A movement to drive Muslims out of Spain and place it under Christian rule', 'A peace treaty after the Crusades', 'A new sacrament of the Church', 'A French civil war'], correct: 0 },
    { question: 'What was one major impact of the Crusades on Europe?', options: ['They ended feudalism overnight', 'They spread Christianity and connected Europe with the Middle East', 'They caused the Black Death', 'They created the Magna Carta'], correct: 1 },
    { question: 'What was the Magna Carta?', options: ['A medieval castle', 'A constitutional document containing legal and political rights', 'A church sacrament', 'A type of knight\'s armor'], correct: 1 },
    { question: 'Whose power did the Magna Carta LIMIT?', options: ['The Pope\'s', 'The government / the king\'s', 'The knights\'', 'The peasants\''], correct: 1 },
    { question: 'Which of these documents was INSPIRED by the Magna Carta?', options: ['The Code of Chivalry', 'The Declaration of Independence', 'The Book of the Dead', 'The Edict of Milan'], correct: 1 },
    { question: 'What does "Limited Government" mean?', options: ['Only nobles can be in government', 'The government\'s powers are limited', 'The government can never raise taxes', 'There is no government at all'], correct: 1 },
    { question: 'What does "The Rule of Law" mean?', options: ['Only the king has to follow laws', 'Everyone has to obey the law, no matter their position', 'Laws change every year', 'Only nobles write the laws'], correct: 1 },
    { question: 'What is the main idea of "Individual Rights"?', options: ['Only the king has rights', 'Everyone is born with natural rights that can\'t be taken away', 'Rights are given by nobles', 'Rights only apply to knights'], correct: 1 },
    { question: 'Why is "Shared Power" important?', options: ['It makes the king richer', 'It prevents corruption and unjust decisions', 'It speeds up wars', 'It lets the Church rule everything'], correct: 1 },
  ];

  // --- FUNCTIONS ---

  const startNewQuiz = () => {
    const shuffled = [...quizQuestionBank].sort(() => 0.5 - Math.random());
    setCurrentQuiz(shuffled.slice(0, 10));
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  useEffect(() => {
    startNewQuiz();
  }, []);

  const currentDeck = studyData[activeTab] || [];
  const cardId = `${activeTab}-${currentCard}`;

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % currentDeck.length);
    setIsFlipped(false);
  };

  const handleMarkCard = (status) => {
    if (status === 'known') {
      setKnownCards((prev) => new Set(prev).add(cardId));
      setReviewCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } else {
      setReviewCards((prev) => new Set(prev).add(cardId));
      setKnownCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
    setTimeout(nextCard, 200);
  };

  const resetCardProgress = () => {
    setKnownCards(new Set());
    setReviewCards(new Set());
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const handleQuizAnswer = (qIndex, aIndex) =>
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: aIndex }));
  const checkQuiz = () => setShowQuizResults(true);

  const getQuizScore = () => {
    let correct = 0;
    currentQuiz.forEach((q, index) => {
      if (quizAnswers[index] === q.correct) correct++;
    });
    return { correct, total: currentQuiz.length };
  };

  // --- RENDER ---

  const renderOverview = () => (
    <div className="space-y-6 text-gray-800">
      <div className="bg-amber-100 border-l-4 border-amber-600 p-6 rounded-r-lg">
        <h3 className="text-2xl font-bold mb-2">🏰 High and Late Middle Ages</h3>
        <p>
          Step into the world of knights, kings, monks, and crusaders. Use the tabs to study
          flashcards by topic, then test what you know with a 10-question quiz!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-stone-100 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2">Was it really the "Dark Ages"?</h4>
          <p className="font-semibold mt-2">Reasons YES:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>The Black Death was a huge, horrific conflict</li>
            <li>Lots of taxes</li>
            <li>Not much new technology</li>
          </ul>
          <p className="font-semibold mt-2">Reasons NO:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Monks copied Bibles and preserved learning</li>
            <li>Peace treaties were made</li>
          </ul>
        </div>

        <div className="bg-emerald-50 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2">Feudal Pyramid of Power</h4>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Church (top)</li>
            <li>Monarch</li>
            <li>Nobility</li>
            <li>Knights &amp; Vassals</li>
            <li>Merchants, Farmers, Craftsmen</li>
          </ol>
          <p className="text-xs mt-2 text-gray-700">
            ⬆️ Taxes and loyalty flow up · ⬇️ Land flows down
          </p>
        </div>

        <div className="bg-rose-50 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2">The Black Death</h4>
          <p className="text-sm">
            Carried by rats and fleas. About 1/3 (33%) of Europe died. Most people thought it was
            God's punishment for sin. The Church helped the sick (especially nuns) and called
            people to repent.
          </p>
        </div>

        <div className="bg-sky-50 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2">The Magna Carta</h4>
          <p className="text-sm">
            A constitutional document that limited the power of the government and gave rights to
            the people. It inspired later documents like the U.S. Constitution and the Declaration
            of Independence.
          </p>
        </div>
      </div>
    </div>
  );

  const renderFlashcards = () => (
    <div className="space-y-4">
      {currentDeck.length > 0 ? (
        <>
          <div className="text-center text-sm text-gray-600 grid grid-cols-2 gap-2">
            <div className="bg-green-100 p-2 rounded">Known: {knownCards.size}</div>
            <div className="bg-orange-100 p-2 rounded">Needs Review: {reviewCards.size}</div>
          </div>
          <div className="relative h-64" onClick={() => setIsFlipped(!isFlipped)}>
            <div
              className={`absolute inset-0 w-full h-full flex justify-center items-center bg-white p-6 rounded-lg shadow-lg text-center cursor-pointer transition-transform duration-500 ${
                isFlipped ? 'opacity-0' : ''
              }`}
            >
              <h3 className="text-3xl font-bold">{currentDeck[currentCard]?.term}</h3>
            </div>
            <div
              className={`absolute inset-0 w-full h-full flex justify-center items-center bg-amber-800 text-white p-6 rounded-lg shadow-lg text-center cursor-pointer transition-transform duration-500 ${
                !isFlipped ? 'opacity-0' : ''
              }`}
            >
              <p className="text-lg">{currentDeck[currentCard]?.definition}</p>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleMarkCard('review')}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600"
            >
              🤔 Review Again
            </button>
            <button
              onClick={() => handleMarkCard('known')}
              className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
            >
              ✅ I Knew This
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={resetCardProgress}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              🔄 Reset Progress
            </button>
          </div>
        </>
      ) : (
        <p>Select a category.</p>
      )}
    </div>
  );

  const renderQuiz = () => {
    const { correct, total } = getQuizScore();
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Knowledge Quiz</h3>
          <p className="text-gray-600">A random set of 10 questions to test your skills.</p>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={checkQuiz}
            disabled={showQuizResults}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            ✓ Check Answers
          </button>
          <button
            onClick={startNewQuiz}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            🔄 New Quiz
          </button>
        </div>

        {showQuizResults && (
          <div className="text-center bg-blue-100 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-800">
              You scored {correct} out of {total}!
            </p>
          </div>
        )}

        <div className="space-y-4">
          {currentQuiz.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold mb-2">
                {qIndex + 1}. {q.question}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((option, oIndex) => {
                  const isSelected = quizAnswers[qIndex] === oIndex;
                  const isCorrect = oIndex === q.correct;
                  let buttonClass = 'w-full text-left p-3 rounded border ';
                  if (showQuizResults) {
                    if (isCorrect) buttonClass += 'bg-green-200 border-green-400';
                    else if (isSelected) buttonClass += 'bg-red-200 border-red-400';
                    else buttonClass += 'bg-gray-100 border-gray-300';
                  } else {
                    buttonClass += isSelected
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100';
                  }
                  return (
                    <button
                      key={oIndex}
                      onClick={() => !showQuizResults && handleQuizAnswer(qIndex, oIndex)}
                      className={buttonClass}
                      disabled={showQuizResults}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const categories = [
    { id: 'overview', name: '📜 Overview' },
    { id: 'feudalism', name: '🏰 Feudalism' },
    { id: 'church', name: '⛪ The Church' },
    { id: 'events', name: '⚔️ Events' },
    { id: 'magnaCarta', name: '📜 Magna Carta' },
    { id: 'quiz', name: '📝 Quiz' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 bg-amber-50 min-h-screen font-sans">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-amber-900">High &amp; Late Middle Ages</h1>
        <h2 className="text-xl text-gray-600">Interactive Study Guide</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-transform duration-200 ${
              activeTab === cat.id
                ? 'bg-amber-800 text-white scale-110'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'quiz' && renderQuiz()}
        {['feudalism', 'church', 'events', 'magnaCarta'].includes(activeTab) && renderFlashcards()}
      </div>
    </div>
  );
}
