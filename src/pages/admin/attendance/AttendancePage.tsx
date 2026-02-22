import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    CheckCircle2, XCircle, Coffee,
    FileWarning, Search, Calendar as CalendarIcon, Filter,
    Download, LayoutGrid, List, Clock, Loader2
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
    status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT' | 'HALF_DAY';
}

export const AttendancePage = () => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
    const [exportLoading, setExportLoading] = useState(false);

    // Fetch all active employees
    const fetchEmployees = async () => {
        try {
            const response: any = await api.get('/users?role=EMPLOYEE&limit=100');
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

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (viewMode === 'daily') fetchAttendance();
    }, [selectedDate, viewMode]);

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
            const month = selectedDate.substring(0, 7); // YYYY-MM
            const response = await api.get(`/admin/attendance/export?month=${month}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error("Failed to export attendance");
        } finally {
            setExportLoading(false);
        }
    };

    // Handle single attendance marking/updating
    const handleStatusChange = async (employeeId: string, status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT' | 'HALF_DAY') => {
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
        } catch (error: any) {
            toast.error(error.message || 'Failed to update attendance');
        }
    };

    // Match employees with their records
    const displayData = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.empId.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(emp => {
        const record = attendanceRecords.find(r => r.employeeId._id === emp._id);
        return {
            employee: emp,
            status: record?.status || null,
            recordId: record?._id || null
        };
    });

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-500 text-white border-emerald-600';
            case 'ABSENT': return 'bg-red-500 text-white border-red-600';
            case 'LEAVE': return 'bg-amber-500 text-white border-amber-600';
            case 'HALF_DAY': return 'bg-orange-500 text-white border-orange-600';
            case 'HOLIDAY': return 'bg-blue-500 text-white border-blue-600';
            default: return 'bg-gray-100 text-gray-400 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Center</h1>
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

            {viewMode === 'daily' ? (
                <>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
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
                        <button
                            onClick={handleBulkMarkAllPresent}
                            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={18} /> Mark All Present
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline-block text-primary-500" size={32} /></div>
                        ) : displayData.map((row) => (
                            <div key={row.employee._id} className={`bg-white rounded-2xl border p-4 transition-all duration-300 ${row.status ? 'border-gray-100 shadow-sm' : 'border-dashed border-primary-200 bg-primary-50/10'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black border border-primary-200">
                                            {row.employee.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{row.employee.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.employee.empId}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(row.status)}`}>
                                        {row.status || 'Unmarked'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-5 gap-1.5">
                                    {[
                                        { s: 'PRESENT', icon: CheckCircle2, label: 'P' },
                                        { s: 'ABSENT', icon: XCircle, label: 'A' },
                                        { s: 'HALF_DAY', icon: Clock, label: 'H' },
                                        { s: 'LEAVE', icon: FileWarning, label: 'L' },
                                        { s: 'HOLIDAY', icon: Coffee, label: 'O' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.s}
                                            onClick={() => handleStatusChange(row.employee._id, opt.s as any)}
                                            className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${row.status === opt.s
                                                ? 'bg-primary-600 border-primary-600 text-white shadow-md ring-2 ring-primary-100'
                                                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-200'}`}
                                        >
                                            <opt.icon size={16} className="mb-1" />
                                            <span className="text-[10px] font-black">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Monthly Calendar View</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Visualizing patterns across the month. View full individual history in the Staff Profiles.</p>
                    <button onClick={() => setViewMode('daily')} className="mt-6 px-6 py-2 bg-primary-50 text-primary-700 rounded-xl font-bold text-xs uppercase">Back to Daily marking</button>
                </div>
            )}
        </div>
    );
};
