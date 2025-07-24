import { prisma } from '../../config/database';
import { cache } from '../../config/redis';
import { logger } from '../../utils/logger';
import { encryptData, decryptData } from '../security/security.service';

// API 키 관리 서비스 - 2025년 최신 AI 서비스 지원
export interface APIKeyConfig {
  id: string;
  userId: string;
  provider: string;
  keyType: 'primary' | 'secondary' | 'backup';
  encryptedKey: string;
  keyName?: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  costLimit?: number; // 월간 비용 제한 (USD)
  currentCost: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIUsageLog {
  id: string;
  apiKeyId: string;
  provider: string;
  model: string;
  endpoint: string;
  tokensUsed: number;
  cost: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

export class APIKeyManagerService {
  // 지원하는 AI 서비스 제공업체들 (2025년 기준)
  private readonly supportedProviders = [
    // 메이저 LLM 제공업체
    'openai',      // GPT-4.5, GPT-4.1, GPT-5
    'anthropic',   // Claude 4 Opus, Sonnet
    'google',      // Gemini 2.5 Pro, Veo 3
    'xai',         // Grok 3
    'microsoft',   // Phi-4 Multimodal
    'meta',        // Llama 4
    
    // 비디오 생성 서비스
    'runwayml',    // Gen-4
    'pikalabs',    // Pika 2.0
    'stability',   // Stable Video Diffusion 2.0
    
    // 오디오/음성 서비스
    'elevenlabs',  // Voice 3.0
    'murf',        // AI Voice
    'speechify',   // Text-to-Speech
    
    // 이미지 생성 서비스
    'midjourney',  // v7
    'dall-e',      // DALL-E 4
    'stable-diffusion', // SDXL 2.0
    
    // 특화 서비스
    'nvidia',      // Describe Anything 3B
    'adobe',       // Creative Cloud APIs
    'huggingface', // Open Source Models
    
    // 한국 AI 서비스
    'naver',       // HyperCLOVA X
    'kakao',       // KoGPT, Karlo
    'upstage',     // Solar LLM
    'lxper',       // Llxper AI
  ];

  // API 키 생성/저장
  async createAPIKey(
    userId: string,
    provider: string,
    apiKey: string,
    options: {
      keyName?: string;
      keyType?: 'primary' | 'secondary' | 'backup';
      usageLimit?: number;
      costLimit?: number;
      expiresAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<APIKeyConfig> {
    if (!this.supportedProviders.includes(provider.toLowerCase())) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // API 키 암호화
    const encryptedKey = await encryptData(apiKey);
    
    // 데이터베이스에 저장 (User 테이블의 metadata 필드 활용)
    const keyConfig: APIKeyConfig = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      provider: provider.toLowerCase(),
      keyType: options.keyType || 'primary',
      encryptedKey,
      keyName: options.keyName || `${provider} API Key`,
      isActive: true,
      usageLimit: options.usageLimit,
      usageCount: 0,
      costLimit: options.costLimit,
      currentCost: 0,
      expiresAt: options.expiresAt,
      lastUsedAt: undefined,
      metadata: options.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 사용자 메타데이터에 API 키 정보 저장
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentApiKeys = (user?.metadata as any)?.apiKeys || [];
    currentApiKeys.push(keyConfig);

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...(user?.metadata as any || {}),
          apiKeys: currentApiKeys
        } as any
      }
    });

    // 캐시에 저장 (1시간)
    await cache.set(`api_key:${keyConfig.id}`, keyConfig, 3600);

    logger.info(`API key created for user ${userId}, provider ${provider}`);
    return keyConfig;
  }

  // API 키 조회
  async getAPIKey(userId: string, provider: string, keyType: 'primary' | 'secondary' | 'backup' = 'primary'): Promise<string | null> {
    try {
      // 캐시에서 먼저 확인
      const cacheKey = `api_key:${userId}:${provider}:${keyType}`;
      let apiKey = await cache.get<string>(cacheKey);
      
      if (apiKey) {
        return apiKey;
      }

      // 데이터베이스에서 조회
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const apiKeys = (user?.metadata as any)?.apiKeys || [];
      
      const keyConfig = apiKeys.find((key: APIKeyConfig) => 
        key.provider === provider.toLowerCase() && 
        key.keyType === keyType && 
        key.isActive &&
        (!key.expiresAt || key.expiresAt > new Date())
      );

      if (!keyConfig) {
        return null;
      }

      // 사용량 제한 확인
      if (keyConfig.usageLimit && keyConfig.usageCount >= keyConfig.usageLimit) {
        logger.warn(`API key usage limit exceeded: ${keyConfig.id}`);
        return null;
      }

      // 비용 제한 확인
      if (keyConfig.costLimit && keyConfig.currentCost >= keyConfig.costLimit) {
        logger.warn(`API key cost limit exceeded: ${keyConfig.id}`);
        return null;
      }

      // 복호화
      apiKey = await decryptData(keyConfig.encryptedKey);
      
      // 캐시에 저장 (10분)
      await cache.set(cacheKey, apiKey, 600);
      
      return apiKey;
    } catch (error) {
      logger.error('Failed to get API key:', error);
      return null;
    }
  }

