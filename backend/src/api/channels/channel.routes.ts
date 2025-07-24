import { Router } from 'express';
import { validationResult } from 'express-validator';
import { channelValidations, commonValidations, deletionValidations } from '../../utils/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { authenticate } from '../../middleware/auth';
import * as channelController from './channel.controller';

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

// Channel CRUD routes
router.get(
  '/',
  commonValidations.pagination,
  validateRequest,
  asyncHandler(channelController.getChannels)
);

router.get(
  '/:id',
  commonValidations.id,
  validateRequest,
  asyncHandler(channelController.getChannel)
);

router.post(
  '/',
  channelValidations.create,
  validateRequest,
  asyncHandler(channelController.createChannel)
);

router.put(
  '/:id',
  commonValidations.id,
  channelValidations.update,
  validateRequest,
  asyncHandler(channelController.updateChannel)
);

// 3-Step Deletion routes
router.delete(
  '/:id/initiate',
  deletionValidations.initiate,
  validateRequest,
  asyncHandler(channelController.initiateChannelDeletion)
);

router.delete(
  '/:id/confirm',
  deletionValidations.confirm,
  validateRequest,
  asyncHandler(channelController.confirmChannelDeletion)
);

router.delete(
  '/:id/final',
  deletionValidations.confirm,
  validateRequest,
  asyncHandler(channelController.finalChannelDeletion)
);

// Channel-specific routes
router.get(
  '/:id/learning-sessions',
  commonValidations.id,
  commonValidations.pagination,
  validateRequest,
  asyncHandler(channelController.getChannelLearningSessions)
);

router.get(
  '/:id/statistics',
  commonValidations.id,
  validateRequest,
  asyncHandler(channelController.getChannelStatistics)
);

export default router;