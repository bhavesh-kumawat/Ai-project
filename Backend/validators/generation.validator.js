const Joi = require('joi');

const generationTypes = [
  'text-to-image',
  'text-to-video',
  'text-to-text',
  'text-to-speech',
  'image-to-image',
  'image-to-video',
  'video-to-video',
  'text-to-audio',
  'audio-to-text',
  'audio-generation',
];

const durationOptions = ['short', 'medium', 'long'];

const createGenerationSchema = {
  body: Joi.object({
    type: Joi.string().valid(...generationTypes).required(),
    prompt: Joi.string().min(1).max(1000).required(),
    inputImage: Joi.string().uri().allow(null, ''),
    modelUsed: Joi.string().max(100).default('default-model'),
    duration: Joi.string().valid(...durationOptions).default('short'),
    projectId: Joi.string().hex().length(24).optional(),
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(1000).optional(),
    settings: Joi.object().default({}),
    metadata: Joi.object().default({}),
  }),
};

const listGenerationsSchema = {
  query: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed').optional(),
    type: Joi.string().valid(...generationTypes).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
};

const generationIdSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createGenerationSchema,
  listGenerationsSchema,
  generationIdSchema,
  generationTypes,
  durationOptions,
};
