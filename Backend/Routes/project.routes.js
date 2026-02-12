const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const projectController = require('../Controllers/Project.Controller');

const router = express.Router();

const idSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const createSchema = {
  body: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(500).optional(),
    thumbnail: Joi.string().uri().optional(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    isPublic: Joi.boolean().optional(),
    settings: Joi.object().optional(),
  }),
};

const listSchema = {
  query: Joi.object({
    status: Joi.string().valid('active', 'archived', 'deleted').default('active'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
};

const updateSchema = {
  body: Joi.object({
    name: Joi.string().max(100).optional(),
    description: Joi.string().max(500).optional(),
    thumbnail: Joi.string().uri().optional(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    isPublic: Joi.boolean().optional(),
    settings: Joi.object().optional(),
  }),
};

router.post('/', authenticate, validate(createSchema), projectController.createProject);
router.get('/', authenticate, validate(listSchema), projectController.listProjects);
router.get('/:id', authenticate, validate(idSchema), projectController.getProjectById);
router.patch('/:id', authenticate, validate({ ...idSchema, ...updateSchema }), projectController.updateProject);
router.post('/:id/archive', authenticate, validate(idSchema), projectController.archiveProject);
router.post('/:id/restore', authenticate, validate(idSchema), projectController.restoreProject);
router.post('/:id/delete', authenticate, validate(idSchema), projectController.deleteProject);

module.exports = router;
