const Project = require('../Models/Project.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../utils/asyncHandler.utils');

const createProject = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const project = await Project.create({
    userId,
    name: req.body.name,
    description: req.body.description,
    thumbnail: req.body.thumbnail,
    color: req.body.color,
    tags: req.body.tags,
    isPublic: req.body.isPublic,
    settings: req.body.settings,
  });

  res.status(201).json({
    success: true,
    data: project,
  });
});

const listProjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status = 'active', page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Project.find({ userId, status }).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
    Project.countDocuments({ userId, status }),
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

const getProjectById = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const project = await Project.findOne({ _id: req.params.id, userId }).populate('videos');
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  res.json({
    success: true,
    data: project,
  });
});

const updateProject = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const project = await Project.findOne({ _id: req.params.id, userId });
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  const { name, description, thumbnail, color, tags, isPublic, settings } = req.body;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (thumbnail !== undefined) project.thumbnail = thumbnail;
  if (color !== undefined) project.color = color;
  if (tags !== undefined) project.tags = tags;
  if (isPublic !== undefined) project.isPublic = isPublic;
  if (settings !== undefined) project.settings = settings;

  await project.save();

  res.json({
    success: true,
    message: 'Project updated',
    data: project,
  });
});

const archiveProject = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const project = await Project.findOne({ _id: req.params.id, userId });
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  await project.archive();

  res.json({
    success: true,
    message: 'Project archived',
    data: project,
  });
});

const restoreProject = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const project = await Project.findOne({ _id: req.params.id, userId });
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  await project.restore();

  res.json({
    success: true,
    message: 'Project restored',
    data: project,
  });
});

const deleteProject = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const project = await Project.findOne({ _id: req.params.id, userId });
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  project.status = 'deleted';
  project.deletedAt = new Date();
  await project.save();

  res.json({
    success: true,
    message: 'Project deleted',
  });
});

module.exports = {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  archiveProject,
  restoreProject,
  deleteProject,
};
