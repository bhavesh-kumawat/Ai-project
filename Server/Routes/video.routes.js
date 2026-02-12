const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const videoController = require('../Controllers/Video.Controller');

const router = express.Router();

const listSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    projectId: Joi.string().hex().length(24).optional(),
    visibility: Joi.string().valid('private', 'unlisted', 'public').optional(),
  }),
};

const idSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const updateSchema = {
  body: Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    visibility: Joi.string().valid('private', 'unlisted', 'public').optional(),
    isPublic: Joi.boolean().optional(),
    projectId: Joi.string().hex().length(24).optional(),
  }),
};

router.get('/', authenticate, validate(listSchema), videoController.listVideos);
router.get('/:id', authenticate, validate(idSchema), videoController.getVideoById);
router.patch('/:id', authenticate, validate({ ...idSchema, ...updateSchema }), videoController.updateVideo);
router.post('/:id/delete', authenticate, validate(idSchema), videoController.deleteVideo);
router.post('/:id/restore', authenticate, validate(idSchema), videoController.restoreVideo);

module.exports = router;
