import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FiCornerUpLeft,
    FiDownload,
    FiEdit2,
    FiMessageCircle,
    FiPaperclip,
    FiSearch,
    FiSend,
    FiSmile,
    FiStar,
    FiUsers,
    FiX
} from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { chatService } from "../../api/chat.service";
import {
    useChatConversations,
    useChatMessages,
    useChatUsers,
    useCreateChatGroup,
    useSendChatMessage,
    useStartDirectConversation
} from "../../hooks/useChatHooks";

const emojis = ["🙂", "👍", "🙏", "🔥", "✅", "📌", "🎉", "💬"];
const initials = (name = "") => name.trim().slice(0, 1).toUpperCase() || "U";
const timeLabel = (date) => date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const getMemberId = (member) => String(member?.userId?._id || member?.userId || member || "");
const getAvatarUrl = (person = {}) => person.profile_pic || person.avatar || person.photo || "";

const getDirectPeer = (conversation, users, currentUserId) => {
    if (!conversation || conversation.type !== "direct") return null;
    const otherMemberId = (conversation.members || [])
        .map(getMemberId)
        .find(memberId => memberId && memberId !== String(currentUserId));
    return users.find(item => String(item._id) === String(otherMemberId)) || null;
};

const getConversationMeta = (conversation, users, currentUserId) => {
    if (!conversation) {
        return { name: "Select a chat", avatar: "", initials: "C", online: false, subtitle: "Start with a teammate" };
    }

    if (conversation.type === "direct") {
        const peer = getDirectPeer(conversation, users, currentUserId);
        const name = peer?.user_name || conversation.name || "Direct chat";
        return {
            name,
            avatar: getAvatarUrl(peer),
            initials: initials(name),
            online: Boolean(peer?.online),
            subtitle: peer?.role || "Direct message"
        };
    }

    return {
        name: conversation.name || "Group chat",
        avatar: conversation.avatar || "",
        initials: initials(conversation.name || "G"),
        online: false,
        subtitle: `${conversation.members?.length || 0} members`
    };
};

