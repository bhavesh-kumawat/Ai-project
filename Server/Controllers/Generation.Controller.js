const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary.utils');
const asyncHandler = require('../utils/asyncHandler.utils');
const Generation = require('../Models/Generation.models');
const Project = require('../Models/Project.model');
const generationJob = require('../jobs/processGeneration.job');
const { AppError } = require('../middleware/error.middleware');
const { validatePrompt, calculateCredits, getRecommendedService } = require('../utils/Ai.utils');
const { deductUserCredit } = require('../services/credit.service');

const resolveCreditsForType = (type, metadata = {}) => {
  if (type === 'text-to-video' || type === 'image-to-video') {
    return calculateCredits('textToVideo', { duration: metadata.duration || 'short' });
  }
  if (type === 'text-to-image' || type === 'image-to-image') {
    const base = calculateCredits('textToImage', { provider: metadata.provider || 'replicate' });
    const size = metadata.size || 'medium';
    const multiplier = size === 'small' ? 1 : size === 'large' ? 2 : 1.5;
    return Math.ceil(base * multiplier);
  }
  return 1;
};

const createGeneration = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const {
    type,
    prompt,
    inputImage = null,
    modelUsed,
    duration,
    projectId,
    title,
    description,
    settings = {},
    metadata = {},
  } = req.body;

  const promptValidation = validatePrompt(prompt);
  if (!promptValidation.valid) {
    return next(new AppError(promptValidation.errors.join(', '), 400));
  }

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return next(new AppError('Project not found', 404));
    }
  }

  const creditCost = resolveCreditsForType(type, { duration, provider: metadata.provider, size: metadata.size });
  try {
    await deductUserCredit(userId, creditCost);
  } catch (error) {
    return next(new AppError(error.message || 'Insufficient credits', 402));
  }

  const generation = await Generation.create({
    user: userId,
    type,
    prompt: prompt || 'Uploaded Image',
    inputImage,
    output: req.body.output || null,
    status: req.body.status || 'pending',
    modelUsed: modelUsed || getRecommendedService(type === 'text-to-video' ? 'textToVideo' : 'textToImage'),
    creditUsed: req.body.creditUsed !== undefined ? req.body.creditUsed : creditCost,
    metadata: {
      ...metadata,
      duration,
      settings,
      projectId,
    },
  });

  // Trigger one quick processing pass so user/admin dashboards update faster.
  setImmediate(() => {
    generationJob.runOnce().catch(() => { });
  });

  res.status(201).json({
    success: true,
    message: 'Generation request created',
    data: generation,
  });
});

const listGenerations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, type, page = 1, limit = 20 } = req.query;

  const filter = { user: userId };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Generation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Generation.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

const getGenerationById = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const generation = await Generation.findOne({ _id: req.params.id, user: userId });

  if (!generation) {
    return next(new AppError('Generation not found', 404));
  }

  res.json({
    success: true,
    data: generation,
  });
});

const cancelGeneration = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const generation = await Generation.findOne({ _id: req.params.id, user: userId });

  if (!generation) {
    return next(new AppError('Generation not found', 404));
  }

  if (generation.status === 'completed') {
    return next(new AppError('Completed generations cannot be canceled', 400));
  }

  generation.status = 'failed';
  generation.error = 'Canceled by user';
  await generation.save();

  res.json({
    success: true,
    message: 'Generation canceled',
    data: generation,
  });
});

const retryGeneration = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const generation = await Generation.findOne({ _id: req.params.id, user: userId });

  if (!generation) {
    return next(new AppError('Generation not found', 404));
  }

  if (generation.status === 'processing') {
    return next(new AppError('Generation is already processing', 400));
  }

  generation.status = 'pending';
  generation.error = null;
  generation.output = null;
  await generation.save();

  res.json({
    success: true,
    message: 'Generation queued for retry',
    data: generation,
  });
});

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

module.exports = {
  createGeneration,
  listGenerations,
  getGenerationById,
  cancelGeneration,
  retryGeneration,
  uploadImage,
  deleteImage,
};
