import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// TODO: Implement learning routes
router.get('/', (req, res) => {
  res.json({ message: 'Learning routes coming soon' });
});

export default router;