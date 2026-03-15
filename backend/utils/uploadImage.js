const { v2: cloudinary } = require('cloudinary');

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
            if (error) return reject(error);
            resolve(result);
        });
        stream.end(buffer);
    });
}

function uploadImageFromDataUri(dataUri, options = {}) {
    ensureConfigured();
    const str = String(dataUri || '').trim();
    if (!str) throw new Error('dataUri is required');
    return cloudinary.uploader.upload(str, normalizeUploadOptions(options));
}

function uploadImageFromFilePath(filePath, options = {}) {
    ensureConfigured();
    const str = String(filePath || '').trim();
    if (!str) throw new Error('filePath is required');
    return cloudinary.uploader.upload(str, normalizeUploadOptions(options));
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
        const mime = String(mimeType || 'image/jpeg').trim() || 'image/jpeg';
        const uri = `data:${mime};base64,${String(base64).trim()}`;
        result = await uploadImageFromDataUri(uri, options);
    } else if (filePath) {
        result = await uploadImageFromFilePath(filePath, options);
    } else {
        throw new Error('Provide one of: buffer, dataUri, base64, filePath');
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

module.exports = {
    uploadImage,
    uploadImageFromBuffer,
    uploadImageFromDataUri,
    uploadImageFromFilePath
};
