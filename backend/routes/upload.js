const multer = require('multer');

const chatAttachmentMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
});

const uploadChatAttachment = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (chatAttachmentMimeTypes.has(String(file.mimetype || '').toLowerCase())) return cb(null, true);
        const error = new Error('Unsupported chat attachment type');
        error.statusCode = 400;
        return cb(error);
    }
});

const uploadProfilePic = upload.fields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]);

const uploadPropertyPhotos = upload.fields([
    { name: 'photos', maxCount: 20 },
    { name: 'photo', maxCount: 20 },
    { name: 'documents', maxCount: 10 },
    { name: 'document', maxCount: 10 }
]);

const uploadCampaignMedia = upload.fields([
    { name: 'media', maxCount: 1 }
]);

module.exports = {
    upload,
    uploadChatAttachment,
    uploadProfilePic,
    uploadPropertyPhotos,
    uploadCampaignMedia
};
