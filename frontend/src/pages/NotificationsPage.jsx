import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { FiBell, FiCheckCircle, FiEye, FiTrash2, FiCheck } from "react-icons/fi";
import { Pagination } from "../component/common/Pagination";

const initialNotifications = [
  { title: "New Lead Assigned", description: "Lead #245 is assigned to you", time: "2m ago", read: false },
  { title: "Property Updated", description: "PROP003 status changed to sold", time: "15m ago", read: false },
  { title: "Agent Reminder", description: "Follow-up due today for Lead #198", time: "1h ago", read: false },
  { title: "System Notice", description: "Nightly backup completed successfully", time: "3h ago", read: true },
  { title: "Export Complete", description: "Reports exported successfully", time: "1d ago", read: true },
];

const NotificationRow = ({ n, onRead, onView, onClear }) => (
  <div className={`flex items-center gap-4 p-4 border-b border-zinc-800 transition-colors ${n.read ? "bg-zinc-950/20" : "bg-zinc-900/30"}`}>
    <div className={`w-10 h-10 rounded shrink-0 flex items-center justify-center ${n.read ? "bg-zinc-900 text-zinc-500" : "bg-blue-500/10 text-blue-500"}`}>
      <FiBell size={18} />
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-4 mb-1">
        <p className={`text-sm font-medium truncate ${n.read ? "text-zinc-400" : "text-zinc-100"}`}>
          {n.title}
        </p>
        <span className="text-xs text-zinc-500 shrink-0">{n.time}</span>
      </div>
      <p className="text-sm text-zinc-400 truncate">{n.description}</p>
    </div>

    <div className="flex items-center gap-2 shrink-0 ml-4">
      {!n.read && (
        <button
          type="button"
          onClick={onRead}
          className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
          title="Mark as read"
        >
          <FiCheck size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onView}
        className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        title="View details"
      >
        <FiEye size={14} />
      </button>
      <button
        type="button"
        onClick={onClear}
        className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
        title="Delete notification"
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  </div>
);

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginated = notifications.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(notifications.length / rowsPerPage) || 1;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-medium text-white mb-1">Notifications</h2>
          <p className="text-sm text-zinc-400">View and manage all system alerts and updates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={markAllRead}
            disabled={notifications.every(n => n.read)}
            className="px-4 py-2 text-sm font-medium rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="px-4 py-2 text-sm font-medium rounded bg-zinc-900 border border-zinc-800 text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Notifications List container */}
      <div className="border border-zinc-800 rounded bg-zinc-950/20 flex flex-col min-h-[400px]">
        {paginated.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-b border-zinc-800">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-zinc-500 mb-4">
              <FiBell size={20} />
            </div>
            <p className="text-zinc-300 font-medium mb-1">No notifications</p>
            <p className="text-sm text-zinc-500">You're all caught up! Check back later for new updates.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {paginated.map((n, idx) => (
              <NotificationRow
                key={`${n.title}-${idx}`}
                n={n}
                onRead={() => setNotifications(prev => prev.map((m, i) => i === (page - 1) * rowsPerPage + idx ? ({ ...m, read: true }) : m))}
                onView={() => setNotifications(prev => prev.map((m, i) => i === (page - 1) * rowsPerPage + idx ? ({ ...m, read: true }) : m))}
                onClear={() => setNotifications(prev => prev.filter((_, i) => i !== (page - 1) * rowsPerPage + idx))}
              />
            ))}
          </div>
        )}

        {/* Pagination Section */}
        {notifications.length > 0 && (
          <div className="p-4 bg-zinc-900/30 mt-auto">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(val) => { setRowsPerPage(val); setPage(1); }}
            />
          </div>
        )}
      </div>

    </AppLayout>
  );
};

export default NotificationsPage;
