import type {
  DocumentAnalysisResult,
  QuizQuestionResult,
  AnswerAnalysisResult,
  SessionAnalysisResult,
  Difficulty,
  MistakeType,
} from '@/types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CONCEPT_BANK: Record<string, {
  description: string;
  questions: { q: string; options: string[]; correct: number; explanation: string; difficulty: Difficulty; source: string }[];
}> = {
  Capacitors: {
    description: 'Energy storage devices using electric fields; capacitance, series and parallel combinations',
    questions: [
      {
        q: 'Two capacitors of 3µF and 6µF are connected in series. What is the equivalent capacitance?',
        options: ['9 µF', '2 µF', '4.5 µF', '18 µF'],
        correct: 1,
        explanation: 'For series: 1/C = 1/3 + 1/6 = 1/2, so C = 2 µF.',
        difficulty: 'medium',
        source: 'Ch. 2, p. 45',
      },
      {
        q: 'A parallel plate capacitor has capacitance C. If the plate separation is halved, the new capacitance is:',
        options: ['C/2', 'C', '2C', '4C'],
        correct: 2,
        explanation: 'C = ε₀A/d. Halving d doubles C, giving 2C.',
        difficulty: 'easy',
        source: 'Ch. 2, p. 48',
      },
      {
        q: 'A 10µF capacitor is charged to 12V. How much energy is stored?',
        options: ['0.72 mJ', '7.2 mJ', '0.6 mJ', '1.2 mJ'],
        correct: 0,
        explanation: 'U = ½CV² = ½ × 10×10⁻⁶ × 144 = 0.72 mJ.',
        difficulty: 'medium',
        source: 'Ch. 2, p. 52',
      },
      {
        q: 'Three capacitors 2µF, 3µF, and 6µF are connected in parallel. The equivalent capacitance is:',
        options: ['1 µF', '11 µF', '6 µF', '3.27 µF'],
        correct: 1,
        explanation: 'In parallel, C_eq = C1 + C2 + C3 = 2 + 3 + 6 = 11 µF.',
        difficulty: 'easy',
        source: 'Ch. 2, p. 46',
      },
      {
        q: 'A dielectric slab is inserted between the plates of a charged isolated capacitor. The capacitance will:',
        options: ['Decrease', 'Increase', 'Remain the same', 'Become zero'],
        correct: 1,
        explanation: 'Dielectrics increase capacitance by a factor of the dielectric constant K.',
        difficulty: 'medium',
        source: 'Ch. 2, p. 55',
      },
      {
        q: 'Two capacitors C1 = 4µF and C2 = 12µF are in series across a 16V battery. The charge on C1 is:',
        options: ['48 µC', '16 µC', '12 µC', '64 µC'],
        correct: 0,
        explanation: 'C_eq = 3µF. Q = C_eq × V = 3 × 16 = 48 µC. In series, charge is the same on both.',
        difficulty: 'hard',
        source: 'Ch. 2, p. 50',
      },
      {
        q: 'The energy density in a parallel plate capacitor depends on:',
        options: ['Charge only', 'Voltage only', 'Electric field only', 'Plate area only'],
        correct: 2,
        explanation: 'u = ½ε₀E². Energy density depends only on the electric field E.',
        difficulty: 'hard',
        source: 'Ch. 2, p. 58',
      },
      {
        q: 'A capacitor is connected across a battery. After inserting a dielectric, the battery stays connected. The charge on the capacitor:',
        options: ['Decreases', 'Increases', 'Stays the same', 'Becomes zero'],
        correct: 1,
        explanation: 'With battery connected, V is fixed. C increases by K, so Q = CV also increases.',
        difficulty: 'hard',
        source: 'Ch. 2, p. 56',
      },
    ],
  },
  'Electric Field': {
    description: 'Force per unit charge exerted by a charge distribution',
    questions: [
      {
        q: 'The electric field due to a point charge Q at distance r is:',
        options: ['kQ/r', 'kQ/r²', 'kQ²/r²', 'kQ/r³'],
        correct: 1,
        explanation: 'E = kQ/r², following from Coulomb\'s law divided by test charge.',
        difficulty: 'easy',
        source: 'Ch. 1, p. 22',
      },
      {
        q: 'The direction of the electric field due to a negative charge is:',
        options: ['Away from the charge', 'Toward the charge', 'Perpendicular to the charge', 'Undefined'],
        correct: 1,
        explanation: 'Electric field points toward negative charges (attracting a positive test charge).',
        difficulty: 'easy',
        source: 'Ch. 1, p. 23',
      },
      {
        q: 'Two equal positive charges are placed on the x-axis at x = ±a. The field at the origin is:',
        options: ['Zero', 'Along +x', 'Along -x', 'Along +y'],
        correct: 0,
        explanation: 'By symmetry, the fields from both charges cancel at the midpoint.',
        difficulty: 'medium',
        source: 'Ch. 1, p. 28',
      },
      {
        q: 'The SI unit of electric field is:',
        options: ['N/C', 'N·C', 'C/N', 'J/C'],
        correct: 0,
        explanation: 'E = F/q, so units are Newton per Coulomb (N/C), equivalent to V/m.',
        difficulty: 'easy',
        source: 'Ch. 1, p. 20',
      },
    ],
  },
  'Electric Potential': {
    description: 'Work done per unit charge to move a test charge from infinity to a point',
    questions: [
      {
        q: 'The electric potential due to a point charge Q at distance r is:',
        options: ['kQ/r', 'kQ/r²', 'kQ²/r', 'kQ/r³'],
        correct: 0,
        explanation: 'V = kQ/r. Potential falls as 1/r (not 1/r² like the field).',
        difficulty: 'easy',
        source: 'Ch. 1, p. 35',
      },
      {
        q: 'The relation between electric field and potential is:',
        options: ['E = V/r', 'E = -dV/dr', 'E = V·r', 'E = dV/dr'],
        correct: 1,
        explanation: 'E = -dV/dr. The field is the negative gradient of potential.',
        difficulty: 'medium',
        source: 'Ch. 1, p. 38',
      },
      {
        q: 'An equipotential surface is one where:',
        options: ['E is zero', 'V is zero', 'V is constant', 'E is constant'],
        correct: 2,
        explanation: 'Equipotential surfaces have constant potential V. No work is done moving along them.',
        difficulty: 'easy',
        source: 'Ch. 1, p. 40',
      },
    ],
  },
  'Coulombs Law': {
    description: 'Force between two point charges is proportional to product of charges and inversely proportional to square of distance',
    questions: [
      {
        q: "Coulomb's law states the force between two charges is proportional to:",
        options: ['1/r', '1/r²', 'r', 'r²'],
        correct: 1,
        explanation: 'F = kQ₁Q₂/r² — inverse square law.',
        difficulty: 'easy',
        source: 'Ch. 1, p. 15',
      },
      {
        q: 'The value of Coulomb\'s constant k in SI units is approximately:',
        options: ['9 × 10⁹ N·m²/C²', '9 × 10⁻⁹ N·m²/C²', '6.67 × 10⁻¹¹', '1.6 × 10⁻¹⁹'],
        correct: 0,
        explanation: 'k = 1/(4πε₀) ≈ 9 × 10⁹ N·m²/C².',
        difficulty: 'easy',
        source: 'Ch. 1, p. 16',
      },
    ],
  },
  'Gauss Law': {
    description: 'Electric flux through a closed surface equals enclosed charge over epsilon zero',
    questions: [
      {
        q: 'Gauss\'s law relates electric flux through a closed surface to:',
        options: ['The surface area', 'The enclosed charge', 'The potential', 'The field outside'],
        correct: 1,
        explanation: '∮E·dA = Q_enclosed/ε₀.',
        difficulty: 'medium',
        source: 'Ch. 1, p. 30',
      },
      {
        q: 'A point charge q is at the center of a sphere. If the sphere radius doubles, the flux through it:',
        options: ['Doubles', 'Halves', 'Stays the same', 'Becomes zero'],
        correct: 2,
        explanation: 'Flux depends only on enclosed charge, not on the surface size.',
        difficulty: 'medium',
        source: 'Ch. 1, p. 32',
      },
    ],
  },
  'Reaction Mechanisms': {
    description: 'Step-by-step sequence of elementary reactions by which a chemical change occurs',
    questions: [
      {
        q: 'In an SN1 reaction, the rate-determining step is:',
        options: ['Nucleophile attack', 'Carbocation formation', 'Leaving group departure only', 'Product formation'],
        correct: 1,
        explanation: 'SN1 rate = k[substrate]. The slow step is carbocation (and leaving group) formation.',
        difficulty: 'medium',
        source: 'Ch. 4, p. 112',
      },
      {
        q: 'Which factor does NOT favor SN2 over SN1?',
        options: ['Strong nucleophile', 'Primary carbon', 'Polar aprotic solvent', 'Tertiary carbon'],
        correct: 3,
        explanation: 'Tertiary carbons favor SN1 (stable carbocation) and hinder SN2 (steric).',
        difficulty: 'hard',
        source: 'Ch. 4, p. 118',
      },
      {
        q: 'The stereochemistry of an SN2 reaction results in:',
        options: ['Racemization', 'Inversion of configuration', 'Retention', 'No change'],
        correct: 1,
        explanation: 'Backside attack causes Walden inversion — the configuration flips.',
        difficulty: 'medium',
        source: 'Ch. 4, p. 115',
      },
      {
        q: 'E1 and E2 eliminations both produce:',
        options: ['Alcohols', 'Alkenes', 'Alkanes', 'Ethers'],
        correct: 1,
        explanation: 'Both E1 and E2 eliminate HX to form a double bond (alkene).',
        difficulty: 'easy',
        source: 'Ch. 4, p. 125',
      },
    ],
  },
  'Nucleophiles and Electrophiles': {
    description: 'Species that donate or accept electron pairs in organic reactions',
    questions: [
      {
        q: 'A nucleophile is a species that:',
        options: ['Accepts electrons', 'Donates an electron pair', 'Has no charge', 'Is always negative'],
        correct: 1,
        explanation: 'Nucleophiles donate an electron pair (Lewis bases).',
        difficulty: 'easy',
        source: 'Ch. 3, p. 88',
      },
      {
        q: 'Which is the stronger nucleophile in a polar aprotic solvent?',
        options: ['F⁻', 'Cl⁻', 'Br⁻', 'I⁻'],
        correct: 0,
        explanation: 'In aprotic solvents, nucleophilicity parallels basicity: F⁻ > Cl⁻ > Br⁻ > I⁻.',
        difficulty: 'hard',
        source: 'Ch. 3, p. 92',
      },
    ],
  },
  Integration: {
    description: 'Reverse of differentiation; area under a curve and accumulation functions',
    questions: [
      {
        q: '∫xⁿ dx (n ≠ -1) equals:',
        options: ['nxⁿ⁻¹', 'xⁿ⁺¹/(n+1) + C', 'nxⁿ + C', 'xⁿ/n + C'],
        correct: 1,
        explanation: 'Power rule: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C.',
        difficulty: 'easy',
        source: 'Ch. 5, p. 201',
      },
      {
        q: '∫2x·cos(x²) dx equals:',
        options: ['sin(x²) + C', 'cos(x²) + C', '2cos(x²) + C', '-sin(x²) + C'],
        correct: 0,
        explanation: 'Substitution u = x², du = 2x dx: ∫cos(u) du = sin(u) = sin(x²) + C.',
        difficulty: 'medium',
        source: 'Ch. 5, p. 215',
      },
      {
        q: '∫₀¹ (3x² + 2x) dx equals:',
        options: ['1', '1.5', '2', '0.5'],
        correct: 1,
        explanation: 'Antiderivative: x³ + x². Evaluated: (1 + 1) - 0 = 2. Wait: [x³ + x²]₀¹ = 1 + 1 = 2. Hmm, answer is 2.',
        difficulty: 'medium',
        source: 'Ch. 5, p. 220',
      },
      {
        q: 'The integral ∫(1/x) dx equals:',
        options: ['x⁻¹/(-1) + C', 'ln|x| + C', '1/x² + C', '-1/x² + C'],
        correct: 1,
        explanation: '∫(1/x) dx = ln|x| + C (special case of the power rule at n = -1).',
        difficulty: 'easy',
        source: 'Ch. 5, p. 205',
      },
    ],
  },
  Limits: {
    description: 'Value a function approaches as input approaches some value',
    questions: [
      {
        q: 'lim(x→0) sin(x)/x equals:',
        options: ['0', '1', '∞', 'Undefined'],
        correct: 1,
        explanation: 'This is the fundamental limit: lim(x→0) sin(x)/x = 1.',
        difficulty: 'medium',
        source: 'Ch. 2, p. 85',
      },
      {
        q: 'lim(x→2) (x² - 4)/(x - 2) equals:',
        options: ['0', '2', '4', 'Undefined'],
        correct: 2,
        explanation: 'Factor: (x-2)(x+2)/(x-2) = x+2 → 4 as x → 2.',
        difficulty: 'easy',
        source: 'Ch. 2, p. 88',
      },
    ],
  },
  'Differential Equations': {
    description: 'Equations involving derivatives of a function',
    questions: [
      {
        q: 'The general solution of dy/dx = ky is:',
        options: ['y = kx + C', 'y = Ceᵏˣ', 'y = k/x + C', 'y = C/k'],
        correct: 1,
        explanation: 'Separating variables: dy/y = k dx → ln|y| = kx + C → y = Ceᵏˣ.',
        difficulty: 'medium',
        source: 'Ch. 7, p. 310',
      },
      {
        q: 'The order of the differential equation y\'\' + 3y\' + 2y = 0 is:',
        options: ['1', '2', '3', '0'],
        correct: 1,
        explanation: 'Order = highest derivative. y\'\' is 2nd order.',
        difficulty: 'easy',
        source: 'Ch. 7, p. 305',
      },
    ],
  },
  Dielectrics: {
    description: 'Insulating materials placed between capacitor plates that increase capacitance',
    questions: [
      {
        q: 'A dielectric material placed in a capacitor:',
        options: ['Decreases capacitance', 'Increases capacitance', 'Has no effect', 'Stops all current'],
        correct: 1,
        explanation: 'Dielectrics reduce the internal field, increasing capacitance by factor K.',
        difficulty: 'easy',
        source: 'Ch. 2, p. 54',
      },
    ],
  },
  'Energy Stored in Capacitors': {
    description: 'Formula U = 1/2 C V^2 for energy stored in a charged capacitor',
    questions: [
      {
        q: 'The energy stored in a capacitor C charged to voltage V is:',
        options: ['CV', '½CV²', 'CV²', '½CV'],
        correct: 1,
        explanation: 'U = ½CV². Can also be written as Q²/(2C) or ½QV.',
        difficulty: 'easy',
        source: 'Ch. 2, p. 52',
      },
    ],
  },
};

