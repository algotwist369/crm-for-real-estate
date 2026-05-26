const axios = require('axios');
const logger = require('../utils/logger');

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function getLoginScopes() {
    if (process.env.META_LOGIN_SCOPES) {
        return process.env.META_LOGIN_SCOPES
            .split(',')
            .map(scope => scope.trim())
            .filter(Boolean);
    }

    return [
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_business_basic',
        'instagram_business_content_publish',
        'business_management'
    ];
}

function getOAuthUrl(state) {
    const loginConfigId = String(process.env.META_LOGIN_CONFIG_ID || '').trim();
    const params = new URLSearchParams({
        client_id: process.env.META_APP_ID || '',
        redirect_uri: process.env.META_REDIRECT_URI || '',
        state,
        response_type: 'code'
    });

    if (loginConfigId) {
        params.set('config_id', loginConfigId);
        params.set('override_default_response_type', 'true');
        params.set('auth_type', 'rerequest');
    } else {
        params.set('scope', getLoginScopes().join(','));
    }

    return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

function normalizeMetaError(error) {
    const data = error?.response?.data?.error || {};
    const message = data.message || error.message || 'Meta API request failed';
    const code = String(data.code || error.response?.status || 'META_ERROR');
    const subcode = data.error_subcode ? String(data.error_subcode) : undefined;
    const status = error.response?.status || 500;
    const err = new Error(message);
    err.statusCode = status;
    err.metaCode = code;
    err.metaSubcode = subcode;
    err.isRateLimited = status === 429 || ['4', '17', '32', '613'].includes(code);
    err.isTokenExpired = ['190', '102', '10', '200'].includes(code);
    err.isPermissionDenied = ['10', '200', '2500'].includes(code);
    return err;
}

async function graphRequest(method, path, params = {}, accessToken) {
    try {
        const response = await axios({
            method,
            url: `${GRAPH_BASE}${path}`,
            params: method.toLowerCase() === 'get' ? { ...params, access_token: accessToken } : undefined,
            data: method.toLowerCase() !== 'get' ? { ...params, access_token: accessToken } : undefined,
            timeout: Number(process.env.META_API_TIMEOUT_MS || 30000)
        });
        return response.data;
    } catch (error) {
        const normalized = normalizeMetaError(error);
        logger.warn(`Meta API ${method.toUpperCase()} ${path} failed: ${normalized.message}`);
        throw normalized;
    }
}

async function exchangeCodeForToken(code) {
    const data = await graphRequest('get', '/oauth/access_token', {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code
    });
    return data;
}

async function exchangeLongLivedToken(shortToken) {
    return graphRequest('get', '/oauth/access_token', {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortToken
    });
}

async function listPages(userToken) {
    const data = await graphRequest('get', '/me/accounts', {
        fields: 'id,name,access_token,tasks,picture{url},instagram_business_account{id,username,name,profile_picture_url}'
    }, userToken);
    return data.data || [];
}

async function publishFacebook(account, token, post) {
    const firstMedia = post.media?.[0];
    if (!firstMedia) {
        return graphRequest('post', `/${account.provider_account_id}/feed`, { message: post.caption }, token);
    }
    if (firstMedia.resource_type === 'image') {
        return graphRequest('post', `/${account.provider_account_id}/photos`, {
            url: firstMedia.url,
            caption: post.caption,
            published: true
        }, token);
    }
    return graphRequest('post', `/${account.provider_account_id}/videos`, {
        file_url: firstMedia.url,
        description: post.caption,
        published: true
    }, token);
}

async function listFacebookPagePosts(account, token, options = {}) {
    const limit = Math.min(Number(options.limit || 25), 50);
    const data = await graphRequest('get', `/${account.provider_account_id}/posts`, {
        limit,
        fields: [
            'id',
            'message',
            'created_time',
            'permalink_url',
            'full_picture',
            'status_type',
            'attachments{media,type,url,title,description}',
            'shares',
            'likes.summary(true).limit(0)',
            'comments.summary(true).limit(0)'
        ].join(',')
    }, token);

    return {
        data: data.data || [],
        paging: data.paging || null
    };
}

async function publishInstagram(account, token, post) {
    const firstMedia = post.media?.[0];
    if (!firstMedia) {
        const err = new Error('Instagram publishing requires image or video media');
        err.statusCode = 400;
        throw err;
    }

    const createParams = firstMedia.resource_type === 'video'
        ? { media_type: 'REELS', video_url: firstMedia.url, caption: post.caption }
        : { image_url: firstMedia.url, caption: post.caption };

    const container = await graphRequest('post', `/${account.provider_account_id}/media`, createParams, token);
    return graphRequest('post', `/${account.provider_account_id}/media_publish`, {
        creation_id: container.id
    }, token);
}

module.exports = {
    getOAuthUrl,
    exchangeCodeForToken,
    exchangeLongLivedToken,
    listPages,
    listFacebookPagePosts,
    publishFacebook,
    publishInstagram,
    normalizeMetaError,
    getLoginScopes
};
