import { useState, useEffect } from 'react';
import Flashcards from './Flashcards';

const DECKS = [
  {
    id: 'pharaohs',
    label: 'Pharaohs',
    emoji: '👑',
    cards: [
        { term: 'Pepi II', definition: 'Ruled for approximately 94 years, one of the longest reigns in history.' },
        { term: 'Hatshepsut', definition: 'One of the most powerful female pharaohs; focused on trade and building projects.' },
        { term: 'Thutmose III', definition: 'A great military conqueror who expanded Egypt\'s empire, conquering Syria.' },
        { term: 'Ramesses the Great', definition: 'Known for defeating the Hittites and extensive building projects like Abu Simbel.' },
        { term: 'Akhenaten', definition: 'Formerly Amenhotep IV; abandoned polytheism to worship only the sun disk, Aten.' },
        { term: 'Tutankhamun', definition: 'Famous for his nearly intact tomb discovered in 1922, filled with treasure.' },
        { term: 'Cleopatra VII', definition: 'The last active pharaoh of Egypt, who allied with Julius Caesar and Mark Antony.' },
    
    ],
  },
  {
    id: 'gods',
    label: 'Gods',
    emoji: '☀️',
    cards: [
        { term: 'Ra', definition: 'The sun god, one of the most important gods. Often depicted with a falcon head and a sun disk.' },
        { term: 'Osiris', definition: 'God of the underworld and the afterlife. Often shown as a green-skinned, mummified pharaoh.' },
        { term: 'Ma\'at', definition: 'Goddess of truth, justice, and cosmic order. Depicted as a woman with an ostrich feather on her head.' },
        { term: 'Anubis', definition: 'God of mummification and funerals. Depicted with the head of a jackal.' },
        { term: 'Horus', definition: 'Sky god, son of Isis and Osiris. Depicted with the head of a falcon.' },
    
    ],
  },
  {
    id: 'terms',
    label: 'Terms & Places',
    emoji: '🏺',
    cards: [
        { term: 'Hieroglyphics', definition: 'The ancient Egyptian writing system using pictures and symbols.' },
        { term: 'Mummification', definition: 'The process of preserving a body for the afterlife.' },
        { term: 'Book of the Dead', definition: 'A collection of spells and prayers to guide the dead through the underworld.' },
        { term: 'Lower Egypt', definition: 'The northern part of Egypt, where the Nile River forms a delta and flows into the Mediterranean Sea.' },
        { term: 'Upper Egypt', definition: 'The southern part of Egypt, where the Nile flows from upstream.' },
        { term: 'Nubia/Kush', definition: 'A powerful kingdom located to the south of ancient Egypt.' },
    
    ],
  },
  {
    id: 'periods',
    label: 'Periods',
    emoji: '⏳',
    cards: [
          { term: 'Old Kingdom', definition: 'Known as the "Age of the Pyramids." A time of peace and prosperity when the pyramids at Giza were built.' },
          { term: 'Middle Kingdom', definition: 'A period of reunification and stability, often considered the classical age of Egyptian art and literature.' },
          { term: 'New Kingdom', definition: 'Known as the "Age of Empire." Egypt expanded its borders and famous pharaohs like Hatshepsut and Ramesses the Great ruled.' },
    
    ],
  },
];

const STORAGE_KEY = 'flashcards:egypt';

