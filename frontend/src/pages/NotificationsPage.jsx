import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { FiBell, FiCheckCircle, FiEye, FiTrash2 } from "react-icons/fi";
import { Pagination } from "../component/common/Pagination";

const initialNotifications = [
  { title: "New Lead Assigned", description: "Lead #245 is assigned to you", time: "2m ago", read: false },
  { title: "Property Updated", description: "PROP003 status changed to sold", time: "15m ago", read: false },
  { title: "Agent Reminder", description: "Follow-up due today for Lead #198", time: "1h ago", read: false },
  { title: "System Notice", description: "Nightly backup completed successfully", time: "3h ago", read: true },
  { title: "Export Complete", description: "Reports exported successfully", time: "1d ago", read: true },
];

const NotificationRow = ({ n, onRead, onView, onClear }) => (
  <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2 sm:gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${n.read ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-zinc-800 border-zinc-700 text-zinc-300"}`}>
      <FiBell size={16} />
    </div>
    <div className="min-w-0">
      <p className={`text-sm font-semibold ${n.read ? "text-zinc-300" : "text-white"} truncate`}>{n.title}</p>
      <p className="text-xs text-zinc-400 break-words">{n.description}</p>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{n.time}</span>
    </div>
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      <button
        type="button"
        onClick={onRead}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all ${n.read ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}
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

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginated = notifications.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(notifications.length / rowsPerPage || 1);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);

  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-2">
          <div>
            <div className="bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit mb-3 border border-blue-500/20">
              Activity Center
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Notifications</h2>
            <p className="text-sm text-zinc-500 font-medium italic">View and manage all system alerts and updates</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={markAllRead}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:text-white hover:bg-emerald-600/20 transition-all"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-600/20 transition-all"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {paginated.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-zinc-800 rounded-2xl bg-zinc-950/50 text-zinc-500">
              No notifications
            </div>
          ) : (
            paginated.map((n, idx) => (
              <NotificationRow
                key={`${n.title}-${idx}`}
                n={n}
                onRead={() => setNotifications(prev => prev.map((m, i) => i === (page - 1) * rowsPerPage + idx ? ({ ...m, read: true }) : m))}
                onView={() => setNotifications(prev => prev.map((m, i) => i === (page - 1) * rowsPerPage + idx ? ({ ...m, read: true }) : m))}
                onClear={() => setNotifications(prev => prev.filter((_, i) => i !== (page - 1) * rowsPerPage + idx))}
              />
            ))
          )}
        </div>

        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(val) => { setRowsPerPage(val); setPage(1); }}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;

