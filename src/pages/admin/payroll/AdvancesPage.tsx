import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Wallet, Download, Table2, Eye, X, Loader2 } from "lucide-react";
import {
  createAdvance,
  getEmployeeMonthlyAdvances,
  getAllAdvances,
  getEmployeeAdvanceHistory,
} from "../../../api/payrollApi";
import api from "../../../api/axios";
import { Pagination } from "../../../components/Pagination";

interface User {
  _id: string;
  name: string;
  empId: string;
}

interface Advance {
  _id: string;
  employeeId?: { _id?: string; name?: string; empId?: string };
  date: string;
  amount: number;
  repaidAmount?: number;
  repaidDate?: string;
  updatedAt?: string;
  status?: string;
  remarks?: string;
}

export const AdvancesPage = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [remarks, setRemarks] = useState("");

  const [recentAdvances, setRecentAdvances] = useState<any[]>([]);
  const [allAdvances, setAllAdvances] = useState<any[]>([]);

  // Separate month filter for the "All Advances" table
  const [viewMonth] = useState<string>(
    new Date().toISOString().substring(0, 7),
  );

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // History modal state
  const [historyEmp, setHistoryEmp] = useState<{
    name?: string;
    empId?: string;
  } | null>(null);
  const [historyData, setHistoryData] = useState<Advance[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res) => setEmployees(res.data || []));
  }, []);

  useEffect(() => {
    fetchAllAdvances();
    setPage(1);
  }, []);

  const fetchAllAdvances = async () => {
    try {
      const res = await getAllAdvances();
      setAllAdvances(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchAdvances(selectedUser, viewMonth);
    }
  }, [selectedUser, viewMonth]);

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
      });
      toast.success("Advance Recorded successfully");
      setAmount("");
      setRemarks("");
      fetchAdvances(selectedUser, viewMonth);
      fetchAllAdvances();
    } catch (error: any) {
      toast.error(error.message || "Failed to record advance");
    }
  };

  const openHistory = async (adv: Advance) => {
    const empId = adv.employeeId?._id;
    if (!empId) return;
    setHistoryEmp(adv.employeeId ?? null);
    setHistoryData([]);
    setHistoryLoading(true);
    try {
      const res = await getEmployeeAdvanceHistory(empId);
      setHistoryData(res.data || []);
    } catch {
      toast.error("Failed to load advance history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const totalMonthlyAdvances = recentAdvances.reduce(
    (sum, adv) => sum + adv.amount,
    0,
  );

  // Client-side pagination
  const totalAdvances = allAdvances.length;
  const totalPages = Math.ceil(totalAdvances / limit);
  const paginatedAdvances = allAdvances.slice((page - 1) * limit, page * limit);

  const exportCSV = () => {
    if (!allAdvances.length) return toast.warning("No data to export");
    const headers =
      "Employee Name,Employee ID,Disbursement Date,Amount,Status,Remarks\n";
    const rows = allAdvances
      .map(
        (a) =>
          `"${a.employeeId?.name || "-"}","${a.employeeId?.empId || "-"}","${new Date(a.date).toLocaleDateString()}","${a.amount}","${a.status || "Pending"}","${a.remarks || "-"}"`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Advances_All.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const totalHistoryAmount = historyData.reduce((s, a) => s + a.amount, 0);
  const totalHistoryPaid = historyData.reduce(
    (s, a) => s + (a.repaidAmount || 0),
    0,
  );
  const totalHistoryBalance = totalHistoryAmount - totalHistoryPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="text-primary-600" size={26} /> Salary Advances
        </h1>
        <p className="hidden sm:block text-sm text-gray-500 mt-1">
          Record disbursements and set repayment schedules
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Select Employee
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">-- Select --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Disbursement Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-500 font-medium">
                  ₹
                </span>
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Remarks (Optional)
              </label>
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
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
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
              <h3 className="font-semibold text-gray-700">
                History for {viewMonth}
              </h3>
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
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAdvances.map((adv: any) => (
                  <tr key={adv._id}>
                    <td className="px-4 py-3">
                      {new Date(adv.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      ₹{adv.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">
                      ₹{(adv.repaidAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-600 font-bold">
                      ₹{(adv.amount - (adv.repaidAmount || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          adv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : adv.status === "PARTIAL"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {adv.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {adv.remarks || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Advances Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table2 className="text-gray-500" size={18} />
            <h3 className="font-semibold text-gray-700">All Advances</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-full">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allAdvances.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No advances recorded.
                  </td>
                </tr>
              ) : (
                paginatedAdvances.map((adv) => (
                  <tr key={adv._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {adv.employeeId?.name || "-"}{" "}
                      <span className="text-gray-400 font-normal ml-1">
                        ({adv.employeeId?.empId || "-"})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(adv.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      ₹{adv.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">
                      ₹{(adv.repaidAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-600 font-bold">
                      ₹{(adv.amount - (adv.repaidAmount || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          adv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : adv.status === "PARTIAL"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {adv.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {adv.remarks || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openHistory(adv)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                        title="View History"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={totalAdvances}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Advance History Modal */}
      {historyEmp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setHistoryEmp(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Wallet size={18} className="text-primary-600" />
                  Advance History —{" "}
                  <span className="text-primary-600">{historyEmp.name}</span>
                  <span className="text-gray-400 font-normal text-sm">
                    ({historyEmp.empId})
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setHistoryEmp(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Cards */}
            {!historyLoading && historyData.length > 0 && (
              <div className="grid grid-cols-3 gap-3 px-5 pt-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-xs text-gray-500 mb-0.5">Total Advance</p>
                  <p className="font-bold text-gray-900 text-sm">
                    ₹{totalHistoryAmount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                  <p className="text-xs text-emerald-600 mb-0.5">Total Paid</p>
                  <p className="font-bold text-emerald-700 text-sm">
                    ₹{totalHistoryPaid.toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                  <p className="text-xs text-red-500 mb-0.5">Outstanding</p>
                  <p className="font-bold text-red-600 text-sm">
                    ₹{totalHistoryBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-y-auto flex-1 px-5 pb-5 pt-3">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Loading history…</span>
                </div>
              ) : historyData.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">
                  No advance records found for this employee.
                </p>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="py-2 pr-4">#</th>
                      <th className="py-2 pr-4">Disbursed On</th>
                      <th className="py-2 pr-4">Repaid On</th>
                      <th className="py-2 pr-4">Repaid Amount</th>
                      <th className="py-2 pr-4 text-center">Status</th>
                      <th className="py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyData.map((h, idx) => (
                      <tr key={h._id} className="hover:bg-gray-50/60">
                        <td className="py-2.5 pr-4 text-gray-400">{idx + 1}</td>
                        <td className="py-2.5 pr-4 text-gray-500">
                          {new Date(h.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-500">
                          {h.repaidDate ? (
                            new Date(h.repaidDate).toLocaleDateString()
                          ) : h.repaidAmount ? (
                            new Date(h.updatedAt!).toLocaleDateString()
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-emerald-600">
                          {h.repaidAmount ? (
                            `₹${h.repaidAmount.toLocaleString()}`
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              h.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : h.status === "PARTIAL"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {h.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-500">
                          {h.remarks || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end px-5 pb-4">
              <button
                onClick={() => setHistoryEmp(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
