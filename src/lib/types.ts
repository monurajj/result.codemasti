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

export type ResultPublicationStatus = "scores" | "under_review";

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
  publicationStatus?: ResultPublicationStatus;
};

export type PublicResultScoresPayload = {
  publicationStatus?: "scores";
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

export type PublicResultUnderReviewPayload = {
  publicationStatus: "under_review";
  resultId: string;
  studentName: string;
  testName: string;
  cstNumber: string;
  startedAt: string;
  finishedAt: string;
  message: string;
};

export type PublicResultPayload = PublicResultScoresPayload | PublicResultUnderReviewPayload;

export function isPublicResultUnderReview(
  payload: PublicResultPayload,
): payload is PublicResultUnderReviewPayload {
  return payload.publicationStatus === "under_review";
}

export function isSummaryUnderReview(summary: PublicResultSummary): boolean {
  return summary.publicationStatus === "under_review";
}
