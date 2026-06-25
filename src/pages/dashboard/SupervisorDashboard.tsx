import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, ListTodo, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getAttendanceByDate } from '../../api/payrollApi';
import { getAllTasks } from '../../api/taskApi';

interface Employee {
  _id: string;
  name: string;
  empId: string;
  role: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'CUTOFF' | null;

interface AttendanceRecord {
  _id: string;
  employeeId: Employee | string;
  date: string;
  status: AttendanceStatus;
}

interface EmployeeRow {
  employee: Employee;
  status: AttendanceStatus;
}

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-100 text-red-700 border-red-200',
  LEAVE: 'bg-amber-100 text-amber-700 border-amber-200',
  HOLIDAY: 'bg-blue-100 text-blue-700 border-blue-200',
  CUTOFF: 'bg-purple-100 text-purple-700 border-purple-200',
};

const STATUS_DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-500',
  ABSENT: 'bg-red-500',
  LEAVE: 'bg-amber-500',
  HOLIDAY: 'bg-blue-500',
  CUTOFF: 'bg-purple-500',
};

export const SupervisorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user?.userId || user?.id || user?._id || '';
  const today = new Date().toISOString().split('T')[0];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<EmployeeRow[]>([]);
  const [myTaskCount, setMyTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, attendanceRes, tasksRes]: any[] = await Promise.all([
          api.get('/users?status=active&limit=500'),
          getAttendanceByDate(today),
          getAllTasks(),
        ]);

        const empList: Employee[] = usersRes.data || [];
        setEmployees(empList);

        const records: AttendanceRecord[] = attendanceRes.data || [];

        const rows: EmployeeRow[] = empList.map((emp) => {
          const record = records.find((r) => {
            const eid = typeof r.employeeId === 'string' ? r.employeeId : r.employeeId?._id;
            return eid === emp._id;
          });
          return { employee: emp, status: record?.status ?? null };
        });
        setAttendanceRows(rows);

        // My active tasks
        const allTasks =
          tasksRes.data?.data || (Array.isArray(tasksRes.data) ? tasksRes.data : []);
        const myActive = allTasks.filter((task: any) => {
          const isAssigned = (task.assignedTo || []).some(
            (emp: any) => String(emp?._id || emp) === String(currentUserId),
          );
          return isAssigned && (task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS');
        });
        setMyTaskCount(myActive.length);
      } catch (error) {
        console.error('Failed to fetch supervisor dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId, today]);

  const totalUsers = employees.length;
  const totalPresent = attendanceRows.filter((r) => r.status === 'PRESENT').length;
  const totalAbsent = attendanceRows.filter((r) => r.status === 'ABSENT').length;

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
          Welcome back, {user?.name || 'Supervisor'}. Here is today's overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/supervisor/attendance')}
          className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 font-medium">Total Users</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-800">{totalUsers}</span>
        </div>

        <div
          onClick={() => navigate('/supervisor/attendance')}
          className="glass-card rounded-xl p-5 border-l-4 border-l-emerald-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 font-medium">Present Today</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-800">{totalPresent}</span>
        </div>

        <div
          onClick={() => navigate('/supervisor/attendance')}
          className="glass-card rounded-xl p-5 border-l-4 border-l-red-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 font-medium">Absent Today</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <XCircle size={20} />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-800">{totalAbsent}</span>
        </div>

        <div
          onClick={() => navigate('/supervisor/my-tasks')}
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

      {/* Employee Attendance List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Users size={18} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800">Employee Attendance</h2>
          <span className="text-sm text-gray-400">
            {new Date(today).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {attendanceRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3 opacity-30" />
            <p>No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Emp ID</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendanceRows.map(({ employee, status }) => (
                  <tr
                    key={employee._id}
                    onClick={() => navigate('/supervisor/attendance')}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 font-bold flex items-center justify-center border border-primary-100 text-sm shrink-0">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{employee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                      {employee.empId || '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-500 capitalize text-xs">
                      {employee.role?.replace(/_/g, ' ').toLowerCase() || '—'}
                    </td>
                    <td className="px-6 py-3">
                      {status ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-400 border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          Unmarked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t border-gray-100 text-right">
          <button
            onClick={() => navigate('/supervisor/attendance')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Manage →
          </button>
        </div>
      </div>
    </div>
  );
};
