const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

let isConfigured = false;

function ensureConfigured() {
    if (isConfigured) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Cloudinary env missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
    });

    isConfigured = true;
}

function normalizeUploadOptions(options = {}) {
    const resourceType = options.resourceType || 'image';
    return {
        folder: options.folder || process.env.CLOUDINARY_FOLDER || undefined,
        public_id: options.publicId || undefined,
        resource_type: resourceType,
        overwrite: options.overwrite ?? true,
        unique_filename: options.uniqueFilename ?? true,
        use_filename: options.useFilename ?? false,
        tags: Array.isArray(options.tags) ? options.tags : undefined,
        context: options.context || undefined
    };
}

function uploadImageFromBuffer(buffer, options = {}) {
    ensureConfigured();
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error('buffer is required');
    }

    const uploadOptions = normalizeUploadOptions(options);

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                // Cloudinary SDK returns a plain object, not an Error — normalize it
                const err = new Error(error.message || `Cloudinary upload failed (HTTP ${error.http_code || 'unknown'})`);
                err.statusCode = error.http_code || 500;
                err.cloudinaryError = error;
                return reject(err);
            }
            resolve(result);
        });
        stream.end(buffer);
    });
}

function uploadImageFromDataUri(dataUri, options = {}) {
    ensureConfigured();
    const str = String(dataUri || '').trim();
    if (!str) throw new Error('dataUri is required');
    return cloudinary.uploader.upload(str, normalizeUploadOptions(options))
        .catch(error => {
            const err = new Error(error.message || `Cloudinary upload failed (HTTP ${error.http_code || 'unknown'})`);
            err.statusCode = error.http_code || 500;
            err.cloudinaryError = error;
            throw err;
        });
}

function uploadImageFromFilePath(filePath, options = {}) {
    ensureConfigured();
    const str = String(filePath || '').trim();
    if (!str) throw new Error('filePath is required');
    return cloudinary.uploader.upload(str, normalizeUploadOptions(options))
        .catch(error => {
            const err = new Error(error.message || `Cloudinary upload failed (HTTP ${error.http_code || 'unknown'})`);
            err.statusCode = error.http_code || 500;
            err.cloudinaryError = error;
            throw err;
        });
}

async function uploadImage(input = {}, options = {}) {
    const buffer = input?.buffer;
    const filePath = input?.filePath;
    const dataUri = input?.dataUri;
    const base64 = input?.base64;
    const mimeType = input?.mimeType;

    let result;
    if (Buffer.isBuffer(buffer)) {
        result = await uploadImageFromBuffer(buffer, options);
    } else if (dataUri) {
        result = await uploadImageFromDataUri(dataUri, options);
    } else if (base64) {
        const rawB64 = String(base64).trim();
        if (rawB64.startsWith('data:')) {
            result = await uploadImageFromDataUri(rawB64, options);
        } else {
            const mime = String(mimeType || 'image/jpeg').trim() || 'image/jpeg';
            const uri = `data:${mime};base64,${rawB64}`;
            result = await uploadImageFromDataUri(uri, options);
        }
    } else if (filePath) {
        result = await uploadImageFromFilePath(filePath, options);
    } else {
        console.error('❌ uploadImage: No valid input provided', { inputKeys: Object.keys(input || {}) });
        throw new Error('Provide one of: buffer, dataUri, base64, filePath');
    }

    if (!result) {
        console.error('❌ uploadImage: Cloudinary returned empty result');
        throw new Error('Cloudinary upload failed: Empty result');
    }

    return {
        publicId: result.public_id,
        assetId: result.asset_id,
        version: result.version,
        signature: result.signature,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        resourceType: result.resource_type,
        url: result.url,
        secureUrl: result.secure_url,
        createdAt: result.created_at
    };
}

function extractPublicId(url) {
    if (!url || typeof url !== 'string') return null;
    // Standard Cloudinary URL pattern: .../upload/(v12345/)?folder/public_id.ext
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const postUpload = parts[1];
    // Remove version prefix if present (e.g., v123456789/)
    const withoutVersion = postUpload.replace(/^v\d+\//, '');
    
    // Remove file extension
    const lastDotIndex = withoutVersion.lastIndexOf('.');
    if (lastDotIndex === -1) return withoutVersion;
    
    return withoutVersion.substring(0, lastDotIndex);
}

async function deleteImage(urlOrId) {
    if (!urlOrId) return null;
    ensureConfigured();
    
    const publicId = urlOrId.includes('/') && urlOrId.includes('.') ? extractPublicId(urlOrId) : urlOrId;
    if (!publicId) return null;

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error(`❌ Cloudinary deletion failed for ${publicId}:`, error.message);
        return { result: 'error', message: error.message };
    }
}

async function deleteMultipleImages(urlsOrIds) {
    if (!Array.isArray(urlsOrIds) || urlsOrIds.length === 0) return [];
    
    const results = [];
    for (const item of urlsOrIds) {
        if (item) {
            results.push(await deleteImage(item));
        }
    }
    return results;
}

module.exports = {
    uploadImage,
    uploadImageFromBuffer,
    uploadImageFromDataUri,
    uploadImageFromFilePath,
    extractPublicId,
    deleteImage,
    deleteMultipleImages
};
