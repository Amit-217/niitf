import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FileText,
  Plus,
  Eye,
  X,
  BookOpen,
  Clock,
  BarChart3,
  AlertCircle,
  Save,
  Loader2,
  ListChecks,
  Mail,
  Users,
} from "lucide-react";
import {
  getTests,
  createTest,
  addQuestion,
  getQuestions,
  sendExamInvites,
  Test,
  TestPayload,
  Question,
} from "../../../api/testApi";
import api from "../../../api/axios";

const MODE_COLORS: any = {
  Online: "bg-indigo-100 text-indigo-700",
  Offline: "bg-slate-100 text-slate-700",
};

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

const INITIAL_FORM = {
  testName: "",
  batchId: "",
  durationMinutes: 60,
  totalMarks: 100,
  passingMarks: 35,
  mode: "Online",
  testDate: "",
  startTimeStr: "",
  startAmPm: "AM",
  endTimeStr: "",
  endAmPm: "AM",
};

export const TestsPage = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [page] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [form, setForm] = useState<any>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [viewTest, setViewTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isQLoading, setIsQLoading] = useState(false);
  const [qForm, setQForm] = useState({
    type: "MCQ",
    passageText: "",
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    marks: 1,
  });
  const [addingQ, setAddingQ] = useState(false);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isAnalyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsTest, setAnalyticsTest] = useState<Test | null>(null);
  // Question Paper Review Modal
  const [isQuestionPaperOpen, setQuestionPaperOpen] = useState(false);
  const [questionPaperTest, setQuestionPaperTest] = useState<Test | null>(null);
  const [questionPaperQuestions, setQuestionPaperQuestions] = useState<
    Question[]
  >([]);
  const [isQPLoading, setQPLoading] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [isResultsOpen, setResultsOpen] = useState(false);
  const [resultsTest, setResultsTest] = useState<Test | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isResultsLoading, setResultsLoading] = useState(false);

  const handleSendInvites = async () => {
    if (!questionPaperTest) return;
    setIsSendingInvites(true);
    try {
      const res: any = await sendExamInvites(questionPaperTest._id);
      const d = res?.data?.data || res?.data || res;
      toast.success(`Invites sent to ${d.sent} student(s). Skipped: ${d.skipped} (no email).`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invites");
    } finally {
      setIsSendingInvites(false);
    }
  };

  // Handler to open question paper modal
  const openQuestionPaper = async (t: Test) => {
    setQuestionPaperTest(t);
    setQuestionPaperOpen(true);
    setQPLoading(true);
    try {
      const r: any = await getQuestions(t._id);
      if (Array.isArray(r)) setQuestionPaperQuestions(r);
      else if (r?.data && Array.isArray(r.data))
        setQuestionPaperQuestions(r.data);
      else if (r?.data?.data) setQuestionPaperQuestions(r.data.data);
      else setQuestionPaperQuestions([]);
    } catch {
      toast.error("Failed to load questions");
      setQuestionPaperQuestions([]);
    } finally {
      setQPLoading(false);
    }
  };

  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await getTests({ page });
      if (Array.isArray(res)) setTests(res);
      else if (res?.data?.tests) setTests(res.data.tests);
      else if (res?.data && Array.isArray(res.data)) setTests(res.data);
      else if (res?.tests) setTests(res.tests);
      else setTests([]);
    } catch {
      toast.error("Failed to load tests");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);
  useEffect(() => {
    if (isCreateOpen)
      api
        .get("/batches")
        .then((r: any) => setBatches(r?.data?.batches || r?.data || r || []))
        .catch(() => {});
  }, [isCreateOpen]);

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setCreateOpen(true);
  };

  const formatTime12h = (time: string): string => {
    if (!time) return time;
    let str = time.replace(/[^\d:]/g, "");
    if (!str.includes(":")) {
      const clean = str.replace(/\D/g, "");
      if (clean.length === 4) str = `${clean.slice(0, 2)}:${clean.slice(2)}`;
      else if (clean.length === 3) str = `0${clean.slice(0, 1)}:${clean.slice(1)}`;
    }
    return str;
  };

  const to24h = (timeStr: string, ampm: string): string => {
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return timeStr;
    if (ampm === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const validateTime12h = (timeStr: string): boolean => {
    const formatted = formatTime12h(timeStr);
    const [hStr] = formatted.split(":");
    const h = parseInt(hStr, 10);
    return !isNaN(h) && h >= 1 && h <= 12;
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };

      const sFormatted = formatTime12h(payload.startTimeStr);
      const eFormatted = formatTime12h(payload.endTimeStr);

      if (!validateTime12h(sFormatted)) {
        toast.error("Invalid Start Time. Hours must be 1–12.");
        setSubmitting(false);
        return;
      }
      if (!validateTime12h(eFormatted)) {
        toast.error("Invalid End Time. Hours must be 1–12.");
        setSubmitting(false);
        return;
      }

      const sTime = to24h(sFormatted, payload.startAmPm);
      const eTime = to24h(eFormatted, payload.endAmPm);

      payload.startTime = new Date(
        `${payload.testDate} ${sTime}`,
      ).toISOString();
      payload.endTime = new Date(`${payload.testDate} ${eTime}`).toISOString();
      delete payload.testDate;
      delete payload.startTimeStr;
      delete payload.startAmPm;
      delete payload.endTimeStr;
      delete payload.endAmPm;

      await createTest(payload);
      toast.success("Test created!");
      setForm(INITIAL_FORM);
      setCreateOpen(false);
      fetchTests();
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Failed to create test");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (t: Test) => {
    setViewTest(t);
    if (t.mode === "Online") {
      setIsQLoading(true);
      try {
        const r: any = await getQuestions(t._id);
        if (Array.isArray(r)) setQuestions(r);
        else if (r?.data && Array.isArray(r.data)) setQuestions(r.data);
        else if (r?.data?.data) setQuestions(r.data.data);
        else setQuestions([]);
      } catch {
        toast.error("Error");
      } finally {
        setIsQLoading(false);
      }
    }
  };

  const openResults = async (t: Test) => {
    setResultsTest(t);
    setResultsOpen(true);
    setResultsLoading(true);
    try {
      const res: any = await api.get(`/admin/tests/${t._id}/results`);
      const data = res?.data?.data || res?.data || res;
      setResults(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load results");
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const openAnalytics = async (t: Test) => {
    setAnalyticsTest(t);
    try {
      const res: any = await api.get(`/admin/tests/${t._id}/analytics`);
      setAnalytics(res.data);
      setAnalyticsOpen(true);
    } catch {
      toast.error("Error");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewTest) return;
    setAddingQ(true);
    try {
      const payload: any = { ...qForm };
      if (qForm.type === "MCQ") delete payload.passageText;
      await addQuestion(viewTest._id, payload);
      toast.success("Added!");
      const r: any = await getQuestions(viewTest._id);
      if (Array.isArray(r)) setQuestions(r);
      else if (r?.data && Array.isArray(r.data)) setQuestions(r.data);
      else if (r?.data?.data) setQuestions(r.data.data);
      else setQuestions([]);
      setQForm({
        ...qForm,
        passageText: "",
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
      });
    } catch {
      toast.error("Error");
    } finally {
      setAddingQ(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-primary-600" /> CBT Tests
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
        >
          <Plus size={17} /> New Test
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Test Name", "Test Code", "Batch", "Marks", "Mode", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              tests.map((t) => (
                <tr key={t._id}>
                  <td className="px-4 py-3 font-bold">{t.testName}</td>
                  <td className="px-4 py-3">
                    {t.testCode
                      ? <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs tracking-widest">{t.testCode}</span>
                      : <span className="text-gray-300 text-xs italic">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.batchId?.batchName}
                  </td>
                  <td className="px-4 py-3">
                    {t.passingMarks}/{t.totalMarks}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${MODE_COLORS[t.mode]}`}
                    >
                      {t.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {/* Add Question to Bank */}
                    <button
                      title="Add Question to Bank"
                      onClick={() => openView(t)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                    {/* View Question Paper */}
                    <button
                      title="View Question Paper"
                      onClick={() => openQuestionPaper(t)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    {/* View Student Results */}
                    <button
                      title="View Student Results"
                      onClick={() => openResults(t)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Users size={16} />
                    </button>
                    {/* View Analytics */}
                    <button
                      title="View Analytics"
                      onClick={() => openAnalytics(t)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <BarChart3 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Create New Test
                  </h2>
                  <p className="text-violet-200 text-sm mt-0.5">
                    Configure CBT or offline test details below.
                  </p>
                </div>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleCreateTest}
              className="p-0 flex flex-col max-h-[85vh]"
            >
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Section: Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      General Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>Test Name *</label>
                      <input
                        required
                        value={form.testName}
                        onChange={(e) =>
                          setForm({ ...form, testName: e.target.value })
                        }
                        placeholder="e.g. Mechanical Engineering Final"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Batch *</label>
                      <select
                        required
                        value={form.batchId}
                        onChange={(e) =>
                          setForm({ ...form, batchId: e.target.value })
                        }
                        className={inputClass}
                      >
                        <option value="">-- Select Target Batch --</option>
                        {batches.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.batchName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Logistics */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <Clock size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      Schedule & Duration
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>Examination Date *</label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          value={form.testDate}
                          onChange={(e) =>
                            setForm({ ...form, testDate: e.target.value })
                          }
                          className={`${inputClass} pl-10`}
                        />
                        <BookOpen
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                      </div>
                    </div>
                    <div className="relative group">
                      <label className={labelClass}>Start Time *</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            required
                            value={form.startTimeStr}
                            onBlur={(e) =>
                              setForm({
                                ...form,
                                startTimeStr: formatTime12h(e.target.value),
                              })
                            }
                            onChange={(e) =>
                              setForm({ ...form, startTimeStr: e.target.value })
                            }
                            className={`${inputClass} pl-10 border-blue-100 bg-blue-50/10 focus:bg-white`}
                            placeholder="09:30"
                            maxLength={5}
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xs">
                            GO
                          </div>
                        </div>
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold shrink-0">
                          {["AM", "PM"].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setForm({ ...form, startAmPm: v })}
                              className={`px-3 py-2 transition-colors ${form.startAmPm === v ? "bg-blue-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <label className={labelClass}>End Time *</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            required
                            value={form.endTimeStr}
                            onBlur={(e) =>
                              setForm({
                                ...form,
                                endTimeStr: formatTime12h(e.target.value),
                              })
                            }
                            onChange={(e) =>
                              setForm({ ...form, endTimeStr: e.target.value })
                            }
                            className={`${inputClass} pl-10 border-red-100 bg-red-50/10 focus:bg-white`}
                            placeholder="11:30"
                            maxLength={5}
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs">
                            END
                          </div>
                        </div>
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold shrink-0">
                          {["AM", "PM"].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setForm({ ...form, endAmPm: v })}
                              className={`px-3 py-2 transition-colors ${form.endAmPm === v ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-violet-600">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            Total Duration
                          </p>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              required
                              value={form.durationMinutes}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  durationMinutes: +e.target.value,
                                })
                              }
                              className="w-16 bg-transparent border-none p-0 focus:ring-0 text-lg font-black text-gray-900"
                            />
                            <span className="text-sm font-semibold text-gray-500">
                              minutes
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="h-full w-px bg-gray-100 mx-4" />
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          Grading Policy
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400">
                              Total
                            </span>
                            <input
                              type="number"
                              required
                              value={form.totalMarks}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  totalMarks: +e.target.value,
                                })
                              }
                              className="w-12 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-900"
                            />
                          </div>
                          <div className="text-gray-300">/</div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400">
                              Passing
                            </span>
                            <input
                              type="number"
                              required
                              value={form.passingMarks}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  passingMarks: +e.target.value,
                                })
                              }
                              className="w-12 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-violet-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    setForm(INITIAL_FORM);
                  }}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-70 group"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Save
                        size={18}
                        className="group-hover:scale-110 transition-transform"
                      />{" "}
                      Confirm & Create Test
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => {
              setAnalyticsOpen(false);
            }}
          />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Performance Analytics
                </h2>
                <p className="text-violet-200 text-sm mt-0.5">
                  Top missed questions for {analyticsTest?.testName}
                </p>
              </div>
              <button
                onClick={() => {
                  setAnalyticsOpen(false);
                  setAnalyticsTest(null);
                }}
                className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {analytics.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  <AlertCircle size={40} className="opacity-20" />
                  <p className="text-sm font-medium italic">
                    No performance data available yet.
                  </p>
                </div>
              ) : (
                analytics.map((item, idx) => (
                  <div
                    key={item.questionId}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex gap-2.5">
                        <span className="w-6 h-6 shrink-0 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-lg flex items-center justify-center">
                          Q{idx + 1}
                        </span>
                        <p className="text-sm font-bold text-gray-800 leading-tight">
                          {item.questionText}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase">
                          {Math.round(item.incorrectPercentage)}% Fail
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                        <span>Error Frequency</span>
                        <span>{item.incorrectCount} Students</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-red-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${item.incorrectPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewTest && !isAnalyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setViewTest(null)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {viewTest.testName}
                </h2>
                <p className="text-violet-200 text-sm mt-0.5">
                  {viewTest.mode} Examination Card
                </p>
              </div>
              <button
                onClick={() => setViewTest(null)}
                className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
              {viewTest.mode === "Online" ? (
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Question List */}
                  <div className="lg:col-span-12 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Question Bank ({questions.length})
                      </h3>
                      <div className="h-px flex-1 bg-gray-100 mx-4" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {isQLoading ? (
                        <div className="col-span-2 py-10 text-center text-gray-400 italic">
                          Scanning database...
                        </div>
                      ) : questions.length === 0 ? (
                        <div className="col-span-2 py-10 text-center text-gray-400 italic">
                          No questions added yet.
                        </div>
                      ) : (
                        questions.map((q, i) => (
                          <div
                            key={q._id}
                            className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-200 transition-colors group"
                          >
                            <div className="flex gap-3">
                              <span className="shrink-0 w-8 h-8 rounded-xl bg-gray-50 text-gray-400 text-xs font-black flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                {i + 1}
                              </span>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-800 line-clamp-2">
                                  {q.questionText}
                                </p>
                                <div className="flex gap-2">
                                  <span className="text-[10px] font-black uppercase text-gray-400">
                                    {q.type}
                                  </span>
                                  <span className="text-[10px] font-black uppercase text-primary-500">
                                    {q.marks} Marks
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Plus size={16} className="text-primary-600" />
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                          Add New Question
                        </h3>
                      </div>
                      <form
                        onSubmit={handleAddQuestion}
                        className="bg-white p-5 rounded-2xl border-2 border-dashed border-gray-200 space-y-4 hover:border-primary-200 transition-colors"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={qForm.type}
                            onChange={(e) =>
                              setQForm({ ...qForm, type: e.target.value })
                            }
                            className={inputClass + " bg-gray-50"}
                          >
                            <option value="MCQ">Standard MCQ</option>
                            <option value="PASSAGE">Passage Based</option>
                          </select>
                          <div className="relative">
                            <input
                              type="number"
                              value={qForm.marks}
                              onChange={(e) =>
                                setQForm({ ...qForm, marks: +e.target.value })
                              }
                              className={inputClass + " pl-10"}
                              placeholder="Marks"
                            />
                            <AlertCircle
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={14}
                            />
                          </div>
                        </div>
                        {qForm.type === "PASSAGE" && (
                          <textarea
                            required
                            value={qForm.passageText}
                            onChange={(e) =>
                              setQForm({
                                ...qForm,
                                passageText: e.target.value,
                              })
                            }
                            placeholder="Write or paste the passage here..."
                            className={inputClass + " h-32"}
                          />
                        )}
                        <textarea
                          required
                          value={qForm.questionText}
                          onChange={(e) =>
                            setQForm({ ...qForm, questionText: e.target.value })
                          }
                          placeholder="Type the question..."
                          className={inputClass + " font-bold"}
                          rows={2}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                          {qForm.options.map((o, i) => (
                            <div
                              key={i}
                              className={`relative flex items-center group ${qForm.correctOption === i ? "ring-2 ring-primary-500 rounded-xl" : ""}`}
                            >
                              <input
                                type="radio"
                                checked={qForm.correctOption === i}
                                onChange={() =>
                                  setQForm({ ...qForm, correctOption: i })
                                }
                                className="absolute left-3.5 z-10 w-4 h-4 text-primary-600 accent-primary-600"
                              />
                              <input
                                value={o}
                                onChange={(e) => {
                                  const n = [...qForm.options];
                                  n[i] = e.target.value;
                                  setQForm({ ...qForm, options: n });
                                }}
                                placeholder={`Option ${i + 1}`}
                                className={`${inputClass} pl-10 h-11`}
                                required
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={addingQ}
                          className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                          {addingQ ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />{" "}
                              Saving...
                            </>
                          ) : (
                            <>
                              <Plus size={16} /> Add to Bank
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300">
                    <AlertCircle size={40} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      Offline Manifest
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                      This exam is conducted offline. Use the analytics tab to
                      view manual score records.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isResultsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setResultsOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 rounded-t-2xl flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={20} /> Student Results
                </h2>
                <p className="text-emerald-200 text-sm mt-0.5">{resultsTest?.testName}</p>
              </div>
              <button onClick={() => setResultsOpen(false)} className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/30">
              {isResultsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-sm italic">Loading results...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                  <AlertCircle size={40} className="opacity-20" />
                  <p className="text-sm italic">No submissions yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 border-b sticky top-0">
                    <tr>
                      {["Student", "ID", "Score", "%", "Correct", "Wrong", "Result", "Submitted"].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-800">{r.studentName}</p>
                          <p className="text-[11px] text-gray-400">{r.studentEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{r.studentCode}</td>
                        <td className="px-4 py-3 font-black text-gray-900">{r.score}</td>
                        <td className="px-4 py-3 font-bold text-gray-700">{Math.round(r.percentage)}%</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">{r.correctCount}</td>
                        <td className="px-4 py-3 text-red-500 font-bold">{r.incorrectCount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${r.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {r.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-400">
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {isQuestionPaperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setQuestionPaperOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ListChecks size={20} /> Question Paper
                </h2>
                <p className="text-violet-200 text-sm mt-0.5">
                  {questionPaperTest?.testName}
                </p>
              </div>
              <button
                onClick={() => setQuestionPaperOpen(false)}
                className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {isQPLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-sm font-medium italic">
                    Loading question paper...
                  </p>
                </div>
              ) : questionPaperQuestions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  <AlertCircle size={40} className="opacity-20" />
                  <p className="text-sm font-medium italic">
                    No questions found for this test.
                  </p>
                </div>
              ) : (
                questionPaperQuestions.map((q, idx) => (
                  <div
                    key={q._id || idx}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex gap-2.5">
                        <span className="w-6 h-6 shrink-0 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-lg flex items-center justify-center">
                          Q{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-tight">
                            {q.questionText}
                          </p>
                          {q.type === "PASSAGE" && q.passageText && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {q.passageText}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-violet-700 bg-violet-50 px-2 py-1 rounded-full uppercase">
                          {q.marks || 1} Mark
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                        <span>{q.type} Question</span>
                        <span>
                          {q.type === "MCQ" && q.options
                            ? `${q.options.length} Options`
                            : "Passage Based"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-400 to-indigo-500 h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, ((q.marks || 1) / 5) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="shrink-0 px-6 py-4 bg-white border-t border-gray-100 rounded-b-2xl">
              <button
                onClick={handleSendInvites}
                disabled={isSendingInvites || isQPLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60"
              >
                {isSendingInvites ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending Invites...
                  </>
                ) : (
                  <>
                    <Mail size={16} /> Send Exam Invites to Batch Students
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
