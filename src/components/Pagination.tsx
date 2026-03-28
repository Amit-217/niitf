import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

const PRESET_LIMITS = [10, 25, 50];

function getPageNumbers(current: number, totalPages: number): (number | '…')[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (current <= 4) {
        return [1, 2, 3, 4, 5, '…', totalPages];
    }
    if (current >= totalPages - 3) {
        return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '…', current - 1, current, current + 1, '…', totalPages];
}

export const Pagination: React.FC<PaginationProps> = ({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
    onLimitChange,
}) => {
    const isCustom = !PRESET_LIMITS.includes(limit);
    const [showCustomInput, setShowCustomInput] = useState(isCustom);
    const [customValue, setCustomValue] = useState(isCustom ? String(limit) : '');

    if (total === 0) return null;

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    const pages = getPageNumbers(page, totalPages);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'custom') {
            setShowCustomInput(true);
            setCustomValue('');
        } else {
            setShowCustomInput(false);
            setCustomValue('');
            onLimitChange(Number(val));
        }
    };

    const applyCustom = () => {
        const n = parseInt(customValue, 10);
        if (n >= 1 && n <= 1000) {
            onLimitChange(n);
        }
    };

    const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') applyCustom();
    };

    return (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            {/* Rows per page */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Rows per page:</span>
                <select
                    value={showCustomInput ? 'custom' : limit}
                    onChange={handleSelectChange}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
                >
                    {PRESET_LIMITS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                    <option value="custom">Custom</option>
                </select>

                {showCustomInput && (
                    <>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            onKeyDown={handleCustomKeyDown}
                            placeholder="e.g. 100"
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        />
                        <button
                            onClick={applyCustom}
                            className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Go
                        </button>
                    </>
                )}
            </div>

            {/* Showing X–Y of Z */}
            <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">{from}</span>–<span className="font-semibold text-gray-700">{to}</span>{' '}
                of <span className="font-semibold text-gray-700">{total}</span>
            </p>

            {/* Page buttons — only when more than one page */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {pages.map((p, i) =>
                        p === '…' ? (
                            <span key={`ell-${i}`} className="px-2 text-gray-400 text-sm select-none">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p as number)}
                                className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-semibold transition-colors ${
                                    p === page
                                        ? 'bg-indigo-600 text-white'
                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
