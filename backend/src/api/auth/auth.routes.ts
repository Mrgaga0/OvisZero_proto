import { Router } from 'express';
import { validationResult } from 'express-validator';
import { authValidations } from '../../utils/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { authenticate, AuthRequest } from '../../middleware/auth';
import * as authController from './auth.controller';

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

// Public routes
router.post(
  '/register',
  authValidations.register,
  validateRequest,
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authValidations.login,
  validateRequest,
  asyncHandler(authController.login)
);

router.post(
  '/refresh',
  asyncHandler(authController.refreshToken)
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

router.post(
  '/change-password',
  authenticate,
  authValidations.changePassword,
  validateRequest,
  asyncHandler(authController.changePassword)
);

router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getProfile)
);

export default router;