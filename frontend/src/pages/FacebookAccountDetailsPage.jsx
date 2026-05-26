import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../component/layout/AppLayout';
import { useFacebookAccountPosts } from '../hooks/useSocialMediaHooks';
import { FiChevronLeft, FiExternalLink, FiFacebook, FiMessageCircle, FiRefreshCw, FiThumbsUp, FiShare2 } from 'react-icons/fi';

function PostSkeleton() {
    return (
        <div className="border-b border-zinc-800 p-5 animate-pulse">
            <div className="flex gap-4">
                <div className="w-24 h-20 bg-zinc-800 rounded" />
                <div className="flex-1 space-y-3">
                    <div className="h-3 bg-zinc-800 rounded w-1/4" />
                    <div className="h-3 bg-zinc-800 rounded w-full" />
                    <div className="h-3 bg-zinc-800 rounded w-2/3" />
                    <div className="flex gap-3">
                        <div className="h-3 bg-zinc-800 rounded w-16" />
                        <div className="h-3 bg-zinc-800 rounded w-16" />
                        <div className="h-3 bg-zinc-800 rounded w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ icon, value }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
            {icon}
            {value || 0}
        </span>
    );
}

const FacebookAccountDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, isFetching, refetch, error } = useFacebookAccountPosts(id);

    const account = data?.data?.account;
    const posts = data?.data?.posts || [];

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/social-media')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm"
                >
                    <FiChevronLeft /> Back to Social Publishing
                </button>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center overflow-hidden">
                            {account?.picture_url ? (
                                <img src={account.picture_url} alt={account.name} className="w-full h-full object-cover" />
                            ) : (
                                <FiFacebook className="text-blue-400" size={24} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-medium text-white">{account?.name || 'Facebook Page'}</h1>
                            <p className="text-sm text-zinc-400">Previous Facebook posts fetched live from Meta</p>
                        </div>
                    </div>
                    <button
                        onClick={refetch}
                        disabled={isFetching}
                        className="h-10 px-4 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm flex items-center justify-center gap-2"
                    >
                        <FiRefreshCw className={isFetching ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-6 border border-red-500/20 bg-red-500/10 text-red-300 rounded p-4 text-sm">
                        {error.response?.data?.message || 'Unable to load Facebook posts'}
                    </div>
                )}

                <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Previous Posts</h2>
                        <span className="text-xs text-zinc-500">{posts.length} loaded</span>
                    </div>

                    {isLoading ? (
                        <div>
                            {[0, 1, 2, 3].map(item => <PostSkeleton key={item} />)}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500 text-sm">
                            No previous Facebook posts were returned by Meta for this Page.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {posts.map(post => (
                                <article key={post.id} className="p-5 hover:bg-zinc-900/40 transition-colors">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {post.full_picture ? (
                                            <img
                                                src={post.full_picture}
                                                alt=""
                                                className="w-full md:w-36 h-32 object-cover rounded border border-zinc-800 bg-zinc-950"
                                            />
                                        ) : (
                                            <div className="w-full md:w-36 h-32 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600">
                                                <FiFacebook size={28} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <span className="text-[11px] text-zinc-500">
                                                    {post.created_time ? new Date(post.created_time).toLocaleString() : 'Unknown date'}
                                                </span>
                                                {post.status_type && (
                                                    <span className="px-2 py-0.5 rounded border border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                                                        {post.status_type.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                                                {post.message || post.attachment?.title || 'Media post'}
                                            </p>
                                            {post.attachment?.description && (
                                                <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{post.attachment.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                                <div className="flex items-center gap-4">
                                                    <Stat icon={<FiThumbsUp />} value={post.likes_count} />
                                                    <Stat icon={<FiMessageCircle />} value={post.comments_count} />
                                                    <Stat icon={<FiShare2 />} value={post.shares_count} />
                                                </div>
                                                {post.permalink_url && (
                                                    <a
                                                        href={post.permalink_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                                                    >
                                                        Open on Facebook <FiExternalLink />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
};

export default FacebookAccountDetailsPage;
