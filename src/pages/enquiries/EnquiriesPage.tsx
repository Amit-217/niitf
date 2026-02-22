import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Plus, Search, Pencil, Trash2, X, Save,
    Loader2, ChevronDown, Phone, Mail, MapPin, BookOpen,
    RefreshCw, Filter, Calendar, User, ArrowUpDown, XCircle, ArrowRight, Clock
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
    nextFollowUpDate?: string | null;
    remarks?: Array<{ note: string; date: string; author?: string }>;
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

// ── Components ─────────────────────────────────────────────────────────────
const StatusTimeline: React.FC<{ status: string }> = ({ status }) => {
    const stages = ['New', 'Follow-up', 'Converted'];
    const currentIdx = stages.indexOf(status);
    return (
        <div className="flex items-center gap-1 my-3">
            {stages.map((s, i) => {
                const isActive = i <= currentIdx;
                const isCurrent = i === currentIdx;
                if (status === 'Not Interested' && i === 0) return <div key={s} className="flex items-center gap-1 text-gray-400"><XCircle size={14} className="text-red-400" /><span className="text-[10px] font-bold uppercase">Dropped</span></div>;
                if (status === 'Not Interested') return null;
                return (
                    <React.Fragment key={s}>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
                            <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>{s}</span>
                        </div>
                        {i < stages.length - 1 && <div className={`h-[2px] w-6 ${i < currentIdx ? 'bg-indigo-200' : 'bg-gray-100'}`} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

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
    const [nextFollowUpDate, setNextFollowUpDate] = useState(enquiry?.nextFollowUpDate ? enquiry.nextFollowUpDate.split('T')[0] : '');
    const [newRemark, setNewRemark] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = { name, mobile, source, status, nextFollowUpDate: nextFollowUpDate || null };
            if (email) payload.email = email;
            if (city) payload.city = city;
            if (!enquiry) payload.courseInterestedId = courseId;
            if (newRemark.trim()) payload.remark = newRemark.trim();
            if (enquiry) await api.put(`/enquiries/${enquiry.enquiryId}`, payload);
            else await api.post('/enquiries', payload);
            onSaved(); onClose();
        } catch (err: any) { toast.error('Failed to save.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className={`p-5 text-white flex justify-between rounded-t-2xl ${enquiry ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                    <h2 className="font-bold">{enquiry ? 'Edit Enquiry' : 'New Enquiry'}</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <input value={name} onChange={e => setName(e.target.value)} required placeholder="Full Name" className="p-2.5 border rounded-xl w-full" />
                        <input value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="Mobile" maxLength={10} className="p-2.5 border rounded-xl w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} className="p-2.5 border rounded-xl w-full text-xs" />
                        <select value={source} onChange={e => setSource(e.target.value as any)} className="p-2.5 border rounded-xl w-full text-xs">
                            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Remarks History</p>
                        <div className="bg-gray-50 p-3 rounded-xl border mb-2 max-h-24 overflow-y-auto">
                            {enquiry?.remarks?.length ? [...enquiry.remarks].reverse().map((r, i) => (
                                <div key={i} className="text-[10px] mb-2 border-b pb-1 last:border-0">
                                    <p className="text-gray-700">{r.note}</p>
                                    <p className="text-gray-400">{new Date(r.date).toLocaleDateString()}</p>
                                </div>
                            )) : <p className="text-gray-400 text-center text-xs">No remarks</p>}
                        </div>
                        <textarea value={newRemark} onChange={e => setNewRemark(e.target.value)} placeholder="Add note..." className="w-full p-3 border rounded-xl text-sm h-20" />
                    </div>
                    <div className="flex gap-2">
                        {STATUSES.map(s => (
                            <button key={s} type="button" onClick={() => setStatus(s)} className={`flex-1 py-2 text-[10px] font-bold border rounded-xl ${status === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400'}`}>{s}</button>
                        ))}
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">
                        {loading ? <Loader2 className="animate-spin inline" size={16} /> : <Save size={16} className="inline mr-2" />} Save
                    </button>
                </form>
            </div>
        </div>
    );
};

const EnquiryCard: React.FC<{ enquiry: Enquiry; onEdit: (e: Enquiry) => void; onDelete: (e: Enquiry) => void; onConvert: (e: Enquiry) => void; }> = ({ enquiry, onEdit, onDelete, onConvert }) => {
    const cfg = STATUS_CONFIG[enquiry.status];
    const isDue = enquiry.nextFollowUpDate && new Date(enquiry.nextFollowUpDate) <= new Date() && enquiry.status !== 'Converted';
    return (
        <div className={`bg-white rounded-2xl border p-4 space-y-3 shadow-sm ${isDue ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start">
                <div><h3 className="text-sm font-bold text-gray-900">{enquiry.name}</h3><p className="text-[10px] text-gray-400">{enquiry.mobile}</p></div>
                <div className="flex gap-1">
                    <button onClick={() => onEdit(enquiry)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(enquiry)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
            </div>
            <StatusTimeline status={enquiry.status} />
            <div className="flex items-center justify-between mt-4 border-t pt-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Followup: <span className={isDue ? 'text-amber-600' : 'text-gray-900'}>{enquiry.nextFollowUpDate ? new Date(enquiry.nextFollowUpDate).toLocaleDateString() : 'N/A'}</span></div>
                {enquiry.status !== 'Converted' && <button onClick={() => onConvert(enquiry)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1">Convert <ArrowRight size={12}/></button>}
            </div>
        </div>
    );
};

export const EnquiriesPage: React.FC = () => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dueFilter, setDueFilter] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editEnquiry, setEditEnquiry] = useState<Enquiry | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search, status: statusFilter, followUpDue: dueFilter ? 'true' : 'false' });
            const [eRes, cRes]: any[] = await Promise.all([api.get(`/enquiries?${params.toString()}`), api.get('/courses?limit=100')]);
            setEnquiries(eRes.data || []); setCourses(cRes.data || []);
        } catch { toast.error('Error loading.'); } finally { setLoading(false); }
    };

    useEffect(() => { const d = setTimeout(() => fetchData(), search ? 500 : 0); return () => clearTimeout(d); }, [search, statusFilter, dueFilter]);

    const handleConvert = (enq: Enquiry) => {
        sessionStorage.setItem('pendingAdmission', JSON.stringify({ studentName: enq.name, mobile: enq.mobile, courseId: enq.courseInterestedId?.courseId }));
        navigate('/admin/admissions');
    };

    const handleDelete = async () => {
        if (!deleteTarget) return; setDeleting(true);
        try { await api.delete(`/enquiries/${deleteTarget.enquiryId}`); toast.success('Deleted!'); setDeleteTarget(null); fetchData(); }
        catch { toast.error('Error.'); } finally { setDeleting(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="text-indigo-600" /> Enquiries</h1>
                <button onClick={() => { setEditEnquiry(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg"><Plus size={16} className="inline mr-1" /> New lead</button>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="w-full pl-9 p-2.5 border rounded-xl" />
                </div>
                <button onClick={() => setDueFilter(!dueFilter)} className={`px-4 py-2 border rounded-xl text-xs font-bold ${dueFilter ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-500'}`}><Clock size={14} className="inline mr-1" /> Due Only</button>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2.5 border rounded-xl text-xs font-bold">
                    <option value="All">All Status</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin inline" size={32} /></div> :
                enquiries.length === 0 ? <div className="py-20 text-center text-gray-500">No leads found</div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enquiries.map(e => <EnquiryCard key={e._id} enquiry={e} onEdit={enq => { setEditEnquiry(enq); setShowModal(true); }} onDelete={setDeleteTarget} onConvert={handleConvert} />)}
                </div>
            }
            {showModal && <EnquiryModal enquiry={editEnquiry} courses={courses} onClose={() => { setShowModal(false); setEditEnquiry(null); }} onSaved={fetchData} />}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
                        <Trash2 size={40} className="mx-auto text-red-600 mb-4" />
                        <h3 className="text-lg font-bold">Delete Lead?</h3>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border rounded-xl">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 text-white rounded-xl">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
