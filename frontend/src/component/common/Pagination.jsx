import React from "react";

const rowsPerPageOptions = [5, 10, 15, 20, 50];

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    rowsPerPage,
    onRowsPerPageChange,
}) => {
    return (
        <div className="flex items-center justify-between mt-4">

            {/* Rows per page selector */}
            {onRowsPerPageChange && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Rows per page:</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                    >
                        {rowsPerPageOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Page navigation */}
            <div className="flex items-center gap-2">

                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm disabled:opacity-40 transition-opacity"
                >
                    Prev
                </button>

                <span className="text-sm text-zinc-400">
                    Page {currentPage} / {totalPages || 1}
                </span>

                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm disabled:opacity-40 transition-opacity"
                >
                    Next
                </button>

            </div>

        </div>
    );
};
