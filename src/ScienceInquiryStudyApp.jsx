import { useCallback, useEffect, useMemo, useState } from 'react';

/* Unit 1: Thinking Like a Scientist.
 *
 * Built from Rose's four note sheets — Scientific Inquiry Notes, Scientific
 * Method Notes, Measurement Notes, and the Lab Write-Up handout — plus the
 * textbook page on qualitative vs. quantitative observations.
 *
 * The quiz deliberately mirrors the shape of the real test: a true/false
 * section, a multiple-choice section, fill-in-the-blank, and one short answer.
 * Everything but the short answer grades itself; the short answer shows a
 * model answer and she marks her own. */

// --- FLASHCARD DECKS ---

const DECKS = {
  inquiry: [
    {
      term: 'Scientific Inquiry',
      definition:
        'The diverse ways in which scientists study and investigate our world with wonder.',
    },
    {
      term: 'Scientific Method',
      definition: 'The method used to conduct experiments.',
    },
    {
      term: 'Engineering Design Process',
      definition: 'The method used to create prototypes.',
    },
    {
      term: 'Observation',
      definition:
        'Using your senses to gather information around you — sight, smell, touch, taste, and hearing.',
    },
    {
      term: 'Examination',
      definition: 'An extended, focused observation.',
    },
    {
      term: 'Properties / Characteristics',
      definition:
        'What you are looking at when you observe. Observing an object means looking at its characteristics or properties.',
    },
    {
      term: 'Data',
      definition: 'Facts, figures, and other evidence gathered through observation.',
    },
    {
      term: 'Quantitative',
      definition:
        'Describes something using a measurement — you need a measuring tool. Example: "The pie weighs one pound."',
    },
    {
      term: 'Qualitative',
      definition:
        'Describes what something is like using your senses. Example: "The pie is round, sweet, and soft."',
    },
    {
      term: 'Inference',
      definition: 'A suggestion or possible explanation for an observation.',
    },
    {
      term: 'Predict',
      definition: 'State what you think will happen based on past observations; a forecast.',
    },
    {
      term: 'Estimate',
      definition: 'A careful guess when measurements are not needed or are difficult to obtain.',
    },
    {
      term: 'Measure',
      definition: 'Describe the amount of an observation, usually in quantitative terms.',
    },
    {
      term: 'Identify',
      definition: 'After recognition, to name a person, place, or thing.',
    },
    {
      term: 'Classify',
      definition: 'Group things by how they are alike.',
    },
    {
      term: 'Hypothesize',
      definition:
        'Suggest an answer to a problem based on information, usually written in "if / then / because" format. Then test to support your hypothesis or not.',
    },
    {
      term: 'Record and Organize',
      definition: 'Keeping a good record of your work — like your lab book.',
    },
    {
      term: 'Analyze',
      definition: 'Looking for trends or patterns in data, often using charts and graphs.',
    },
  ],

  method: [
    {
      term: 'Steps of the Scientific Method',
      definition:
        'State the Problem → Research Known Data → Hypothesize or Predict → Plan and Conduct the Experiment → Record and Analyze Data → Make Conclusions.',
    },
    {
      term: 'Controlled Experiment',
      definition: 'An experiment in which all variables except one remain the same.',
    },
    {
      term: 'Experimental Group',
      definition: 'The setup that CONTAINS the variable being tested.',
    },
    {
      term: 'Control Group',
      definition: 'The setup WITHOUT the variable being tested.',
    },
    {
      term: 'Constant',
      definition: 'Factors that stay the same in an experiment.',
    },
    {
      term: 'Variable',
      definition: 'Factors that change during an experiment.',
    },
    {
      term: 'Independent Variable',
      definition:
        'What you, the experimenter, change or enact in order to do your experiment. Remember: "I do or change."',
    },
    {
      term: 'Dependent Variable',
      definition:
        'What changes when the independent variable changes — it depends on the outcome of the independent variable. This is the DATA.',
    },
    {
      term: 'Observations → Facts → Theories',
      definition: 'The path that scientific knowledge follows as evidence builds up.',
    },
    {
      term: 'Theory',
      definition:
        'Explains why and how something happened, with the support of many observations.',
    },
    {
      term: 'Law',
      definition:
        'When all observations support it after being tested over and over. Laws can be expressed in a mathematical formula — math is the language of science.',
    },
    {
      term: 'Consensus',
      definition:
        'The best solution the group can achieve at the time, based on the current and understood science of the time. It is NOT what everyone agrees to, and NOT the preference of the majority. It requires the good work of many scientists.',
    },
  ],

  measurement: [
    {
      term: 'Metric System',
      definition: 'A decimal based form of measurement — the system we use in science.',
    },
    {
      term: 'SI',
      definition:
        'The International System of Units. Abbreviated SI from "systeme internationale," the French version of the name.',
    },
    {
      term: 'Length',
      definition:
        'The distance from one end of an object to another. Base unit: the METER. Tools: meter sticks, rulers, tape measures.',
    },
    {
      term: 'Time',
      definition:
        'Used to sequence events, compare the duration of events, and quantify rates of change. Base unit: the SECOND. Tool: digital stopwatch (hourglasses and sundials are older methods).',
    },
    {
      term: 'Mass',
      definition:
        'The amount of matter in something. Base unit: the KILOGRAM (kg). Tools: triple beam balance or electronic balance.',
    },
    {
      term: 'Mass vs. Weight',
      definition:
        'Careful — they are not the same! Mass is the amount of matter in an object. Weight is the pull of gravity on an object.',
    },
    {
      term: 'Temperature',
      definition:
        'A measure of the average heat or thermal energy of the particles in a substance. Because it is an average, it does NOT depend on the number of particles. SI uses Kelvin; we use degrees Celsius (°C). Tools: thermometer and digital probes.',
    },
    {
      term: 'Volume',
      definition:
        'The three dimensional space that something fills. Liquid volume base unit: the LITER (L or l). Tool: graduated cylinder.',
    },
    {
      term: 'Graduation Marks',
      definition:
        'The measuring lines on a graduated cylinder or beaker — the marks you read your measurement from.',
    },
    {
      term: 'Lab Glassware',
      definition:
        'Beakers and Erlenmeyer flasks hold liquids, but the graduated cylinder is the accurate tool for MEASURING liquid volume.',
    },
  ],

  lab: [
    {
      term: 'Habits',
      definition:
        'Not a written section, but part of every lab grade: observe safety precautions, use correct techniques, assist your partner or others when appropriate, clean up your lab work area, and maintain quality written work.',
    },
    {
      term: 'Title',
      definition: 'Placed in the center at the top of your page AND in the table of contents.',
    },
    {
      term: 'Date',
      definition: 'Placed on the line at the top right of the page.',
    },
    {
      term: 'Purpose',
      definition:
        'The reason we are conducting the lab. Found on the board the day of the lab and written down before we begin.',
    },
    {
      term: 'Hypothesis or Prediction',
      definition:
        'Completed BEFORE the lab. States what you think will happen based on your background knowledge or research, using the if... then... because format. A prediction may be used when testing prototypes.',
    },
    {
      term: 'Materials',
      definition: 'The complete list of specific materials needed to complete the lab.',
    },
    {
      term: 'Procedure',
      definition: 'The step by step instructions needed to complete the lab.',
    },
    {
      term: 'Results',
      definition: 'The presentation of your collected data. This section could contain a chart or a graph.',
    },
    {
      term: 'Conclusion',
      definition:
        'Summarizes your experiment, answers any questions, and further explains your results. Reflections about the lab and error analysis go here too, if appropriate.',
    },
    {
      term: 'Order of the Write-Up',
      definition:
        'Title → Date → Purpose → Hypothesis/Prediction → Materials → Procedure → Results → Conclusion.',
    },
  ],
};

