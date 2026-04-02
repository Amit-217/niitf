import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    Download, 
    Calculator,
    CreditCard,
    Eye,
    Loader2,
    Trash2,
    X
} from 'lucide-react';
import { 
    generateSalary, 
    getAllSalaryRecordsForMonth,
    deleteSalaryRecord,
    updateSalaryRecordStatus
} from '../../../api/payrollApi';
import api from '../../../api/axios';

interface SalaryRecord {
    _id: string;
    employeeId: any;
    month: string;
    baseSalary: number;
    overtimeUnits: number;
    overtimeAmount: number;
    absentDays: number;
    deductionAmount: number;
    advanceTotal: number;
    netSalary: number;
    status: string;
    note?: string;
    createdAt: string;
}

interface AttendanceSummary {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    holidayDays: number;
    notMarkedDays: number;
    daysInMonth: number;
    payableDays: number;
}

export const SalaryRecordsPage = () => {
    const getLastMonthValue = () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().substring(0, 7);
    };

    const PAYROLL_DAYS = 30;

    const [month, setMonth] = useState(getLastMonthValue());
    const [records, setRecords] = useState<SalaryRecord[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [note, setNote] = useState('');
    const [isCreatePayrollOpen, setIsCreatePayrollOpen] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

    // For bulk generation modal/logic
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedGenEmployee, setSelectedGenEmployee] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
    const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

    useEffect(() => {
        fetchMonthRecords();
        fetchEmployees();
        fetchMonthlyAttendance();
    }, [month]);

    const fetchMonthRecords = async () => {
        setIsLoadingRecords(true);
        try {
            const res = await getAllSalaryRecordsForMonth(month);
            setRecords(res.data || []);
        } catch (error) {
            toast.error("Failed to fetch salary records");
        } finally {
            setIsLoadingRecords(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users?status=active&limit=100');
            setEmployees(res.data || []);
        } catch (error) {
            toast.error('Failed to load employees for generation');
        }
    };

    const fetchMonthlyAttendance = async () => {
        try {
            const res: any = await api.get(`/admin/attendance/month?month=${month}`);
            const items = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
            setMonthlyAttendance(items);
        } catch (error) {
            setMonthlyAttendance([]);
        }
    };

    const formatMonthLabel = (value: string) =>
        new Date(`${value}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const getDaysInMonth = (monthValue: string) => {
        // Payroll is normalized to a 30-day cycle regardless of calendar month length.
        const [year, monthNumber] = monthValue.split('-').map(Number);
        if (!year || !monthNumber) return PAYROLL_DAYS;
        return PAYROLL_DAYS;
    };

    const getAttendanceSummary = (employeeId: string): AttendanceSummary => {
        const daysInMonth = getDaysInMonth(month);
        const items = monthlyAttendance.filter((item: any) => {
            const id = item.employeeId?._id || item.employeeId;
            return id === employeeId;
        });

        const counts = items.reduce((acc: Record<string, number>, item: any) => {
            const status = item.status || 'NOT_MARKED';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const presentDays = counts.PRESENT || 0;
        const absentDays = counts.ABSENT || 0;
        const leaveDays = counts.LEAVE || 0;
        const holidayDays = counts.HOLIDAY || 0;
        const markedDays = presentDays + absentDays + leaveDays + holidayDays;

        return {
            presentDays,
            absentDays,
            leaveDays,
            holidayDays,
            notMarkedDays: Math.max(0, daysInMonth - markedDays),
            daysInMonth,
            payableDays: presentDays + leaveDays + holidayDays,
        };
    };

    const handleGenerate = async () => {
        if (!selectedGenEmployee) {
            toast.error("Please select an employee to generate salary");
            return;
        }
        setIsGenerating(true);
        try {
            await generateSalary({
                employeeId: selectedGenEmployee,
                month: month,
                note: note
            });
            toast.success("Salary generated successfully");
            setNote('');
            fetchMonthRecords();
        } catch (error: any) {
            toast.error(error.message || error || "Failed to generate salary");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStatusChange = async (recordId: string, status: 'DRAFT' | 'PAID') => {
        setStatusUpdatingId(recordId);
        try {
            await updateSalaryRecordStatus(recordId, status);
            toast.success('Salary status updated');
            fetchMonthRecords();
        } catch (error: any) {
            toast.error(error.message || error || 'Failed to update salary status');
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the salary record for ${name}?`)) return;
        
        try {
            await deleteSalaryRecord(id);
            toast.success("Salary record deleted");
            fetchMonthRecords();
        } catch (error: any) {
            toast.error(error.message || error || "Failed to delete record");
        }
    };

    const downloadSalarySlip = (record: any) => {
        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Salary Slip - ${record.employeeId?.name || 'Employee'}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0; color: #1d4ed8; font-size: 28px; letter-spacing: -0.025em; }
                        .header p { margin: 5px 0 0; color: #64748b; font-weight: 500; }
                        .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .info-item { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
                        .info-item label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
                        .info-item span { font-size: 15px; font-weight: 700; color: #0f172a; }
                        h3 { font-size: 14px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin: 30px 0 15px; border-left: 4px solid #3b82f6; padding-left: 12px; }
                        .row { display: flex; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; }
                        .row.total { background: #eff6ff; border-bottom: none; border-radius: 12px; margin-top: 15px; padding: 20px 15px; font-size: 20px; color: #1d4ed8; }
                        .total-label { font-weight: 800; }
                        .total-amount { font-weight: 900; }
                        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; font-weight: 500; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>NIIT NDT SERVICES</h1>
                        <p>Monthly Salary Remittance Advice</p>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-item"><label>Employee Name</label><span>${record.employeeId?.name || 'N/A'}</span></div>
                        <div class="info-item"><label>Employee ID</label><span>${record.employeeId?.empId || 'N/A'}</span></div>
                        <div class="info-item"><label>Payment Month</label><span>${record.month}</span></div>
                        <div class="info-item"><label>Status</label><span>${record.status}</span></div>
                    </div>

                    <h3>Earnings & Deductions</h3>
                    <div class="row"><span>Basic Salary:</span> <span>₹${(record.baseSalary || 0).toLocaleString()}</span></div>
                    <div class="row" style="color: #16a34a"><span>Overtime (${record.overtimeUnits || 0} Units):</span> <span>+ ₹${(record.overtimeAmount || 0).toLocaleString()}</span></div>
                    <div class="row" style="color: #dc2626"><span>Absent (${record.absentDays || 0} Days):</span> <span>- ₹${(record.deductionAmount || 0).toLocaleString()}</span></div>
                    <div class="row" style="color: #ea580c"><span>Advance:</span> <span>- ₹${(record.advanceTotal || 0).toLocaleString()}</span></div>
                    
                    <div class="row total">
                        <span class="total-label">Net Take Home:</span>
                        <span class="total-amount">₹${(record.netSalary || 0).toLocaleString()}</span>
                    </div>

                    ${record.note ? `
                    <div style="margin-top: 20px; padding: 10px; border-left: 4px solid #2563eb; background: #f8fafc; font-size: 12px;">
                        <strong>Note:</strong> ${record.note}
                    </div>
                    ` : ''}

                    <div class="footer">This is a system generated document. Powered by Viplora Tech.</div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CreditCard className="text-primary-600" size={26} /> Payroll Records</h1>
                    <p className="hidden sm:block text-sm text-gray-500 mt-1">Review, generate, and process monthly payouts</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer shadow-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreatePayrollOpen(true)}
                        className="px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-2"
                    >
                        <Calculator size={16} />
                        Create Payroll
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">Employee</th>
                                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">Attendance</th>
                                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">Earnings</th>
                                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">Deductions</th>
                                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">Net Payout</th>
                                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-center">Status</th>
                                <th className="px-4 py-4 text-center font-bold uppercase tracking-widest text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoadingRecords ? (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-400"><Loader2 className="animate-spin inline-block" /></td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-500 font-medium">No records found for this month</td></tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record._id} className={`hover:bg-gray-50/50 transition-colors ${record.status === 'PAID' ? 'bg-emerald-50/10' : ''}`}>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-black text-xs uppercase">{record.employeeId?.name ? record.employeeId.name.charAt(0) : '?'}</div>
                                                <div>
                                                    <p className="font-black text-gray-900 leading-tight">{record.employeeId?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{record.employeeId?.empId || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {(() => {
                                                const summary = getAttendanceSummary(record.employeeId?._id || record.employeeId);
                                                return (
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">P {summary.presentDays}</span>
                                                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-100">L {summary.leaveDays}</span>
                                                            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-black border border-red-100">A {summary.absentDays}</span>
                                                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-black border border-sky-100">H {summary.holidayDays}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                                                            {summary.payableDays} payable / {summary.daysInMonth} days
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-xs font-bold text-gray-700">₹{(record.baseSalary || 0).toLocaleString()}</div>
                                            <div className="text-[10px] font-bold text-emerald-600">+ ₹{(record.overtimeAmount || 0).toLocaleString()} (OT)</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-[10px] font-bold text-red-600">- ₹{(record.deductionAmount || 0).toLocaleString()} (Absent)</div>
                                            <div className="text-[10px] font-bold text-amber-600">- ₹{(record.advanceTotal || 0).toLocaleString()} (Advance)</div>
                                        </td>
                                        <td className="px-4 py-4 font-black text-primary-700 text-base">₹{Math.round(record.netSalary || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center">
                                            <select
                                                value={record.status}
                                                disabled={statusUpdatingId === record._id}
                                                onChange={(e) => handleStatusChange(record._id, e.target.value as 'DRAFT' | 'PAID')}
                                                className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border outline-none cursor-pointer ${
                                                    record.status === 'PAID'
                                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                        : 'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}
                                            >
                                                <option value="DRAFT">DRAFT</option>
                                                <option value="PAID">PAID</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => downloadSalarySlip(record)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-all"
                                                    title="Generate Slip"
                                                >
                                                    <Download size={16} />
                                                    Generate
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record._id, record.employeeId?.name)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreatePayrollOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        onClick={() => setIsCreatePayrollOpen(false)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-5 text-white flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-primary-100 font-black">Create Payroll</p>
                                <h3 className="text-xl font-black mt-1">Generate salary for {formatMonthLabel(month)}</h3>
                                <p className="text-primary-100 text-sm mt-1">Select an employee and create payroll for the chosen month.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreatePayrollOpen(false)}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Select Employee</label>
                                <select
                                    value={selectedGenEmployee}
                                    onChange={(e) => setSelectedGenEmployee(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-gray-700"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.name} ({u.empId})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Month</label>
                                <div className="w-full p-3 border border-gray-200 rounded-2xl bg-gray-50 text-sm font-bold text-gray-700">
                                    {formatMonthLabel(month)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Note</label>
                                <input
                                    type="text"
                                    placeholder="Add a note (optional)..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-gray-700"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreatePayrollOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await handleGenerate();
                                        setIsCreatePayrollOpen(false);
                                    }}
                                    disabled={isGenerating || !selectedGenEmployee}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                                    Create Payroll
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex justify-end pt-[40px]">
                    <div
                        className="absolute inset-0 top-[40px] bg-gray-900/50"
                        onClick={() => setSelectedRecord(null)}
                    />
                    <div className="relative w-full max-w-2xl h-[calc(100dvh-40px)] bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/70 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black">Salary Breakdown</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">{selectedRecord.employeeId?.name || 'Employee'}</h3>
                                <p className="hidden sm:block text-sm text-gray-500 mt-1">{selectedRecord.employeeId?.empId || 'N/A'} - {formatMonthLabel(selectedRecord.month)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 rounded-xl hover:bg-white text-gray-500 hover:text-gray-700 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {(() => {
                                const summary = getAttendanceSummary(selectedRecord.employeeId?._id || selectedRecord.employeeId);
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black">Net Salary</p>
                                                <p className="text-3xl font-black text-primary-700 mt-2">₹{Math.round(selectedRecord.netSalary || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black">Status</p>
                                                <p className="text-xl font-black mt-2 text-gray-900">{selectedRecord.status}</p>
                                                <p className="text-xs text-gray-500 mt-1">Generated on {new Date(selectedRecord.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                                            <h4 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Attendance Overview</h4>
                                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="rounded-xl bg-white border border-emerald-100 p-3">
                                                    <p className="text-[10px] uppercase text-emerald-500 font-black tracking-widest">Present</p>
                                                    <p className="text-2xl font-black text-emerald-700 mt-1">{summary.presentDays}</p>
                                                </div>
                                                <div className="rounded-xl bg-white border border-amber-100 p-3">
                                                    <p className="text-[10px] uppercase text-amber-500 font-black tracking-widest">Leave</p>
                                                    <p className="text-2xl font-black text-amber-700 mt-1">{summary.leaveDays}</p>
                                                </div>
                                                <div className="rounded-xl bg-white border border-rose-100 p-3">
                                                    <p className="text-[10px] uppercase text-rose-500 font-black tracking-widest">Absent</p>
                                                    <p className="text-2xl font-black text-rose-700 mt-1">{summary.absentDays}</p>
                                                </div>
                                                <div className="rounded-xl bg-white border border-sky-100 p-3">
                                                    <p className="text-[10px] uppercase text-sky-500 font-black tracking-widest">Holiday</p>
                                                    <p className="text-2xl font-black text-sky-700 mt-1">{summary.holidayDays}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-emerald-800 mt-4 font-medium">
                                                {summary.payableDays} payable days out of {summary.daysInMonth}. Payroll is calculated on a fixed 30-day month.
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-gray-100 p-5">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Salary Formula</h4>
                                            <div className="mt-4 space-y-3 text-sm">
                                                <div className="flex justify-between gap-4"><span className="text-gray-500">Base Salary</span><span className="font-bold text-gray-900">₹{(selectedRecord.baseSalary || 0).toLocaleString()}</span></div>
                                                <div className="flex justify-between gap-4"><span className="text-gray-500">Overtime ({selectedRecord.overtimeUnits || 0} units)</span><span className="font-bold text-emerald-600">+ ₹{(selectedRecord.overtimeAmount || 0).toLocaleString()}</span></div>
                                                <div className="flex justify-between gap-4"><span className="text-gray-500">Absent deduction ({selectedRecord.absentDays || 0} days)</span><span className="font-bold text-rose-600">- ₹{(selectedRecord.deductionAmount || 0).toLocaleString()}</span></div>
                                                <div className="flex justify-between gap-4"><span className="text-gray-500">Advance recovery</span><span className="font-bold text-amber-600">- ₹{(selectedRecord.advanceTotal || 0).toLocaleString()}</span></div>
                                            </div>
                                        </div>

                                        {selectedRecord.note && (
                                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                                                <h4 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em]">Note</h4>
                                                <p className="text-sm text-blue-900 mt-2">{selectedRecord.note}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => downloadSalarySlip(selectedRecord)}
                                                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Download size={16} />
                                                Print Slip
                                            </button>
                                            <button
                                                onClick={() => setSelectedRecord(null)}
                                                className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
