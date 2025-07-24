import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { aiModelRegistryService } from '../../services/ai/ai-model-registry.service';
import { apiKeyManagerService } from '../../services/ai/api-key-manager.service';
import { logger } from '../../utils/logger';

// AI 모델 관리 컨트롤러
export class AIModelsController {
  
  // 사용 가능한 AI 모델 목록 조회
  async getAvailableModels(req: Request, res: Response) {
    try {
      const { type, provider, budget } = req.query;
      
      let models;
      if (type || provider || budget) {
        // 추천 모델 조회
        models = await aiModelRegistryService.getRecommendedModel(
          type as any,
          budget as any
        );
        
        // 제공업체 필터링
        if (provider) {
          models = models.filter(m => m.provider.toLowerCase() === (provider as string).toLowerCase());
        }
      } else {
        // 전체 모델 조회
        models = await aiModelRegistryService.getAvailableModels(type as string);
      }

      res.json({
        success: true,
        data: {
          models,
          total: models.length
        }
      });
    } catch (error) {
      logger.error('Failed to get available models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI models'
      });
    }
  }

  // 특정 모델 정보 조회
  async getModelById(req: Request, res: Response) {
    try {
      const { modelId } = req.params;
      
      const model = await aiModelRegistryService.getModelById(modelId);
      if (!model) {
        return res.status(404).json({
          success: false,
          error: 'Model not found'
        });
      }

      res.json({
        success: true,
        data: model
      });
    } catch (error) {
      logger.error('Failed to get model:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve model information'
      });
    }
  }

  // 채널별 추천 모델
  async getRecommendedModelsForChannel(req: Request, res: Response) {
    try {
      const { channelType } = req.params;
      
      const models = await aiModelRegistryService.getOptimalModelForChannel(channelType);
      
      res.json({
        success: true,
        data: {
          channelType,
          recommendedModels: models
        }
      });
    } catch (error) {
      logger.error('Failed to get recommended models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get model recommendations'
      });
    }
  }

  // 모델 통계
  async getModelStatistics(_: Request, res: Response) {
    try {
      const statistics = await aiModelRegistryService.getModelStatistics();
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Failed to get model statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve model statistics'
      });
    }
  }

  // API 키 등록
  async registerAPIKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { provider, apiKey, keyName, keyType, usageLimit, costLimit, expiresAt } = req.body;

      // API 키 유효성 검증
      const isValid = await apiKeyManagerService.validateAPIKey(provider, apiKey);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API key'
        });
      }

      const keyConfig = await apiKeyManagerService.createAPIKey(userId, provider, apiKey, {
        keyName,
        keyType,
        usageLimit,
        costLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      res.json({
        success: true,
        data: {
          ...keyConfig,
          encryptedKey: '***masked***' // 민감한 정보 마스킹
        }
      });
    } catch (error) {
      logger.error('Failed to register API key:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register API key'
      });
    }
  }

  // 사용자 API 키 목록
  async getUserAPIKeys(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const apiKeys = await apiKeyManagerService.getUserAPIKeys(userId);
      
      res.json({
        success: true,
        data: apiKeys
      });
    } catch (error) {
      logger.error('Failed to get user API keys:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve API keys'
      });
    }
  }

  // API 키 비활성화
  async deactivateAPIKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { keyId } = req.params;
      
      await apiKeyManagerService.deactivateAPIKey(userId, keyId);
      
      res.json({
        success: true,
        message: 'API key deactivated successfully'
      });
    } catch (error) {
      logger.error('Failed to deactivate API key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate API key'
      });
    }
  }

  // API 사용량 통계
  async getAPIUsageStatistics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { provider, days = 30 } = req.query;
      
      const statistics = await apiKeyManagerService.getUsageStatistics(
        userId,
        provider as string,
        parseInt(days as string)
      );
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Failed to get usage statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve usage statistics'
      });
    }
  }

  // 지원되는 제공업체 목록
  async getSupportedProviders(_: Request, res: Response) {
    try {
      const providers = apiKeyManagerService.getSupportedProviders();
      
      const providersWithModels = providers.map(provider => ({
        name: provider,
        displayName: this.getProviderDisplayName(provider),
        models: apiKeyManagerService.getProviderModels(provider),
        category: this.getProviderCategory(provider)
      }));
      
      res.json({
        success: true,
        data: providersWithModels
      });
    } catch (error) {
      logger.error('Failed to get supported providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve supported providers'
      });
    }
  }

  // 비용 알림 설정
  async setCostAlert(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { provider, threshold } = req.body;
      
      await apiKeyManagerService.setCostAlert(userId, provider, threshold);
      
      res.json({
        success: true,
        message: 'Cost alert set successfully'
      });
    } catch (error) {
      logger.error('Failed to set cost alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set cost alert'
      });
    }
  }

  // Helper 메서드들
  private getProviderDisplayName(provider: string): string {
    const displayNames: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'xai': 'xAI',
      'microsoft': 'Microsoft',
      'meta': 'Meta',
      'runwayml': 'Runway ML',
      'pikalabs': 'Pika Labs',
      'stability': 'Stability AI',
      'elevenlabs': 'ElevenLabs',
      'nvidia': 'NVIDIA',
      'naver': 'NAVER',
      'kakao': 'Kakao',
      'upstage': 'Upstage',
      'lxper': 'Lxper'
    };

    return displayNames[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
  }

  private getProviderCategory(provider: string): string {
    const categories: Record<string, string> = {
      'openai': 'LLM',
      'anthropic': 'LLM', 
      'google': 'Multimodal',
      'xai': 'LLM',
      'microsoft': 'Multimodal',
      'meta': 'Open Source',
      'runwayml': 'Video Generation',
      'pikalabs': 'Video Generation',
      'stability': 'Open Source',
      'elevenlabs': 'Audio/Voice',
      'nvidia': 'Specialized',
      'naver': 'Korean AI',
      'kakao': 'Korean AI',
      'upstage': 'Korean AI',
      'lxper': 'Korean AI'
    };

    return categories[provider] || 'Other';
  }
}

export const aiModelsController = new AIModelsController();