const asyncHandler = require('../utils/asyncHandler.utils');
const User = require('../Models/User.models');
const Generation = require('../Models/Generation.models');
const Video = require('../Models/Video.models');

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
      .select('username email role createdAt')
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

module.exports = {
  getStats,
  listUsers,
  listGenerations,
};
