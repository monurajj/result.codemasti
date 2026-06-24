import type { CSSProperties, RefObject } from "react";
import type { PublicResultPayload } from "@/lib/types";

const CODEMASTI_SITE_URL = "https://codemasti.com";
const CODEMASTI_SUPPORT_EMAIL = "support@codemati.com";
const CODEMASTI_SUPPORT_PHONE = "+91 75410 62514";
const CODEMASTI_TAGLINE = "Think. Solve. Create.";

const brand = {
  orange: "#ff6b00",
  orangeSoft: "#fff7ed",
  orangeBorder: "rgba(255, 107, 0, 0.35)",
  brown: "#4a2311",
  brownDeep: "#2d160a",
  text: "#334155",
  textMuted: "#64748b",
  border: "#e2e8f0",
  cream: "#fffdf9",
  correct: "#0f766e",
  wrong: "#b91c1c",
  bonus: "#b45309",
};

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

function optionLabel(opt: string | { text?: string; imageUrl: string }) {
  if (typeof opt === "string") return opt;
  return opt.text?.trim() || (opt.imageUrl ? "(image option)" : "");
}

function scoreEncouragement(percentage: number) {
  if (percentage >= 75) {
    return "Outstanding effort — keep building on this momentum as you explore AI and technology with CodeMasti.";
  }
  if (percentage >= 50) {
    return "Solid progress — consistent practice in coding and problem-solving will take you even further.";
  }
  if (percentage >= 25) {
    return "Every step counts. With guided learning at CodeMasti, you can strengthen your foundation and grow with confidence.";
  }
  return "Every expert was once a beginner. Stay curious, keep practising, and let CodeMasti help you build real skills for the future.";
}

