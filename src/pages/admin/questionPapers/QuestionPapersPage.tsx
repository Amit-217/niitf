import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  MoreVertical,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  BookOpen,
  PencilLine,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../../api/axios";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SubQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation?: string;
}

interface DirectQuestion {
  type: "direct";
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation?: string;
}

interface PassageQuestion {
  type: "passage";
  passageText: string;
  questions: SubQuestion[];
}

interface SubjectiveQuestion {
  type: "subjective";
  questionText: string;
  correctAnswer: string;
  marks: number;
  explanation?: string;
}

type QuestionItem = DirectQuestion | PassageQuestion | SubjectiveQuestion;

interface QuestionPaper {
  _id: string;
  paperId: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  difficulty: "Easy" | "Medium" | "Hard";
  instructions?: string;
  questions: QuestionItem[];
  isActive: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard: "bg-rose-100 text-rose-700 border-rose-200",
};

const DIFFICULTY_GRADIENTS: Record<string, string> = {
  Easy: "from-emerald-400 to-teal-500",
  Medium: "from-amber-400 to-orange-500",
  Hard: "from-rose-500 to-red-600",
};

// ── View Paper Modal ───────────────────────────────────────────────────────────

interface ViewModalProps {
  paper: QuestionPaper;
  onClose: () => void;
}

