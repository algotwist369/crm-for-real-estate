import React, { useEffect } from "react";
import { FiX, FiBell, FiCheckCircle, FiEye, FiTrash2 } from "react-icons/fi";

const NotificationItem = ({ title, description, time, read, onRead, onView, onClear }) => {
  return (
    <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-zinc-900/50 transition-all duration-200">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${read ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-zinc-800 border-zinc-700 text-zinc-300"}`}>
        <FiBell size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${read ? "text-zinc-300" : "text-white"} truncate`}>{title}</p>
        <p className="text-xs text-zinc-400 break-words">{description}</p>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{time}</span>
      </div>
      <div className="flex items-center justify-end gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onRead}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all ${read ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}
          title="Mark as read"
        >
          <FiCheckCircle size={14} />
        </button>
        <button
          type="button"
          onClick={onView}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
          title="View"
        >
          <FiEye size={14} />
        </button>
        <button
          type="button"
          onClick={onClear}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-all"
          title="Clear"
        >
          <FiTrash2 size={14} />
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
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute right-0 top-0 h-full w-full sm:w-[380px] md:w-[420px] lg:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in fade-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <FiBell size={18} />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Notifications</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {notifications.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="px-3 py-2 text-[10px] font-bold rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:text-white hover:bg-emerald-600/20 transition-all"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-3 py-2 text-[10px] font-bold rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-600/20 transition-all"
                  title="Clear all"
                >
                  Clear all
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 custom-scrollbar space-y-2">
          {notifications.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No notifications
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

        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};

