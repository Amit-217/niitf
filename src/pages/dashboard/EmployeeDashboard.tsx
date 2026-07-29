import React, { useState, useEffect } from 'react';
import { Building2, ListTodo, FileText, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getCustomers } from '../../api/customerApi';
import { getAllTasks } from '../../api/taskApi';

interface RecentReport {
  _id: string;
  reportType: string;
  reportNo?: string;
  irNo?: string;
  customerId?: { companyName: string };
  status: 'draft' | 'final';
  createdAt: string;
}

const TYPE_SLUG: Record<string, string> = {
  MPT: 'mpt',
  PT: 'pt',
  UT: 'ut',
  UTG: 'utg',
  AWSD: 'awsd',
  TPIIVR: 'tpi-ivr',
  'VSSC-UT': 'vssc-ut',
};

const TYPE_COLORS: Record<string, string> = {
  MPT: 'bg-blue-100 text-blue-700',
  PT: 'bg-purple-100 text-purple-700',
  UT: 'bg-orange-100 text-orange-700',
  UTG: 'bg-teal-100 text-teal-700',
  AWSD: 'bg-rose-100 text-rose-700',
  TPIIVR: 'bg-yellow-100 text-yellow-700',
  'VSSC-UT': 'bg-indigo-100 text-indigo-700',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user?.userId || user?.id || user?._id || '';
  const basePath = user?.role === 'SUPERVISOR' ? 'supervisor' : 'employee';

  const [customerCount, setCustomerCount] = useState(0);
  const [myTaskCount, setMyTaskCount] = useState(0);
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, tasksRes, reportsRes]: any[] = await Promise.all([
          getCustomers({ limit: 1 }),
          getAllTasks(),
          api.get('/dashboard/recent-reports'),
        ]);

        // Customer count from pagination total
        // Note: axios interceptor unwraps response.data, so customersRes IS the body
        // Backend shape: { success, data: [...customers], pagination: { total: N } }
        const total =
          customersRes.pagination?.total ??
          customersRes.total ??
          (Array.isArray(customersRes.data) ? customersRes.data.length : 0);
        setCustomerCount(total);

        // My active tasks (ASSIGNED or IN_PROGRESS assigned to current user)
        const allTasks =
          tasksRes.data?.data || (Array.isArray(tasksRes.data) ? tasksRes.data : []);
        const myActive = allTasks.filter((task: any) => {
          const isAssigned = (task.assignedTo || []).some(
            (emp: any) => String(emp?._id || emp) === String(currentUserId),
          );
          return isAssigned && (task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS');
        });
        setMyTaskCount(myActive.length);

        setReports(reportsRes.data?.reports || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.name || 'User'}. Here is your overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => navigate(`/${basePath}/customers`)}
          className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 font-medium">Total Customers</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 size={20} />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-800">{customerCount}</span>
        </div>

        <div
          onClick={() => navigate(`/${basePath}/my-tasks`)}
          className="glass-card rounded-xl p-5 border-l-4 border-l-violet-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 font-medium">My Active Tasks</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <ListTodo size={20} />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-800">{myTaskCount}</span>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <FileText size={18} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800">Recent Reports</h2>
          <span className="text-sm text-gray-400">Last 10 reports</span>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={40} className="mb-3 opacity-30" />
            <p>No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-6 py-3 font-semibold">Report No</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-primary-700">
                      {r.reportNo || r.irNo || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLORS[r.reportType] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {r.reportType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {r.customerId?.companyName || '—'}
                    </td>
                    <td className="px-6 py-3">
                      {r.status === 'final' ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          Final
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() =>
                          navigate(
                            `/admin/reports/${TYPE_SLUG[r.reportType]}/${r._id}/print`,
                          )
                        }
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye size={16} className="inline mr-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t border-gray-100 text-right">
          <button
            onClick={() => navigate(`/${basePath}/reports`)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All →
          </button>
        </div>
      </div>
    </div>
  );
};
