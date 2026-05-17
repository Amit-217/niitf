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

interface Question {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation: string;
}

const defaultQuestion = (): Question => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  marks: 1,
  explanation: "",
});

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

  // Questions
  const [questions, setQuestions] = useState<Question[]>([defaultQuestion()]);

  // Auto-calculated total marks
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

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
        setQuestions(
          p.questions?.length
            ? p.questions.map((q: any) => ({
                questionText: q.questionText || "",
                options:
                  q.options?.length === 4
                    ? q.options
                    : ["", "", "", ""],
                correctOptionIndex: q.correctOptionIndex ?? 0,
                marks: q.marks ?? 1,
                explanation: q.explanation || "",
              }))
            : [defaultQuestion()]
        );
      } catch {
        toast.error("Failed to load question paper.");
        navigate(-1);
      } finally {
        setFetchLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Question helpers ───────────────────────────────────────────────────────
  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[oIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const addQuestion = () =>
    setQuestions((prev) => [...prev, defaultQuestion()]);

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.warn("At least one question is required.");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const updated = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return updated;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!subject.trim()) { toast.error("Subject is required."); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1}: Question text is required.`);
        return;
      }
      const filled = q.options.filter((o) => o.trim()).length;
      if (filled < 2) {
        toast.error(`Question ${i + 1}: At least 2 options are required.`);
        return;
      }
    }

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
        questions,
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
                : "Create a new examination paper with MCQ questions"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
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

        {/* Total marks badge */}
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
              ({questions.length})
            </span>
          </h2>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> Add Question
          </button>
        </div>

        <div className="space-y-5">
          {questions.map((q, qi) => (
            <div
              key={qi}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Question header bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                    {qi + 1}
                  </span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Question {qi + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveQuestion(qi, "up")}
                    disabled={qi === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-colors text-xs font-bold"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(qi, "down")}
                    disabled={qi === questions.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-colors text-xs font-bold"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                    title="Remove question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 bg-white">
                {/* Question text */}
                <div>
                  <label className={labelClass}>Question Text *</label>
                  <textarea
                    value={q.questionText}
                    onChange={(e) =>
                      updateQuestion(qi, "questionText", e.target.value)
                    }
                    rows={2}
                    placeholder="Enter the question here..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Options */}
                <div>
                  <label className={labelClass}>
                    Answer Options — select the correct one
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctOptionIndex === oi}
                          onChange={() =>
                            updateQuestion(qi, "correctOptionIndex", oi)
                          }
                          className="w-4 h-4 text-blue-600 cursor-pointer flex-shrink-0"
                        />
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors ${
                            q.correctOptionIndex === oi
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
                            updateOption(qi, oi, e.target.value)
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

                {/* Marks + explanation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Marks per Question</label>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) =>
                        updateQuestion(
                          qi,
                          "marks",
                          Math.max(0.5, Number(e.target.value) || 1)
                        )
                      }
                      min="0.5"
                      step="0.5"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Explanation (optional)
                    </label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) =>
                        updateQuestion(qi, "explanation", e.target.value)
                      }
                      placeholder="Brief explanation for correct answer..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dashed add button */}
        <button
          type="button"
          onClick={addQuestion}
          className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Another Question
        </button>
      </div>

      {/* ── Sticky Footer ── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-lg mt-2">
        <p className="text-sm text-gray-500">
          <strong className="text-gray-800">{questions.length}</strong>{" "}
          {questions.length === 1 ? "question" : "questions"} ·{" "}
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
