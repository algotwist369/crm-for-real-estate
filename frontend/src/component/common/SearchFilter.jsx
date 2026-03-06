import React from "react";
import { FiSearch } from "react-icons/fi";

export const SearchFilter = ({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Search...",
    filterValue,
    onFilterChange,
    filterOptions = [],
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-4">

            {/* Search */}
            <div className="relative w-full md:w-72">
                <FiSearch className="absolute left-3 top-3 text-zinc-400" />

                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
            </div>

            {/* Dropdown Filter */}
            {filterOptions.length > 0 && (
                <select
                    value={filterValue}
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                    {filterOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            )}

        </div>
    );
};
