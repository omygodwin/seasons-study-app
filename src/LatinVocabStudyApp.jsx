import { useState, useEffect, useMemo } from 'react';
import { useGuidanceTab } from './guidanceContext';
import Flashcards from './Flashcards';

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

const DECKS = ['48-9', '50-51'].map((lesson) => ({
  id: lesson,
  label: `Lessons ${lesson}`,
  emoji: '🏛️',
  cards: VOCAB.filter((v) => v.lesson === lesson).map((v) => ({
    term: v.term,
    definition: v.definition,
    note: v.pos,
  })),
}));

const STORAGE_KEY = 'flashcards:latin';

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
  useGuidanceTab(activeTab);
  const [lessonFilter, setLessonFilter] = useState('all');
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

  const renderNotes = () => {
    const groups = ['48-9', '50-51'];
    return (
      <div className="space-y-6">
        <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          <p className="text-sm text-gray-800">
            📋 All {VOCAB.length} words, for reading over before a round. To{' '}
            <em>practice</em>, use the Note Cards tab — trying to remember first
            is what makes it stick.
          </p>
        </div>
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
    { id: 'flashcards', name: '🃏 Note Cards' },
    { id: 'quiz', name: '📝 Quiz' },
    { id: 'list', name: '📋 Word List' },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-5xl touch-manipulation bg-rose-50 p-4 font-sans sm:p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-rose-800">Latin Vocab</h1>
        <h2 className="text-lg text-gray-600">Chapter 13 — Lessons 48–51</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`min-h-[48px] rounded-xl px-4 py-2.5 font-semibold transition ${
              activeTab === t.id
                ? 'bg-rose-800 text-white shadow-lg ring-2 ring-rose-900 ring-offset-2 ring-offset-rose-50'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        {activeTab === 'flashcards' && (
          <Flashcards decks={DECKS} storageKey={STORAGE_KEY} theme="rose" />
        )}
        {activeTab === 'quiz' && renderQuiz()}
        {activeTab === 'list' && renderNotes()}
      </div>
    </div>
  );
}
