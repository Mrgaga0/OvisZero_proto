import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// TODO: Implement project routes
router.get('/', (req, res) => {
  res.json({ message: 'Project routes coming soon' });
});

export default router;