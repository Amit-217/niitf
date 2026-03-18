import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, User2, Download, Table2, Settings2 } from 'lucide-react';
import {
    createSalaryConfig,
    getCurrentSalaryConfig,
    getAllSalaryConfigs
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
    const [allConfigs, setAllConfigs] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Employees
        api.get('/users?role=EMPLOYEE').then(res => setEmployees(res.data || []));
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
        } else {
            setCurrentSalary(null);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !monthlySalary || !effectiveFrom) {
            return toast.warning('Please fill all fields');
        }

        try {
            await createSalaryConfig({
                employeeId: selectedUser,
                monthlySalary: Number(monthlySalary),
                effectiveFrom
            });
            toast.success('Salary Configuration Updated!');
            fetchCurrentSalary(selectedUser);
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">New Monthly Salary (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-2.5 text-gray-500 font-medium">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={monthlySalary}
                                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                                    placeholder="e.g. 50000"
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
                            disabled={!selectedUser}
                        >
                            <Plus size={18} />
                            Set Salary Configuration
                        </button>
                    </div>
                </form>
            </div>

            {/* Current Active Salary Card */}
            {selectedUser && currentSalary && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-emerald-800 font-semibold mb-1 flex items-center gap-2">
                            <User2 size={16} /> Current Active Salary
                        </h3>
                        <p className="text-sm text-emerald-600">
                            Effective since {new Date(currentSalary.effectiveFrom).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-700">₹{currentSalary.monthlySalary?.toLocaleString()}</p>
                        <p className="text-xs text-emerald-600 mt-1">Configured by {currentSalary.createdBy?.name}</p>
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
