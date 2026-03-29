import React, { useState } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { useMarkLeadLost } from "../../hooks/useLeadHooks";

const MarkLostModal = ({ isOpen, onClose, lead, onStatusUpdated }) => {
    const [reason, setReason] = useState("");
    const markLostMutation = useMarkLeadLost();

    if (!isOpen || !lead) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        markLostMutation.mutate(
            { id: lead._id, data: { lost_reason: reason } },
            {
                onSuccess: () => {
                    onStatusUpdated && onStatusUpdated();
                    onClose();
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <FiAlertCircle size={18} />
                        </div>
                        <h2 className="text-sm font-medium text-white">Mark Lead as Lost</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block">
                            Lost Reason
                        </label>
                        <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why was this lead lost? (e.g., Budget issues, No response, Bought elsewhere)"
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-3 text-sm text-zinc-300 focus:outline-none focus:border-red-500/50 min-h-[120px] resize-none transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-zinc-800 text-zinc-400 text-xs font-medium rounded hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={markLostMutation.isPending}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                        >
                            {markLostMutation.isPending ? "Updating..." : "Confirm Lost Status"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarkLostModal;
