import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, FileText, Pencil, Eye, Trash2,
    GraduationCap, Wrench, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getAllTrainingQuotations,
    getAllServiceQuotations,
    deleteTrainingQuotation,
    deleteServiceQuotation,
} from '../../../api/quotationApi';
import { getCustomers } from '../../../api/customerApi';
import { Pagination } from '../../../components/Pagination';

type QuoteType = 'training' | 'service' | null;

const QUOTE_TYPES: {
    key: QuoteType;
    label: string;
    fullLabel: string;
    icon: any;
    color: string;
    textColor: string;
    borderColor: string;
    bgNum: string;
    dotColor: string;
}[] = [
    {
        key: 'service',
        label: 'Service',
        fullLabel: 'Service Quotations',
        icon: Wrench,
        color: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-300',
        bgNum: 'bg-blue-100',
        dotColor: 'bg-blue-600',
    },
    {
        key: 'training',
        label: 'Training',
        fullLabel: 'Training Quotations',
        icon: GraduationCap,
        color: 'bg-primary-50',
        textColor: 'text-primary-600',
        borderColor: 'border-primary-300',
        bgNum: 'bg-primary-100',
        dotColor: 'bg-primary-600',
    },
];

const fmt = (d?: string | null) =>
    d
        ? new Date(d).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

