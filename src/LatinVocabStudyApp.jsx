import React, { useState, useEffect, useMemo } from 'react';

const VOCAB = [
  // Lessons 48-9
  { term: 'labor, -ōris', pos: 'm.', definition: 'work', lesson: '48-9' },
  { term: 'fidēs, -eī', pos: 'f.', definition: 'trust, faith', lesson: '48-9' },
  { term: 'mūrus, -ī', pos: 'm.', definition: 'wall', lesson: '48-9' },
  { term: 'modus, -ī', pos: 'm.', definition: 'manner, type', lesson: '48-9' },
  { term: 'saxum, -ī', pos: 'n.', definition: 'rock', lesson: '48-9' },
  { term: 'ingenium, -ī', pos: 'n.', definition: 'ability, talent', lesson: '48-9' },
  { term: 'vērus, -a, -um', pos: 'adj.', definition: 'true', lesson: '48-9' },
  { term: 'aliquis, aliquid', pos: 'pron.', definition: 'someone, anyone', lesson: '48-9' },
  { term: 'dūrus, -a, -um', pos: 'adj.', definition: 'hard, harsh', lesson: '48-9' },
  { term: 'misceō, miscēre, miscuī, mixtum', pos: 'v.', definition: 'mix', lesson: '48-9' },
  { term: 'sedeō, sedēre, sēdī', pos: 'v.', definition: 'sit', lesson: '48-9' },
  { term: 'tegō, tegere, tēxī, tēctum', pos: 'v.', definition: 'cover, conceal', lesson: '48-9' },
  // Lessons 50-51
  { term: 'pulcher, pulchra, pulchrum', pos: 'adj.', definition: 'beautiful', lesson: '50-51' },
  { term: 'lūmen, luminis', pos: 'n.', definition: 'light', lesson: '50-51' },
  { term: 'poena, -ae', pos: 'f.', definition: 'punishment', lesson: '50-51' },
  { term: 'dolor, -ōris', pos: 'm.', definition: 'pain, grief', lesson: '50-51' },
  { term: 'cūra, -ae', pos: 'f.', definition: 'care, concern', lesson: '50-51' },
  { term: 'dēscendō, -endere, -endī, -ēnsum', pos: 'v.', definition: 'go down', lesson: '50-51' },
  { term: 'interficiō, -ficere, -fēcī, -fectum', pos: 'v.', definition: 'kill', lesson: '50-51' },
  { term: 'peccō, -āre, -āvī, -ātus', pos: 'v.', definition: 'commit a crime, sin', lesson: '50-51' },
  { term: 'tamen', pos: 'adv.', definition: 'nevertheless', lesson: '50-51' },
  { term: 'sīc', pos: 'adv.', definition: 'thus', lesson: '50-51' },
  { term: 'nisi', pos: 'conj.', definition: 'if not, unless', lesson: '50-51' },
];

const LESSONS = ['all', '48-9', '50-51'];

function shuffle(array) {
  return [...array].sort(() => 0.5 - Math.random());
}

function buildQuizPool(words) {
  const pool = [];
  words.forEach((entry) => {
    const wrongDefs = shuffle(words.filter((v) => v.term !== entry.term))
      .slice(0, 3)
      .map((v) => v.definition);
    const defOptions = shuffle([entry.definition, ...wrongDefs]);
    pool.push({
      question: `What does "${entry.term}" mean?`,
      options: defOptions,
      correct: defOptions.indexOf(entry.definition),
    });

    const wrongTerms = shuffle(words.filter((v) => v.term !== entry.term))
      .slice(0, 3)
      .map((v) => v.term);
    const termOptions = shuffle([entry.term, ...wrongTerms]);
    pool.push({
      question: `Which Latin word means: "${entry.definition}"?`,
      options: termOptions,
      correct: termOptions.indexOf(entry.term),
    });
  });
  return pool;
}

