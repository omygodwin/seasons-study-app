import { useState, useEffect, useMemo } from 'react';
import { useGuidanceTab } from './guidanceContext';
import Flashcards from './Flashcards';

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

const DECKS = [{ id: 'vocab', label: 'Vocab Words', emoji: '📚', cards: VOCAB }];

const STORAGE_KEY = 'flashcards:vocab';

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

  useGuidanceTab(activeTab);
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

  /* Reference list, on its own tab. It used to sit on a "Word List" tab beside
   * the cards, which let her read the answers instead of recalling them —
   * see the note at the top of Flashcards.jsx. */
  const renderNotes = () => (
    <div className="space-y-3">
      <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4">
        <p className="text-sm text-gray-800">
          📋 All {VOCAB.length} words, for reading over before a round. To{' '}
          <em>practice</em>, use the Note Cards tab — trying to remember first is
          what makes it stick.
        </p>
      </div>
      <ul className="divide-y divide-purple-100 overflow-hidden rounded-xl bg-white shadow">
        {VOCAB.map((v) => (
          <li key={v.term} className="p-4 sm:flex sm:gap-4">
            <span className="block font-bold text-purple-900 sm:w-40 sm:shrink-0">{v.term}</span>
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
    { id: 'flashcards', name: '🃏 Note Cards' },
    { id: 'quiz', name: '📝 Quiz' },
    { id: 'list', name: '📋 Word List' },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-5xl touch-manipulation bg-purple-50 p-4 font-sans sm:p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-purple-800">Vocab Words</h1>
        <h2 className="text-lg text-gray-600">Flashcards & Quiz Practice</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`min-h-[48px] rounded-xl px-4 py-2.5 font-semibold transition ${
              activeTab === t.id
                ? 'bg-purple-800 text-white shadow-lg ring-2 ring-purple-900 ring-offset-2 ring-offset-purple-50'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        {activeTab === 'flashcards' && (
          <Flashcards decks={DECKS} storageKey={STORAGE_KEY} theme="purple" />
        )}
        {activeTab === 'quiz' && renderQuiz()}
        {activeTab === 'list' && renderNotes()}
      </div>
    </div>
  );
}