// --- QUAL vs. QUANT SORTING DRILL ---

const OBSERVATIONS = [
  { text: 'The pie is round.', kind: 'qualitative' },
  { text: 'The pie weighs one pound.', kind: 'quantitative' },
  { text: 'The rock is rough and bumpy.', kind: 'qualitative' },
  { text: 'The rock has a mass of 250 grams.', kind: 'quantitative' },
  { text: 'The liquid smells like lemons.', kind: 'qualitative' },
  { text: 'There are 24 students in the class.', kind: 'quantitative' },
  { text: 'The water is 22 degrees Celsius.', kind: 'quantitative' },
  { text: 'The leaf is bright green.', kind: 'qualitative' },
  { text: 'The plant grew 5 centimeters in one week.', kind: 'quantitative' },
  { text: 'The soup tastes salty.', kind: 'qualitative' },
  { text: 'The classroom is loud.', kind: 'qualitative' },
  { text: 'The beaker holds 250 mL of water.', kind: 'quantitative' },
  { text: 'The puppy is soft and fluffy.', kind: 'qualitative' },
  { text: 'The race took 12.4 seconds.', kind: 'quantitative' },
  { text: 'The desk is 1.2 meters long.', kind: 'quantitative' },
  { text: 'The apple is sweet and crunchy.', kind: 'qualitative' },
];

// --- QUIZ BANK ---
// type: 'tf' | 'mc' | 'fill' | 'short'

