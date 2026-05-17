import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  ClipboardList,
  Target,
  ChevronDown,
  BookOpen,
  AlignLeft,
} from "lucide-react";
import api from "../../../api/axios";

// ── Styles ────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-blue-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100 flex items-center gap-2";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation: string;
}

interface DirectItem {
  type: "direct";
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation: string;
}

interface PassageItem {
  type: "passage";
  passageText: string;
  questions: SubQuestion[];
}

type QuestionItem = DirectItem | PassageItem;

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultDirect = (): DirectItem => ({
  type: "direct",
  questionText: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  marks: 1,
  explanation: "",
});

const defaultSubQuestion = (): SubQuestion => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  marks: 1,
  explanation: "",
});

const defaultPassage = (): PassageItem => ({
  type: "passage",
  passageText: "",
  questions: [defaultSubQuestion()],
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const computeTotal = (items: QuestionItem[]) =>
  items.reduce((sum, item) => {
    if (item.type === "passage")
      return sum + item.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
    return sum + (Number(item.marks) || 0);
  }, 0);

const countAllQuestions = (items: QuestionItem[]) =>
  items.reduce((sum, item) => {
    if (item.type === "passage") return sum + item.questions.length;
    return sum + 1;
  }, 0);

// ── Sub-question Form ─────────────────────────────────────────────────────────

interface SubQuestionFormProps {
  sq: SubQuestion;
  sqIdx: number;
  itemIdx: number;
  isLast: boolean;
  onUpdate: (updates: Partial<SubQuestion>) => void;
  onUpdateOption: (optIdx: number, val: string) => void;
  onRemove: () => void;
  subCount: number;
}

const SubQuestionForm: React.FC<SubQuestionFormProps> = ({
  sq,
  sqIdx,
  onUpdate,
  onUpdateOption,
  onRemove,
  subCount,
}) => (
  <div className="border border-amber-100 rounded-xl overflow-hidden bg-white mt-3">
    {/* Sub-question header */}
    <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border-b border-amber-100">
      <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
        Sub-question {sqIdx + 1}
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={subCount === 1}
        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
        title="Remove sub-question"
      >
        <Trash2 size={13} />
      </button>
    </div>

    <div className="p-3 space-y-3">
      {/* Question text */}
      <div>
        <label className={labelClass}>Question Text *</label>
        <textarea
          value={sq.questionText}
          onChange={(e) => onUpdate({ questionText: e.target.value })}
          rows={2}
          placeholder="Enter sub-question text..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Options */}
      <div>
        <label className={labelClass}>Answer Options — select correct one</label>
        <div className="space-y-1.5">
          {sq.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input
                type="radio"
                name={`sub-correct-${sqIdx}`}
                checked={sq.correctOptionIndex === oi}
                onChange={() => onUpdate({ correctOptionIndex: oi })}
                className="w-3.5 h-3.5 text-amber-500 cursor-pointer flex-shrink-0"
              />
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors ${
                  sq.correctOptionIndex === oi
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {String.fromCharCode(65 + oi)}
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => onUpdateOption(oi, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Marks + explanation */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Marks</label>
          <input
            type="number"
            value={sq.marks}
            onChange={(e) =>
              onUpdate({ marks: Math.max(0.5, Number(e.target.value) || 1) })
            }
            min="0.5"
            step="0.5"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Explanation (optional)</label>
          <input
            type="text"
            value={sq.explanation}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            placeholder="Brief explanation..."
            className={inputClass}
          />
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const QuestionPaperFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  // Paper info
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("60");
  const [passingMarks, setPassingMarks] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [instructions, setInstructions] = useState("");

  // Question items (direct or passage)
  const [items, setItems] = useState<QuestionItem[]>([defaultDirect()]);

  const totalMarks = computeTotal(items);
  const questionCount = countAllQuestions(items);

  // ── Fetch existing paper for edit ──────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setFetchLoading(true);
      try {
        const res: any = await api.get(`/question-papers/${id}`);
        const p = res.data || res;
        setTitle(p.title || "");
        setSubject(p.subject || "");
        setDuration(String(p.duration || 60));
        setPassingMarks(String(p.passingMarks || ""));
        setDifficulty(p.difficulty || "Medium");
        setInstructions(p.instructions || "");

        if (p.questions?.length) {
          setItems(
            p.questions.map((q: any): QuestionItem => {
              if (q.type === "passage") {
                return {
                  type: "passage",
                  passageText: q.passageText || "",
                  questions: (q.questions || []).map((sq: any): SubQuestion => ({
                    questionText: sq.questionText || "",
                    options: sq.options?.length >= 2 ? sq.options : ["", "", "", ""],
                    correctOptionIndex: sq.correctOptionIndex ?? 0,
                    marks: sq.marks ?? 1,
                    explanation: sq.explanation || "",
                  })),
                };
              }
              return {
                type: "direct",
                questionText: q.questionText || "",
                options: q.options?.length >= 2 ? q.options : ["", "", "", ""],
                correctOptionIndex: q.correctOptionIndex ?? 0,
                marks: q.marks ?? 1,
                explanation: q.explanation || "",
              };
            })
          );
        } else {
          setItems([defaultDirect()]);
        }
      } catch {
        toast.error("Failed to load question paper.");
        navigate(-1);
      } finally {
        setFetchLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Item-level helpers ─────────────────────────────────────────────────────

  const removeItem = (idx: number) => {
    if (items.length === 1) {
      toast.warn("At least one question item is required.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveItem = (idx: number, dir: "up" | "down") => {
    setItems((prev) => {
      const next = [...prev];
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  // ── Direct question helpers ────────────────────────────────────────────────

  const updateDirect = (idx: number, updates: Partial<DirectItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates } as DirectItem;
      return next;
    });
  };

  const updateDirectOption = (itemIdx: number, optIdx: number, val: string) => {
    setItems((prev) => {
      const next = [...prev];
      const item = next[itemIdx] as DirectItem;
      const opts = [...item.options];
      opts[optIdx] = val;
      next[itemIdx] = { ...item, options: opts };
      return next;
    });
  };

  // ── Passage helpers ────────────────────────────────────────────────────────

  const updatePassage = (idx: number, updates: Partial<PassageItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates } as PassageItem;
      return next;
    });
  };

  const updateSubQuestion = (
    itemIdx: number,
    subIdx: number,
    updates: Partial<SubQuestion>
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = next[itemIdx] as PassageItem;
      const subs = [...item.questions];
      subs[subIdx] = { ...subs[subIdx], ...updates };
      next[itemIdx] = { ...item, questions: subs };
      return next;
    });
  };

  const updateSubQuestionOption = (
    itemIdx: number,
    subIdx: number,
    optIdx: number,
    val: string
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = next[itemIdx] as PassageItem;
      const subs = [...item.questions];
      const opts = [...subs[subIdx].options];
      opts[optIdx] = val;
      subs[subIdx] = { ...subs[subIdx], options: opts };
      next[itemIdx] = { ...item, questions: subs };
      return next;
    });
  };

  const addSubQuestion = (itemIdx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = next[itemIdx] as PassageItem;
      next[itemIdx] = {
        ...item,
        questions: [...item.questions, defaultSubQuestion()],
      };
      return next;
    });
  };

  const removeSubQuestion = (itemIdx: number, subIdx: number) => {
    setItems((prev) => {
      const item = prev[itemIdx] as PassageItem;
      if (item.questions.length === 1) {
        toast.warn("Passage must have at least one sub-question.");
        return prev;
      }
      const next = [...prev];
      next[itemIdx] = {
        ...item,
        questions: item.questions.filter((_, i) => i !== subIdx),
      };
      return next;
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (!title.trim()) { toast.error("Title is required."); return false; }
    if (!subject.trim()) { toast.error("Subject is required."); return false; }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === "direct") {
        if (!item.questionText.trim()) {
          toast.error(`Question ${i + 1}: Question text is required.`);
          return false;
        }
        if (item.options.filter((o) => o.trim()).length < 2) {
          toast.error(`Question ${i + 1}: At least 2 options are required.`);
          return false;
        }
      } else {
        if (!item.passageText.trim()) {
          toast.error(`Passage ${i + 1}: Passage text is required.`);
          return false;
        }
        for (let j = 0; j < item.questions.length; j++) {
          const sq = item.questions[j];
          if (!sq.questionText.trim()) {
            toast.error(`Passage ${i + 1}, Sub-question ${j + 1}: Question text is required.`);
            return false;
          }
          if (sq.options.filter((o) => o.trim()).length < 2) {
            toast.error(`Passage ${i + 1}, Sub-question ${j + 1}: At least 2 options are required.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        duration: Number(duration),
        totalMarks,
        passingMarks: passingMarks
          ? Number(passingMarks)
          : Math.floor(totalMarks * 0.4),
        difficulty,
        instructions: instructions.trim() || null,
        questions: items,
      };

      if (isEdit) {
        await api.put(`/question-papers/${id}`, payload);
        toast.success("Question paper updated!");
      } else {
        await api.post("/question-papers", payload);
        toast.success("Question paper created!");
      }

      navigate(-1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save question paper.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <ClipboardList size={15} />
              </span>
              {isEdit ? "Edit Question Paper" : "New Question Paper"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isEdit
                ? "Update paper details and questions"
                : "Create a paper with direct MCQs and/or passage-based questions"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-70"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? "Update Paper" : "Save Paper"}
        </button>
      </div>

      {/* ── Section 1 — Paper Information ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          <ClipboardList size={15} />
          Paper Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. NDT Level II — Ultrasonic Testing Theory"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Subject *</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="e.g. Ultrasonic Testing"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Difficulty</label>
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")
                }
                className={`${inputClass} appearance-none cursor-pointer pr-8`}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Duration (minutes) *</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              min="1"
              placeholder="60"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Passing Marks</label>
            <input
              type="number"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              min="0"
              placeholder={`Auto: ${Math.floor(totalMarks * 0.4)}`}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Instructions (optional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Instructions visible to students during the exam..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
          <Target size={15} className="text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-700">
            <strong>Total Marks: {totalMarks}</strong> — automatically
            calculated from question marks
          </span>
        </div>
      </div>

      {/* ── Section 2 — Questions ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className={`${sectionTitleClass} mb-0 pb-0 border-0`}>
            <ClipboardList size={15} />
            Questions
            <span className="ml-1 text-xs font-normal text-gray-400 normal-case tracking-normal">
              ({questionCount})
            </span>
          </h2>
        </div>

        {/* ── Question Items ── */}
        <div className="space-y-5">
          {items.map((item, idx) => {
            const isPassage = item.type === "passage";

            return (
              <div
                key={idx}
                className={`border rounded-xl overflow-hidden ${
                  isPassage
                    ? "border-amber-200"
                    : "border-gray-200"
                }`}
              >
                {/* Item header bar */}
                <div
                  className={`flex items-center justify-between px-4 py-2.5 border-b ${
                    isPassage
                      ? "bg-amber-50 border-amber-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center ${
                        isPassage ? "bg-amber-500" : "bg-blue-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${
                        isPassage ? "text-amber-700" : "text-gray-500"
                      }`}
                    >
                      {isPassage ? (
                        <>
                          <BookOpen size={13} /> Passage Section
                        </>
                      ) : (
                        <>
                          <AlignLeft size={13} /> Direct MCQ
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-colors text-xs font-bold"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, "down")}
                      disabled={idx === items.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-colors text-xs font-bold"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* ── Direct MCQ body ── */}
                {!isPassage && (
                  <div className="p-4 space-y-4 bg-white">
                    <div>
                      <label className={labelClass}>Question Text *</label>
                      <textarea
                        value={(item as DirectItem).questionText}
                        onChange={(e) =>
                          updateDirect(idx, { questionText: e.target.value })
                        }
                        rows={2}
                        placeholder="Enter the question here..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Answer Options — select the correct one
                      </label>
                      <div className="space-y-2">
                        {(item as DirectItem).options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name={`direct-correct-${idx}`}
                              checked={(item as DirectItem).correctOptionIndex === oi}
                              onChange={() =>
                                updateDirect(idx, { correctOptionIndex: oi })
                              }
                              className="w-4 h-4 text-blue-600 cursor-pointer flex-shrink-0"
                            />
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors ${
                                (item as DirectItem).correctOptionIndex === oi
                                  ? "bg-emerald-500 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                updateDirectOption(idx, oi, e.target.value)
                              }
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Click the radio button next to the correct answer.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Marks per Question</label>
                        <input
                          type="number"
                          value={(item as DirectItem).marks}
                          onChange={(e) =>
                            updateDirect(idx, {
                              marks: Math.max(0.5, Number(e.target.value) || 1),
                            })
                          }
                          min="0.5"
                          step="0.5"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Explanation (optional)</label>
                        <input
                          type="text"
                          value={(item as DirectItem).explanation}
                          onChange={(e) =>
                            updateDirect(idx, { explanation: e.target.value })
                          }
                          placeholder="Brief explanation for correct answer..."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Passage body ── */}
                {isPassage && (
                  <div className="p-4 bg-white space-y-3">
                    {/* Passage text */}
                    <div>
                      <label className={`${labelClass} text-amber-700`}>
                        Passage Text *
                      </label>
                      <textarea
                        value={(item as PassageItem).passageText}
                        onChange={(e) =>
                          updatePassage(idx, { passageText: e.target.value })
                        }
                        rows={5}
                        placeholder="Enter the reading passage here. Students will read this passage and answer the sub-questions below..."
                        className={`${inputClass} resize-none border-amber-200 focus:ring-amber-400`}
                      />
                    </div>

                    {/* Sub-questions */}
                    <div>
                      <label className={`${labelClass} text-amber-700`}>
                        Questions based on this passage
                      </label>
                      {(item as PassageItem).questions.map((sq, sqIdx) => (
                        <SubQuestionForm
                          key={sqIdx}
                          sq={sq}
                          sqIdx={sqIdx}
                          itemIdx={idx}
                          isLast={sqIdx === (item as PassageItem).questions.length - 1}
                          subCount={(item as PassageItem).questions.length}
                          onUpdate={(updates) =>
                            updateSubQuestion(idx, sqIdx, updates)
                          }
                          onUpdateOption={(optIdx, val) =>
                            updateSubQuestionOption(idx, sqIdx, optIdx, val)
                          }
                          onRemove={() => removeSubQuestion(idx, sqIdx)}
                        />
                      ))}

                      <button
                        type="button"
                        onClick={() => addSubQuestion(idx)}
                        className="mt-3 w-full py-2 border-2 border-dashed border-amber-200 text-amber-500 hover:text-amber-600 hover:border-amber-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus size={13} /> Add Sub-question
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Add buttons ── */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, defaultDirect()])}
            className="py-3 border-2 border-dashed border-blue-200 text-blue-500 hover:text-blue-600 hover:border-blue-300 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={15} />
            <AlignLeft size={14} />
            Add Direct MCQ
          </button>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, defaultPassage()])}
            className="py-3 border-2 border-dashed border-amber-200 text-amber-500 hover:text-amber-600 hover:border-amber-300 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={15} />
            <BookOpen size={14} />
            Add Passage Section
          </button>
        </div>
      </div>

      {/* ── Sticky Footer ── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-lg mt-2">
        <p className="text-sm text-gray-500">
          <strong className="text-gray-800">{questionCount}</strong>{" "}
          {questionCount === 1 ? "question" : "questions"} ·{" "}
          <strong className="text-gray-800">{totalMarks}</strong> total marks
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {isEdit ? "Update Paper" : "Save Paper"}
          </button>
        </div>
      </div>
    </form>
  );
};
