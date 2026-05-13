import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Wallet, Download, Table2 } from "lucide-react";
import {
  createAdvance,
  getEmployeeMonthlyAdvances,
  getAllAdvances,
} from "../../../api/payrollApi";
import api from "../../../api/axios";
import { Pagination } from "../../../components/Pagination";

interface User {
  _id: string;
  name: string;
  empId: string;
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allAdvances.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
    </div>
  );
};
