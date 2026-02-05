const router = require('express').Router();
// const paymentRoutes = require('./payment.routes');
const { upload } = require('../middleware/multer.middleware');
const { uploadImage } = require('../Controllers/Generation.Controller');

// router.use('/payment', paymentRoutes);


router.post('/upload', upload.single('image'), uploadImage);

router.get('/test', (req, res) => {
    res.json({ message: 'Test route is working!' });
});

module.exports = router;