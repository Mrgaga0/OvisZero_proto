import { Router } from 'express';
import { aiModelsController } from './ai-models.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// AI 모델 관련 라우트
router.get('/models', aiModelsController.getAvailableModels.bind(aiModelsController));
router.get('/models/statistics', aiModelsController.getModelStatistics.bind(aiModelsController));
router.get('/models/:modelId', aiModelsController.getModelById.bind(aiModelsController));
router.get('/models/channel/:channelType/recommendations', aiModelsController.getRecommendedModelsForChannel.bind(aiModelsController));

// API 키 관리 (인증 필요)
router.get('/providers', aiModelsController.getSupportedProviders.bind(aiModelsController));
router.post('/api-keys', authenticate, aiModelsController.registerAPIKey.bind(aiModelsController));
router.get('/api-keys', authenticate, aiModelsController.getUserAPIKeys.bind(aiModelsController));
router.delete('/api-keys/:keyId', authenticate, aiModelsController.deactivateAPIKey.bind(aiModelsController));
router.get('/usage-statistics', authenticate, aiModelsController.getAPIUsageStatistics.bind(aiModelsController));
router.post('/cost-alerts', authenticate, aiModelsController.setCostAlert.bind(aiModelsController));

export { router as aiRouter };