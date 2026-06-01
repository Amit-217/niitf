import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { getSubmissionDetail } from "../../../api/assignedTestApi";
import { AnswerPayload } from "../../../api/studentTestApi";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Question {
  _id: string;
  type: "direct" | "passage" | "subjective";
  questionText?: string;
  options?: string[];
  correctOptionIndex?: number;
  marks?: number;
  passageText?: string;
  questions?: {
    _id: string;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    marks?: number;
  }[];
}

interface SubmissionDetail {
  student: { studentId: string; fullName: string; email: string };
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  status: "InProgress" | "Submitted" | "TimedOut";
  submittedAt: string;
  answers: AnswerPayload[];
  questionPaper: {
    _id: string;
    paperId: string;
    title: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    questions: Question[];
  };
}

type ReviewItem = {
  questionText: string;
  options?: string[];
  correctOptionIndex?: number;
  selectedOptionIndex?: number | null;
  textAnswer?: string | null;
  type: string;
  marks: number;
  isCorrect: boolean | null;
  passageLabel?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const buildReviewItems = (
  questions: Question[],
  answerMap: Record<string, AnswerPayload>
): ReviewItem[] => {
  const items: ReviewItem[] = [];
  questions.forEach((q) => {
    if (q.type === "direct") {
      const ans = answerMap[q._id];
      const correct =
        ans?.selectedOptionIndex != null &&
        ans.selectedOptionIndex === q.correctOptionIndex;
      items.push({
        questionText: q.questionText || "",
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        selectedOptionIndex: ans?.selectedOptionIndex ?? null,
        type: "direct",
        marks: q.marks || 1,
        isCorrect: ans?.selectedOptionIndex == null ? null : correct,
      });
    } else if (q.type === "passage") {
      (q.questions || []).forEach((sq) => {
        const ans = answerMap[sq._id];
        const correct =
          ans?.selectedOptionIndex != null &&
          ans.selectedOptionIndex === sq.correctOptionIndex;
        items.push({
          questionText: sq.questionText,
          options: sq.options,
          correctOptionIndex: sq.correctOptionIndex,
          selectedOptionIndex: ans?.selectedOptionIndex ?? null,
          type: "passage",
          marks: sq.marks || 1,
          isCorrect: ans?.selectedOptionIndex == null ? null : correct,
          passageLabel: q.passageText
            ? q.passageText.substring(0, 60) + (q.passageText.length > 60 ? "…" : "")
            : undefined,
        });
      });
    } else if (q.type === "subjective") {
      const ans = answerMap[q._id];
      items.push({
        questionText: q.questionText || "",
        textAnswer: ans?.textAnswer ?? null,
        type: "subjective",
        marks: q.marks || 0,
        isCorrect: null,
      });
    }
  });
  return items;
};

// ── Page ───────────────────────────────────────────────────────────────────────

export const SubmissionReviewPage: React.FC = () => {
  const { testId, submissionId } = useParams<{ testId: string; submissionId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId || !submissionId) return;
    setLoading(true);
    (getSubmissionDetail(testId, submissionId) as any)
      .then((res: any) => setDetail(res as SubmissionDetail))
      .catch(() => toast.error("Failed to load submission."))
      .finally(() => setLoading(false));
  }, [testId, submissionId]);

  const reviewItems = useMemo(() => {
    if (!detail?.questionPaper?.questions || !detail.answers) return [];
    const answerMap: Record<string, AnswerPayload> = {};
    detail.answers.forEach((a) => { answerMap[a.questionId] = a; });
    return buildReviewItems(detail.questionPaper.questions, answerMap);
  }, [detail]);

  const correctCount = reviewItems.filter((r) => r.isCorrect === true).length;
  const wrongCount = reviewItems.filter((r) => r.isCorrect === false).length;
  const skippedCount = reviewItems.filter((r) =>
    r.type === "subjective" ? !r.textAnswer : r.selectedOptionIndex == null
  ).length;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate(`/admin/results/${testId}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Student List
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={30} className="animate-spin text-indigo-500" />
        </div>
      ) : !detail ? (
        <div className="text-center py-20 text-gray-500 text-sm">Submission not found.</div>
      ) : detail.status === "InProgress" ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <Clock size={36} className="text-blue-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Test In Progress</p>
          <p className="text-xs text-gray-400 mt-1">
            {detail.student?.fullName} hasn't submitted the test yet.
          </p>
        </div>
      ) : (
        <>
          {/* Student result header */}
          <div className={`rounded-2xl p-5 text-white shadow-sm ${detail.isPassed ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-red-500 to-rose-600"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${detail.isPassed ? "bg-white/25" : "bg-white/25"}`}>
                    {detail.isPassed ? "PASS" : "FAIL"}
                  </span>
                  <span className="text-xs opacity-75">
                    {detail.status === "TimedOut" ? "Timed Out" : "Submitted"}
                    {detail.submittedAt && ` · ${formatDateTime(detail.submittedAt)}`}
                  </span>
                </div>
                <p className="text-xl font-bold">{detail.student?.fullName}</p>
                <p className="text-xs opacity-80 mt-0.5">
                  {detail.student?.studentId} · {detail.student?.email}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-black">
                  {detail.score}<span className="text-lg font-semibold opacity-75">/{detail.totalMarks}</span>
                </p>
                <p className="text-sm font-bold opacity-80">{detail.percentage}%</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20 text-xs opacity-75">
              {detail.questionPaper?.title} · {detail.questionPaper?.paperId}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <CheckCircle size={20} className="text-emerald-500 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-gray-900">{correctCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Correct</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <XCircle size={20} className="text-red-500 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-gray-900">{wrongCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Wrong</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <MinusCircle size={20} className="text-gray-400 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-gray-900">{skippedCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Skipped / Unanswered</p>
            </div>
          </div>

          {/* Answer review */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-sm">
                Answer Review · {reviewItems.length} question{reviewItems.length !== 1 ? "s" : ""}
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {reviewItems.map((item, i) => {
                const statusColor =
                  item.isCorrect === true
                    ? "border-l-emerald-400 bg-emerald-50/20"
                    : item.isCorrect === false
                    ? "border-l-red-400 bg-red-50/20"
                    : "border-l-gray-200";
                const statusLabel =
                  item.isCorrect === true ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle size={9} /> Correct
                    </span>
                  ) : item.isCorrect === false ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <XCircle size={9} /> Wrong
                    </span>
                  ) : item.type === "subjective" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                      Subjective
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                      <MinusCircle size={9} /> Skipped
                    </span>
                  );

                return (
                  <div key={i} className={`p-4 border-l-4 ${statusColor}`}>
                    {/* Question header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-gray-400 mt-0.5 min-w-[28px]">
                          Q{i + 1}
                        </span>
                        <p className="text-sm text-gray-800 font-medium leading-relaxed">
                          {item.questionText}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {statusLabel}
                        <span className="text-[10px] text-gray-400 font-medium">{item.marks} mark{item.marks !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Options */}
                    {item.type !== "subjective" && item.options && (
                      <div className="ml-7 space-y-1.5">
                        {item.options.map((opt, oi) => {
                          const isCorrect = oi === item.correctOptionIndex;
                          const isSelected = oi === item.selectedOptionIndex;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                                  : isSelected && !isCorrect
                                  ? "bg-red-50 border-red-200 text-red-800"
                                  : "border-transparent text-gray-600"
                              }`}
                            >
                              <span className="text-xs font-bold w-4 flex-shrink-0">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isCorrect && (
                                <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
                              )}
                              {isSelected && !isCorrect && (
                                <XCircle size={13} className="text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Subjective answer */}
                    {item.type === "subjective" && (
                      <div className="ml-7 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        {item.textAnswer ? (
                          <p><span className="font-semibold text-gray-700">Answer: </span>{item.textAnswer}</p>
                        ) : (
                          <p className="text-gray-400 italic">No answer provided</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
