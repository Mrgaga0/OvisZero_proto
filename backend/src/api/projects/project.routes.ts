import { Router } from 'express';
import { validationResult } from 'express-validator';
import { projectValidations, commonValidations } from '../../utils/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { authenticate } from '../../middleware/auth';
import * as projectController from './project.controller';

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

// Project routes
router.get(
  '/',
  commonValidations.pagination,
  validateRequest,
  asyncHandler(projectController.getProjects)
);

router.post(
  '/analyze',
  projectValidations.analyze,
  validateRequest,
  asyncHandler(projectController.analyzeProject)
);

router.post(
  '/edit',
  projectValidations.startEditing,
  validateRequest,
  asyncHandler(projectController.startEditing)
);

router.get(
  '/edit/:jobId',
  asyncHandler(projectController.getEditingStatus)
);

router.post(
  '/share',
  asyncHandler(projectController.shareProject)
);

router.get(
  '/search',
  asyncHandler(projectController.searchProjects)
);

router.get(
  '/:projectId/statistics',
  asyncHandler(projectController.getProjectStatistics)
);

export default router;