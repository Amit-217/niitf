import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Clock, CheckCircle2, XCircle, Save } from 'lucide-react';
import { markOvertime, getEmployeeMonthlyOvertime } from '../../../api/payrollApi';
import api from '../../../api/axios';

interface User {
    _id: string;
    name: string;
    empId: string;
    role: string;
}

interface OvertimeRecord {
    _id: string;
    employeeId: User;
    date: string;
    units: number;
    status?: 'APPROVED' | 'REJECTED' | 'PENDING';
}

export const OvertimePage = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [units, setUnits] = useState<number>(0);
    const [recentOvertimes, setRecentOvertimes] = useState<OvertimeRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchRecentOvertimes();
        } else {
            setRecentOvertimes([]);
        }
    }, [selectedUser, date]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users?role=EMPLOYEE&limit=100');
            setUsers(res.data || []);
        } catch (error) {
            toast.error('Failed to load employees');
        }
    };

    const fetchRecentOvertimes = async () => {
        if (!selectedUser) return;
        try {
            const month = date.substring(0, 7);
            const res = await getEmployeeMonthlyOvertime(selectedUser, month);
            setRecentOvertimes(res.data || []);
        } catch (error) {
            toast.error('Failed to load overtime records');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || units <= 0) {
            toast.error('Please select an employee and valid units');
            return;
        }

        setLoading(true);
        try {
            await markOvertime({
                employeeId: selectedUser,
                date: date,
                units: units
            });
            toast.success('Overtime recorded successfully');
            setUnits(0);
            fetchRecentOvertimes();
        } catch (error) {
            toast.error('Failed to save overtime');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReject = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await api.patch(`/admin/overtime/${id}/approve`, { status });
            toast.success(`Overtime ${status.toLowerCase()}!`);
            fetchRecentOvertimes();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Overtime Management</h1>
                <p className="text-sm text-gray-500 mt-1">Record and manage employee overtime hours</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Employee</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-gray-700"
                        >
                            <option value="">Select Employee</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.empId})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-gray-700"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase">Overtime Units</label>
                        <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={units || ''}
                            onChange={(e) => setUnits(parseFloat(e.target.value))}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-gray-700"
                            placeholder="e.g. 2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-70"
                    >
                        <Save size={18} /> {loading ? 'Saving...' : 'Record'}
                    </button>
                </form>
            </div>

            {recentOvertimes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Clock className="text-gray-400" size={18} />
                        <h3 className="font-black text-gray-700 uppercase tracking-widest text-xs">Monthly Records</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/30 text-gray-400">
                            <tr>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase">Date</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase">Units</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase text-center">Status</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentOvertimes.map((ot: any) => (
                                <tr key={ot._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-700">{new Date(ot.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 font-black text-primary-600">+{ot.units}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${getStatusStyle(ot.status || 'PENDING')}`}>
                                            {ot.status || 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {(ot.status === 'PENDING' || !ot.status) && (
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => handleApproveReject(ot._id, 'APPROVED')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 size={14} /></button>
                                                <button onClick={() => handleApproveReject(ot._id, 'REJECTED')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><XCircle size={14} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
