import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { FiBell, FiEye, FiTrash2, FiCheck } from "react-icons/fi";
import { Pagination } from "../component/common/Pagination";

import { useNotification } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

const NotificationRow = ({ n, onRead, onView, onClear }) => (
  <div className={`flex items-center gap-4 p-4 border-b border-zinc-800 transition-colors ${n.is_read ? "bg-zinc-950/20" : "bg-zinc-900/30"}`}>
    <div className={`w-10 h-10 rounded shrink-0 flex items-center justify-center ${n.is_read ? "bg-zinc-900 text-zinc-500" : "bg-yellow-500/10 text-yellow-500"}`}>
      <FiBell size={18} />
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-4 mb-1">
        <p className={`text-sm font-medium truncate ${n.is_read ? "text-zinc-400" : "text-zinc-100"}`}>
          {n.title}
        </p>
        <span className="text-xs text-zinc-500 shrink-0">
          {new Date(n.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <p className="text-sm text-zinc-400 truncate">{n.message}</p>
    </div>

    <div className="flex items-center gap-2 shrink-0 ml-4">
      {!n.is_read && (
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
  const { notifications, loading, markAsRead, markAllRead, clearAll, deleteOne } = useNotification();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const paginated = notifications.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (loading && notifications.length === 0) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-pulse">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-zinc-700 mb-4">
             <FiBell size={20} />
          </div>
          <p className="text-zinc-500 font-medium">Loading notifications...</p>
        </div>
      </AppLayout>
    );
  }

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
            disabled={notifications.every(n => n.is_read)}
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
            {paginated.map((n) => (
              <NotificationRow
                key={n._id}
                n={n}
                onRead={() => markAsRead(n._id)}
                onView={() => {
                   markAsRead(n._id);
                   if (n.action_url) navigate(n.action_url);
                }}
                onClear={() => deleteOne(n._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination Section */}
        {notifications.length > 0 && (
          <div className="p-4 bg-zinc-900/30 mt-auto">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(notifications.length / rowsPerPage) || 1}
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
