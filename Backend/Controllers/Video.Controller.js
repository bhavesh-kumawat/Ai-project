const Video = require('../Models/Video.models');
const Project = require('../Models/Project.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../utils/asyncHandler.utils');

const listVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, projectId, visibility } = req.query;

  const filter = { userId, isDeleted: false };
  if (projectId) filter.projectId = projectId;
  if (visibility) filter.visibility = visibility;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Video.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Video.countDocuments(filter),
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

const getVideoById = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const video = await Video.findOne({ _id: req.params.id, userId, isDeleted: false });

  if (!video) {
    return next(new AppError('Video not found', 404));
  }

  res.json({
    success: true,
    data: video,
  });
});

const updateVideo = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { title, description, tags, visibility, isPublic, projectId } = req.body;

  const video = await Video.findOne({ _id: req.params.id, userId, isDeleted: false });
  if (!video) {
    return next(new AppError('Video not found', 404));
  }

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return next(new AppError('Project not found', 404));
    }
    video.projectId = projectId;
  }

  if (title !== undefined) video.title = title;
  if (description !== undefined) video.description = description;
  if (tags !== undefined) video.tags = tags;
  if (visibility !== undefined) video.visibility = visibility;
  if (isPublic !== undefined) video.isPublic = isPublic;

  await video.save();

  res.json({
    success: true,
    message: 'Video updated',
    data: video,
  });
});

const deleteVideo = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const video = await Video.findOne({ _id: req.params.id, userId, isDeleted: false });
  if (!video) {
    return next(new AppError('Video not found', 404));
  }

  await video.softDelete();

  res.json({
    success: true,
    message: 'Video deleted',
  });
});

const restoreVideo = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const video = await Video.findOne({ _id: req.params.id, userId, isDeleted: true });
  if (!video) {
    return next(new AppError('Video not found', 404));
  }

  video.isDeleted = false;
  video.deletedAt = null;
  await video.save();

  res.json({
    success: true,
    message: 'Video restored',
    data: video,
  });
});

module.exports = {
  listVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  restoreVideo,
};
