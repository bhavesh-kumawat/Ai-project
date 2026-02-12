const multer = require("multer");

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter for validation
const fileFilter = (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = { upload };
// or: export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });


// const multer = require("multer")

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "./Public/Upload")
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname + '-' + Date.now())
//     }
// })

// export const upload = multer({ storage })