import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// TODO: Implement user routes
router.get('/', (req, res) => {
  res.json({ message: 'User routes coming soon' });
});

export default router;