import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Calculator,
  CreditCard,
  Eye,
  X,
  TrendingUp,
  Users,
  Loader2,
  Info,
  Trash2,
} from "lucide-react";
import {
  generateSalary,
  previewSalary,
  getAllSalaryRecordsForMonth,
  getSalaryConfigByDate,
  deleteSalaryRecord,
} from "../../../api/payrollApi";
import api from "../../../api/axios";

interface SalaryRecord {
  _id: string;
  employeeId: any;
  month: string;
  baseSalary: number;
  grossSalary?: number;
  overtimeUnits: number;
  overtimeAmount: number;
  absentDays: number;
  deductionAmount: number;
  standardDeduction: number;
  advanceTotal: number;
  bonusAmount?: number;
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
  const navigate = useNavigate();

  const getCurrentMonthLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth() + 1;
    return `${year}-${String(monthIndex).padStart(2, "0")}`;
  };

  const [month, setMonth] = useState(getCurrentMonthLocal()); // Default to current month (local)
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [previews, setPreviews] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatePayrollOpen, setIsCreatePayrollOpen] = useState(false);

  const handleOpenInfo = (record: any) => {
    const empId = record.employeeId?._id || record.employeeId;
    const empName = record.employeeId?.name || record.employeeDetails?.name;
    const empIdStr = record.employeeId?.empId || record.employeeDetails?.empId;
    navigate(`/admin/payroll/employee/${empId}/detail`, {
      state: { employee: { name: empName, empId: empIdStr } },
    });
  };

  // For bulk generation modal/logic
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedGenEmployee, setSelectedGenEmployee] = useState("");
  const [advanceDeduction, setAdvanceDeduction] = useState<number | "">(0);
  const [standardDeduction, setStandardDeduction] = useState<number | "">(0);
  const [bonusAmount, setBonusAmount] = useState<number | "">(0);
  const [outstandingAdvance, setOutstandingAdvance] = useState(0);
  const [selectedEmpBaseSalary, setSelectedEmpBaseSalary] = useState<
    number | null
  >(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (selectedGenEmployee) {
      const fetchEmployeeData = async () => {
        try {
          const [advRes, salRes]: any[] = await Promise.all([
            api.get(`/admin/advance/outstanding/${selectedGenEmployee}`),
            // Salary-config endpoint accepts YYYY-MM, but we pass an explicit date for clarity.
            getSalaryConfigByDate(selectedGenEmployee, `${month}-01`),
          ]);
          setOutstandingAdvance(advRes.data?.totalOutstanding || 0);
          setSelectedEmpBaseSalary(salRes.data?.data?.monthlySalary || null);
          setAdvanceDeduction(0);
          setStandardDeduction(0);
        } catch (e) {
          setOutstandingAdvance(0);
          setSelectedEmpBaseSalary(null);
        }
      };
      fetchEmployeeData();
    } else {
      setOutstandingAdvance(0);
      setSelectedEmpBaseSalary(null);
      setAdvanceDeduction(0);
    }
  }, [selectedGenEmployee, month]);

  useEffect(() => {
    const loadPageData = async () => {
      setIsLoadingRecords(true);
      try {
        // Fetch basic data in parallel
        const empRes: any = await api.get("/users?status=active&limit=100");
        const attRes: any = await api.get(
          `/admin/attendance/month?month=${month}`,
        );

        const loadedEmployees = empRes.data || empRes || [];
        const loadedAttendance = attRes.data || attRes || [];

        setEmployees(loadedEmployees);
        setMonthlyAttendance(loadedAttendance);

        // Now fetch records and previews
        await fetchMonthRecords(loadedEmployees);
      } catch (err) {
        toast.error("Failed to load page data");
      } finally {
        setIsLoadingRecords(false);
      }
    };

    loadPageData();
  }, [month]);

  const fetchMonthRecords = async (currentEmployees?: any[]) => {
    const targetEmployees = currentEmployees || employees;
    if (!targetEmployees.length) return;

    setPreviews([]);
    try {
        const res: any = await getAllSalaryRecordsForMonth(month);
        const existingRecords = res.data || res || [];
        setRecords(Array.isArray(existingRecords) ? existingRecords : []);

        const previewPromises = targetEmployees.map(async (emp) => {
          const hasRecord = existingRecords.some((r: any) => {
            const rId = r.employeeId?._id || r.employeeId;
            return rId === emp._id;
          });

          if (!hasRecord) {
            try {
              const pRes: any = await previewSalary(emp._id, month);
              const details = pRes.data || pRes;
              return {
                ...details,
                isPreview: true,
                _id: `preview-${emp._id}`,
                status: "LIVE_BALANCE",
              };
            } catch (e) {
              console.error(`Preview failed for ${emp.name}:`, e);
              return null;
            }
          }
          return null;
        });
        const fetchedPreviews = (await Promise.all(previewPromises)).filter(
          Boolean,
        );
        setPreviews(fetchedPreviews);
      } catch (error) {
        console.error("Fetch records error:", error);
      }
    };

  const getDaysInMonth = (monthValue: string) => {
    const [year, monthNumber] = monthValue.split("-").map(Number);
    if (!year || !monthNumber) return 30;
    return new Date(year, monthNumber, 0).getDate();
  };

  const getAttendanceSummary = (employeeId: string): AttendanceSummary => {
    const daysInMonth = getDaysInMonth(month);
    const items = monthlyAttendance.filter((item: any) => {
      const id = item.employeeId?._id || item.employeeId;
      return id === employeeId;
    });

    const counts = items.reduce((acc: Record<string, number>, item: any) => {
      const status = item.status || "NOT_MARKED";
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

  const formatMonthLabel = (value: string) =>
    new Date(`${value}-01T00:00:00Z`).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

  const totalNetPayout = [...(records || []), ...(previews || [])].reduce(
    (s, r) => s + (Number(r?.netSalary) || 0),
    0,
  );

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
        advanceDeduction: Number(advanceDeduction || 0),
        standardDeduction: Number(standardDeduction || 0),
        bonusAmount: Number(bonusAmount || 0),
      });
      toast.success("Salary generated successfully");
      setStandardDeduction(0);
      setBonusAmount(0);
      fetchMonthRecords();
    } catch (error: any) {
      toast.error(error.message || error || "Failed to generate salary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this salary record? Associated advance deductions will be reverted.")) return;
    try {
      await deleteSalaryRecord(id);
      toast.success("Salary record deleted successfully");
      fetchMonthRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete record");
    }
  };

  const totalEmployees = employees.length;
  const daysInThisMonth = getDaysInMonth(month);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-primary-600 shrink-0" size={22} />
            Payroll Records
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500 font-medium">
              {formatMonthLabel(month)}
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300"></span>
            <span className="hidden sm:inline text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-gray-200">
              {daysInThisMonth} Days Logic
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer shadow-sm"
          />
          <button
            type="button"
            onClick={() => setIsCreatePayrollOpen(true)}
            className="px-3 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-1.5"
          >
            <Calculator size={15} />
            <span className="hidden sm:inline">Create Payroll</span>
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Total Estimated Payout
            </p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">
              ₹{Math.round(totalNetPayout).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Total Employees
            </p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">
              {totalEmployees}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Calculator size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Cycle Configuration
            </p>
            <p className="text-base font-black text-emerald-700 mt-0.5">
              {daysInThisMonth} Days / Fixed OT
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                  Employee
                </th>
                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                  Attendance
                </th>
                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                  Earnings
                </th>
                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                  Deductions
                </th>
                <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                  Net Payout
                </th>
                <th className="px-4 py-4 text-center font-bold uppercase tracking-widest text-[10px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoadingRecords ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    <Loader2 className="animate-spin inline-block" />
                  </td>
                </tr>
              ) : records.length === 0 && previews.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8 text-gray-500 font-medium"
                  >
                    No records found for this month
                  </td>
                </tr>
              ) : (
                [...records, ...previews].map((record: any) => (
                  <tr
                    key={record._id}
                    className={`hover:bg-gray-50/50 transition-colors ${record.status === "PAID" ? "bg-emerald-50/10" : ""} ${record.isPreview ? "opacity-70 grayscale-[0.3]" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-black text-xs uppercase">
                          {record.employeeId?.name
                            ? record.employeeId.name.charAt(0)
                            : record.employeeDetails?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 leading-tight flex items-center gap-2">
                            {record.employeeId?.name ||
                              record.employeeDetails?.name ||
                              "Unknown"}
                            {record.isPreview && (
                              <span className="flex items-center gap-1 text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-amber-100 font-black animate-pulse">
                                <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                                Live
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {record.employeeId?.empId ||
                              record.employeeDetails?.empId ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {(() => {
                        const summary = getAttendanceSummary(
                          record.employeeId?._id || record.employeeId,
                        );
                        return (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">
                                P {summary.presentDays}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-100">
                                L {summary.leaveDays}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-black border border-red-100">
                                A {summary.absentDays}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-black border border-sky-100">
                                H {summary.holidayDays}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-black border border-gray-200">
                                NM {summary.notMarkedDays}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                              {summary.payableDays} payable / {summary.daysInMonth} days
                            </p>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-bold text-gray-700">
                        ₹{(record.baseSalary || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600">
                        + ₹{(record.overtimeAmount || 0).toLocaleString()} (OT)
                      </div>
                      {record.bonusAmount > 0 && (
                        <div className="text-[10px] font-bold text-emerald-600">
                          + ₹{(record.bonusAmount || 0).toLocaleString()} (Bonus)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                        - ₹{(record.deductionAmount || 0).toLocaleString()}{" "}
                        <span className="text-[8px] opacity-70">
                          ({record.absentDays}A)
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-blue-600">
                        - ₹{(record.standardDeduction || 0).toLocaleString()}{" "}
                        <span className="text-[8px] opacity-70">(Standard Deduction)</span>
                      </div>
                      <div className="text-[10px] font-bold text-amber-600">
                        - ₹{(record.advanceTotal || 0).toLocaleString()}{" "}
                        <span className="text-[8px] opacity-70">(Advance)</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-black text-primary-700 text-base">
                      ₹{Math.round(record.netSalary || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenInfo(record)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Salary & Advance Details"
                        >
                          <Info size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const normalizedRecord = record.isPreview
                              ? {
                                  ...record,
                                  employeeId: {
                                    _id: record.employeeId,
                                    name: record.employeeDetails.name,
                                    empId: record.employeeDetails.empId,
                                    email: record.employeeDetails.email,
                                  },
                                }
                              : record;
                            navigate("/admin/payroll/slip", {
                              state: {
                                record: normalizedRecord,
                                attendanceSummary: getAttendanceSummary(
                                  normalizedRecord.employeeId?._id ||
                                    normalizedRecord.employeeId,
                                ),
                                monthLabel: formatMonthLabel(
                                  normalizedRecord.month || month,
                                ),
                              },
                            });
                          }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {!record.isPreview && (
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsCreatePayrollOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-5 py-4 sm:px-6 sm:py-5 text-white flex items-start justify-between gap-4 shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary-100 font-black">
                  Create Payroll
                </p>
                <h3 className="text-lg sm:text-xl font-black mt-1">
                  Generate salary for {formatMonthLabel(month)}
                </h3>
                <p className="text-primary-100 text-xs sm:text-sm mt-1">
                  Select an employee and create payroll for the chosen month.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePayrollOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Select Employee
                </label>
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
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Month
                </label>
                <div className="w-full p-3 border border-gray-200 rounded-2xl bg-gray-50 text-sm font-bold text-gray-700">
                  {formatMonthLabel(month)}
                </div>
              </div>

              {/* Payable Days + Amount for selected employee */}
              {selectedGenEmployee &&
                (() => {
                  const summary = getAttendanceSummary(selectedGenEmployee);
                  const isFullMonth =
                    summary.payableDays >= summary.daysInMonth;
                  const payableAmount =
                    selectedEmpBaseSalary != null
                      ? isFullMonth
                        ? selectedEmpBaseSalary
                        : (selectedEmpBaseSalary / summary.daysInMonth) *
                          summary.payableDays
                      : null;
                  return (
                    <div
                      className={`rounded-2xl border p-4 space-y-2 ${isFullMonth ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                          Payable Days
                        </span>
                        <span
                          className={`text-sm font-black ${isFullMonth ? "text-emerald-700" : "text-primary-700"}`}
                        >
                          {summary.payableDays} / {summary.daysInMonth}
                          {isFullMonth && (
                            <span className="ml-2 text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Full Month
                            </span>
                          )}
                        </span>
                      </div>
                      {payableAmount != null && (
                        <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2">
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                            Payable Amount
                          </span>
                          <span
                            className={`text-base font-black ${isFullMonth ? "text-emerald-700" : "text-primary-700"}`}
                          >
                            ₹{Math.round(payableAmount).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">
                  Standard Deduction
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={standardDeduction}
                    onChange={(e) => setStandardDeduction(Number(e.target.value))}
                    placeholder="Enter deduction amount..."
                    className="w-full pl-7 pr-4 py-2.5 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-gray-700 bg-white"
                  />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Bonus Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    placeholder="Enter bonus amount..."
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 font-black text-gray-700 bg-white"
                  />
                </div>
              </div>
              <div
                className={`bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3 ${outstandingAdvance === 0 ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
                    Total Outstanding Advance
                  </label>
                  <span className="text-sm font-black text-amber-700">
                    ₹{outstandingAdvance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-2">
                    Deduct for this month
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      max={outstandingAdvance}
                      value={advanceDeduction}
                      disabled={outstandingAdvance === 0}
                      onChange={(e) =>
                        setAdvanceDeduction(Number(e.target.value))
                      }
                      placeholder="Enter amount to deduct..."
                      className="w-full pl-7 pr-4 py-2.5 border border-amber-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 font-black text-gray-700 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW SECTION */}
              {selectedGenEmployee && (() => {
                const previewData = previews.find(p => (p.employeeId?._id || p.employeeId) === selectedGenEmployee);
                if (previewData) {
                  const dynamicGross = (previewData.baseSalary || 0) + (previewData.overtimeAmount || 0) + Number(bonusAmount || 0);
                  const dynamicNet = Math.max(0, dynamicGross - (previewData.deductionAmount || 0) - Number(standardDeduction || 0) - Number(advanceDeduction || 0));
                  return (
                    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">
                          Live Net Salary Preview
                        </span>
                        <span className="text-lg font-black text-primary-700">
                          ₹{Math.round(dynamicNet).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs font-bold">
                        <span className="text-emerald-600">+ Gross: ₹{Math.round(dynamicGross).toLocaleString()}</span>
                        {Number(bonusAmount) > 0 && <span className="text-emerald-600">+ Bonus: ₹{Math.round(Number(bonusAmount)).toLocaleString()}</span>}
                        <span className="text-red-600">- Absent/Leave: ₹{Math.round(previewData.deductionAmount).toLocaleString()}</span>
                        {Number(standardDeduction) > 0 && <span className="text-blue-600">- Std Ded: ₹{Math.round(Number(standardDeduction)).toLocaleString()}</span>}
                        {Number(advanceDeduction) > 0 && <span className="text-amber-600">- Advance: ₹{Math.round(Number(advanceDeduction)).toLocaleString()}</span>}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-3 pt-2 pb-1">
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
                  {isGenerating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Calculator size={16} />
                  )}
                  Create Payroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
