import React, { useEffect, useMemo, useState } from "react";
import {
    FiCheckCircle,
    FiFile,
    FiImage,
    FiMessageSquare,
    FiPhone,
    FiRefreshCw,
    FiTrash2,
    FiUploadCloud,
    FiVideo,
    FiX
} from "react-icons/fi";
import { useWhatsAppStatus } from "../../hooks/useCampaignHooks";

const buildDefaultMessage = (lead) => {
    const name = lead?.name ? ` ${lead.name}` : "";
    const location = lead?.location || lead?.address;
    const requirement = lead?.requirement || lead?.inquiry_for;

    const details = [
        requirement ? `regarding ${requirement}` : "regarding your property inquiry",
        location ? `in ${location}` : ""
    ].filter(Boolean).join(" ");

    return `Hi${name}, thank you for your interest. I am following up ${details}. Please let me know a convenient time to discuss.`;
};

const SendWhatsAppModal = ({ isOpen, onClose, lead }) => {
    const { data: whatsappData, isLoading, refetch, isFetching } = useWhatsAppStatus();
    const [message, setMessage] = useState("");
    const [media, setMedia] = useState(null);

    useEffect(() => {
        if (isOpen && lead) {
            setMessage(buildDefaultMessage(lead));
            setMedia(null);
        }
    }, [isOpen, lead]);

    useEffect(() => {
        return () => {
            if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);
        };
    }, [media]);

    const recipient = useMemo(() => {
        return lead?.whatsapp_number || lead?.phone || "";
    }, [lead]);

    if (!isOpen || !lead) return null;

    const isConnected = whatsappData?.status === "connected";
    const canSendLater = isConnected && recipient && (message.trim().length > 0 || media);

    const handleMediaChange = (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        const type = file.type || "";
        const mediaType = type.startsWith("image/")
            ? "image"
            : type.startsWith("video/")
                ? "video"
                : "document";

        if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);

        setMedia({
            file,
            type: mediaType,
            name: file.name,
            size: file.size,
            mimeType: type,
            previewUrl: mediaType === "image" || mediaType === "video" ? URL.createObjectURL(file) : null
        });
    };

    const removeMedia = () => {
        if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);
        setMedia(null);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "0 KB";
        if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                            <FiMessageSquare size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Send WhatsApp Message</h2>
                            <p className="text-xs text-zinc-500">{lead.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white">
                        <FiX size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Recipient</p>
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                                <FiPhone size={14} className="text-zinc-500" />
                                {recipient || "No phone number available"}
                            </div>
                        </div>

                        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">WhatsApp Status</p>
                                <button
                                    type="button"
                                    onClick={() => refetch()}
                                    disabled={isFetching}
                                    className="text-zinc-500 transition-colors hover:text-zinc-200 disabled:opacity-50"
                                    title="Refresh status"
                                >
                                    <FiRefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
                                </button>
                            </div>
                            <div className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs font-semibold ${
                                isConnected
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                    : "border-red-500/20 bg-red-500/10 text-red-300"
                            }`}>
                                <FiCheckCircle size={13} />
                                {isLoading ? "Checking..." : isConnected ? "Connected" : "Not connected"}
                            </div>
                        </div>
                    </div>

                    {!recipient && (
                        <div className="rounded border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
                            This lead does not have a WhatsApp or phone number.
                        </div>
                    )}

                    {!isConnected && (
                        <div className="rounded border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-100">
                            Connect your WhatsApp account from Outreach Settings before sending direct lead messages.
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            placeholder="Write your WhatsApp message..."
                            className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-emerald-500/40"
                        />
                        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600">
                            <span>{message.trim().length} characters</span>
                            <span>Direct message</span>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Media Attachment</label>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-700">Optional</span>
                        </div>

                        {!media ? (
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-zinc-800 bg-zinc-950 px-4 py-6 text-center transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/70">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    onChange={handleMediaChange}
                                />
                                <FiUploadCloud size={22} className="mb-2 text-zinc-500" />
                                <p className="text-xs font-semibold text-zinc-300">Add image, video, or document</p>
                                <p className="mt-1 text-[11px] text-zinc-600">Preview only for now. Upload/send will be wired with backend.</p>
                            </label>
                        ) : (
                            <div className="overflow-hidden rounded border border-zinc-800 bg-zinc-950">
                                {(media.type === "image" || media.type === "video") && (
                                    <div className="flex aspect-video items-center justify-center bg-zinc-900">
                                        {media.type === "image" ? (
                                            <img src={media.previewUrl} alt={media.name} className="h-full w-full object-contain" />
                                        ) : (
                                            <video src={media.previewUrl} className="h-full w-full object-contain" controls />
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-3 p-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                                            {media.type === "image" ? <FiImage /> : media.type === "video" ? <FiVideo /> : <FiFile />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-zinc-200">{media.name}</p>
                                            <p className="text-xs capitalize text-zinc-600">{media.type} • {formatFileSize(media.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeMedia}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-red-400 transition-colors hover:bg-red-500/10"
                                        title="Remove media"
                                    >
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled
                        title={canSendLater ? "Backend send route will be connected next" : "Complete the requirements first"}
                        className="rounded bg-emerald-600 px-5 py-2 text-xs font-semibold text-white opacity-50"
                    >
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendWhatsAppModal;
