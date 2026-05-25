import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { FiBarChart2, FiCalendar, FiCheckCircle, FiClock, FiFile, FiPaperclip, FiPlus, FiSearch, FiUsers, FiX } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import { closestCorners, DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useChatUsers } from "../hooks/useChatHooks";
import {
    useCreateTask,
    useCreateWorkspace,
    useAddTaskComment,
    useMoveTask,
    useTaskAnalytics,
    useTaskBoard,
    useTaskWorkspaces,
    useUpdateTask,
    useUploadTaskAttachment
} from "../hooks/useTaskHooks";

const columns = [
    { key: "todo", label: "Todo" },
    { key: "in_progress", label: "In Progress" },
    { key: "review", label: "Review" },
    { key: "completed", label: "Completed" }
];

const priorityClass = {
    low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    medium: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    high: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    urgent: "border-red-500/20 bg-red-500/10 text-red-300"
};

const taskColors = {
    default: {
        label: "Default",
        card: "border-zinc-800 bg-zinc-950",
        swatch: "bg-zinc-900 border-zinc-700"
    },
    slate: {
        label: "Slate",
        card: "border-slate-500/30 bg-slate-500/10",
        swatch: "bg-slate-500 border-slate-300"
    },
    blue: {
        label: "Blue",
        card: "border-blue-500/30 bg-blue-500/10",
        swatch: "bg-blue-500 border-blue-300"
    },
    emerald: {
        label: "Emerald",
        card: "border-emerald-500/30 bg-emerald-500/10",
        swatch: "bg-emerald-500 border-emerald-300"
    },
    amber: {
        label: "Amber",
        card: "border-amber-500/30 bg-amber-500/10",
        swatch: "bg-amber-500 border-amber-300"
    },
    rose: {
        label: "Rose",
        card: "border-rose-500/30 bg-rose-500/10",
        swatch: "bg-rose-500 border-rose-300"
    },
    violet: {
        label: "Violet",
        card: "border-violet-500/30 bg-violet-500/10",
        swatch: "bg-violet-500 border-violet-300"
    }
};

const isOverdue = (task) => task.deadline && task.status !== "completed" && new Date(task.deadline).getTime() < Date.now();
const datetimeLocalValue = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";
const userName = (users, id) => users.find(item => String(item._id) === String(id))?.user_name || "User";
const canEditTask = (task, user) => ["admin", "super_admin"].includes(user?.role) || (task?.assignedTo || []).some(id => String(id) === String(user?._id));
const createSubtask = (item = {}) => ({
    clientId: item.clientId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: item.title || "",
    done: Boolean(item.done),
    doneAt: item.doneAt
});

const upsertTaskInBoard = (boardData, task) => {
    if (!boardData?.data || !task?._id) return boardData;
    const nextColumns = Object.fromEntries(columns.map(column => {
        const current = boardData.data.columns?.[column.key] || [];
        return [column.key, current.filter(item => String(item._id) !== String(task._id))];
    }));
    nextColumns[task.status || "todo"] = [...(nextColumns[task.status || "todo"] || []), task]
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    const nextTasks = Object.values(nextColumns).flat();
    return {
        ...boardData,
        data: {
            ...boardData.data,
            columns: nextColumns,
            tasks: nextTasks
        }
    };
};

const DropIndicator = () => (
    <div className="h-12 rounded border border-dashed border-yellow-400/70 bg-yellow-400/10 shadow-[0_0_0_1px_rgba(250,204,21,0.18)]">
        <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-yellow-300">
            Drop here
        </div>
    </div>
);