const QUIZ_BANK = [
  // ---- True / False ----
  { type: 'tf', question: 'Mass and weight mean the same thing.', answer: false, why: 'Mass is the amount of matter in an object; weight is the pull of gravity on an object.' },
  { type: 'tf', question: 'An extended, focused observation is called an examination.', answer: true },
  { type: 'tf', question: 'Qualitative observations are made using measurement tools.', answer: false, why: 'Qualitative observations use your senses. QUANTITATIVE observations use measurement tools.' },
  { type: 'tf', question: 'Temperature depends on the number of particles in an object.', answer: false, why: 'Temperature is an AVERAGE measurement, so it does not depend on how many particles there are.' },
  { type: 'tf', question: 'The base unit of length is the meter.', answer: true },
  { type: 'tf', question: 'A hypothesis is written after the experiment is finished.', answer: false, why: 'The hypothesis or prediction is completed BEFORE the lab.' },
  { type: 'tf', question: 'Consensus means whatever the majority of scientists prefer.', answer: false, why: 'Consensus is NOT the preference of the majority and NOT what everyone agrees to — it is the best solution the group can achieve based on the current science.' },
  { type: 'tf', question: 'The control group is the setup WITHOUT the variable being tested.', answer: true },
  { type: 'tf', question: 'Constants are the factors that stay the same in an experiment.', answer: true },
  { type: 'tf', question: 'The Engineering Design Process is the method used to conduct experiments.', answer: false, why: 'The Engineering Design Process is used to create PROTOTYPES. The Scientific Method is used to conduct experiments.' },
  { type: 'tf', question: 'Math is called the language of science.', answer: true },
  { type: 'tf', question: 'Habits are one of the written sections of your lab write-up.', answer: false, why: 'Habits are not written, but they are still part of each lab grade.' },
  { type: 'tf', question: 'The title of a lab goes in the table of contents as well as the top of the page.', answer: true },
  { type: 'tf', question: 'Liters are the base unit for measuring liquid volume.', answer: true },
  { type: 'tf', question: 'To analyze data means to look for trends or patterns in it.', answer: true },
  { type: 'tf', question: 'In a controlled experiment, all of the variables change at the same time.', answer: false, why: 'In a controlled experiment all variables except ONE remain the same.' },
  { type: 'tf', question: 'An inference is a suggestion or possible explanation for an observation.', answer: true },

  // ---- Multiple Choice ----
  {
    type: 'mc',
    question: 'Which of these is a QUALITATIVE observation?',
    options: ['The pie weighs one pound.', 'The pie is round and sweet.', 'The pie is 9 inches across.', 'The pie baked for 45 minutes.'],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'Which of these is a QUANTITATIVE observation?',
    options: ['The water feels cold.', 'The water looks cloudy.', 'The water is 22 degrees Celsius.', 'The water smells like chlorine.'],
    correct: 2,
  },
  {
    type: 'mc',
    question: 'What is an inference?',
    options: [
      'A careful guess when measurements are hard to obtain',
      'A suggestion or possible explanation for an observation',
      'Grouping things by how they are alike',
      'The amount of matter in an object',
    ],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'Which method is used to create prototypes?',
    options: ['The Scientific Method', 'The Engineering Design Process', 'Scientific Consensus', 'The Metric System'],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'Which tool would you use to accurately measure liquid volume?',
    options: ['A beaker', 'An Erlenmeyer flask', 'A graduated cylinder', 'A triple beam balance'],
    correct: 2,
  },
  {
    type: 'mc',
    question: 'What is the SI base unit of mass?',
    options: ['The pound', 'The gram', 'The liter', 'The kilogram'],
    correct: 3,
  },
  {
    type: 'mc',
    question: 'In a controlled experiment, how many variables are allowed to change?',
    options: ['None', 'One', 'Two', 'All of them'],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'Which variable is the one that "I do or change"?',
    options: ['The dependent variable', 'The constant', 'The independent variable', 'The control group'],
    correct: 2,
  },
  {
    type: 'mc',
    question: 'The dependent variable is also known as:',
    options: ['The data', 'The constant', 'The problem', 'The procedure'],
    correct: 0,
  },
  {
    type: 'mc',
    question: 'What does a THEORY do?',
    options: [
      'Guesses an answer before any testing',
      'Explains why and how something happened with the support of many observations',
      'Lists the materials needed for a lab',
      'Measures the average thermal energy of particles',
    ],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'Which one can be expressed in a mathematical formula?',
    options: ['A hypothesis', 'An observation', 'A law', 'An estimate'],
    correct: 2,
  },
  {
    type: 'mc',
    question: 'Which statement best describes CONSENSUS?',
    options: [
      'Everyone agrees completely',
      'Whatever most scientists prefer',
      'The best solution the group can achieve at the time based on current science',
      'A single scientist proving an idea alone',
    ],
    correct: 2,
  },
  {
    type: 'mc',
    question: 'Where does the DATE go on a lab write-up?',
    options: ['Centered at the top', 'On the line at the top right of the page', 'At the bottom of the page', 'Only in the table of contents'],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'Which lab write-up section is completed BEFORE the lab begins?',
    options: ['Results', 'Conclusion', 'Hypothesis or Prediction', 'Error analysis'],
    correct: 2,
  },
  {
    type: 'mc',
    question: 'Which lab write-up section could contain a chart or a graph?',
    options: ['Materials', 'Procedure', 'Results', 'Title'],
    correct: 2,
  },
  {
    type: 'mc',
    question: 'What is an examination?',
    options: ['A quick glance at an object', 'An extended, focused observation', 'A written test', 'A guess about the future'],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'An ESTIMATE is best described as:',
    options: [
      'A careful guess when measurements are not needed or are difficult to obtain',
      'An exact measurement taken with a tool',
      'A trend found in a set of data',
      'An explanation for an observation',
    ],
    correct: 0,
  },
  {
    type: 'mc',
    question: 'Temperature is a measure of:',
    options: [
      'The number of particles in a substance',
      'The average heat or thermal energy of the particles in a substance',
      'The space a substance fills',
      'The pull of gravity on a substance',
    ],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'What is the FIRST step of the Scientific Method?',
    options: ['Hypothesize or Predict', 'State the Problem', 'Research Known Data', 'Make Conclusions'],
    correct: 1,
  },
  {
    type: 'mc',
    question: 'Which of these is NOT one of the senses used to make an observation?',
    options: ['Sight', 'Smell', 'Measuring', 'Hearing'],
    correct: 2,
  },

  // ---- Fill in the Blank ----
  { type: 'fill', question: 'The base unit of mass is the __________.', accept: ['kilogram', 'kilograms', 'kg'] },
  { type: 'fill', question: 'The base unit of length is the __________.', accept: ['meter', 'meters', 'metre', 'm'] },
  { type: 'fill', question: 'The base unit of time is the __________.', accept: ['second', 'seconds', 'sec', 's'] },
  { type: 'fill', question: 'We measure liquid volume with a __________.', accept: ['graduated cylinder', 'graduated cylinders'] },
  { type: 'fill', question: 'SI stands for the __________ System of Units.', accept: ['international'] },
  { type: 'fill', question: 'A hypothesis is written in the if / then / __________ format.', accept: ['because'] },
  { type: 'fill', question: '__________ data describes something using a measurement.', accept: ['quantitative'] },
  { type: 'fill', question: '__________ data describes what something is like using your senses.', accept: ['qualitative'] },
  { type: 'fill', question: 'The __________ variable is what I do or change.', accept: ['independent'] },
  { type: 'fill', question: 'The __________ variable is the data — it changes when the other variable changes.', accept: ['dependent'] },
  { type: 'fill', question: 'We measure temperature with a __________.', accept: ['thermometer', 'thermometers', 'thermometer and digital probes', 'digital probe'] },
  { type: 'fill', question: 'In a lab write-up, the __________ is the reason we are conducting the lab.', accept: ['purpose'] },
  { type: 'fill', question: 'A(n) __________ is a suggestion or possible explanation for an observation.', accept: ['inference'] },
  { type: 'fill', question: 'To __________ means to group things by how they are alike.', accept: ['classify', 'classifying'] },
  { type: 'fill', question: 'The metric system is a __________ based form of measurement.', accept: ['decimal'] },
  { type: 'fill', question: 'Weight is the pull of __________ on an object.', accept: ['gravity'] },
  { type: 'fill', question: 'Mass is used to measure the amount of __________ in something.', accept: ['matter'] },
  { type: 'fill', question: 'An extended, focused observation is called an __________.', accept: ['examination'] },
  { type: 'fill', question: 'Volume is the three dimensional __________ that something fills.', accept: ['space'] },
  { type: 'fill', question: 'Factors that stay the same in an experiment are called __________.', accept: ['constants', 'constant'] },

  // ---- Short Answer ----
  {
    type: 'short',
    question: 'What is the difference between mass and weight?',
    model:
      'Mass is the amount of matter in an object and its base unit is the kilogram. Weight is the pull of gravity on an object, so weight can change but mass stays the same.',
  },
  {
    type: 'short',
    question: 'List the steps of the Scientific Method in order.',
    model:
      'State the Problem → Research Known Data → Hypothesize or Predict → Plan and Conduct the Experiment → Record and Analyze Data → Make Conclusions.',
  },
  {
    type: 'short',
    question:
      'Write a hypothesis about a plant and sunlight using the if / then / because format.',
    model:
      'If a plant is given more sunlight, then it will grow taller, because plants use sunlight to make the food they need to grow.',
  },
  {
    type: 'short',
    question:
      'Explain the difference between a qualitative and a quantitative observation, and give one example of each.',
    model:
      'A qualitative observation describes what something is like using your senses — "the pie is round." A quantitative observation describes something using a measurement — "the pie weighs one pound."',
  },
  {
    type: 'short',
    question: 'What is consensus, and what is it NOT?',
    model:
      'Consensus is the best solution the group of scientists can achieve at the time, based on the current and understood science of the time. It is NOT what everyone agrees to, and it is NOT the preference of the majority. It requires the good work of many scientists.',
  },
  {
    type: 'short',
    question: 'Name the sections of a lab write-up in order.',
    model:
      'Title, Date, Purpose, Hypothesis or Prediction, Materials, Procedure, Results, Conclusion. (Habits are graded too, but they are not a written section.)',
  },
  {
    type: 'short',
    question: 'What is the difference between the control group and the experimental group?',
    model:
      'The experimental group is the setup that CONTAINS the variable being tested. The control group is the setup WITHOUT that variable, so you have something to compare your results to.',
  },
  {
    type: 'short',
    question: 'Why does temperature NOT depend on the number of particles in an object?',
    model:
      'Because temperature is a measure of the AVERAGE heat or thermal energy of the particles. An average does not change just because there are more particles.',
  },
  {
    type: 'short',
    question: 'List four habits of a quality scientist.',
    model:
      'Observes safety precautions, uses correct techniques when engaging procedures, assists a partner or others when appropriate, cleans up the lab work area, and maintains quality written work.',
  },
  {
    type: 'short',
    question: 'What is the difference between a theory and a law?',
    model:
      'A theory explains why and how something happened with the support of many observations. A law is when all observations support it after being tested over and over, and a law can be expressed in a mathematical formula.',
  },
];

