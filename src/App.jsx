import { useState } from 'react';

export default function SeasonsStudyApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState(new Set());
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // Study data organized by topics
  const studyData = {
    basics: [
      { term: "Vernal Equinox", definition: "Occurs between winter and summer - spring begins" },
      { term: "Autumnal Equinox", definition: "Occurs between spring and fall - fall begins" },
      { term: "Equinoxes", definition: "Earth not tilting away nor toward the sun - equal day/night" },
      { term: "Summer Solstice", definition: "When the sun is highest in the sky - longest day" },
      { term: "Winter Solstice", definition: "When the sun is lowest in the sky - shortest day" },
      { term: "Tilt of Earth's Axis", definition: "23.5 degrees - the root cause of Earth's seasons" },
      { term: "Two Ways to Measure Sunlight", definition: "1. Angle between sun rays and Earth's surface 2. Length of the day" },
      { term: "Root Cause of Seasons", definition: "The tilt of Earth's axis controls how well sunlight reaches different areas" }
    ],
    earthfacts: [
      { term: "Tilt of Earth's Axis", definition: "23.5 degrees" },
      { term: "Distance Earth to Sun", definition: "150,000,000 km (average)" },
      { term: "Distance Earth to Moon", definition: "384,000 km (average)" },
      { term: "Earth's Orbital Period", definition: "365.24 days (one year)" },
      { term: "Moon's Cycle Period", definition: "29.5 days (phases)" },
      { term: "North Pole", definition: "One end of Earth's axis" },
      { term: "South Pole", definition: "One end of Earth's axis" },
      { term: "Equator", definition: "Halfway between north and south pole" }
    ],
    zones: [
      { term: "Polar Zones", definition: "Within Arctic and Antarctic Circles - 24h day/night on solstices" },
      { term: "Polar Zone Sunlight", definition: "Always nearly horizontal to the ground - stay cold year-round" },
      { term: "Tropical Zones", definition: "Between Tropic of Cancer and Tropic of Capricorn" },
      { term: "Tropical Zone Days", definition: "Change a little bit (up to 13.5 hours) - stay warm year-round" },
      { term: "Tropical Zone Sunlight", definition: "Only area where sun can be completely vertical - hits tropics on solstices" },
      { term: "Temperate Zones", definition: "Middle latitudes between tropical and polar zones" },
      { term: "Temperate Zone Days", definition: "Change medium amount (~15 hours for Virginia)" },
      { term: "Temperate Zone Sunlight", definition: "Moderate angle - not vertical nor horizontal - experiences four seasons" }
    ],
    cycles: [
      { term: "Spring Equinox Date", definition: "March 21 (approximately)" },
      { term: "Summer Solstice Date", definition: "June 21 (approximately)" },
      { term: "Fall Equinox Date", definition: "September 21 (approximately)" },
      { term: "Winter Solstice Date", definition: "December 21 (approximately)" },
      { term: "Northern Hemisphere Summer", definition: "When North Pole tilts toward sun (June 21)" },
      { term: "Northern Hemisphere Winter", definition: "When North Pole tilts away from sun (December 21)" },
      { term: "Southern Hemisphere Seasons", definition: "Opposite of Northern Hemisphere - winter when we have summer" }
    ]
  };

  const quizQuestions = [
    {
      question: "What is the tilt of Earth's axis?",
      options: ["20.5 degrees", "23.5 degrees", "25.5 degrees", "27.5 degrees"],
      correct: 1
    },
    {
      question: "What is the root cause of Earth's seasons?",
      options: ["Distance from sun", "Tilt of Earth's axis", "Solar flares", "Moon's gravity"],
      correct: 1
    },
    {
      question: "When does the summer solstice occur?",
      options: ["March 21", "June 21", "September 21", "December 21"],
      correct: 1
    },
    {
      question: "Which zone experiences 24 hours of daylight on solstices?",
      options: ["Tropical zones", "Temperate zones", "Polar zones", "Equatorial zones"],
      correct: 2
    },
    {
      question: "Where can the sun be completely vertical?",
      options: ["Polar zones only", "Temperate zones only", "Tropical zones only", "All zones"],
      correct: 2
    },
    {
      question: "How long is Earth's orbital period?",
      options: ["365 days", "365.24 days", "366 days", "364 days"],
      correct: 1
    },
    {
      question: "What happens during equinoxes?",
      options: ["Longest day", "Shortest day", "Equal day and night", "Coldest day"],
      correct: 2
    },
    {
      question: "Which zone experiences four normal seasons?",
      options: ["Polar zones", "Tropical zones", "Temperate zones", "Arctic zones"],
      correct: 2
    }
  ];

  const seasonData = [
    { season: "Spring", date: "March 21", position: "Vernal Equinox", description: "Equal day and night, North Pole starting to tilt toward sun" },
    { season: "Summer", date: "June 21", position: "Summer Solstice", description: "Longest day in Northern Hemisphere, North Pole tilted toward sun" },
    { season: "Fall", date: "September 21", position: "Autumnal Equinox", description: "Equal day and night, North Pole starting to tilt away from sun" },
    { season: "Winter", date: "December 21", position: "Winter Solstice", description: "Shortest day in Northern Hemisphere, North Pole tilted away from sun" }
  ];

  const currentDeck = studyData[activeTab] || [];

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setStudiedCards(prev => new Set([...prev, `${activeTab}-${currentCard}`]));
    }
  };

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % currentDeck.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + currentDeck.length) % currentDeck.length);
    setIsFlipped(false);
  };

  const resetCards = () => {
    setCurrentCard(0);
    setIsFlipped(false);
    setStudiedCards(new Set());
  };

  const handleQuizAnswer = (questionIndex, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const checkQuiz = () => {
    setShowQuizResults(true);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  const getQuizScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, index) => {
      if (quizAnswers[index] === q.correct) correct++;
    });
    return { correct, total: quizQuestions.length };
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-6">
        <h3 className="text-2xl font-bold mb-4 text-center">🌍 How Seasons Work</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-blue-800">Key Facts</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded">
                <strong>Earth's Tilt:</strong> 23.5 degrees
              </div>
              <div className="bg-white p-3 rounded">
                <strong>Orbital Period:</strong> 365.24 days
              </div>
              <div className="bg-white p-3 rounded">
                <strong>Root Cause:</strong> Earth's axis tilt controls sunlight
              </div>
              <div className="bg-white p-3 rounded">
                <strong>Distance to Sun:</strong> 150,000,000 km
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-green-800">Season Cycle</h4>
            <div className="space-y-2 text-sm">
              {seasonData.map((season, index) => (
                <div key={index} className="bg-white p-3 rounded flex justify-between">
                  <span className="font-medium">{season.season}</span>
                  <span>{season.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4 text-center">🌎 Climate Zones</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h5 className="font-bold text-blue-800">❄️ Polar Zones</h5>
            <p className="text-sm mt-2">Arctic & Antarctic Circles</p>
            <p className="text-sm">24h day/night on solstices</p>
            <p className="text-sm">Always cold, horizontal sunlight</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h5 className="font-bold text-green-800">🌿 Temperate Zones</h5>
            <p className="text-sm mt-2">Middle latitudes (like Virginia)</p>
            <p className="text-sm">~15 hour day variation</p>
            <p className="text-sm">Four normal seasons</p>
          </div>
          <div className="bg-orange-100 p-4 rounded-lg">
            <h5 className="font-bold text-orange-800">🌴 Tropical Zones</h5>
            <p className="text-sm mt-2">Between Tropic lines</p>
            <p className="text-sm">Up to 13.5 hour days</p>
            <p className="text-sm">Warm year-round, vertical sun</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSimulation = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6">
        <h3 className="text-2xl font-bold mb-4 text-center">🌍 Earth's Seasonal Simulation</h3>
        
        <div className="flex justify-center mb-6">
          <div className="relative w-80 h-80 bg-black rounded-full flex items-center justify-center">
            {/* Sun in center */}
            <div className="absolute w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">☀️</div>
            
            {/* Earth positions */}
            {seasonData.map((season, index) => (
              <div
                key={index}
                className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 cursor-pointer ${
                  simulationStep === index ? 'bg-blue-500 text-white scale-125' : 'bg-blue-300 text-blue-800'
                }`}
                style={{
                  transform: `rotate(${index * 90}deg) translateY(-120px) rotate(-${index * 90}deg)`,
                }}
                onClick={() => setSimulationStep(index)}
              >
                🌍
              </div>
            ))}
            
            {/* Labels */}
            {seasonData.map((season, index) => (
              <div
                key={`label-${index}`}
                className={`absolute text-sm font-semibold transition-opacity ${
                  simulationStep === index ? 'opacity-100' : 'opacity-50'
                }`}
                style={{
                  transform: `rotate(${index * 90}deg) translateY(-150px) rotate(-${index * 90}deg)`,
                }}
              >
                {season.season}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center space-x-2 mb-4">
          {seasonData.map((_, index) => (
            <button
              key={index}
              onClick={() => setSimulationStep(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                simulationStep === index 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {seasonData[index].season}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg p-4">
          <h4 className="font-bold text-lg mb-2">{seasonData[simulationStep].season} - {seasonData[simulationStep].date}</h4>
          <p className="text-sm text-gray-700 mb-2"><strong>{seasonData[simulationStep].position}</strong></p>
          <p className="text-sm">{seasonData[simulationStep].description}</p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setSimulationStep((prev) => (prev + 1) % seasonData.length)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ▶️ Next Season
          </button>
        </div>
      </div>
    </div>
  );

  const renderFlashcards = () => (
    <div className="space-y-6">
      {currentDeck.length > 0 ? (
        <>
          <div className="text-center text-sm text-gray-600">
            Card {currentCard + 1} of {currentDeck.length} | 
            Studied: {Array.from(studiedCards).filter(id => id.startsWith(activeTab)).length}/{currentDeck.length}
          </div>

          <div className="relative">
            <div 
              className={`w-full h-64 rounded-lg shadow-lg cursor-pointer transform transition-transform duration-300 ${isFlipped ? 'rotate-y-180' : ''}`}
              onClick={flipCard}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className={`absolute inset-0 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center p-6 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentDeck[currentCard]?.term}</h3>
                  <p className="text-gray-500">Touch to reveal definition</p>
                </div>
              </div>
              <div className={`absolute inset-0 bg-blue-600 text-white rounded-lg border-2 border-blue-700 flex items-center justify-center p-6 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-3">{currentDeck[currentCard]?.term}</h3>
                  <p className="text-blue-100 leading-relaxed">{currentDeck[currentCard]?.definition}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button onClick={prevCard} className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-lg">← Previous</button>
            <button onClick={flipCard} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg">
              {isFlipped ? 'Hide' : 'Reveal'}
            </button>
            <button onClick={nextCard} className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-lg">Next →</button>
          </div>

          <div className="flex justify-center">
            <button onClick={resetCards} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-lg">🔄 Reset Progress</button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">No flashcards available for this category</div>
      )}
    </div>
  );

  const renderQuiz = () => {
    const { correct, total } = getQuizScore();
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">📝 Seasons Knowledge Quiz</h3>
          <p className="text-blue-700">Test your understanding of seasons, Earth's tilt, and climate zones!</p>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <button onClick={checkQuiz} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg">
            ✓ Check Answers
          </button>
          <button onClick={resetQuiz} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-lg">
            🔄 Reset Quiz
          </button>
        </div>

        {showQuizResults && (
          <div className={`p-6 rounded-lg mb-6 ${percentage >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="text-center">
              <div className="text-3xl font-bold">{correct}/{total} ({percentage}%)</div>
              <div className="mt-2 text-lg">
                {percentage >= 90 ? "Excellent! You've mastered seasons! 🎉" :
                 percentage >= 70 ? "Good work! Review the missed topics. 💪" :
                 "Keep studying! Focus on the basics. 📚"}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {quizQuestions.map((question, qIndex) => (
            <div key={qIndex} className="bg-white rounded-lg p-6 shadow-md">
              <h4 className="font-semibold mb-4 text-lg">{qIndex + 1}. {question.question}</h4>
              <div className="space-y-3">
                {question.options.map((option, oIndex) => {
                  const isSelected = quizAnswers[qIndex] === oIndex;
                  const isCorrect = oIndex === question.correct;
                  const showResult = showQuizResults;
                  
                  let buttonClass = "w-full text-left p-4 rounded border text-lg ";
                  if (showResult) {
                    if (isCorrect) buttonClass += "bg-green-100 border-green-300 text-green-800";
                    else if (isSelected && !isCorrect) buttonClass += "bg-red-100 border-red-300 text-red-800";
                    else buttonClass += "bg-gray-50 border-gray-200";
                  } else {
                    buttonClass += isSelected ? "bg-blue-100 border-blue-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100";
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => !showQuizResults && handleQuizAnswer(qIndex, oIndex)}
                      className={buttonClass}
                      disabled={showQuizResults}
                    >
                      {String.fromCharCode(65 + oIndex)}. {option}
                      {showResult && isCorrect && " ✓"}
                      {showResult && isSelected && !isCorrect && " ✗"}
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
    { id: 'overview', name: '🌍 Overview', color: 'bg-blue-600' },
    { id: 'simulation', name: '🔄 Simulation', color: 'bg-purple-600' },
    { id: 'basics', name: '📚 Seasons Basics', color: 'bg-green-600' },
    { id: 'earthfacts', name: '🌎 Earth Facts', color: 'bg-orange-600' },
    { id: 'zones', name: '🌡️ Climate Zones', color: 'bg-red-600' },
    { id: 'cycles', name: '📅 Seasonal Cycles', color: 'bg-pink-600' },
    { id: 'quiz', name: '📝 Quiz', color: 'bg-indigo-600' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gradient-to-b from-sky-50 to-blue-100 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Earth Science: Seasons</h1>
        <h2 className="text-xl text-gray-600">Interactive Study Guide</h2>
      </div>

      {/* Category Tabs - Mobile Friendly */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setActiveTab(category.id);
              setCurrentCard(0);
              setIsFlipped(false);
            }}
            className={`px-4 py-3 rounded-lg text-white font-medium transition-colors text-sm md:text-base ${
              activeTab === category.id ? category.color : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'simulation' && renderSimulation()}
        {activeTab === 'quiz' && renderQuiz()}
        {!['overview', 'simulation', 'quiz'].includes(activeTab) && renderFlashcards()}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          💡 Study each topic, explore the simulation, then test yourself with the quiz!
        </p>
      </div>
    </div>
  );
}