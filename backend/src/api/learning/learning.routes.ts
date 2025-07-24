import { Router } from 'express';
import { validationResult } from 'express-validator';
import { learningValidations, commonValidations } from '../../utils/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { authenticate } from '../../middleware/auth';
import * as learningController from './learning.controller';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// All routes require authentication
router.use(authenticate);

// Learning session routes
router.get(
  '/',
  commonValidations.pagination,
  validateRequest,
  asyncHandler(learningController.getLearningSessions)
);

router.post(
  '/start',
  learningValidations.start,
  validateRequest,
  asyncHandler(learningController.startLearning)
);

router.get(
  '/:sessionId/status',
  asyncHandler(learningController.getLearningStatus)
);

router.get(
  '/:sessionId/results',
  asyncHandler(learningController.getLearningResults)
);

export default router;