const sheetStyle: CSSProperties = {
  width: 794,
  padding: "28px 32px 32px",
  background: "#ffffff",
  color: brand.brownDeep,
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

type Props = {
  data: PublicResultPayload;
  innerRef: RefObject<HTMLDivElement | null>;
};

export function PublicResultPdfSheet({ data, innerRef }: Props) {
  const correctCount = data.answers.filter((a) => a.isCorrect).length;
  const pct =
    data.totalMarks > 0
      ? (data.marksObtained / data.totalMarks) * 100
      : data.percentage;
  const pctLabel = pct.toFixed(2);
  const generatedAt = formatWhen(new Date().toISOString());
  const firstName = data.studentName.trim().split(/\s+/)[0] || data.studentName;

  return (
    <div
      aria-hidden
      style={{ position: "absolute", left: -10000, top: 0, ...sheetStyle }}
      ref={innerRef}
    >
      {/* —— Header —— */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          paddingBottom: 16,
          borderBottom: `2px solid ${brand.orange}`,
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <img
            src="/text-logo.png"
            alt="CodeMasti"
            crossOrigin="anonymous"
            style={{
              display: "block",
              width: 200,
              maxWidth: "100%",
              height: "auto",
              marginBottom: 8,
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: brand.orange,
            }}
          >
            Scholarship test · Result report
          </div>
          <div style={{ fontSize: 11, color: brand.textMuted, marginTop: 4 }}>{CODEMASTI_TAGLINE}</div>
        </div>
        <div
          style={{
            flexShrink: 0,
            textAlign: "right",
            fontSize: 11,
            color: brand.textMuted,
            lineHeight: 1.55,
          }}
        >
          <div style={{ fontWeight: 700, color: brand.brown }}>Generated</div>
          <div>{generatedAt} IST</div>
        </div>
      </header>

      {/* —— Result summary —— */}
      <section
        style={{
          marginTop: 18,
          padding: "16px 18px",
          borderRadius: 12,
          background: brand.cream,
          border: `1px solid ${brand.border}`,
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: brand.brown, marginBottom: 10 }}>
          {data.testName}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "10px 20px",
            fontSize: 12,
            color: brand.text,
          }}
        >
          <div>
            <span style={{ color: brand.textMuted }}>Student</span>
            <br />
            <strong>{data.studentName}</strong>
          </div>
          <div>
            <span style={{ color: brand.textMuted }}>CST number</span>
            <br />
            <strong>{data.cstNumber}</strong>
          </div>
          <div>
            <span style={{ color: brand.textMuted }}>Score</span>
            <br />
            <strong>
              {data.marksObtained} / {data.totalMarks} ({pctLabel}%)
            </strong>
          </div>
          <div>
            <span style={{ color: brand.textMuted }}>Correct answers</span>
            <br />
            <strong>
              {correctCount} / {data.totalQuestions}
            </strong>
          </div>
          {data.percentile !== null ? (
            <div>
              <span style={{ color: brand.textMuted }}>Percentile</span>
              <br />
              <strong>{data.percentile.toFixed(2)}%</strong>
            </div>
          ) : null}
          <div>
            <span style={{ color: brand.textMuted }}>Finished</span>
            <br />
            <strong>{formatWhen(data.finishedAt)}</strong>
          </div>
          {typeof data.sessionDurationSeconds === "number" && data.sessionDurationSeconds > 0 ? (
            <div>
              <span style={{ color: brand.textMuted }}>Duration</span>
              <br />
              <strong>
                {Math.floor(data.sessionDurationSeconds / 60)}m {data.sessionDurationSeconds % 60}s
              </strong>
            </div>
          ) : null}
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: brand.textMuted }}>Started</span>
            <br />
            <strong>{formatWhen(data.startedAt)}</strong>
          </div>
        </div>
      </section>

      {/* —— Answer breakdown —— */}
      <section style={{ marginTop: 22 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: brand.textMuted,
            marginBottom: 12,
          }}
        >
          Answer breakdown
        </div>

        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {data.answers.map((row) => {
            const q = data.questions[row.index];
            if (!q) return null;
            const maxMarks = row.maxMarks ?? q.marks ?? 1;
            const earned = row.marksEarned ?? (row.isCorrect ? maxMarks : 0);
            const outcome = row.outcome ?? (row.isCorrect ? "correct" : "wrong");
            const statusLabel =
              outcome === "bonus" ? "Bonus" : outcome === "correct" ? "Correct" : "Wrong";
            const statusColor =
              outcome === "bonus" ? brand.bonus : outcome === "correct" ? brand.correct : brand.wrong;

            return (
              <li
                key={row.index}
                style={{
                  marginBottom: 16,
                  paddingBottom: 14,
                  borderBottom: `1px solid ${brand.border}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 750, marginBottom: 6 }}>
                    Q{row.index + 1}. {q.questionText}{" "}
                    <span style={{ fontWeight: 600, color: brand.textMuted }}>
                      ({earned}/{maxMarks} marks)
                    </span>
                    {row.isBonusQuestion || q.isBonus ? (
                      <span style={{ marginLeft: 6, fontSize: 11, color: brand.bonus }}>[Bonus]</span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: statusColor,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusLabel}
                  </div>
                </div>

                {q.questionImageUrl ? (
                  <img
                    src={q.questionImageUrl}
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      width: 360,
                      maxWidth: "100%",
                      height: "auto",
                      border: `1px solid ${brand.border}`,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  />
                ) : null}

                {q.questionType === "multiple_choice" || q.questionType === "image_choice" ? (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    {q.options.map((opt, oidx) => {
                      const isSelected =
                        typeof row.selected === "number" && row.selected === oidx;
                      const isCorr = typeof row.correct === "number" && row.correct === oidx;
                      const text = optionLabel(opt);
                      const imageUrl = typeof opt === "string" ? "" : opt.imageUrl;
                      return (
                        <li key={oidx} style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + oidx)}.</span>{" "}
                          <span style={{ fontWeight: isSelected ? 800 : 500 }}>{text}</span>
                          {isSelected ? (
                            <span style={{ marginLeft: 6, fontWeight: 800, color: "#1d4ed8" }}>
                              Selected
                            </span>
                          ) : null}
                          {isCorr ? (
                            <span style={{ marginLeft: 6, fontWeight: 800, color: brand.correct }}>
                              Correct
                            </span>
                          ) : null}
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt=""
                              crossOrigin="anonymous"
                              style={{
                                display: "block",
                                width: 220,
                                maxWidth: "100%",
                                marginTop: 6,
                                border: `1px solid ${brand.border}`,
                                borderRadius: 8,
                              }}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ fontSize: 12, color: brand.text }}>
                    <div>
                      Your answer: <strong>{row.selectedLabel}</strong>
                    </div>
                    <div>
                      Correct answer: <strong>{row.correctLabel}</strong>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 11, color: brand.textMuted, marginTop: 6 }}>
                  You: {row.selectedLabel} · Correct: {row.correctLabel}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* —— Motivation (closing message) —— */}
      <section
        style={{
          marginTop: 24,
          padding: "16px 18px",
          borderRadius: 12,
          background: brand.orangeSoft,
          border: `1px solid ${brand.orangeBorder}`,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: brand.brown, marginBottom: 8 }}>
          Your journey in AI &amp; tech starts here
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 12, lineHeight: 1.65, color: brand.text }}>
          Dear <strong>{firstName}</strong> &amp; Parent/Guardian,
        </p>
        <p style={{ margin: "0 0 8px", fontSize: 12, lineHeight: 1.65, color: brand.text }}>
          We are living in a fast-moving AI era — where technology, creativity, and problem-solving
          open doors to the careers of tomorrow. This scholarship result is a snapshot of where you
          are today; what matters most is how you keep learning from here.
        </p>
        <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.65, color: brand.text }}>
          At CodeMasti, we help students <strong>{CODEMASTI_TAGLINE}</strong> — with hands-on
          programmes in coding, artificial intelligence, robotics, and emerging tech so they can lead,
          not just follow, the future.
        </p>
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            lineHeight: 1.6,
            color: brand.brown,
            fontWeight: 600,
          }}
        >
          {scoreEncouragement(pct)}
        </p>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "#ffffff",
            border: `1px solid ${brand.orangeBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: brand.orange,
              marginBottom: 8,
            }}
          >
            Build your future with CodeMasti
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 11.5,
              lineHeight: 1.6,
              color: brand.text,
            }}
          >
            <li style={{ marginBottom: 4 }}>
              Explore structured learning paths designed for young innovators at{" "}
              <strong>codemasti.com</strong>.
            </li>
            <li style={{ marginBottom: 4 }}>
              Practice consistently — small steps in coding and AI compound into real-world skills.
            </li>
            <li>
              Stay curious: the students who shape tomorrow are learning hands-on technology today.
            </li>
          </ul>
        </div>

        <p
          style={{
            margin: "12px 0 0",
            fontSize: 12,
            fontWeight: 700,
            color: brand.brown,
          }}
        >
          Thank you for being part of the CodeMasti family.
        </p>
      </section>

      {/* —— Footer —— */}
      <footer
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: `2px solid ${brand.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <div>
            <img
              src="/text-logo.png"
              alt="CodeMasti"
              crossOrigin="anonymous"
              style={{ display: "block", width: 140, height: "auto", marginBottom: 6 }}
            />
            <div style={{ fontSize: 12, fontWeight: 800, color: brand.orange }}>
              {CODEMASTI_TAGLINE}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, lineHeight: 1.6, color: brand.text }}>
            <div style={{ fontWeight: 700, color: brand.brown }}>Need help?</div>
            <div>
              <strong>{CODEMASTI_SUPPORT_EMAIL}</strong>
            </div>
            <div>{CODEMASTI_SUPPORT_PHONE}</div>
            <div>
              <strong>{CODEMASTI_SITE_URL.replace(/^https?:\/\//, "")}</strong>
            </div>
          </div>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 10,
            lineHeight: 1.55,
            color: brand.textMuted,
            textAlign: "center",
          }}
        >
          This document was auto-generated for <strong>{data.studentName}</strong> (CST{" "}
          {data.cstNumber}). For questions about results, scholarships, or admissions, contact{" "}
          {CODEMASTI_SUPPORT_EMAIL}. © {new Date().getFullYear()} CodeMasti. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
