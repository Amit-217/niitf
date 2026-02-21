import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Plus, Search, Pencil, Trash2, X, Save,
    Loader2, ChevronDown, Phone, Mail, MapPin, BookOpen,
    RefreshCw, Filter, Calendar, User, ArrowUpDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

// ── Types ──────────────────────────────────────────────────────────────────
interface Course { _id: string; courseId: string; courseName: string; }

interface Enquiry {
    _id: string;
    enquiryId: string;
    name: string;
    mobile: string;
    email: string | null;
    city: string | null;
    courseInterestedId: { _id: string; courseId: string; courseName: string } | null;
    enquiryDate: string;
    source: 'Walk-in' | 'Call' | 'Website' | 'Reference';
    status: 'New' | 'Follow-up' | 'Converted' | 'Not Interested';
    isDeleted: boolean;
    createdAt: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    'New': { color: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
    'Follow-up': { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    'Converted': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    'Not Interested': { color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
};

const SOURCE_CONFIG: Record<string, string> = {
    'Walk-in': 'bg-violet-100 text-violet-700',
    'Call': 'bg-blue-100 text-blue-700',
    'Website': 'bg-teal-100 text-teal-700',
    'Reference': 'bg-orange-100 text-orange-700',
};

const SOURCES = ['Walk-in', 'Call', 'Website', 'Reference'] as const;
const STATUSES = ['New', 'Follow-up', 'Converted', 'Not Interested'] as const;

// ── Modal ──────────────────────────────────────────────────────────────────
interface ModalProps {
    enquiry?: Enquiry | null;
    courses: Course[];
    onClose: () => void;
    onSaved: () => void;
}

const EnquiryModal: React.FC<ModalProps> = ({ enquiry, courses, onClose, onSaved }) => {
    const [name, setName] = useState(enquiry?.name || '');
    const [mobile, setMobile] = useState(enquiry?.mobile || '');
    const [email, setEmail] = useState(enquiry?.email || '');
    const [city, setCity] = useState(enquiry?.city || '');
    const [courseId, setCourseId] = useState(enquiry?.courseInterestedId?.courseId || '');
    const [source, setSource] = useState<typeof SOURCES[number]>(enquiry?.source || 'Walk-in');
    const [status, setStatus] = useState<typeof STATUSES[number]>(enquiry?.status || 'New');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = { name, mobile, source, status };
            if (email) payload.email = email;
            if (city) payload.city = city;
            if (!enquiry) payload.courseInterestedId = courseId;

            if (enquiry) {
                await api.put(`/enquiries/${enquiry.enquiryId}`, payload);
                toast.success('Enquiry updated!');
            } else {
                await api.post('/enquiries', payload);
                toast.success('Enquiry created!');
            }
            onSaved(); onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save enquiry.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className={`sticky top-0 rounded-t-2xl p-5 bg-gradient-to-r ${enquiry ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-violet-600'} z-10`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <MessageSquare size={18} className="text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">{enquiry ? 'Edit Enquiry' : 'New Enquiry'}</h2>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Name + Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                            <div className="relative">
                                <input value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe"
                                    className="w-full px-4 py-2.5 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all" />
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mobile *</label>
                            <div className="relative">
                                <input value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="9876543210" maxLength={10}
                                    className="w-full px-4 py-2.5 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all" />
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Email + City */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                            <div className="relative">
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@email.com"
                                    className="w-full px-4 py-2.5 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all" />
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                            <div className="relative">
                                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai"
                                    className="w-full px-4 py-2.5 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all" />
                                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Course (create only) */}
                    {!enquiry && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Course Interested *</label>
                            <div className="relative">
                                <select value={courseId} onChange={e => setCourseId(e.target.value)} required
                                    className="w-full px-4 py-2.5 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 appearance-none cursor-pointer transition-all">
                                    <option value="">Select a course...</option>
                                    {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseName}</option>)}
                                </select>
                                <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Source */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Source</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SOURCES.map(s => (
                                <button key={s} type="button" onClick={() => setSource(s)}
                                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${source === s ? `${SOURCE_CONFIG[s]} border-current shadow-sm` : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUSES.map(s => {
                                const cfg = STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${status === s ? `${cfg.color} border-current shadow-sm` : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-60">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {enquiry ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Enquiry Card (Mobile) ──────────────────────────────────────────────────
const EnquiryCard: React.FC<{
    enquiry: Enquiry;
    onEdit: (e: Enquiry) => void;
    onDelete: (e: Enquiry) => void;
    onStatusChange: (e: Enquiry, status: typeof STATUSES[number]) => void;
}> = ({ enquiry, onEdit, onDelete, onStatusChange }) => {
    const cfg = STATUS_CONFIG[enquiry.status];
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{enquiry.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{enquiry.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{enquiry.enquiryId}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onEdit(enquiry)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(enquiry)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600"><Phone size={11} className="text-gray-400" />{enquiry.mobile}</div>
                {enquiry.email && <div className="flex items-center gap-1.5 text-gray-600 truncate"><Mail size={11} className="text-gray-400 flex-shrink-0" /><span className="truncate">{enquiry.email}</span></div>}
                {enquiry.city && <div className="flex items-center gap-1.5 text-gray-600"><MapPin size={11} className="text-gray-400" />{enquiry.city}</div>}
                <div className="flex items-center gap-1.5 text-gray-600"><Calendar size={11} className="text-gray-400" />{fmt(enquiry.enquiryDate)}</div>
            </div>

            {enquiry.courseInterestedId && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 rounded-lg border border-violet-100 w-fit max-w-full">
                    <BookOpen size={11} className="text-violet-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-violet-700 truncate">{enquiry.courseInterestedId.courseName}</span>
                </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SOURCE_CONFIG[enquiry.source]}`}>{enquiry.source}</span>
                <div className="flex gap-1 ml-auto">
                    {STATUSES.filter(s => s !== enquiry.status).slice(0, 2).map(s => (
                        <button key={s} onClick={() => onStatusChange(enquiry, s)}
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CONFIG[s].color} opacity-60 hover:opacity-100 transition-opacity`}>{s}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────────────────────
export const EnquiriesPage: React.FC = () => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sourceFilter, setSourceFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editEnquiry, setEditEnquiry] = useState<Enquiry | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [enqRes, courseRes]: any[] = await Promise.allSettled([
                api.get('/enquiries'),
                api.get('/courses'),
            ]);
            if (enqRes.status === 'fulfilled') setEnquiries(enqRes.value.data || []);
            else toast.error('Failed to load enquiries.');
            if (courseRes.status === 'fulfilled') setCourses(courseRes.value.data || []);
            else toast.error('Failed to load courses.');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleStatusChange = async (enquiry: Enquiry, status: typeof STATUSES[number]) => {
        try {
            await api.put(`/enquiries/${enquiry.enquiryId}`, { status });
            toast.success(`Status updated to "${status}"`);
            fetchData();
        } catch { toast.error('Failed to update status.'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/enquiries/${deleteTarget.enquiryId}`);
            toast.success('Enquiry deleted.');
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete.');
        } finally { setDeleting(false); }
    };

    const filtered = enquiries.filter(e => {
        const q = search.toLowerCase();
        const matchSearch = e.name.toLowerCase().includes(q) || e.mobile.includes(q)
            || (e.email || '').toLowerCase().includes(q) || e.enquiryId.toLowerCase().includes(q)
            || (e.city || '').toLowerCase().includes(q);
        const matchStatus = statusFilter === 'All' || e.status === statusFilter;
        const matchSource = sourceFilter === 'All' || e.source === sourceFilter;
        return matchSearch && matchStatus && matchSource;
    });

    const stats = {
        total: enquiries.length,
        new: enquiries.filter(e => e.status === 'New').length,
        followUp: enquiries.filter(e => e.status === 'Follow-up').length,
        converted: enquiries.filter(e => e.status === 'Converted').length,
    };

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <MessageSquare size={17} className="text-white" />
                        </span>
                        Enquiries
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track and manage student enquiries</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><RefreshCw size={16} /></button>
                    <button onClick={() => { setEditEnquiry(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200">
                        <Plus size={16} /> New Enquiry
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
                    { label: 'New', value: stats.new, color: 'text-sky-600', bg: 'bg-sky-50' },
                    { label: 'Follow-up', value: stats.followUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Converted', value: stats.converted, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, mobile, city or ID..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all" />
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="w-full pl-8 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/25">
                            <option value="All">All Status</option>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                            className="w-full pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/25">
                            <option value="All">All Sources</option>
                            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <p className="text-sm text-gray-400">Loading enquiries...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare size={28} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-semibold">No enquiries found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <>
                    {/* ── Mobile Cards ─────────────────────────────────────── */}
                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                        {filtered.map(e => (
                            <EnquiryCard key={e._id} enquiry={e}
                                onEdit={enq => { setEditEnquiry(enq); setShowModal(true); }}
                                onDelete={setDeleteTarget}
                                onStatusChange={handleStatusChange} />
                        ))}
                    </div>

                    {/* ── Desktop Table ─────────────────────────────────────── */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        {['Name / Contact', 'Course', 'Source', 'Date', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                <span className="flex items-center gap-1">{h} {h === 'Date' && <ArrowUpDown size={11} />}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(e => {
                                        const cfg = STATUS_CONFIG[e.status];
                                        return (
                                            <tr key={e._id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-gray-900">{e.name}</div>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{e.mobile}</span>
                                                        {e.city && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{e.city}</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-300 mt-0.5">{e.enquiryId}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {e.courseInterestedId
                                                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-1 rounded-lg border border-violet-100">
                                                            <BookOpen size={10} />{e.courseInterestedId.courseName}
                                                        </span>
                                                        : <span className="text-gray-300 text-xs">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SOURCE_CONFIG[e.source]}`}>{e.source}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmt(e.enquiryDate)}</td>
                                                <td className="px-4 py-3.5">
                                                    <select value={e.status}
                                                        onChange={ev => handleStatusChange(e, ev.target.value as typeof STATUSES[number])}
                                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer appearance-none ${cfg.color} focus:outline-none`}>
                                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditEnquiry(e); setShowModal(true); }}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                                                        <button onClick={() => setDeleteTarget(e)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                            Showing {filtered.length} of {enquiries.length} enquiries
                        </div>
                    </div>
                </>
            )}

            {/* Modal */}
            {showModal && <EnquiryModal enquiry={editEnquiry} courses={courses} onClose={() => { setShowModal(false); setEditEnquiry(null); }} onSaved={fetchData} />}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
                        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Enquiry?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Enquiry from <span className="font-semibold text-gray-800">"{deleteTarget.name}"</span> will be removed.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60">
                                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
