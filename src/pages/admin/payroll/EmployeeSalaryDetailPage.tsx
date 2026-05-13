import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, CreditCard, Wallet, TrendingUp, BadgeIndianRupee } from 'lucide-react';
import { getEmployeeSalaryHistory, getEmployeeAdvanceHistory } from '../../../api/payrollApi';

const PF_RATE = 0.12; // 12% of basic salary

const formatMonth = (m: string) =>
    new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export const EmployeeSalaryDetailPage = () => {
    const { id: employeeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const employee = (location.state as any)?.employee || {};

    const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!employeeId) return;
        const load = async () => {
            setLoading(true);
            try {
                const [salRes, advRes]: any[] = await Promise.all([
                    getEmployeeSalaryHistory(employeeId),
                    getEmployeeAdvanceHistory(employeeId),
                ]);
                setSalaryRecords(salRes.data || []);
                setAdvances(advRes.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [employeeId]);

    // --- Summary computations ---
    const totalNetSalary = salaryRecords.reduce((s, r) => s + (r.netSalary || 0), 0);
    const totalAdvanceTaken = advances.reduce((s, a) => s + (a.amount || 0), 0);
    const totalRepaid = advances.reduce((s, a) => s + (a.repaidAmount || 0), 0);
    const totalOutstanding = totalAdvanceTaken - totalRepaid;

    const empName = salaryRecords[0]?.employeeId?.name || employee?.name || 'Employee';
    const empId = salaryRecords[0]?.employeeId?.empId || employee?.empId || '—';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="text-primary-600" size={24} />
                        {empName}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5 font-semibold uppercase tracking-widest">{empId} &bull; Salary & Advance History</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24 text-gray-400">
                    <Loader2 className="animate-spin mr-2" size={24} /> Loading...
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Net Salary</p>
                                <p className="text-xl font-black text-gray-900 mt-0.5">₹{Math.round(totalNetSalary).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                <Wallet size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Advance Taken</p>
                                <p className="text-xl font-black text-red-600 mt-0.5">₹{totalAdvanceTaken.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                <BadgeIndianRupee size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Repaid</p>
                                <p className="text-xl font-black text-emerald-600 mt-0.5">₹{totalRepaid.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                <Wallet size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outstanding Advance</p>
                                <p className="text-xl font-black text-amber-600 mt-0.5">₹{totalOutstanding.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Month-wise Salary Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <CreditCard size={16} className="text-primary-600" />
                                Month-wise Salary Records
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-gray-50/70 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Month</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Total Salary</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Total Advance</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Adv. Deduction</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">PF (12%)</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Repayment</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Net Payout</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {salaryRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No salary records found</td>
                                        </tr>
                                    ) : (
                                        salaryRecords.map((rec) => {
                                            const pf = Math.round(rec.baseSalary * PF_RATE);
                                            return (
                                                <tr key={rec._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-gray-800">{formatMonth(rec.month)}</td>
                                                    <td className="px-4 py-3 font-semibold text-gray-900">₹{(rec.baseSalary || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-red-500 font-semibold">₹{(rec.advanceTotal || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-red-500 font-semibold">₹{(rec.deductionAmount || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-orange-500 font-semibold">₹{pf.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-emerald-600 font-bold">₹{(rec.advanceTotal || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-black text-primary-700">₹{Math.round(rec.netSalary || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                            rec.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {rec.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                {salaryRecords.length > 0 && (
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td className="px-4 py-3 text-[10px] font-black uppercase text-gray-500 tracking-wider">Totals</td>
                                            <td className="px-4 py-3 font-black text-gray-900">
                                                ₹{salaryRecords.reduce((s, r) => s + (r.baseSalary || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-black text-red-600">
                                                ₹{salaryRecords.reduce((s, r) => s + (r.advanceTotal || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-black text-red-600">
                                                ₹{salaryRecords.reduce((s, r) => s + (r.deductionAmount || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-black text-orange-500">
                                                ₹{salaryRecords.reduce((s, r) => s + Math.round(r.baseSalary * PF_RATE), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-black text-emerald-600">
                                                ₹{salaryRecords.reduce((s, r) => s + (r.advanceTotal || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-black text-primary-700">
                                                ₹{Math.round(salaryRecords.reduce((s, r) => s + (r.netSalary || 0), 0)).toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};
