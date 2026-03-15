const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadProfilePic = upload.fields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]);

const uploadPropertyPhotos = upload.fields([
    { name: 'photos', maxCount: 20 },
    { name: 'photo', maxCount: 20 }
]);

module.exports = {
    upload,
    uploadProfilePic,
    uploadPropertyPhotos
};
