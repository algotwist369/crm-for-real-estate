import React, { useState, useMemo } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";

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

    const filteredData = useMemo(() => {
        return data.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const paginatedData = filteredData.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-6 bg-zinc-950 border border-zinc-800 rounded-md">

            {/* Search */}
            <div className="mb-6 w-72">
                <PremiumInput
                    placeholder="Search user..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse">

                <thead className="border-b border-zinc-800">
                    <tr className="text-sm text-zinc-400">
                        <th className="py-3">ID</th>
                        <th className="py-3">Name</th>
                        <th className="py-3">Email</th>
                        <th className="py-3">Role</th>
                    </tr>
                </thead>

                <tbody>

                    {paginatedData.map((row) => (
                        <tr
                            key={row.id}
                            className="border-b border-zinc-900 text-zinc-200"
                        >
                            <td className="py-3">{row.id}</td>
                            <td className="py-3">{row.name}</td>
                            <td className="py-3">{row.email}</td>
                            <td className="py-3">{row.role}</td>
                        </tr>
                    ))}

                </tbody>

            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">

                <span className="text-sm text-zinc-400">
                    Page {page} of {totalPages}
                </span>

                <div className="flex gap-3">

                    <PremiumButton
                        text="Prev"
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    />

                    <PremiumButton
                        text="Next"
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    />

                </div>

            </div>

        </div>
    );
};

export default Table;