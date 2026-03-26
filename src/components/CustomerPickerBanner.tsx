import React, { useState, useEffect, useRef } from 'react';
import {
    Building2, Search, CheckCircle2, Loader2, Plus, UserPlus,
    Phone, Mail, MapPin, AlertTriangle
} from 'lucide-react';
import { getCustomers, createCustomer, Customer } from '../api/customerApi';
import { toast } from 'react-toastify';

/* ── Shared style tokens (matches report form pages) ────────────────────── */
const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

/* ── Parse API response (all shapes from CustomersPage) ─────────────────── */
function extractCustomers(res: any): Customer[] {
    if (Array.isArray(res)) return res;
    if (res?.data?.customers && Array.isArray(res.data.customers)) return res.data.customers;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.customers && Array.isArray(res.customers)) return res.customers;
    return [];
}

/* ── Props ────────────────────────────────────────────────────────────────── */
interface Props {
    onCustomerSelected: (id: string, name: string) => void;
}
type Mode = 'choose' | 'create';

/* ── Component ───────────────────────────────────────────────────────────── */
export const CustomerPickerBanner: React.FC<Props> = ({ onCustomerSelected }) => {
    const [mode, setMode] = useState<Mode>('choose');
    const [confirmed, setConfirmed] = useState(false);

    // ── Choose Existing ──
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Create New ──
    const [companyName, setCompanyName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [creating, setCreating] = useState(false);

    // Fetch on search
    useEffect(() => {
        let cancelled = false;
        const t = setTimeout(async () => {
            setLoadingList(true);
            try {
                const res = await getCustomers({ search: search.trim(), limit: 15 });
                if (!cancelled) setCustomers(extractCustomers(res));
            } catch {
                if (!cancelled) setCustomers([]);
            } finally {
                if (!cancelled) setLoadingList(false);
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(t); };
    }, [search]);

    // Outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleConfirmExisting = () => {
        if (!selected) return;
        setConfirmed(true);
        onCustomerSelected(selected.id, selected.name);
        toast.success(`Customer "${selected.name}" linked to this report.`);
    };

    const handleCreate = async () => {
        if (!companyName.trim() || !contactPerson.trim() || !mobile.trim()) {
            toast.error('Company Name, Contact Person and Mobile are required.');
            return;
        }
        setCreating(true);
        try {
            const res = await createCustomer({
                companyName: companyName.trim(),
                contactPerson: contactPerson.trim(),
                mobile: mobile.trim(),
                email: email.trim() || null,
                city: city.trim() || null,
            });
            const created = res?.data?.data || res?.data?.customer || res?.data;
            if (created?._id) {
                setConfirmed(true);
                onCustomerSelected(created._id, created.companyName);
                toast.success(`"${created.companyName}" created & linked!`);
            } else {
                toast.error('Customer created but ID not returned.');
            }
        } catch {
            toast.error('Failed to create company.');
        } finally {
            setCreating(false);
        }
    };

    if (confirmed) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            {/* ── Header Row ── */}
            <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Customer Not Linked</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Select an existing customer or create a new one to proceed.
                    </p>
                </div>
            </div>

            {/* ── Mode Tabs ── */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4 w-fit">
                <button
                    type="button"
                    onClick={() => setMode('choose')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                        mode === 'choose'
                            ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Search size={13} /> Choose Existing
                </button>
                <button
                    type="button"
                    onClick={() => setMode('create')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                        mode === 'create'
                            ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <UserPlus size={13} /> Create New
                </button>
            </div>

            {/* ═══════════ CHOOSE EXISTING ═══════════ */}
            {mode === 'choose' && (
                <div className="space-y-3">
                    {/* Selected pill */}
                    {selected && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50">
                            <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {selected.name[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-indigo-800 flex-1 truncate">{selected.name}</span>
                            <button type="button" onClick={() => setSelected(null)}
                                className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                                Change
                            </button>
                        </div>
                    )}

                    {/* Search input + dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setOpen(true); }}
                                onFocus={() => setOpen(true)}
                                placeholder="Search by company name..."
                                className={inputClass + ' pl-9'}
                            />
                            {loadingList && (
                                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                            )}
                        </div>

                        {open && (
                            <div
                                className="absolute top-full left-0 right-0 mt-1 z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg"
                                style={{ maxHeight: '220px', overflowY: 'auto' }}
                            >
                                {loadingList ? (
                                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
                                        <Loader2 size={13} className="animate-spin" /> Searching…
                                    </div>
                                ) : customers.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <p className="text-xs text-gray-400">
                                            {search.trim() ? `No results for "${search}"` : 'No companies found'}
                                        </p>
                                        <button type="button" onClick={() => { setOpen(false); setMode('create'); }}
                                            className="mt-1.5 text-xs font-semibold text-indigo-600 hover:underline">
                                            + Create a new one
                                        </button>
                                    </div>
                                ) : (
                                    customers.map(c => (
                                        <button
                                            key={c._id}
                                            type="button"
                                            onClick={() => { setSelected({ id: c._id, name: c.companyName }); setOpen(false); setSearch(''); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                                                selected?.id === c._id ? 'bg-indigo-50' : ''
                                            }`}
                                        >
                                            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {c.companyName?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-800 truncate">{c.companyName}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{c.contactPerson} · {c.mobile}</p>
                                            </div>
                                            {selected?.id === c._id && <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Confirm button */}
                    <button
                        type="button"
                        onClick={handleConfirmExisting}
                        disabled={!selected}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <CheckCircle2 size={15} />
                        {selected ? `Use "${selected.name}"` : 'Select a company first'}
                    </button>
                </div>
            )}

            {/* ═══════════ CREATE NEW ═══════════ */}
            {mode === 'create' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Company Name *</label>
                            <div className="relative">
                                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                                    className={inputClass + ' pl-9'} placeholder="e.g. ABC Industries Pvt. Ltd." />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Contact Person *</label>
                            <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                                className={inputClass} placeholder="e.g. Rajesh Kumar" />
                        </div>
                        <div>
                            <label className={labelClass}>Mobile *</label>
                            <div className="relative">
                                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)}
                                    className={inputClass + ' pl-9'} placeholder="e.g. 9876543210" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <div className="relative">
                                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className={inputClass + ' pl-9'} placeholder="company@email.com" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>City</label>
                            <div className="relative">
                                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                                    className={inputClass + ' pl-9'} placeholder="e.g. Mumbai" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={creating || !companyName.trim() || !contactPerson.trim() || !mobile.trim()}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {creating
                            ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                            : <><Plus size={15} /> Create &amp; Link to Report</>
                        }
                    </button>
                </div>
            )}
        </div>
    );
};