/* A real test has sections, so the quiz is built section by section rather
 * than as one shuffled pile. Ten questions total. */
const QUIZ_BLUEPRINT = [
  { type: 'tf', count: 3, heading: 'Part I — True or False' },
  { type: 'mc', count: 4, heading: 'Part II — Multiple Choice' },
  { type: 'fill', count: 2, heading: 'Part III — Fill in the Blank' },
  { type: 'short', count: 1, heading: 'Part IV — Short Answer' },
];

// --- HELPERS ---

function shuffle(array) {
  return [...array].sort(() => 0.5 - Math.random());
}

/* Forgiving comparison for fill-in-the-blank: case, spacing, and punctuation
 * shouldn't cost her the point. Spelling still has to be right. */
function normalize(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildQuiz() {
  const picked = [];
  QUIZ_BLUEPRINT.forEach(({ type, count }) => {
    picked.push(...shuffle(QUIZ_BANK.filter((q) => q.type === type)).slice(0, count));
  });
  return picked;
}

function isAnswerCorrect(question, answer, selfGrade) {
  switch (question.type) {
    case 'mc':
      return answer === question.correct;
    case 'tf':
      return answer === question.answer;
    case 'fill':
      return question.accept.some((a) => normalize(a) === normalize(answer));
    case 'short':
      return selfGrade === true;
    default:
      return false;
  }
}

const DECK_TABS = [
  { id: 'inquiry', name: '🔍 Inquiry Words' },
  { id: 'method', name: '⚗️ Sci. Method' },
  { id: 'measurement', name: '📏 Measurement' },
  { id: 'lab', name: '🧪 Lab Write-Up' },
];

const TABS = [
  { id: 'overview', name: '📖 Overview' },
  ...DECK_TABS,
  { id: 'sort', name: '⚖️ Qual or Quant' },
  { id: 'quiz', name: '📝 Practice Test' },
];

export default function ScienceInquiryStudyApp() {
  const [activeTab, setActiveTab] = useState('overview');

  // Flashcards
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const [reviewCards, setReviewCards] = useState(new Set());

  // Qualitative / quantitative drill
  const [drillOrder, setDrillOrder] = useState(() => shuffle(OBSERVATIONS));
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillPick, setDrillPick] = useState(null);
  const [drillScore, setDrillScore] = useState({ right: 0, wrong: 0 });

  // Quiz
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [selfGrades, setSelfGrades] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const startNewQuiz = useCallback(() => {
    setCurrentQuiz(buildQuiz());
    setQuizAnswers({});
    setSelfGrades({});
    setShowQuizResults(false);
  }, []);

  useEffect(() => {
    startNewQuiz();
  }, [startNewQuiz]);

  const deck = DECKS[activeTab] || [];
  const card = deck[currentCard];
  const cardId = card ? `${activeTab}-${card.term}` : null;

  const nextCard = () => {
    if (deck.length === 0) return;
    setCurrentCard((prev) => (prev + 1) % deck.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    if (deck.length === 0) return;
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

  // Switching decks starts at the front of the new deck.
  const selectTab = (id) => {
    setActiveTab(id);
    if (DECKS[id]) {
      setCurrentCard(0);
      setIsFlipped(false);
    }
  };

  const drillCard = drillOrder[drillIndex];

  const answerDrill = (kind) => {
    if (drillPick || !drillCard) return;
    setDrillPick(kind);
    setDrillScore((prev) =>
      kind === drillCard.kind
        ? { ...prev, right: prev.right + 1 }
        : { ...prev, wrong: prev.wrong + 1 },
    );
  };

  const nextDrill = () => {
    setDrillPick(null);
    setDrillIndex((prev) => (prev + 1) % drillOrder.length);
  };

  const resetDrill = () => {
    setDrillOrder(shuffle(OBSERVATIONS));
    setDrillIndex(0);
    setDrillPick(null);
    setDrillScore({ right: 0, wrong: 0 });
  };

  const setAnswer = (index, value) =>
    setQuizAnswers((prev) => ({ ...prev, [index]: value }));

  const quizScore = useMemo(() => {
    let correct = 0;
    currentQuiz.forEach((q, i) => {
      if (isAnswerCorrect(q, quizAnswers[i], selfGrades[i])) correct++;
    });
    return { correct, total: currentQuiz.length };
  }, [currentQuiz, quizAnswers, selfGrades]);

  // --- RENDER: OVERVIEW ---

  const renderOverview = () => (
    <div className="space-y-6 text-gray-800">
      <div className="rounded-r-lg border-l-4 border-teal-600 bg-teal-100 p-6">
        <h3 className="mb-2 text-2xl font-bold">🔬 Unit 1: Thinking Like a Scientist</h3>
        <p>
          Everything from your Scientific Inquiry, Scientific Method, Measurement, and Lab
          Write-Up notes. Flip through the note cards by topic, drill qualitative vs.
          quantitative, then take a practice test with true/false, multiple choice, fill in the
          blank, and short answer — just like the real one.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-cyan-50 p-4">
          <h4 className="mb-2 text-lg font-bold">Steps of the Scientific Method</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm">
            <li>State the Problem</li>
            <li>Research Known Data</li>
            <li>Hypothesize or Predict</li>
            <li>Plan and Conduct the Experiment</li>
            <li>Record and Analyze Data</li>
            <li>Make Conclusions</li>
          </ol>
          <p className="mt-2 text-xs text-gray-700">
            Observations → Facts → Theories
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 p-4">
          <h4 className="mb-2 text-lg font-bold">Lab Write-Up, in Order</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm">
            <li>Title — centered on top &amp; in the table of contents</li>
            <li>Date — line at the top right</li>
            <li>Purpose — why we are doing the lab</li>
            <li>Hypothesis/Prediction — if… then… because</li>
            <li>Materials</li>
            <li>Procedure</li>
            <li>Results — may hold a chart or graph</li>
            <li>Conclusion — plus reflections &amp; error analysis</li>
          </ol>
          <p className="mt-2 text-xs text-gray-700">
            ⭐ Habits are graded but never written: safety, correct technique, helping your
            partner, cleaning up, quality written work.
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-4">
          <h4 className="mb-2 text-lg font-bold">Qualitative vs. Quantitative</h4>
          <p className="text-sm">
            <span className="font-semibold">Qualitative</span> — describes what something is
            like using your <em>senses</em>. “The pie is round.”
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Quantitative</span> — describes something using a{' '}
            <em>measurement</em>. “The pie weighs one pound.”
          </p>
          <p className="mt-2 text-xs text-gray-700">
            Trick: quaNTitative has a <strong>N</strong>umber in it.
          </p>
        </div>

        <div className="rounded-lg bg-rose-50 p-4">
          <h4 className="mb-2 text-lg font-bold">Variables</h4>
          <p className="text-sm">
            <span className="font-semibold">Independent</span> — what <strong>I do or change</strong>.
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Dependent</span> — what changes because of it. This is{' '}
            <strong>the data</strong>.
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Constant</span> — stays the same.
          </p>
          <p className="mt-2 text-xs text-gray-700">
            A controlled experiment keeps every variable the same except one.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <caption className="p-3 text-left text-lg font-bold">
            Measurement Cheat Sheet (Metric / SI)
          </caption>
          <thead className="bg-teal-700 text-white">
            <tr>
              <th className="p-3">Measures</th>
              <th className="p-3">Base Unit</th>
              <th className="p-3">Tool</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-100">
            <tr>
              <td className="p-3 font-semibold">Length</td>
              <td className="p-3">meter (m)</td>
              <td className="p-3">meter stick, ruler, tape measure</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Time</td>
              <td className="p-3">second (s)</td>
              <td className="p-3">digital stopwatch</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Mass</td>
              <td className="p-3">kilogram (kg)</td>
              <td className="p-3">triple beam or electronic balance</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Temperature</td>
              <td className="p-3">Kelvin in SI; we use °Celsius</td>
              <td className="p-3">thermometer, digital probe</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Liquid Volume</td>
              <td className="p-3">liter (L)</td>
              <td className="p-3">graduated cylinder</td>
            </tr>
          </tbody>
        </table>
        <p className="p-3 pt-0 text-xs text-gray-700">
          SI = the International System of Units, from the French <em>systeme internationale</em>.
          The metric system is decimal based. Mass is the amount of matter; weight is the pull of
          gravity.
        </p>
      </div>
    </div>
  );

  // --- RENDER: FLASHCARDS ---

  const renderFlashcards = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center text-sm text-gray-700">
        <div className="rounded bg-green-100 p-2">✅ Known: {knownCards.size}</div>
        <div className="rounded bg-orange-100 p-2">🤔 Review: {reviewCards.size}</div>
        <div className="rounded bg-teal-100 p-2">
          Card {deck.length ? currentCard + 1 : 0} / {deck.length}
        </div>
      </div>

      <div className="relative h-72" onClick={() => setIsFlipped(!isFlipped)}>
        <div
          className={`absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-white p-6 text-center shadow-lg transition-opacity duration-300 ${
            isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div>
            <h3 className="text-3xl font-bold text-teal-800">{card?.term}</h3>
            <p className="mt-3 text-xs text-gray-500">(tap to see the definition)</p>
          </div>
        </div>
        <div
          className={`absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-teal-800 p-6 text-center text-white shadow-lg transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <p className="text-lg">{card?.definition}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={prevCard}
          className="min-h-[44px] rounded-lg bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
        >
          ← Prev
        </button>
        <button
          onClick={() => handleMarkCard('review')}
          className="min-h-[44px] rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600"
        >
          🤔 Review Again
        </button>
        <button
          onClick={() => handleMarkCard('known')}
          className="min-h-[44px] rounded-lg bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-600"
        >
          ✅ I Knew This
        </button>
        <button
          onClick={nextCard}
          className="min-h-[44px] rounded-lg bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
        >
          Next →
        </button>
      </div>

      <div className="flex justify-center">
        <button
          onClick={resetCardProgress}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          🔄 Reset Progress
        </button>
      </div>

      <ul className="divide-y divide-teal-100 rounded-lg bg-white shadow">
        {deck.map((entry, i) => (
          <li
            key={entry.term}
            className={`cursor-pointer p-3 text-sm hover:bg-teal-50 ${
              i === currentCard ? 'bg-teal-50' : ''
            }`}
            onClick={() => {
              setCurrentCard(i);
              setIsFlipped(false);
            }}
          >
            <span className="font-bold text-teal-800">{entry.term}</span>
            <span className="text-gray-700"> — {entry.definition}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // --- RENDER: QUAL / QUANT DRILL ---

  const renderSort = () => {
    const answered = drillPick !== null;
    const gotIt = answered && drillPick === drillCard.kind;
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Qualitative or Quantitative?</h3>
          <p className="text-gray-600">
            Read the observation and tap which kind it is. Senses = qualitative. Measurement =
            quantitative.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm text-gray-700">
          <div className="rounded bg-green-100 p-2">✅ Right: {drillScore.right}</div>
          <div className="rounded bg-red-100 p-2">❌ Wrong: {drillScore.wrong}</div>
          <div className="rounded bg-teal-100 p-2">
            {drillIndex + 1} / {drillOrder.length}
          </div>
        </div>

        <div className="flex min-h-[9rem] items-center justify-center rounded-lg bg-white p-6 text-center shadow">
          <p className="text-2xl font-medium text-gray-800">“{drillCard?.text}”</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => answerDrill('qualitative')}
            disabled={answered}
            className={`min-h-[44px] rounded-lg px-4 py-3 font-bold text-white ${
              !answered
                ? 'bg-sky-600 hover:bg-sky-700'
                : drillCard.kind === 'qualitative'
                  ? 'bg-green-600'
                  : drillPick === 'qualitative'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
            }`}
          >
            👀 Qualitative (senses)
          </button>
          <button
            onClick={() => answerDrill('quantitative')}
            disabled={answered}
            className={`min-h-[44px] rounded-lg px-4 py-3 font-bold text-white ${
              !answered
                ? 'bg-purple-600 hover:bg-purple-700'
                : drillCard.kind === 'quantitative'
                  ? 'bg-green-600'
                  : drillPick === 'quantitative'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
            }`}
          >
            📏 Quantitative (measurement)
          </button>
        </div>

        {answered && (
          <div
            className={`rounded-lg p-4 text-center ${
              gotIt ? 'bg-green-100 text-green-900' : 'bg-orange-100 text-orange-900'
            }`}
          >
            <p className="font-bold">
              {gotIt ? '✅ Correct!' : `❌ That one is ${drillCard.kind}.`}
            </p>
            <p className="mt-1 text-sm">
              {drillCard.kind === 'qualitative'
                ? 'It describes what something is LIKE using the senses — no measuring tool needed.'
                : 'It uses a number from a measuring tool, so it is quantitative.'}
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={nextDrill}
            disabled={!answered}
            className="min-h-[44px] rounded-lg bg-teal-700 px-6 py-2 font-semibold text-white hover:bg-teal-800 disabled:bg-gray-400"
          >
            Next Observation →
          </button>
          <button
            onClick={resetDrill}
            className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            🔄 Start Over
          </button>
        </div>
      </div>
    );
  };

  // --- RENDER: QUIZ ---

  const renderQuestion = (q, qIndex) => {
    const answer = quizAnswers[qIndex];
    const correct = isAnswerCorrect(q, answer, selfGrades[qIndex]);

    if (q.type === 'mc') {
      return (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {q.options.map((option, oIndex) => {
            const isSelected = answer === oIndex;
            const isRight = oIndex === q.correct;
            let cls = 'w-full min-h-[44px] text-left p-3 rounded border ';
            if (showQuizResults) {
              if (isRight) cls += 'bg-green-200 border-green-400';
              else if (isSelected) cls += 'bg-red-200 border-red-400';
              else cls += 'bg-gray-100 border-gray-300';
            } else {
              cls += isSelected
                ? 'bg-teal-100 border-teal-400'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100';
            }
            return (
              <button
                key={option}
                onClick={() => !showQuizResults && setAnswer(qIndex, oIndex)}
                className={cls}
                disabled={showQuizResults}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'tf') {
      return (
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((value) => {
            const isSelected = answer === value;
            const isRight = value === q.answer;
            let cls = 'min-h-[44px] rounded border p-3 font-semibold ';
            if (showQuizResults) {
              if (isRight) cls += 'bg-green-200 border-green-400';
              else if (isSelected) cls += 'bg-red-200 border-red-400';
              else cls += 'bg-gray-100 border-gray-300';
            } else {
              cls += isSelected
                ? 'bg-teal-100 border-teal-400'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100';
            }
            return (
              <button
                key={String(value)}
                onClick={() => !showQuizResults && setAnswer(qIndex, value)}
                className={cls}
                disabled={showQuizResults}
              >
                {value ? '✔️ True' : '✖️ False'}
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'fill') {
      return (
        <div>
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => setAnswer(qIndex, e.target.value)}
            disabled={showQuizResults}
            placeholder="Type your answer"
            className={`min-h-[44px] w-full rounded border p-3 ${
              showQuizResults
                ? correct
                  ? 'border-green-400 bg-green-100'
                  : 'border-red-400 bg-red-100'
                : 'border-gray-300 bg-white'
            }`}
          />
          {showQuizResults && !correct && (
            <p className="mt-2 text-sm text-gray-800">
              ✅ Answer: <span className="font-bold">{q.accept[0]}</span>
            </p>
          )}
        </div>
      );
    }

    // short answer
    return (
      <div>
        <textarea
          rows={3}
          value={answer || ''}
          onChange={(e) => setAnswer(qIndex, e.target.value)}
          disabled={showQuizResults}
          placeholder="Write your answer in a sentence or two"
          className="w-full rounded border border-gray-300 bg-white p-3"
        />
        {showQuizResults && (
          <div className="mt-3 rounded-lg bg-teal-50 p-3">
            <p className="text-sm">
              <span className="font-bold">Model answer:</span> {q.model}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Compare it to yours, then grade yourself:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setSelfGrades((prev) => ({ ...prev, [qIndex]: true }))}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold ${
                  selfGrades[qIndex] === true
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-900 hover:bg-green-200'
                }`}
              >
                ✅ I got this
              </button>
              <button
                onClick={() => setSelfGrades((prev) => ({ ...prev, [qIndex]: false }))}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold ${
                  selfGrades[qIndex] === false
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-900 hover:bg-orange-200'
                }`}
              >
                🤔 Missed it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuiz = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800">Unit 1 Practice Test</h3>
        <p className="text-gray-600">
          10 questions: true/false, multiple choice, fill in the blank, and one short answer. Every
          test is different.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setShowQuizResults(true)}
          disabled={showQuizResults}
          className="min-h-[44px] rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          ✓ Check Answers
        </button>
        <button
          onClick={startNewQuiz}
          className="min-h-[44px] rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
        >
          🔄 New Test
        </button>
      </div>

      {showQuizResults && (
        <div className="rounded-lg bg-teal-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-900">
            You scored {quizScore.correct} out of {quizScore.total}!
          </p>
          <p className="mt-1 text-sm text-teal-900">
            Short answers count once you grade them below.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {currentQuiz.map((q, qIndex) => {
          const section = QUIZ_BLUEPRINT.find((s) => s.type === q.type);
          const isFirstOfType = currentQuiz.findIndex((item) => item.type === q.type) === qIndex;
          const correct = isAnswerCorrect(q, quizAnswers[qIndex], selfGrades[qIndex]);
          return (
            <div key={`${q.type}-${q.question}`}>
              {isFirstOfType && (
                <h4 className="mb-2 mt-4 border-b-2 border-teal-300 pb-1 text-sm font-bold uppercase tracking-wide text-teal-800">
                  {section?.heading}
                </h4>
              )}
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="mb-3 font-semibold">
                  {showQuizResults && q.type !== 'short' && (
                    <span className="mr-1">{correct ? '✅' : '❌'}</span>
                  )}
                  {qIndex + 1}. {q.question}
                </p>
                {renderQuestion(q, qIndex)}
                {showQuizResults && q.type === 'tf' && !correct && q.why && (
                  <p className="mt-2 text-sm text-gray-700">💡 {q.why}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-teal-50 p-4 font-sans">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-teal-800">Thinking Like a Scientist</h1>
        <h2 className="text-lg text-gray-600">
          Unit 1 · Inquiry, Scientific Method, Measurement &amp; Lab Write-Up
        </h2>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`min-h-[44px] rounded-lg px-4 py-2 font-semibold transition-transform duration-200 ${
              activeTab === tab.id
                ? 'scale-110 bg-teal-800 text-white'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white/80 p-6 shadow-lg backdrop-blur-sm">
        {activeTab === 'overview' && renderOverview()}
        {DECKS[activeTab] && renderFlashcards()}
        {activeTab === 'sort' && renderSort()}
        {activeTab === 'quiz' && renderQuiz()}
      </div>
    </div>
  );
}
