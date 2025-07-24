import { body, param, query, ValidationChain } from 'express-validator';

// Common validation rules
export const commonValidations = {
  id: param('id').isUUID().withMessage('Invalid ID format'),
  
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isString().withMessage('Sort field must be a string'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  ],
  
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
};

// Auth validations
export const authValidations = {
  register: [
    commonValidations.email,
    commonValidations.password,
    body('name').optional().isString().trim().isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
  ],
  
  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],
  
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    commonValidations.password,
  ],
};

// Channel validations
export const channelValidations = {
  create: [
    body('name').isString().trim().isLength({ min: 1, max: 50 })
      .withMessage('Channel name is required and must be less than 50 characters'),
    body('type').isIn(['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'PODCAST', 'CUSTOM'])
      .withMessage('Invalid channel type'),
    body('description').optional().isString().isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('iconColor').optional().matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Icon color must be a valid hex color'),
  ],
  
  update: [
    body('name').optional().isString().trim().isLength({ min: 1, max: 50 })
      .withMessage('Channel name must be less than 50 characters'),
    body('description').optional().isString().isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('iconColor').optional().matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Icon color must be a valid hex color'),
    body('settings').optional().isObject()
      .withMessage('Settings must be an object'),
  ],
};

// Learning validations
export const learningValidations = {
  start: [
    body('channelId').isUUID().withMessage('Invalid channel ID'),
    body('sequenceData').isObject().withMessage('Sequence data is required'),
    body('sequenceData.duration').isFloat({ min: 0 })
      .withMessage('Duration must be a positive number'),
    body('sequenceData.frameRate').isFloat({ min: 0 })
      .withMessage('Frame rate must be a positive number'),
    body('sequenceData.clips').isArray().withMessage('Clips must be an array'),
  ],
};

// Project validations  
export const projectValidations = {
  analyze: [
    body('projectId').isString().notEmpty()
      .withMessage('Project ID is required'),
    body('projectName').isString().notEmpty()
      .withMessage('Project name is required'),
    body('sequences').isArray().withMessage('Sequences must be an array'),
  ],
  
  startEditing: [
    body('channelId').isUUID().withMessage('Invalid channel ID'),
    body('projectId').isString().notEmpty()
      .withMessage('Project ID is required'),
    body('sequenceId').isString().notEmpty()
      .withMessage('Sequence ID is required'),
  ],
};

// Deletion validations
export const deletionValidations = {
  initiate: [
    param('id').isUUID().withMessage('Invalid ID format'),
  ],
  
  confirm: [
    param('id').isUUID().withMessage('Invalid ID format'),
    body('token').isString().notEmpty()
      .withMessage('Confirmation token is required'),
  ],
};