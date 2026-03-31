export enum Part {
  A = "Part A",
  B = "Part B",
  C = "Part C",
  D = "Part D"
}

export enum QuestionType {
  MCQ = "MCQ",
  FILL_IN_BLANKS = "Fill in the Blanks",
  TRUE_FALSE = "True/False",
  ASSERTION_REASON = "Assertion & Reasoning",
  DESCRIPTIVE = "Descriptive"
}

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: string;
  text: string;
  marks: number;
  part: Part;
  type: QuestionType;
  subject: string;
  class: string;
  stream: string;
  chapter: string;
  options?: string[]; // For MCQ
  isMath?: boolean;
  difficulty?: Difficulty;
  answer?: string;
}

export interface Blueprint {
  subject: string;
  totalMarks: number;
  sections: {
    [key in Part]: {
      count: number;
      marksPerQuestion: number;
      description: string;
    }
  };
}
