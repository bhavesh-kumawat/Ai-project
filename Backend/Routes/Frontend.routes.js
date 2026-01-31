const router = require('express').Router();
const { upload } = require('../middleware/multer.middleware');
const { uploadImage } = require('../Controllers/Generation.Controller');

router.post('/upload', upload.single('image'), uploadImage);

router.get('/test', (req, res) => {
    res.json({ message: 'Test route is working!'});
});

module.exports = router;