import React, { useState } from "react";
import { FiX, FiDownload, FiCheckSquare, FiSquare } from "react-icons/fi";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";

const fieldsOptions = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "whatsapp_number", label: "WhatsApp" },
    { key: "lead_type", label: "Lead Type" },
    { key: "client_type", label: "Client Type" },
    { key: "budget", label: "Budget" },
    { key: "property_type", label: "Property Type" },
    { key: "bedrooms", label: "Bedrooms" },
    { key: "bathrooms", label: "Bathrooms" },
    { key: "source", label: "Source" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
    { key: "assigned_to", label: "Assigned Agent(s)" },
    { key: "createdAt", label: "Created At" }
];

const ExportLeadsModal = ({ isOpen, onClose, activeFilters }) => {
    const [format, setFormat] = useState("excel");
    const [range, setRange] = useState("filtered");
    const [selectedFields, setSelectedFields] = useState(fieldsOptions.map(f => f.key));
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleSelectAll = () => {
        setSelectedFields(fieldsOptions.map(f => f.key));
    };

    const handleDeselectAll = () => {
        setSelectedFields([]);
    };

    const handleFieldToggle = (fieldKey) => {
        if (selectedFields.includes(fieldKey)) {
            setSelectedFields(selectedFields.filter(k => k !== fieldKey));
        } else {
            setSelectedFields([...selectedFields, fieldKey]);
        }
    };

    const handleExport = async (e) => {
        e.preventDefault();
        if (selectedFields.length === 0) {
            toast.error("Please select at least one field to export.");
            return;
        }

        try {
            setIsExporting(true);
            const queryParams = new URLSearchParams();
            queryParams.append("type", format);
            queryParams.append("export_range", range);
            queryParams.append("fields", selectedFields.join(","));

            // Append active search filters if not exporting system-wide 'all'
            if (range !== "all") {
                if (activeFilters?.search) {
                    queryParams.append("search", activeFilters.search);
                }
                if (activeFilters?.status) {
                    queryParams.append("status", activeFilters.status);
                }
                if (activeFilters?.priority) {
                    queryParams.append("priority", activeFilters.priority);
                }
                if (activeFilters?.lead_type) {
                    queryParams.append("lead_type", activeFilters.lead_type);
                }
                if (activeFilters?.property_type) {
                    queryParams.append("property_type", activeFilters.property_type);
                }
                if (range === "current_page") {
                    queryParams.append("page", activeFilters?.page || 1);
                    queryParams.append("limit", activeFilters?.limit || 10);
                }
            }

            const response = await axiosInstance.get(`/leads/export?${queryParams.toString()}`, {
                responseType: "blob"
            });

            const blob = new Blob([response.data], {
                type: format === "pdf" 
                    ? "application/pdf" 
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const timestamp = new Date().toISOString().split("T")[0];
            link.setAttribute("download", `leads-export-${timestamp}.${format === "pdf" ? "pdf" : "xlsx"}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Leads exported successfully!");
            onClose();
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export leads. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                            <FiDownload size={18} />
                        </div>
                        <h2 className="text-sm font-medium text-white">Export Leads Data</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleExport} className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[80vh]">
                    
                    {/* Format & Range Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Format */}
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 block">
                                Export Format
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded cursor-pointer transition-all ${
                                    format === "excel" 
                                        ? "bg-zinc-800/80 border-yellow-500 text-white font-medium shadow-md shadow-yellow-500/5" 
                                        : "bg-zinc-950/20 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="format" 
                                        value="excel" 
                                        checked={format === "excel"}
                                        onChange={() => setFormat("excel")}
                                        className="sr-only"
                                    />
                                    <span>Excel Spreadsheet (.xlsx)</span>
                                </label>

                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded cursor-pointer transition-all ${
                                    format === "pdf" 
                                        ? "bg-zinc-800/80 border-yellow-500 text-white font-medium shadow-md shadow-yellow-500/5" 
                                        : "bg-zinc-950/20 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="format" 
                                        value="pdf" 
                                        checked={format === "pdf"}
                                        onChange={() => setFormat("pdf")}
                                        className="sr-only"
                                    />
                                    <span>PDF Document (.pdf)</span>
                                </label>
                            </div>
                        </div>

                        {/* Range */}
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 block">
                                Export Range
                            </label>
                            <select
                                value={range}
                                onChange={(e) => setRange(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-3 text-sm text-zinc-300 focus:outline-none focus:border-yellow-500/50 transition-colors cursor-pointer"
                            >
                                <option value="filtered">Filtered Leads (All Matching)</option>
                                <option value="filtered_100">Filtered Leads (Top 100 Matching)</option>
                                <option value="current_page">Current Table Page Only</option>
                                <option value="all">All Leads (System-Wide)</option>
                            </select>
                        </div>
                    </div>

                    {/* Fields selection */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
                                Fields to Include ({selectedFields.length} / {fieldsOptions.length})
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-[10px] text-yellow-500 font-semibold hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-[10px] text-zinc-600">|</span>
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="text-[10px] text-zinc-400 font-semibold hover:underline"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-950/30 border border-zinc-800 rounded">
                            {fieldsOptions.map((field) => {
                                const isChecked = selectedFields.includes(field.key);
                                return (
                                    <button
                                        type="button"
                                        key={field.key}
                                        onClick={() => handleFieldToggle(field.key)}
                                        className={`flex items-center gap-2.5 p-2 rounded text-left text-xs transition-colors ${
                                            isChecked 
                                                ? "text-zinc-100 bg-zinc-800/40" 
                                                : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                    >
                                        {isChecked ? (
                                            <FiCheckSquare className="text-yellow-500" size={15} />
                                        ) : (
                                            <FiSquare className="text-zinc-600" size={15} />
                                        )}
                                        <span className="truncate">{field.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-800 bg-zinc-900/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-zinc-800 text-zinc-400 text-xs font-medium rounded hover:bg-zinc-800 transition-colors"
                            disabled={isExporting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isExporting}
                            className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isExporting ? (
                                <>Generating Export...</>
                            ) : (
                                <>
                                    <FiDownload size={14} /> Export Data
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExportLeadsModal;
