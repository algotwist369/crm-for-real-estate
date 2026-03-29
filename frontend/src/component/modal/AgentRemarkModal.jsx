import React, { useState, useEffect } from "react";
import { FiX, FiMessageSquare, FiSave, FiLoader } from "react-icons/fi";
import { useUpdateAgentRemark } from "../../hooks/useAgentHooks";

const AgentRemarkModal = ({ isOpen, onClose, agent }) => {
    const [remark, setRemark] = useState("");
    const { mutate: updateRemark, isLoading } = useUpdateAgentRemark();

    useEffect(() => {
        if (agent) {
            setRemark(agent.remark || "");
        }
    }, [agent, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        updateRemark(
            { id: agent._id, remark },
            {
                onSuccess: () => {
                    onClose();
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div 
                className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-medium text-white">Agent Remark</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">{agent?.agent_details?.user_name || "Internal Note"}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5">Observation / Note</label>
                        <textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Type a internal remark for this agent..."
                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-2 h-32 resize-none focus:outline-none focus:border-zinc-700"
                            autoFocus
                        />
                        <p className="text-[10px] text-zinc-500 mt-2 italic">Remarks are only visible to administrators.</p>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-yellow-600 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50 flex items-center gap-2">
                            {isLoading ? "Saving..." : "Save Remark"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentRemarkModal;