const TaskCardContent = ({ task, dragging = false, dragHandleProps = {}, setNodeRef, style, onOpen }) => (
    <article
        ref={setNodeRef}
        style={style}
        {...dragHandleProps}
        onClick={onOpen}
        className={`touch-none select-none rounded border p-3 shadow-sm transition hover:border-zinc-700 ${taskColors[task.color || "default"]?.card || taskColors.default.card} ${dragging ? "scale-[0.98] opacity-35 ring-1 ring-yellow-400/40" : "cursor-grab active:cursor-grabbing"}`}
    >
        <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold leading-5 text-zinc-100">{task.title}</h3>
            <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityClass[task.priority] || priorityClass.medium}`}>
                {task.priority}
            </span>
        </div>
        {task.description && <p className="mb-3 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p>}
        <div className="flex flex-wrap gap-1.5">
            {(task.labels || []).map(label => (
                <span key={label} className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{label}</span>
            ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
            <span className={`flex items-center gap-1 ${isOverdue(task) ? "text-red-300" : ""}`}>
                <FiCalendar size={12} />
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
            </span>
            <span className="flex items-center gap-1"><FiUsers size={12} />{task.assignedTo?.length || 0}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-900 pt-3 text-[10px] text-zinc-600">
            <span>{task.subtasks?.filter(item => item.done).length || 0}/{task.subtasks?.length || 0} checks</span>
            <span>{task.comments?.length || 0} comments</span>
            <span>{task.attachments?.length || 0} files</span>
        </div>
    </article>
);

const SortableTaskCard = ({ task, dragging, onOpen }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: String(task._id),
        data: { type: "task", task }
    });

    return (
        <TaskCardContent
            task={task}
            dragging={dragging || isDragging}
            setNodeRef={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition
            }}
            dragHandleProps={{ ...attributes, ...listeners }}
            onOpen={onOpen}
        />
    );
};

const BoardColumn = ({ column, tasks, count, dragState, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `column:${column.key}`,
        data: { type: "column", status: column.key }
    });
    const isDropColumn = dragState.task && dragState.overStatus === column.key;

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[520px] rounded border bg-zinc-900/40 transition ${isDropColumn || isOver ? "border-yellow-400/60 bg-yellow-400/[0.04] shadow-[0_0_0_1px_rgba(250,204,21,0.16)]" : "border-zinc-800"}`}
        >
            <div className={`sticky top-16 z-10 flex items-center justify-between border-b px-4 py-3 transition ${isDropColumn || isOver ? "border-yellow-400/40 bg-zinc-950 text-yellow-200" : "border-zinc-800 bg-zinc-950"}`}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{column.label}</h2>
                <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500">{count}</span>
            </div>
            <SortableContext items={tasks.map(task => String(task._id))} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 p-3">{children}</div>
            </SortableContext>
        </div>
    );
};

