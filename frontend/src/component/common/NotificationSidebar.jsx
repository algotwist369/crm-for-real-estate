import React, { useEffect } from "react";
import { FiX, FiBell, FiCheckCircle, FiEye, FiTrash2 } from "react-icons/fi";

const NotificationItem = ({ title, description, time, read, onRead, onView, onClear }) => {
    return (
        <div className="grid grid-cols-[auto,1fr,auto] items-start gap-4 p-3 rounded bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${read ? "bg-zinc-800 text-zinc-600 border border-zinc-700/50" : "bg-yellow-600/10 text-yellow-500 border border-yellow-500/20"}`}>
                <FiBell size={14} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-xs font-medium truncate ${read ? "text-zinc-500" : "text-white"}`}>{title}</p>
                    {!read && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></span>}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-1.5 line-clamp-2">{description}</p>
                <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">{time}</span>
            </div>
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={onRead}
                    className={`p-1.5 rounded border transition-all ${read ? "bg-zinc-800 border-zinc-700 text-zinc-600" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30"}`}
                    title="Mark as read"
                >
                    <FiCheckCircle size={12} />
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                    title="Remove"
                >
                    <FiTrash2 size={12} />
                </button>
            </div>
        </div>
    );
};

export const NotificationSidebar = ({ isOpen, onClose, notifications = [], onMarkAllRead, onClearAll, onReadItem, onViewItem, onClearItem }) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <aside
                className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                            <FiBell size={16} />
                        </div>
                        <h2 className="text-sm font-semibold text-white tracking-wider uppercase">Notifications</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white rounded hover:bg-zinc-900 transition-colors"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
                    {notifications.length > 0 && (
                        <div className="flex items-center justify-between mb-2 px-2">
                             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                Recent Activities
                             </span>
                             <div className="flex gap-3">
                                <button
                                    onClick={onMarkAllRead}
                                    className="text-[10px] text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest"
                                >
                                    Mark All Read
                                </button>
                                <button
                                    onClick={onClearAll}
                                    className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest"
                                >
                                    Clear All
                                </button>
                             </div>
                        </div>
                    )}

                    {notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 mb-4 border border-zinc-800">
                                <FiBell size={24} />
                            </div>
                            <h3 className="text-zinc-400 text-sm font-medium mb-1">Stay updated</h3>
                            <p className="text-zinc-600 text-xs">When you receive new leads or reminders, they'll appear here.</p>
                        </div>
                    ) : (
                        notifications.map((n, idx) => (
                            <NotificationItem
                                key={idx}
                                title={n.title}
                                description={n.description}
                                time={n.time}
                                read={!!n.read}
                                onRead={() => onReadItem?.(idx)}
                                onView={() => onViewItem?.(idx)}
                                onClear={() => onClearItem?.(idx)}
                            />
                        ))
                    )}
                </div>

                {/* Footer Toolbar */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded border border-zinc-800 transition-colors"
                    >
                        Minimize Panel
                    </button>
                </div>
            </aside>
        </div>
    );
};
