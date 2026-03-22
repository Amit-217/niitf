import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, User2, Download, Table2, Settings2 } from 'lucide-react';
import {
    createSalaryConfig,
    getCurrentSalaryConfig,
    getAllSalaryConfigs,
    getSalaryHistory,
    toggleSalaryConfig
} from '../../../api/payrollApi';
import api from '../../../api/axios';

interface User {
    _id: string;
    name: string;
    empId: string;
}

export const SalaryConfigPage = () => {
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
    const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
    const [currentSalary, setCurrentSalary] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [allConfigs, setAllConfigs] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Employees
        api.get('/users?status=active&limit=100').then(res => setEmployees(res.data || []));
        fetchAllConfigs();
    }, []);

    const fetchAllConfigs = async () => {
        try {
            const res = await getAllSalaryConfigs();
            setAllConfigs(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            fetchCurrentSalary(selectedUser);
            fetchHistory(selectedUser);
        } else {
            setCurrentSalary(null);
            setHistory([]);
        }
    }, [selectedUser]);

    const fetchCurrentSalary = async (employeeId: string) => {
        try {
            const res = await getCurrentSalaryConfig(employeeId);
            setCurrentSalary(res.data);
        } catch (e) {
            setCurrentSalary(null); // No active salary
        }
    };

    const fetchHistory = async (employeeId: string) => {
        setLoadingHistory(true);
        try {
            const res = await getSalaryHistory(employeeId);
            setHistory(res.data || []);
        } catch (e) {
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await toggleSalaryConfig(id);
            toast.success('Status updated');
            if (selectedUser) {
                fetchCurrentSalary(selectedUser);
                fetchHistory(selectedUser);
            }
            fetchAllConfigs();
        } catch (error: any) {
            toast.error('Failed to toggle status');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !monthlySalary || !effectiveFrom) {
            return toast.warning('Please fill all fields');
        }

        try {
            await createSalaryConfig({
                employeeId: selectedUser,
                monthlySalary: Number(monthlySalary),
                effectiveFrom,
                repaymentMonth: '' // Not used here but matches type if needed
            } as any);
            toast.success('Salary Configuration Updated!');
            fetchCurrentSalary(selectedUser);
            fetchHistory(selectedUser);
            fetchAllConfigs();
            setMonthlySalary('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update salary');
        }
    };

    const exportCSV = () => {
        if (!allConfigs.length) return toast.warning('No data to export');
        const headers = 'Employee Name,Employee ID,Monthly Salary,Effective From,Status\n';
        const rows = allConfigs.map(c => 
            `"${c.employeeId?.name || '-'}","${c.employeeId?.empId || '-'}","${c.monthlySalary}","${new Date(c.effectiveFrom).toLocaleDateString()}","${c.isActive ? 'Active' : 'Inactive'}"`
        ).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `All_Salary_Configs.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Settings2 className="text-primary-600" size={26} /> Salary Configuration</h1>
                <p className="text-sm text-gray-500 mt-1">Manage base salaries for employees</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Select Employee</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                                required
                            >
                                <option value="">-- Select an employee --</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.empId})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Effective From Date</label>
                            <input
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">New Monthly Salary (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-2 text-gray-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={monthlySalary}
                                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                                    placeholder="e.g. 50000"
                                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold text-primary-900"
                                    required
                                />
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-md shadow-primary-100 active:scale-95 duration-100"
                            disabled={!selectedUser}
                        >
                            <Plus size={18} />
                            Set Active Configuration
                        </button>
                    </div>
                </form>
            </div>

            {selectedUser && currentSalary && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                            <User2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-emerald-900 font-black flex items-center gap-2 uppercase tracking-tight">
                                Current Active Salary
                            </h3>
                            <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-wide">
                                Effective since {new Date(currentSalary.effectiveFrom).toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-emerald-700 tracking-tighter">₹{currentSalary.monthlySalary?.toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-500 mt-1 uppercase font-black tracking-widest">
                            Configured by {currentSalary.createdBy?.name}
                        </p>
                    </div>
                </div>
            )}

            {selectedUser && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Salary History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left font-black text-[10px] uppercase tracking-wider">Effective Date</th>
                                    <th className="px-6 py-4 text-center font-black text-[10px] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right font-black text-[10px] uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loadingHistory ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic font-medium animate-pulse">Loading salary history...</td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic font-medium">No previous configurations found</td>
                                    </tr>
                                ) : history.map((record: any) => (
                                    <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-gray-800">₹{record.monthlySalary?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-500 font-bold text-xs">
                                            {new Date(record.effectiveFrom).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                                                record.isActive 
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                                : 'bg-gray-100 text-gray-500 border-gray-200 opacity-60'
                                            }`}>
                                                {record.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleToggleStatus(record._id)}
                                                className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all border uppercase tracking-widest ${
                                                    record.isActive 
                                                    ? 'text-gray-400 border-gray-100 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50' 
                                                    : 'text-primary-600 border-primary-100 bg-primary-50 hover:bg-primary-600 hover:text-white hover:border-primary-600'
                                                }`}
                                            >
                                                {record.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Global Extracted Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Table2 className="text-gray-500" size={18} />
                        <h3 className="font-semibold text-gray-700">All Active Profiles</h3>
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
                                <th className="px-4 py-3">Emp ID</th>
                                <th className="px-4 py-3">Monthly Salary</th>
                                <th className="px-4 py-3">Effective From</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allConfigs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No active salary configurations found.</td>
                                </tr>
                            ) : (
                                allConfigs.map((c) => (
                                    <tr key={c._id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{c.employeeId?.name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{c.employeeId?.empId || '-'}</td>
                                        <td className="px-4 py-3 font-bold text-primary-700">₹{c.monthlySalary?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(c.effectiveFrom).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {c.isActive ? 'Active' : 'Inactive'}
                                            </span>
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