const TaskDetailsModal = ({
    task,
    users,
    user,
    onClose,
    updateTaskMutation,
    moveTaskMutation,
    addCommentMutation,
    uploadAttachmentMutation
}) => {
    const editable = canEditTask(task, user);
    const [form, setForm] = useState({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        color: task.color || "default",
        status: task.status || "todo",
        deadline: datetimeLocalValue(task.deadline),
        assignedTo: (task.assignedTo || []).map(String),
        labels: (task.labels || []).join(", ")
    });
    const [subtasks, setSubtasks] = useState((task.subtasks || []).map(createSubtask));
    const [comment, setComment] = useState("");
    const [attachment, setAttachment] = useState(null);

    const toggleAssignee = (userId) => {
        setForm(current => ({
            ...current,
            assignedTo: current.assignedTo.includes(userId)
                ? current.assignedTo.filter(id => id !== userId)
                : [...current.assignedTo, userId]
        }));
    };

    const saveTask = async () => {
        if (!editable) return;
        const updatePayload = {
            subtasks: subtasks.map(({ title, done, doneAt }) => ({ title, done, doneAt })),
            deadline: form.deadline || ""
        };
        updatePayload.color = form.color;
        if (editable) {
            updatePayload.title = form.title;
            updatePayload.description = form.description;
            updatePayload.priority = form.priority;
            updatePayload.labels = form.labels.split(",").map(label => label.trim()).filter(Boolean);
            updatePayload.assignedTo = form.assignedTo;
        }
        await updateTaskMutation.mutateAsync({ id: task._id, data: updatePayload });
        if (form.status !== task.status) {
            await moveTaskMutation.mutateAsync({ id: task._id, data: { status: form.status, position: task.position } });
        }
    };

    const addSubtask = () => setSubtasks(current => [...current, createSubtask()]);

    const addComment = async () => {
        if (!comment.trim()) return;
        await addCommentMutation.mutateAsync({ id: task._id, text: comment.trim() });
        setComment("");
    };

    const uploadFile = async () => {
        if (!attachment) return;
        const data = new FormData();
        data.append("attachment", attachment);
        await uploadAttachmentMutation.mutateAsync({ id: task._id, data });
        setAttachment(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-[min(980px,100%)] flex-col overflow-hidden rounded border border-zinc-800 bg-zinc-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <div>
                        <p className="text-sm font-semibold text-white">Task Details</p>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600">{editable ? "Editable" : "Read only"}</p>
                    </div>
                    <button onClick={onClose} className="rounded border border-zinc-800 p-2 text-zinc-500 hover:text-white"><FiX /></button>
                </div>

                <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4 border-r border-zinc-800 p-5">
                        <input disabled={!editable} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded border border-zinc-800 bg-black px-3 py-2 text-lg font-semibold text-white outline-none disabled:opacity-70" />
                        <textarea disabled={!editable} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Description" className="w-full resize-none rounded border border-zinc-800 bg-black px-3 py-2 text-sm leading-6 text-zinc-200 outline-none disabled:opacity-70" />

                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className="text-xs text-zinc-500">
                                Priority
                                <select disabled={!editable} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none disabled:opacity-70">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </label>
                            <label className="text-xs text-zinc-500">
                                Status
                                <select disabled={!editable} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none disabled:opacity-70">
                                    {columns.map(column => <option key={column.key} value={column.key}>{column.label}</option>)}
                                </select>
                            </label>
                            <label className="text-xs text-zinc-500">
                                Deadline
                                <input disabled={!editable} type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none disabled:opacity-70" />
                            </label>
                        </div>

                        <label className="block text-xs text-zinc-500">
                            Labels
                            <input disabled={!editable} value={form.labels} onChange={e => setForm({ ...form, labels: e.target.value })} placeholder="sales, urgent, client" className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none disabled:opacity-70" />
                        </label>

                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-white">Card Color</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(taskColors).map(([key, color]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        disabled={!editable}
                                        onClick={() => setForm({ ...form, color: key })}
                                        title={color.label}
                                        className={`h-8 w-8 rounded border-2 transition ${color.swatch} ${form.color === key ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-950" : "opacity-80 hover:opacity-100"} disabled:cursor-not-allowed disabled:opacity-40`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white">Checklist</h3>
                                {editable && <button onClick={addSubtask} className="rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white">Add</button>}
                            </div>
                            <div className="space-y-2">
                                {subtasks.map((item, index) => (
                                    <label key={item.clientId} className="flex items-center gap-2 rounded border border-zinc-800 bg-black px-3 py-2">
                                        <input disabled={!editable} type="checkbox" checked={Boolean(item.done)} onChange={e => setSubtasks(current => current.map((subtask, i) => i === index ? { ...subtask, done: e.target.checked } : subtask))} />
                                        <input disabled={!editable} value={item.title} onChange={e => setSubtasks(current => current.map((subtask, i) => i === index ? { ...subtask, title: e.target.value } : subtask))} className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none disabled:opacity-70" placeholder="Checklist item" />
                                    </label>
                                ))}
                                {!subtasks.length && <p className="rounded border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-600">No checklist items.</p>}
                            </div>
                        </div>

                        <button onClick={saveTask} disabled={!editable || updateTaskMutation.isPending || moveTaskMutation.isPending} className="rounded bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 disabled:opacity-50">
                            Save Changes
                        </button>
                    </div>

                    <aside className="space-y-5 p-5">
                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-white">Assigned Members</h3>
                            <div className="max-h-36 space-y-1 overflow-y-auto rounded border border-zinc-800 bg-black p-2">
                                {users.map(item => (
                                    <label key={item._id} className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-300">
                                        <input disabled={!editable} type="checkbox" checked={form.assignedTo.includes(item._id)} onChange={() => toggleAssignee(item._id)} />
                                        {item.user_name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-white">Comments</h3>
                            <div className="max-h-44 space-y-2 overflow-y-auto rounded border border-zinc-800 bg-black p-3">
                                {(task.comments || []).map((item, index) => (
                                    <div key={`${item.createdAt}-${index}`} className="border-b border-zinc-900 pb-2 last:border-0">
                                        <p className="text-xs font-semibold text-zinc-300">{userName(users, item.userId)}</p>
                                        <p className="mt-1 text-xs leading-5 text-zinc-500">{item.text}</p>
                                    </div>
                                ))}
                                {!task.comments?.length && <p className="text-xs text-zinc-600">No comments yet.</p>}
                            </div>
                            {editable && (
                                <div className="mt-2 flex gap-2">
                                    <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add comment" className="min-w-0 flex-1 rounded border border-zinc-800 bg-black px-3 py-2 text-xs text-white outline-none" />
                                    <button onClick={addComment} disabled={addCommentMutation.isPending} className="rounded border border-zinc-800 px-3 text-xs text-zinc-300 hover:text-white disabled:opacity-50">Send</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-white">Files</h3>
                            <div className="space-y-2">
                                {(task.attachments || []).map(file => (
                                    <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-300 hover:text-yellow-300">
                                        <FiFile /> <span className="truncate">{file.name}</span>
                                    </a>
                                ))}
                                {!task.attachments?.length && <p className="rounded border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-600">No files attached.</p>}
                            </div>
                            {editable && (
                                <div className="mt-2 flex gap-2">
                                    <input type="file" onChange={e => setAttachment(e.target.files?.[0] || null)} className="min-w-0 flex-1 rounded border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-400" />
                                    <button onClick={uploadFile} disabled={!attachment || uploadAttachmentMutation.isPending} className="rounded border border-zinc-800 px-3 text-xs text-zinc-300 hover:text-white disabled:opacity-50"><FiPaperclip /></button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-white">Activity</h3>
                            <div className="max-h-44 space-y-2 overflow-y-auto rounded border border-zinc-800 bg-black p-3">
                                {(task.activity || []).slice().reverse().map((item, index) => (
                                    <div key={`${item.createdAt}-${index}`} className="text-xs text-zinc-500">
                                        <span className="text-zinc-300">{userName(users, item.userId)}</span> {String(item.action || "").replace(/_/g, " ")}
                                        <span className="block text-[10px] text-zinc-700">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

const TasksPage = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
    const [search, setSearch] = useState("");
    const [workspaceForm, setWorkspaceForm] = useState({ name: "", description: "" });
    const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", color: "default", deadline: "", assignedTo: "", labels: "" });
    const [dragState, setDragState] = useState({ task: null, overStatus: "", overIndex: -1 });
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const workspacesQuery = useTaskWorkspaces();
    const analyticsQuery = useTaskAnalytics();
    const usersQuery = useChatUsers();
    const createWorkspaceMutation = useCreateWorkspace();
    const createTaskMutation = useCreateTask();
    const moveTaskMutation = useMoveTask();
    const updateTaskMutation = useUpdateTask();
    const addCommentMutation = useAddTaskComment();
    const uploadAttachmentMutation = useUploadTaskAttachment();

    const workspaces = useMemo(() => workspacesQuery.data?.data || [], [workspacesQuery.data]);
    const users = useMemo(() => usersQuery.data?.data || [], [usersQuery.data]);
    const isAdmin = ["admin", "super_admin"].includes(user?.role);
    const currentWorkspaceId = activeWorkspaceId || workspaces[0]?._id || "";
    const boardFilters = useMemo(() => ({ search }), [search]);
    const boardQuery = useTaskBoard(currentWorkspaceId, boardFilters);
    const board = boardQuery.data?.data;
    const analytics = analyticsQuery.data?.data;
    const selectedTask = useMemo(
        () => (board?.tasks || []).find(task => String(task._id) === String(selectedTaskId)) || null,
        [board?.tasks, selectedTaskId]
    );

    useEffect(() => {
        if (!socket || !currentWorkspaceId) return undefined;
        socket.emit("task:join-workspace", { workspaceId: currentWorkspaceId });
        const applyTaskUpdate = (task) => {
            if (!task || String(task.workspaceId) !== String(currentWorkspaceId)) return;
            queryClient.setQueriesData({ queryKey: ["task-board", currentWorkspaceId] }, old => upsertTaskInBoard(old, task));
            queryClient.invalidateQueries(["task-analytics"]);
        };
        const refreshWorkspace = () => {
            queryClient.invalidateQueries(["task-workspaces"]);
            queryClient.invalidateQueries(["task-board", currentWorkspaceId]);
        };
        socket.on("task:new", applyTaskUpdate);
        socket.on("task:update", applyTaskUpdate);
        socket.on("task:workspace:update", refreshWorkspace);
        return () => {
            socket.off("task:new", applyTaskUpdate);
            socket.off("task:update", applyTaskUpdate);
            socket.off("task:workspace:update", refreshWorkspace);
        };
    }, [socket, currentWorkspaceId, queryClient]);

    const columnsData = board?.columns || {};
    const statusTotals = useMemo(() => {
        const map = {};
        (analytics?.byStatus || []).forEach(item => { map[item._id] = item.count; });
        return map;
    }, [analytics]);

    const createWorkspace = async (event) => {
        event.preventDefault();
        const response = await createWorkspaceMutation.mutateAsync(workspaceForm);
        setWorkspaceForm({ name: "", description: "" });
        if (response?.data?._id) setActiveWorkspaceId(response.data._id);
    };

    const createTask = async (event) => {
        event.preventDefault();
        if (!currentWorkspaceId) return;
        await createTaskMutation.mutateAsync({
            workspaceId: currentWorkspaceId,
            data: {
                ...taskForm,
                assignedTo: taskForm.assignedTo ? [taskForm.assignedTo] : [],
                labels: taskForm.labels.split(",").map(label => label.trim()).filter(Boolean)
            }
        });
        setTaskForm({ title: "", description: "", priority: "medium", color: "default", deadline: "", assignedTo: "", labels: "" });
    };

    const getColumnTasks = (status) => columnsData[status] || [];

    const getDropPosition = (status, index, taskId) => {
        const items = getColumnTasks(status).filter(item => String(item._id) !== String(taskId));
        if (!items.length) return 1;
        if (index <= 0) return (Number(items[0]?.position) || 1) - 1;
        if (index >= items.length) return (Number(items[items.length - 1]?.position) || items.length) + 1;
        const previous = Number(items[index - 1]?.position) || index;
        const next = Number(items[index]?.position) || index + 1;
        return previous === next ? next + 0.1 : (previous + next) / 2;
    };

    const findTaskLocation = (taskId) => {
        for (const column of columns) {
            const index = getColumnTasks(column.key).findIndex(item => String(item._id) === String(taskId));
            if (index !== -1) return { status: column.key, index, task: getColumnTasks(column.key)[index] };
        }
        return null;
    };

    const getOverTarget = (event) => {
        const { active, over } = event;
        if (!active || !over) return null;

        if (over.data.current?.type === "column") {
            const status = over.data.current.status;
            const index = getColumnTasks(status).filter(item => String(item._id) !== String(active.id)).length;
            return { status, index };
        }

        const overLocation = findTaskLocation(over.id);
        if (!overLocation) return null;

        const activeCenter = active.rect.current.translated
            ? active.rect.current.translated.top + active.rect.current.translated.height / 2
            : active.rect.current.initial.top + active.rect.current.initial.height / 2;
        const overCenter = over.rect.top + over.rect.height / 2;
        const items = getColumnTasks(overLocation.status).filter(item => String(item._id) !== String(active.id));
        const overIndex = items.findIndex(item => String(item._id) === String(over.id));
        return {
            status: overLocation.status,
            index: Math.max(0, overIndex + (activeCenter > overCenter ? 1 : 0))
        };
    };

    const resetDragState = () => setDragState({ task: null, overStatus: "", overIndex: -1 });

    const handleDragStart = (event) => {
        const location = findTaskLocation(event.active.id);
        if (!location) return;
        setDragState({ task: location.task, overStatus: location.status, overIndex: location.index });
    };

    const handleDragOver = (event) => {
        const target = getOverTarget(event);
        if (!target) return;
        setDragState(current => {
            if (!current.task) return current;
            if (current.overStatus === target.status && current.overIndex === target.index) return current;
            return { ...current, overStatus: target.status, overIndex: target.index };
        });
    };

    const handleDragEnd = (event) => {
        const taskId = String(event.active?.id || "");
        const target = getOverTarget(event) || (dragState.overStatus ? { status: dragState.overStatus, index: dragState.overIndex } : null);
        if (!taskId || !target) {
            resetDragState();
            return;
        }
        const targetStatus = target.status;
        const targetIndex = Math.max(0, target.index);
        const position = getDropPosition(targetStatus, targetIndex, taskId);
        moveTaskMutation.mutate({ id: taskId, data: { status: targetStatus, position } });
        resetDragState();
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Task Management</h1>
                        <p className="mt-1 text-sm text-zinc-500">Kanban workspaces, task ownership, deadline tracking, and live team updates.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {columns.map(col => (
                            <div key={col.key} className="rounded border border-zinc-800 bg-zinc-950 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-zinc-600">{col.label}</p>
                                <p className="mt-1 text-lg font-semibold text-white">{statusTotals[col.key] || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    <aside className="space-y-4">
                        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-white">Workspaces</h2>
                                <FiBarChart2 className="text-zinc-600" />
                            </div>
                            <div className="space-y-2">
                                {workspaces.map(workspace => (
                                    <button
                                        key={workspace._id}
                                        onClick={() => setActiveWorkspaceId(workspace._id)}
                                        className={`w-full rounded border px-3 py-2 text-left text-sm ${currentWorkspaceId === workspace._id ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200" : "border-zinc-800 bg-black text-zinc-400 hover:text-white"}`}
                                    >
                                        {workspace.name}
                                    </button>
                                ))}
                                {!workspaces.length && <p className="text-xs text-zinc-600">No workspace yet.</p>}
                            </div>
                        </div>

                        {isAdmin && (
                            <form onSubmit={createWorkspace} className="rounded border border-zinc-800 bg-zinc-950 p-4">
                                <h2 className="mb-3 text-sm font-semibold text-white">New Workspace</h2>
                                <input value={workspaceForm.name} onChange={e => setWorkspaceForm({ ...workspaceForm, name: e.target.value })} placeholder="Project name" className="mb-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none" />
                                <textarea value={workspaceForm.description} onChange={e => setWorkspaceForm({ ...workspaceForm, description: e.target.value })} placeholder="Description" rows={3} className="mb-3 w-full resize-none rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none" />
                                <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-yellow-500 px-3 py-2 text-xs font-semibold text-black hover:bg-yellow-400"><FiPlus />Create</button>
                            </form>
                        )}
                    </aside>

                    <section className="min-w-0 space-y-4">
                        <div className="flex flex-col gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2 rounded border border-zinc-800 bg-black px-3 py-2">
                                <FiSearch className="text-zinc-600" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks" className="w-64 bg-transparent text-sm text-white outline-none" />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <span className="flex items-center gap-1 text-red-300"><FiClock />{analytics?.overdue || 0} overdue</span>
                                <span className="flex items-center gap-1"><FiCheckCircle />Live board</span>
                            </div>
                        </div>

                        {isAdmin && currentWorkspaceId && (
                            <form onSubmit={createTask} className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-7">
                                <input required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none md:col-span-2" />
                                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <select value={taskForm.color} onChange={e => setTaskForm({ ...taskForm, color: e.target.value })} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none">
                                    {Object.entries(taskColors).map(([key, color]) => <option key={key} value={key}>{color.label}</option>)}
                                </select>
                                <input type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none" />
                                <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none">
                                    <option value="">Unassigned</option>
                                    {users.map(item => <option key={item._id} value={item._id}>{item.user_name}</option>)}
                                </select>
                                <button className="rounded bg-yellow-500 px-3 py-2 text-xs font-semibold text-black hover:bg-yellow-400">Add Task</button>
                                <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Description" rows={2} className="resize-none rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none md:col-span-4" />
                                <input value={taskForm.labels} onChange={e => setTaskForm({ ...taskForm, labels: e.target.value })} placeholder="Labels, comma separated" className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none md:col-span-3" />
                            </form>
                        )}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onDragCancel={resetDragState}
                        >
                            <div className="grid gap-4 xl:grid-cols-4">
                                {columns.map(column => {
                                    const visibleTasks = (columnsData[column.key] || []).filter(task => String(task._id) !== String(dragState.task?._id));
                                    const isDropColumn = dragState.task && dragState.overStatus === column.key;

                                    return (
                                        <BoardColumn
                                            key={column.key}
                                            column={column}
                                            tasks={columnsData[column.key] || []}
                                            count={columnsData[column.key]?.length || 0}
                                            dragState={dragState}
                                        >
                                            {isDropColumn && dragState.overIndex === 0 && <DropIndicator />}
                                            {visibleTasks.map((task, index) => (
                                                <React.Fragment key={task._id}>
                                                    <SortableTaskCard task={task} dragging={false} onOpen={() => setSelectedTaskId(task._id)} />
                                                    {isDropColumn && dragState.overIndex === index + 1 && <DropIndicator />}
                                                </React.Fragment>
                                            ))}
                                            {!visibleTasks.length && !(isDropColumn && dragState.overIndex === 0) && (
                                                <div className="rounded border border-dashed border-zinc-800 px-3 py-10 text-center text-xs text-zinc-600">
                                                    Drop task here
                                                </div>
                                            )}
                                        </BoardColumn>
                                    );
                                })}
                            </div>
                            <DragOverlay>
                                {dragState.task ? (
                                    <div className="w-72 rotate-1 opacity-95 shadow-2xl">
                                        <TaskCardContent task={dragState.task} />
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </section>
                </div>
            </div>
            {selectedTask && (
                <TaskDetailsModal
                    key={selectedTask._id}
                    task={selectedTask}
                    users={users}
                    user={user}
                    onClose={() => setSelectedTaskId("")}
                    updateTaskMutation={updateTaskMutation}
                    moveTaskMutation={moveTaskMutation}
                    addCommentMutation={addCommentMutation}
                    uploadAttachmentMutation={uploadAttachmentMutation}
                />
            )}
        </AppLayout>
    );
};

export default TasksPage;
