export type AnswerOutcome = "correct" | "wrong" | "bonus";

export type OptionItem = string | { text?: string; imageUrl: string };

export type PublicQuestion = {
  id: string;
  questionType: string;
  questionText: string;
  questionImageUrl: string;
  options: OptionItem[];
  order: number;
  marks: number;
  isBonus?: boolean;
  correctAnswer?: number;
  correctNumericAnswer?: number;
  numericTolerance?: number;
  correctTextAnswer?: string;
};

export type PublicAnswerRow = {
  index: number;
  selected: number | string | null;
  correct: number | string;
  isCorrect: boolean;
  outcome: AnswerOutcome;
  isBonusQuestion: boolean;
  marks: number;
  maxMarks: number;
  marksEarned: number;
  selectedLabel: string;
  correctLabel: string;
};

export type PublicResultSummary = {
  resultId: string;
  testId: string;
  testName: string;
  studentName: string;
  cstNumber: string;
  marksObtained: number;
  totalMarks: number;
  totalQuestions: number;
  percentage: number;
  startedAt: string;
  finishedAt: string;
  sessionDurationSeconds: number | null;
  attemptLabel: string;
};

export type PublicResultPayload = {
  resultId: string;
  studentName: string;
  testName: string;
  cstNumber: string;
  marksObtained: number;
  totalMarks: number;
  totalQuestions: number;
  percentage: number;
  percentile: number | null;
  startedAt: string;
  finishedAt: string;
  sessionDurationSeconds: number | null;
  questions: PublicQuestion[];
  answers: PublicAnswerRow[];
};
