/**
 * GENERATION PROCESSING JOB
 *
 * Polls pending generations and simulates AI processing.
 * Creates Video records for video generations.
 *
 * @module jobs/processGeneration.job
 */

const cron = require('node-cron');
const Generation = require('../Models/Generation.models');
const Video = require('../Models/Video.models');
const Project = require('../Models/Project.model');
const logger = require('../utils/logger.utils');

const config = {
  interval: process.env.GENERATION_POLL_INTERVAL || '*/1 * * * *', // every minute
  batchSize: Number(process.env.GENERATION_BATCH_SIZE) || 3,
  processingDelayMs: Number(process.env.GENERATION_PROCESSING_DELAY_MS) || 500,
};

const durationToSeconds = (duration) => {
  if (duration === 'medium') return 10;
  if (duration === 'long') return 20;
  return 5;
};

const buildMockVideo = (generation) => {
  const durationLabel = generation.metadata?.duration || 'short';
  const seconds = durationToSeconds(durationLabel);

  return {
    videoUrl: `https://example.com/videos/${generation._id}.mp4`,
    thumbnailUrl: `https://example.com/videos/${generation._id}.jpg`,
    duration: seconds,
    fileSize: seconds * 1_000_000, // ~1MB per second placeholder
    resolution: {
      width: 1920,
      height: 1080,
      quality: '1080p',
    },
    storage: {
      provider: 'cloudinary',
    },
    metadata: {
      originalPrompt: generation.prompt,
      generationSettings: generation.metadata?.settings || {},
      processingTime: config.processingDelayMs,
      aiModel: generation.modelUsed,
    },
  };
};

const processGeneration = async (generation) => {
  try {
    generation.status = 'processing';
    await generation.save();

    if (config.processingDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.processingDelayMs));
    }

    if (generation.type.includes('video')) {
      const videoPayload = buildMockVideo(generation);
      const video = await Video.create({
        userId: generation.user,
        generationId: generation._id,
        ...videoPayload,
        projectId: generation.metadata?.projectId || undefined,
      });

      if (generation.metadata?.projectId) {
        const project = await Project.findById(generation.metadata.projectId);
        if (project) {
          await project.addVideo(video._id);
        }
      }

      generation.output = video.videoUrl;
    } else if (generation.type.includes('image')) {
      generation.output = `https://example.com/images/${generation._id}.png`;
    } else {
      generation.output = 'completed';
    }

    generation.status = 'completed';
    generation.error = null;
    await generation.save();

    logger.info(`✅ Generation completed: ${generation._id}`);
  } catch (error) {
    generation.status = 'failed';
    generation.error = error.message || 'Generation failed';
    await generation.save();
    logger.error(`❌ Generation failed: ${generation._id}`, error);
  }
};

const pollPendingGenerations = async () => {
  const pending = await Generation.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(config.batchSize);

  for (const generation of pending) {
    await processGeneration(generation);
  }
};

const generationJob = cron.schedule(
  config.interval,
  async () => {
    try {
      await pollPendingGenerations();
    } catch (error) {
      logger.error('Generation polling failed:', error);
    }
  },
  { scheduled: false }
);

const startGenerationWorker = () => {
  logger.info('🚀 Starting generation worker...');
  generationJob.start();
};

const stopGenerationWorker = () => {
  generationJob.stop();
  logger.info('🛑 Generation worker stopped');
};

const runOnce = async () => {
  await pollPendingGenerations();
};

module.exports = {
  startGenerationWorker,
  stopGenerationWorker,
  runOnce,
  job: generationJob,
};
