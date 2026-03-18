import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Calculator, CheckCircle2, Download, CreditCard, Loader2, Clock } from 'lucide-react';
import { generateSalary, getAllSalaryRecordsForMonth } from '../../../api/payrollApi';
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
    createdAt: string;
}

export const SalaryRecordsPage = () => {
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
    const [records, setRecords] = useState<SalaryRecord[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

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
            const res = await api.get('/users?role=EMPLOYEE&limit=100');
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
                month: month
            });
            toast.success("Salary generated successfully");
            fetchMonthRecords();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate salary");
        } finally {
            setIsGenerating(false);
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
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Salary Slip - ${record.employeeId?.name || 'Employee'}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                        .company { font-size: 24px; font-weight: bold; color: #2563eb; }
                        .title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px; }
                        .details { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin: 30px 0; }
                        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .total-row { background: #f8fafc; font-weight: bold; padding: 15px; border: 1px solid #e2e8f0; margin-top: 20px; font-size: 18px; }
                        .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company">NIIT NDT</div>
                        <div class="title">Salary Pay Slip - ${record.month}</div>
                    </div>
                    <div class="details">
                        <div>
                            <div class="row"><span>Employee Name:</span> <strong>${record.employeeId?.name || 'N/A'}</strong></div>
                            <div class="row"><span>Employee ID:</span> <strong>${record.employeeId?.empId || 'N/A'}</strong></div>
                        </div>
                        <div>
                            <div class="row"><span>Generation Date:</span> <strong>${new Date(record.createdAt).toLocaleDateString()}</strong></div>
                            <div class="row"><span>Payment Status:</span> <strong>${record.status}</strong></div>
                        </div>
                    </div>
                    <h3>Earnings & Deductions</h3>
                    <div class="row"><span>Basic Salary:</span> <span>₹${(record.baseSalary || 0).toLocaleString()}</span></div>
                    <div class="row" style="color: #16a34a"><span>Overtime (${record.overtimeUnits || 0} Units):</span> <span>+ ₹${(record.overtimeAmount || 0).toLocaleString()}</span></div>
                    <div class="row" style="color: #dc2626"><span>Loss of Pay (${record.absentDays || 0} Days):</span> <span>- ₹${(record.deductionAmount || 0).toLocaleString()}</span></div>
                    <div class="row" style="color: #ea580c"><span>Salary Advances:</span> <span>- ₹${(record.advanceTotal || 0).toLocaleString()}</span></div>
                    
                    <div class="total-row">
                        <span>Net Take Home:</span>
                        <span>₹${(record.netSalary || 0).toLocaleString()}</span>
                    </div>
                    <div class="footer">This is a system generated document. Powered by Viplora Tech.</div>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Calculator className="text-primary-600" size={26} /> Salary Generation</h1>
                    <p className="text-sm text-gray-500 mt-1">Generate and manage monthly employee salaries</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
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
                                <th className="px-4 py-4"></th>
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
                                            {record.status === 'DRAFT' && (
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
                                            <div className="text-[10px] font-bold text-red-600">- ₹{(record.deductionAmount || 0).toLocaleString()} (Loss)</div>
                                            <div className="text-[10px] font-bold text-amber-600">- ₹{(record.advanceTotal || 0).toLocaleString()} (Adv)</div>
                                        </td>
                                        <td className="px-4 py-4 font-black text-primary-700 text-base">₹{Math.round(record.netSalary || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${record.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                {record.status === 'PAID' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => downloadSalarySlip(record)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Print Pay Slip"
                                            >
                                                <Download size={18} />
                                            </button>
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
