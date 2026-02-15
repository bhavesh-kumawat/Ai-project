const asyncHandler = require('../utils/asyncHandler.utils');
const User = require('../Models/User.models');
const Generation = require('../Models/Generation.models');
const Video = require('../Models/Video.models');
const Credit = require('../Models/Credit.models');
const Project = require('../Models/Project.model');
const Template = require('../Models/Template.models');
const { AppError } = require('../middleware/error.middleware');

const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalGenerations,
    pending,
    processing,
    completed,
    failed,
    totalVideos,
  ] = await Promise.all([
    User.countDocuments({}),
    Generation.countDocuments({}),
    Generation.countDocuments({ status: 'pending' }),
    Generation.countDocuments({ status: 'processing' }),
    Generation.countDocuments({ status: 'completed' }),
    Generation.countDocuments({ status: 'failed' }),
    Video.countDocuments({}),
  ]);

  const recentGenerations = await Generation.find({})
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('user', 'username email')
    .lean();

  res.json({
    success: true,
    data: {
      totals: {
        users: totalUsers,
        generations: totalGenerations,
        videos: totalVideos,
      },
      status: {
        pending,
        processing,
        completed,
        failed,
      },
      recentGenerations,
    },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { q = '', page = 1, limit = 20 } = req.query;
  const search = q.trim();
  const filter = search
    ? {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('username email role status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
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

const listGenerations = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Generation.find(filter)
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
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

const banUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (String(req.user._id) === String(id)) {
    return next(new AppError('You cannot ban yourself', 400));
  }

  const user = await User.findById(id);
  if (!user) return next(new AppError('User not found', 404));

  user.status = 'suspended';
  await user.save();

  res.json({ success: true, message: 'User banned', data: user });
});

const unbanUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return next(new AppError('User not found', 404));

  user.status = 'active';
  await user.save();

  res.json({ success: true, message: 'User unbanned', data: user });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (String(req.user._id) === String(id)) {
    return next(new AppError('You cannot delete yourself', 400));
  }

  const user = await User.findById(id);
  if (!user) return next(new AppError('User not found', 404));

  const userId = user._id;

  await Promise.all([
    Credit.deleteOne({ user: userId }),
    Generation.deleteMany({ user: userId }),
    Video.deleteMany({ userId }),
    Project.deleteMany({ userId }),
    Project.updateMany({ 'collaborators.userId': userId }, { $pull: { collaborators: { userId } } }),
    Template.updateMany({ createdBy: userId }, { $set: { createdBy: null, isOfficial: false } }),
  ]);

  await User.deleteOne({ _id: userId });

  res.json({ success: true, message: 'User deleted permanently' });
});

const deleteGeneration = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const generation = await Generation.findById(id);
  if (!generation) return next(new AppError('Generation not found', 404));

  await Video.deleteMany({ generationId: generation._id });
  await generation.deleteOne();

  res.json({ success: true, message: 'Generation deleted' });
});

module.exports = {
  getStats,
  listUsers,
  listGenerations,
  banUser,
  unbanUser,
  deleteUser,
  deleteGeneration,
};