  // 사용자의 모든 API 키 조회
  async getUserAPIKeys(userId: string): Promise<APIKeyConfig[]> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const apiKeys = (user?.metadata as any)?.apiKeys || [];
    
    // 민감한 정보 제거
    return apiKeys.map((key: APIKeyConfig) => ({
      ...key,
      encryptedKey: '***masked***',
    }));
  }

  // API 키 사용 기록
  async recordAPIUsage(
    userId: string,
    provider: string,
    model: string,
    endpoint: string,
    tokensUsed: number,
    cost: number,
    responseTime: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      // 사용 로그 생성
      const usageLog: APIUsageLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        apiKeyId: `${userId}:${provider}`,
        provider: provider.toLowerCase(),
        model,
        endpoint,
        tokensUsed,
        cost,
        responseTime,
        success,
        errorMessage,
        timestamp: new Date()
      };

      // 감사 로그에 기록
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'API_USAGE',
          entityType: 'AI_SERVICE',
          entityId: model,
          metadata: usageLog as any
        }
      });

      // API 키 사용량 업데이트
      await this.updateAPIKeyUsage(userId, provider, tokensUsed, cost);

      logger.debug(`API usage recorded: ${provider}/${model}, cost: $${cost.toFixed(4)}`);
    } catch (error) {
      logger.error('Failed to record API usage:', error);
    }
  }

  // API 키 사용량 업데이트
  private async updateAPIKeyUsage(userId: string, provider: string, tokensUsed: number, cost: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const apiKeys = (user?.metadata as any)?.apiKeys || [];
    
    const keyIndex = apiKeys.findIndex((key: APIKeyConfig) => 
      key.provider === provider.toLowerCase() && key.isActive
    );

    if (keyIndex !== -1) {
      apiKeys[keyIndex].usageCount += tokensUsed;
      apiKeys[keyIndex].currentCost += cost;
      apiKeys[keyIndex].lastUsedAt = new Date();
      apiKeys[keyIndex].updatedAt = new Date();

      await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...(user?.metadata as any || {}),
            apiKeys
          } as any
        }
      });

      // 캐시 무효화
      await cache.del(`api_key:${userId}:${provider}:primary`);
    }
  }

  // API 키 비활성화
  async deactivateAPIKey(userId: string, keyId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const apiKeys = (user?.metadata as any)?.apiKeys || [];
    
    const keyIndex = apiKeys.findIndex((key: APIKeyConfig) => key.id === keyId);
    if (keyIndex !== -1) {
      apiKeys[keyIndex].isActive = false;
      apiKeys[keyIndex].updatedAt = new Date();

      await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...(user?.metadata as any || {}),
            apiKeys
          } as any
        }
      });

      // 관련 캐시 삭제
      await cache.del(`api_key:${keyId}`);
      
      logger.info(`API key deactivated: ${keyId}`);
    }
  }

  // API 키 회전 (보안)
  async rotateAPIKey(userId: string, keyId: string, newApiKey: string): Promise<void> {
    const encryptedNewKey = await encryptData(newApiKey);
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const apiKeys = (user?.metadata as any)?.apiKeys || [];
    
    const keyIndex = apiKeys.findIndex((key: APIKeyConfig) => key.id === keyId);
    if (keyIndex !== -1) {
      apiKeys[keyIndex].encryptedKey = encryptedNewKey;
      apiKeys[keyIndex].updatedAt = new Date();
      apiKeys[keyIndex].usageCount = 0; // 사용량 리셋
      apiKeys[keyIndex].currentCost = 0; // 비용 리셋

      await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...(user?.metadata as any || {}),
            apiKeys
          } as any
        }
      });

      // 캐시 무효화
      const keyConfig = apiKeys[keyIndex];
      await cache.del(`api_key:${userId}:${keyConfig.provider}:${keyConfig.keyType}`);
      
      logger.info(`API key rotated: ${keyId}`);
    }
  }

  // 사용량 통계
  async getUsageStatistics(userId: string, provider?: string, days: number = 30): Promise<{
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    averageResponseTime: number;
    successRate: number;
    dailyUsage: Array<{ date: string; cost: number; tokens: number; requests: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const whereClause: any = {
      userId,
      action: 'API_USAGE',
      createdAt: { gte: startDate }
    };

    if (provider) {
      whereClause.metadata = {
        path: ['provider'],
        equals: provider.toLowerCase()
      };
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    let totalCost = 0;
    let totalTokens = 0;
    let totalResponseTime = 0;
    let successCount = 0;
    const dailyUsage: Record<string, { cost: number; tokens: number; requests: number }> = {};

    logs.forEach(log => {
      const metadata = log.metadata as any;
      const date = log.createdAt.toISOString().split('T')[0];
      
      totalCost += metadata.cost || 0;
      totalTokens += metadata.tokensUsed || 0;
      totalResponseTime += metadata.responseTime || 0;
      
      if (metadata.success) successCount++;

      if (!dailyUsage[date]) {
        dailyUsage[date] = { cost: 0, tokens: 0, requests: 0 };
      }
      
      dailyUsage[date].cost += metadata.cost || 0;
      dailyUsage[date].tokens += metadata.tokensUsed || 0;
      dailyUsage[date].requests += 1;
    });

    return {
      totalCost,
      totalTokens,
      requestCount: logs.length,
      averageResponseTime: logs.length > 0 ? totalResponseTime / logs.length : 0,
      successRate: logs.length > 0 ? successCount / logs.length : 0,
      dailyUsage: Object.entries(dailyUsage).map(([date, usage]) => ({
        date,
        ...usage
      }))
    };
  }

  // 비용 알림 설정
  async setCostAlert(userId: string, provider: string, threshold: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const apiKeys = (user?.metadata as any)?.apiKeys || [];
    
    const keyIndex = apiKeys.findIndex((key: APIKeyConfig) => 
      key.provider === provider.toLowerCase() && key.isActive
    );

    if (keyIndex !== -1) {
      apiKeys[keyIndex].metadata = {
        ...apiKeys[keyIndex].metadata,
        costAlertThreshold: threshold
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...(user?.metadata as any || {}),
            apiKeys
          } as any
        }
      });

      logger.info(`Cost alert set for ${provider}: $${threshold}`);
    }
  }

  // 지원되는 제공업체 목록
  getSupportedProviders(): string[] {
    return [...this.supportedProviders];
  }

  // 제공업체별 모델 목록
  getProviderModels(provider: string): string[] {
    const models: Record<string, string[]> = {
      'openai': ['gpt-4.5-turbo', 'gpt-4.1', 'gpt-5-preview', 'dall-e-4'],
      'anthropic': ['claude-4-opus', 'claude-4-sonnet', 'claude-4-haiku'],
      'google': ['gemini-2.5-pro', 'gemini-flash', 'veo-3', 'imagen-3'],
      'xai': ['grok-3', 'grok-3-mini'],
      'microsoft': ['phi-4-multimodal', 'copilot-gpt-4'],
      'meta': ['llama-4', 'llama-4-code'],
      'runwayml': ['gen-4', 'gen-3-alpha'],
      'pikalabs': ['pika-2.0', 'pika-1.5'],
      'stability': ['stable-video-diffusion-2.0', 'sdxl-2.0'],
      'elevenlabs': ['voice-3.0', 'voice-clone-pro'],
      'nvidia': ['describe-anything-3b', 'omniverse-audio2face'],
      'naver': ['hyperclova-x', 'clova-studio'],
      'kakao': ['kogpt-3.0', 'karlo-2.0']
    };

    return models[provider.toLowerCase()] || [];
  }

  // API 키 유효성 검증
  async validateAPIKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      // 각 제공업체별 검증 로직
      switch (provider.toLowerCase()) {
        case 'openai':
          return await this.validateOpenAIKey(apiKey);
        case 'anthropic':
          return await this.validateAnthropicKey(apiKey);
        case 'google':
          return await this.validateGoogleKey(apiKey);
        // ... 기타 제공업체들
        default:
          logger.warn(`No validation method for provider: ${provider}`);
          return true; // 기본적으로 유효하다고 가정
      }
    } catch (error) {
      logger.error(`API key validation failed for ${provider}:`, error);
      return false;
    }
  }

  private async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async validateAnthropicKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-4-haiku',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.status !== 401;
    } catch {
      return false;
    }
  }

  private async validateGoogleKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiKeyManagerService = new APIKeyManagerService();