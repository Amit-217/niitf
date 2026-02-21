import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen, Plus, Search, Pencil, Trash2, X, Save,
    Loader2, CheckCircle2, XCircle, ChevronDown, IndianRupee,
    Clock, BarChart3, Filter, MoreVertical, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

interface Course {
    _id: string;
    courseId: string;
    courseName: string;
    level: string | null;
    duration: string | null;
    fees: number;
    isActive: boolean;
    createdAt: string;
}

const LEVELS = ['Basic', 'Intermediate', 'Advanced', 'Expert'];

const levelColors: Record<string, string> = {
    Basic: 'bg-sky-100 text-sky-700 border-sky-200',
    Intermediate: 'bg-violet-100 text-violet-700 border-violet-200',
    Advanced: 'bg-amber-100 text-amber-700 border-amber-200',
    Expert: 'bg-rose-100 text-rose-700 border-rose-200',
};

const levelGradients: Record<string, string> = {
    Basic: 'from-sky-400 to-blue-500',
    Intermediate: 'from-violet-500 to-purple-600',
    Advanced: 'from-amber-400 to-orange-500',
    Expert: 'from-rose-500 to-red-600',
};

// ── Modal ──────────────────────────────────────────────────────────────────
interface ModalProps {
    course?: Course | null;
    onClose: () => void;
    onSaved: () => void;
}

const CourseModal: React.FC<ModalProps> = ({ course, onClose, onSaved }) => {
    const [courseName, setCourseName] = useState(course?.courseName || '');
    const [level, setLevel] = useState(course?.level || '');
    const [duration, setDuration] = useState(course?.duration || '');
    const [fees, setFees] = useState(course ? String(course.fees) : '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                courseName,
                level: level || null,
                duration: duration || null,
                fees: fees ? Number(fees) : 0,
            };
            if (course) {
                await api.put(`/courses/${course.courseId}`, payload);
                toast.success('Course updated!');
            } else {
                await api.post('/courses', payload);
                toast.success('Course created!');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save course.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className={`rounded-t-2xl p-6 bg-gradient-to-r ${course ? 'from-violet-500 to-purple-600' : 'from-sky-500 to-blue-600'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <BookOpen size={18} className="text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">
                                {course ? 'Edit Course' : 'New Course'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Course Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Course Name *</label>
                        <input value={courseName} onChange={e => setCourseName(e.target.value)} required placeholder="e.g. NDT Level II"
                            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 hover:border-gray-300 transition-all" />
                    </div>

                    {/* Level */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Level</label>
                        <div className="relative">
                            <select value={level} onChange={e => setLevel(e.target.value)}
                                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 appearance-none cursor-pointer transition-all">
                                <option value="">Select level...</option>
                                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Duration + Fees */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
                            <div className="relative">
                                <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 months"
                                    className="w-full px-4 py-3 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all" />
                                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fees (₹)</label>
                            <div className="relative">
                                <input type="number" value={fees} onChange={e => setFees(e.target.value)} placeholder="0" min="0"
                                    className="w-full px-4 py-3 pl-9 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all" />
                                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {course ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Course Card ───────────────────────────────────────────────────────────
interface CardProps {
    course: Course;
    onEdit: (c: Course) => void;
    onDelete: (c: Course) => void;
    onToggleActive: (c: Course) => void;
}

const CourseCard: React.FC<CardProps> = ({ course, onEdit, onDelete, onToggleActive }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const gradient = course.level ? levelGradients[course.level] : 'from-gray-400 to-gray-500';
    const levelColor = course.level ? levelColors[course.level] : 'bg-gray-100 text-gray-500 border-gray-200';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group ${!course.isActive ? 'opacity-60' : ''}`}>
            {/* Top accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

            <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <BookOpen size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">{course.courseName}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{course.courseId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Active badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${course.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {course.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {/* Menu */}
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setMenuOpen(!menuOpen)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical size={15} />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 top-8 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                                    <button onClick={() => { onEdit(course); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <Pencil size={13} /> Edit
                                    </button>
                                    <button onClick={() => { onToggleActive(course); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        {course.isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                                        {course.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <div className="border-t border-gray-100 my-1" />
                                    <button onClick={() => { onDelete(course); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Level badge */}
                {course.level && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-3 ${levelColor}`}>
                        <BarChart3 size={10} /> {course.level}
                    </span>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Clock size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium">Duration</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 truncate">{course.duration || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <IndianRupee size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium">Fees</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                            {course.fees > 0 ? `₹${course.fees.toLocaleString('en-IN')}` : 'Free'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────────────────────
export const CoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res: any = await api.get('/courses');
            setCourses(res.data || []);
        } catch {
            toast.error('Failed to load courses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    const handleToggleActive = async (course: Course) => {
        try {
            await api.put(`/courses/${course.courseId}`, { isActive: !course.isActive });
            toast.success(`Course ${course.isActive ? 'deactivated' : 'activated'}!`);
            fetchCourses();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/courses/${deleteTarget.courseId}`);
            toast.success('Course deleted.');
            setDeleteTarget(null);
            fetchCourses();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete.');
        } finally {
            setDeleting(false);
        }
    };

    // Filtered list
    const filtered = courses.filter(c => {
        const matchSearch = c.courseName.toLowerCase().includes(search.toLowerCase()) || c.courseId.toLowerCase().includes(search.toLowerCase());
        const matchLevel = levelFilter === 'All' || c.level === levelFilter;
        const matchStatus = statusFilter === 'All' || (statusFilter === 'Active' ? c.isActive : !c.isActive);
        return matchSearch && matchLevel && matchStatus;
    });

    const stats = {
        total: courses.length,
        active: courses.filter(c => c.isActive).length,
        free: courses.filter(c => c.fees === 0).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <BookOpen size={18} className="text-white" />
                        </span>
                        Courses
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage NDT training courses</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchCourses} className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={() => { setEditCourse(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200">
                        <Plus size={16} /> New Course
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Active', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Free', value: stats.free, color: 'text-sky-600', bg: 'bg-sky-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all" />
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
                            className="w-full pl-8 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/25">
                            <option value="All">All Levels</option>
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="w-full pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/25">
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-violet-500" />
                        <p className="text-sm text-gray-400">Loading courses...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <BookOpen size={28} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-semibold">No courses found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(course => (
                        <CourseCard
                            key={course._id}
                            course={course}
                            onEdit={c => { setEditCourse(c); setShowModal(true); }}
                            onDelete={setDeleteTarget}
                            onToggleActive={handleToggleActive}
                        />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <CourseModal
                    course={editCourse}
                    onClose={() => { setShowModal(false); setEditCourse(null); }}
                    onSaved={fetchCourses}
                />
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={22} className="text-red-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Course?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            <span className="font-semibold text-gray-800">"{deleteTarget.courseName}"</span> will be deactivated and hidden.
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
