const { cloudinary } = require('../config/cloudinary.config');
const streamifier = require('streamifier');

// Upload image from buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

// Upload a remote URL directly to Cloudinary
const uploadUrlToCloudinary = async (fileUrl, folder = 'uploads', resourceType = 'auto') => {
  const result = await cloudinary.uploader.upload(fileUrl, {
    folder,
    resource_type: resourceType,
  });
  return result;
};

module.exports = {
  uploadToCloudinary,
  uploadUrlToCloudinary,
  deleteFromCloudinary
};
