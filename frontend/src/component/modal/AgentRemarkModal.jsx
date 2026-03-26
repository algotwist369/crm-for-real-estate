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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
            <div 
                className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <FiMessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Agent Remark</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">
                                {agent?.agent_details?.user_name || "Internal Note"}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                            Observation / Note
                        </label>
                        <textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Type a internal remark for this agent..."
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all min-h-[120px] resize-none placeholder:text-zinc-600"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-zinc-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-lg hover:shadow-white/5 flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? (
                            <FiLoader className="animate-spin" size={16} />
                        ) : (
                            <>
                                <FiSave className="group-hover:scale-110 transition-transform" size={16} />
                                Save Remark
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Tip */}
                <div className="px-6 py-4 bg-zinc-900/30 border-t border-zinc-900 flex items-center gap-2 text-[10px] text-zinc-600 font-medium italic">
                    <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                    Remarks are only visible to administrators.
                </div>
            </div>
        </div>
    );
};

export default AgentRemarkModal;
