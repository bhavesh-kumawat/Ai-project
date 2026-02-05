const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary.utils');
const asyncHandler = require('../utils/asyncHandler.utils');

// Upload endpoint
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(req.file.buffer, 'generations');

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: result.secure_url,
      publicId: result.public_id
    }
  });
});

// Delete endpoint
const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;

  const result = await deleteFromCloudinary(publicId);

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
    data: result
  });
});

module.exports = { uploadImage, deleteImage };
