import React, { useState, useEffect, useRef } from 'react';
import {
    Layers, Plus, Search, Pencil, Trash2, X, Save, Loader2,
    Calendar, MoreVertical, RefreshCw,
    CheckCircle2, XCircle, Users, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

interface Course {
    _id: string;
    courseId: string;
    courseName: string;
}

interface Batch {
    _id: string;
    batchId: string;
    batchName: string;
    courseId: { _id: string; courseId: string; courseName: string } | null;
    startDate: string;
    endDate: string | null;
    status: 'Upcoming' | 'Running' | 'Completed';
    isActive: boolean;
    studentCount: number;
    createdAt: string;
}

const inputClass = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

const STATUS_CONFIG = {
    Upcoming: { color: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-50', gradient: 'from-sky-400 to-blue-500' },
    Running: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', gradient: 'from-emerald-400 to-green-500' },
    Completed: { color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', gradient: 'from-gray-400 to-gray-500' },
};

const BatchProgressBar: React.FC<{ start: string; end: string | null; status: string }> = ({ start, end, status }) => {
    if (status === 'Upcoming') return null;
    if (status === 'Completed') return (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4"><div className="bg-gray-400 h-1.5 rounded-full w-full" /></div>
    );
    if (!end) return null;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const now = new Date().getTime();
    const total = e - s;
    const current = now - s;
    const pct = Math.min(Math.max(Math.round((current / total) * 100), 0), 100);
    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span><span className="text-[10px] font-bold text-emerald-600">{pct}%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} /></div>
        </div>
    );
};

interface ModalProps {
    batch?: Batch | null;
    courses: Course[];
    onClose: () => void;
    onSaved: () => void;
}

const BatchModal: React.FC<ModalProps> = ({ batch, courses, onClose, onSaved }) => {
    const [batchName, setBatchName] = useState(batch?.batchName || '');
    const [courseId, setCourseId] = useState(batch?.courseId?.courseId || '');
    const [startDate, setStartDate] = useState(batch ? batch.startDate.slice(0, 10) : '');
    const [endDate, setEndDate] = useState(batch?.endDate ? batch.endDate.slice(0, 10) : '');
    const [status, setStatus] = useState<'Upcoming' | 'Running' | 'Completed'>(batch?.status || 'Upcoming');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = { batchName, startDate, status };
            if (endDate) payload.endDate = endDate;
            if (!batch) payload.courseId = courseId;
            if (batch) await api.put(`/batches/${batch.batchId}`, payload);
            else await api.post('/batches', payload);
            onSaved(); onClose();
        } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to save.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">{batch ? 'Edit Batch' : 'New Academic Batch'}</h2>
                        <p className="text-violet-200 text-sm mt-0.5">{batch ? 'Update schedule or status.' : 'Register a new batch for instruction.'}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Section: Basic details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                                    <Layers size={14} className="text-violet-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Batch Identity</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelClass}>Batch Name *</label>
                                    <input value={batchName} onChange={e => setBatchName(e.target.value)} required placeholder="e.g. NDT Level 2 (2026)" className={inputClass} />
                                </div>

                                {!batch && (
                                    <div className="col-span-2">
                                        <label className={labelClass}>Assigned Course *</label>
                                        <select value={courseId} onChange={e => setCourseId(e.target.value)} required className={inputClass}>
                                            <option value="">-- Select Master Course --</option>
                                            {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseName}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Schedule */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                    <Calendar size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Timing & Status</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Start Date *</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>End Date</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>Instruction Status</label>
                                    <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                                        {(['Upcoming', 'Running', 'Completed'] as const).map(s => (
                                            <button key={s} type="button" onClick={() => setStatus(s)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${status === s ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>{s.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all">Discard</button>
                        <button type="submit" disabled={loading} className="flex-[2] py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-100 hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-70">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} className="group-hover:scale-110 transition-transform" /> {batch ? 'Update Batch' : 'Create Batch'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BatchCard: React.FC<{ batch: Batch; onEdit: (b: Batch) => void; onDelete: (b: Batch) => void; onToggleActive: (b: Batch) => void; }> = ({ batch, onEdit, onDelete, onToggleActive }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const cfg = STATUS_CONFIG[batch.status];
    useEffect(() => {
        const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${!batch.isActive ? 'opacity-60' : ''}`}>
            <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white`}><Layers size={18} /></div>
                        <div><h3 className="text-sm font-bold truncate w-32">{batch.batchName}</h3><p className="text-[10px] text-gray-400">{batch.batchId}</p></div>
                    </div>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400"><MoreVertical size={15} /></button>
                        {menuOpen && (
                            <div className="absolute right-0 top-6 w-32 bg-white border rounded-xl shadow-xl py-1 z-10 text-xs">
                                <button onClick={() => { onEdit(batch); setMenuOpen(false); }} className="w-full text-left p-2 hover:bg-gray-50 flex items-center gap-2"><Pencil size={12} /> Edit</button>
                                <button onClick={() => { onToggleActive(batch); setMenuOpen(false); }} className="w-full text-left p-2 hover:bg-gray-50 flex items-center gap-2">{batch.isActive ? <XCircle size={12} /> : <CheckCircle2 size={12} />} Toggle</button>
                                <button onClick={() => { onDelete(batch); setMenuOpen(false); }} className="w-full text-left p-2 hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 mb-4">
                    <span className="bg-violet-50 text-violet-700 text-[10px] font-bold p-1 rounded border border-violet-100 truncate flex-1 uppercase text-center">{batch.courseId?.courseName}</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold p-1 rounded border border-blue-100 flex items-center gap-1"><Users size={10} /> {batch.studentCount}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-500 uppercase">
                    <div className="bg-gray-50 p-2 rounded-lg">Start: <span className="text-gray-900 block mt-1">{new Date(batch.startDate).toLocaleDateString()}</span></div>
                    <div className="bg-gray-50 p-2 rounded-lg">End: <span className="text-gray-900 block mt-1">{batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '—'}</span></div>
                </div>
                <BatchProgressBar start={batch.startDate} end={batch.endDate} status={batch.status} />
            </div>
        </div>
    );
};

export const BatchesPage: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Running' | 'Completed'>('All');
    const [courseFilter, setCourseFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editBatch, setEditBatch] = useState<Batch | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bRes, cRes]: any[] = await Promise.all([
                api.get('/batches?limit=1000'),
                api.get('/courses?limit=100'),
            ]);
            setBatches(bRes.data || []);
            setCourses(cRes.data || []);
        } catch { toast.error('Failed to load.'); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleActive = async (b: Batch) => {
        try { await api.put(`/batches/${b.batchId}`, { isActive: !b.isActive }); toast.success('Status updated!'); fetchData(); }
        catch { toast.error('Error.'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return; setDeleting(true);
        try { await api.delete(`/batches/${deleteTarget.batchId}`); toast.success('Deleted!'); setDeleteTarget(null); fetchData(); }
        catch { toast.error('Error.'); } finally { setDeleting(false); }
    };

    const filteredBatches = batches.filter((batch) => {
        const q = search.toLowerCase().trim();
        const matchesSearch =
            !q ||
            batch.batchName.toLowerCase().includes(q) ||
            batch.batchId.toLowerCase().includes(q) ||
            batch.courseId?.courseName?.toLowerCase().includes(q) ||
            batch.courseId?.courseId?.toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'All' || batch.status === statusFilter;
        const matchesCourse =
            courseFilter === 'All' ||
            batch.courseId?.courseId === courseFilter ||
            batch.courseId?._id === courseFilter;

        return matchesSearch && matchesStatus && matchesCourse;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900"><Layers className="text-emerald-500" /> Batches</h1>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-2.5 border rounded-xl text-gray-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all"><RefreshCw size={16} /></button>
                    <button onClick={() => { setEditBatch(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"><Plus size={17} /> New Batch</button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..." className="w-full pl-9 pr-4 py-2.5 border rounded-xl" />
                </div>
                <div className="relative min-w-[220px]">
                    <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="w-full h-full px-4 py-2.5 border rounded-xl bg-white text-sm text-gray-700"
                    >
                        <option value="All">All Courses</option>
                        {courses.map((course) => (
                            <option key={course._id} value={course.courseId}>
                                {course.courseName}
                            </option>
                        ))}
                    </select>
                </div>
            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                    {(['All', 'Upcoming', 'Running', 'Completed'] as const).map(t => (
                        <button key={t} onClick={() => setStatusFilter(t)} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${statusFilter === t ? 'bg-white shadow-sm' : 'text-gray-500'}`}>{t}</button>
                    ))}
                </div>
            </div>
            {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin inline" size={32} /></div> :
                filteredBatches.length === 0 ? <div className="py-20 text-center text-gray-500">No batches found</div> :
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBatches.map(b => <BatchCard key={b._id} batch={b} onEdit={(batch) => { setEditBatch(batch); setShowModal(true); }} onDelete={setDeleteTarget} onToggleActive={handleToggleActive} />)}
                    </div>
            }
            {showModal && <BatchModal batch={editBatch} courses={courses} onClose={() => { setShowModal(false); setEditBatch(null); }} onSaved={fetchData} />}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
                        <Trash2 size={40} className="mx-auto text-red-600 mb-4" />
                        <h3 className="text-lg font-bold">Delete Batch?</h3>
                        <p className="text-sm text-gray-500 mb-6">"{deleteTarget.batchName}" will be removed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border rounded-xl">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
