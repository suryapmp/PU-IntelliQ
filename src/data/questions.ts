import { Question, Part, QuestionType } from '../types';

export const QUESTION_BANK: Question[] = [
  // II PU Physics - Electric Charges and Fields
  {
    id: "p1",
    text: "The SI unit of electric charge is",
    marks: 1,
    part: Part.A,
    type: QuestionType.MCQ,
    options: ["Coulomb", "Newton", "Farad", "Joule"],
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    difficulty: "Easy",
    answer: "Coulomb"
  },
  {
    id: "p2",
    text: "What is the value of charge on an electron?",
    marks: 1,
    part: Part.A,
    type: QuestionType.DESCRIPTIVE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    isMath: true,
    difficulty: "Easy",
    answer: "\\( -1.6 \\times 10^{-19} \\) C"
  },
  {
    id: "p3",
    text: "State Coulomb's law in electrostatics.",
    marks: 2,
    part: Part.B,
    type: QuestionType.DESCRIPTIVE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    difficulty: "Medium",
    answer: "The force of attraction or repulsion between two stationary point charges is directly proportional to the product of the magnitudes of charges and inversely proportional to the square of the distance between them."
  },
  {
    id: "p4",
    text: "Define electric dipole moment. Give its SI unit.",
    marks: 2,
    part: Part.B,
    type: QuestionType.DESCRIPTIVE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields"
  },
  {
    id: "p5",
    text: "Derive an expression for electric field at a point on the axial line of an electric dipole.",
    marks: 5,
    part: Part.D,
    type: QuestionType.DESCRIPTIVE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    isMath: true
  },
  {
    id: "p6",
    text: "State and prove Gauss's law in electrostatics.",
    marks: 5,
    part: Part.D,
    type: QuestionType.DESCRIPTIVE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    isMath: true
  },
  {
    id: "p7",
    text: "Write any three properties of electric field lines.",
    marks: 3,
    part: Part.C,
    type: QuestionType.DESCRIPTIVE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields"
  },
  {
    id: "p8",
    text: "Define electric flux. Is it a scalar or vector?",
    marks: 2,
    part: Part.B,
    type: QuestionType.DESCRIPTIVE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields"
  },
  {
    id: "p9",
    text: "The electric field inside a uniformly charged spherical shell is zero.",
    marks: 1,
    part: Part.A,
    type: QuestionType.TRUE_FALSE,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    difficulty: "Easy",
    answer: "True"
  },
  {
    id: "p10",
    text: "The total electric flux through a closed surface is equal to ________ times the net charge enclosed by the surface.",
    marks: 1,
    part: Part.A,
    type: QuestionType.FILL_IN_BLANKS,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    difficulty: "Medium",
    answer: "\\( 1/\\epsilon_0 \\)"
  },
  {
    id: "p11",
    text: "Assertion (A): Electric field lines never intersect each other. \nReasoning (R): At the point of intersection, the electric field would have two different directions, which is not possible.",
    marks: 1,
    part: Part.A,
    type: QuestionType.ASSERTION_REASON,
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Electric Charges and Fields",
    difficulty: "Medium",
    answer: "Both A and R are true and R is the correct explanation of A."
  },
  {
    id: "p12",
    text: "The de Broglie wavelength associated with an electron accelerated through a potential difference of \\( V \\) volts is:",
    marks: 1,
    part: Part.A,
    type: QuestionType.MCQ,
    options: [
      "\\( \\lambda = \\frac{12.27}{\\sqrt{V}} \\text{ nm} \\)",
      "\\( \\lambda = \\frac{1.227}{\\sqrt{V}} \\text{ nm} \\)",
      "\\( \\lambda = \\frac{122.7}{\\sqrt{V}} \\text{ nm} \\)",
      "\\( \\lambda = \\frac{0.1227}{\\sqrt{V}} \\text{ nm} \\)"
    ],
    subject: "Physics",
    class: "II PU",
    stream: "Science",
    chapter: "Dual Nature of Radiation and Matter",
    isMath: true,
    difficulty: "Medium",
    answer: "\\( \\lambda = \\frac{1.227}{\\sqrt{V}} \\text{ nm} \\)"
  },

  // II PU Accountancy - Partnership
  {
    id: "a1",
    text: "What is a Partnership Deed?",
    marks: 1,
    part: Part.A,
    type: QuestionType.DESCRIPTIVE,
    subject: "Accountancy",
    class: "II PU",
    stream: "Commerce",
    chapter: "Partnership Accounts"
  },
  {
    id: "a2",
    text: "State any one feature of partnership.",
    marks: 1,
    part: Part.A,
    type: QuestionType.DESCRIPTIVE,
    subject: "Accountancy",
    class: "II PU",
    stream: "Commerce",
    chapter: "Partnership Accounts"
  },
  {
    id: "a3",
    text: "What is Profit and Loss Appropriation Account?",
    marks: 2,
    part: Part.B,
    type: QuestionType.DESCRIPTIVE,
    subject: "Accountancy",
    class: "II PU",
    stream: "Commerce",
    chapter: "Partnership Accounts"
  },
  {
    id: "a4",
    text: "Distinguish between Fixed Capital and Fluctuating Capital methods.",
    marks: 5,
    part: Part.D,
    type: QuestionType.DESCRIPTIVE,
    subject: "Accountancy",
    class: "II PU",
    stream: "Commerce",
    chapter: "Partnership Accounts"
  },
  {
    id: "a5",
    text: "Explain the treatment of Goodwill on the admission of a new partner.",
    marks: 5,
    part: Part.D,
    type: QuestionType.DESCRIPTIVE,
    subject: "Accountancy",
    class: "II PU",
    stream: "Commerce",
    chapter: "Partnership Accounts"
  },
  {
    id: "a6",
    text: "What is Sacrifice Ratio?",
    marks: 2,
    part: Part.B,
    type: QuestionType.DESCRIPTIVE,
    subject: "Accountancy",
    class: "II PU",
    stream: "Commerce",
    chapter: "Partnership Accounts"
  }
];