const ViewPaperModal: React.FC<ViewModalProps> = ({ paper, onClose }) => {
  const gradient =
    DIFFICULTY_GRADIENTS[paper.difficulty] || "from-blue-400 to-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 fade-in duration-200 max-h-[90vh]">
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${gradient} px-6 py-5 rounded-t-2xl flex items-start justify-between flex-shrink-0`}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {paper.title}
            </h2>
            <p className="text-sm text-white/80 mt-0.5">{paper.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          {[
            {
              label: "Questions",
              value: (paper.questions || []).reduce(
                (sum, item) =>
                  item.type === "passage"
                    ? sum + item.questions.length
                    : sum + 1,
                0,
              ),
            },
            { label: "Total Marks", value: paper.totalMarks },
            { label: "Pass Marks", value: paper.passingMarks },
            { label: "Duration", value: `${paper.duration}m` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-3 px-2 border-r border-gray-100 last:border-r-0"
            >
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-lg font-black text-gray-800 mt-0.5">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {paper.instructions && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                Instructions
              </p>
              <p className="text-sm text-blue-800">{paper.instructions}</p>
            </div>
          )}

          {paper.questions?.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">
              No questions added yet.
            </div>
          )}

          {paper.questions?.map((item, qi) => {
            if (item.type === "passage") {
              return (
                <div
                  key={qi}
                  className="border border-amber-200 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Passage header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                      {qi + 1}
                    </span>
                    <BookOpen size={13} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                      Passage Section
                    </span>
                  </div>
                  {/* Passage text */}
                  <div className="px-4 py-3 bg-amber-50/40 border-b border-amber-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {item.passageText}
                    </p>
                  </div>
                  {/* Sub-questions */}
                  <div className="p-4 space-y-3 bg-white">
                    {item.questions.map((sq, sqIdx) => (
                      <div
                        key={sqIdx}
                        className="border border-amber-100 rounded-xl p-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center mt-0.5">
                            {sqIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 mb-2.5 leading-relaxed">
                              {sq.questionText}
                            </p>
                            <div className="space-y-1.5">
                              {sq.options.map((opt, oi) =>
                                opt ? (
                                  <div
                                    key={oi}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                                      oi === sq.correctOptionIndex
                                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                        : "bg-gray-50 border border-gray-100 text-gray-700"
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                        oi === sq.correctOptionIndex
                                          ? "bg-emerald-500 text-white"
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                    {oi === sq.correctOptionIndex && (
                                      <CheckCircle2
                                        size={13}
                                        className="text-emerald-600 flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                ) : null,
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              {sq.explanation && (
                                <p className="text-xs text-gray-400 italic flex-1">
                                  {sq.explanation}
                                </p>
                              )}
                              <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                {sq.marks} {sq.marks === 1 ? "mark" : "marks"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Subjective
            if (item.type === "subjective") {
              return (
                <div
                  key={qi}
                  className="border border-violet-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border-b border-violet-200">
                    <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                      {qi + 1}
                    </span>
                    <PencilLine size={13} className="text-violet-600" />
                    <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">
                      Subjective
                    </span>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-sm font-semibold text-gray-900 mb-3 leading-relaxed">
                      {item.questionText}
                    </p>
                    {/* Student answer placeholder */}
                    <div className="w-full border border-dashed border-violet-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-violet-50/40 mb-3">
                      Student types answer here…
                    </div>
                    {/* Correct answer */}
                    <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2
                        size={14}
                        className="text-emerald-600 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-0.5">
                          Correct Answer
                        </p>
                        <p className="text-sm text-emerald-800 font-medium">
                          {item.correctAnswer}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full flex-shrink-0">
                        {item.marks} {item.marks === 1 ? "mark" : "marks"}
                      </span>
                    </div>
                    {item.explanation && (
                      <p className="text-xs text-gray-400 italic mt-2">
                        {item.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // Direct MCQ
            return (
              <div
                key={qi}
                className="border border-gray-100 rounded-xl p-4 shadow-sm bg-white"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center mt-0.5">
                    {qi + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-3 leading-relaxed">
                      {item.questionText}
                    </p>
                    <div className="space-y-2">
                      {item.options.map((opt, oi) =>
                        opt ? (
                          <div
                            key={oi}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                              oi === item.correctOptionIndex
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                : "bg-gray-50 border border-gray-100 text-gray-700"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                oi === item.correctOptionIndex
                                  ? "bg-emerald-500 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {oi === item.correctOptionIndex && (
                              <CheckCircle2
                                size={14}
                                className="text-emerald-600 flex-shrink-0"
                              />
                            )}
                          </div>
                        ) : null,
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {item.explanation && (
                        <p className="text-xs text-gray-400 italic flex-1">
                          {item.explanation}
                        </p>
                      )}
                      <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">
                        {item.marks} {item.marks === 1 ? "mark" : "marks"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

// ── Question Paper Card ────────────────────────────────────────────────────────

interface CardProps {
  paper: QuestionPaper;
  onEdit: (p: QuestionPaper) => void;
  onDelete: (p: QuestionPaper) => void;
  onView: (p: QuestionPaper) => void;
  onToggleActive: (p: QuestionPaper) => void;
}

const QuestionPaperCard: React.FC<CardProps> = ({
  paper,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const gradient =
    DIFFICULTY_GRADIENTS[paper.difficulty] || "from-blue-400 to-indigo-500";
  const diffColor =
    DIFFICULTY_COLORS[paper.difficulty] ||
    "bg-gray-100 text-gray-500 border-gray-200";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        !paper.isActive ? "opacity-60" : ""
      }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0 text-white`}
            >
              <ClipboardList size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                {paper.title}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {paper.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      onView(paper);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye size={13} /> View Questions
                  </button>
                  <button
                    onClick={() => {
                      onEdit(paper);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Pencil size={13} /> Edit Paper
                  </button>
                  <button
                    onClick={() => {
                      onToggleActive(paper);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {paper.isActive ? (
                      <XCircle size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    {paper.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      onDelete(paper);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Difficulty badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-3 ${diffColor}`}
        >
          {paper.difficulty}
        </span>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium">Questions</p>
            <p className="text-base font-black text-gray-800">
              {(paper.questions || []).reduce(
                (sum, item) =>
                  item.type === "passage"
                    ? sum + item.questions.length
                    : sum + 1,
                0,
              )}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium">Total Marks</p>
            <p className="text-base font-black text-gray-800">
              {paper.totalMarks}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium">Duration</p>
            <p className="text-base font-black text-gray-800">
              {paper.duration}m
            </p>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-2 text-center">
          Pass: <strong className="text-gray-600">{paper.passingMarks}</strong>{" "}
          / {paper.totalMarks} marks
        </p>

        {/* View button */}
        <button
          onClick={() => onView(paper)}
          className={`w-full mt-3 py-2 text-xs font-bold rounded-xl transition-all bg-gradient-to-r ${gradient} text-white hover:opacity-90 flex items-center justify-center gap-1.5`}
        >
          <Eye size={13} /> View Questions
        </button>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

export const QuestionPapersPage: React.FC = () => {
  const navigate = useNavigate();

  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [viewPaper, setViewPaper] = useState<QuestionPaper | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionPaper | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (search) params.set("search", search);
      if (diffFilter !== "All") params.set("difficulty", diffFilter);
      if (statusFilter !== "All") params.set("status", statusFilter);

      const res: any = await api.get(`/question-papers?${params.toString()}`);
      setPapers(res.data || []);
      setPagination(res.pagination || null);
    } catch {
      toast.error("Failed to load question papers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchPapers(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [page, search, diffFilter, statusFilter]);

  const handleToggleActive = async (paper: QuestionPaper) => {
    try {
      await api.put(`/question-papers/${paper._id}`, {
        isActive: !paper.isActive,
      });
      toast.success(`Paper ${paper.isActive ? "deactivated" : "activated"}!`);
      fetchPapers();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/question-papers/${deleteTarget._id}`);
      toast.success("Question paper deleted.");
      setDeleteTarget(null);
      fetchPapers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  // Determine base path from current URL
  const basePath = window.location.pathname.startsWith("/employee")
    ? "/employee"
    : "/admin";

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <ClipboardList size={18} />
            </span>
            Question Papers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage examination question papers and MCQ sets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPapers}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate(`${basePath}/question-papers/new`)}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
          >
            <Plus size={16} /> New Paper
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
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
            placeholder="Search by title or subject..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <select
          value={diffFilter}
          onChange={(e) => {
            setDiffFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none appearance-none bg-white"
        >
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none appearance-none bg-white"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 inline" />
        </div>
      ) : papers.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-blue-400" />
          </div>
          <p className="text-gray-600 font-semibold">
            No question papers found
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first question paper to get started
          </p>
          <button
            onClick={() => navigate(`${basePath}/question-papers/new`)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Create Paper
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => (
            <QuestionPaperCard
              key={p._id}
              paper={p}
              onEdit={(paper) =>
                navigate(`${basePath}/question-papers/${paper._id}/edit`)
              }
              onDelete={setDeleteTarget}
              onView={setViewPaper}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-700">
            Page <strong>{page}</strong> of{" "}
            <strong>{pagination.totalPages}</strong>
            <span className="text-gray-400 ml-1">
              ({pagination.total} total)
            </span>
          </p>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewPaper && (
        <ViewPaperModal paper={viewPaper} onClose={() => setViewPaper(null)} />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center animate-in zoom-in-95 fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Question Paper?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <strong>"{deleteTarget.title}"</strong>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              All{" "}
              {(deleteTarget.questions || []).reduce(
                (sum, item) =>
                  item.type === "passage"
                    ? sum + item.questions.length
                    : sum + 1,
                0,
              )}{" "}
              questions will be permanently removed.
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
