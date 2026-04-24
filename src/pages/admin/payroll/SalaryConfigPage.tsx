import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Plus,
  Download,
  Table2,
  Settings2,
  Eye,
  X,
  ArrowRight,
} from "lucide-react";
import {
  createSalaryConfig,
  getCurrentSalaryConfig,
  getAllSalaryConfigs,
  getSalaryHistory,
} from "../../../api/payrollApi";
import api from "../../../api/axios";

interface User {
  _id: string;
  name: string;
  empId: string;
}

export const SalaryConfigPage = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [monthlySalary, setMonthlySalary] = useState<number | "">("");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [allConfigs, setAllConfigs] = useState<any[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null);
  const [viewCurrentSalary, setViewCurrentSalary] = useState<any>(null);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res) => setEmployees(res.data || []));
    fetchAllConfigs();
  }, []);

  const fetchAllConfigs = async () => {
    try {
      const res = await getAllSalaryConfigs();
      setAllConfigs(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const parseDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (value?: string) => {
    const parsed = parseDate(value);
    return parsed ? parsed.toLocaleDateString() : "-";
  };

  const formatMonthLabel = (value?: string) => {
    const parsed = parseDate(value);
    return parsed
      ? parsed.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
      : "-";
  };

  const openConfigView = async (config: any) => {
    setSelectedConfig(config);
    setIsViewDrawerOpen(true);
    setViewLoading(true);

    try {
      const employeeId = config.employeeId?._id || config.employeeId;
      const [currentRes, historyRes] = await Promise.all([
        getCurrentSalaryConfig(employeeId),
        getSalaryHistory(employeeId),
      ]);
      setViewCurrentSalary(currentRes.data || null);
      setViewHistory(historyRes.data || []);
    } catch (error) {
      setViewCurrentSalary(null);
      setViewHistory([]);
    } finally {
      setViewLoading(false);
    }
  };

  const closeConfigView = () => {
    setIsViewDrawerOpen(false);
    setSelectedConfig(null);
    setViewCurrentSalary(null);
    setViewHistory([]);
  };

  const openGenerateModal = (config?: any) => {
    if (config) {
      const employeeId = config.employeeId?._id || config.employeeId;
      setSelectedUser(employeeId);
      setMonthlySalary(Number(config.monthlySalary || 0));
      const parsed = parseDate(config.effectiveFrom) || new Date();
      setEffectiveFrom(parsed.toISOString().split("T")[0]);
    } else {
      setSelectedUser("");
      setMonthlySalary("");
      setEffectiveFrom(new Date().toISOString().split("T")[0]);
    }
    setIsGenerateModalOpen(true);
  };

  const useConfigInForm = (config: any) => {
    closeConfigView();
    openGenerateModal(config);
  };

  const closeGenerateModal = () => {
    setIsGenerateModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !monthlySalary || !effectiveFrom) {
      return toast.warning("Please fill all fields");
    }

    try {
      await createSalaryConfig({
        employeeId: selectedUser,
        monthlySalary: Number(monthlySalary),
        effectiveFrom,
        repaymentMonth: "",
      } as any);
      toast.success("Salary configuration updated");
      fetchAllConfigs();
      setMonthlySalary("");
      setIsGenerateModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update salary");
    }
  };

  const exportCSV = () => {
    if (!allConfigs.length) return toast.warning("No data to export");

    const headers =
      "Employee Name,Employee ID,Monthly Salary,Effective From,Status\n";
    const rows = allConfigs
      .map(
        (c) =>
          `"${c.employeeId?.name || "-"}","${c.employeeId?.empId || "-"}","${c.monthlySalary}","${formatDate(c.effectiveFrom)}","${c.isActive ? "Active" : "Inactive"}"`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "All_Salary_Configs.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const selectedEmployee = employees.find((emp) => emp._id === selectedUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings2 className="text-primary-600" size={26} />
          Salary Configuration
        </h1>
        <p className="hidden sm:block text-sm text-gray-500 mt-1">
          Manage salary settings from the raw records table below
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Table2 className="text-gray-500" size={18} />
            <h3 className="font-semibold text-gray-700">
              Salary Config Records
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openGenerateModal()}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus size={14} />
              Generate New
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-full">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Emp ID</th>
                <th className="px-4 py-3">Effective Month</th>
                <th className="px-4 py-3">Monthly Salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allConfigs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No salary configuration records found.
                  </td>
                </tr>
              ) : (
                allConfigs.map((config) => (
                  <tr key={config._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {config.employeeId?.name || "-"}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                        {config.employeeId?.department || "Employee"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {config.employeeId?.empId || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="font-semibold text-gray-900">
                        {formatMonthLabel(config.effectiveFrom)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Starts {formatDate(config.effectiveFrom)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-700">
                      Rs. {Number(config.monthlySalary || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          config.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {config.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openConfigView(config)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openGenerateModal(config)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
                        >
                          <ArrowRight size={14} />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={closeGenerateModal}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl lg:max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-100/80">
                  {selectedUser ? "Edit Window" : "Generate Window"}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Salary Configuration
                </h3>
                <p className="text-sm text-violet-100/80 mt-1 max-w-2xl">
                  {selectedUser
                    ? "Update the employee, effective date, and monthly salary."
                    : "Choose the employee, set the effective date, and save the new salary record."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeGenerateModal}
                className="p-2 rounded-xl hover:bg-white/10 text-violet-100 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-8 space-y-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Select Employee
                      </label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none font-semibold text-gray-900 shadow-sm"
                        required
                      >
                        <option value="">-- Select an employee --</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.empId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Effective From
                      </label>
                      <input
                        type="date"
                        value={effectiveFrom}
                        onChange={(e) => setEffectiveFrom(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none font-semibold text-gray-900 shadow-sm"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Salary becomes active from this date.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      New Monthly Salary (Rs.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500 font-black">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={monthlySalary}
                        onChange={(e) =>
                          setMonthlySalary(Number(e.target.value))
                        }
                        placeholder="e.g. 50000"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-2xl bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none font-black text-gray-900 placeholder:text-gray-400 shadow-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5 sm:p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-500">
                    Preview
                  </p>
                  <div className="rounded-2xl bg-white border border-violet-100 p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Employee
                    </p>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      {selectedEmployee?.name || "Select employee"}
                    </p>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      {selectedEmployee?.empId || "EMP CODE"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-violet-100 p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Effective Date
                    </p>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      {formatDate(effectiveFrom)}
                    </p>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      Shows as {formatMonthLabel(effectiveFrom)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-violet-100 p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Salary
                    </p>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      Rs.{" "}
                      {monthlySalary
                        ? Number(monthlySalary).toLocaleString()
                        : "0"}
                    </p>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      Monthly base salary
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeGenerateModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-violet-600 text-white font-black rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-violet-100 active:scale-95 duration-100"
                  disabled={!selectedUser}
                >
                  <Plus size={18} />
                  Set Active Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewDrawerOpen && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={closeConfigView}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl lg:max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-100/80">
                  Salary Config Details
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {selectedConfig.employeeId?.name || "Employee"}
                </h3>
                <p className="text-sm text-violet-100/80 mt-1 max-w-2xl">
                  {selectedConfig.employeeId?.empId || "N/A"}{" "}
                  {selectedConfig.effectiveFrom
                    ? `- Effective ${formatMonthLabel(selectedConfig.effectiveFrom)}`
                    : ""}
                </p>
              </div>
              <button
                onClick={closeConfigView}
                className="p-2 rounded-xl hover:bg-white/10 text-violet-100 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              {viewLoading ? (
                <div className="py-16 text-center text-gray-400 font-medium animate-pulse">
                  Loading salary config details...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black">
                        Selected Salary
                      </p>
                      <p className="text-2xl font-bold text-violet-700 mt-2">
                        Rs.{" "}
                        {Number(
                          selectedConfig.monthlySalary || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black">
                        Status
                      </p>
                      <p className="text-lg font-bold mt-2 text-gray-900">
                        {selectedConfig.isActive ? "ACTIVE" : "INACTIVE"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Updated{" "}
                        {formatDate(
                          selectedConfig.updatedAt ||
                            selectedConfig.createdAt ||
                            selectedConfig.effectiveFrom,
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black">
                        Created By
                      </p>
                      <p className="text-lg font-bold mt-2 text-gray-900">
                        {selectedConfig.createdBy?.name || "System"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Effective month{" "}
                        {formatMonthLabel(selectedConfig.effectiveFrom)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-[0.2em]">
                      Payment Snapshot
                    </h4>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="rounded-xl bg-white border border-blue-100 p-3">
                        <p className="text-[10px] uppercase text-blue-500 font-black tracking-widest">
                          Base Salary
                        </p>
                        <p className="text-base font-bold text-blue-900 mt-1">
                          Rs.{" "}
                          {Number(
                            viewCurrentSalary?.monthlySalary ??
                              selectedConfig.monthlySalary ??
                              0,
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white border border-blue-100 p-3">
                        <p className="text-[10px] uppercase text-blue-500 font-black tracking-widest">
                          Effective Month
                        </p>
                        <p className="text-base font-bold text-blue-900 mt-1">
                          {formatMonthLabel(
                            viewCurrentSalary?.effectiveFrom ||
                              selectedConfig.effectiveFrom,
                          )}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white border border-blue-100 p-3">
                        <p className="text-[10px] uppercase text-blue-500 font-black tracking-widest">
                          Employee
                        </p>
                        <p className="text-base font-bold text-blue-900 mt-1">
                          {selectedConfig.employeeId?.name || "-"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white border border-blue-100 p-3">
                        <p className="text-[10px] uppercase text-blue-500 font-black tracking-widest">
                          Emp ID
                        </p>
                        <p className="text-base font-bold text-blue-900 mt-1">
                          {selectedConfig.employeeId?.empId || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">
                        Salary History
                      </h4>
                      <button
                        type="button"
                        onClick={() => useConfigInForm(selectedConfig)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
                      >
                        <ArrowRight size={14} />
                        Load In Form
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50/50 text-gray-400">
                          <tr>
                            <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-wider">
                              Monthly Salary
                            </th>
                            <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-wider">
                              Effective Month
                            </th>
                            <th className="px-5 py-3 text-center font-black text-[10px] uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {viewHistory.length === 0 ? (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-5 py-10 text-center text-gray-500"
                              >
                                No history available for this employee.
                              </td>
                            </tr>
                          ) : (
                            viewHistory.map((record: any) => (
                              <tr
                                key={record._id}
                                className="hover:bg-gray-50/50"
                              >
                                <td className="px-5 py-3 font-bold text-gray-900">
                                  Rs.{" "}
                                  {Number(
                                    record.monthlySalary || 0,
                                  ).toLocaleString()}
                                </td>
                                <td className="px-5 py-3 text-gray-600">
                                  {formatMonthLabel(record.effectiveFrom)}
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                                      record.isActive
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                        : "bg-gray-100 text-gray-500 border-gray-200"
                                    }`}
                                  >
                                    {record.isActive ? "ACTIVE" : "INACTIVE"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
