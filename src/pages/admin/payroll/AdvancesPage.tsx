import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Wallet, Download, Table2 } from 'lucide-react';
import {
    createAdvance,
    getEmployeeMonthlyAdvances,
    getAllAdvancesForMonth
} from '../../../api/payrollApi';
import api from '../../../api/axios';

interface User {
    _id: string;
    name: string;
    empId: string;
}

export const AdvancesPage = () => {
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [repaymentMonth, setRepaymentMonth] = useState<string>(new Date().toISOString().substring(0, 7));
    const [remarks, setRemarks] = useState('');

    const [recentAdvances, setRecentAdvances] = useState<any[]>([]);
    const [allAdvances, setAllAdvances] = useState<any[]>([]);

    useEffect(() => {
        api.get('/users?status=active&limit=100').then(res => setEmployees(res.data || []));
    }, []);

    useEffect(() => {
        fetchAllAdvances(repaymentMonth);
    }, [repaymentMonth]);

    const fetchAllAdvances = async (month: string) => {
        try {
            const res = await getAllAdvancesForMonth(month);
            setAllAdvances(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            fetchAdvances(selectedUser, repaymentMonth);
        }
    }, [selectedUser, repaymentMonth]);

    const fetchAdvances = async (employeeId: string, month: string) => {
        try {
            const res = await getEmployeeMonthlyAdvances(employeeId, month);
            setRecentAdvances(res.data || []);
        } catch (e) {
            setRecentAdvances([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !amount || !date) return;

        try {
            await createAdvance({
                employeeId: selectedUser,
                amount: Number(amount),
                date,
                remarks,
                repaymentMonth
            });
            toast.success('Advance Recorded successfully');
            setAmount('');
            setRemarks('');
            fetchAdvances(selectedUser, repaymentMonth);
            fetchAllAdvances(repaymentMonth);
        } catch (error: any) {
            toast.error(error.message || 'Failed to record advance');
        }
    };

    const totalMonthlyAdvances = recentAdvances.reduce((sum, adv) => sum + adv.amount, 0);

    const exportCSV = () => {
        if (!allAdvances.length) return toast.warning('No data to export');
        const headers = 'Employee Name,Employee ID,Disbursement Date,Repayment Month,Amount,Status,Remarks\n';
        const rows = allAdvances.map(a => 
            `"${a.employeeId?.name || '-'}","${a.employeeId?.empId || '-'}","${new Date(a.date).toLocaleDateString()}","${a.repaymentMonth}","${a.amount}","${a.isRepaid ? 'Deducted' : 'Pending'}","${a.remarks || '-'}"`
        ).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Advances_${repaymentMonth}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Wallet className="text-primary-600" size={26} /> Salary Advances</h1>
                <p className="text-sm text-gray-500 mt-1">Record disbursements and set repayment schedules</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Select Employee</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            >
                                <option value="">-- Select --</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Repayment Month</label>
                            <input
                                type="month"
                                value={repaymentMonth}
                                onChange={(e) => setRepaymentMonth(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold text-primary-700"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Disbursement Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-2.5 text-gray-500 font-medium">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    placeholder="e.g. 5000"
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Remarks (Optional)</label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Medical emergency, etc."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>

                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
                            disabled={!selectedUser}
                        >
                            Record Advance
                        </button>
                    </div>
                </form>
            </div>

            {recentAdvances.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="text-gray-500" size={18} />
                            <h3 className="font-semibold text-gray-700">History for {repaymentMonth}</h3>
                        </div>
                        <span className="font-bold text-red-600 bg-red-50 py-1 px-3 rounded-full text-sm">
                            Total: ₹{totalMonthlyAdvances.toLocaleString()}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap min-w-full">
                            <thead className="bg-gray-50/50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentAdvances.map((adv: any) => (
                                    <tr key={adv._id}>
                                        <td className="px-4 py-3">{new Date(adv.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium text-red-600">-₹{adv.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${adv.isRepaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {adv.isRepaid ? 'Deducted' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{adv.remarks || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Global Extracted Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Table2 className="text-gray-500" size={18} />
                        <h3 className="font-semibold text-gray-700">All Advances for {repaymentMonth}</h3>
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
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allAdvances.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No advances recorded for this month.</td>
                                </tr>
                            ) : (
                                allAdvances.map((adv) => (
                                    <tr key={adv._id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {adv.employeeId?.name || '-'} <span className="text-gray-400 font-normal ml-1">({adv.employeeId?.empId || '-'})</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(adv.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-bold text-red-600">-₹{adv.amount?.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${adv.isRepaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {adv.isRepaid ? 'Deducted' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{adv.remarks || '-'}</td>
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