export default function LatinVocabStudyApp() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [lessonFilter, setLessonFilter] = useState('all');
  const [deckOrder, setDeckOrder] = useState(() => VOCAB.map((_, i) => i));
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDefinitionFirst, setShowDefinitionFirst] = useState(false);

  const [knownCards, setKnownCards] = useState(new Set());
  const [reviewCards, setReviewCards] = useState(new Set());

  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const filteredWords = useMemo(
    () => (lessonFilter === 'all' ? VOCAB : VOCAB.filter((v) => v.lesson === lessonFilter)),
    [lessonFilter],
  );

  const quizPool = useMemo(() => buildQuizPool(filteredWords), [filteredWords]);

  const startNewQuiz = () => {
    setCurrentQuiz(shuffle(quizPool).slice(0, 10));
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  useEffect(() => {
    startNewQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonFilter]);

  useEffect(() => {
    const indices = VOCAB.map((v, i) => (lessonFilter === 'all' || v.lesson === lessonFilter ? i : null)).filter(
      (x) => x !== null,
    );
    setDeckOrder(indices);
    setCurrentCard(0);
    setIsFlipped(false);
  }, [lessonFilter]);

  const deck = deckOrder.map((i) => VOCAB[i]).filter(Boolean);
  const card = deck[currentCard];
  const cardId = card?.term;

  const nextCard = () => {
    setCurrentCard((prev) => (deck.length ? (prev + 1) % deck.length : 0));
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (deck.length ? (prev - 1 + deck.length) % deck.length : 0));
    setIsFlipped(false);
  };

  const handleMarkCard = (status) => {
    if (!cardId) return;
    if (status === 'known') {
      setKnownCards((prev) => new Set(prev).add(cardId));
      setReviewCards((prev) => {
        const s = new Set(prev);
        s.delete(cardId);
        return s;
      });
    } else {
      setReviewCards((prev) => new Set(prev).add(cardId));
      setKnownCards((prev) => {
        const s = new Set(prev);
        s.delete(cardId);
        return s;
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

  const shuffleDeck = () => {
    const indices = VOCAB.map((v, i) => (lessonFilter === 'all' || v.lesson === lessonFilter ? i : null)).filter(
      (x) => x !== null,
    );
    setDeckOrder(shuffle(indices));
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const allCards = () => {
    const indices = VOCAB.map((v, i) => (lessonFilter === 'all' || v.lesson === lessonFilter ? i : null)).filter(
      (x) => x !== null,
    );
    setDeckOrder(indices);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const reviewOnly = () => {
    const reviewIndices = VOCAB.map((v, i) =>
      reviewCards.has(v.term) && (lessonFilter === 'all' || v.lesson === lessonFilter) ? i : null,
    ).filter((x) => x !== null);
    if (reviewIndices.length === 0) return;
    setDeckOrder(reviewIndices);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const handleQuizAnswer = (qIndex, aIndex) =>
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: aIndex }));
  const checkQuiz = () => setShowQuizResults(true);

  const getQuizScore = () => {
    let correct = 0;
    currentQuiz.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) correct++;
    });
    return { correct, total: currentQuiz.length };
  };

  const renderLessonFilter = () => (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      {LESSONS.map((lesson) => (
        <button
          key={lesson}
          onClick={() => setLessonFilter(lesson)}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            lessonFilter === lesson
              ? 'bg-rose-700 text-white'
              : 'bg-rose-200 text-rose-900 hover:bg-rose-300'
          }`}
        >
          {lesson === 'all' ? 'All Lessons' : `Lessons ${lesson}`}
        </button>
      ))}
    </div>
  );

  const renderFlashcards = () => (
    <div className="space-y-4">
      {renderLessonFilter()}
      <div className="text-center text-sm text-gray-700 grid grid-cols-3 gap-2">
        <div className="bg-green-100 p-2 rounded">✅ Known: {knownCards.size}</div>
        <div className="bg-orange-100 p-2 rounded">🤔 Review: {reviewCards.size}</div>
        <div className="bg-rose-100 p-2 rounded">
          Card {deck.length ? currentCard + 1 : 0} / {deck.length}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => {
            setShowDefinitionFirst((v) => !v);
            setIsFlipped(false);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          {showDefinitionFirst
            ? '🔄 Showing: English first (guess the Latin)'
            : '🔄 Showing: Latin first (guess the English)'}
        </button>
      </div>

      <div
        className="relative h-72 [perspective:1000px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`absolute inset-0 w-full h-full flex justify-center items-center bg-white p-6 rounded-lg shadow-lg text-center cursor-pointer transition-opacity duration-300 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {showDefinitionFirst ? (
            <div>
              <p className="text-3xl text-rose-900 font-medium">{card?.definition}</p>
              <p className="mt-3 text-xs text-gray-500">(tap to reveal the Latin word)</p>
            </div>
          ) : (
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold text-rose-800">{card?.term}</h3>
              {card?.pos && <p className="mt-2 text-sm italic text-gray-500">{card.pos}</p>}
              <p className="mt-3 text-xs text-gray-500">(tap to see the meaning)</p>
            </div>
          )}
        </div>
        <div
          className={`absolute inset-0 w-full h-full flex justify-center items-center bg-rose-800 text-white p-6 rounded-lg shadow-lg text-center cursor-pointer transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {showDefinitionFirst ? (
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold">{card?.term}</h3>
              {card?.pos && <p className="mt-2 text-sm italic text-rose-100">{card.pos}</p>}
            </div>
          ) : (
            <p className="text-2xl">{card?.definition}</p>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-3 flex-wrap gap-2">
        <button
          onClick={prevCard}
          className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600"
        >
          ← Prev
        </button>
        <button
          onClick={() => handleMarkCard('review')}
          className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600"
        >
          🤔 Review Again
        </button>
        <button
          onClick={() => handleMarkCard('known')}
          className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
        >
          ✅ I Knew This
        </button>
        <button
          onClick={nextCard}
          className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600"
        >
          Next →
        </button>
      </div>

      <div className="flex justify-center flex-wrap gap-2">
        <button
          onClick={shuffleDeck}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          🔀 Shuffle
        </button>
        <button
          onClick={allCards}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm"
        >
          📚 All Cards
        </button>
        <button
          onClick={reviewOnly}
          disabled={reviewCards.size === 0}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm disabled:bg-gray-400"
        >
          🎯 Study Review Pile
        </button>
        <button
          onClick={resetCardProgress}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          🔄 Reset Progress
        </button>
      </div>
    </div>
  );

  const renderList = () => {
    const groups = ['48-9', '50-51'];
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 text-center">
          Chapter 13 Vocabulary ({VOCAB.length} words)
        </h3>
        {groups.map((g) => (
          <div key={g}>
            <h4 className="text-lg font-bold text-rose-700 mb-2">Lessons {g}</h4>
            <ul className="divide-y divide-rose-100 bg-white rounded-lg shadow">
              {VOCAB.filter((v) => v.lesson === g).map((v) => (
                <li
                  key={v.term}
                  className="p-3 flex flex-col sm:flex-row sm:items-baseline sm:gap-3"
                >
                  <span className="font-bold text-rose-800 sm:w-72">
                    {v.term}{' '}
                    {v.pos && <span className="text-sm italic font-normal text-gray-500">{v.pos}</span>}
                  </span>
                  <span className="text-gray-700">{v.definition}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderQuiz = () => {
    const { correct, total } = getQuizScore();
    return (
      <div className="space-y-6">
        {renderLessonFilter()}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Latin Vocabulary Quiz</h3>
          <p className="text-gray-600">10 random questions. Each quiz is different!</p>
        </div>
        <div className="flex justify-center space-x-3 flex-wrap gap-2">
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
          <div className="text-center bg-rose-100 p-4 rounded-lg">
            <p className="text-2xl font-bold text-rose-800">
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
                      ? 'bg-rose-100 border-rose-300'
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

  const tabs = [
    { id: 'flashcards', name: '🃏 Flashcards' },
    { id: 'list', name: '📋 Word List' },
    { id: 'quiz', name: '📝 Quiz' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 bg-rose-50 min-h-screen font-sans">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-rose-800">Latin Vocab</h1>
        <h2 className="text-lg text-gray-600">Chapter 13 — Lessons 48–51</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-transform duration-200 ${
              activeTab === t.id
                ? 'bg-rose-700 text-white scale-110'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        {activeTab === 'flashcards' && renderFlashcards()}
        {activeTab === 'list' && renderList()}
        {activeTab === 'quiz' && renderQuiz()}
      </div>
    </div>
  );
}
