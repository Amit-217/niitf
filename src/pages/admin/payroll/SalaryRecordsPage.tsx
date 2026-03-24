import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    Download, 
    Calculator,
    CreditCard,
    Loader2,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { 
    generateSalary, 
    getAllSalaryRecordsForMonth,
    deleteSalaryRecord
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

export const SalaryRecordsPage = () => {
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
    const [records, setRecords] = useState<SalaryRecord[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [note, setNote] = useState('');

    // For bulk generation modal/logic
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedGenEmployee, setSelectedGenEmployee] = useState('');

    const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
    const [isPayoutLoading, setPayoutLoading] = useState(false);

    useEffect(() => {
        fetchMonthRecords();
        fetchEmployees();
    }, [month]);

    const fetchMonthRecords = async () => {
        setIsLoadingRecords(true);
        try {
            const res = await getAllSalaryRecordsForMonth(month);
            setRecords(res.data || []);
            setSelectedRecords([]);
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

    const handleBulkPayout = async () => {
        if (selectedRecords.length === 0) return;
        setPayoutLoading(true);
        try {
            await api.post('/admin/salary-record/bulk-pay', { recordIds: selectedRecords });
            toast.success(`Processed payout for ${selectedRecords.length} employees!`);
            setSelectedRecords([]);
            fetchMonthRecords();
        } catch (err) {
            toast.error("Failed to process payout");
        } finally {
            setPayoutLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedRecords(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
                    <p className="text-sm text-gray-500 mt-1">Review, generate, and process monthly payouts</p>
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
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Calculator size={20} /></div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900">Important: Salary Cycle Restriction</h4>
                    <p className="text-xs text-amber-700 mt-1 uppercase font-bold tracking-tight">Salary generation is only available after the current month ends (from the 1st of the next month onwards).</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Calculator size={16} className="text-primary-600" /> Generate Salary for {month}</h3>
                <div className="flex flex-wrap gap-4 items-center">
                    <select
                        value={selectedGenEmployee}
                        onChange={(e) => setSelectedGenEmployee(e.target.value)}
                        className="w-full sm:w-64 p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-gray-700"
                    >
                        <option value="">Select Employee</option>
                        {employees.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.empId})</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Add a note (optional)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="flex-1 min-w-[200px] p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-gray-700"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !selectedGenEmployee}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-70 flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                        Generate
                    </button>
                </div>
            </div>

            {selectedRecords.length > 0 && (
                <div className="bg-primary-600 text-white px-6 py-4 rounded-2xl flex items-center justify-between shadow-xl shadow-primary-200">
                    <div className="flex items-center gap-4">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{selectedRecords.length} Selected</span>
                        <p className="font-bold text-sm">Proceed with bulk payout for these records?</p>
                    </div>
                    <button
                        onClick={handleBulkPayout}
                        disabled={isPayoutLoading}
                        className="flex items-center gap-2 bg-white text-primary-700 px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-primary-50 transition-all"
                    >
                        {isPayoutLoading ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />} Mark as Paid
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-10"></th>
                                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">Employee</th>
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
                                            {record.status !== 'PAID' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecords.includes(record._id)}
                                                    onChange={() => toggleSelect(record._id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                />
                                            )}
                                        </td>
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
                                            <div className="text-xs font-bold text-gray-700">₹{(record.baseSalary || 0).toLocaleString()}</div>
                                            <div className="text-[10px] font-bold text-emerald-600">+ ₹{(record.overtimeAmount || 0).toLocaleString()} (OT)</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-[10px] font-bold text-red-600">- ₹{(record.deductionAmount || 0).toLocaleString()} (Absent)</div>
                                            <div className="text-[10px] font-bold text-amber-600">- ₹{(record.advanceTotal || 0).toLocaleString()} (Advance)</div>
                                        </td>
                                        <td className="px-4 py-4 font-black text-primary-700 text-base">₹{Math.round(record.netSalary || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                                            record.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                            {record.status === 'PAID' ? 'PAID' : 'DRAFT'}
                                        </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => downloadSalarySlip(record)}
                                                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="View Slip"
                                                >
                                                    <Download size={16} />
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
        </div>
    );
};
