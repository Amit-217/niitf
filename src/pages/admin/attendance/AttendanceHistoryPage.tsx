import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Eye, History, Loader2, Search, X } from 'lucide-react';
import api from '../../../api/axios';

interface User {
    _id: string;
    name: string;
    empId: string;
    role: string;
}

interface AttendanceRecord {
    _id: string;
    employeeId: User | string; // API may return a populated object or a raw ID string
    date: string;
    status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT';
    markedBy?: User;
    createdAt?: string;
}

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

interface LeaveBalance {
    employeeId: string;
    leaveUsed: number;
    leaveBalance: number;
    leaveLimit: number;
}

export const AttendanceHistoryPage = () => {
    const navigate = useNavigate();
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
    const [employees, setEmployees] = useState<User[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [leaveBalanceMap, setLeaveBalanceMap] = useState<Record<string, LeaveBalance>>({});
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

    useEffect(() => {
        api.get('/users?status=active&limit=100')
            .then((res) => setEmployees(res.data || []))
            .catch(() => toast.error('Failed to load employees'));
    }, []);

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            try {
                const year = month.substring(0, 4);
                const [monthRes, leaveBalRes]: any = await Promise.all([
                    api.get(`/admin/attendance/month?month=${month}`),
                    api.get(`/admin/attendance/leave-balance?year=${year}`),
                ]);
                setRecords(Array.isArray(monthRes.data) ? monthRes.data : []);
                const map: Record<string, LeaveBalance> = {};
                if (Array.isArray(leaveBalRes.data)) {
                    leaveBalRes.data.forEach((item: LeaveBalance) => {
                        map[item.employeeId.toString()] = item;
                    });
                }
                setLeaveBalanceMap(map);
            } catch {
                toast.error('Failed to load attendance history');
                setRecords([]);
                setLeaveBalanceMap({});
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [month]);

    const summaries = useMemo(() => {
        return employees
            .filter((emp) =>
                emp.name.toLowerCase().includes(search.toLowerCase()) ||
                emp.empId.toLowerCase().includes(search.toLowerCase()),
            )
            .map((emp) => {
                const empRecords = records.filter((record) => {
                    const id = (record.employeeId as any)?._id || record.employeeId;
                    return id === emp._id;
                });

                const lb = leaveBalanceMap[emp._id] || { leaveUsed: 0, leaveBalance: 22, leaveLimit: 22 };

                return {
                    employee: emp,
                    records: empRecords,
                    present: empRecords.filter((r) => r.status === 'PRESENT').length,
                    absent: empRecords.filter((r) => r.status === 'ABSENT').length,
                    leave: empRecords.filter((r) => r.status === 'LEAVE').length,
                    holiday: empRecords.filter((r) => r.status === 'HOLIDAY').length,
                    leaveUsed: lb.leaveUsed,
                    leaveBalance: lb.leaveBalance,
                    leaveLimit: lb.leaveLimit,
                };
            });
    }, [employees, records, leaveBalanceMap, search]);

    const selectedEmployeeRecords = selectedEmployee
        ? records
              .filter((record) => {
                  const id = (record.employeeId as any)?._id || record.employeeId;
                  return id === selectedEmployee._id;
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/attendance')}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 mb-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Attendance
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <History className="text-primary-600" size={26} />
                        Attendance History
                    </h1>
                    <p className="hidden sm:block text-sm text-gray-500 mt-1">Employee raw records with present, absent, leave, and holiday counts.</p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <Search size={16} className="text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search employee by name or ID..."
                    className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
                />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Employees', value: summaries.length, className: 'from-primary-50 to-white text-primary-700' },
                    { label: 'Present', value: summaries.reduce((sum, item) => sum + item.present, 0), className: 'from-emerald-50 to-white text-emerald-700' },
                    { label: 'Leave', value: summaries.reduce((sum, item) => sum + item.leave, 0), className: 'from-amber-50 to-white text-amber-700' },
                    { label: 'Absent', value: summaries.reduce((sum, item) => sum + item.absent, 0), className: 'from-rose-50 to-white text-rose-700' },
                ].map((card) => (
                    <div key={card.label} className={`rounded-2xl border border-gray-100 bg-gradient-to-br ${card.className} p-4 shadow-sm`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{card.label}</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Employee Raw Records</h3>
                        <p className="hidden sm:block text-sm text-gray-500 mt-1">View monthly attendance totals and the yearly leave cap before opening a raw entry report.</p>
                    </div>
                    {loading && <Loader2 size={18} className="animate-spin text-primary-500" />}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Present</th>
                                <th className="px-4 py-3">Absent</th>
                                <th className="px-4 py-3">Leave</th>
                                <th className="px-4 py-3">Holiday</th>
                                <th className="px-4 py-3">Leave Balance</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                                        Loading attendance history...
                                    </td>
                                </tr>
                            ) : summaries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                summaries.map((item) => (
                                    <tr key={item.employee._id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900">{item.employee.name}</div>
                                            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400">{item.employee.empId}</div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-emerald-700">{item.present}</td>
                                        <td className="px-4 py-3 font-bold text-rose-700">{item.absent}</td>
                                        <td className="px-4 py-3 font-bold text-amber-700">{item.leave}</td>
                                        <td className="px-4 py-3 font-bold text-sky-700">{item.holiday}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit ${
                                                    item.leaveBalance <= 0
                                                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                                                        : item.leaveBalance <= 5
                                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    {item.leaveBalance} left
                                                </span>
                                                <span className="text-[10px] text-gray-400">{item.leaveUsed}/{item.leaveLimit} used</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedEmployee(item.employee)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedEmployee && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={() => setSelectedEmployee(null)} />
                    <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl overflow-y-auto">
                        <div className="sticky top-0 z-10 p-6 border-b border-gray-100 bg-white/95 backdrop-blur flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Attendance Report</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">{selectedEmployee.name}</h3>
                                <p className="hidden sm:block text-sm text-gray-500 mt-1">{selectedEmployee.empId} - {month}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEmployee(null)}
                                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: 'Present', value: selectedEmployeeRecords.filter((r) => r.status === 'PRESENT').length, className: 'text-emerald-700' },
                                    { label: 'Absent', value: selectedEmployeeRecords.filter((r) => r.status === 'ABSENT').length, className: 'text-rose-700' },
                                    { label: 'Leave', value: selectedEmployeeRecords.filter((r) => r.status === 'LEAVE').length, className: 'text-amber-700' },
                                    { label: 'Holiday', value: selectedEmployeeRecords.filter((r) => r.status === 'HOLIDAY').length, className: 'text-sky-700' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{item.label}</p>
                                        <p className={`text-3xl font-black mt-2 ${item.className}`}>{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">Daily Entries</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 text-gray-400">
                                            <tr>
                                                <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-wider">Date</th>
                                                <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-wider">Status</th>
                                                <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-wider">Marked By</th>
                                                <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-wider">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedEmployeeRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                                                        No raw entries available for this employee in the selected month.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedEmployeeRecords.map((record) => (
                                                    <tr key={record._id} className="hover:bg-gray-50/50">
                                                        <td className="px-5 py-3 font-semibold text-gray-900">{formatDate(record.date)}</td>
                                                        <td className="px-5 py-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                                record.status === 'PRESENT'
                                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                                    : record.status === 'ABSENT'
                                                                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                                                                        : record.status === 'LEAVE'
                                                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                                            : 'bg-sky-100 text-sky-700 border-sky-200'
                                                            }`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-600">{record.markedBy?.name || '-'}</td>
                                                        <td className="px-5 py-3 text-gray-500">{formatDate(record.createdAt || record.date)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
