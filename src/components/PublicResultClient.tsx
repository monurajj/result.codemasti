"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Download,
  GraduationCap,
  Hash,
  Info,
  Mail,
  Percent,
  Target,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import {
  CST_DIGITS_LENGTH,
  extractCstDigits,
  isValidCstDigits,
  normalizeCstFromInput,
} from "@/lib/cst";
import { usePublicResultPdfDownload } from "@/components/public-result/usePublicResultPdfDownload";
import { CodeMastiTextLogo } from "@/components/CodeMastiTextLogo";
import "@/app/public-result.css";
import type {
  AnswerOutcome,
  PublicAnswerRow,
  PublicResultPayload,
  PublicResultSummary,
} from "@/lib/types";

/** Official scholarship results portal — students verify with CST or email. */
const CODEMASTI_SITE_URL = "https://codemasti.com";

function formatWhen(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWhenBadge(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getResultMonthKey(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  if (!year || !month) return null;
  return `${year}-${month}`;
}

function formatResultMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthKey;
  return d.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function buildResultFilterOptions(results: PublicResultSummary[]) {
  const monthMap = new Map<string, string>();
  const testMap = new Map<string, string>();

  for (const result of results) {
    const monthKey = getResultMonthKey(result.finishedAt);
    if (monthKey) monthMap.set(monthKey, formatResultMonthLabel(monthKey));

    const testKey = result.testId || result.testName;
    if (testKey) testMap.set(testKey, result.testName || "Scholarship test");
  }

  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([value, label]) => ({ value, label }));

  const tests = Array.from(testMap.entries())
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([value, label]) => ({ value, label }));

  return { months, tests };
}

function filterResults(
  results: PublicResultSummary[],
  monthFilter: string,
  testFilter: string,
) {
  return results.filter((result) => {
    if (monthFilter && getResultMonthKey(result.finishedAt) !== monthFilter) return false;
    if (testFilter) {
      const testKey = result.testId || result.testName;
      if (testKey !== testFilter) return false;
    }
    return true;
  });
}

function normalizeCstInput(raw: string) {
  return normalizeCstFromInput(raw);
}

function optionLabel(opt: string | { text?: string; imageUrl: string }) {
  if (typeof opt === "string") return opt;
  return opt.text?.trim() || (opt.imageUrl ? "(image)" : "");
}

function scoreTierClass(percentage: number) {
  if (percentage >= 60) return "pr-attempt-pct--high";
  if (percentage >= 30) return "pr-attempt-pct--mid";
  return "pr-attempt-pct--low";
}

function resolveAnswerOutcome(row: PublicAnswerRow): AnswerOutcome {
  if (row.outcome) return row.outcome;
  return row.isCorrect ? "correct" : "wrong";
}

function answerRowPresentation(row: PublicAnswerRow) {
  const outcome = resolveAnswerOutcome(row);
  const countsForScore = row.isCorrect || outcome === "bonus";
  const statusLabel =
    outcome === "bonus" ? "Bonus" : outcome === "correct" ? "Correct" : "Wrong";
  const itemClass =
    outcome === "bonus"
      ? "pr-answer-item--bonus"
      : countsForScore
        ? "pr-answer-item--ok"
        : "pr-answer-item--bad";
  const marksClass = countsForScore ? "pr-answer-marks--earned" : "pr-answer-marks--missed";
  return { outcome, statusLabel, itemClass, marksClass, countsForScore };
}

function ResultAttemptCard({
  result,
  onSelect,
  onDownload,
  downloadBusy,
  badgeLabel,
  compact = false,
}: {
  result: PublicResultSummary;
  onSelect: () => void;
  onDownload: () => void;
  downloadBusy: boolean;
  badgeLabel?: string;
  compact?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, result.percentage));

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <article
      className="pr-attempt"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <header className="pr-attempt-head">
        <div className="pr-attempt-identity">
          <div className="pr-attempt-icon" aria-hidden>
            <GraduationCap size={22} strokeWidth={2} />
          </div>
          <div className="pr-attempt-info">
            <h3 className="pr-attempt-name">{result.testName}</h3>
            {!compact ? <p className="pr-attempt-student">{result.studentName}</p> : null}
          </div>
        </div>
        <div className="pr-attempt-head-actions">
          <button
            type="button"
            className="pr-attempt-download"
            title="Download result PDF"
            aria-label="Download result PDF"
            disabled={downloadBusy}
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            {downloadBusy ? <LoadingSpinner size={16} /> : <Download size={16} />}
          </button>
          <span className="pr-attempt-badge">{badgeLabel ?? result.attemptLabel}</span>
        </div>
      </header>

      <div className="pr-attempt-score">
        <div className={`pr-attempt-pct ${scoreTierClass(pct)}`}>
          <span className="pr-attempt-pct-val">{pct.toFixed(1)}%</span>
          <span className="pr-attempt-pct-lbl">Overall</span>
        </div>
        <div className="pr-attempt-progress">
          <div className="pr-attempt-progress-track">
            <div className="pr-attempt-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="pr-attempt-summary">
            <span className="pr-attempt-summary-marks">
              {result.marksObtained}/{result.totalMarks} marks
            </span>
            <span className="pr-attempt-summary-dot" aria-hidden>
              ·
            </span>
            <span>{result.totalQuestions} questions</span>
          </p>
        </div>
      </div>

      <div className="pr-attempt-metrics">
        <div className="pr-attempt-metric">
          <Target size={14} className="pr-attempt-metric-ico" aria-hidden />
          <span className="pr-attempt-metric-lbl">Score</span>
          <span className="pr-attempt-metric-val">
            {result.marksObtained}/{result.totalMarks}
          </span>
        </div>
        <div className="pr-attempt-metric">
          <Percent size={14} className="pr-attempt-metric-ico" aria-hidden />
          <span className="pr-attempt-metric-lbl">Percentage</span>
          <span className="pr-attempt-metric-val">{pct.toFixed(2)}%</span>
        </div>
        <div className="pr-attempt-metric pr-attempt-metric--wide">
          <Calendar size={14} className="pr-attempt-metric-ico" aria-hidden />
          <span className="pr-attempt-metric-lbl">Finished</span>
          <span className="pr-attempt-metric-val pr-attempt-metric-val--date">
            {formatWhen(result.finishedAt)}
          </span>
        </div>
      </div>

      <footer className="pr-attempt-action">
        <span className="pr-attempt-action-lbl">View full result</span>
        <span className="pr-attempt-action-ico" aria-hidden>
          <ArrowRight size={16} strokeWidth={2.5} />
        </span>
      </footer>
    </article>
  );
}

