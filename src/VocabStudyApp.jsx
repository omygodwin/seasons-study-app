import React, { useState, useEffect, useMemo } from 'react';

const VOCAB = [
  { term: 'frail', definition: 'very delicate or weak' },
  { term: 'oppose', definition: 'to disagree with or disapprove of' },
  { term: 'feat', definition: 'an act of showing courage, strength, or skill' },
  { term: 'ideal', definition: 'exactly right for a particular purpose' },
  { term: 'grievance', definition: 'a reason for complaining or being upset' },
  { term: 'aloof', definition: 'not involved with or friendly towards other people' },
  { term: 'recoil', definition: 'a sudden backward movement or springing back' },
  { term: 'boisterous', definition: 'being rough and noisy' },
  { term: 'condemn', definition: 'to say in a strong way that you disagree with something' },
  { term: 'refuge', definition: 'shelter or protection from danger or distress' },
  { term: 'burrow', definition: 'a hole in the ground made by an animal' },
  { term: 'immense', definition: 'very big or a lot of' },
  { term: 'ample', definition: 'enough or more than enough' },
  { term: 'edible', definition: 'fit or safe to eat' },
  { term: 'assert', definition: 'to state clearly and strongly' },
  { term: 'taunt', definition: 'to make fun of' },
  { term: 'restrain', definition: 'to keep yourself or someone from doing something' },
  { term: 'expand', definition: 'to make bigger' },
  { term: 'solitary', definition: 'all alone' },
  { term: 'bland', definition: 'lacking flavor or boring' },
  { term: 'sparse', definition: 'not enough of something' },
  { term: 'nonchalant', definition: 'calm and not worried; chill' },
];

function shuffle(array) {
  return [...array].sort(() => 0.5 - Math.random());
}

function buildQuizPool() {
  const pool = [];
  VOCAB.forEach((entry) => {
    const wrongDefs = shuffle(VOCAB.filter((v) => v.term !== entry.term))
      .slice(0, 3)
      .map((v) => v.definition);
    const defOptions = shuffle([entry.definition, ...wrongDefs]);
    pool.push({
      question: `What does "${entry.term}" mean?`,
      options: defOptions,
      correct: defOptions.indexOf(entry.definition),
    });

    const wrongTerms = shuffle(VOCAB.filter((v) => v.term !== entry.term))
      .slice(0, 3)
      .map((v) => v.term);
    const termOptions = shuffle([entry.term, ...wrongTerms]);
    pool.push({
      question: `Which word means: "${entry.definition}"?`,
      options: termOptions,
      correct: termOptions.indexOf(entry.term),
    });
  });
  return pool;
}

export default function VocabStudyApp() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [deckOrder, setDeckOrder] = useState(() => VOCAB.map((_, i) => i));
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDefinitionFirst, setShowDefinitionFirst] = useState(false);

  const [knownCards, setKnownCards] = useState(new Set());
  const [reviewCards, setReviewCards] = useState(new Set());

  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const quizPool = useMemo(() => buildQuizPool(), []);

  const startNewQuiz = () => {
    setCurrentQuiz(shuffle(quizPool).slice(0, 10));
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  useEffect(() => {
    startNewQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deck = deckOrder.map((i) => VOCAB[i]);
  const card = deck[currentCard];
  const cardId = card?.term;

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % deck.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + deck.length) % deck.length);
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
    setDeckOrder(shuffle(VOCAB.map((_, i) => i)));
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const reviewOnly = () => {
    const reviewIndices = VOCAB.map((v, i) => (reviewCards.has(v.term) ? i : null)).filter(
      (x) => x !== null,
    );
    if (reviewIndices.length === 0) return;
    setDeckOrder(reviewIndices);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const allCards = () => {
    setDeckOrder(VOCAB.map((_, i) => i));
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

  const renderFlashcards = () => (
    <div className="space-y-4">
      <div className="text-center text-sm text-gray-700 grid grid-cols-3 gap-2">
        <div className="bg-green-100 p-2 rounded">✅ Known: {knownCards.size}</div>
        <div className="bg-orange-100 p-2 rounded">🤔 Review: {reviewCards.size}</div>
        <div className="bg-purple-100 p-2 rounded">
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
            ? '🔄 Showing: Definition first (guess the word)'
            : '🔄 Showing: Word first (guess the definition)'}
        </button>
      </div>

      <div
        className="relative h-64 [perspective:1000px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`absolute inset-0 w-full h-full flex justify-center items-center bg-white p-6 rounded-lg shadow-lg text-center cursor-pointer transition-opacity duration-300 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {showDefinitionFirst ? (
            <div>
              <p className="text-2xl text-purple-900 font-medium">{card?.definition}</p>
              <p className="mt-3 text-xs text-gray-500">(tap to reveal the word)</p>
            </div>
          ) : (
            <div>
              <h3 className="text-4xl font-bold text-purple-800">{card?.term}</h3>
              <p className="mt-3 text-xs text-gray-500">(tap to see definition)</p>
            </div>
          )}
        </div>
        <div
          className={`absolute inset-0 w-full h-full flex justify-center items-center bg-purple-800 text-white p-6 rounded-lg shadow-lg text-center cursor-pointer transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {showDefinitionFirst ? (
            <h3 className="text-4xl font-bold">{card?.term}</h3>
          ) : (
            <p className="text-xl">{card?.definition}</p>
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
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
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

  const renderList = () => (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
        All {VOCAB.length} Vocab Words
      </h3>
      <ul className="divide-y divide-purple-100 bg-white rounded-lg shadow">
        {VOCAB.map((v) => (
          <li key={v.term} className="p-3 flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <span className="font-bold text-purple-800 sm:w-32">{v.term}</span>
            <span className="text-gray-700">{v.definition}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderQuiz = () => {
    const { correct, total } = getQuizScore();
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Vocabulary Quiz</h3>
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
          <div className="text-center bg-purple-100 p-4 rounded-lg">
            <p className="text-2xl font-bold text-purple-800">
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
                      ? 'bg-purple-100 border-purple-300'
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
    <div className="max-w-4xl mx-auto p-4 bg-purple-50 min-h-screen font-sans">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-purple-800">Vocab Words</h1>
        <h2 className="text-lg text-gray-600">Flashcards & Quiz Practice</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-transform duration-200 ${
              activeTab === t.id
                ? 'bg-purple-700 text-white scale-110'
                : 'bg-purple-500 text-white hover:bg-purple-600'
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
