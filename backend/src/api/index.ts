import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import channelRoutes from './channels/channel.routes';
import learningRoutes from './learning/learning.routes';
import projectRoutes from './projects/project.routes';
import userRoutes from './users/user.routes';
import { aiRouter } from './ai/index';

const router = Router();

// API version
router.get('/version', (_, res) => {
  res.json({ 
    version: '0.1.0',
    name: 'Ovistra Backend API',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/channels', channelRoutes);
router.use('/learning', learningRoutes);
router.use('/projects', projectRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRouter);

export default router;