import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    CheckCircle2, XCircle, Coffee,
    FileWarning, Search, Calendar as CalendarIcon,
    Download, LayoutGrid, List, Loader2
} from 'lucide-react';
import {
    getAttendanceByDate,
    bulkMarkAttendance,
    updateAttendance
} from '../../../api/payrollApi';
import api from '../../../api/axios';

// Basic User type definition based on your backend
interface User {
    _id: string;
    name: string;
    empId: string;
    role: string;
}

interface AttendanceRecord {
    _id: string;
    employeeId: User;
    date: string;
    status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT';
}

export const AttendancePage = () => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
    const [exportLoading, setExportLoading] = useState(false);

    // Fetch all active employees (Admin, Super Admin, and Employees)
    const fetchEmployees = async () => {
        try {
            // Remove role=EMPLOYEE filter to show admins as well
            const response: any = await api.get('/users?status=active&limit=100');
            setEmployees(response.data || []);
        } catch (error: any) {
            toast.error('Failed to load employees');
        }
    };

    // Fetch Attendance for the selected date
    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const response = await getAttendanceByDate(selectedDate);
            setAttendanceRecords(response.data || []);
        } catch (error: any) {
            toast.error('Failed to load attendance records');
        } finally {
            setIsLoading(false);
        }
    };

    const [monthlyData, setMonthlyData] = useState<{ [empId: string]: any[] }>({});
    const fetchMonthlyData = async () => {
        try {
            const month = selectedDate.substring(0, 7); // YYYY-MM
            const response: any = await api.get(`/admin/attendance/month?month=${month}`);
            const data = response.data || response;
            
            // Group by employeeId
            const grouped: { [empId: string]: any[] } = {};
            if (Array.isArray(data)) {
                data.forEach((att: any) => {
                    const eid = att.employeeId?._id || att.employeeId;
                    if (!grouped[eid]) grouped[eid] = [];
                    grouped[eid].push(att);
                });
            }
            setMonthlyData(grouped);
        } catch (error) {
            console.error("Monthly fetch failed", error);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        // Fetch daily attendance
        fetchAttendance();
        // Always fetch monthly data for the stats shown on cards
        fetchMonthlyData();
    }, [selectedDate, employees.length]);

    // Re-fetch monthly data specifically when month changes (substring 0,7)
    useEffect(() => {
        if (viewMode === 'monthly') {
            fetchMonthlyData();
        }
    }, [selectedDate.substring(0, 7), viewMode]);

    const handleBulkMarkAllPresent = async () => {
        const unmarked = displayData.filter(d => !d.status);
        if (unmarked.length === 0) {
            toast.info("All employees already marked for today.");
            return;
        }

        try {
            await bulkMarkAttendance({
                date: selectedDate,
                attendances: unmarked.map(d => ({ employeeId: d.employee._id, status: 'PRESENT' }))
            });
            toast.success(`Marked ${unmarked.length} employees as Present`);
            fetchAttendance();
        } catch (err: any) {
            toast.error("Failed to mark all present");
        }
    };

    const handleExportCSV = async () => {
        setExportLoading(true);
        try {
            const params = viewMode === 'daily' 
                ? `date=${selectedDate}` 
                : `month=${selectedDate.substring(0, 7)}`;
            
            const response: any = await api.get(`/admin/attendance/export?${params}`, { 
                responseType: 'blob' 
            });
            
            const responseData = response instanceof Blob ? response : response.data;
            const blob = new Blob([responseData], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `NIIT_Attendance_${params.split('=')[1]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("CSV Report downloaded");
        } catch (error: any) {
            toast.error(error.message || error || "Failed to export attendance");
        } finally {
            setExportLoading(false);
        }
    };

    // Handle single attendance marking/updating
    const handleStatusChange = async (employeeId: string, status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT') => {
        const existingRecord = attendanceRecords.find(r => r.employeeId._id === employeeId);

        try {
            if (existingRecord) {
                await updateAttendance(existingRecord._id, status);
                toast.success(`Updated to ${status}`);
            } else {
                await bulkMarkAttendance({
                    date: selectedDate,
                    attendances: [{ employeeId, status }]
                });
                toast.success(`Marked as ${status}`);
            }
            fetchAttendance();
            fetchMonthlyData(); // Refresh stats on card too
        } catch (error: any) {
            toast.error(error.message || error || 'Failed to update attendance');
        }
    };

    // Match employees with their records
    const displayData = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.empId.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(emp => {
        const record = attendanceRecords.find(r => r.employeeId._id === emp._id);
        
        // Calculate monthly stats for this employee
        const eMonthlyRecords = monthlyData[emp._id] || [];
        const stats = {
            P: eMonthlyRecords.filter(r => r.status === 'PRESENT').length,
            A: eMonthlyRecords.filter(r => r.status === 'ABSENT').length
        };

        return {
            employee: emp,
            status: record?.status || null,
            recordId: record?._id || null,
            stats
        };
    });

    const getDaysInMonth = (year: number, monthVal: number) => {
        return new Date(year, monthVal, 0).getDate();
    };

    const year = parseInt(selectedDate.split('-')[0]);
    const monthVal = parseInt(selectedDate.split('-')[1]);
    const daysInMonth = getDaysInMonth(year, monthVal);
    const dayLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-500 text-white border-emerald-600';
            case 'ABSENT': return 'bg-red-500 text-white border-red-600';
            case 'LEAVE': return 'bg-amber-500 text-white border-amber-600';
            case 'HOLIDAY': return 'bg-blue-500 text-white border-blue-600';
            default: return 'bg-gray-100 text-gray-400 border-gray-200';
        }
    };

    const getMiniStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-500';
            case 'ABSENT': return 'bg-red-500';
            case 'LEAVE': return 'bg-amber-500';
            case 'HOLIDAY': return 'bg-blue-500';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CalendarIcon className="text-primary-600" size={26} /> Attendance Center</h1>
                    <p className="text-sm text-gray-500 mt-1">Mark daily presence and generate reports</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Download size={14} /> {exportLoading ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('daily')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'daily' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400'}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('monthly')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-auto">
                    <input
                        type={viewMode === 'daily' ? 'date' : 'month'}
                        value={viewMode === 'daily' ? selectedDate : selectedDate.substring(0, 7)}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedDate(viewMode === 'daily' ? val : `${val}-01`);
                        }}
                        className="w-full sm:w-48 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer font-bold text-sm bg-gray-50"
                    />
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-gray-50"
                    />
                </div>
                {viewMode === 'daily' && (
                    <button
                        onClick={handleBulkMarkAllPresent}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} /> Mark All Present
                    </button>
                )}
            </div>

            {viewMode === 'daily' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline-block text-primary-500" size={32} /></div>
                    ) : displayData.map((row) => (
                        <div key={row.employee._id} className={"bg-white rounded-2xl border p-4 transition-all duration-300 " + (row.status ? 'border-gray-100 shadow-sm' : 'border-dashed border-primary-200 bg-primary-50/10')}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-700 font-black border border-primary-200 shadow-sm text-sm transform transition-transform hover:scale-105">
                                        {row.employee.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate">{row.employee.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.employee.empId}</span>
                                            {/* Monthly Summary Badges */}
                                            <div className="flex items-center gap-1">
                                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-100">P:{row.stats.P}</span>
                                                <span className="bg-red-50 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-100">A:{row.stats.A}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span className={"px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border " + getStatusColor(row.status)}>
                                    {row.status || 'Unmarked'}
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 mt-4">
                                {[
                                    { s: 'PRESENT', icon: CheckCircle2, label: 'P' },
                                    { s: 'ABSENT', icon: XCircle, label: 'A' },
                                    { s: 'LEAVE', icon: FileWarning, label: 'L' },
                                    { s: 'HOLIDAY', icon: Coffee, label: 'O' }
                                ].map((opt) => (
                                    <button
                                        onClick={() => handleStatusChange(row.employee._id, opt.s as any)}
                                        className={"flex flex-col items-center justify-center py-3 rounded-2xl border transition-all duration-300 transform active:scale-95 " + (row.status === opt.s
                                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 ring-2 ring-primary-100'
                                            : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-primary-200 hover:text-primary-600')}
                                    >
                                        <opt.icon size={18} className="mb-1" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden backdrop-blur-sm bg-white/80">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 min-w-[240px] sticky left-0 bg-gray-50/95 backdrop-blur-md z-20 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">Employee Details</th>
                                    {dayLabels.map(d => (
                                        <th key={d} className="px-1 py-5 text-center text-[10px] font-black text-gray-400 w-10">{d}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr><td colSpan={daysInMonth + 1} className="py-24 text-center"><Loader2 className="animate-spin inline-block text-primary-500" size={40} /></td></tr>
                                ) : employees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).map(emp => (
                                    <tr key={emp._id} className="group hover:bg-primary-50/30 transition-all duration-300">
                                        <td className="px-6 py-4 sticky left-0 bg-white/90 backdrop-blur-md z-10 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)] group-hover:bg-primary-50/40">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-100 to-white flex items-center justify-center text-xs font-black text-primary-700 border border-primary-200 shadow-sm transition-transform group-hover:scale-110">
                                                    {emp.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-gray-900 truncate tracking-tight">{emp.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{emp.empId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {dayLabels.map(day => {
                                            const dateStr = `${year}-${String(monthVal).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const att = monthlyData[emp._id]?.find(a => a.date.startsWith(dateStr));
                                            return (
                                                <td key={day} className="p-1 px-1.5 focus-within:z-10">
                                                    <div 
                                                        title={att ? `${dateStr}: ${att.status}` : dateStr}
                                                        className={`w-7 h-7 mx-auto rounded-lg ${getMiniStatusColor(att?.status)} shadow-sm transition-all duration-300 hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 cursor-help transform hover:scale-125`} 
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4">
                        {[
                            { s: 'PRESENT', c: 'bg-emerald-500', l: 'Present' },
                            { s: 'ABSENT', c: 'bg-red-500', l: 'Absent' },
                            { s: 'LEAVE', c: 'bg-amber-500', l: 'Leave' },
                            { s: 'HOLIDAY', c: 'bg-blue-500', l: 'Holiday' }
                        ].map(legend => (
                            <div key={legend.s} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-full ${legend.c}`} />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{legend.l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