export const QuotationsListPage: React.FC = () => {
    const navigate = useNavigate();
    const [allQuotations, setAllQuotations] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<QuoteType>('service');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [trainRes, servRes, custRes] = await Promise.all([
                getAllTrainingQuotations({ limit: 1000 }),
                getAllServiceQuotations({ limit: 1000 }),
                getCustomers(),
            ]);

            const tData = (trainRes.data?.data || trainRes.data || []).map(
                (q: any) => ({ ...q, _type: 'training' })
            );
            const sData = (servRes.data?.data || servRes.data || []).map(
                (q: any) => ({ ...q, _type: 'service' })
            );

            const combined = [...tData, ...sData].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setAllQuotations(combined);
            setCustomers(custRes.data?.data || custRes.data || []);
        } catch {
            toast.error('Failed to fetch quotations.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);



    const getCustomerName = (customerId: any) => {
        if (!customerId) return 'Unknown';
        // Backend populate() returns an object with companyName
        if (typeof customerId === 'object' && customerId?.companyName) {
            return customerId.companyName;
        }
        // Fallback: plain string ID lookup in local customers list
        const cust = customers.find((c) => c._id === customerId);
        return cust?.companyName || 'Unknown';
    };

    const handleDelete = async (id: string, type: string) => {
        if (!window.confirm('Are you sure you want to delete this quotation?')) return;
        try {
            if (type === 'training') await deleteTrainingQuotation(id);
            else await deleteServiceQuotation(id);
            toast.success('Quotation deleted successfully');
            fetchData();
        } catch {
            toast.error('Failed to delete quotation');
        }
    };

    const counts = {
        training: allQuotations.filter((q) => q._type === 'training').length,
        service: allQuotations.filter((q) => q._type === 'service').length,
    };

    const filtered = allQuotations
        .filter((q) => activeTab === null || q._type === activeTab)
        .filter(
            (q) =>
                (q.quotationNo || '').toLowerCase().includes(search.toLowerCase()) ||
                getCustomerName(q.customerId).toLowerCase().includes(search.toLowerCase())
        );

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const activeInfo = QUOTE_TYPES.find((t) => t.key === activeTab) ?? QUOTE_TYPES[0];

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 p-6 sm:p-8 shadow-xl shadow-gray-200/50">
                <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-violet-100/50 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -m-8 w-48 h-48 bg-primary-100/50 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${activeInfo.color} ${activeInfo.textColor} shadow-lg shadow-current/10 bg-white`}>
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                Quotation Records
                            </h1>
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {total} total {activeTab ? activeInfo.label.toLowerCase() : ''} quotations found
                            </p>
                        </div>
                    </div>

                    <button
                        id="add-quote-btn"
                        onClick={() => navigate(`/admin/quotations/${activeTab ?? 'training'}/new`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 whitespace-nowrap"
                    >
                        <Plus size={17} /> New {activeTab ? `${activeInfo.label} ` : ''}Quote
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {QUOTE_TYPES.map((qt) => {
                    const Icon = qt.icon;
                    const isActive = activeTab === qt.key;
                    return (
                        <button
                            key={qt.key}
                            onClick={() => {
                                setActiveTab(activeTab === qt.key ? null : qt.key as 'training' | 'service');
                                setPage(1);
                            }}
                            className={`group relative p-5 rounded-2xl border-2 transition-all flex flex-col items-start gap-3 text-left ${
                                isActive
                                    ? `${qt.borderColor} bg-white shadow-xl shadow-gray-200/50 ring-4 ring-gray-950/5`
                                    : 'border-gray-100 bg-white/60 hover:border-gray-200 hover:bg-white'
                            }`}
                        >
                            <div
                                className={`p-2.5 rounded-xl transition-all group-hover:scale-110 duration-300 ${qt.color} ${qt.textColor}`}
                            >
                                <Icon size={20} />
                            </div>

                            <div className="w-full">
                                <p
                                    className={`text-[11px] font-black uppercase tracking-widest leading-tight ${
                                        isActive ? qt.textColor : 'text-gray-400'
                                    }`}
                                >
                                    {qt.label}
                                </p>
                                <p className="text-[10px] font-medium text-gray-400 mt-0.5 leading-tight">
                                    {qt.fullLabel}
                                </p>
                                <p
                                    className={`text-3xl font-extrabold mt-2 leading-none ${
                                        isActive ? 'text-gray-900' : 'text-gray-600'
                                    }`}
                                >
                                    {counts[qt.key as 'training' | 'service']}
                                </p>
                            </div>

                            {isActive && (
                                <div
                                    className={`absolute top-4 right-4 h-2.5 w-2.5 rounded-full ${qt.dotColor}`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Main Table Area ── */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden">
                {/* Filters Bar */}
                <div className="px-6 py-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                    <div className="relative flex-1 group">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by quote number or customer..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-gray-400 font-medium"
                        />
                    </div>

                    {search && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setPage(1);
                            }}
                            className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-100 transition-all whitespace-nowrap"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Quote No.', 'Date', 'Type', 'Customer', 'Subject', 'Amount (₹)', 'Status', 'Actions'].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                        >
                                            {h}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2
                                                className="animate-spin text-primary-600"
                                                size={32}
                                            />
                                            <p className="text-xs font-bold text-gray-500 animate-pulse">
                                                Fetching latest records...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto text-center">
                                            <div className="p-5 bg-gray-50 rounded-full text-gray-400">
                                                <Search size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-gray-800">
                                                    No quotations found
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Try adjusting your search or create a new{' '}
                                                    {activeInfo.label.toLowerCase()} quotation.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((q) => (
                                    <tr
                                        key={q._id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Quote No */}
                                        <td className="px-4 py-3 font-mono font-bold text-blue-700">
                                            {q.quotationNo || '—'}
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 text-gray-600">
                                            {fmt(q.date)}
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    q._type === 'training'
                                                        ? 'bg-primary-100 text-primary-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}
                                            >
                                                {q._type === 'training' ? 'Training' : 'Service'}
                                            </span>
                                        </td>

                                        {/* Customer */}
                                        <td className="px-4 py-3 text-gray-700 font-medium">
                                            {getCustomerName(q.customerId)}
                                        </td>

                                        {/* Subject */}
                                        <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                                            {q.subject || '—'}
                                        </td>

                                        {/* Amount */}
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            ₹{(q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            {q.status ? (
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    q.status === 'Accepted' ? 'bg-green-100 text-green-700'
                                                    : q.status === 'Sent' ? 'bg-blue-100 text-blue-700'
                                                    : q.status === 'Rejected' ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>{q.status}</span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/admin/quotations/${q._type}/${q._id}/print`)}
                                                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/quotations/${q._type}/${q._id}/edit`)}
                                                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(q._id, q._type)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
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
                    total={total}
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
