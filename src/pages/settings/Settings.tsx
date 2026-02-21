import React, { useState, useEffect } from 'react';
import {
    User, Lock, Save, Loader2, Mail, Hash, Shield, Crown,
    Phone, Eye, EyeOff, CheckCircle2, AlertCircle, Settings2
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

type Tab = 'profile' | 'security';
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

const ROLE_CONFIG: Record<Role, { label: string; gradient: string; icon: React.ElementType }> = {
    SUPER_ADMIN: { label: 'Super Admin', gradient: 'from-amber-400 to-orange-500', icon: Crown },
    ADMIN: { label: 'Admin', gradient: 'from-violet-500 to-purple-600', icon: Shield },
    EMPLOYEE: { label: 'Employee', gradient: 'from-sky-500 to-blue-600', icon: User },
};

const avatarGradients: Record<string, string> = {
    SUPER_ADMIN: 'from-amber-400 to-orange-500',
    ADMIN: 'from-violet-500 to-purple-600',
    EMPLOYEE: 'from-sky-500 to-blue-600',
};

const FormInput: React.FC<{
    label: string; type?: string; value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string; disabled?: boolean; maxLength?: number;
    required?: boolean; suffix?: React.ReactNode; hint?: string;
}> = ({ label, type = 'text', value, onChange, placeholder, disabled, maxLength, required, suffix, hint }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
        <div className="relative">
            <input type={type} value={value} onChange={onChange} placeholder={placeholder}
                disabled={disabled} maxLength={maxLength} required={required}
                className={`w-full px-4 py-3 text-sm rounded-xl border transition-all ${disabled
                    ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-800 border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 hover:border-gray-300'
                    } ${suffix ? 'pr-11' : ''}`} />
            {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</div>}
        </div>
        {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
);

function getStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-400' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
}

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileFetching, setProfileFetching] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setName(parsedUser.name || '');
            if (!parsedUser.id) { setProfileFetching(false); return; }
            setProfileFetching(true);
            api.get(`/users/${parsedUser.id}`)
                .then((res: any) => {
                    if (cancelled) return;
                    setName(res.data?.name || parsedUser.name);
                    setMobile(res.data?.mobile || '');
                })
                .catch(() => { if (!cancelled) setName(parsedUser.name || ''); })
                .finally(() => { if (!cancelled) setProfileFetching(false); });
        } else { setProfileFetching(false); }
        return () => { cancelled = true; };
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsProfileLoading(true);
        try {
            const res: any = await api.put(`/users/${user.id}`, { name, mobile });
            const updatedUser = { ...user, name: res.data?.name || name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile.');
        } finally { setIsProfileLoading(false); }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match!'); return; }
        setIsPasswordLoading(true);
        try {
            await api.put('/users/change-password', { currentPassword, newPassword, confirmPassword });
            toast.success('Password changed! Please log in again.');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password.');
        } finally { setIsPasswordLoading(false); }
    };

    const role: Role = user?.role || 'EMPLOYEE';
    const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.EMPLOYEE;
    const RoleIcon = roleCfg.icon;
    const strength = getStrength(newPassword);
    const passwordMatch = confirmPassword && newPassword === confirmPassword;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Settings2 size={18} className="text-white" />
                    </span>
                    Account Settings
                </h1>
                <p className="text-gray-500 text-sm mt-1">Manage your profile and security preferences.</p>
            </div>

            {/* Profile Hero Card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className={`relative h-24 bg-gradient-to-r ${avatarGradients[role] || 'from-violet-500 to-purple-600'}`}>
                    <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${avatarGradients[role]} flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-xl border-4 border-white z-10`}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                </div>
                <div className="px-4 sm:px-6 pb-5">
                    <div className="h-10 sm:h-12" />
                    <div className="mb-4 text-center sm:text-left">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{user?.name || '—'}</h2>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 mt-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${roleCfg.gradient} shadow-sm`}>
                            <RoleIcon size={11} /> {roleCfg.label}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {[
                            { icon: Hash, label: 'Employee ID', value: user?.empId || '—' },
                            { icon: Mail, label: 'Email', value: user?.email || '—' },
                            { icon: Phone, label: 'Mobile', value: mobile || '—' },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <Icon size={14} className="text-gray-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                                        <p className="text-sm font-semibold text-gray-700 truncate">{item.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tabs + Forms */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Tab Bar */}
                <div className="flex border-b border-gray-100 bg-gray-50/60">
                    {([
                        { key: 'profile', label: 'Profile', icon: User },
                        { key: 'security', label: 'Security', icon: Lock },
                    ] as { key: Tab; label: string; icon: React.ElementType }[]).map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 ${isActive
                                    ? 'border-violet-600 text-violet-700 bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                <Icon size={16} />{tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 md:p-8">
                    {/* ── Profile Tab ── */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleUpdateProfile} className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">Personal Information</h3>
                                <p className="text-xs text-gray-400">Update your name and phone number. Email and ID cannot be changed.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Employee ID" value={user?.empId || ''} disabled hint="Cannot be changed" />
                                    <FormInput label="Role" value={roleCfg.label} disabled />
                                </div>
                                <FormInput label="Email Address" type="email" value={user?.email || ''} disabled hint="Contact admin to change your email" />
                                <div className="pt-2 border-t border-gray-100 space-y-4">
                                    <FormInput label="Full Name *" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
                                    <FormInput label="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                                </div>
                            </div>
                            <div className="flex justify-center pt-2">
                                <button type="submit" disabled={isProfileLoading || profileFetching}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60">
                                    {isProfileLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Security Tab ── */}
                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">Change Password</h3>
                                <p className="text-xs text-gray-400">After a successful update, you'll be logged out of all sessions.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Password *</label>
                                    <div className="relative">
                                        <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="••••••••"
                                            className="w-full px-4 py-3 pr-11 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 hover:border-gray-300 transition-all" />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-100 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Password *</label>
                                        <div className="relative">
                                            <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters"
                                                className="w-full px-4 py-3 pr-11 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 hover:border-gray-300 transition-all" />
                                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {newPassword && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                                                </div>
                                                <span className={`text-xs font-semibold ${strength.score <= 1 ? 'text-red-500' : strength.score <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>{strength.label}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password *</label>
                                        <div className="relative">
                                            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Repeat your new password"
                                                className={`w-full px-4 py-3 pr-11 text-sm rounded-xl border transition-all ${confirmPassword ? passwordMatch ? 'border-emerald-400 bg-emerald-50/30' : 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-gray-300 focus:border-violet-400'} bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/25`} />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {confirmPassword && (
                                            <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${passwordMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {passwordMatch ? <><CheckCircle2 size={12} /> Passwords match</> : <><AlertCircle size={12} /> Passwords do not match</>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center pt-2">
                                <button type="submit" disabled={isPasswordLoading || !currentPassword || !newPassword || !confirmPassword || !passwordMatch}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-sm font-semibold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-300 disabled:opacity-50">
                                    {isPasswordLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
