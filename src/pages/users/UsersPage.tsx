import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Plus, Search, Edit2, Trash2, ShieldOff,
    ShieldCheck, X, Loader2, Eye, EyeOff, UserCheck,
    AlertTriangle, Crown, Shield, User,
    Mail, Phone
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { StaffProfileDrawer } from '../../components/StaffProfileDrawer';
import { Pagination } from '../../components/Pagination';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

interface UserType {
    _id: string;
    empId: string;
    name: string;
    email: string;
    mobile: string;
    role: Role;
    isActive: boolean;
    createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Crown },
    ADMIN: { label: 'Admin', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: Shield },
    EMPLOYEE: { label: 'Employee', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', icon: User },
};

const avatarGradients = [
    'from-violet-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-700',
];

function getGradient(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
    const cfg = ROLE_CONFIG[role];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
            <Icon size={11} /> {cfg.label}
        </span>
    );
};

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
        }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {isActive ? 'Active' : 'Inactive'}
    </span>
);

const SkeletonRow = () => (
    <tr className="animate-pulse">
        {[...Array(6)].map((_, i) => (
            <td key={i} className="px-4 py-4">
                <div className="h-4 bg-gray-100 rounded-full" style={{ width: `${60 + Math.random() * 30}%` }} />
            </td>
        ))}
    </tr>
);

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
interface UserModalProps {
    mode: 'create' | 'edit';
    editUser?: UserType | null;
    currentUserRole: Role;
    onClose: () => void;
    onSuccess: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ mode, editUser, currentUserRole, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: editUser?.name || '',
        mobile: editUser?.mobile || '',
        email: editUser?.email || '',
        password: '',
        role: (editUser?.role || 'EMPLOYEE') as Role,
        isActive: editUser?.isActive ?? true,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'create') {
                await api.post('/users/create', form);
                toast.success('User created successfully! Welcome email sent.');
            } else {
                const payload: any = { name: form.name, mobile: form.mobile };
                if (currentUserRole !== 'EMPLOYEE') { payload.role = form.role; payload.isActive = form.isActive; }
                await api.put(`/users/${editUser!._id}`, payload);
                toast.success('User updated successfully!');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
    const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl lg:max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">{mode === 'create' ? 'Add New User' : 'Edit User'}</h2>
                            <p className="text-violet-100/90 text-sm mt-1 max-w-2xl">{mode === 'create' ? 'Fill in details — a welcome email will be sent.' : 'Update user information below.'}</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"><X size={20} /></button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Full Name *</label>
                            <input className={`${inputClass} py-3`} type="text" placeholder="e.g. Rahul Sharma" value={form.name} onChange={set('name')} required />
                        </div>
                        <div>
                            <label className={labelClass}>Mobile *</label>
                            <input className={`${inputClass} py-3`} type="text" placeholder="9876543210" value={form.mobile} onChange={set('mobile')} maxLength={10} required={mode === 'create'} />
                        </div>
                        <div>
                            <label className={labelClass}>Role</label>
                            <select className={`${inputClass} py-3`} value={form.role} onChange={set('role')} disabled={currentUserRole === 'EMPLOYEE'}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN">Admin</option>
                                {currentUserRole === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                            </select>
                        </div>
                        {mode === 'create' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Email Address *</label>
                                    <input className={`${inputClass} py-3`} type="email" placeholder="user@niitsoft.com" value={form.email} onChange={set('email')} required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Password *</label>
                                    <div className="relative">
                                        <input className={`${inputClass} py-3 pr-10`} type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                            </>
                        )}
                        {mode === 'edit' && currentUserRole !== 'EMPLOYEE' && (
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" className="sr-only" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                    <span className="text-sm font-medium text-gray-700">Account {form.isActive ? 'Active' : 'Deactivated'}</span>
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all">Discard</button>
                        <button type="submit" disabled={loading} className="flex-[2] py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-100 disabled:opacity-70">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {mode === 'create' ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────
interface DeleteConfirmProps {
    user: UserType;
    type: 'soft' | 'hard';
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

const DeleteConfirm: React.FC<DeleteConfirmProps> = ({ user, type, onClose, onConfirm, loading }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${type === 'hard' ? 'bg-red-100' : 'bg-amber-100'}`}>
                <AlertTriangle size={28} className={type === 'hard' ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">{type === 'hard' ? 'Permanently Delete User' : 'Deactivate User'}</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
                {type === 'hard'
                    ? <>This will <strong className="text-red-600">permanently remove</strong> <span className="font-semibold text-gray-700">{user.name}</span> and all their data.</>
                    : <>This will deactivate <span className="font-semibold text-gray-700">{user.name}</span>'s account.</>}
            </p>
            <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${type === 'hard' ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200' : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200'}`}>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                    {type === 'hard' ? 'Delete Forever' : 'Deactivate'}
                </button>
            </div>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [modal, setModal] = useState<{ type: 'create' | 'edit'; user?: UserType } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ user: UserType; type: 'soft' | 'hard' } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserRole: Role = storedUser.role || 'EMPLOYEE';

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await api.get('/users?limit=1000');
            setUsers(res.data || []);
        } catch {
            toast.error('Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.empId.toLowerCase().includes(q);
        const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive);
        return matchSearch && matchRole && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const safePage = Math.min(page, totalPages);
    const paginatedUsers = filtered.slice((safePage - 1) * limit, safePage * limit);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            if (deleteTarget.type === 'hard') {
                await api.delete(`/users/${deleteTarget.user._id}/permanent`);
                toast.success('User permanently deleted.');
            } else {
                await api.delete(`/users/${deleteTarget.user._id}`);
                toast.success('User deactivated successfully.');
            }
            fetchUsers();
            setDeleteTarget(null);
        } catch (err: any) {
            toast.error(err.message || 'Action failed.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleActivate = async (user: UserType) => {
        try {
            await api.put(`/users/${user._id}`, { isActive: true });
            toast.success(`${user.name} has been activated.`);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to activate user.');
        }
    };

    const totalActive = users.filter(u => u.isActive).length;
    const totalAdmins = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
    const totalEmployees = users.filter(u => u.role === 'EMPLOYEE').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Users size={18} className="text-white" />
                        </span>
                        User Management
                    </h1>
                    <p className="hidden sm:block text-gray-500 text-sm mt-1">Manage all system users, roles, and access.</p>
                </div>
                <button onClick={() => setModal({ type: 'create' })} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200">
                    <Plus size={17} /> Add New User
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: users.length, icon: Users, gradient: 'from-violet-500 to-purple-600' },
                    { label: 'Active', value: totalActive, icon: UserCheck, gradient: 'from-emerald-500 to-teal-600' },
                    { label: 'Admins', value: totalAdmins, icon: Shield, gradient: 'from-amber-500 to-orange-500' },
                    { label: 'Employees', value: totalEmployees, icon: User, gradient: 'from-sky-500 to-blue-600' },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm`}>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-lg font-bold text-gray-900">{loading ? '—' : stat.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 outline-none focus:bg-white transition-all" placeholder="Search by name, email or ID…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <select className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
                        <option value="ALL">All Roles</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="EMPLOYEE">Employee</option>
                    </select>
                    <select className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
                {loading && users.length === 0 ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-50 rounded-2xl animate-pulse" />)
                ) : (
                    paginatedUsers.map(user => (
                        <div key={user._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradient(user.name)} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 leading-tight">{user.name}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{user.empId}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <RoleBadge role={user.role} />
                                    <StatusBadge isActive={user.isActive} />
                                </div>
                            </div>
                            <div className="py-3 border-y border-gray-50 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600"><Mail size={14} className="text-gray-400" /> {user.email}</div>
                                {user.mobile && <div className="flex items-center gap-2 text-xs text-gray-600"><Phone size={14} className="text-gray-400" /> {user.mobile}</div>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedStaffId(user._id)} className="flex-1 py-2.5 bg-violet-50 text-violet-700 rounded-xl font-bold text-[10px] uppercase border border-violet-100">Intelligence</button>
                                <div className="flex gap-1">
                                    <button onClick={() => setModal({ type: 'edit', user })} className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-violet-600"><Edit2 size={18} /></button>
                                    <button onClick={() => user.isActive ? setDeleteTarget({ user, type: 'soft' }) : handleActivate(user)} className={`p-2.5 rounded-xl border border-gray-100 ${user.isActive ? 'text-amber-500' : 'text-emerald-500'}`}>{user.isActive ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}</button>
                                    {currentUserRole === 'SUPER_ADMIN' && <button onClick={() => setDeleteTarget({ user, type: 'hard' })} className="p-2.5 rounded-xl border border-gray-100 text-red-500"><Trash2 size={18} /></button>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500">
                                <th className="text-left px-4 py-4 font-bold uppercase tracking-wider text-[10px]">User</th>
                                <th className="text-left px-4 py-4 font-bold uppercase tracking-wider text-[10px]">Contact</th>
                                <th className="text-left px-4 py-4 font-bold uppercase tracking-wider text-[10px]">Role</th>
                                <th className="text-left px-4 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                <th className="text-left px-4 py-4 font-bold uppercase tracking-wider text-[10px]">Joined</th>
                                <th className="text-right px-4 py-4 font-bold uppercase tracking-wider text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && users.length === 0 ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />) : paginatedUsers.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(user.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>{user.name.charAt(0).toUpperCase()}</div>
                                            <div><p className="font-bold text-gray-800">{user.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.empId}</p></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-gray-600 text-xs flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {user.email}</div>
                                        {user.mobile && <div className="text-gray-400 text-[11px] flex items-center gap-1.5 mt-0.5"><Phone size={12} className="text-gray-400" /> {user.mobile}</div>}
                                    </td>
                                    <td className="px-4 py-4"><RoleBadge role={user.role} /></td>
                                    <td className="px-4 py-4"><StatusBadge isActive={user.isActive} /></td>
                                    <td className="px-4 py-4 text-xs font-medium text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setSelectedStaffId(user._id)} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg font-bold text-[10px] border border-primary-100 hover:bg-primary-600 hover:text-white transition-all uppercase tracking-wider">Intelligence</button>
                                            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setModal({ type: 'edit', user })} className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600" title="Edit"><Edit2 size={16} /></button>
                                                {user.isActive ? <button onClick={() => setDeleteTarget({ user, type: 'soft' })} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500" title="Deactivate"><ShieldOff size={16} /></button> : <button onClick={() => handleActivate(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500" title="Activate"><ShieldCheck size={16} /></button>}
                                                {currentUserRole === 'SUPER_ADMIN' && <button onClick={() => setDeleteTarget({ user, type: 'hard' })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500" title="Delete Permanent"><Trash2 size={16} /></button>}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination page={safePage} totalPages={totalPages} total={filtered.length} limit={limit} onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }} />

            {selectedStaffId && <StaffProfileDrawer employeeId={selectedStaffId} onClose={() => setSelectedStaffId(null)} />}
            {modal && <UserModal mode={modal.type} editUser={modal.user} currentUserRole={currentUserRole} onClose={() => setModal(null)} onSuccess={fetchUsers} />}
            {deleteTarget && <DeleteConfirm user={deleteTarget.user} type={deleteTarget.type} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} />}
        </div>
    );
};
