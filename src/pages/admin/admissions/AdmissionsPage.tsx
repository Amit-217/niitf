import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BookOpen, Plus, Eye, X, CheckCircle, BadgeDollarSign } from 'lucide-react';
import {
    getAdmissions, createAdmission, completeAdmission,
    getFeesByAdmission, payFee,
    Admission, AdmissionPayload, FeePaymentPayload
} from '../../../api/admissionApi';
import { getStudents } from '../../../api/admissionApi';
import api from '../../../api/axios';

const STATUS_BADGE: Record<string, string> = {
    Active: 'bg-blue-100 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const AdmissionsPage = () => {
    const [admissions, setAdmissions] = useState<Admission[]>([]);
    const [total, setTotal] = useState(0);
    const [page] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [balanceOnly, setBalanceOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Create form
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [form, setForm] = useState({ studentId: '', courseId: '', batchId: '', admissionDate: new Date().toISOString().split('T')[0], totalFees: '', discount: '0', finalPayable: '' });
    const [submitting, setSubmitting] = useState(false);

    // View + fee drawer
    const [viewAdm, setViewAdm] = useState<Admission | null>(null);
    const [feeSummary, setFeeSummary] = useState<any>(null);
    const [feeForm, setFeeForm] = useState<FeePaymentPayload>({ installmentNo: 1, amount: 0, paymentMode: 'Cash' });
    const [feeSubmitting, setFeeSubmitting] = useState(false);

    const fetchAdmissions = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getAdmissions({ 
                page, 
                status: filterStatus || undefined,
                hasBalance: balanceOnly ? 'true' : undefined
            });
            setAdmissions(res.data.data.admissions);
            setTotal(res.data.data.pagination.total);
        } catch { toast.error('Failed to load admissions'); }
        finally { setIsLoading(false); }
    }, [page, filterStatus, balanceOnly]);

    useEffect(() => { fetchAdmissions(); }, [fetchAdmissions]);

    // Handle Conversion from Enquiry
    useEffect(() => {
        const pending = sessionStorage.getItem('pendingAdmission');
        if (pending) {
            const data = JSON.parse(pending);
            setCreateOpen(true);
            setForm(f => ({
                ...f,
                studentId: '', // User still needs to select/create student
                courseId: data.courseId || '',
            }));
            toast.info(`Converting enquiry for ${data.studentName}. Please select the student record.`);
            sessionStorage.removeItem('pendingAdmission');
        }
    }, [isCreateOpen]);

    useEffect(() => {
        if (!isCreateOpen) return;
        getStudents({ limit: 100 }).then(r => setStudents(r.data.data.students)).catch(() => { });
        api.get('/courses').then(r => setCourses(r.data.data || [])).catch(() => { });
        api.get('/batches').then(r => setBatches(r.data.data || [])).catch(() => { });
    }, [isCreateOpen]);

    // Auto-compute finalPayable when fees/discount change
    useEffect(() => {
        const total = parseFloat(form.totalFees || '0') - parseFloat(form.discount || '0');
        setForm(f => ({ ...f, finalPayable: total > 0 ? total.toString() : '' }));
    }, [form.totalFees, form.discount]);

    const openView = async (adm: Admission) => {
        setViewAdm(adm);
        try { const r = await getFeesByAdmission(adm._id); setFeeSummary(r.data.data); } catch { }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createAdmission({ ...form, totalFees: +form.totalFees, discount: +form.discount, finalPayable: +form.finalPayable } as AdmissionPayload);
            toast.success('Admission created!');
            setCreateOpen(false);
            fetchAdmissions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create admission');
        } finally { setSubmitting(false); }
    };

    const handleComplete = async (id: string) => {
        if (!window.confirm('Mark this admission as Completed? This requires full payment.')) return;
        try {
            await completeAdmission(id);
            toast.success('Admission completed!');
            fetchAdmissions();
            setViewAdm(null);
        } catch (err: any) { toast.error(err.response?.data?.message || 'Cannot complete'); }
    };

    const handlePayFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewAdm) return;
        setFeeSubmitting(true);
        try {
            await payFee(viewAdm._id, feeForm);
            toast.success('Payment recorded!');
            const r = await getFeesByAdmission(viewAdm._id);
            setFeeSummary(r.data.data);
            setFeeForm({ installmentNo: 1, amount: 0, paymentMode: 'Cash' });
        } catch (err: any) { toast.error(err.response?.data?.message || 'Payment failed'); }
        finally { setFeeSubmitting(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BookOpen className="text-primary-600" /> Admissions</h1>
                    <p className="text-sm text-gray-500 mt-1">{total} total admissions</p>
                </div>
                <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md transition-all">
                    <Plus size={18} /> New Admission
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    {['', 'Active', 'Completed', 'Cancelled'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === s ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {s || 'All Status'}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setBalanceOnly(!balanceOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${balanceOnly ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                    <BadgeDollarSign size={14} /> Balance Alert
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>{['Admission ID', 'Student', 'Course', 'Batch', 'Final Payable', 'Status', 'Date', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
                                : admissions.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No admissions found</td></tr>
                                    : admissions.map(a => (
                                        <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-primary-700 font-bold">{a.admissionId}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{a.studentId?.fullName}</td>
                                            <td className="px-4 py-3 text-gray-600">{a.courseId?.title}</td>
                                            <td className="px-4 py-3 text-gray-500">{a.batchId?.batchName}</td>
                                            <td className="px-4 py-3 font-semibold">₹{a.finalPayable?.toLocaleString()}</td>
                                            <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_BADGE[a.status] || ''}`}>{a.status}</span></td>
                                            <td className="px-4 py-3 text-gray-500">{new Date(a.admissionDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-3"><button onClick={() => openView(a)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Eye size={16} /></button></td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admission Drawer */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">New Admission</h2>
                            <button onClick={() => setCreateOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="adm-form" onSubmit={handleCreate} className="space-y-4">
                                {[['studentId', 'Student', students.map(s => ({ v: s._id, l: `${s.fullName} (${s.studentId})` }))],
                                ['courseId', 'Course', courses.map(c => ({ v: c._id, l: c.title }))],
                                ['batchId', 'Batch', batches.map(b => ({ v: b._id, l: b.batchName }))]].map(([field, label, opts]: any) => (
                                    <div key={field}>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>
                                        <select required value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                                            <option value="">Select {label}</option>
                                            {opts.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                                        </select>
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Admission Date <span className="text-red-500">*</span></label>
                                    <input type="date" required value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Total Fees (₹) <span className="text-red-500">*</span></label>
                                        <input required type="number" min={0} value={form.totalFees} onChange={e => setForm(f => ({ ...f, totalFees: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Discount (₹)</label>
                                        <input type="number" min={0} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                                    </div>
                                </div>
                                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-primary-800">Final Payable</span>
                                        <span className="text-xl font-extrabold text-primary-700">₹{parseFloat(form.finalPayable || '0').toLocaleString()}</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setCreateOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" form="adm-form" disabled={submitting} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white font-medium rounded-xl shadow-md transition-all">
                                {submitting ? 'Creating...' : 'Create Admission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View + Fee Drawer */}
            {viewAdm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setViewAdm(null)} />
                    <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{viewAdm.admissionId}</h2>
                                <p className="text-sm text-gray-500">{viewAdm.studentId?.fullName}</p>
                            </div>
                            <button onClick={() => setViewAdm(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Cards */}
                            {feeSummary && (
                                <div className="grid grid-cols-3 gap-3">
                                    {[['Total Fees', `₹${feeSummary.admissionDetails.totalFees?.toLocaleString()}`], ['Paid', `₹${feeSummary.paymentSummary.totalPaid?.toLocaleString()}`], ['Remaining', `₹${feeSummary.paymentSummary.remainingBalance?.toLocaleString()}`]].map(([label, val]) => (
                                        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                                            <p className="text-xs text-gray-400">{label}</p>
                                            <p className="text-base font-bold text-gray-900 mt-0.5">{val}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Installments */}
                            {feeSummary?.installments?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Installments</h4>
                                    <div className="space-y-2">
                                        {feeSummary.installments.map((i: any) => (
                                            <div key={i._id} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                                                <span className="text-sm font-medium text-gray-700">Installment {i.installmentNo} — {i.paymentMode}</span>
                                                <span className="font-bold text-emerald-700">₹{i.amount?.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pay Installment Form */}
                            {viewAdm.status === 'Active' && feeSummary && !feeSummary.paymentSummary.isFullyPaid && (
                                <div className="border border-dashed border-primary-300 rounded-xl p-4 bg-primary-50/40">
                                    <h4 className="text-sm font-bold text-primary-800 mb-3 flex items-center gap-2"><BadgeDollarSign size={16} /> Record Payment</h4>
                                    <form onSubmit={handlePayFee} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-gray-600 mb-1 block">Installment #</label>
                                                <select value={feeForm.installmentNo} onChange={e => setFeeForm(f => ({ ...f, installmentNo: +e.target.value as any }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm">
                                                    <option value={1}>1st Installment</option>
                                                    <option value={2}>2nd Installment</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-600 mb-1 block">Mode</label>
                                                <select value={feeForm.paymentMode} onChange={e => setFeeForm(f => ({ ...f, paymentMode: e.target.value as any }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm">
                                                    {['Cash', 'UPI', 'Bank'].map(m => <option key={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 mb-1 block">Amount (₹) <span className="text-red-500">*</span></label>
                                            <input required type="number" min={1} value={feeForm.amount || ''} onChange={e => setFeeForm(f => ({ ...f, amount: +e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                                        </div>
                                        <button type="submit" disabled={feeSubmitting} className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all shadow-sm">
                                            {feeSubmitting ? 'Saving...' : 'Record Payment'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {feeSummary?.paymentSummary?.isFullyPaid && viewAdm.status === 'Active' && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-emerald-800"><CheckCircle size={18} /><span className="font-semibold">Fully Paid</span></div>
                                    <button onClick={() => handleComplete(viewAdm._id)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors">Mark Completed</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
