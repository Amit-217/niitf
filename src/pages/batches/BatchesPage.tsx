import React, { useState, useEffect, useRef } from 'react';
import {
    Layers, Plus, Search, Pencil, Trash2, X, Save, Loader2,
    ChevronDown, Calendar, BookOpen, MoreVertical, RefreshCw,
    CheckCircle2, XCircle, CalendarDays
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
    createdAt: string;
}

const STATUS_CONFIG = {
    Upcoming: { color: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-500', gradient: 'from-sky-400 to-blue-500' },
    Running: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', gradient: 'from-emerald-400 to-green-500' },
    Completed: { color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', gradient: 'from-gray-400 to-gray-500' },
};

// ── Modal ──────────────────────────────────────────────────────────────────
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
            if (batch) {
                await api.put(`/batches/${batch.batchId}`, payload);
                toast.success('Batch updated!');
            } else {
                await api.post('/batches', payload);
                toast.success('Batch created!');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save batch.');
        } finally {
            setLoading(false);
        }
    };

    const statusOptions: Array<'Upcoming' | 'Running' | 'Completed'> = ['Upcoming', 'Running', 'Completed'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className={`rounded-t-2xl p-6 bg-gradient-to-r ${batch ? 'from-emerald-500 to-green-600' : 'from-sky-500 to-blue-600'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <Layers size={18} className="text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">
                                {batch ? 'Edit Batch' : 'New Batch'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Batch Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Batch Name *</label>
                        <input value={batchName} onChange={e => setBatchName(e.target.value)} required placeholder="e.g. Batch A - Jan 2025"
                            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 hover:border-gray-300 transition-all" />
                    </div>

                    {/* Course (only on create) */}
                    {!batch && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Course *</label>
                            <div className="relative">
                                <select value={courseId} onChange={e => setCourseId(e.target.value)} required
                                    className="w-full px-4 py-3 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 appearance-none cursor-pointer transition-all">
                                    <option value="">Select course...</option>
                                    {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseName}</option>)}
                                </select>
                                <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Start Date *</label>
                            <div className="relative">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                                    className="w-full px-4 py-3 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all" />
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">End Date</label>
                            <div className="relative">
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    className="w-full px-4 py-3 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all" />
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Status tabs */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                        <div className="flex gap-2">
                            {statusOptions.map(s => {
                                const cfg = STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${status === s
                                            ? `${cfg.color} border-current shadow-sm`
                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-200 disabled:opacity-60">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {batch ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Batch Card ─────────────────────────────────────────────────────────────
interface CardProps {
    batch: Batch;
    onEdit: (b: Batch) => void;
    onDelete: (b: Batch) => void;
    onToggleActive: (b: Batch) => void;
}

const BatchCard: React.FC<CardProps> = ({ batch, onEdit, onDelete, onToggleActive }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const cfg = STATUS_CONFIG[batch.status];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${!batch.isActive ? 'opacity-60' : ''}`}>
            {/* Status accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <Layers size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{batch.batchName}</h3>
                            <p className="text-xs text-gray-400">{batch.batchId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {batch.status}
                        </span>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setMenuOpen(!menuOpen)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical size={15} />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 top-8 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                                    <button onClick={() => { onEdit(batch); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <Pencil size={13} /> Edit
                                    </button>
                                    <button onClick={() => { onToggleActive(batch); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        {batch.isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                                        {batch.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <div className="border-t border-gray-100 my-1" />
                                    <button onClick={() => { onDelete(batch); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Course chip */}
                {batch.courseId && (
                    <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-violet-50 rounded-lg border border-violet-100 w-fit max-w-full">
                        <BookOpen size={11} className="text-violet-500 flex-shrink-0" />
                        <span className="text-xs font-semibold text-violet-700 truncate">{batch.courseId.courseName}</span>
                    </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <CalendarDays size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium">Start</span>
                        </div>
                        <p className="text-xs font-bold text-gray-800">{fmt(batch.startDate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <CalendarDays size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium">End</span>
                        </div>
                        <p className="text-xs font-bold text-gray-800">{batch.endDate ? fmt(batch.endDate) : '—'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────────────────────
export const BatchesPage: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Running' | 'Completed'>('All');
    const [showModal, setShowModal] = useState(false);
    const [editBatch, setEditBatch] = useState<Batch | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [batchRes, courseRes]: any[] = await Promise.all([
                api.get('/batches'),
                api.get('/courses'),
            ]);
            setBatches(batchRes.data || []);
            setCourses(courseRes.data || []);
        } catch {
            toast.error('Failed to load batches.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleToggleActive = async (batch: Batch) => {
        try {
            await api.put(`/batches/${batch.batchId}`, { isActive: !batch.isActive });
            toast.success(`Batch ${batch.isActive ? 'deactivated' : 'activated'}!`);
            fetchData();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/batches/${deleteTarget.batchId}`);
            toast.success('Batch deleted.');
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete.');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = batches.filter(b => {
        const matchSearch = b.batchName.toLowerCase().includes(search.toLowerCase())
            || b.batchId.toLowerCase().includes(search.toLowerCase())
            || (b.courseId?.courseName || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || b.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: batches.length,
        upcoming: batches.filter(b => b.status === 'Upcoming').length,
        running: batches.filter(b => b.status === 'Running').length,
        completed: batches.filter(b => b.status === 'Completed').length,
    };

    const STATUS_TABS: Array<'All' | 'Upcoming' | 'Running' | 'Completed'> = ['All', 'Upcoming', 'Running', 'Completed'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                            <Layers size={18} className="text-white" />
                        </span>
                        Batches
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage training batches and schedules</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={() => { setEditBatch(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-200">
                        <Plus size={16} /> New Batch
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
                    { label: 'Upcoming', value: stats.upcoming, color: 'text-sky-600', bg: 'bg-sky-50' },
                    { label: 'Running', value: stats.running, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Completed', value: stats.completed, color: 'text-gray-500', bg: 'bg-gray-100' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search + Status filter tabs */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by batch, course or ID..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400 transition-all" />
                </div>
                <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                    {STATUS_TABS.map(tab => (
                        <button key={tab} onClick={() => setStatusFilter(tab)}
                            className={`flex-1 min-w-max px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${statusFilter === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Batch Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-sky-500" />
                        <p className="text-sm text-gray-400">Loading batches...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <Layers size={28} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-semibold">No batches found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or status filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(batch => (
                        <BatchCard
                            key={batch._id}
                            batch={batch}
                            onEdit={b => { setEditBatch(b); setShowModal(true); }}
                            onDelete={setDeleteTarget}
                            onToggleActive={handleToggleActive}
                        />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <BatchModal
                    batch={editBatch}
                    courses={courses}
                    onClose={() => { setShowModal(false); setEditBatch(null); }}
                    onSaved={fetchData}
                />
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={22} className="text-red-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Batch?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            <span className="font-semibold text-gray-800">"{deleteTarget.batchName}"</span> will be deactivated and hidden.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
