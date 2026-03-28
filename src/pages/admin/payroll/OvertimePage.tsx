import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Clock, CheckCircle2, XCircle, Save, Download, Table2, Info } from 'lucide-react';
import { markOvertime, getEmployeeMonthlyOvertime, getOvertimeByDate } from '../../../api/payrollApi';
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
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [units, setUnits] = useState<number>(0);
    const [recentOvertimes, setRecentOvertimes] = useState<OvertimeRecord[]>([]);
    const [allOvertimes, setAllOvertimes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchAllOvertimes();
    }, [filterDate]);

    const fetchAllOvertimes = async () => {
        try {
            const res = await getOvertimeByDate(filterDate);
            setAllOvertimes(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            fetchRecentOvertimes();
        } else {
            setRecentOvertimes([]);
        }
    }, [selectedUser, date]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users?status=active&limit=100');
            setUsers(res.data || []);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to load employees');
        }
    };

    const fetchRecentOvertimes = async () => {
        if (!selectedUser) return;
        try {
            const month = date.substring(0, 7);
            const res = await getEmployeeMonthlyOvertime(selectedUser, month);
            setRecentOvertimes(res.data || []);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to load overtime records');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || units <= 0 || units > 3) {
            toast.error('Please select an employee and enter up to 3 overtime units');
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
            fetchAllOvertimes();
        } catch (error: any) {
            // Unpack backend error response specifically if it is from validation
            const errMessage = error?.response?.data?.message || error?.message || 'Failed to save overtime';
            toast.error(errMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReject = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await api.patch(`/admin/overtime/${id}/approve`, { status });
            toast.success(`Overtime ${status.toLowerCase()}!`);
            fetchRecentOvertimes();
            fetchAllOvertimes();
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

    const exportCSV = () => {
        if (!allOvertimes.length) return toast.warning('No data to export');
        const headers = 'Employee Name,Employee ID,Date,Units,Status,Recorded By\n';
        const rows = allOvertimes.map(ot => 
            `"${ot.employeeId?.name || '-'}","${ot.employeeId?.empId || '-'}","${new Date(ot.date).toLocaleDateString()}","${ot.units}","${ot.status || 'PENDING'}","${ot.markedBy?.name || '-'}"`
        ).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Overtime_${filterDate}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Clock className="text-primary-600" size={26} /> Overtime Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Record and manage employee overtime hours</p>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info size={18} className="text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold">Important Overtime Rules:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-blue-700/80">
                        <li>Employee MUST have their attendance marked for the date first.</li>
                        <li>Overtime on a 'PRESENT' day maxes out at 3 units.</li>
                        <li>Overtime on a 'HOLIDAY' day maxes out at 3 units.</li>
                    </ul>
                </div>
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
                            max="3"
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-full">
                        <thead className="bg-gray-50/30 text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Units</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-center">Status</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-right">Actions</th>
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
                </div>
            )}

            {/* Global Extracted Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Table2 className="text-gray-500" size={18} />
                            <h3 className="font-semibold text-gray-700">Daily Records</h3>
                        </div>
                        <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-700 font-medium"
                        />
                    </div>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-full">
                        <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Units</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3">Recorded By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allOvertimes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No overtimes recorded for this date.</td>
                                </tr>
                            ) : (
                                allOvertimes.map((ot) => (
                                    <tr key={ot._id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {ot.employeeId?.name || '-'} <span className="text-gray-400 font-normal ml-1">({ot.employeeId?.empId || '-'})</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(ot.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-bold text-primary-700">+{ot.units}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tighter ${getStatusStyle(ot.status || 'PENDING')}`}>
                                                {ot.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{ot.markedBy?.name || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
