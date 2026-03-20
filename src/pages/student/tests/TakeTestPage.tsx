import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import api from "../../../api/axios";

interface Question {
  _id: string;
  type: "MCQ" | "PASSAGE";
  passageText?: string;
  questionText: string;
  options: string[];
  marks: number;
}

export const TakeTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const studentId = user?.id;
  const isStudent = user?.role === "STUDENT";

  const [testData, setTestData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startTest = useCallback(async () => {
    if (!studentId) {
      toast.error("Student session not found. Please login again.");
      navigate("/student/login");
      setIsLoading(false);
      return;
    }

    try {
      const res: any = await api.get(`/tests/${id}/start`, {
        params: { studentId },
      });
      setTestData(res.data.test);
      setQuestions(res.data.questions);
      setTimeLeft(res.data.test.durationMinutes * 60);
    } catch (err: any) {
      toast.error(err.message || "Failed to start test");
      navigate(isStudent ? "/student/exam" : "/employee/dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [id, isStudent, navigate, studentId]);

  useEffect(() => {
    startTest();
  }, [startTest]);

  useEffect(() => {
    if (questions.length > 0 && !visited[questions[currentIndex]._id]) {
      setVisited((prev) => ({ ...prev, [questions[currentIndex]._id]: true }));
    }
  }, [currentIndex, questions]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev! > 0 ? prev! - 1 : 0));
    }, 1000);
    if (timeLeft === 0) handleSubmit();
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (qId: string, optIdx: number) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleClearResponse = (qId: string) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[qId];
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || result) return;
    if (!window.confirm("Are you sure you want to submit the test?")) return;

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, opt]) => ({
        questionId: qId,
        selectedOption: opt,
      }));
      const res: any = await api.post(`/tests/${id}/submit`, {
        studentId,
        answers: formattedAnswers,
      });
      setResult(res.data);
      toast.success("Test submitted successfully!");
    } catch (err: any) {
      toast.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2
            className="animate-spin text-primary-600 mx-auto mb-4"
            size={40}
          />
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">
            Preparing your examination...
          </p>
        </div>
      </div>
    );

  if (result)
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
          <div
            className={`p-8 text-center ${result.result === "PASS" ? "bg-emerald-500" : "bg-red-500"} text-white`}
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {result.result === "PASS" ? (
                <CheckCircle2 size={40} />
              ) : (
                <AlertCircle size={40} />
              )}
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">
              Examination {result.result}
            </h2>
            <p className="opacity-80 font-semibold mt-1">{testData.testName}</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.score} / {result.totalMarks}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Accuracy
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(result.percentage)}%
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-500 px-2">
              <span>
                Correct:{" "}
                <span className="text-emerald-600">{result.correctCount}</span>
              </span>
              <span>
                Incorrect:{" "}
                <span className="text-red-600">{result.incorrectCount}</span>
              </span>
            </div>
            <button
              onClick={() =>
                navigate(isStudent ? "/student/exam" : "/employee/dashboard")
              }
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-100"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Timer */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight uppercase truncate max-w-[200px]">
              {testData.testName}
            </h1>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${timeLeft! < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-gray-50 border-gray-100 text-gray-700"}`}
        >
          <Clock size={18} />
          {formatTime(timeLeft!)}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Main Exam Area */}
        <main className="flex-1 flex flex-col gap-6">
          {currentQ.type === "PASSAGE" && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl shadow-sm">
              <h4 className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-3">
                Reading Passage
              </h4>
              <div className="text-sm text-amber-900 leading-relaxed font-medium whitespace-pre-wrap">
                {currentQ.passageText}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                {currentQ.questionText}
              </h2>
              <span className="shrink-0 bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg uppercase">
                {currentQ.marks} PTS
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(currentQ._id, idx)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all group flex items-center gap-4 ${answers[currentQ._id] === idx ? "bg-primary-50 border-primary-500 shadow-md ring-4 ring-primary-500/5" : "bg-white border-gray-100 hover:border-primary-200"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${answers[currentQ._id] === idx ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600"}`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span
                    className={`text-sm md:text-base font-bold ${answers[currentQ._id] === idx ? "text-primary-900" : "text-gray-600"}`}
                  >
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6">
              <div className="flex gap-2">
                <button
                  onClick={() => handleClearResponse(currentQ._id)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all uppercase"
                >
                  Clear
                </button>
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-primary-600 font-semibold text-xs uppercase disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={18} /> Previous
                </button>
              </div>

              <div className="hidden sm:flex gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "w-6 bg-primary-600" : answers[questions[i]._id] !== undefined ? "bg-emerald-400" : "bg-gray-200"}`}
                  />
                ))}
              </div>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}{" "}
                  Finish Test
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-100 transition-all"
                >
                  Next Question <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar Navigation (Desktop) */}
        <aside className="w-full lg:w-72 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Question Map
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q._id] !== undefined;
                const isVisited = visited[q._id];
                
                let btnClass = "bg-gray-50 border-transparent text-gray-400";
                if (isAnswered) btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-md";
                else if (isVisited) btnClass = "bg-red-500 border-red-500 text-white";

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 ${idx === currentIndex ? "border-primary-600 bg-primary-50 text-primary-700" : btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                <div className="w-3 h-3 rounded-md bg-emerald-500" /> Answered
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                <div className="w-3 h-3 rounded-md bg-red-500" /> Not Answered
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                <div className="w-3 h-3 rounded-md bg-gray-100" /> Unvisited
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
