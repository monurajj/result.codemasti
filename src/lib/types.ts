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

export type ResultPublicationStatus = "scores" | "under_review" | "awaiting_release";

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

export type PublicResultWithheldPayload = {
  publicationStatus: "under_review" | "awaiting_release";
  resultId: string;
  studentName: string;
  testName: string;
  cstNumber: string;
  startedAt: string;
  finishedAt: string;
  message: string;
};

export type PublicResultUnderReviewPayload = Extract<
  PublicResultWithheldPayload,
  { publicationStatus: "under_review" }
>;

export type PublicResultPayload = PublicResultScoresPayload | PublicResultWithheldPayload;

export function isPublicResultWithheld(
  payload: PublicResultPayload,
): payload is PublicResultWithheldPayload {
  return (
    payload.publicationStatus === "under_review" ||
    payload.publicationStatus === "awaiting_release"
  );
}

export function isPublicResultUnderReview(
  payload: PublicResultPayload,
): payload is PublicResultWithheldPayload {
  return isPublicResultWithheld(payload);
}

export function isSummaryWithheld(summary: PublicResultSummary): boolean {
  return (
    summary.publicationStatus === "under_review" ||
    summary.publicationStatus === "awaiting_release"
  );
}

export function isSummaryUnderReview(summary: PublicResultSummary): boolean {
  return isSummaryWithheld(summary);
}
