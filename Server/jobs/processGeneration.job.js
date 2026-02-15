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
const { uploadToCloudinary } = require('../utils/cloudinary.utils');
const { generateImageBuffer, generateVideoBuffer } = require('../services/ai-generation.service');
const logger = require('../utils/logger.utils');
const mongoose = require('mongoose');

const config = {
  interval: process.env.GENERATION_POLL_INTERVAL || '*/5 * * * * *', // every 5 seconds
  batchSize: Number(process.env.GENERATION_BATCH_SIZE) || 3,
  processingDelayMs: Number(process.env.GENERATION_PROCESSING_DELAY_MS) || 500,
};

const formatGenerationError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  let payload = '';
  if (typeof data === 'string') payload = data;
  else if (data) {
    try {
      payload = JSON.stringify(data);
    } catch {
      payload = String(data);
    }
  }
  const suffix = payload ? ` | ${payload.slice(0, 500)}` : '';
  return `${error.message || 'Generation failed'}${status ? ` [status ${status}]` : ''}${suffix}`;
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
    videoUrl: null,
    thumbnailUrl: null,
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

const generateImageAndUpload = async (generation) => {
  const size = generation.metadata?.size || 'medium';
  const provider = generation.metadata?.provider || null;
  const buffer = await generateImageBuffer({
    prompt: generation.prompt,
    size,
    provider,
  });
  const uploaded = await uploadToCloudinary(buffer, 'generations/images');
  return uploaded.secure_url;
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
      const provider = generation.metadata?.provider || null;
      const size = generation.metadata?.size || 'medium';
      const { videoBuffer, previewImageBuffer, isFallback, fallbackReason } = await generateVideoBuffer({
        prompt: generation.prompt,
        size,
        provider,
      });
      const [videoAsset, thumbAsset] = await Promise.all([
        uploadToCloudinary(videoBuffer, 'generations/videos'),
        previewImageBuffer ? uploadToCloudinary(previewImageBuffer, 'generations/thumbnails') : Promise.resolve(null),
      ]);

      const uploadedMedia = {
        videoUrl: videoAsset.secure_url,
        thumbnailUrl: thumbAsset?.secure_url || null,
      };

      const video = await Video.create({
        userId: generation.user,
        generationId: generation._id,
        ...videoPayload,
        videoUrl: uploadedMedia.videoUrl,
        thumbnailUrl: uploadedMedia.thumbnailUrl,
        fileSize: videoAsset.bytes || videoPayload.fileSize,
        duration: Number(videoAsset.duration) || videoPayload.duration,
        format: videoAsset.format || 'mp4',
        resolution: {
          width: videoAsset.width || videoPayload.resolution.width,
          height: videoAsset.height || videoPayload.resolution.height,
          quality: (videoAsset.height >= 2160 && '4k')
            || (videoAsset.height >= 1080 && '1080p')
            || (videoAsset.height >= 720 && '720p')
            || '480p',
        },
        projectId: generation.metadata?.projectId || undefined,
      });

      if (generation.metadata?.projectId) {
        const project = await Project.findById(generation.metadata.projectId);
        if (project) {
          await project.addVideo(video._id);
        }
      }

      generation.output = video.videoUrl;
      generation.metadata = {
        ...(generation.metadata || {}),
        thumbnailGenerated: Boolean(previewImageBuffer),
        fallbackVideoUsed: Boolean(isFallback),
        fallbackReason: fallbackReason || null,
      };
    } else if (generation.type.includes('image')) {
      generation.output = await generateImageAndUpload(generation);
    } else {
      generation.output = 'completed';
    }

    generation.status = 'completed';
    generation.error = null;
    await generation.save();

    logger.info(`✅ Generation completed: ${generation._id}`);
  } catch (error) {
    generation.status = 'failed';
    generation.error = formatGenerationError(error);
    await generation.save();
    logger.error(`❌ Generation failed: ${generation._id}`, error);
  }
};

const pollPendingGenerations = async () => {
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Skipping generation polling: database not connected');
    return;
  }
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