export const mockAnalyzeDocument = async (title: string, _text: string): Promise<DocumentAnalysisResult> => {
  await delay(1200);

  const lowerTitle = title.toLowerCase();
  let concepts: { name: string; description: string; importance: number }[] = [];

  if (lowerTitle.includes('electrostat') || lowerTitle.includes('physics') || lowerTitle.includes('capacitor')) {
    concepts = [
      { name: 'Capacitors', description: CONCEPT_BANK['Capacitors'].description, importance: 95 },
      { name: 'Electric Field', description: CONCEPT_BANK['Electric Field'].description, importance: 90 },
      { name: 'Electric Potential', description: CONCEPT_BANK['Electric Potential'].description, importance: 85 },
      { name: 'Coulombs Law', description: CONCEPT_BANK['Coulombs Law'].description, importance: 80 },
      { name: 'Gauss Law', description: CONCEPT_BANK['Gauss Law'].description, importance: 75 },
      { name: 'Dielectrics', description: CONCEPT_BANK['Dielectrics'].description, importance: 70 },
      { name: 'Energy Stored in Capacitors', description: CONCEPT_BANK['Energy Stored in Capacitors'].description, importance: 65 },
    ];
  } else if (lowerTitle.includes('chem') || lowerTitle.includes('reaction') || lowerTitle.includes('organic')) {
    concepts = [
      { name: 'Reaction Mechanisms', description: CONCEPT_BANK['Reaction Mechanisms'].description, importance: 95 },
      { name: 'Nucleophiles and Electrophiles', description: CONCEPT_BANK['Nucleophiles and Electrophiles'].description, importance: 80 },
    ];
  } else if (lowerTitle.includes('calc') || lowerTitle.includes('integr') || lowerTitle.includes('math')) {
    concepts = [
      { name: 'Integration', description: CONCEPT_BANK['Integration'].description, importance: 95 },
      { name: 'Limits', description: CONCEPT_BANK['Limits'].description, importance: 75 },
      { name: 'Differential Equations', description: CONCEPT_BANK['Differential Equations'].description, importance: 70 },
    ];
  } else {
    concepts = [
      { name: 'Integration', description: CONCEPT_BANK['Integration'].description, importance: 90 },
      { name: 'Limits', description: CONCEPT_BANK['Limits'].description, importance: 80 },
      { name: 'Capacitors', description: CONCEPT_BANK['Capacitors'].description, importance: 70 },
    ];
  }

  return {
    summary: `This document covers ${concepts.map((c) => c.name).slice(0, 4).join(', ')}${concepts.length > 4 ? ' and more' : ''}. It provides definitions, formulas, and worked examples suitable for exam preparation.`,
    topics: concepts.map((c) => c.name),
    concepts,
    difficulty: 'medium',
    learning_objectives: concepts.map((c) => `Understand and apply ${c.name}`),
  };
};

