import { PrismaClient, Difficulty, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

// ─── SUBJECT DEFINITIONS ─────────────────────────────────────────────

interface ChapterDef {
  name: string;
  chapterNo: number;
  totalMarks: number;
  weightage: number; // percentage of total (80)
  frequency: number; // how often it appears in past papers (0–1)
}

interface QuestionDef {
  subjectCode: string;
  chapterNo: number;
  text: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: Difficulty;
}

// ─── CHAPTER DATA ────────────────────────────────────────────────────

const mathChapters: ChapterDef[] = [
  { name: "Real Numbers", chapterNo: 1, totalMarks: 6, weightage: 7.5, frequency: 0.95 },
  { name: "Polynomials", chapterNo: 2, totalMarks: 4, weightage: 5.0, frequency: 0.9 },
  { name: "Pair of Linear Equations in Two Variables", chapterNo: 3, totalMarks: 6, weightage: 7.5, frequency: 0.95 },
  { name: "Quadratic Equations", chapterNo: 4, totalMarks: 5, weightage: 6.25, frequency: 0.95 },
  { name: "Arithmetic Progressions", chapterNo: 5, totalMarks: 5, weightage: 6.25, frequency: 0.95 },
  { name: "Triangles", chapterNo: 6, totalMarks: 8, weightage: 10.0, frequency: 1.0 },
  { name: "Coordinate Geometry", chapterNo: 7, totalMarks: 6, weightage: 7.5, frequency: 0.9 },
  { name: "Introduction to Trigonometry", chapterNo: 8, totalMarks: 6, weightage: 7.5, frequency: 1.0 },
  { name: "Some Applications of Trigonometry", chapterNo: 9, totalMarks: 6, weightage: 7.5, frequency: 0.9 },
  { name: "Circles", chapterNo: 10, totalMarks: 7, weightage: 8.75, frequency: 0.95 },
  { name: "Areas Related to Circles", chapterNo: 11, totalMarks: 5, weightage: 6.25, frequency: 0.85 },
  { name: "Surface Areas and Volumes", chapterNo: 12, totalMarks: 5, weightage: 6.25, frequency: 0.9 },
  { name: "Statistics", chapterNo: 13, totalMarks: 6, weightage: 7.5, frequency: 0.95 },
  { name: "Probability", chapterNo: 14, totalMarks: 5, weightage: 6.25, frequency: 0.9 },
];

const scienceChapters: ChapterDef[] = [
  { name: "Chemical Reactions and Equations", chapterNo: 1, totalMarks: 5, weightage: 6.25, frequency: 0.95 },
  { name: "Acids Bases and Salts", chapterNo: 2, totalMarks: 5, weightage: 6.25, frequency: 0.95 },
  { name: "Metals and Non-metals", chapterNo: 3, totalMarks: 7, weightage: 8.75, frequency: 0.9 },
  { name: "Carbon and its Compounds", chapterNo: 4, totalMarks: 7, weightage: 8.75, frequency: 0.95 },
  { name: "Life Processes", chapterNo: 5, totalMarks: 8, weightage: 10.0, frequency: 1.0 },
  { name: "Control and Coordination", chapterNo: 6, totalMarks: 6, weightage: 7.5, frequency: 0.85 },
  { name: "How do Organisms Reproduce", chapterNo: 7, totalMarks: 6, weightage: 7.5, frequency: 0.9 },
  { name: "Heredity", chapterNo: 8, totalMarks: 5, weightage: 6.25, frequency: 0.85 },
  { name: "Light Reflection and Refraction", chapterNo: 9, totalMarks: 7, weightage: 8.75, frequency: 1.0 },
  { name: "The Human Eye and the Colourful World", chapterNo: 10, totalMarks: 5, weightage: 6.25, frequency: 0.85 },
  { name: "Electricity", chapterNo: 11, totalMarks: 7, weightage: 8.75, frequency: 1.0 },
  { name: "Magnetic Effects of Electric Current", chapterNo: 12, totalMarks: 7, weightage: 8.75, frequency: 0.9 },
  { name: "Our Environment", chapterNo: 13, totalMarks: 5, weightage: 6.25, frequency: 0.8 },
];

const sstChapters: ChapterDef[] = [
  // History (20 marks)
  { name: "The Rise of Nationalism in Europe", chapterNo: 1, totalMarks: 4, weightage: 5.0, frequency: 0.9 },
  { name: "Nationalism in India", chapterNo: 2, totalMarks: 5, weightage: 6.25, frequency: 1.0 },
  { name: "The Making of a Global World", chapterNo: 3, totalMarks: 4, weightage: 5.0, frequency: 0.85 },
  { name: "The Age of Industrialisation", chapterNo: 4, totalMarks: 4, weightage: 5.0, frequency: 0.85 },
  { name: "Print Culture and the Modern World", chapterNo: 5, totalMarks: 3, weightage: 3.75, frequency: 0.8 },
  // Geography (20 marks)
  { name: "Resources and Development", chapterNo: 6, totalMarks: 5, weightage: 6.25, frequency: 0.95 },
  { name: "Forest and Wildlife Resources", chapterNo: 7, totalMarks: 3, weightage: 3.75, frequency: 0.8 },
  { name: "Water Resources", chapterNo: 8, totalMarks: 4, weightage: 5.0, frequency: 0.85 },
  { name: "Agriculture", chapterNo: 9, totalMarks: 4, weightage: 5.0, frequency: 0.9 },
  { name: "Manufacturing Industries", chapterNo: 10, totalMarks: 4, weightage: 5.0, frequency: 0.85 },
  // Civics (20 marks)
  { name: "Power Sharing", chapterNo: 11, totalMarks: 4, weightage: 5.0, frequency: 0.9 },
  { name: "Federalism", chapterNo: 12, totalMarks: 4, weightage: 5.0, frequency: 0.9 },
  { name: "Democracy and Diversity", chapterNo: 13, totalMarks: 4, weightage: 5.0, frequency: 0.85 },
  { name: "Gender Religion and Caste", chapterNo: 14, totalMarks: 4, weightage: 5.0, frequency: 0.85 },
  { name: "Political Parties", chapterNo: 15, totalMarks: 4, weightage: 5.0, frequency: 0.9 },
  // Economics (20 marks)
  { name: "Development", chapterNo: 16, totalMarks: 7, weightage: 8.75, frequency: 0.95 },
  { name: "Sectors of the Indian Economy", chapterNo: 17, totalMarks: 7, weightage: 8.75, frequency: 0.95 },
  { name: "Money and Credit", chapterNo: 18, totalMarks: 6, weightage: 7.5, frequency: 0.9 },
];

const englishChapters: ChapterDef[] = [
  // Reading
  { name: "Reading Comprehension - Unseen Passages", chapterNo: 1, totalMarks: 10, weightage: 12.5, frequency: 1.0 },
  { name: "Case-Based Passage with MCQs", chapterNo: 2, totalMarks: 10, weightage: 12.5, frequency: 1.0 },
  // Writing
  { name: "Letter and Email Writing", chapterNo: 3, totalMarks: 5, weightage: 6.25, frequency: 1.0 },
  { name: "Analytical Paragraph Writing", chapterNo: 4, totalMarks: 5, weightage: 6.25, frequency: 1.0 },
  // Grammar
  { name: "Tenses and Modals", chapterNo: 5, totalMarks: 5, weightage: 6.25, frequency: 0.95 },
  { name: "Subject-Verb Agreement and Determiners", chapterNo: 6, totalMarks: 5, weightage: 6.25, frequency: 0.9 },
  { name: "Reported Speech and Commands", chapterNo: 7, totalMarks: 5, weightage: 6.25, frequency: 0.95 },
  // First Flight (Prose)
  { name: "A Letter to God", chapterNo: 8, totalMarks: 7, weightage: 8.75, frequency: 0.9 },
  { name: "Nelson Mandela - Long Walk to Freedom", chapterNo: 9, totalMarks: 7, weightage: 8.75, frequency: 0.9 },
  { name: "Two Stories about Flying", chapterNo: 10, totalMarks: 7, weightage: 8.75, frequency: 0.85 },
  // First Flight (Poetry)
  { name: "Dust of Snow and Fire and Ice", chapterNo: 11, totalMarks: 7, weightage: 8.75, frequency: 0.85 },
  { name: "A Tiger in the Zoo and The Ball Poem", chapterNo: 12, totalMarks: 7, weightage: 8.75, frequency: 0.85 },
];

const hindiChapters: ChapterDef[] = [
  // Kshitij (Prose/Poetry)
  { name: "पद - सूरदास", chapterNo: 1, totalMarks: 7, weightage: 8.75, frequency: 0.9 },
  { name: "राम-लक्ष्मण-परशुराम संवाद - तुलसीदास", chapterNo: 2, totalMarks: 7, weightage: 8.75, frequency: 0.9 },
  { name: "सवैया और कवित्त - देव", chapterNo: 3, totalMarks: 5, weightage: 6.25, frequency: 0.85 },
  { name: "आत्मकथ्य - जयशंकर प्रसाद", chapterNo: 4, totalMarks: 5, weightage: 6.25, frequency: 0.8 },
  { name: "उत्साह और अट नहीं रही - सूर्यकांत त्रिपाठी निराला", chapterNo: 5, totalMarks: 5, weightage: 6.25, frequency: 0.85 },
  // Kritika
  { name: "माता का आँचल", chapterNo: 6, totalMarks: 7, weightage: 8.75, frequency: 0.9 },
  { name: "जॉर्ज पंचम की नाक", chapterNo: 7, totalMarks: 5, weightage: 6.25, frequency: 0.85 },
  { name: "साना-साना हाथ जोड़ि", chapterNo: 8, totalMarks: 5, weightage: 6.25, frequency: 0.8 },
  // Grammar
  { name: "व्याकरण - पद परिचय", chapterNo: 9, totalMarks: 10, weightage: 12.5, frequency: 1.0 },
  { name: "व्याकरण - रचना के आधार पर वाक्य भेद", chapterNo: 10, totalMarks: 8, weightage: 10.0, frequency: 0.95 },
  { name: "व्याकरण - अलंकार", chapterNo: 11, totalMarks: 8, weightage: 10.0, frequency: 0.9 },
  { name: "लेखन - निबंध एवं पत्र लेखन", chapterNo: 12, totalMarks: 8, weightage: 10.0, frequency: 1.0 },
];

// ─── QUESTION DATA ───────────────────────────────────────────────────

const questions: QuestionDef[] = [
  // ─── MATHEMATICS (10 questions) ──────────────────────────────────
  {
    subjectCode: "MATH",
    chapterNo: 1,
    text: "If the HCF of 65 and 117 is expressible in the form 65m − 117, then the value of m is:",
    options: ["1", "2", "3", "4"],
    answer: "2",
    explanation:
      "HCF(65, 117) = 13. So 65m − 117 = 13, which gives 65m = 130, hence m = 2.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 2,
    text: "If one zero of the quadratic polynomial x² + 3x + k is 2, then the value of k is:",
    options: ["-10", "10", "-7", "7"],
    answer: "-10",
    explanation:
      "Substituting x = 2: (2)² + 3(2) + k = 0 → 4 + 6 + k = 0 → k = -10.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 4,
    text: "The quadratic equation 2x² − 5x + 1 = 0 has:",
    options: [
      "two distinct real roots",
      "two equal real roots",
      "no real roots",
      "more than two real roots",
    ],
    answer: "two distinct real roots",
    explanation:
      "Discriminant D = b² − 4ac = 25 − 8 = 17 > 0, so there are two distinct real roots.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 5,
    text: "The 10th term of the AP 2, 7, 12, ... is:",
    options: ["45", "47", "49", "50"],
    answer: "47",
    explanation:
      "a = 2, d = 5. T₁₀ = a + 9d = 2 + 45 = 47.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 6,
    text: "In ΔABC, DE ∥ BC. If AD = 4 cm, DB = 5 cm and AE = 8 cm, then AC is equal to:",
    options: ["10 cm", "18 cm", "12 cm", "15 cm"],
    answer: "18 cm",
    explanation:
      "By BPT, AD/DB = AE/EC → 4/5 = 8/EC → EC = 10. So AC = AE + EC = 8 + 10 = 18 cm.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 8,
    text: "If sin A = 3/5, then the value of cos A is:",
    options: ["4/5", "3/4", "5/3", "5/4"],
    answer: "4/5",
    explanation:
      "sin²A + cos²A = 1. cos²A = 1 − 9/25 = 16/25. cos A = 4/5 (taking positive value).",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 10,
    text: "From an external point P, two tangents PA and PB are drawn to a circle with centre O. If ∠APB = 70°, then ∠AOB is:",
    options: ["100°", "110°", "120°", "130°"],
    answer: "110°",
    explanation:
      "∠OAP = ∠OBP = 90° (radius ⊥ tangent). In quadrilateral OAPB, sum of angles = 360°. ∠AOB = 360° − 90° − 90° − 70° = 110°.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 11,
    text: "The area of a sector of a circle with radius 6 cm and angle 60° is:",
    options: ["6π cm²", "12π cm²", "18π cm²", "36π cm²"],
    answer: "6π cm²",
    explanation:
      "Area = (θ/360) × πr² = (60/360) × π × 36 = 6π cm².",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 13,
    text: "The mean of the first five prime numbers is:",
    options: ["5.0", "5.6", "5.2", "4.8"],
    answer: "5.6",
    explanation:
      "First five primes: 2, 3, 5, 7, 11. Mean = (2+3+5+7+11)/5 = 28/5 = 5.6.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "MATH",
    chapterNo: 14,
    text: "A bag contains 3 red balls and 5 black balls. A ball is drawn at random. The probability that the ball drawn is red is:",
    options: ["3/8", "5/8", "3/5", "5/3"],
    answer: "3/8",
    explanation:
      "Total balls = 3 + 5 = 8. P(red) = 3/8.",
    difficulty: "EASY" as Difficulty,
  },

  // ─── SCIENCE (12 questions) ──────────────────────────────────────
  {
    subjectCode: "SCI",
    chapterNo: 1,
    text: "Which of the following is an example of a decomposition reaction?",
    options: [
      "2H₂ + O₂ → 2H₂O",
      "CaCO₃ → CaO + CO₂",
      "Fe + CuSO₄ → FeSO₄ + Cu",
      "NaOH + HCl → NaCl + H₂O",
    ],
    answer: "CaCO₃ → CaO + CO₂",
    explanation:
      "Decomposition reaction involves a single compound breaking into two or more simpler substances. Calcium carbonate decomposes into calcium oxide and carbon dioxide.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 2,
    text: "The pH value of gastric juice in the human stomach is approximately:",
    options: ["2", "5", "7", "9"],
    answer: "2",
    explanation:
      "Gastric juice contains hydrochloric acid and has a pH of about 1.5 to 2, making it highly acidic to aid in digestion.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 3,
    text: "Which of the following metals does not react with cold water?",
    options: ["Sodium", "Calcium", "Iron", "Potassium"],
    answer: "Iron",
    explanation:
      "Iron does not react with cold water. It reacts only with steam to form iron oxide and hydrogen. Sodium and potassium react vigorously with cold water.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 4,
    text: "The functional group present in ethanol is:",
    options: ["-CHO", "-COOH", "-OH", "-CO-"],
    answer: "-OH",
    explanation:
      "Ethanol (C₂H₅OH) contains the hydroxyl (-OH) functional group, which is characteristic of alcohols.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 5,
    text: "In the human digestive system, the enzyme pepsin breaks down:",
    options: ["Fats", "Starch", "Proteins", "Cellulose"],
    answer: "Proteins",
    explanation:
      "Pepsin is a protease enzyme secreted by gastric glands in the stomach. It breaks down proteins into smaller peptides in an acidic environment.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 6,
    text: "Which hormone is responsible for the fight-or-flight response in humans?",
    options: ["Insulin", "Thyroxine", "Adrenaline", "Growth Hormone"],
    answer: "Adrenaline",
    explanation:
      "Adrenaline (epinephrine) is secreted by the adrenal glands during stressful situations. It increases heart rate, blood pressure, and energy supplies — the fight-or-flight response.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 8,
    text: "If a pure tall plant (TT) is crossed with a pure short plant (tt), the ratio of tall to short plants in the F₂ generation is:",
    options: ["1:1", "3:1", "1:3", "2:1"],
    answer: "3:1",
    explanation:
      "F₁ generation is all Tt (tall). F₂ from Tt × Tt gives TT:Tt:tt = 1:2:1, so phenotypic ratio of tall:short = 3:1 (Mendel's Law of Segregation).",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 9,
    text: "The image formed by a concave mirror when the object is placed between the pole and the focus is:",
    options: [
      "Real and inverted",
      "Virtual, erect and magnified",
      "Real and diminished",
      "Virtual, erect and diminished",
    ],
    answer: "Virtual, erect and magnified",
    explanation:
      "When an object is placed between the pole (P) and focus (F) of a concave mirror, the image is formed behind the mirror. It is virtual, erect, and larger than the object.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 10,
    text: "The splitting of white light into its component colours is called:",
    options: ["Reflection", "Refraction", "Dispersion", "Diffraction"],
    answer: "Dispersion",
    explanation:
      "Dispersion is the phenomenon by which white light splits into its seven constituent colours (VIBGYOR) when passed through a prism, due to different refractive indices for different wavelengths.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 11,
    text: "Two resistors of 6Ω and 3Ω are connected in parallel. The equivalent resistance is:",
    options: ["9Ω", "2Ω", "3Ω", "1Ω"],
    answer: "2Ω",
    explanation:
      "For parallel combination: 1/R = 1/R₁ + 1/R₂ = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2. So R = 2Ω.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 12,
    text: "The phenomenon of electromagnetic induction was discovered by:",
    options: ["Faraday", "Ampere", "Oersted", "Fleming"],
    answer: "Faraday",
    explanation:
      "Michael Faraday discovered electromagnetic induction in 1831 — the production of an electromotive force across a conductor when it is exposed to a changing magnetic field.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SCI",
    chapterNo: 13,
    text: "Which of the following is a non-biodegradable waste?",
    options: ["Vegetable peels", "Paper bags", "Plastic bottles", "Cotton cloth"],
    answer: "Plastic bottles",
    explanation:
      "Plastic bottles are non-biodegradable because they cannot be broken down by biological processes. They persist in the environment for hundreds of years.",
    difficulty: "EASY" as Difficulty,
  },

  // ─── SOCIAL SCIENCE (10 questions) ───────────────────────────────
  {
    subjectCode: "SST",
    chapterNo: 2,
    text: "Who wrote the famous book 'Hind Swaraj' in 1909?",
    options: [
      "Jawaharlal Nehru",
      "Mahatma Gandhi",
      "Bal Gangadhar Tilak",
      "Subhas Chandra Bose",
    ],
    answer: "Mahatma Gandhi",
    explanation:
      "Mahatma Gandhi wrote 'Hind Swaraj' in 1909 on a voyage from London to South Africa. It outlined his vision of self-rule for India and critiqued modern civilisation.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 1,
    text: "Which of the following was NOT a feature of the 'Napoleonic Code'?",
    options: [
      "Equality before law",
      "Right to property",
      "Universal male suffrage",
      "Abolition of privileges based on birth",
    ],
    answer: "Universal male suffrage",
    explanation:
      "The Napoleonic Code of 1804 established equality before law, secured the right to property, and abolished privileges based on birth. However, universal suffrage was not part of the code.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 6,
    text: "Which type of soil is ideal for growing cotton?",
    options: ["Alluvial soil", "Black soil", "Red soil", "Laterite soil"],
    answer: "Black soil",
    explanation:
      "Black soil (also called regur or black cotton soil) has high moisture retention capacity and is rich in calcium, magnesium, and potassium, making it ideal for growing cotton.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 9,
    text: "Which revolution in agriculture led to a significant increase in food-grain production in India?",
    options: [
      "Blue Revolution",
      "White Revolution",
      "Green Revolution",
      "Yellow Revolution",
    ],
    answer: "Green Revolution",
    explanation:
      "The Green Revolution (1960s-70s) introduced high-yielding variety seeds, chemical fertilisers, and modern irrigation techniques, drastically increasing food-grain production, especially wheat and rice.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 11,
    text: "Belgium adopted a model of power sharing by establishing a:",
    options: [
      "Unitary government",
      "Community government",
      "Military government",
      "Presidential system",
    ],
    answer: "Community government",
    explanation:
      "Belgium established a Community Government elected by people belonging to the same language community (Dutch, French, German) to address cultural and educational matters, preventing ethnic conflict.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 12,
    text: "In India, 'residuary powers' are vested with:",
    options: [
      "State Government",
      "Central Government",
      "Local Government",
      "Concurrent List",
    ],
    answer: "Central Government",
    explanation:
      "Under Indian federalism, subjects not mentioned in any of the three lists (Union, State, Concurrent) are called residuary subjects and fall under the jurisdiction of the Central Government (Parliament).",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 16,
    text: "Which of the following is used to compare the development of different countries?",
    options: ["GDP", "Per Capita Income", "Total Population", "Area of the Country"],
    answer: "Per Capita Income",
    explanation:
      "Per Capita Income (average income) is used by the World Bank to classify countries into different development categories. It gives a better indication than total GDP as it accounts for population.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 17,
    text: "Which sector has the highest share in India's GDP as of recent years?",
    options: [
      "Primary sector",
      "Secondary sector",
      "Tertiary sector",
      "All sectors have equal share",
    ],
    answer: "Tertiary sector",
    explanation:
      "The tertiary (service) sector contributes the most to India's GDP. Services such as banking, IT, transport, and communication have driven economic growth, overtaking agriculture and manufacturing.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 18,
    text: "Which of the following is an example of formal sector credit?",
    options: [
      "Loan from a moneylender",
      "Loan from a relative",
      "Loan from a commercial bank",
      "Loan from a landlord",
    ],
    answer: "Loan from a commercial bank",
    explanation:
      "Formal sector credit includes loans from banks and cooperatives that are regulated by the RBI and charge controlled interest rates. Moneylenders, relatives, and landlords are informal sources.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "SST",
    chapterNo: 15,
    text: "A political party that wins fewer seats than the ruling party but more than any other opposition party is called:",
    options: [
      "Ruling party",
      "Regional party",
      "Opposition party",
      "Recognised party",
    ],
    answer: "Opposition party",
    explanation:
      "The party or coalition with the second-largest number of seats in the legislature functions as the principal opposition party, and its leader is recognised as the Leader of the Opposition.",
    difficulty: "MEDIUM" as Difficulty,
  },

  // ─── ENGLISH (10 questions) ──────────────────────────────────────
  {
    subjectCode: "ENG",
    chapterNo: 5,
    text: "Choose the correct tense: She ___ to school every day.",
    options: ["go", "goes", "going", "gone"],
    answer: "goes",
    explanation:
      "With a third person singular subject (She) in simple present tense, the verb takes an '-es' or '-s' suffix. 'She goes' is correct.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 5,
    text: "Identify the correct sentence in past perfect tense:",
    options: [
      "She has finished her work.",
      "She had finished her work before he arrived.",
      "She finishes her work.",
      "She will have finished her work.",
    ],
    answer: "She had finished her work before he arrived.",
    explanation:
      "Past perfect tense uses 'had + past participle' and describes an action completed before another past action. 'Had finished' before 'arrived' is past perfect.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 7,
    text: "Change to reported speech: He said, 'I am reading a book.'",
    options: [
      "He said that he is reading a book.",
      "He said that he was reading a book.",
      "He said that he has been reading a book.",
      "He said that he had been reading a book.",
    ],
    answer: "He said that he was reading a book.",
    explanation:
      "In reported speech, present continuous ('am reading') changes to past continuous ('was reading'), and the pronoun 'I' changes to 'he'.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 6,
    text: "Choose the correct option: Neither the students nor the teacher ___ present.",
    options: ["were", "was", "are", "have been"],
    answer: "was",
    explanation:
      "With 'neither...nor', the verb agrees with the subject nearest to it. 'Teacher' (singular) is nearest, so 'was' is correct.",
    difficulty: "HARD" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 8,
    text: "In 'A Letter to God', what did Lencho call the post office employees?",
    options: [
      "A bunch of crooks",
      "Kind-hearted people",
      "Government servants",
      "Messengers of God",
    ],
    answer: "A bunch of crooks",
    explanation:
      "When Lencho received only 70 pesos instead of 100, he believed that God could not have made a mistake. He wrote a second letter to God calling the post office employees 'a bunch of crooks' who must have stolen the remaining money.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 9,
    text: "In 'Nelson Mandela: Long Walk to Freedom', what does Mandela say is the greatest wealth of a nation?",
    options: [
      "Its minerals and gems",
      "Its economy",
      "Its people",
      "Its military strength",
    ],
    answer: "Its people",
    explanation:
      "Nelson Mandela said that a nation's greatest wealth is not its minerals, gold, or gems — but its people, who are finer and truer than the purest diamonds.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 11,
    text: "In 'Dust of Snow', what did the crow shake down on the poet?",
    options: ["Rain drops", "Flower petals", "Dust of snow", "Dry leaves"],
    answer: "Dust of snow",
    explanation:
      "In Robert Frost's poem 'Dust of Snow', a crow sitting on a hemlock tree shook down fine dust of snow on the poet, which changed his mood and saved the rest of his day.",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 11,
    text: "In the poem 'Fire and Ice' by Robert Frost, the poet compares 'fire' to:",
    options: ["Hatred", "Desire", "Anger", "Jealousy"],
    answer: "Desire",
    explanation:
      "Robert Frost uses 'fire' as a metaphor for desire and passion, and 'ice' for hatred. He says the world will end either by the fire of desire or the ice of hatred.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 3,
    text: "Which of the following is a correct format element of a formal letter?",
    options: [
      "Using casual language",
      "Sender's address at the top left/right",
      "No subject line needed",
      "Signing off with 'bye'",
    ],
    answer: "Sender's address at the top left/right",
    explanation:
      "A formal letter must include the sender's address at the top, followed by the date, the receiver's address, subject line, salutation, body, and formal closing (Yours faithfully/sincerely).",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "ENG",
    chapterNo: 10,
    text: "In 'Two Stories about Flying', what was the young seagull initially afraid of?",
    options: ["Swimming", "Flying", "Hunting", "Diving"],
    answer: "Flying",
    explanation:
      "In 'His First Flight' by Liam O'Flaherty, the young seagull was afraid of flying. His family tried to encourage him, and eventually hunger drove him to take the plunge from the ledge.",
    difficulty: "EASY" as Difficulty,
  },

  // ─── HINDI (10 questions) ────────────────────────────────────────
  {
    subjectCode: "HIN",
    chapterNo: 1,
    text: "सूरदास के पदों में किस रस की प्रधानता है?",
    options: ["वीर रस", "वात्सल्य रस", "श्रृंगार रस", "करुण रस"],
    answer: "वात्सल्य रस",
    explanation:
      "सूरदास के पदों में वात्सल्य रस की प्रधानता है। उन्होंने बाल कृष्ण की लीलाओं का अत्यंत मनोहर वर्णन किया है जो वात्सल्य रस का उत्कृष्ट उदाहरण है।",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 2,
    text: "'राम-लक्ष्मण-परशुराम संवाद' में परशुराम किस बात पर क्रोधित होते हैं?",
    options: [
      "लक्ष्मण द्वारा शिव धनुष तोड़ने पर",
      "राम द्वारा शिव धनुष तोड़ने पर",
      "सीता के स्वयंवर पर",
      "जनक के निमंत्रण पर",
    ],
    answer: "राम द्वारा शिव धनुष तोड़ने पर",
    explanation:
      "तुलसीदास रचित इस प्रसंग में परशुराम शिव धनुष (पिनाक) के टूटने की आवाज़ सुनकर क्रोधित होते हैं क्योंकि वह धनुष भगवान शिव का था और राम ने उसे तोड़ दिया था।",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 9,
    text: "'रमेश ने पुस्तक पढ़ी' — इस वाक्य में 'रमेश ने' में कौन-सा कारक है?",
    options: ["कर्म कारक", "करण कारक", "कर्ता कारक", "सम्प्रदान कारक"],
    answer: "कर्ता कारक",
    explanation:
      "क्रिया को करने वाला कर्ता कहलाता है। 'ने' कर्ता कारक का परसर्ग (विभक्ति चिह्न) है जो भूतकाल की सकर्मक क्रिया के साथ प्रयुक्त होता है।",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 10,
    text: "'यद्यपि वह बीमार था, तथापि वह विद्यालय गया।' — यह किस प्रकार का वाक्य है?",
    options: ["सरल वाक्य", "संयुक्त वाक्य", "मिश्र वाक्य", "विधानवाचक वाक्य"],
    answer: "मिश्र वाक्य",
    explanation:
      "जिस वाक्य में एक प्रधान उपवाक्य और एक या एक से अधिक आश्रित उपवाक्य हों, उसे मिश्र वाक्य कहते हैं। 'यद्यपि...तथापि' मिश्र वाक्य के योजक हैं।",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 11,
    text: "'उसके मुख की तुलना चन्द्रमा से की गई' — इसमें कौन-सा अलंकार है?",
    options: ["रूपक", "उपमा", "अनुप्रास", "यमक"],
    answer: "उपमा",
    explanation:
      "जहाँ दो वस्तुओं की तुलना की जाती है और उपमान, उपमेय, वाचक शब्द एवं साधारण धर्म — चारों उपस्थित हों, वहाँ उपमा अलंकार होता है। यहाँ 'मुख' (उपमेय) की 'चन्द्रमा' (उपमान) से तुलना 'से' (वाचक) द्वारा की गई है।",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 6,
    text: "'माता का आँचल' पाठ के लेखक कौन हैं?",
    options: ["प्रेमचंद", "शिवपूजन सहाय", "यशपाल", "महादेवी वर्मा"],
    answer: "शिवपूजन सहाय",
    explanation:
      "'माता का आँचल' शिवपूजन सहाय द्वारा रचित एक मार्मिक कहानी है जिसमें बच्चे के माँ के प्रति स्नेह और लगाव का सजीव चित्रण किया गया है।",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 7,
    text: "'जॉर्ज पंचम की नाक' पाठ में किसकी नाक लगाई गई?",
    options: [
      "एक आम नागरिक की",
      "एक जिंदा व्यक्ति की",
      "पत्थर की मूर्ति की",
      "किसी की नहीं, नाक लगाई ही नहीं गई",
    ],
    answer: "एक जिंदा व्यक्ति की",
    explanation:
      "कमलेश्वर की इस व्यंग्य कहानी में जब किसी भी मूर्ति की नाक जॉर्ज पंचम की मूर्ति पर फिट नहीं बैठी, तो अंततः एक जिंदा व्यक्ति की नाक काटकर लगा दी गई — यह प्रशासनिक व्यवस्था पर करारा व्यंग्य है।",
    difficulty: "HARD" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 3,
    text: "देव कवि किस काल के कवि हैं?",
    options: ["आदिकाल", "भक्तिकाल", "रीतिकाल", "आधुनिक काल"],
    answer: "रीतिकाल",
    explanation:
      "देव रीतिकाल के प्रमुख कवि हैं। उनकी रचनाओं में श्रृंगार रस की प्रधानता है और उन्होंने सवैया तथा कवित्त छंदों में उत्कृष्ट रचनाएँ की हैं।",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 12,
    text: "औपचारिक पत्र में प्रेषक का पता कहाँ लिखा जाता है?",
    options: [
      "पत्र के अंत में",
      "पत्र के बाईं ओर ऊपर",
      "पत्र के दाईं ओर मध्य में",
      "विषय के बाद",
    ],
    answer: "पत्र के बाईं ओर ऊपर",
    explanation:
      "औपचारिक पत्र में प्रेषक (भेजने वाले) का पता पत्र के बाईं ओर सबसे ऊपर लिखा जाता है, उसके बाद दिनांक, प्रापक का पता, विषय, संबोधन और फिर पत्र का मुख्य भाग लिखा जाता है।",
    difficulty: "EASY" as Difficulty,
  },
  {
    subjectCode: "HIN",
    chapterNo: 5,
    text: "'उत्साह' कविता में कवि निराला ने बादलों को किसका प्रतीक माना है?",
    options: [
      "विनाश का",
      "क्रांति और नवजीवन का",
      "सुंदरता का",
      "निराशा का",
    ],
    answer: "क्रांति और नवजीवन का",
    explanation:
      "सूर्यकांत त्रिपाठी 'निराला' ने 'उत्साह' कविता में बादलों को क्रांति और नवजीवन का प्रतीक माना है। बादल पुरानी व्यवस्था को ध्वस्त कर नई सृष्टि की संभावना लाते हैं।",
    difficulty: "MEDIUM" as Difficulty,
  },
];

// ─── SEED FUNCTION ───────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n");

  // ── 1. Clean existing data (reverse FK order) ────────────────────
  console.log("🗑️  Clearing existing data...");
  await prisma.$transaction([
    prisma.planItem.deleteMany(),
    prisma.studyPlan.deleteMany(),
    prisma.streak.deleteMany(),
    prisma.masteryScore.deleteMany(),
    prisma.diagnosticResponse.deleteMany(),
    prisma.diagnosticSession.deleteMany(),
    prisma.subjectGoal.deleteMany(),
    prisma.goal.deleteMany(),
    prisma.question.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.chapter.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.student.deleteMany(),
  ]);
  console.log("   Done.\n");

  // ── 2. Create subjects ───────────────────────────────────────────
  console.log("📚 Creating subjects...");
  const subjectDefs = [
    { name: "Mathematics", code: "MATH", totalMarks: 80 },
    { name: "Science", code: "SCI", totalMarks: 80 },
    { name: "Social Science", code: "SST", totalMarks: 80 },
    { name: "English", code: "ENG", totalMarks: 80 },
    { name: "Hindi", code: "HIN", totalMarks: 80 },
  ];

  const subjectMap: Record<string, string> = {}; // code → id

  for (const s of subjectDefs) {
    const subject = await prisma.subject.create({
      data: {
        name: s.name,
        code: s.code,
        board: "CBSE",
        grade: 10,
        totalMarks: s.totalMarks,
      },
    });
    subjectMap[s.code] = subject.id;
    console.log(`   ✓ ${s.name} (${s.code})`);
  }
  console.log();

  // ── 3. Create chapters ───────────────────────────────────────────
  console.log("📖 Creating chapters...");

  const chapterData: Record<string, ChapterDef[]> = {
    MATH: mathChapters,
    SCI: scienceChapters,
    SST: sstChapters,
    ENG: englishChapters,
    HIN: hindiChapters,
  };

  // chapterKey → chapter id  (key = "MATH-1", "SCI-3", etc.)
  const chapterMap: Record<string, string> = {};

  for (const [code, chapters] of Object.entries(chapterData)) {
    const subjectId = subjectMap[code];
    for (const ch of chapters) {
      const chapter = await prisma.chapter.create({
        data: {
          subjectId,
          name: ch.name,
          chapterNo: ch.chapterNo,
          totalMarks: ch.totalMarks,
          weightage: ch.weightage,
          frequency: ch.frequency,
        },
      });
      chapterMap[`${code}-${ch.chapterNo}`] = chapter.id;
    }
    console.log(`   ✓ ${code}: ${chapters.length} chapters`);
  }
  console.log();

  // ── 4. Create questions ──────────────────────────────────────────
  console.log("❓ Creating questions...");

  let questionCount = 0;
  for (const q of questions) {
    const chapterId = chapterMap[`${q.subjectCode}-${q.chapterNo}`];
    if (!chapterId) {
      console.warn(
        `   ⚠ Chapter not found: ${q.subjectCode}-${q.chapterNo}, skipping question.`
      );
      continue;
    }

    await prisma.question.create({
      data: {
        chapterId,
        type: QuestionType.MCQ,
        difficulty: q.difficulty,
        text: q.text,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        marks: 1,
      },
    });
    questionCount++;
  }
  console.log(`   ✓ ${questionCount} questions created across 5 subjects\n`);

  // ── 5. Summary ───────────────────────────────────────────────────
  const subjectCount = await prisma.subject.count();
  const chapterCount = await prisma.chapter.count();
  const totalQuestions = await prisma.question.count();

  console.log("─────────────────────────────────────────");
  console.log("  Seed Summary");
  console.log("─────────────────────────────────────────");
  console.log(`  Subjects  : ${subjectCount}`);
  console.log(`  Chapters  : ${chapterCount}`);
  console.log(`  Questions : ${totalQuestions}`);
  console.log("─────────────────────────────────────────");
  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
