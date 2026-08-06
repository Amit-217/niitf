import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  BarChart2,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Loader2,
  ClipboardList,
  Eye,
  Clock,
  RefreshCw,
  Send,
} from "lucide-react";
import { getTestResultsForAdmin } from "../../../api/assignedTestApi";
import api from "../../../api/axios";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Submission {
  _id: string;
  submissionId: string;
  student: { _id: string; studentId: string; fullName: string; email: string };
  status: "InProgress" | "Submitted" | "TimedOut";
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  startedAt: string;
}

interface ResultsSummary {
  appeared: number;
  passed: number;
  failed: number;
  avgScore: number;
}

interface TestInfo {
  _id: string;
  assignId: string;
  questionPaper: {
    _id: string;
    paperId: string;
    title: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    difficulty: string;
  };
  batch: { _id: string; batchId: string; batchName: string };
  scheduledAt: string;
  duration?: number;
  isResultReleased?: boolean;
}

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

const STATUS_STYLES: Record<string, string> = {
  Submitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  TimedOut: "bg-amber-50 text-amber-700 border-amber-200",
  InProgress: "bg-blue-50 text-blue-700 border-blue-200",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export const ResultDetailPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResultReleased, setIsResultReleased] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const fetchResults = () => {
    if (!testId) return;
    setLoading(true);
    (getTestResultsForAdmin(testId) as any)
      .then((res: any) => {
        setTestInfo(res.test || null);
        setIsResultReleased(res.test?.isResultReleased || false);
        setSubmissions(res.submissions || []);
        setSummary(res.summary || null);
      })
      .catch(() => toast.error("Failed to load results."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, [testId]);

  const handleReleaseResults = async () => {
    if (!testInfo || isResultReleased || releasing) return;

    // Check if effective status is completed
    const now = Date.now();
    const start = new Date(testInfo.scheduledAt).getTime();
    const durationMs = (testInfo.duration || testInfo.questionPaper?.duration || 60) * 60 * 1000;
    const isCompleted = now >= start + durationMs;

    if (!isCompleted) {
      toast.error("Cannot release results. The test is not completed yet.");
      return;
    }

    const ok = window.confirm(
      "Release results now? This will send result emails with certificates to passed students."
    );
    if (!ok) return;

    setReleasing(true);
    try {
      const res: any = await api.post(
        `/assigned-tests/${testInfo._id}/release-result`
      );
      setIsResultReleased(true);
      toast.success(
        `Results released! Emails sent to ${res?.emailsSent ?? 0} student(s).`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to release results.");
    } finally {
      setReleasing(false);
    }
  };

  const effectiveDuration = testInfo?.duration || testInfo?.questionPaper?.duration;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/results")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Results
        </button>
        <button
          onClick={fetchResults}
          className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={30} className="animate-spin text-indigo-500" />
        </div>
      ) : !testInfo ? (
        <div className="text-center py-20 text-gray-500 text-sm">Test not found.</div>
      ) : (
        <>
          {/* Test info header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                  <BarChart2 size={18} />
                </span>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">
                    {testInfo.questionPaper?.title}
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {testInfo.questionPaper?.paperId} · Batch:{" "}
                    {testInfo.batch?.batchName} ({testInfo.batch?.batchId})
                  </p>
                </div>
              </div>

              {/* Release results actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {isResultReleased ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
                    <CheckCircle2 size={13} />
                    Results Released
                  </span>
                ) : (
                  <button
                    onClick={handleReleaseResults}
                    disabled={releasing}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                  >
                    {releasing ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    {releasing ? "Releasing..." : "Release Results"}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 bg-gray-50">
              {[
                { label: "Scheduled", value: formatDateTime(testInfo.scheduledAt) },
                { label: "Duration", value: `${effectiveDuration ?? "—"} min` },
                { label: "Total Marks", value: testInfo.questionPaper?.totalMarks ?? "—" },
                { label: "Pass Marks", value: testInfo.questionPaper?.passingMarks ?? "—" },
              ].map((s) => (
                <div key={s.label} className="text-center py-3 px-2 border-r border-gray-100 last:border-r-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
                  <p className="text-xs font-black text-gray-800 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Appeared", value: summary.appeared, icon: Users, color: "text-blue-600 bg-blue-50" },
                { label: "Passed", value: summary.passed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                { label: "Failed", value: summary.failed, icon: XCircle, color: "text-red-500 bg-red-50" },
                { label: "Avg Score", value: `${summary.avgScore}%`, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Students</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">
                {submissions.length} student{submissions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <ClipboardList size={22} className="text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-600">No submissions yet</p>
                <p className="text-xs text-gray-400 mt-1">Students haven't started this test.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted At</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissions.map((sub, idx) => (
                      <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs font-medium">{idx + 1}</td>

                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-indigo-600">
                                {sub.student?.fullName?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm leading-tight">
                                {sub.student?.fullName || "Unknown"}
                              </p>
                              <p className="text-[10px] text-gray-400">{sub.student?.studentId}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[sub.status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                            {sub.status === "InProgress" && <Clock size={10} />}
                            {sub.status}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3 text-center">
                          {sub.status === "InProgress" ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-800">
                              {sub.score}/{sub.totalMarks}
                            </span>
                          )}
                        </td>

                        {/* Percentage */}
                        <td className="px-4 py-3 text-center">
                          {sub.status === "InProgress" ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-700">
                              {sub.percentage}%
                            </span>
                          )}
                        </td>

                        {/* Result badge */}
                        <td className="px-4 py-3 text-center">
                          {sub.status === "InProgress" ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${sub.isPassed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                              {sub.isPassed ? "PASS" : "FAIL"}
                            </span>
                          )}
                        </td>

                        {/* Submitted At */}
                        <td className="px-4 py-3 text-center">
                          {sub.submittedAt ? (
                            <span className="text-xs text-gray-500">{formatDateTime(sub.submittedAt)}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/results/${testId}/${sub._id}`)}
                              disabled={sub.status === "InProgress"}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title={sub.status === "InProgress" ? "Student hasn't submitted yet" : "View question paper with answers"}
                            >
                              <Eye size={12} />
                              View Paper
                            </button>

{sub.status !== 'InProgress' && (
                               <>
                                 {sub.isPassed && (
                                   <button
                                     onClick={() => navigate(`/admin/assign-tests/${testId}/certificate/${sub._id}`)}
                                     title="View & Download Certificate"
                                     className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                                   >
                                     <Eye size={12} /> Certificate
                                   </button>
                                 )}
                                 {!sub.isPassed && (
                                   <button
                                     onClick={() => navigate(`/admin/assign-tests/${testId}/attendance-certificate/${sub._id}`)}
                                     title="View & Download Attendance Certificate"
                                     className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                                   >
                                     <Eye size={12} /> Attendance Certificate
                                   </button>
                                 )}
                               </>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
