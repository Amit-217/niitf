import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  CalendarClock,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  ChevronDown,
  BarChart3,
  Clock,
  Users,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  XCircle,
  Send,
  Eye,
} from "lucide-react";
import api from "../../../api/axios";
import { Pagination } from "../../../components/Pagination";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QP {
  _id: string;
  paperId: string;
  title: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  difficulty: string;
}

interface BatchRef {
  _id: string;
  batchId: string;
  batchName: string;
  status: string;
}

interface AssignedTest {
  _id: string;
  assignId: string;
  questionPaper: QP;
  batch: BatchRef;
  scheduledAt: string;
  duration?: number;
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  isResultReleased: boolean;
  ndtMethod?: string;
  ndtLevel?: string;
  ndtTechnique?: string;
  limitations?: string;
  signatoryName1?: string;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  Ongoing: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-rose-100 text-rose-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getEffectiveStatus = (test: AssignedTest): AssignedTest["status"] => {
  if (test.status === "Cancelled") return "Cancelled";
  const now = Date.now();
  const start = new Date(test.scheduledAt).getTime();
  const durationMs =
    (test.duration || test.questionPaper?.duration || 60) * 60 * 1000;
  if (now < start) return "Upcoming";
  if (now < start + durationMs) return "Ongoing";
  return "Completed";
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── Assign / Edit Modal ───────────────────────────────────────────────────────

interface ModalProps {
  editTarget: AssignedTest | null;
  onClose: () => void;
  onSaved: () => void;
}

const AssignModal: React.FC<ModalProps> = ({
  editTarget,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(editTarget);

  const [questionPapers, setQuestionPapers] = useState<QP[]>([]);
  const [batches, setBatches] = useState<BatchRef[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedPaper, setSelectedPaper] = useState(
    editTarget?.questionPaper?._id || "",
  );
  const [selectedBatch, setSelectedBatch] = useState(
    editTarget?.batch?._id || "",
  );
  const [scheduledAt, setScheduledAt] = useState(
    editTarget?.scheduledAt ? toDatetimeLocal(editTarget.scheduledAt) : "",
  );
  const [duration, setDuration] = useState(
    String(editTarget?.duration || editTarget?.questionPaper?.duration || ""),
  );
  const [status, setStatus] = useState<AssignedTest["status"]>(
    editTarget?.status || "Upcoming",
  );
  const [ndtMethod, setNdtMethod] = useState(editTarget?.ndtMethod || "");
  const [ndtLevel, setNdtLevel] = useState(editTarget?.ndtLevel || "Level II");
  const [ndtTechnique, setNdtTechnique] = useState(
    editTarget?.ndtTechnique || "",
  );
  const [limitations, setLimitations] = useState(editTarget?.limitations || "");
  const [signatoryName1, setSignatoryName1] = useState(
    editTarget?.signatoryName1 || "",
  );
  const [saving, setSaving] = useState(false);

  // Auto-fill duration when paper is selected
  const handlePaperChange = (paperId: string) => {
    setSelectedPaper(paperId);
    const paper = questionPapers.find((p) => p._id === paperId);
    if (paper && !isEdit) setDuration(String(paper.duration));
  };

  // Load papers and batches
  useEffect(() => {
    const load = async () => {
      setLoadingOptions(true);
      try {
        const [papersRes, batchesRes]: any[] = await Promise.all([
          api.get("/question-papers?limit=200&status=Active"),
          api.get("/batches?limit=200"),
        ]);
        setQuestionPapers(papersRes?.data || []);
        setBatches(batchesRes?.data || []);
      } catch {
        toast.error("Failed to load options.");
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper) {
      toast.error("Please select a question paper.");
      return;
    }
    if (!selectedBatch) {
      toast.error("Please select a batch.");
      return;
    }
    if (!scheduledAt) {
      toast.error("Please set a scheduled date and time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        questionPaper: selectedPaper,
        batch: selectedBatch,
        scheduledAt: new Date(scheduledAt).toISOString(),
        duration: duration ? Number(duration) : undefined,
        status,
        ndtMethod: ndtMethod || undefined,
        ndtLevel: ndtLevel || undefined,
        ndtTechnique: ndtTechnique || undefined,
        limitations: limitations || undefined,
        signatoryName1: signatoryName1 || undefined,
      };

      if (isEdit) {
        await api.put(`/assigned-tests/${editTarget!._id}`, payload);
        toast.success("Test assignment updated!");
      } else {
        await api.post("/assigned-tests", payload);
        toast.success("Test assigned successfully!");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const selectCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 bg-white transition-colors";
  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <CalendarClock size={14} />
            </span>
            {isEdit ? "Edit Assignment" : "Assign Test to Batch"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {loadingOptions ? (
            <div className="py-16 flex justify-center">
              <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* ── Test Info ── */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Test Info
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Question Paper */}
                  <div className="col-span-2">
                    <label className={labelCls}>Question Paper *</label>
                    <div className="relative">
                      <select
                        value={selectedPaper}
                        onChange={(e) => handlePaperChange(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">-- Select Question Paper --</option>
                        {questionPapers.map((p) => (
                          <option key={p._id} value={p._id}>
                            [{p.paperId}] {p.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    {selectedPaper &&
                      (() => {
                        const p = questionPapers.find(
                          (x) => x._id === selectedPaper,
                        );
                        return p ? (
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${DIFFICULTY_STYLES[p.difficulty] || "bg-gray-100 text-gray-600"}`}
                            >
                              {p.difficulty}
                            </span>
                            <span>
                              {p.totalMarks} marks · {p.duration} min
                            </span>
                          </div>
                        ) : null;
                      })()}
                  </div>

                  {/* Batch */}
                  <div className="col-span-2">
                    <label className={labelCls}>Batch *</label>
                    <div className="relative">
                      <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">-- Select Batch --</option>
                        {batches.map((b) => (
                          <option key={b._id} value={b._id}>
                            [{b.batchId}] {b.batchName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Scheduled Date & Time */}
                  <div>
                    <label className={labelCls}>Scheduled Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className={labelCls}>Duration (minutes)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="1"
                      placeholder="Auto from paper"
                      className={inputCls}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as AssignedTest["status"])
                        }
                        className={selectCls}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Certificate Details ── */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-4">
                  Certificate Details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* NDT Method */}
                  <div>
                    <label className={labelCls}>NDT Method</label>
                    <input
                      type="text"
                      value={ndtMethod}
                      onChange={(e) => setNdtMethod(e.target.value)}
                      placeholder="e.g. Magnetic Particle Testing"
                      className={inputCls}
                    />
                  </div>

                  {/* NDT Level */}
                  <div>
                    <label className={labelCls}>NDT Level</label>
                    <div className="relative">
                      <select
                        value={ndtLevel}
                        onChange={(e) => setNdtLevel(e.target.value)}
                        className={selectCls}
                      >
                        <option value="Level I">Level I</option>
                        <option value="Level II">Level II</option>
                        <option value="Level III">Level III</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* NDT Technique */}
                  <div>
                    <label className={labelCls}>NDT Technique</label>
                    <input
                      type="text"
                      value={ndtTechnique}
                      onChange={(e) => setNdtTechnique(e.target.value)}
                      placeholder="e.g. Wet / Dry"
                      className={inputCls}
                    />
                  </div>

                  {/* Limitations */}
                  <div>
                    <label className={labelCls}>Limitations (if any)</label>
                    <input
                      type="text"
                      value={limitations}
                      onChange={(e) => setLimitations(e.target.value)}
                      placeholder="e.g. Ferromagnetic only"
                      className={inputCls}
                    />
                  </div>

                  {/* Signatory Name 1 */}
                  <div className="col-span-2">
                    <label className={labelCls}>
                      Certifying Authority Name
                      <span className="ml-1.5 text-gray-400 font-normal normal-case">
                        (appears on certificate above "Designated Level III")
                      </span>
                    </label>
                    <input
                      type="text"
                      value={signatoryName1}
                      onChange={(e) => setSignatoryName1(e.target.value)}
                      placeholder="e.g. Mr. B. R. Lohar"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-70 flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CalendarClock size={15} />
                  )}
                  {isEdit ? "Update" : "Assign Test"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


// ── View Results Modal ────────────────────────────────────────────────────────

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

interface ResultsModalProps {
  test: AssignedTest;
  onClose: () => void;
}

const ViewResultsModal: React.FC<ResultsModalProps> = ({ test, onClose }) => {
  const effectiveDuration = test.duration || test.questionPaper?.duration;
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/assigned-tests/${test._id}/results`)
      .then((res: any) => {
        setSubmissions(res.submissions || []);
        setSummary(res.summary || null);
      })
      .catch(() => toast.error("Failed to load results."))
      .finally(() => setLoading(false));
  }, [test._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Test Results</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {test.questionPaper?.title} · {test.batch?.batchName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Test info bar */}
        <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          {[
            { label: "Scheduled", value: formatDateTime(test.scheduledAt) },
            { label: "Duration", value: `${effectiveDuration ?? "—"} min` },
            {
              label: "Total Marks",
              value: test.questionPaper?.totalMarks ?? "—",
            },
            {
              label: "Pass Marks",
              value: test.questionPaper?.passingMarks ?? "—",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center py-3 px-2 border-r border-gray-100 last:border-r-0"
            >
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                {s.label}
              </p>
              <p className="text-xs font-black text-gray-800 mt-0.5 leading-tight">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Summary cards */}
              {summary && (
                <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-100">
                  {[
                    {
                      label: "Appeared",
                      value: summary.appeared,
                      icon: Users,
                      color: "text-blue-600 bg-blue-50",
                    },
                    {
                      label: "Passed",
                      value: summary.passed,
                      icon: CheckCircle2,
                      color: "text-emerald-600 bg-emerald-50",
                    },
                    {
                      label: "Failed",
                      value: summary.failed,
                      icon: XCircle,
                      color: "text-red-500 bg-red-50",
                    },
                    {
                      label: "Avg Score",
                      value: `${summary.avgScore}%`,
                      icon: TrendingUp,
                      color: "text-indigo-600 bg-indigo-50",
                    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div
                      key={label}
                      className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
                      >
                        <Icon size={15} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                          {label}
                        </p>
                        <p className="text-base font-bold text-gray-900 leading-tight">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results table */}
              {submissions.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 size={22} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">
                    No submissions yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Students haven't started this test.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        %
                      </th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Certificate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissions.map((s, i) => (
                      <tr
                        key={s._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-gray-400 font-medium">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">
                            {s.student?.fullName || "—"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {s.student?.studentId} · {s.student?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800">
                          {s.status === "InProgress"
                            ? "—"
                            : `${s.score}/${s.totalMarks}`}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800">
                          {s.status === "InProgress" ? "—" : `${s.percentage}%`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.status === "InProgress" ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : s.isPassed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                              <XCircle size={10} /> Fail
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${
                              s.status === "Submitted"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : s.status === "TimedOut"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}
                          >
                            {s.status === "TimedOut" ? "Timed Out" : s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {s.submittedAt ? formatDateTime(s.submittedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.isPassed && s.status !== "InProgress" ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/assign-tests/${test._id}/certificate/${s._id}`
                                )
                              }
                              title="View Certificate"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            >
                              <Eye size={12} /> View
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const AssignTestPage: React.FC = () => {
  const [tests, setTests] = useState<AssignedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AssignedTest | null>(null);
  const [viewResults, setViewResults] = useState<AssignedTest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignedTest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<AssignedTest | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [tick, setTick] = useState(0);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (statusFilter !== "All") params.set("status", statusFilter);

      const res: any = await api.get(`/assigned-tests?${params.toString()}`);
      setTests(res?.data || []);
      setPagination(res?.pagination || null);
    } catch {
      toast.error("Failed to load assigned tests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchTests(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [page, limit, search, statusFilter]);

  // Re-render every 60s so time-based statuses stay current
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const openAssign = () => {
    setEditTarget(null);
    setShowModal(true);
  };

  const openEdit = (test: AssignedTest) => {
    setEditTarget(test);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/assigned-tests/${deleteTarget._id}`);
      toast.success("Assignment deleted.");
      setDeleteTarget(null);
      fetchTests();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const closeRelease = () => {
    setReleaseTarget(null);
  };

  const handleRelease = async () => {
    if (!releaseTarget) return;
    setReleasing(true);
    try {
      const res: any = await api.post(
        `/assigned-tests/${releaseTarget._id}/release-result`,
      );
      toast.success(
        `Results released! Emails sent to ${res?.emailsSent ?? 0} student(s).`,
      );
      closeRelease();
      fetchTests();
    } catch (err: any) {
      toast.error(err?.message || "Failed to release results.");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <CalendarClock size={18} />
            </span>
            Assign Tests
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign question papers to batches and schedule test dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTests}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openAssign}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
          >
            <Plus size={16} /> Assign Test
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by paper title, batch or assign ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none appearance-none bg-white"
        >
          <option value="All">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Question Paper
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Scheduled At
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody key={tick} className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    <Loader2
                      size={28}
                      className="animate-spin text-blue-500 inline"
                    />
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                      <CalendarClock size={24} className="text-blue-400" />
                    </div>
                    <p className="text-gray-600 font-semibold text-sm">
                      No assigned tests found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click "Assign Test" to schedule a test for a batch
                    </p>
                    <button
                      onClick={openAssign}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={13} /> Assign Test
                    </button>
                  </td>
                </tr>
              ) : (
                tests.map((test, idx) => {
                  const effectiveDuration =
                    test.duration || test.questionPaper?.duration;
                  const effectiveStatus = getEffectiveStatus(test);
                  return (
                    <tr
                      key={test._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* # */}
                      <td className="px-4 py-3 text-gray-400 text-xs font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* Question Paper */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ClipboardList
                              size={13}
                              className="text-indigo-500"
                            />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
                              {test.questionPaper?.title || "—"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {test.questionPaper?.paperId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                            <Users size={11} className="text-teal-500" />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                              {test.batch?.batchName || "—"}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {test.batch?.batchId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Scheduled At */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Clock
                            size={13}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span className="font-medium">
                            {formatDateTime(test.scheduledAt)}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {effectiveDuration ? `${effectiveDuration} min` : "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            STATUS_STYLES[effectiveStatus] ||
                            "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {effectiveStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <button
                            onClick={() => setViewResults(test)}
                            title="View Results"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <BarChart3 size={13} />
                            Results
                          </button>
                          {effectiveStatus === "Completed" &&
                            (test.isResultReleased ? (
                              <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <CheckCircle2 size={12} />
                                Released
                              </span>
                            ) : (
                              <button
                                onClick={() => setReleaseTarget(test)}
                                title="Release Result"
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                              >
                                <Send size={12} />
                                Release
                              </button>
                            ))}
                          <button
                            onClick={() => openEdit(test)}
                            title="Edit"
                            className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(test)}
                            title="Delete"
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* ── Assign / Edit Modal ── */}
      {showModal && (
        <AssignModal
          editTarget={editTarget}
          onClose={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          onSaved={fetchTests}
        />
      )}

      {/* ── View Results Modal ── */}
      {viewResults && (
        <ViewResultsModal
          test={viewResults}
          onClose={() => setViewResults(null)}
        />
      )}

      {/* ── Release Result Modal ── */}
      {releaseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center animate-in zoom-in-95 fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Send size={22} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Release Results?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{releaseTarget.questionPaper?.title}</strong>
            </p>
            <p className="text-sm text-gray-400 mb-2">
              Batch: <strong>{releaseTarget.batch?.batchName}</strong>
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6 text-left">
              This will send result emails with certificates to all passed
              students. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeRelease}
                className="flex-1 py-2.5 border rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRelease}
                disabled={releasing}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
              >
                {releasing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Release & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center animate-in zoom-in-95 fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Remove Assignment?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{deleteTarget.questionPaper?.title}</strong>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Assigned to <strong>{deleteTarget.batch?.batchName}</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
