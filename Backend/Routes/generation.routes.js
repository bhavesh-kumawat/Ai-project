const express = require('express');
const validate = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const generationController = require('../Controllers/Generation.Controller');
const {
  createGenerationSchema,
  listGenerationsSchema,
  generationIdSchema,
} = require('../validators/generation.validator');

const router = express.Router();

router.post('/', authenticate, validate(createGenerationSchema), generationController.createGeneration);
router.get('/', authenticate, validate(listGenerationsSchema), generationController.listGenerations);
router.get('/:id', authenticate, validate(generationIdSchema), generationController.getGenerationById);
router.post('/:id/cancel', authenticate, validate(generationIdSchema), generationController.cancelGeneration);
router.post('/:id/retry', authenticate, validate(generationIdSchema), generationController.retryGeneration);

module.exports = router;
