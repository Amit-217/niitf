import React, { useState, useEffect, useCallback } from "react";
import { Pagination } from "../../../components/Pagination";
import { toast } from "react-toastify";
import {
  FileText,
  Plus,
  Eye,
  X,
  BookOpen,
  Clock,
  AlertCircle,
  Save,
  Loader2,
  ListChecks,
  Mail,
  Users,
  BarChart3,
} from "lucide-react";
import {
  getTests,
  createTest,
  updateTest,
  addQuestion,
  getQuestions,
  getPassages,
  sendExamInvites,
  Test,
  Question,
  Passage,
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
  passingPercentage: 40,
  mode: "Online",
};

export const TestsPage = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [form, setForm] = useState<any>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [viewTest, setViewTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isQLoading, setIsQLoading] = useState(false);
  // passageMode: "none" = regular MCQ, "new" = new passage, "existing" = link to existing
  const [qForm, setQForm] = useState({
    passageMode: "none",
    passageName: "",
    passageText: "",
    passageId: "",
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    marks: 1,
  });
  const [passages, setPassages] = useState<Passage[]>([]);
  const [passagesLoading, setPassagesLoading] = useState(false);
  const [addingQ, setAddingQ] = useState(false);
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
  const [showInviteSchedule, setShowInviteSchedule] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    testDate: "",
    startTimeStr: "",
    startAmPm: "AM",
    endTimeStr: "",
    endAmPm: "AM",
  });

  const handleSendInvites = async () => {
    if (!questionPaperTest) return;

    const sFormatted = formatTime12h(inviteForm.startTimeStr);
    const eFormatted = formatTime12h(inviteForm.endTimeStr);

    if (!inviteForm.testDate) {
      toast.error("Please select an exam date.");
      return;
    }
    if (!validateTime12h(sFormatted)) {
      toast.error("Invalid Start Time. Hours must be 1–12.");
      return;
    }
    if (!validateTime12h(eFormatted)) {
      toast.error("Invalid End Time. Hours must be 1–12.");
      return;
    }

    const sTime = to24h(sFormatted, inviteForm.startAmPm);
    const eTime = to24h(eFormatted, inviteForm.endAmPm);
    const startTime = new Date(`${inviteForm.testDate} ${sTime}`).toISOString();
    const endTime = new Date(`${inviteForm.testDate} ${eTime}`).toISOString();

    setIsSendingInvites(true);
    try {
      await updateTest(questionPaperTest._id, { startTime, endTime });
      const res: any = await sendExamInvites(questionPaperTest._id);
      const d = res?.data?.data || res?.data || res;
      toast.success(
        `Invites sent to ${d.sent} student(s). Skipped: ${d.skipped} (no email).`,
      );
      setShowInviteSchedule(false);
      setQuestionPaperOpen(false);
      fetchTests();
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
    setShowInviteSchedule(false);
    setInviteForm({ testDate: "", startTimeStr: "", startAmPm: "AM", endTimeStr: "", endAmPm: "AM" });
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
      const res: any = await getTests({ page, limit });
      if (Array.isArray(res)) {
        setTests(res); setTotal(res.length);
      } else if (res?.data?.tests) {
        setTests(res.data.tests);
        setTotal(res.data.pagination?.total ?? res.data.tests.length);
      } else if (res?.data && Array.isArray(res.data)) {
        setTests(res.data); setTotal(res.pagination?.total ?? res.data.length);
      } else if (res?.tests) {
        setTests(res.tests);
        setTotal(res.pagination?.total ?? res.tests.length);
      } else {
        setTests([]);
      }
    } catch {
      toast.error("Failed to load tests");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

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
      else if (clean.length === 3)
        str = `0${clean.slice(0, 1)}:${clean.slice(1)}`;
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
      await createTest(form);
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

  const fetchPassages = async (testId: string): Promise<Passage[]> => {
    setPassagesLoading(true);
    try {
      const r: any = await getPassages(testId);
      const ps: Passage[] = Array.isArray(r)
        ? r
        : Array.isArray(r?.data)
          ? r.data
          : [];
      setPassages(ps);
      return ps;
    } catch {
      setPassages([]);
      return [];
    } finally {
      setPassagesLoading(false);
    }
  };

  const openView = async (t: Test) => {
    setViewTest(t);
    setPassages([]);
    setQForm({
      passageMode: "none",
      passageName: "",
      passageText: "",
      passageId: "",
      questionText: "",
      options: ["", "", "", ""],
      correctOption: 0,
      marks: 1,
    });
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
      fetchPassages(t._id);
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



  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewTest) return;
    setAddingQ(true);
    const prevMode = qForm.passageMode;
    const prevPassageName = qForm.passageName;
    const prevPassageText = qForm.passageText;
    try {
      const payload: any = {
        type: qForm.passageMode === "none" ? "MCQ" : "PASSAGE",
        questionText: qForm.questionText,
        options: qForm.options,
        correctOption: qForm.correctOption,
        marks: qForm.marks,
      };
      if (qForm.passageMode === "new") {
        payload.passageName = qForm.passageName;
        payload.passageText = qForm.passageText;
      } else if (qForm.passageMode === "existing") {
        payload.passageId = qForm.passageId;
      }
      await addQuestion(viewTest._id, payload);
      toast.success("Added!");
      const r: any = await getQuestions(viewTest._id);
      if (Array.isArray(r)) setQuestions(r);
      else if (r?.data && Array.isArray(r.data)) setQuestions(r.data);
      else if (r?.data?.data) setQuestions(r.data.data);
      else setQuestions([]);

      // Refresh passages and auto-select newly created passage
      const updatedPassages = await fetchPassages(viewTest._id);
      const questionReset = {
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
        marks: qForm.marks,
      };
      if (prevMode === "new") {
        // Auto-switch to "existing" so next question links to same passage
        const created = updatedPassages.find(
          (p) =>
            p.passageName === prevPassageName &&
            p.passageText === prevPassageText,
        );
        setQForm({
          passageMode: created ? "existing" : "none",
          passageId: created?.passageId || "",
          passageName: created?.passageName || "",
          passageText: created?.passageText || "",
          ...questionReset,
        });
      } else {
        // Keep existing passage or none — just reset question fields
        setQForm({ ...qForm, ...questionReset });
      }
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
              {[
                "Test Name",
                "Test Code",
                "Batch",
                "Marks",
                "Mode",
                "Actions",
              ].map((h) => (
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
                    {t.testCode ? (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs tracking-widest">
                        {t.testCode}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.batchId?.batchName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs">
                        Total: {t.totalMarks}
                      </span>
                      <span className="text-green-600 font-bold text-sm">
                        {t.passingPercentage}% pass
                      </span>
                    </div>
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
                      <BarChart3 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={Math.ceil(total / limit)}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      Duration & Grading
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3 w-full md:w-auto">
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
                          <div className="text-gray-300">|</div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400">
                              Passing %
                            </span>
                            <input
                              type="number"
                              required
                              min="1"
                              max="100"
                              value={form.passingPercentage}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  passingPercentage: +e.target.value,
                                })
                              }
                              className="w-12 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-green-600"
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




      {viewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setViewTest(null)}
          />
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-4 rounded-t-2xl flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">{viewTest.testName}</h2>
                <p className="text-violet-200 text-sm mt-0.5">{viewTest.mode} · Question Bank</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {questions.length} Questions
                </span>
                <button
                  onClick={() => setViewTest(null)}
                  className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {viewTest.mode === "Online" ? (
              <div className="flex flex-1 min-h-0">
                {/* ── Left Panel: Question List ── */}
                <div className="w-2/5 border-r border-gray-100 flex flex-col min-h-0">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      Added Questions
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {isQLoading ? (
                      <div className="py-12 text-center text-gray-400 text-sm italic">
                        Loading...
                      </div>
                    ) : questions.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
                          <Plus size={20} className="text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400 italic">No questions yet</p>
                      </div>
                    ) : (
                      questions.map((q, i) => {
                        const prevQ = i > 0 ? questions[i - 1] : null;
                        const isNewPassageGroup =
                          q.type === "PASSAGE" &&
                          q.passageId &&
                          (!prevQ || prevQ.passageId !== q.passageId);
                        return (
                          <React.Fragment key={q._id}>
                            {isNewPassageGroup && (
                              <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                                <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">
                                  Passage
                                </p>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {q.passageText}
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2.5 p-3 bg-white border border-gray-100 rounded-xl hover:border-violet-200 hover:shadow-sm transition-all group cursor-default">
                              <span className="shrink-0 w-6 h-6 rounded-lg bg-gray-50 text-gray-400 text-[11px] font-black flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-relaxed">
                                  {q.questionText}
                                </p>
                                <div className="flex gap-1.5 mt-1.5">
                                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${q.passageId ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-500"}`}>
                                    {q.passageId ? "Passage" : "MCQ"}
                                  </span>
                                  <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-md">
                                    {q.marks}M
                                  </span>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── Right Panel: Add Question Form ── */}
                <div className="w-3/5 flex flex-col min-h-0">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      Add New Question
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">
                    <form onSubmit={handleAddQuestion} className="space-y-4">
                      {/* Type Toggle */}
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-1 gap-1">
                        {[
                          { label: "MCQ", value: "none" },
                          { label: "New Passage", value: "new" },
                          { label: "Link Passage", value: "existing" },
                        ].map(({ label, value }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              if (value === "none") {
                                setQForm({ ...qForm, passageMode: "none", passageId: "", passageName: "", passageText: "" });
                              } else if (value === "new") {
                                setQForm({ ...qForm, passageMode: "new", passageId: "", passageName: "", passageText: "" });
                              } else {
                                setQForm({ ...qForm, passageMode: "existing", passageId: "", passageName: "", passageText: "" });
                              }
                            }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              qForm.passageMode === value
                                ? "bg-white text-violet-700 shadow-sm border border-violet-100"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Passage fields */}
                      {qForm.passageMode === "new" && (
                        <div className="space-y-2 p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                          <input
                            required
                            type="text"
                            value={qForm.passageName}
                            onChange={(e) => setQForm({ ...qForm, passageName: e.target.value })}
                            placeholder="Passage title (e.g., Environment Article)"
                            className={inputClass}
                          />
                          <textarea
                            required
                            value={qForm.passageText}
                            onChange={(e) => setQForm({ ...qForm, passageText: e.target.value })}
                            placeholder="Write or paste passage text here..."
                            className={inputClass + " h-24 text-sm"}
                          />
                        </div>
                      )}

                      {qForm.passageMode === "existing" && (
                        <div className="space-y-2">
                          <select
                            value={qForm.passageId}
                            onChange={(e) => {
                              const p = passages.find((p) => p.passageId === e.target.value);
                              setQForm({ ...qForm, passageId: e.target.value, passageName: p?.passageName || "", passageText: p?.passageText || "" });
                            }}
                            className={inputClass + " bg-gray-50"}
                          >
                            <option value="">— Select a passage —</option>
                            {passagesLoading ? (
                              <option disabled>Loading...</option>
                            ) : (
                              passages.map((p) => (
                                <option key={p.passageId} value={p.passageId}>{p.passageName}</option>
                              ))
                            )}
                          </select>
                          {qForm.passageText && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl max-h-20 overflow-y-auto">
                              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">{qForm.passageName}</p>
                              <p className="text-xs text-gray-600">{qForm.passageText}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question Text */}
                      <textarea
                        required
                        value={qForm.questionText}
                        onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                        placeholder="Type your question here..."
                        className={inputClass + " font-semibold text-sm leading-relaxed"}
                        rows={3}
                      />

                      {/* Options A/B/C/D */}
                      <div className="grid grid-cols-2 gap-2">
                        {qForm.options.map((o, i) => {
                          const label = ["A", "B", "C", "D"][i];
                          const isCorrect = qForm.correctOption === i;
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2 rounded-xl border-2 transition-all ${
                                isCorrect
                                  ? "border-emerald-400 bg-emerald-50"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setQForm({ ...qForm, correctOption: i })}
                                className={`shrink-0 w-8 h-8 m-1 rounded-lg text-xs font-black transition-all ${
                                  isCorrect
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                              >
                                {label}
                              </button>
                              <input
                                value={o}
                                onChange={(e) => {
                                  const n = [...qForm.options];
                                  n[i] = e.target.value;
                                  setQForm({ ...qForm, options: n });
                                }}
                                placeholder={`Option ${label}`}
                                className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-300"
                                required
                              />
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-gray-400 -mt-1">Click A / B / C / D to mark the correct answer</p>

                      {/* Marks */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-600 whitespace-nowrap">Marks per question</label>
                        <input
                          type="number"
                          min={1}
                          value={qForm.marks}
                          onChange={(e) => setQForm({ ...qForm, marks: +e.target.value })}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={addingQ}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {addingQ ? (
                          <><Loader2 size={16} className="animate-spin" /> Saving...</>
                        ) : (
                          <><Plus size={16} /> Add Question</>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300">
                  <AlertCircle size={40} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Offline Examination</h4>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                    This exam is conducted offline. Use the analytics tab to view manual score records.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isResultsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setResultsOpen(false)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={20} /> Student Results
                </h2>
                <p className="text-violet-200 text-sm mt-0.5">
                  {resultsTest?.testName}
                </p>
              </div>
              <button
                onClick={() => setResultsOpen(false)}
                className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
              >
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
                      {[
                        "Student",
                        "ID",
                        "Score",
                        "%",
                        "Correct",
                        "Wrong",
                        "Result",
                        "Submitted",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-800">
                            {r.studentName}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {r.studentEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">
                          {r.studentCode}
                        </td>
                        <td className="px-4 py-3 font-black text-gray-900">
                          {r.score}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-700">
                          {Math.round(r.percentage)}%
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">
                          {r.correctCount}
                        </td>
                        <td className="px-4 py-3 text-red-500 font-bold">
                          {r.incorrectCount}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${r.result === "PASS" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                          >
                            {r.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-400">
                          {r.submittedAt
                            ? new Date(r.submittedAt).toLocaleString()
                            : "—"}
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
                onClick={() => setShowInviteSchedule(true)}
                disabled={isQPLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60"
              >
                <Mail size={16} /> Send Exam Invites to Batch Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Schedule Popup */}
      {showInviteSchedule && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setShowInviteSchedule(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock size={18} /> Set Exam Schedule
                </h2>
                <p className="text-violet-200 text-xs mt-0.5">{questionPaperTest?.testName}</p>
              </div>
              <button
                onClick={() => setShowInviteSchedule(false)}
                className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="col-span-2">
                <label className={labelClass}>Examination Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={inviteForm.testDate}
                    onChange={(e) => setInviteForm({ ...inviteForm, testDate: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start Time *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteForm.startTimeStr}
                      onBlur={(e) => setInviteForm({ ...inviteForm, startTimeStr: formatTime12h(e.target.value) })}
                      onChange={(e) => setInviteForm({ ...inviteForm, startTimeStr: e.target.value })}
                      className={`${inputClass} border-blue-100 bg-blue-50/10 focus:bg-white font-semibold w-16`}
                      placeholder="09:30"
                      maxLength={5}
                    />
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold shrink-0">
                      {["AM", "PM"].map((v) => (
                        <button key={v} type="button" onClick={() => setInviteForm({ ...inviteForm, startAmPm: v })}
                          className={`px-2.5 py-2 transition-colors ${inviteForm.startAmPm === v ? "bg-blue-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>End Time *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteForm.endTimeStr}
                      onBlur={(e) => setInviteForm({ ...inviteForm, endTimeStr: formatTime12h(e.target.value) })}
                      onChange={(e) => setInviteForm({ ...inviteForm, endTimeStr: e.target.value })}
                      className={`${inputClass} border-red-100 bg-red-50/10 focus:bg-white font-semibold w-16`}
                      placeholder="11:30"
                      maxLength={5}
                    />
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold shrink-0">
                      {["AM", "PM"].map((v) => (
                        <button key={v} type="button" onClick={() => setInviteForm({ ...inviteForm, endAmPm: v })}
                          className={`px-2.5 py-2 transition-colors ${inviteForm.endAmPm === v ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowInviteSchedule(false)}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvites}
                disabled={isSendingInvites}
                className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60"
              >
                {isSendingInvites ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><Mail size={16} /> Confirm & Send</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
