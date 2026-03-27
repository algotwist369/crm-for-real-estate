import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";

const Table = () => {
    const data = [
        { id: 1, name: "Ankit Pathak", email: "ankit@email.com", role: "Admin" },
        { id: 2, name: "Rahul Sharma", email: "rahul@email.com", role: "User" },
        { id: 3, name: "Priya Singh", email: "priya@email.com", role: "Manager" },
        { id: 4, name: "Amit Verma", email: "amit@email.com", role: "User" },
        { id: 5, name: "Rohit Kumar", email: "rohit@email.com", role: "Admin" },
        { id: 6, name: "Neha Gupta", email: "neha@email.com", role: "User" },
        { id: 7, name: "Vikas Sharma", email: "vikas@email.com", role: "Manager" },
        { id: 8, name: "Sneha Jain", email: "sneha@email.com", role: "User" }
    ];

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 4;

    const filteredData = data.filter((item) => 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.email.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <div className="w-full max-w-5xl mx-auto p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">User Directory</h2>
                    <p className="text-sm text-zinc-500">Manage system users and permissions</p>
                </div>

                <div className="relative w-full md:w-72">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 text-sm text-white rounded p-2.5 pl-10 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                </div>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800 rounded overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 text-zinc-400 text-xs border-b border-zinc-800">
                                <th className="p-4 font-medium tracking-wide">ID</th>
                                <th className="p-4 font-medium tracking-wide">Name</th>
                                <th className="p-4 font-medium tracking-wide">Email Address</th>
                                <th className="p-4 font-medium tracking-wide">System Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-zinc-900/10 transition-colors text-zinc-300">
                                        <td className="p-4 text-zinc-500">#{row.id}</td>
                                        <td className="p-4 font-medium text-zinc-200">{row.name}</td>
                                        <td className="p-4">{row.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 text-[10px] rounded border uppercase tracking-wider ${
                                                row.role === 'Admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                row.role === 'Manager' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 
                                                'bg-zinc-800 text-zinc-400 border-zinc-700'
                                            }`}>
                                                {row.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-zinc-600 italic">No users found matching your search</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-zinc-900/30 flex items-center justify-between border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                        Showing <span className="text-zinc-300">{paginatedData.length}</span> of <span className="text-zinc-300">{filteredData.length}</span> results
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-zinc-400 px-2 font-medium">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Table;