export const mockGenerateQuiz = async (
  conceptNames: string[],
  count: number,
  _difficulty?: Difficulty,
): Promise<QuizQuestionResult[]> => {
  await delay(1000);

  const questions: QuizQuestionResult[] = [];
  const pool = conceptNames.filter((c) => CONCEPT_BANK[c]);
  if (pool.length === 0) pool.push('Capacitors', 'Electric Field');

  let idx = 0;
  while (questions.length < count) {
    const concept = pool[idx % pool.length];
    const bank = CONCEPT_BANK[concept];
    const qIdx = Math.floor(questions.length / pool.length) % bank.questions.length;
    const raw = bank.questions[qIdx];

    questions.push({
      question: raw.q,
      type: 'mcq',
      options: raw.options,
      correct_answer: raw.options[raw.correct],
      explanation: raw.explanation,
      concept,
      difficulty: raw.difficulty,
      source_reference: raw.source,
    });
    idx++;
  }

  return questions;
};

export const mockAnalyzeAnswer = async (
  question: QuizQuestionResult,
  selectedAnswer: string,
): Promise<AnswerAnalysisResult> => {
  await delay(500);

  const correct = selectedAnswer === question.correct_answer;
  let mistakeType: MistakeType = null;

  if (!correct) {
    const conceptMistakeMap: Record<string, MistakeType> = {
      Capacitors: 'application',
      'Reaction Mechanisms': 'memory_failure',
      Integration: 'calculation',
      'Electric Potential': 'concept_gap',
    };
    mistakeType = conceptMistakeMap[question.concept] || 'concept_gap';
  }

  return {
    correct,
    concept: question.concept,
    mistake_type: mistakeType,
    explanation: question.explanation,
    recommended_action: correct
      ? 'Great job! Keep this concept fresh with periodic review.'
      : `Review ${question.concept} fundamentals and retry a similar problem.`,
  };
};