const isImageAttachment = (fileItem = {}) => fileItem.type === "image" || String(fileItem.mimeType || "").startsWith("image/");
const isVideoAttachment = (fileItem = {}) => fileItem.type === "video" || String(fileItem.mimeType || "").startsWith("video/");
const isPdfAttachment = (fileItem = {}) => String(fileItem.mimeType || "").toLowerCase() === "application/pdf";
const getDownloadName = (fileItem = {}) => String(fileItem.name || "chat-attachment").replace(/[\\/:*?"<>|]+/g, "-");
const CHAT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
const allowedChatFileTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const getReplyPreviewText = (message) => {
    if (!message) return "";
    if (typeof message === "string") return "Original message";
    if (message.text) return message.text;
    return message.attachments?.[0]?.name || "Attachment";
};

const validateChatFile = (nextFile) => {
    if (!nextFile) return "";
    if (!allowedChatFileTypes.has(nextFile.type)) return "Unsupported file type";
    if (nextFile.size > CHAT_ATTACHMENT_MAX_BYTES) return "File must be 20MB or smaller";
    return "";
};

const getMentionIds = (text, users) => {
    const lowerText = String(text || "").toLowerCase();
    return users
        .filter(item => lowerText.includes(`@${String(item.user_name || "").toLowerCase()}`))
        .map(item => item._id);
};

const mergeById = (items = [], nextItem) => {
    if (!nextItem?._id) return items;
    const exists = items.some(item => String(item._id) === String(nextItem._id));
    return exists
        ? items.map(item => String(item._id) === String(nextItem._id) ? { ...item, ...nextItem } : item)
        : [...items, nextItem];
};

const updateConversationPreview = (items = [], conversationId, message) => {
    const nextItems = items.map(item => {
        if (String(item._id) !== String(conversationId)) return item;
        return {
            ...item,
            lastMessage: {
                text: message.text || message.attachments?.[0]?.name || "Attachment",
                senderId: message.senderId,
                sentAt: message.createdAt
            },
            updatedAt: message.createdAt
        };
    });
    return nextItems.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
};

const ChatWidget = () => {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const audioContextRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [draft, setDraft] = useState("");
    const [file, setFile] = useState(null);
    const [peopleSearch, setPeopleSearch] = useState("");
    const [messageSearch, setMessageSearch] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [groupName, setGroupName] = useState("");
    const [groupMemberIds, setGroupMemberIds] = useState([]);
    const [previewAttachment, setPreviewAttachment] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const usersQuery = useChatUsers();
    const conversationsQuery = useChatConversations();
    const messagesQuery = useChatMessages(selectedConversation?._id, { search: messageSearch || undefined });
    const startDirectMutation = useStartDirectConversation();
    const createGroupMutation = useCreateChatGroup();
    const sendMessageMutation = useSendChatMessage();

    const conversations = useMemo(() => conversationsQuery.data?.data || [], [conversationsQuery.data]);
    const users = useMemo(() => usersQuery.data?.data || [], [usersQuery.data]);
    const messages = useMemo(() => messagesQuery.data?.data || [], [messagesQuery.data]);
    const unreadTotal = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
    const selectedMeta = useMemo(
        () => getConversationMeta(selectedConversation, users, user?._id),
        [selectedConversation, users, user?._id]
    );
    const filePreviewUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

    const selectedTyping = typingUsers[selectedConversation?._id] || [];

    useEffect(() => {
        if (!filePreviewUrl) return undefined;
        return () => URL.revokeObjectURL(filePreviewUrl);
    }, [filePreviewUrl]);

    const scrollToLatestMessage = (behavior = "smooth") => {
        window.requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
        });
    };

    const latestMessageId = messages[messages.length - 1]?._id || "";

    const playNotificationSound = useCallback(() => {
        try {
            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) return;

            const context = audioContextRef.current || new AudioContextCtor();
            audioContextRef.current = context;
            if (context.state === "suspended") context.resume().catch(() => {});

            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(740, context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.16);
            gain.gain.setValueAtTime(0.0001, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.24);
        } catch {
            // Browsers can block audio until a user gesture; chat continues without sound.
        }
    }, []);

    useEffect(() => {
        if (!open || !selectedConversation?._id) return;
        scrollToLatestMessage("auto");
    }, [open, selectedConversation?._id]);

    useEffect(() => {
        if (!open || !selectedConversation?._id || !latestMessageId) return;
        scrollToLatestMessage("smooth");
    }, [open, selectedConversation?._id, latestMessageId]);

    useEffect(() => {
        if (!socket) return undefined;

        const onNewMessage = ({ conversationId, message }) => {
            if (String(message.senderId) !== String(user?._id)) {
                playNotificationSound();
            }
            queryClient.setQueryData(["chat-messages", String(conversationId), { search: undefined }], old => ({
                ...(old || { success: true, data: [] }),
                data: mergeById(old?.data || [], message)
            }));
            queryClient.setQueryData(["chat-conversations"], old => ({
                ...(old || { success: true, data: [] }),
                data: updateConversationPreview(old?.data || [], conversationId, message).map(item => {
                    if (String(item._id) !== String(conversationId)) return item;
                    if (String(message.senderId) === String(user?._id) || String(selectedConversation?._id) === String(conversationId)) return item;
                    return { ...item, unreadCount: (item.unreadCount || 0) + 1 };
                })
            }));
            if (String(selectedConversation?._id) === String(conversationId) && String(message.senderId) !== String(user?._id)) {
                chatService.markSeen(conversationId).catch(() => {});
            }
        };

        const onMessageUpdate = (message) => {
            queryClient.setQueriesData({ queryKey: ["chat-messages"] }, old => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map(item => String(item._id) === String(message._id) ? { ...item, ...message } : item)
                };
            });
        };

        const onSeen = ({ conversationId, userId }) => {
            queryClient.setQueriesData({ queryKey: ["chat-messages", String(conversationId)] }, old => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map(item => {
                        if (String(item.senderId) !== String(user?._id)) return item;
                        const seenBy = item.seenBy || [];
                        if (seenBy.some(entry => String(entry.userId) === String(userId))) return item;
                        return { ...item, seenBy: [...seenBy, { userId, at: new Date().toISOString() }] };
                    })
                };
            });
        };

        const onTyping = ({ conversationId, userId, typing }) => {
            if (String(userId) === String(user?._id)) return;
            setTypingUsers(current => {
                const set = new Set(current[conversationId] || []);
                if (typing) set.add(String(userId));
                else set.delete(String(userId));
                return { ...current, [conversationId]: Array.from(set) };
            });
        };

        const refreshUsers = () => queryClient.invalidateQueries(["chat-users"]);
        const refreshConversations = () => queryClient.invalidateQueries(["chat-conversations"]);

        socket.on("chat:message:new", onNewMessage);
        socket.on("chat:message:update", onMessageUpdate);
        socket.on("chat:message:seen", onSeen);
        socket.on("chat:typing", onTyping);
        socket.on("chat:conversation:new", refreshConversations);
        socket.on("chat:conversation:update", refreshConversations);
        socket.on("presence:update", refreshUsers);

        return () => {
            socket.off("chat:message:new", onNewMessage);
            socket.off("chat:message:update", onMessageUpdate);
            socket.off("chat:message:seen", onSeen);
            socket.off("chat:typing", onTyping);
            socket.off("chat:conversation:new", refreshConversations);
            socket.off("chat:conversation:update", refreshConversations);
            socket.off("presence:update", refreshUsers);
        };
    }, [socket, queryClient, user?._id, selectedConversation?._id, playNotificationSound]);

    useEffect(() => {
        if (!socket || !selectedConversation?._id) return;
        socket.emit("chat:join", { conversationId: selectedConversation._id });
        chatService.markSeen(selectedConversation._id).catch(() => {});
        queryClient.setQueryData(["chat-conversations"], old => ({
            ...(old || { success: true, data: [] }),
            data: (old?.data || []).map(item => String(item._id) === String(selectedConversation._id) ? { ...item, unreadCount: 0 } : item)
        }));
    }, [socket, selectedConversation?._id, queryClient]);

    const filteredUsers = useMemo(() => {
        const value = peopleSearch.trim().toLowerCase();
        if (!value) return users;
        return users.filter(item => `${item.user_name} ${item.role}`.toLowerCase().includes(value));
    }, [users, peopleSearch]);

    const openDirect = async (participantId) => {
        try {
            const response = await startDirectMutation.mutateAsync(participantId);
            setSelectedConversation(response.data);
        } catch (error) {
            console.debug("Direct chat start failed", error);
        }
    };

    const toggleGroupMember = (userId) => {
        setGroupMemberIds(current => current.includes(userId)
            ? current.filter(id => id !== userId)
            : [...current, userId]);
    };

    const createGroup = async () => {
        if (!groupName.trim() || createGroupMutation.isPending) return;
        try {
            const response = await createGroupMutation.mutateAsync({ name: groupName.trim(), memberIds: groupMemberIds });
            setGroupName("");
            setGroupMemberIds([]);
            if (response?.data) setSelectedConversation(response.data);
        } catch (error) {
            console.debug("Group creation failed", error);
        }
    };

    const handleDraftChange = (event) => {
        const value = event.target.value;
        setDraft(value);
        if (!socket || !selectedConversation?._id) return;
        socket.emit("chat:typing", { conversationId: selectedConversation._id, typing: true });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("chat:typing", { conversationId: selectedConversation._id, typing: false });
        }, 900);
    };

    const handleFileChange = (event) => {
        const nextFile = event.target.files?.[0] || null;
        const error = validateChatFile(nextFile);
        if (error) {
            toast.error(error);
            event.target.value = "";
            return;
        }
        setFile(nextFile);
    };

    const handleSend = async () => {
        if (!selectedConversation || sendMessageMutation.isPending) return;
        if (!draft.trim() && !file) return;

        if (editingMessage) {
            const response = await chatService.editMessage(editingMessage._id, draft.trim());
            queryClient.setQueriesData({ queryKey: ["chat-messages"] }, old => {
                if (!old?.data) return old;
                return { ...old, data: old.data.map(item => String(item._id) === String(response.data._id) ? response.data : item) };
            });
            setEditingMessage(null);
            setDraft("");
            return;
        }

        const formData = new FormData();
        formData.append("text", draft.trim());
        const mentionIds = getMentionIds(draft, users);
        if (mentionIds.length) formData.append("mentions", JSON.stringify(mentionIds));
        if (replyTo?._id) formData.append("replyTo", replyTo._id);
        if (file) formData.append("attachment", file);

        try {
            setUploadProgress(file ? 1 : 0);
            await sendMessageMutation.mutateAsync({
                conversationId: selectedConversation._id,
                data: formData,
                onUploadProgress: event => {
                    if (!event.total) return;
                    setUploadProgress(Math.min(99, Math.round((event.loaded * 100) / event.total)));
                }
            });
            setDraft("");
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setReplyTo(null);
        } finally {
            setUploadProgress(0);
            if (socket) socket.emit("chat:typing", { conversationId: selectedConversation._id, typing: false });
        }
    };

    const loadOlder = async () => {
        if (!selectedConversation?._id || !messages[0]?.createdAt) return;
        const response = await chatService.getMessages(selectedConversation._id, { before: messages[0].createdAt, search: messageSearch || undefined });
        queryClient.setQueryData(["chat-messages", selectedConversation._id, { search: messageSearch || undefined }], old => ({
            ...(old || { success: true, data: [] }),
            data: [...(response.data || []), ...(old?.data || [])]
        }));
    };

    const pinMessage = async (messageId) => {
        const response = await chatService.pinMessage(messageId);
        queryClient.setQueriesData({ queryKey: ["chat-messages"] }, old => {
            if (!old?.data) return old;
            return { ...old, data: old.data.map(item => String(item._id) === String(response.data._id) ? response.data : item) };
        });
    };

    const startEdit = (message) => {
        setEditingMessage(message);
        setReplyTo(null);
        setDraft(message.text || "");
    };

    const messageStatus = (message) => {
        if (String(message.senderId) !== String(user?._id)) return "";
        if ((message.seenBy || []).length) return "Seen";
        if ((message.deliveredTo || []).length) return "Delivered";
        return "Sent";
    };

    if (!user) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    const context = audioContextRef.current;
                    if (context?.state === "suspended") context.resume().catch(() => {});
                }}
                className="fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-yellow-400 shadow-2xl transition hover:bg-zinc-800"
                title="Open team chat"
            >
                <FiMessageCircle size={22} />
                {unreadTotal > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed bottom-24 right-6 z-[90] flex h-[620px] w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
                    <aside className="flex min-h-0 w-72 shrink-0 flex-col border-r border-zinc-800 bg-black/40">
                        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
                            <div>
                                <p className="text-sm font-semibold text-white">Team Chat</p>
                                <p className="text-[10px] uppercase tracking-widest text-zinc-600">{isConnected ? "Live websocket" : "Offline"}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white"><FiX /></button>
                        </div>
                        <div className="p-3">
                            <div className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-3 py-2">
                                <FiSearch className="text-zinc-600" />
                                <input value={peopleSearch} onChange={e => setPeopleSearch(e.target.value)} placeholder="Search people" className="w-full bg-transparent text-xs text-zinc-200 outline-none" />
                            </div>
                        </div>
                        {user?.role !== "agent" && (
                            <div className="border-b border-zinc-900 px-3 pb-3">
                                <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
                                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                        <FiEdit2 /> New Group
                                    </div>
                                    <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="mb-2 w-full rounded border border-zinc-800 bg-black px-2 py-1.5 text-xs text-white outline-none" />
                                    <div className="mb-2 max-h-20 overflow-y-auto">
                                        {users.slice(0, 8).map(item => (
                                            <label key={item._id} className="flex cursor-pointer items-center gap-2 py-1 text-[11px] text-zinc-400">
                                                <input type="checkbox" checked={groupMemberIds.includes(item._id)} onChange={() => toggleGroupMember(item._id)} />
                                                {item.user_name}
                                            </label>
                                        ))}
                                    </div>
                                    <button onClick={createGroup} disabled={!groupName.trim() || createGroupMutation.isPending} className="w-full rounded bg-zinc-800 px-2 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 disabled:opacity-50">
                                        Create Group
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {conversations.map(item => {
                                const meta = getConversationMeta(item, users, user?._id);
                                return (
                                    <button
                                        key={item._id}
                                        onClick={() => setSelectedConversation(item)}
                                        className={`flex w-full items-center gap-3 border-b border-zinc-900 px-4 py-3 text-left hover:bg-zinc-900 ${selectedConversation?._id === item._id ? "bg-zinc-900" : ""}`}
                                    >
                                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-zinc-800">
                                            {item.type === "group" ? (
                                                <span className="flex h-full w-full items-center justify-center text-yellow-400"><FiUsers /></span>
                                            ) : meta.avatar ? (
                                                <img src={meta.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-yellow-400">{meta.initials}</span>
                                            )}
                                            {item.type === "direct" && <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${meta.online ? "bg-emerald-500" : "bg-zinc-600"}`} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-zinc-200">{meta.name}</p>
                                            <p className="truncate text-[11px] text-zinc-600">{item.lastMessage?.text || "No messages yet"}</p>
                                        </div>
                                        {item.unreadCount > 0 && <span className="rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-black">{item.unreadCount}</span>}
                                    </button>
                                );
                            })}
                            <div className="px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">People</div>
                            {filteredUsers.map(item => (
                                <button key={item._id} onClick={() => openDirect(item._id)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-zinc-900">
                                    <div className="relative h-8 w-8 overflow-hidden rounded bg-zinc-800">
                                        {item.profile_pic ? <img src={item.profile_pic} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs font-bold text-zinc-300">{initials(item.user_name)}</span>}
                                        <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${item.online ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-zinc-200">{item.user_name}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-600">{item.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="flex min-w-0 flex-1 flex-col">
                        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-zinc-800 px-5">
                            <div className="flex min-w-0 items-center gap-3">
                                {selectedConversation && (
                                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-zinc-800">
                                        {selectedConversation.type === "group" ? (
                                            <span className="flex h-full w-full items-center justify-center text-yellow-400"><FiUsers /></span>
                                        ) : selectedMeta.avatar ? (
                                            <img src={selectedMeta.avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-yellow-400">{selectedMeta.initials}</span>
                                        )}
                                        {selectedConversation.type === "direct" && <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${selectedMeta.online ? "bg-emerald-500" : "bg-zinc-600"}`} />}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{selectedMeta.name}</p>
                                    <p className="truncate text-[10px] text-zinc-600">
                                        {selectedTyping.length ? "Typing..." : selectedMeta.subtitle}
                                    </p>
                                </div>
                            </div>
                            {selectedConversation && (
                                <div className="flex shrink-0 items-center gap-2 rounded border border-zinc-800 bg-black px-3 py-2">
                                    <FiSearch className="text-zinc-600" />
                                    <input value={messageSearch} onChange={e => setMessageSearch(e.target.value)} placeholder="Search messages" className="w-40 bg-transparent text-xs text-zinc-200 outline-none" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto p-5">
                            {!selectedConversation && <div className="mt-24 text-center text-sm text-zinc-500">Choose a person or conversation to begin.</div>}
                            {selectedConversation && messages.length > 0 && (
                                <button onClick={loadOlder} className="mx-auto block rounded border border-zinc-800 px-3 py-1 text-[11px] text-zinc-500 hover:text-white">Load older</button>
                            )}
                            {messages.map(item => {
                                const mine = String(item.senderId) === String(user._id);
                                return (
                                    <div key={item._id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[72%] rounded-lg border px-3 py-2 ${item.pinned ? "border-yellow-400/50" : mine ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-50" : "border-zinc-800 bg-zinc-900 text-zinc-200"}`}>
                                            {item.replyTo && (
                                                <div className="mb-2 rounded border-l-2 border-yellow-500/60 bg-black/20 px-2 py-1.5">
                                                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-400">Replying to</p>
                                                    <p className="line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-zinc-400">
                                                        {getReplyPreviewText(item.replyTo)}
                                                    </p>
                                                </div>
                                            )}
                                            {item.pinned && <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-yellow-400"><FiStar size={10} />Pinned</p>}
                                            {item.text && <p className="whitespace-pre-wrap text-sm leading-6">{item.text}</p>}
                                            {item.attachments?.map(fileItem => (
                                                <div
                                                    key={fileItem.url}
                                                    className="mt-2 w-44 max-w-full overflow-hidden rounded border border-zinc-700 bg-black/30 text-xs text-zinc-300"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewAttachment(fileItem)}
                                                        className="block w-full text-left hover:text-white"
                                                    >
                                                        {isImageAttachment(fileItem) && (
                                                            <img src={fileItem.url} alt={fileItem.name || "Attachment"} className="h-28 w-full object-cover" onLoad={() => scrollToLatestMessage("auto")} />
                                                        )}
                                                        {isVideoAttachment(fileItem) && (
                                                            <video src={fileItem.url} className="h-28 w-full object-cover" muted onLoadedMetadata={() => scrollToLatestMessage("auto")} />
                                                        )}
                                                        {!isImageAttachment(fileItem) && !isVideoAttachment(fileItem) && (
                                                            <div className="flex h-16 items-center gap-2 px-3">
                                                                <FiPaperclip className="shrink-0 text-zinc-500" />
                                                                <span className="truncate">{fileItem.name || "Attachment"}</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                    <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-2 py-1">
                                                        <button type="button" onClick={() => setPreviewAttachment(fileItem)} className="min-w-0 flex-1 truncate text-left hover:text-white">
                                                            {fileItem.name || "Attachment"}
                                                        </button>
                                                        <a
                                                            href={fileItem.url}
                                                            download={getDownloadName(fileItem)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Download"
                                                            className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-yellow-400"
                                                            onClick={event => event.stopPropagation()}
                                                        >
                                                            <FiDownload size={13} />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                                                    <button onClick={() => setReplyTo(item)} title="Reply" className="text-zinc-500 hover:text-white"><FiCornerUpLeft size={12} /></button>
                                                    {mine && <button onClick={() => startEdit(item)} title="Edit" className="text-zinc-500 hover:text-white"><FiEdit2 size={12} /></button>}
                                                    <button onClick={() => pinMessage(item._id)} title="Pin" className="text-zinc-500 hover:text-yellow-400"><FiStar size={12} /></button>
                                                </div>
                                                <p className="text-right text-[10px] text-zinc-500">{timeLabel(item.createdAt)} {item.editedAt ? "edited" : ""} {messageStatus(item)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="border-t border-zinc-800 p-4">
                            {(replyTo || editingMessage || file) && (
                                <div className="mb-2 flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {file && filePreviewUrl && file.type.startsWith("image/") && (
                                            <img src={filePreviewUrl} alt="" className="h-12 w-16 rounded object-cover" />
                                        )}
                                        {file && filePreviewUrl && file.type.startsWith("video/") && (
                                            <video src={filePreviewUrl} className="h-12 w-16 rounded object-cover" muted />
                                        )}
                                        <span className="truncate">
                                            {editingMessage ? "Editing message" : replyTo ? `Replying to: ${getReplyPreviewText(replyTo)}` : file?.name}
                                        </span>
                                    </div>
                                    <button onClick={() => { setReplyTo(null); setEditingMessage(null); setFile(null); }} disabled={sendMessageMutation.isPending}><FiX /></button>
                                </div>
                            )}
                            {sendMessageMutation.isPending && file && (
                                <div className="mb-2 rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
                                    <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-yellow-200">
                                        <span className="truncate">Uploading {file.name}</span>
                                        <span>{uploadProgress || 1}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                        <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${uploadProgress || 1}%` }} />
                                    </div>
                                </div>
                            )}
                            <div className="mb-2 flex flex-wrap gap-1">
                                {emojis.map(emoji => <button key={emoji} onClick={() => setDraft(value => `${value}${emoji}`)} className="rounded border border-zinc-800 px-2 py-1 text-xs hover:bg-zinc-800">{emoji}</button>)}
                            </div>
                            <div className="flex items-end gap-2">
                                <button onClick={() => fileInputRef.current?.click()} disabled={sendMessageMutation.isPending} className="rounded border border-zinc-800 p-3 text-zinc-500 hover:text-white disabled:opacity-50"><FiPaperclip /></button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={handleFileChange}
                                />
                                <textarea value={draft} onChange={handleDraftChange} disabled={sendMessageMutation.isPending} placeholder={editingMessage ? "Edit your message..." : "Write a message..."} rows={2} className="min-h-11 flex-1 resize-none rounded border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-yellow-500/40 disabled:opacity-60" />
                                <button type="button" onClick={() => setDraft(value => `${value}🙂`)} disabled={sendMessageMutation.isPending} className="rounded border border-zinc-800 p-3 text-zinc-500 hover:text-white disabled:opacity-50"><FiSmile /></button>
                                <button onClick={handleSend} disabled={!selectedConversation || sendMessageMutation.isPending} className="rounded bg-yellow-500 p-3 text-black hover:bg-yellow-400 disabled:opacity-50">{sendMessageMutation.isPending ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <FiSend />}</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {previewAttachment && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewAttachment(null)}>
                    <div className="max-h-[90vh] w-[min(900px,100%)] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl" onClick={event => event.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                            <p className="truncate text-sm font-semibold text-white">{previewAttachment.name || "Attachment"}</p>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewAttachment.url}
                                    download={getDownloadName(previewAttachment)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Download"
                                    className="rounded border border-zinc-800 p-2 text-zinc-400 hover:border-yellow-500 hover:text-yellow-400"
                                >
                                    <FiDownload size={15} />
                                </a>
                                <button onClick={() => setPreviewAttachment(null)} className="rounded border border-zinc-800 p-2 text-zinc-500 hover:text-white"><FiX /></button>
                            </div>
                        </div>
                        <div className="flex max-h-[76vh] items-center justify-center overflow-auto bg-black p-4">
                            {isImageAttachment(previewAttachment) && (
                                <img src={previewAttachment.url} alt={previewAttachment.name || "Attachment"} className="max-h-[72vh] max-w-full object-contain" />
                            )}
                            {isVideoAttachment(previewAttachment) && (
                                <video src={previewAttachment.url} className="max-h-[72vh] max-w-full" controls autoPlay />
                            )}
                            {!isImageAttachment(previewAttachment) && !isVideoAttachment(previewAttachment) && (
                                <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded border border-zinc-800 bg-zinc-950 p-6 text-center">
                                    <FiPaperclip className="text-zinc-500" size={28} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">{previewAttachment.name || "Attachment"}</p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            {isPdfAttachment(previewAttachment) ? "PDF preview is opened/downloaded securely from storage." : "Document preview is opened/downloaded securely from storage."}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <a href={previewAttachment.url} target="_blank" rel="noreferrer" className="rounded border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-yellow-500 hover:text-yellow-300">
                                            Open
                                        </a>
                                        <a href={previewAttachment.url} download={getDownloadName(previewAttachment)} target="_blank" rel="noreferrer" className="rounded bg-yellow-500 px-3 py-2 text-xs font-semibold text-black hover:bg-yellow-400">
                                            Download
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
