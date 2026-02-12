import { useState, useEffect } from 'react';

export default function RocksStudyApp() {
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
    types: [
      { term: 'Igneous Rock', definition: 'Formed when melted rock (magma or lava) cools and hardens. Example: granite, basalt, obsidian.' },
      { term: 'Sedimentary Rock', definition: 'Formed when layers of sediment (sand, mud, pebbles) are pressed and cemented together over time. Example: sandstone, limestone, shale.' },
      { term: 'Metamorphic Rock', definition: 'Formed when existing rock is changed by heat and pressure deep inside Earth. Example: marble, slate, quartzite.' },
      { term: 'Intrusive Igneous Rock', definition: 'Forms when magma cools slowly beneath Earth\'s surface. Has large, visible crystals. Example: granite.' },
      { term: 'Extrusive Igneous Rock', definition: 'Forms when lava cools quickly on Earth\'s surface. Has small or no visible crystals. Example: basalt, obsidian.' },
      { term: 'Clastic Sedimentary Rock', definition: 'Made from broken pieces (clasts) of other rocks cemented together. Example: sandstone, conglomerate.' },
      { term: 'Chemical Sedimentary Rock', definition: 'Forms when minerals dissolved in water crystallize out. Example: rock salt, some limestone.' },
      { term: 'Organic Sedimentary Rock', definition: 'Formed from the remains of living things. Example: coal (from plants), some limestone (from shells).' },
      { term: 'Foliated Metamorphic Rock', definition: 'Has visible layers or bands from minerals being squeezed into alignment. Example: slate, gneiss, schist.' },
      { term: 'Non-Foliated Metamorphic Rock', definition: 'Does not have layers or bands. Example: marble, quartzite.' },
    ],
    rockcycle: [
      { term: 'The Rock Cycle', definition: 'The continuous process by which rocks are created, changed from one type to another, destroyed, and then formed again.' },
      { term: 'Weathering', definition: 'The breaking down of rocks into smaller pieces by wind, water, ice, or living things.' },
      { term: 'Erosion', definition: 'The movement of weathered rock and sediment by wind, water, ice, or gravity.' },
      { term: 'Deposition', definition: 'When eroded sediment is dropped or settled in a new location.' },
      { term: 'Compaction & Cementation', definition: 'Layers of sediment are pressed together (compaction) and glued by minerals (cementation) to form sedimentary rock.' },
      { term: 'Heat & Pressure', definition: 'Forces deep inside Earth that change existing rock into metamorphic rock without melting it.' },
      { term: 'Melting', definition: 'When rock is heated enough to become magma (liquid rock inside Earth).' },
      { term: 'Cooling & Crystallization', definition: 'When magma or lava cools and solidifies into igneous rock.' },
      { term: 'Uplift', definition: 'Forces that push rock from deep underground up to Earth\'s surface, exposing it to weathering.' },
    ],
    minerals: [
      { term: 'Mineral', definition: 'A naturally occurring, inorganic solid with a definite chemical composition and crystal structure.' },
      { term: 'Luster', definition: 'How a mineral reflects light. Can be metallic (shiny like metal) or non-metallic (glassy, waxy, dull, etc.).' },
      { term: 'Hardness', definition: 'How resistant a mineral is to being scratched. Measured on the Mohs Hardness Scale (1-10).' },
      { term: 'Streak', definition: 'The color of a mineral\'s powder when rubbed on a porcelain plate. More reliable than the mineral\'s outer color.' },
      { term: 'Cleavage', definition: 'When a mineral breaks along smooth, flat surfaces.' },
      { term: 'Fracture', definition: 'When a mineral breaks along rough or irregular surfaces.' },
      { term: 'Mohs Hardness Scale', definition: 'Scale from 1 (softest, talc) to 10 (hardest, diamond) used to rank mineral hardness.' },
      { term: 'Quartz', definition: 'One of the most common minerals on Earth. Hardness of 7. Found in granite and sandstone.' },
      { term: 'Feldspar', definition: 'The most abundant mineral group in Earth\'s crust. Key component of granite.' },
      { term: 'Mica', definition: 'A mineral that splits into thin, flexible sheets. Has a glassy or pearly luster.' },
    ],
    properties: [
      { term: 'Texture', definition: 'The size, shape, and arrangement of grains or crystals in a rock.' },
      { term: 'Coarse-Grained Texture', definition: 'Large crystals or grains you can see with the naked eye. Example: granite.' },
      { term: 'Fine-Grained Texture', definition: 'Very small crystals or grains, hard to see without magnification. Example: basalt, shale.' },
      { term: 'Glassy Texture', definition: 'No visible crystals; forms when lava cools very rapidly. Example: obsidian.' },
      { term: 'Color', definition: 'Useful for identification but can be misleading. Many different minerals share the same color.' },
      { term: 'Fossils', definition: 'Preserved remains or traces of ancient organisms. Found mainly in sedimentary rock.' },
      { term: 'Layers / Strata', definition: 'Visible bands in sedimentary rock showing different periods of deposition.' },
      { term: 'Crystals', definition: 'Solid structures with atoms arranged in an orderly, repeating pattern. Slower cooling = larger crystals.' },
    ],
    examples: [
      { term: 'Granite', definition: 'Intrusive igneous rock. Coarse-grained. Made of quartz, feldspar, and mica. Used in countertops and buildings.' },
      { term: 'Basalt', definition: 'Extrusive igneous rock. Fine-grained and dark. Makes up most of the ocean floor.' },
      { term: 'Obsidian', definition: 'Extrusive igneous rock. Glassy texture, forms when lava cools very fast. Used by ancient peoples for tools.' },
      { term: 'Pumice', definition: 'Extrusive igneous rock. Very lightweight with holes from trapped gas bubbles. Can float on water.' },
      { term: 'Sandstone', definition: 'Clastic sedimentary rock made of sand-sized grains cemented together.' },
      { term: 'Limestone', definition: 'Sedimentary rock often made from shells and skeletons of marine organisms. Reacts with acid.' },
      { term: 'Shale', definition: 'Fine-grained sedimentary rock made from compacted mud and clay.' },
      { term: 'Conglomerate', definition: 'Clastic sedimentary rock made of rounded pebbles and gravel cemented together.' },
      { term: 'Marble', definition: 'Non-foliated metamorphic rock formed from limestone. Used in sculptures and buildings.' },
      { term: 'Slate', definition: 'Foliated metamorphic rock formed from shale. Splits into thin, flat sheets.' },
      { term: 'Quartzite', definition: 'Non-foliated metamorphic rock formed from sandstone. Very hard and durable.' },
      { term: 'Gneiss', definition: 'Foliated metamorphic rock with visible light and dark mineral bands.' },
    ],
  };

  const quizQuestionBank = [
    { question: 'What type of rock forms when magma or lava cools and hardens?', options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Mineral'], correct: 2 },
    { question: 'What type of rock is formed from layers of sediment pressed together?', options: ['Igneous', 'Sedimentary', 'Metamorphic', 'Volcanic'], correct: 1 },
    { question: 'What type of rock is changed by heat and pressure?', options: ['Igneous', 'Sedimentary', 'Metamorphic', 'Clastic'], correct: 2 },
    { question: 'Granite is an example of what type of igneous rock?', options: ['Extrusive', 'Intrusive', 'Foliated', 'Clastic'], correct: 1 },
    { question: 'What is the continuous process of rocks changing from one type to another?', options: ['Erosion cycle', 'Water cycle', 'Rock cycle', 'Mineral cycle'], correct: 2 },
    { question: 'What scale is used to measure mineral hardness?', options: ['Richter Scale', 'Mohs Scale', 'pH Scale', 'Beaufort Scale'], correct: 1 },
    { question: 'What type of rock are fossils most commonly found in?', options: ['Igneous', 'Metamorphic', 'Sedimentary', 'All equally'], correct: 2 },
    { question: 'What happens when lava cools very quickly on Earth\'s surface?', options: ['Large crystals form', 'A glassy texture forms', 'Layers form', 'Fossils form'], correct: 1 },
    { question: 'What is the breaking down of rocks into smaller pieces called?', options: ['Erosion', 'Deposition', 'Weathering', 'Compaction'], correct: 2 },
    { question: 'What is the movement of weathered rock by wind, water, or ice called?', options: ['Weathering', 'Deposition', 'Cementation', 'Erosion'], correct: 3 },
    { question: 'Marble is a metamorphic rock that forms from which rock?', options: ['Granite', 'Sandstone', 'Limestone', 'Basalt'], correct: 2 },
    { question: 'Slate is a metamorphic rock that forms from which rock?', options: ['Shale', 'Sandstone', 'Limestone', 'Granite'], correct: 0 },
    { question: 'What property describes how a mineral reflects light?', options: ['Hardness', 'Streak', 'Luster', 'Cleavage'], correct: 2 },
    { question: 'Which mineral is the hardest on the Mohs Scale?', options: ['Quartz', 'Topaz', 'Talc', 'Diamond'], correct: 3 },
    { question: 'What is the color of a mineral\'s powder called?', options: ['Luster', 'Fracture', 'Streak', 'Cleavage'], correct: 2 },
    { question: 'Which igneous rock can float on water?', options: ['Granite', 'Obsidian', 'Basalt', 'Pumice'], correct: 3 },
    { question: 'What makes up most of the ocean floor?', options: ['Granite', 'Sandstone', 'Basalt', 'Marble'], correct: 2 },
    { question: 'What happens to crystal size when magma cools slowly?', options: ['Crystals are smaller', 'Crystals are larger', 'No crystals form', 'Crystals disappear'], correct: 1 },
    { question: 'What is the most abundant mineral group in Earth\'s crust?', options: ['Quartz', 'Mica', 'Feldspar', 'Calcite'], correct: 2 },
    { question: 'Which of these is an organic sedimentary rock?', options: ['Sandstone', 'Rock salt', 'Coal', 'Conglomerate'], correct: 2 },
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

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + currentDeck.length) % currentDeck.length);
    setIsFlipped(false);
  };

  const handleMarkCard = (status) => {
    if (status === 'known') {
      setKnownCards(prev => new Set(prev).add(cardId));
      setReviewCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } else {
      setReviewCards(prev => new Set(prev).add(cardId));
      setKnownCards(prev => {
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
      <div className="bg-stone-100 border-l-4 border-stone-500 p-6 rounded-r-lg">
        <h3 className="text-2xl font-bold mb-2">Rocks & Minerals Study Guide</h3>
        <p>Learn about the three main types of rocks, how they form, the rock cycle, and the properties of minerals. Use the tabs to study flashcards by topic, then test yourself with a randomized quiz!</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="font-bold text-lg mb-2 text-red-800">Igneous Rocks</h4>
          <p className="text-sm mb-2">Formed from cooled magma or lava.</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><strong>Intrusive:</strong> Cools slowly underground (granite)</li>
            <li><strong>Extrusive:</strong> Cools quickly on surface (basalt)</li>
          </ul>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-bold text-lg mb-2 text-amber-800">Sedimentary Rocks</h4>
          <p className="text-sm mb-2">Formed from compacted sediment layers.</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><strong>Clastic:</strong> Rock fragments (sandstone)</li>
            <li><strong>Chemical:</strong> Dissolved minerals (rock salt)</li>
            <li><strong>Organic:</strong> Living remains (coal)</li>
          </ul>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-bold text-lg mb-2 text-purple-800">Metamorphic Rocks</h4>
          <p className="text-sm mb-2">Changed by heat and pressure.</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><strong>Foliated:</strong> Has layers (slate, gneiss)</li>
            <li><strong>Non-Foliated:</strong> No layers (marble)</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-bold text-lg mb-2 text-blue-800">The Rock Cycle</h4>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <span className="bg-red-100 px-3 py-1 rounded-full">Magma</span>
          <span className="text-gray-400">→ cooling →</span>
          <span className="bg-red-200 px-3 py-1 rounded-full">Igneous</span>
          <span className="text-gray-400">→ weathering →</span>
          <span className="bg-amber-100 px-3 py-1 rounded-full">Sediment</span>
          <span className="text-gray-400">→ compaction →</span>
          <span className="bg-amber-200 px-3 py-1 rounded-full">Sedimentary</span>
          <span className="text-gray-400">→ heat & pressure →</span>
          <span className="bg-purple-200 px-3 py-1 rounded-full">Metamorphic</span>
          <span className="text-gray-400">→ melting →</span>
          <span className="bg-red-100 px-3 py-1 rounded-full">Magma</span>
        </div>
        <p className="text-xs text-center mt-2 text-gray-500">Any rock type can become any other type through the rock cycle.</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-bold text-lg mb-2 text-green-800">Identifying Minerals</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="bg-white p-2 rounded"><strong>Luster</strong> — How it reflects light</div>
          <div className="bg-white p-2 rounded"><strong>Hardness</strong> — Scratch resistance (Mohs 1-10)</div>
          <div className="bg-white p-2 rounded"><strong>Streak</strong> — Powder color</div>
          <div className="bg-white p-2 rounded"><strong>Cleavage</strong> — Smooth breaks</div>
          <div className="bg-white p-2 rounded"><strong>Fracture</strong> — Rough breaks</div>
          <div className="bg-white p-2 rounded"><strong>Color</strong> — Can be misleading!</div>
        </div>
      </div>
    </div>
  );

  const renderFlashcards = () => {
    const deckKnown = Array.from(knownCards).filter(id => id.startsWith(activeTab)).length;
    const deckReview = Array.from(reviewCards).filter(id => id.startsWith(activeTab)).length;

    return (
      <div className="space-y-4">
        {currentDeck.length > 0 ? (
          <>
            <div className="text-center text-sm text-gray-600">
              Card {currentCard + 1} of {currentDeck.length}
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="bg-green-100 p-2 rounded">Known: {deckKnown}</div>
              <div className="bg-orange-100 p-2 rounded">Needs Review: {deckReview}</div>
            </div>

            <div className="relative h-64 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`absolute inset-0 w-full h-full flex justify-center items-center bg-white p-6 rounded-lg shadow-lg text-center transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : ''}`}>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{currentDeck[currentCard]?.term}</h3>
                  <p className="text-gray-400 text-sm mt-4">Tap to reveal</p>
                </div>
              </div>
              <div className={`absolute inset-0 w-full h-full flex justify-center items-center bg-stone-700 text-white p-6 rounded-lg shadow-lg text-center transition-opacity duration-300 ${!isFlipped ? 'opacity-0 pointer-events-none' : ''}`}>
                <div>
                  <h4 className="text-lg font-semibold mb-2">{currentDeck[currentCard]?.term}</h4>
                  <p className="text-stone-200 leading-relaxed">{currentDeck[currentCard]?.definition}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button onClick={(e) => { e.stopPropagation(); handleMarkCard('review'); }} className="px-5 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600">
                Don't Know
              </button>
              <button onClick={(e) => { e.stopPropagation(); prevCard(); }} className="px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
                ←
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextCard(); }} className="px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
                →
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleMarkCard('known'); }} className="px-5 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">
                I Know This
              </button>
            </div>

            <div className="flex justify-center">
              <button onClick={resetCardProgress} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Reset Progress</button>
            </div>
          </>
        ) : <p className="text-center text-gray-500">Select a category to study.</p>}
      </div>
    );
  };

  const renderQuiz = () => {
    const { correct, total } = getQuizScore();
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Rocks & Minerals Quiz</h3>
          <p className="text-gray-600">A random set of 10 questions to test your knowledge.</p>
        </div>
        <div className="flex justify-center space-x-4">
          <button onClick={checkQuiz} disabled={showQuizResults} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Check Answers</button>
          <button onClick={startNewQuiz} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">New Quiz</button>
        </div>

        {showQuizResults && (
          <div className={`text-center p-4 rounded-lg ${correct >= 7 ? 'bg-green-100 text-green-800' : correct >= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
            <p className="text-2xl font-bold">You scored {correct} out of {total}!</p>
            <p className="mt-1">
              {correct >= 9 ? 'Rock solid!' :
               correct >= 7 ? 'Great work! Review the ones you missed.' :
               correct >= 5 ? 'Good effort! Keep studying.' :
               'Keep at it! Review the flashcards and try again.'}
            </p>
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
                  let btnClass = 'w-full text-left p-3 rounded border ';
                  if (showQuizResults) {
                    if (isCorrect) btnClass += 'bg-green-200 border-green-400';
                    else if (isSelected) btnClass += 'bg-red-200 border-red-400';
                    else btnClass += 'bg-gray-100 border-gray-300';
                  } else {
                    btnClass += isSelected ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 hover:bg-gray-100';
                  }
                  return (
                    <button key={oIndex} onClick={() => !showQuizResults && handleQuizAnswer(qIndex, oIndex)} className={btnClass} disabled={showQuizResults}>
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
    { id: 'overview', name: 'Overview' },
    { id: 'types', name: 'Rock Types' },
    { id: 'rockcycle', name: 'Rock Cycle' },
    { id: 'minerals', name: 'Minerals' },
    { id: 'properties', name: 'Properties' },
    { id: 'examples', name: 'Rock Examples' },
    { id: 'quiz', name: 'Quiz' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 bg-stone-50 min-h-screen font-sans">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-stone-800">Rocks & Minerals</h1>
        <h2 className="text-xl text-gray-600">Interactive Study Guide</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveTab(cat.id);
              setCurrentCard(0);
              setIsFlipped(false);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-transform duration-200 ${
              activeTab === cat.id
                ? 'bg-stone-700 text-white scale-110'
                : 'bg-stone-500 text-white hover:bg-stone-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'quiz' && renderQuiz()}
        {!['overview', 'quiz'].includes(activeTab) && renderFlashcards()}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Study each topic, then test yourself with the quiz!
        </p>
      </div>
    </div>
  );
}
