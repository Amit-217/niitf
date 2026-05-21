import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Info } from 'lucide-react';

interface AttendanceSummary {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    holidayDays: number;
    notMarkedDays: number;
    daysInMonth: number;
    payableDays: number;
}

export const SalarySlipPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state as {
        record: any;
        attendanceSummary: AttendanceSummary;
        monthLabel: string;
    } | null;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!state?.record) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-500 font-medium mb-4">No salary data found.</p>
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm">Go Back</button>
                </div>
            </div>
        );
    }

    const { record, attendanceSummary: summary, monthLabel } = state;

    const downloadSalarySlip = () => {
        const printWindow = window.open('', '_blank', 'width=860,height=1100');
        if (!printWindow) return;
        const S = (styles: string) => styles; // helper for readability
        const cardStyle = S('background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:28px;margin-bottom:20px;');
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Salary Slip - ${record.employeeId?.name || 'Employee'}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { background: #f3f4f6; color: #1e293b; padding: 36px 40px; }
        @media print { body { padding: 24px 28px; } }
    </style>
</head>
<body>
    <!-- Card 1: Header -->
    <div style="${cardStyle}">
        <p style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.3em;color:#9ca3af;">Salary Breakdown</p>
        <h2 style="font-size:24px;font-weight:900;color:#111827;margin:6px 0 4px;">${record.employeeId?.name || 'Employee'}</h2>
        <p style="font-size:13px;color:#6b7280;">${record.employeeId?.empId || 'N/A'} &middot; ${monthLabel}</p>
        <div style="display:flex;gap:14px;margin-top:20px;">
            <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:18px;">
                <p style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;color:#9ca3af;">Net Salary</p>
                <p style="font-size:30px;font-weight:900;color:#1d4ed8;margin-top:8px;">&#8377;${Math.round(record.netSalary || 0).toLocaleString()}</p>
            </div>
        </div>
    </div>

    <!-- Card 2: Attendance -->
    <div style="${cardStyle}">
        <h4 style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#065f46;margin-bottom:18px;">Attendance Overview</h4>
        <div style="display:flex;gap:12px;">
            <div style="flex:1;background:#ffffff;border:1px solid #d1fae5;border-radius:12px;padding:14px;">
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#10b981;">Present</p>
                <p style="font-size:26px;font-weight:900;color:#065f46;margin-top:6px;">${summary.presentDays}</p>
            </div>
            <div style="flex:1;background:#ffffff;border:1px solid #fde68a;border-radius:12px;padding:14px;">
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#f59e0b;">Leave</p>
                <p style="font-size:26px;font-weight:900;color:#92400e;margin-top:6px;">${summary.leaveDays}</p>
            </div>
            <div style="flex:1;background:#ffffff;border:1px solid #fecaca;border-radius:12px;padding:14px;">
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#f87171;">Absent</p>
                <p style="font-size:26px;font-weight:900;color:#991b1b;margin-top:6px;">${summary.absentDays}</p>
            </div>
            <div style="flex:1;background:#ffffff;border:1px solid #bae6fd;border-radius:12px;padding:14px;">
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#38bdf8;">Holiday</p>
                <p style="font-size:26px;font-weight:900;color:#0c4a6e;margin-top:6px;">${summary.holidayDays}</p>
            </div>
            <div style="flex:1;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
                <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">Not Marked</p>
                <p style="font-size:26px;font-weight:900;color:#0f172a;margin-top:6px;">${summary.notMarkedDays}</p>
            </div>
        </div>
        <div style="background:#ecfdf5;border:1px solid #d1fae5;border-radius:10px;padding:10px 14px;font-size:11px;font-weight:700;color:#065f46;margin-top:14px;">
            Calculation Factor: ${summary.daysInMonth} Days Month.
            Earnings include ${summary.payableDays} payable days (Present + Leaves + Holidays).
            Overtime is calculated at a fixed 30-day rate as per company policy.
        </div>
    </div>

    <!-- Card 3: Salary Formula -->
    <div style="${cardStyle}">
        <h4 style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#111827;margin-bottom:18px;">Salary Formula</h4>
        <div style="display:flex;justify-content:space-between;font-size:14px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#6b7280;">Base Salary</span>
            <span style="font-weight:700;color:#111827;">&#8377;${(record.baseSalary || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#6b7280;">Bonus</span>
            <span style="font-weight:700;color:#16a34a;">+ &#8377;${(record.bonusAmount || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#6b7280;">Overtime (${record.overtimeUnits || 0} units)</span>
            <span style="font-weight:700;color:#16a34a;">+ &#8377;${(record.overtimeAmount || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#6b7280;">Absent deduction (${record.absentDays || 0} days)</span>
            <span style="font-weight:700;color:#dc2626;">- &#8377;${(record.deductionAmount || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#6b7280;">Standard deduction</span>
            <span style="font-weight:700;color:#dc2626;">- &#8377;${(record.standardDeduction || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;padding:10px 0;">
            <span style="color:#6b7280;">Advance recovery</span>
            <span style="font-weight:700;color:#d97706;">- &#8377;${(record.advanceTotal || 0).toLocaleString()}</span>
        </div>
    </div>

    ${record.note ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:20px;margin-bottom:20px;">
        <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#1e40af;margin-bottom:8px;">Note</p>
        <p style="font-size:13px;color:#1e3a8a;">${record.note}</p>
    </div>` : ''}

    <div style="text-align:center;font-size:11px;color:#9ca3af;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-weight:500;">
        This is a system generated document. Powered by Viplora Tech.
    </div>
</body>
</html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Records
                </button>
                <button
                    onClick={downloadSalarySlip}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all"
                >
                    <Download size={15} />
                    Print Slip
                </button>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
                {/* Header info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black">Salary Breakdown</p>
                    <h2 className="text-2xl font-black text-gray-900 mt-1">{record.employeeId?.name || 'Employee'}</h2>
                    <p className="text-sm text-gray-500 mt-1">{record.employeeId?.empId || 'N/A'} · {monthLabel}</p>

                    <div className="grid grid-cols-1 gap-3 mt-5">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black">Net Salary</p>
                            <p className="text-3xl font-black text-primary-700 mt-2">₹{Math.round(record.netSalary || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Attendance */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h4 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Attendance Overview</h4>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="rounded-xl bg-white border border-emerald-100 p-3">
                            <p className="text-[10px] uppercase text-emerald-500 font-black tracking-widest">Present</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1">{summary.presentDays}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-amber-100 p-3">
                            <p className="text-[10px] uppercase text-amber-500 font-black tracking-widest">Leave</p>
                            <p className="text-2xl font-black text-amber-700 mt-1">{summary.leaveDays}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-rose-100 p-3">
                            <p className="text-[10px] uppercase text-rose-500 font-black tracking-widest">Absent</p>
                            <p className="text-2xl font-black text-rose-700 mt-1">{summary.absentDays}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-sky-100 p-3">
                            <p className="text-[10px] uppercase text-sky-500 font-black tracking-widest">Holiday</p>
                            <p className="text-2xl font-black text-sky-700 mt-1">{summary.holidayDays}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50/60 border border-slate-200 p-3">
                            <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Not Marked</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{summary.notMarkedDays}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] text-emerald-800 mt-4 font-bold bg-emerald-100/50 p-2.5 rounded-xl border border-emerald-100">
                        <Info size={14} className="shrink-0" />
                        <p>
                            Calculation Factor: {summary.daysInMonth} Days Month.
                            Earnings include {summary.payableDays} payable days (Present + Leaves + Holidays).
                            Overtime is calculated at a fixed 30-day rate as per company policy.
                        </p>
                    </div>
                </div>

                {/* Salary formula */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Salary Formula</h4>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Base Salary</span>
                            <span className="font-bold text-gray-900">₹{(record.baseSalary || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Bonus</span>
                            <span className="font-bold text-emerald-600">+ ₹{(record.bonusAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Overtime ({record.overtimeUnits || 0} units)</span>
                            <span className="font-bold text-emerald-600">+ ₹{(record.overtimeAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Absent deduction ({record.absentDays || 0} days)</span>
                            <span className="font-bold text-rose-600">- ₹{(record.deductionAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Standard deduction</span>
                            <span className="font-bold text-rose-600">- ₹{(record.standardDeduction || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Advance recovery</span>
                            <span className="font-bold text-amber-600">- ₹{(record.advanceTotal || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Note */}
                {record.note && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em]">Note</h4>
                        <p className="text-sm text-blue-900 mt-2">{record.note}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
