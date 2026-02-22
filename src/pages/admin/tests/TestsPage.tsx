import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FileText, Plus, Eye, X, BookOpen, Clock, BarChart3, AlertCircle, Save, Loader2 } from 'lucide-react';
import { getTests, createTest, addQuestion, getQuestions, Test, TestPayload, Question } from '../../../api/testApi';
import api from '../../../api/axios';

const MODE_COLORS: any = { Online: 'bg-indigo-100 text-indigo-700', Offline: 'bg-slate-100 text-slate-700' };

export const TestsPage = () => {
    const [tests, setTests] = useState<Test[]>([]);
    const [page] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [batches, setBatches] = useState<any[]>([]);
    const [form, setForm] = useState<any>({ testName: '', batchId: '', durationMinutes: 60, totalMarks: 100, passingMarks: 35, mode: 'Online', startTime: '', endTime: '' });
    const [submitting, setSubmitting] = useState(false);
    const [viewTest, setViewTest] = useState<Test | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isQLoading, setIsQLoading] = useState(false);
    const [qForm, setQForm] = useState({ type: 'MCQ', passageText: '', questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1 });
    const [addingQ, setAddingQ] = useState(false);
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [isAnalyticsOpen, setAnalyticsOpen] = useState(false);

    const fetchTests = useCallback(async () => {
        setIsLoading(true);
        try { const res = await getTests({ page }); setTests(res.data.data.tests); }
        catch { toast.error('Failed to load tests'); }
        finally { setIsLoading(false); }
    }, [page]);

    useEffect(() => { fetchTests(); }, [fetchTests]);
    useEffect(() => { if (isCreateOpen) api.get('/batches').then(r => setBatches(r.data.data || [])).catch(() => { }); }, [isCreateOpen]);

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        try { await createTest(form); toast.success('Test created!'); setCreateOpen(false); fetchTests(); }
        catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    const openView = async (t: Test) => {
        setViewTest(t);
        if (t.mode === 'Online') {
            setIsQLoading(true);
            try { const r = await getQuestions(t._id); setQuestions(r.data.data); }
            catch { toast.error('Error'); } finally { setIsQLoading(false); }
        }
    };

    const openAnalytics = async (t: Test) => {
        setViewTest(t);
        try { const res: any = await api.get(`/admin/tests/${t._id}/analytics`); setAnalytics(res.data); setAnalyticsOpen(true); }
        catch { toast.error("Error"); }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault(); if (!viewTest) return; setAddingQ(true);
        try {
            const payload: any = { ...qForm }; if (qForm.type === 'MCQ') delete payload.passageText;
            await addQuestion(viewTest._id, payload);
            toast.success('Added!');
            const r = await getQuestions(viewTest._id); setQuestions(r.data.data);
            setQForm({ ...qForm, passageText: '', questionText: '', options: ['', '', '', ''], correctOption: 0 });
        } catch { toast.error('Error'); } finally { setAddingQ(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-primary-600" /> CBT Tests</h1>
                <button onClick={() => setCreateOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg"><Plus size={18} className="inline mr-1" /> New Test</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>{['Test Name', 'Batch', 'Marks', 'Mode', 'Actions'].map(h => <th key={h} className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? <tr><td colSpan={5} className="py-10 text-center">Loading...</td></tr> :
                            tests.map(t => (
                                <tr key={t._id}>
                                    <td className="px-4 py-3 font-bold">{t.testName}</td>
                                    <td className="px-4 py-3 text-gray-500">{t.batchId?.batchName}</td>
                                    <td className="px-4 py-3">{t.passingMarks}/{t.totalMarks}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${MODE_COLORS[t.mode]}`}>{t.mode}</span></td>
                                    <td className="px-4 py-3 flex gap-1">
                                        <button onClick={() => openView(t)} className="p-1.5 text-gray-400 hover:text-primary-600"><Eye size={16}/></button>
                                        <button onClick={() => openAnalytics(t)} className="p-1.5 text-gray-400 hover:text-amber-600"><BarChart3 size={16}/></button>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>

            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white h-full p-6 animate-in slide-in-from-right">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Create Test</h2><button onClick={() => setCreateOpen(false)}><X/></button></div>
                        <form onSubmit={handleCreateTest} className="space-y-4">
                            <input required value={form.testName} onChange={e => setForm({...form, testName: e.target.value})} placeholder="Test Name" className="w-full p-3 border rounded-xl" />
                            <select required value={form.batchId} onChange={e => setForm({...form, batchId: e.target.value})} className="w-full p-3 border rounded-xl">
                                <option value="">Select Batch</option>
                                {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs font-bold text-gray-400">Start Time</label><input type="datetime-local" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                                <div><label className="text-xs font-bold text-gray-400">End Time</label><input type="datetime-local" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" required value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: +e.target.value})} placeholder="Mins" className="w-full p-3 border rounded-xl" />
                                <input type="number" required value={form.totalMarks} onChange={e => setForm({...form, totalMarks: +e.target.value})} placeholder="Total" className="w-full p-3 border rounded-xl" />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold">Create</button>
                        </form>
                    </div>
                </div>
            )}

            {isAnalyticsOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-xl bg-white h-full p-6 overflow-y-auto animate-in slide-in-from-right">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold uppercase">Difficulty Analytics</h2><button onClick={() => setAnalyticsOpen(false)}><X/></button></div>
                        <div className="space-y-4">
                            {analytics.map((item, idx) => (
                                <div key={item.questionId} className="p-4 border rounded-xl bg-gray-50">
                                    <div className="flex justify-between mb-2"><p className="text-sm font-bold">{idx+1}. {item.questionText}</p><span className="text-[10px] font-black text-red-600 uppercase">{Math.round(item.incorrectPercentage)}% Error</span></div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full"><div className="bg-red-500 h-full rounded-full" style={{ width: `${item.incorrectPercentage}%` }} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {viewTest && !isAnalyticsOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white h-full p-6 overflow-y-auto animate-in slide-in-from-right">
                        <div className="flex justify-between items-center mb-6"><div><h2 className="text-xl font-bold">{viewTest.testName}</h2><p className="text-xs text-gray-400">Manage questions for this exam</p></div><button onClick={() => setViewTest(null)}><X/></button></div>
                        {viewTest.mode === 'Online' ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                <form onSubmit={handleAddQuestion} className="space-y-4 p-4 border rounded-2xl bg-white">
                                    <select value={qForm.type} onChange={e => setQForm({...qForm, type: e.target.value})} className="w-full p-2 border rounded-lg"><option value="MCQ">Standard MCQ</option><option value="PASSAGE">Passage Based</option></select>
                                    {qForm.type === 'PASSAGE' && <textarea required value={qForm.passageText} onChange={e => setQForm({...qForm, passageText: e.target.value})} placeholder="Passage..." className="w-full p-2 border rounded-lg" rows={3}/>}
                                    <textarea required value={qForm.questionText} onChange={e => setQForm({...qForm, questionText: e.target.value})} placeholder="Question..." className="w-full p-2 border rounded-lg" rows={2}/>
                                    {qForm.options.map((o, i) => <div key={i} className="flex gap-2"><input type="radio" checked={qForm.correctOption === i} onChange={() => setQForm({...qForm, correctOption: i})}/><input value={o} onChange={e => {const n=[...qForm.options]; n[i]=e.target.value; setQForm({...qForm, options: n})}} placeholder={`Option ${i+1}`} className="flex-1 p-1 border rounded" required/></div>)}
                                    <button type="submit" className="w-full py-2 bg-primary-600 text-white font-bold rounded-lg uppercase text-xs">Save Question</button>
                                </form>
                                <div className="space-y-3">{questions.map((q, i) => <div key={q._id} className="p-3 bg-gray-50 border rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Q{i+1}</p><p className="text-sm font-medium">{q.questionText}</p></div>)}</div>
                            </div>
                        ) : <p className="text-center py-20 text-gray-400 italic">Offline exam - no question bank needed.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};