export default function EgyptStudyApp() {
  const [activeTab, setActiveTab] = useState('cards');


  // State for the quiz
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // --- DATA BANK ---

  const quizQuestionBank = [
    { question: 'Why were the pyramids built?', options: ['Palaces for pharaohs', 'Temples for the sun god', 'Tombs for the afterlife', 'Fortresses for defense'], correct: 2 },
    { question: 'What was the main purpose of the Book of the Dead?', options: ['A history of Egypt', 'A guide for the soul through the underworld', 'A list of laws', 'A medical textbook'], correct: 1 },
    { question: 'How did ancient Egyptians view their pharaoh?', options: ['As an elected official', 'As a wealthy merchant', 'As a living god', 'As a military general only'], correct: 2 },
    { question: 'Why is northern Egypt called "Lower Egypt"?', options: ['It has a lower population', 'It is at a lower elevation as the Nile flows north', 'It was considered less important', 'It is south on maps'], correct: 1 },
    { question: 'Which of these was a major achievement of ancient Egypt?', options: ['Invention of the wheel', 'Hieroglyphic writing', 'Invention of gunpowder', 'Democracy'], correct: 1 },
    { question: 'Who was the god of mummification, depicted with the head of a jackal?', options: ['Ra', 'Horus', 'Osiris', 'Anubis'], correct: 3 },
    { question: 'The reign of which female pharaoh was known for peace and successful trade expeditions?', options: ['Cleopatra VII', 'Nefertiti', 'Hatshepsut', 'Sobekneferu'], correct: 2 },
    { question: 'Which pharaoh is famous for attempting to make Egypt a monotheistic society?', options: ['Tutankhamun', 'Ramesses the Great', 'Akhenaten', 'Thutmose III'], correct: 2 },
    { question: 'What was a primary benefit of the Nile River\'s annual flooding?', options: ['It created a natural disaster to control population', 'It washed away cities', 'It deposited rich, fertile silt for farming', 'It revealed new sources of gold'], correct: 2 },
    { question: 'The kingdom of Kush was located in which direction from Egypt?', options: ['North', 'South', 'East', 'West'], correct: 1 },
    { question: 'Which sea forms Egypt\'s eastern border?', options: ['Mediterranean Sea', 'Black Sea', 'Caspian Sea', 'Red Sea'], correct: 3 },
    { question: 'Who was the sky god, often depicted with the head of a falcon?', options: ['Anubis', 'Horus', 'Osiris', 'Ra'], correct: 1 },
    { question: 'The discovery of whose intact tomb in 1922 provided immense wealth and knowledge about ancient Egypt?', options: ['Cleopatra VII', 'Tutankhamun', 'Ramesses the Great', 'Khufu'], correct: 1 },
    { question: 'Which of the following was an achievement of ancient Nubia/Kush?', options: ['Advanced archery', 'The first alphabet', 'Invention of concrete', 'Philosophy'], correct: 0 },
    { question: 'In the Bible, Egypt served as a place of refuge for whom?', options: ['Abraham', 'The family of Jesus', 'Paul the Apostle', 'King David'], correct: 1 },
    { question: 'In the Bible, Egypt served as a place of oppression for whom?', options: ['The Romans', 'The Israelites (Joseph and his descendants)', 'The Greeks', 'The Babylonians'], correct: 1 },
  ];

  // --- FUNCTIONS ---

  // Function to start a new random quiz
  const startNewQuiz = () => {
    const shuffled = [...quizQuestionBank].sort(() => 0.5 - Math.random());
    setCurrentQuiz(shuffled.slice(0, 10));
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  // Generate the first quiz when the component loads
  useEffect(() => {
    startNewQuiz();
  }, []);

  const handleQuizAnswer = (qIndex, aIndex) => setQuizAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
  const checkQuiz = () => setShowQuizResults(true);
  
  const getQuizScore = () => {
    let correct = 0;
    currentQuiz.forEach((q, index) => {
      if (quizAnswers[index] === q.correct) correct++;
    });
    return { correct, total: currentQuiz.length };
  };

  // --- RENDER FUNCTIONS ---

  const renderOverview = () => (
    <div className="space-y-6 text-gray-800">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-r-lg">
        <h3 className="text-2xl font-bold mb-2">📜 Welcome to the Ancient Egypt Study Guide</h3>
        <p>Explore the world of pharaohs, gods, and pyramids. Use the tabs to study flashcards by topic, then test your knowledge with a randomized quiz!</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-2">Periods of Egypt</h4>
            <ul className="list-disc list-inside space-y-1">
                <li><strong>Old Kingdom:</strong> The Age of Pyramids.</li>
                <li><strong>Middle Kingdom:</strong> The Classical Age of reunification.</li>
                <li><strong>New Kingdom:</strong> The Age of Empire and famous pharaohs.</li>
            </ul>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-2">The Nile River</h4>
            <p className="text-sm">The lifeblood of Egypt. Its predictable annual floods deposited fertile black soil (kemet), which allowed civilization to thrive in the desert. It was also the main highway for transportation and trade.</p>
        </div>
      </div>
    </div>
  );

  /* Reference list, on its own tab. These used to be the flashcard tabs
   * themselves, with each term printed next to its definition under the card —
   * see the note at the top of Flashcards.jsx for why that has to be separate
   * from the cards. */
  const renderNotes = () => (
    <div className="space-y-6">
      <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4">
        <p className="text-sm text-gray-800">
          📋 Everything in one place, for reading over before a round or checking
          something you got stuck on. To <em>practice</em>, use the Note Cards tab —
          trying to remember first is what makes it stick.
        </p>
      </div>

      {DECKS.map((deck) => (
        <section key={deck.id}>
          <h3 className="mb-2 text-xl font-bold text-amber-800">
            <span aria-hidden="true">{deck.emoji}</span> {deck.label}
          </h3>
          <ul className="divide-y divide-amber-100 overflow-hidden rounded-xl bg-white shadow">
            {deck.cards.map((entry) => (
              <li key={entry.term} className="p-4 sm:flex sm:gap-4">
                <span className="block font-bold text-amber-900 sm:w-56 sm:shrink-0">
                  {entry.term}
                </span>
                <span className="text-gray-700">{entry.definition}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
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
          <button onClick={checkQuiz} disabled={showQuizResults} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">✓ Check Answers</button>
          <button onClick={startNewQuiz} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">🔄 New Quiz</button>
        </div>

        {showQuizResults && (
            <div className="text-center bg-blue-100 p-4 rounded-lg">
                <p className="text-2xl font-bold text-blue-800">You scored {correct} out of {total}!</p>
            </div>
        )}

        <div className="space-y-4">
          {currentQuiz.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold mb-2">{qIndex + 1}. {q.question}</p>
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
                    buttonClass += isSelected ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 hover:bg-gray-100';
                  }
                  return <button key={oIndex} onClick={() => !showQuizResults && handleQuizAnswer(qIndex, oIndex)} className={buttonClass} disabled={showQuizResults}>{option}</button>
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const categories = [
    { id: 'cards', name: '🃏 Note Cards' },
    { id: 'quiz', name: '📝 Quiz' },
    { id: 'overview', name: '📜 Overview' },
    { id: 'notes', name: '📋 All Notes' },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-5xl touch-manipulation bg-yellow-50 p-4 font-sans sm:p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-yellow-800">Ancient Egypt</h1>
        <h2 className="text-xl text-gray-600">Interactive Study Guide</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`min-h-[48px] rounded-xl px-4 py-2.5 font-semibold transition ${activeTab === cat.id ? 'bg-yellow-700 text-white shadow-lg ring-2 ring-yellow-800 ring-offset-2 ring-offset-yellow-50' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        {activeTab === 'cards' && (
          <Flashcards decks={DECKS} storageKey={STORAGE_KEY} theme="amber" />
        )}
        {activeTab === 'quiz' && renderQuiz()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'notes' && renderNotes()}
      </div>
    </div>
  );
}