function CodeMastiBrandHeader({
  title,
  subtitle,
  cstNumber,
}: {
  title: string;
  subtitle?: ReactNode;
  cstNumber?: string;
}) {
  return (
    <header className="pr-brand">
      <div className="pr-brand-logo-wrap">
        <CodeMastiTextLogo priority />
      </div>
      <p className="pr-brand-eyebrow">Scholarship Results</p>
      <h1 className="pr-brand-title">{title}</h1>
      {subtitle ? <p className="pr-brand-sub">{subtitle}</p> : null}
      {cstNumber ? (
        <div className="pr-cst-pill">
          <Hash size={14} />
          {cstNumber}
        </div>
      ) : null}
    </header>
  );
}

function CodeMastiFooter() {
  return (
    <footer className="pr-footer">
      <CodeMastiTextLogo variant="footer" />
      <span>
        <a href="mailto:support@codemati.com">support@codemati.com</a> · +91 75410 62514
        <br />
        <a href={CODEMASTI_SITE_URL} target="_blank" rel="noopener noreferrer">
          codemasti.com
        </a>
      </span>
    </footer>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="pr-page-inner">
      {children}
      <CodeMastiFooter />
    </div>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={["pr-skel-bar", className].filter(Boolean).join(" ")} />;
}

function SkeletonAttemptTile() {
  return (
    <div className="pr-skel-attempt" aria-hidden>
      <div className="pr-skel-attempt-head">
        <SkeletonBar className="pr-skel-ico" />
        <div className="pr-skel-attempt-meta">
          <SkeletonBar className="pr-skel-title" />
          <SkeletonBar className="pr-skel-sub" />
        </div>
        <SkeletonBar className="pr-skel-badge" />
      </div>
      <div className="pr-skel-attempt-score">
        <SkeletonBar className="pr-skel-pct" />
        <div className="pr-skel-attempt-progress">
          <SkeletonBar className="pr-skel-track" />
          <SkeletonBar className="pr-skel-line-sm" />
        </div>
      </div>
      <div className="pr-skel-attempt-metrics">
        <SkeletonBar className="pr-skel-metric" />
        <SkeletonBar className="pr-skel-metric" />
        <SkeletonBar className="pr-skel-metric" />
      </div>
      <SkeletonBar className="pr-skel-foot" />
    </div>
  );
}

function ResultLoadingSkeleton({ variant }: { variant: "list" | "detail" }) {
  return (
    <PageShell>
      <div className="pr-skel-status" role="status" aria-live="polite">
        <span className="pr-skel-ring" aria-hidden />
        <span>
          {variant === "detail"
            ? "Loading result details…"
            : variant === "list"
              ? "Fetching your test attempts…"
              : "Loading…"}
        </span>
      </div>

      <div className="pr-skel-brand" aria-hidden>
        <div className="pr-brand-logo-wrap">
          <CodeMastiTextLogo />
        </div>
        <SkeletonBar className="pr-skel-heading" />
        <SkeletonBar className="pr-skel-subtitle" />
        <SkeletonBar className="pr-skel-cst" />
      </div>

      {variant === "list" && (
        <>
          <SkeletonBar className="pr-skel-banner" />
          <div className="pr-attempt-grid pr-skel-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonAttemptTile key={i} />
            ))}
          </div>
        </>
      )}

      {variant === "detail" && (
        <div className="pr-skel-detail" aria-hidden>
          <div className="pr-skel-score-panel">
            <SkeletonBar className="pr-skel-ring-lg" />
            <div className="pr-skel-score-stats">
              <SkeletonBar className="pr-skel-stat-box" />
              <SkeletonBar className="pr-skel-stat-box" />
              <SkeletonBar className="pr-skel-stat-box" />
            </div>
          </div>
          <div className="pr-skel-answers">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBar key={i} className="pr-skel-answer-row" />
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function ScoreRing({ percentage }: { percentage: number }) {
  const pct = Math.min(100, Math.max(0, percentage));
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="pr-score-ring" aria-hidden>
      <svg viewBox="0 0 64 64">
        <defs>
          <linearGradient id="prScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#F15A24" />
          </linearGradient>
        </defs>
        <circle className="pr-score-ring-bg" cx="32" cy="32" r={r} />
        <circle
          className="pr-score-ring-fill"
          cx="32"
          cy="32"
          r={r}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="pr-score-ring-label">
        <strong>{pct.toFixed(0)}%</strong>
        <span>Score</span>
      </div>
    </div>
  );
}

function ResultDetailView({
  data,
  onBack,
  showBack,
  onDownload,
  downloadBusy,
}: {
  data: PublicResultPayload;
  onBack?: () => void;
  showBack: boolean;
  onDownload: () => void;
  downloadBusy: boolean;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const scoredCount = data.answers.filter((a) => a.isCorrect).length;
  const answeredCorrectCount = data.answers.filter(
    (a) => resolveAnswerOutcome(a) === "correct",
  ).length;

  return (
    <PageShell>
      <div className="pr-detail-page">
      {showBack && onBack && (
        <button type="button" className="pr-back-btn" onClick={onBack}>
          <ChevronLeft size={18} />
          All attempts
        </button>
      )}
      <div className="pr-detail-top">
        <CodeMastiBrandHeader
          title={data.studentName}
          subtitle={data.testName}
          cstNumber={data.cstNumber}
        />
        <button
          type="button"
          className="pr-download-btn"
          onClick={onDownload}
          disabled={downloadBusy}
        >
          {downloadBusy ? (
            <LoadingSpinner size={18} variant="light" />
          ) : (
            <Download size={18} />
          )}
          Download PDF
        </button>
      </div>

      <section className="pr-card pr-card--score">
        <div className="pr-score-hero">
          <ScoreRing percentage={data.percentage} />
          <div className="pr-score-grid">
            <div className="pr-score-item pr-score-item--main">
              <span>
                <span className="pr-score-item-label-full">Marks</span>
                <span className="pr-score-item-label-short">Marks</span>
              </span>
              <strong>
                {data.marksObtained} / {data.totalMarks}
              </strong>
            </div>
            <div className="pr-score-item">
              <span>
                <span className="pr-score-item-label-full">Scored</span>
                <span className="pr-score-item-label-short">Scored</span>
              </span>
              <strong>
                {scoredCount} / {data.totalQuestions}
              </strong>
            </div>
            {answeredCorrectCount !== scoredCount && (
              <div className="pr-score-item">
                <span>
                  <span className="pr-score-item-label-full">Answered correctly</span>
                  <span className="pr-score-item-label-short">Correct</span>
                </span>
                <strong>
                  {answeredCorrectCount} / {data.totalQuestions}
                </strong>
              </div>
            )}
            <div className="pr-score-item">
              <span>
                <span className="pr-score-item-label-full">Percentile</span>
                <span className="pr-score-item-label-short">Rank</span>
              </span>
              <strong>
                {data.percentile !== null ? `${data.percentile.toFixed(1)}%` : "—"}
              </strong>
            </div>
          </div>
        </div>
        <div className="pr-meta pr-meta--detail">
          <div>
            <span>Started</span>
            <strong>{formatWhen(data.startedAt)}</strong>
          </div>
          <div>
            <span>Finished</span>
            <strong>{formatWhen(data.finishedAt)}</strong>
          </div>
          {typeof data.sessionDurationSeconds === "number" && data.sessionDurationSeconds > 0 && (
            <div>
              <span>Duration</span>
              <strong>
                {Math.floor(data.sessionDurationSeconds / 60)}m {data.sessionDurationSeconds % 60}s
              </strong>
            </div>
          )}
          <div>
            <span>Questions</span>
            <strong>{data.totalQuestions}</strong>
          </div>
        </div>
      </section>

      <section className="pr-card pr-card--flat">
        <h2 className="pr-section-title">
          <ClipboardList size={18} />
          Answer breakdown
        </h2>
        {data.answers.map((row) => {
          const q = data.questions[row.index];
          const isOpen = expanded === row.index;
          const maxMarks = row.maxMarks ?? q?.marks ?? row.marks ?? 1;
          const earned = row.marksEarned ?? (row.isCorrect ? maxMarks : 0);
          const { statusLabel, itemClass, marksClass } = answerRowPresentation(row);

          return (
            <div
              key={row.index}
              className={`pr-answer-item ${itemClass}${isOpen ? " pr-answer-item--open" : ""}`}
            >
              <button
                type="button"
                className="pr-answer-head"
                onClick={() => setExpanded((cur) => (cur === row.index ? null : row.index))}
                aria-expanded={isOpen}
              >
                <div className="pr-answer-head-main">
                  <div className="pr-answer-head-top">
                    <span className="pr-answer-q">Q{row.index + 1}</span>
                    <span className={`pr-answer-marks ${marksClass}`}>
                      <strong>
                        {earned}/{maxMarks}
                      </strong>
                      <span> marks</span>
                    </span>
                  </div>
                  <p className="pr-answer-picks">
                    <span className="pr-answer-pick">
                      <span className="pr-answer-pick-lbl">You</span> {row.selectedLabel}
                    </span>
                    <span className="pr-answer-pick-sep" aria-hidden>
                      ·
                    </span>
                    <span className="pr-answer-pick">
                      <span className="pr-answer-pick-lbl">Correct</span> {row.correctLabel}
                    </span>
                  </p>
                </div>
                <div className="pr-answer-head-end">
                  <span className="pr-answer-status">{statusLabel}</span>
                  <ChevronDown
                    size={18}
                    className="pr-answer-chevron"
                    aria-hidden
                  />
                </div>
              </button>
              {isOpen && (
                <div className="pr-answer-body">
                  {q ? (
                    <>
                      <div className="pr-question-panel">
                        <div className="pr-question-panel-head">
                          <span className="pr-question-panel-lbl">Question {row.index + 1}</span>
                          <span
                            className={`pr-question-marks-badge ${marksClass === "pr-answer-marks--earned" ? "pr-question-marks-badge--ok" : "pr-question-marks-badge--bad"}`}
                          >
                            {earned} / {maxMarks} marks
                          </span>
                          {(row.isBonusQuestion || q.isBonus) && (
                            <span className="pr-bonus-badge">Bonus question</span>
                          )}
                        </div>
                        <p className="pr-question-text">{q.questionText}</p>
                        {q.questionImageUrl ? (
                          <img src={q.questionImageUrl} alt="" className="pr-question-img" />
                        ) : null}
                      </div>
                      {(q.questionType === "multiple_choice" || q.questionType === "image_choice") &&
                      q.options.length > 0 ? (
                        <ul className="pr-options">
                          {q.options.map((opt, oidx) => {
                            const isSelected =
                              typeof row.selected === "number" && row.selected === oidx;
                            const isCorr = typeof row.correct === "number" && row.correct === oidx;
                            const imageUrl = typeof opt === "string" ? "" : opt.imageUrl;
                            return (
                              <li
                                key={oidx}
                                className={[
                                  "pr-option",
                                  isSelected && "pr-option--picked",
                                  isCorr && "pr-option--correct",
                                  isSelected && !row.isCorrect && "pr-option--wrong-pick",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <strong>{String.fromCharCode(65 + oidx)}.</strong>
                                <span>
                                  {optionLabel(opt)}
                                  {imageUrl ? (
                                    <img src={imageUrl} alt="" className="pr-question-img" />
                                  ) : null}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="pr-answer-freeform">
                          <p>
                            <span className="pr-answer-pick-lbl">Your answer</span>
                            <strong>{row.selectedLabel}</strong>
                          </p>
                          <p>
                            <span className="pr-answer-pick-lbl">Correct answer</span>
                            <strong>{row.correctLabel}</strong>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="pr-answer-missing">Question details are not available.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
      </div>
    </PageShell>
  );
}

function LoadingSpinner({
  size = 18,
  variant = "orange",
}: {
  size?: number;
  variant?: "light" | "orange";
}) {
  return (
    <span
      className={`pr-btn-spinner${variant === "light" ? "" : " pr-btn-spinner--orange"}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

function normalizeEmailInput(raw: string) {
  return raw.trim().toLowerCase();
}

const OTP_RESEND_COOLDOWN_SEC = 60;

function parseOtpRetrySeconds(
  error?: string,
  retryAfterSeconds?: number,
): number | null {
  if (typeof retryAfterSeconds === "number" && retryAfterSeconds > 0) {
    return Math.ceil(retryAfterSeconds);
  }
  if (!error) return null;
  const match = error.match(/wait\s+(\d+)\s+seconds?/i);
  if (!match) return null;
  const seconds = Number.parseInt(match[1], 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function maskEmailForDisplay(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at <= 1) return "your registered email";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const visible = local.slice(0, 2);
  const masked = "*".repeat(Math.min(Math.max(local.length - 2, 3), 8));
  return `${visible}${masked}@${domain}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ResultListView({
  cstNumber,
  studentName,
  results,
  onSelect,
  onDownloadAttempt,
  downloadingId,
}: {
  cstNumber: string;
  studentName: string;
  results: PublicResultSummary[];
  onSelect: (resultId: string) => void;
  onDownloadAttempt: (summary: PublicResultSummary) => void;
  downloadingId: string | null;
}) {
  const [monthFilter, setMonthFilter] = useState("");
  const [testFilter, setTestFilter] = useState("");

  const { months, tests } = useMemo(() => buildResultFilterOptions(results), [results]);
  const showFilters = results.length > 1 && (months.length > 1 || tests.length > 1);

  const filteredResults = useMemo(
    () => filterResults(results, monthFilter, testFilter),
    [results, monthFilter, testFilter],
  );

  const filtersActive = Boolean(monthFilter || testFilter);
  const latest = filteredResults[0] ?? null;
  const past = filteredResults.slice(1);

  const clearFilters = () => {
    setMonthFilter("");
    setTestFilter("");
  };

  return (
    <PageShell>
      <div className="pr-list-page">
      <CodeMastiBrandHeader
        title={studentName || "Your results"}
        subtitle={
          filtersActive ? (
            <>
              <span className="pr-brand-sub-long">
                Showing <strong>{filteredResults.length}</strong> of{" "}
                <strong>{results.length}</strong> attempt{results.length === 1 ? "" : "s"}
                {monthFilter || testFilter ? " matching your filters" : ""}
              </span>
              <span className="pr-brand-sub-short">
                <strong>{filteredResults.length}</strong> of <strong>{results.length}</strong> shown
              </span>
            </>
          ) : (
            <>
              <span className="pr-brand-sub-long">
                <strong>{results.length}</strong> test attempt{results.length === 1 ? "" : "s"} on
                record — newest first
              </span>
              <span className="pr-brand-sub-short">
                <strong>{results.length}</strong> attempt{results.length === 1 ? "" : "s"} · newest
                first
              </span>
            </>
          )
        }
        cstNumber={cstNumber}
      />

      <div className="pr-list-banner">
        <Info size={18} className="pr-list-banner-ico" aria-hidden />
        <p>
          <span className="pr-list-banner-long">
            Your most recent attempt is shown first. Select any test below to view the full score,
            percentile, and answer breakdown.
          </span>
          <span className="pr-list-banner-short">
            Latest attempt first — tap a card for full score and answers.
          </span>
        </p>
      </div>

      {showFilters ? (
        <div
          className={`pr-results-filters${months.length > 0 && tests.length > 0 ? " pr-results-filters--dual" : ""}`}
          role="group"
          aria-label="Filter results"
        >
          <div className="pr-results-filter">
            <label className="pr-results-filter-label" htmlFor="pr-filter-month">
              <Calendar size={15} aria-hidden />
              Month
            </label>
            <div className="pr-results-filter-select-wrap">
              <select
                id="pr-filter-month"
                className="pr-results-filter-select"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="">All months</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pr-results-filter-chevron" aria-hidden />
            </div>
          </div>

          <div className="pr-results-filter">
            <label className="pr-results-filter-label" htmlFor="pr-filter-test">
              <ClipboardList size={15} aria-hidden />
              Test type
            </label>
            <div className="pr-results-filter-select-wrap">
              <select
                id="pr-filter-test"
                className="pr-results-filter-select"
                value={testFilter}
                onChange={(e) => setTestFilter(e.target.value)}
              >
                <option value="">All tests</option>
                {tests.map((test) => (
                  <option key={test.value} value={test.value}>
                    {test.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pr-results-filter-chevron" aria-hidden />
            </div>
          </div>

          {filtersActive ? (
            <button type="button" className="pr-results-filter-clear" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {filtersActive ? (
        <div className="pr-results-active-chips" aria-label="Active filters">
          {monthFilter ? (
            <span className="pr-results-chip">
              {months.find((m) => m.value === monthFilter)?.label ?? monthFilter}
            </span>
          ) : null}
          {testFilter ? (
            <span className="pr-results-chip">
              {tests.find((t) => t.value === testFilter)?.label ?? "Test"}
            </span>
          ) : null}
        </div>
      ) : null}

      {filteredResults.length === 0 ? (
        <div className="pr-results-empty">
          <p>No results match the selected filters.</p>
          <button type="button" className="pr-results-filter-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {latest ? (
            <section className="pr-results-section">
              <h2 className="pr-results-section-title">
                {filtersActive && filteredResults.length > 1 ? "Top match" : "Latest result"}
              </h2>
              <div className="pr-attempt-grid pr-attempt-grid--single">
                <ResultAttemptCard
                  key={latest.resultId}
                  result={latest}
                  compact
                  badgeLabel={filtersActive ? "Newest match" : "Latest"}
                  onSelect={() => onSelect(latest.resultId)}
                  onDownload={() => onDownloadAttempt(latest)}
                  downloadBusy={downloadingId === latest.resultId}
                />
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className="pr-results-section">
              <h2 className="pr-results-section-title">
                {filtersActive ? "More results" : "Past results"}{" "}
                <span className="pr-results-section-count">({past.length})</span>
              </h2>
              <div className="pr-attempt-grid">
                {past.map((r, index) => (
                  <ResultAttemptCard
                    key={r.resultId}
                    result={r}
                    compact
                    badgeLabel={
                      formatWhenBadge(r.finishedAt) !== "—"
                        ? formatWhenBadge(r.finishedAt)
                        : `Past ${index + 1}`
                    }
                    onSelect={() => onSelect(r.resultId)}
                    onDownload={() => onDownloadAttempt(r)}
                    downloadBusy={downloadingId === r.resultId}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
      </div>
    </PageShell>
  );
}

function resultAccessStorageKey(cst: string) {
  return `cm-result-access-${normalizeCstInput(cst)}`;
}

function readStoredResultAccessToken(cst: string): string {
  if (typeof window === "undefined" || !cst) return "";
  try {
    return sessionStorage.getItem(resultAccessStorageKey(cst))?.trim() ?? "";
  } catch {
    return "";
  }
}

function storeResultAccessToken(cst: string, token: string) {
  if (typeof window === "undefined" || !cst || !token) return;
  try {
    sessionStorage.setItem(resultAccessStorageKey(cst), token);
  } catch {
    /* ignore */
  }
}

function ResultLookupPage({
  onCstSubmit,
  onEmailVerified,
}: {
  onCstSubmit: (cst: string) => void;
  onEmailVerified: (cst: string, token: string) => void;
}) {
  const [tab, setTab] = useState<"cst" | "email">("cst");
  const [cstInput, setCstInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailVerify, setEmailVerify] = useState(false);

  const normalizedCst = normalizeCstInput(cstInput);
  const cstDigits = extractCstDigits(cstInput);
  const cstDigitsComplete = isValidCstDigits(cstDigits);
  const normalizedEmail = normalizeEmailInput(emailInput);

  if (tab === "email" && emailVerify && isValidEmail(normalizedEmail)) {
    return (
      <ResultVerificationGate
        email={normalizedEmail}
        onVerified={(token, cst) => onEmailVerified(cst, token)}
        onBack={() => setEmailVerify(false)}
      />
    );
  }

  const handleCstSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (normalizedCst) onCstSubmit(normalizedCst);
  };

  const handleEmailContinue = (e: FormEvent) => {
    e.preventDefault();
    if (isValidEmail(normalizedEmail)) setEmailVerify(true);
  };

  return (
    <PageShell>
      <CodeMastiBrandHeader
        title="View your results"
        subtitle="Enter your CST number or registered email. Published results appear here after review by the CodeMasti team."
      />

      <div className="pr-lookup-panel">
        <div className="pr-lookup-tabs" role="tablist" aria-label="Lookup method">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "cst"}
            className={`pr-lookup-tab${tab === "cst" ? " pr-lookup-tab--active" : ""}`}
            onClick={() => setTab("cst")}
          >
            <Hash size={16} aria-hidden />
            CST ID
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "email"}
            className={`pr-lookup-tab${tab === "email" ? " pr-lookup-tab--active" : ""}`}
            onClick={() => setTab("email")}
          >
            <Mail size={16} aria-hidden />
            Email
          </button>
        </div>

        {tab === "cst" ? (
          <form className="pr-cst-form" onSubmit={handleCstSubmit}>
            <label className="pr-cst-label" htmlFor="result-cst">
              CST ID
            </label>
            <div className="pr-cst-row">
              <div className="pr-cst-input-wrap">
                <span className="pr-cst-prefix" aria-hidden>
                  cst-
                </span>
                <input
                  id="result-cst"
                  className="pr-cst-input"
                  value={cstInput}
                  onChange={(e) =>
                    setCstInput(e.target.value.replace(/\D/g, "").slice(0, CST_DIGITS_LENGTH))
                  }
                  placeholder="26000xxx"
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="numeric"
                  maxLength={CST_DIGITS_LENGTH}
                  aria-invalid={cstDigits.length > 0 && !cstDigitsComplete}
                />
              </div>
              <button type="submit" className="pr-cst-submit" disabled={!cstDigitsComplete}>
                Continue
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
            <p className="pr-cst-hint">
              Enter all {CST_DIGITS_LENGTH} digits (e.g. <strong>26000xxx</strong>). We will email you
              a one-time verification code.
            </p>
            {cstDigits.length > 0 && !cstDigitsComplete ? (
              <p className="pr-error-inline" role="alert">
                CST ID must be exactly {CST_DIGITS_LENGTH} digits ({cstDigits.length}/
                {CST_DIGITS_LENGTH} entered).
              </p>
            ) : null}
          </form>
        ) : (
          <form className="pr-cst-form" onSubmit={handleEmailContinue}>
            <label className="pr-cst-label" htmlFor="result-email">
              Registered email
            </label>
            <div className="pr-cst-row">
              <div className="pr-cst-input-wrap">
                <input
                  id="result-email"
                  type="email"
                  className="pr-cst-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.email@gmail.com"
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>
              <button type="submit" className="pr-cst-submit" disabled={!isValidEmail(normalizedEmail)}>
                Continue
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
            <p className="pr-cst-hint">
              We will send a verification code if this email matches a registration on file.
            </p>
          </form>
        )}

        <p className="pr-cst-hint pr-lookup-note">
          Results are released from the admin panel after your test is reviewed. If you recently
          completed a test, check back here once they are published.
        </p>
      </div>
    </PageShell>
  );
}

function ResultVerificationGate({
  cstNumber,
  email,
  onVerified,
  onBack,
}: {
  cstNumber?: string;
  email?: string;
  onVerified: (token: string, resolvedCst: string) => void;
  onBack?: () => void;
}) {
  const normalizedCst = cstNumber ? normalizeCstInput(cstNumber) : "";
  const normalizedEmail = email ? normalizeEmailInput(email) : "";
  const canVerify = Boolean(normalizedCst || isValidEmail(normalizedEmail));

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSendBusy, setOtpSendBusy] = useState(false);
  const [otpVerifyBusy, setOtpVerifyBusy] = useState(false);
  const [error, setError] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const otpPayload = normalizedCst
    ? { cstNumber: normalizedCst, purpose: "result" as const }
    : { email: normalizedEmail, purpose: "result" as const };

  const startResendCooldown = useCallback((seconds = OTP_RESEND_COOLDOWN_SEC) => {
    const sec = Math.max(1, Math.ceil(seconds));
    setResendCooldown(sec);
    if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
    resendCooldownRef.current = setInterval(() => {
      setResendCooldown((value) => {
        if (value <= 1) {
          if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }, []);

  const applyResendRateLimit = useCallback(
    (payload: { error?: string; retryAfterSeconds?: number }) => {
      const waitSec =
        parseOtpRetrySeconds(payload.error, payload.retryAfterSeconds) ?? OTP_RESEND_COOLDOWN_SEC;
      startResendCooldown(waitSec);
      setError("");
      return true;
    },
    [startResendCooldown],
  );

  useEffect(() => {
    return () => {
      if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
    };
  }, []);

  const sendOtp = async (isResend = false) => {
    if (!canVerify || otpSendBusy || otpVerifyBusy) return;
    if (isResend && resendCooldown > 0) return;
    setOtpSendBusy(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/scholarship-test/portal/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otpPayload),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        maskedEmail?: string;
        email?: string;
        devOtp?: string;
        retryAfterSeconds?: number;
      };
      if (!res.ok || !json.ok) {
        if (res.status === 429 && applyResendRateLimit(json)) return;
        throw new Error(json.error || "Could not send verification code");
      }
      setOtpSent(true);
      setEmailHint(
        json.maskedEmail ||
          (normalizedEmail ? maskEmailForDisplay(normalizedEmail) : "your registered email"),
      );
      if (json.devOtp) setOtp(json.devOtp.slice(0, 6));
      startResendCooldown(OTP_RESEND_COOLDOWN_SEC);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send verification code");
    } finally {
      setOtpSendBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!canVerify || otpSendBusy || otpVerifyBusy || otp.length !== 6) return;
    setOtpVerifyBusy(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/scholarship-test/portal/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...otpPayload, otp }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Verification failed");
      const token = String(json.resultAccessToken ?? "").trim();
      const resolvedCst = normalizeCstInput(
        String(json.cstNumber ?? json.student?.cstNumber ?? normalizedCst),
      );
      if (!token) throw new Error("Server did not issue a result access token.");
      if (!resolvedCst) throw new Error("Could not resolve your CST number after verification.");
      storeResultAccessToken(resolvedCst, token);
      onVerified(token, resolvedCst);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setOtpVerifyBusy(false);
    }
  };

  return (
    <PageShell>
      {onBack ? (
        <button type="button" className="pr-back-btn" onClick={onBack}>
          <ChevronLeft size={18} />
          Back
        </button>
      ) : null}
      <CodeMastiBrandHeader
        title="Verify to view results"
        subtitle="Confirm your identity with a one-time code sent to the email on file."
      />
      <div className="pr-lookup-panel">
        <div className="pr-cst-form">
        {normalizedCst ? (
          <p className="pr-verify-identity">
            <span className="pr-verify-identity-label">CST ID</span>
            <span className="pr-verify-identity-value">{normalizedCst}</span>
          </p>
        ) : (
          <p className="pr-verify-identity">
            <span className="pr-verify-identity-label">Email on file</span>
            <span className="pr-verify-identity-value">
              {maskEmailForDisplay(normalizedEmail)}
            </span>
          </p>
        )}
        {!otpSent ? (
          <>
            {resendCooldown > 0 ? (
              <p className="pr-resend-cooldown" role="status" aria-live="polite">
                You can request a new code in <strong>{resendCooldown}s</strong>
              </p>
            ) : null}
            <button
              type="button"
              className="pr-cst-submit pr-cst-submit--block"
              onClick={() => void sendOtp()}
              disabled={otpSendBusy || otpVerifyBusy || !canVerify || resendCooldown > 0}
            >
              {otpSendBusy ? (
                <>
                  <LoadingSpinner size={18} variant="light" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail size={18} />
                  {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Send verification code"}
                </>
              )}
            </button>
          </>
        ) : (
          <div className="pr-verify-otp-block">
            <div className="pr-verify-sent" role="status">
              <Mail size={18} aria-hidden />
              <p>
                Code sent to <strong>{emailHint}</strong>. Valid for 10 minutes.
              </p>
            </div>
            <label className="pr-cst-label" htmlFor="result-otp">
              6-digit code
            </label>
            <div className="pr-cst-row pr-cst-row--otp">
              <div className="pr-cst-input-wrap">
                <input
                  id="result-otp"
                  className="pr-cst-input pr-cst-input--otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                />
              </div>
              <button
                type="button"
                className="pr-cst-submit pr-cst-submit--verify"
                onClick={() => void verifyOtp()}
                disabled={otpSendBusy || otpVerifyBusy || otp.length !== 6}
              >
                {otpVerifyBusy ? (
                  <>
                    <LoadingSpinner size={18} variant="light" />
                    Verifying…
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </div>
            <div className="pr-verify-resend-row">
              {resendCooldown > 0 ? (
                <p className="pr-resend-cooldown" role="status" aria-live="polite">
                  Resend available in <strong>{resendCooldown}s</strong>
                </p>
              ) : (
                <button
                  type="button"
                  className="pr-resend-btn"
                  onClick={() => void sendOtp(true)}
                  disabled={otpSendBusy || otpVerifyBusy}
                >
                  {otpSendBusy ? "Sending…" : "Resend code"}
                </button>
              )}
            </div>
          </div>
        )}
        {error ? <p className="pr-error-inline">{error}</p> : null}
        <p className="pr-cst-hint">
          Once verified, you can view all published attempts — your latest result first, then past
          results.
        </p>
        </div>
      </div>
    </PageShell>
  );
}

type ViewMode = "list" | "detail" | "error" | "verify";

function PublicResultView() {
  const { download: downloadPdf, pdfBusy, portal: pdfPortal } = usePublicResultPdfDownload();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const cstParam = (searchParams.get("cst") ?? searchParams.get("cstNumber") ?? "").trim();
  const emailParam = normalizeEmailInput(searchParams.get("email") ?? "");
  const resultIdParam = (searchParams.get("id") ?? searchParams.get("resultId") ?? "").trim();
  const accessTokenParam = (
    searchParams.get("accessToken") ??
    searchParams.get("access_token") ??
    ""
  ).trim();

  const [mode, setMode] = useState<ViewMode>("list");
  const [cstNumber, setCstNumber] = useState(normalizeCstInput(cstParam));
  const [accessToken, setAccessToken] = useState("");
  const [studentName, setStudentName] = useState("");
  const [results, setResults] = useState<PublicResultSummary[]>([]);
  const [detail, setDetail] = useState<PublicResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(normalizeCstInput(cstParam)));

  useEffect(() => {
    const normalized = normalizeCstInput(cstParam);
    if (!normalized) {
      setAccessToken("");
      return;
    }
    const token = accessTokenParam || readStoredResultAccessToken(normalized);
    setAccessToken(token);
    if (accessTokenParam) storeResultAccessToken(normalized, accessTokenParam);
  }, [cstParam, accessTokenParam]);

  const load = useCallback(
    async (cst: string, resultId: string, token: string) => {
      const normalized = normalizeCstInput(cst);
      if (!normalized) {
        setLoading(false);
        return;
      }

      if (!token) {
        setLoading(false);
        setMode("verify");
        return;
      }

      setLoading(true);
      setError(null);
      setCstNumber(normalized);

      try {
        const params = new URLSearchParams({
          cst: normalized,
          format: "json",
          redirect: "0",
          accessToken: token,
        });
        if (resultId) params.set("id", resultId);
        else params.set("list", "1");

        const res = await fetch(apiUrl(`/api/scholarship-test/public/result?${params}`), {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) {
          if (res.status === 401 && json.needsVerification) {
            setMode("verify");
            setError(null);
            return;
          }
          throw new Error(json.error || "Could not load results");
        }

        storeResultAccessToken(normalized, token);

        setStudentName(json.studentName ?? json.result?.studentName ?? "");

        if (json.mode === "detail" && json.result) {
          setDetail(json.result as PublicResultPayload);
          const siblings = (json.results as PublicResultSummary[] | undefined) ?? [];
          setResults(siblings);
          setMode("detail");
          return;
        }

        if (json.mode === "list" && Array.isArray(json.results)) {
          setResults(json.results as PublicResultSummary[]);
          setDetail(null);
          setMode("list");
          return;
        }

        throw new Error("Unexpected response from server");
      } catch (e) {
        setDetail(null);
        setResults([]);
        setError(e instanceof Error ? e.message : "Failed to load results");
        setMode("error");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(cstParam, resultIdParam, accessToken);
  }, [cstParam, resultIdParam, accessToken, load]);

  const resultUrl = useCallback(
    (params: { cst?: string; id?: string; list?: boolean }) => {
      const cst = normalizeCstInput(params.cst ?? cstNumber);
      const qs = new URLSearchParams({ cst });
      if (params.id) qs.set("id", params.id);
      if (params.list) qs.set("list", "1");
      if (accessToken) qs.set("accessToken", accessToken);
      return `/?${qs.toString()}`;
    },
    [accessToken, cstNumber],
  );

  const goToDetail = (resultId: string) => {
    router.push(resultUrl({ id: resultId }));
  };

  const fetchResultPayload = useCallback(
    async (cst: string, resultId: string, token: string) => {
      const params = new URLSearchParams({
        cst: normalizeCstInput(cst),
        id: resultId,
        format: "json",
        redirect: "0",
        accessToken: token,
      });
      const res = await fetch(apiUrl(`/api/scholarship-test/public/result?${params}`), {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.result) {
        throw new Error(json.error || "Could not load result for download");
      }
      return json.result as PublicResultPayload;
    },
    [],
  );

  const handleVerified = useCallback(
    (token: string, resolvedCst: string) => {
      const cst = normalizeCstInput(resolvedCst);
      storeResultAccessToken(cst, token);
      setAccessToken(token);
      setCstNumber(cst);
      setMode("list");
      setError(null);
      setLoading(true);
      router.replace(
        `/?cst=${encodeURIComponent(cst)}&accessToken=${encodeURIComponent(token)}&list=1`,
      );
    },
    [router],
  );

  const handleDownloadAttempt = useCallback(
    async (summary: PublicResultSummary) => {
      if (pdfBusy || downloadingId) return;
      setDownloadingId(summary.resultId);
      try {
        const payload = await fetchResultPayload(cstNumber, summary.resultId, accessToken);
        await downloadPdf(payload);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not download PDF");
      } finally {
        setDownloadingId(null);
      }
    },
    [cstNumber, accessToken, downloadPdf, downloadingId, fetchResultPayload, pdfBusy],
  );

  const handleDownloadDetail = useCallback(() => {
    if (detail) void downloadPdf(detail);
  }, [detail, downloadPdf]);

  if (!normalizeCstInput(cstParam)) {
    if (isValidEmail(emailParam)) {
      return (
        <ResultVerificationGate
          email={emailParam}
          onVerified={handleVerified}
          onBack={() => router.push("/")}
        />
      );
    }

    return (
      <ResultLookupPage
        onCstSubmit={(cst) => {
          router.push(`/?cst=${encodeURIComponent(cst)}`);
        }}
        onEmailVerified={(cst, token) => {
          handleVerified(token, cst);
        }}
      />
    );
  }

  if (mode === "verify") {
    const cst = normalizeCstInput(cstParam);
    if (cst) {
      return <ResultVerificationGate cstNumber={cst} onVerified={handleVerified} />;
    }
  }

  if (loading) {
    return (
      <ResultLoadingSkeleton variant={resultIdParam ? "detail" : "list"} />
    );
  }

  if (error || mode === "error") {
    const isNoResults =
      error?.toLowerCase().includes("no test results") ||
      error?.toLowerCase().includes("not found");
    return (
      <PageShell>
        <CodeMastiBrandHeader
          title={isNoResults ? "No published results yet" : "Could not load results"}
        />
        <div className="pr-error-card">
          <p>
            {isNoResults
              ? "There are no published results for this account right now. Results are released from the admin panel after review — please check back later or contact support if you believe this is an error."
              : error}
          </p>
          <a
            className="pr-cst-submit pr-cst-submit--block pr-cst-submit--link"
            href="/"
          >
            Try again
          </a>
        </div>
      </PageShell>
    );
  }

  if (mode === "detail" && detail) {
    return (
      <>
        {pdfPortal}
        <ResultDetailView
          data={detail}
          showBack={results.length > 1}
          onBack={() => {
            router.push(resultUrl({ list: true }));
          }}
          onDownload={handleDownloadDetail}
          downloadBusy={pdfBusy}
        />
      </>
    );
  }

  if (mode === "list" && results.length > 0) {
    return (
      <>
        {pdfPortal}
        <ResultListView
          cstNumber={cstNumber}
          studentName={studentName}
          results={results}
          onSelect={goToDetail}
          onDownloadAttempt={handleDownloadAttempt}
          downloadingId={downloadingId}
        />
      </>
    );
  }

  return pdfPortal;
}

export default function PublicResultClient() {
  return (
    <main className="pr-page">
      <Suspense fallback={<ResultLoadingSkeleton variant="list" />}>
        <PublicResultView />
      </Suspense>
    </main>
  );
}
