import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../component/layout/AppLayout';
import {
    useConnectSocial,
    useCreateSocialPost,
    useDeleteSocialPost,
    useDisconnectSocial,
    useGenerateSocialCaption,
    useRetrySocialPost,
    useSocialAccounts,
    useSocialPosts,
    useSocialWorkerHealth
} from '../hooks/useSocialMediaHooks';
import { FiAlertTriangle, FiClock, FiExternalLink, FiFacebook, FiImage, FiInstagram, FiRefreshCw, FiSend, FiTrash2, FiVideo, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

const statusClass = {
    published: 'bg-green-500/10 text-green-400 border-green-500/20',
    cleanup_pending: 'bg-green-500/10 text-green-300 border-green-500/20',
    partial_success: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    publishing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    queued: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    scheduled: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
};

function StatusBadge({ status }) {
    return (
        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${statusClass[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {String(status || 'unknown').replace('_', ' ')}
        </span>
    );
}

function PlatformIcon({ platform }) {
    return platform === 'instagram' ? <FiInstagram className="text-pink-400" /> : <FiFacebook className="text-blue-400" />;
}

const SocialMediaPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const connectMutation = useConnectSocial();
    const disconnectMutation = useDisconnectSocial();
    const createMutation = useCreateSocialPost();
    const captionMutation = useGenerateSocialCaption();
    const retryMutation = useRetrySocialPost();
    const deleteMutation = useDeleteSocialPost();
    const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useSocialAccounts();
    const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useSocialPosts();
    const { data: healthData } = useSocialWorkerHealth();

    const accounts = accountsData?.data || [];
    const posts = postsData?.data || [];
    const [caption, setCaption] = useState('');
    const [prompt, setPrompt] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [publishMode, setPublishMode] = useState('now');
    const [scheduleTime, setScheduleTime] = useState('');
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const connect = params.get('social_connect');
        const reason = params.get('reason');
        if (connect === 'success') toast.success('Meta accounts connected');
        if (connect === 'failed') {
            const message = reason === 'no_pages_or_instagram_accounts_found'
                ? 'Meta connected, but no Facebook Pages or Instagram Business accounts were found for this user.'
                : 'Meta connection failed';
            toast.error(message, { duration: 7000 });
        }
        if (connect) {
            window.history.replaceState({}, document.title, window.location.pathname);
            refetchAccounts();
        }
    }, [refetchAccounts]);

    const selectedAccountObjects = useMemo(() => {
        return accounts.filter(account => selectedAccounts.includes(account._id));
    }, [accounts, selectedAccounts]);

    const hasInstagram = selectedAccountObjects.some(account => account.platform === 'instagram');
    const workerHealthy = healthData?.data?.healthy;

    const handleFileChange = (event) => {
        const nextFiles = Array.from(event.target.files || []);
        const invalid = nextFiles.find(file => !file.type.startsWith('image/') && !file.type.startsWith('video/'));
        if (invalid) {
            toast.error('Upload image or video files only');
            return;
        }
        setFiles(nextFiles);
    };

    const handleGenerateCaption = async () => {
        if (!prompt.trim()) {
            toast.error('Add a caption prompt first');
            return;
        }
        const res = await captionMutation.mutateAsync({ prompt, includeHashtags: true, includeCta: true });
        setCaption(res.data.caption);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!caption.trim()) return toast.error('Caption is required');
        if (selectedAccounts.length === 0) return toast.error('Select at least one social account');
        if (hasInstagram && files.length === 0) return toast.error('Instagram requires image or video media');
        if (publishMode === 'schedule' && !scheduleTime) return toast.error('Choose a schedule time');

        const formData = new FormData();
        formData.append('payload', JSON.stringify({
            caption,
            social_account_ids: selectedAccounts,
            publish_mode: publishMode,
            schedule_time: scheduleTime || null,
            timezone,
            idempotency_key: `${Date.now()}-${selectedAccounts.join('-')}`
        }));
        files.forEach(file => formData.append('media', file));

        await createMutation.mutateAsync(formData);
        setCaption('');
        setPrompt('');
        setSelectedAccounts([]);
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        refetchPosts();
    };

    return (
        <AppLayout>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl font-medium text-white mb-1">Social Publishing</h1>
                    <p className="text-sm text-zinc-400">Create, schedule, and monitor Facebook and Instagram posts.</p>
                </div> 

                <h1 className='text-red-500 underline'>Social Publishing Feature is under development. Will notify once completed.</h1>
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-2 rounded border text-xs ${workerHealthy ? 'border-green-500/20 text-green-400 bg-green-500/10' : 'border-red-500/20 text-red-400 bg-red-500/10'}`}>
                        Worker {workerHealthy ? 'healthy' : 'offline'}
                    </div>
                    <button
                        onClick={() => connectMutation.mutate()}
                        disabled={connectMutation.isPending}
                        className="h-10 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm font-medium transition-colors"
                    >
                        Connect Meta
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-4 space-y-6">
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Connected Accounts</h2>
                            <button onClick={refetchAccounts} className="text-zinc-500 hover:text-white">
                                <FiRefreshCw />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {accountsLoading ? (
                                <div className="text-xs text-zinc-500">Loading accounts...</div>
                            ) : accounts.length === 0 ? (
                                <div className="text-xs text-zinc-500 border border-dashed border-zinc-800 rounded p-4 text-center">No accounts connected</div>
                            ) : accounts.map(account => (
                                <label key={account._id} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded cursor-pointer hover:border-zinc-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedAccounts.includes(account._id)}
                                        onChange={(event) => {
                                            setSelectedAccounts(prev => event.target.checked
                                                ? [...prev, account._id]
                                                : prev.filter(id => id !== account._id));
                                        }}
                                        className="accent-yellow-600"
                                    />
                                    <PlatformIcon platform={account.platform} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-zinc-200 truncate">{account.name}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{account.account_type.replace('_', ' ')}</p>
                                    </div>
                                    {account.platform === 'facebook' && (
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                navigate(`/social-media/facebook/${account._id}`);
                                            }}
                                            className="p-1.5 text-zinc-500 hover:text-blue-400"
                                            title="View Previous Facebook Posts"
                                        >
                                            <FiExternalLink size={14} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            disconnectMutation.mutate(account._id);
                                        }}
                                        className="p-1.5 text-zinc-500 hover:text-red-400"
                                        title="Disconnect"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">AI Caption</h2>
                        <textarea
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            placeholder="Luxury 2BHK in Downtown Dubai with fountain view"
                            className="w-full min-h-24 bg-zinc-950 border border-zinc-800 rounded p-3 text-sm text-zinc-200 focus:outline-none focus:border-yellow-600 resize-none"
                        />
                        <button
                            onClick={handleGenerateCaption}
                            disabled={captionMutation.isPending}
                            className="mt-3 w-full h-10 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm flex items-center justify-center gap-2"
                        >
                            <FiZap className="text-yellow-500" /> {captionMutation.isPending ? 'Generating...' : 'Generate Caption'}
                        </button>
                    </section>
                </div>

                <div className="xl:col-span-8 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">Compose Post</h2>
                        <textarea
                            value={caption}
                            onChange={(event) => setCaption(event.target.value)}
                            placeholder="Write your caption..."
                            className="w-full min-h-40 bg-zinc-950 border border-zinc-800 rounded p-4 text-sm text-zinc-200 focus:outline-none focus:border-yellow-600 resize-none"
                            maxLength={2200}
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                            <span>{hasInstagram ? 'Instagram media required' : 'Media optional for Facebook'}</span>
                            <span>{caption.length}/2200</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Media</label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-10 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs flex items-center justify-center gap-2"
                                >
                                    {files.some(file => file.type.startsWith('video/')) ? <FiVideo /> : <FiImage />}
                                    {files.length ? `${files.length} selected` : 'Upload'}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Timing</label>
                                <select
                                    value={publishMode}
                                    onChange={(event) => setPublishMode(event.target.value)}
                                    className="w-full h-10 rounded border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs px-3"
                                >
                                    <option value="now">Publish now</option>
                                    <option value="schedule">Schedule</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Timezone</label>
                                <input
                                    value={timezone}
                                    onChange={(event) => setTimezone(event.target.value)}
                                    className="w-full h-10 rounded border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs px-3"
                                />
                            </div>
                        </div>

                        {publishMode === 'schedule' && (
                            <div className="mt-4">
                                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Schedule Time</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleTime}
                                    onChange={(event) => setScheduleTime(event.target.value)}
                                    className="w-full md:w-72 h-10 rounded border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs px-3"
                                />
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="h-11 px-6 rounded bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium flex items-center gap-2"
                            >
                                <FiSend /> {createMutation.isPending ? 'Queueing...' : publishMode === 'schedule' ? 'Schedule Post' : 'Publish Post'}
                            </button>
                        </div>
                    </form>

                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Publishing Status</h2>
                            <button onClick={refetchPosts} className="text-zinc-500 hover:text-white">
                                <FiRefreshCw />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-950/60 text-zinc-500 text-xs">
                                    <tr>
                                        <th className="p-4 font-medium">Caption</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium">Platforms</th>
                                        <th className="p-4 font-medium">Schedule</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {postsLoading ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-zinc-500">Loading posts...</td></tr>
                                    ) : posts.length === 0 ? (
                                        <tr><td colSpan="5" className="p-10 text-center text-zinc-500">No social posts yet</td></tr>
                                    ) : posts.map(post => (
                                        <tr key={post._id} className="hover:bg-zinc-900/40">
                                            <td className="p-4 max-w-sm">
                                                <p className="text-zinc-200 truncate">{post.caption}</p>
                                                {post.last_error && (
                                                    <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                                                        <FiAlertTriangle /> {post.last_error}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4"><StatusBadge status={post.status} /></td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    {post.platforms.map(platform => (
                                                        <span key={platform} className="flex items-center gap-2 text-xs text-zinc-400">
                                                            <PlatformIcon platform={platform} />
                                                            {platform}: {post.platform_status?.[platform]?.status || 'queued'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-zinc-500">
                                                {post.schedule_time ? (
                                                    <span className="flex items-center gap-1"><FiClock /> {new Date(post.schedule_time).toLocaleString()}</span>
                                                ) : 'Immediate'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {['failed', 'partial_success'].includes(post.status) && (
                                                    <button
                                                        onClick={() => retryMutation.mutate(post._id)}
                                                        className="p-2 text-zinc-500 hover:text-yellow-400"
                                                        title="Retry"
                                                    >
                                                        <FiRefreshCw />
                                                    </button>
                                                )}
                                                {!['publishing'].includes(post.status) && (
                                                    <button
                                                        onClick={() => deleteMutation.mutate(post._id)}
                                                        className="p-2 text-zinc-500 hover:text-red-400"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
};

export default SocialMediaPage;
