import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Users, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent, Student, StudentPayload } from '../../../api/admissionApi';
import { getEnquiries } from '../../../api/enquiryApi';

const INITIAL_FORM: StudentPayload = { fullName: '', mobile: '', email: '', city: '', qualification: '', sponsorType: 'Individual', companyName: '', enquiryId: '' };

export const StudentsPage = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Student | null>(null);
    const [form, setForm] = useState<StudentPayload>(INITIAL_FORM);
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getStudents({ page, search });
            setStudents(res.data.data.students);
            setTotal(res.data.data.pagination.total);
        } catch { toast.error('Failed to load students'); }
        finally { setIsLoading(false); }
    }, [page, search]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    useEffect(() => {
        getEnquiries({ status: 'New' }).then((res: any) => {
            setEnquiries(res.data.data || []);
        }).catch(() => { });
    }, []);

    const openCreate = () => { setEditTarget(null); setForm(INITIAL_FORM); setDrawerOpen(true); };
    const openEdit = (s: Student) => { setEditTarget(s); setForm({ fullName: s.fullName, mobile: s.mobile, email: s.email || '', city: s.city || '', qualification: s.qualification || '', sponsorType: s.sponsorType, companyName: s.companyName || '' }); setDrawerOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...form };
            if (!payload.enquiryId) delete payload.enquiryId;
            if (editTarget) { await updateStudent(editTarget._id, payload); toast.success('Student updated!'); }
            else { await createStudent(payload); toast.success('Student created!'); }
            setDrawerOpen(false);
            fetchStudents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Soft-delete this student?')) return;
        try { await deleteStudent(id); toast.success('Student deleted'); fetchStudents(); }
        catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="text-primary-600" /> Students</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all enrolled students — {total} total</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md transition-all">
                    <Plus size={18} /> Add Student
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or mobile..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white shadow-sm" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>{['Student ID', 'Name', 'Mobile', 'City', 'Qualification', 'Sponsor', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No students found</td></tr>
                            ) : students.map(s => (
                                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-primary-700 font-bold">{s.studentId}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{s.fullName}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.mobile}</td>
                                    <td className="px-4 py-3 text-gray-500">{s.city || '—'}</td>
                                    <td className="px-4 py-3 text-gray-500">{s.qualification || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.sponsorType === 'Company' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{s.sponsorType}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(s._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{editTarget ? 'Edit Student' : 'Add New Student'}</h2>
                            <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
                                {!editTarget && enquiries.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Link to Enquiry <span className="font-normal text-gray-400">(optional)</span></label>
                                        <select value={form.enquiryId} onChange={e => { const enq = enquiries.find(e2 => e2._id === e.target.value); setForm(f => ({ ...f, enquiryId: e.target.value, fullName: enq?.name || f.fullName, mobile: enq?.mobile || f.mobile, email: enq?.email || f.email, city: enq?.city || f.city })); }} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                                            <option value="">-- Select Enquiry (Auto-fill) --</option>
                                            {enquiries.map(e => <option key={e._id} value={e._id}>{e.name} — {e.mobile}</option>)}
                                        </select>
                                    </div>
                                )}
                                {[['fullName', 'Full Name', true], ['mobile', 'Mobile (10 digits)', true], ['email', 'Email', false], ['city', 'City', false], ['qualification', 'Qualification', false]].map(([field, label, req]) => (
                                    <div key={field as string}>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">{label as string} {req && <span className="text-red-500">*</span>}</label>
                                        <input required={!!req} value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Sponsor Type</label>
                                    <select value={form.sponsorType} onChange={e => setForm(f => ({ ...f, sponsorType: e.target.value as any }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                                        <option value="Individual">Individual</option>
                                        <option value="Company">Company</option>
                                    </select>
                                </div>
                                {form.sponsorType === 'Company' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Company Name</label>
                                        <input value={form.companyName || ''} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setDrawerOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" form="student-form" disabled={submitting} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white font-medium rounded-xl shadow-md transition-all">
                                {submitting ? 'Saving...' : editTarget ? 'Update Student' : 'Create Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