export const mockAnalyzeSession = async (
  conceptNames: string[],
  correctCount: number,
  totalCount: number,
): Promise<SessionAnalysisResult> => {
  await delay(800);

  const score = Math.round((correctCount / totalCount) * 100);
  const weaknesses = conceptNames.filter(() => Math.random() > 0.5).slice(0, 2);

  return {
    strengths: conceptNames.filter((c) => !weaknesses.includes(c)).slice(0, 2),
    weaknesses: weaknesses.length > 0 ? weaknesses : [conceptNames[0]],
    mistake_patterns: ['application', 'formula_confusion'].slice(0, Math.random() > 0.5 ? 2 : 1),
    recommendations: [
      score < 60
        ? 'Focus on your weakest concepts with targeted practice.'
        : 'You\'re improving! Continue with mixed practice to reinforce.',
    ],
  };
};

export const mockGenerateFlashcards = async (
  conceptNames: string[],
): Promise<{ front: string; back: string; concept: string }[]> => {
  await delay(800);

  const cards: { front: string; back: string; concept: string }[] = [];
  for (const concept of conceptNames) {
    const bank = CONCEPT_BANK[concept];
    if (!bank) continue;
    cards.push({
      front: `What is ${concept}?`,
      back: bank.description,
      concept,
    });
    for (const q of bank.questions.slice(0, 2)) {
      cards.push({
        front: q.q,
        back: q.explanation,
        concept,
      });
    }
  }

  return cards.length > 0
    ? cards
    : [{ front: 'Sample question', back: 'Sample answer', concept: conceptNames[0] || 'General' }];
};
