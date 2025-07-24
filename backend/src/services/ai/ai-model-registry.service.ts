import { logger } from '../../utils/logger';
import { cache } from '../../config/redis';

// 2025년 최신 AI 모델 레지스트리
export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  type: 'LLM' | 'VIDEO_GENERATION' | 'MULTIMODAL' | 'AUDIO' | 'IMAGE' | 'EDITING';
  version: string;
  apiEndpoint?: string;
  capabilities: string[];
  pricing: ModelPricing;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportedFormats?: string[];
  isAvailable: boolean;
  releaseDate: Date;
  performance: ModelPerformance;
}

export interface ModelPricing {
  inputCostPer1MTokens: number;
  outputCostPer1MTokens: number;
  videoCostPerSecond?: number;
  audioCostPerSecond?: number;
  freeTier?: {
    dailyLimit: number;
    monthlyLimit: number;
  };
}

export interface ModelPerformance {
  accuracy: number;
  speed: number; // requests per second
  latency: number; // milliseconds
  qualityScore: number; // 1-10
  reliabilityScore: number; // 1-10
}

// 2025년 최신 AI 모델 정의
export class AIModelRegistryService {
  private models: Map<string, AIModelConfig> = new Map();

  constructor() {
    this.initializeModels();
    logger.info('AI Model Registry initialized with 2025 models');
  }

  private initializeModels() {
    // === 2025 최신 LLM 모델들 ===
    
    // Claude 4 시리즈 (Anthropic)
    this.registerModel({
      id: 'claude-4-opus',
      name: 'Claude 4 Opus',
      provider: 'Anthropic',
      type: 'LLM',
      version: '4.0',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      capabilities: [
        'advanced-reasoning', 'code-generation', 'multimodal', 
        'long-context', 'creative-writing', 'analysis'
      ],
      pricing: {
        inputCostPer1MTokens: 15.00,
        outputCostPer1MTokens: 75.00
      },
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      supportedFormats: ['text', 'image', 'pdf', 'document'],
      isAvailable: true,
      releaseDate: new Date('2025-05-01'),
      performance: {
        accuracy: 0.95,
        speed: 12,
        latency: 800,
        qualityScore: 9.8,
        reliabilityScore: 9.7
      }
    });

    this.registerModel({
      id: 'claude-4-sonnet',
      name: 'Claude 4 Sonnet',
      provider: 'Anthropic',
      type: 'LLM',
      version: '4.0',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      capabilities: [
        'balanced-performance', 'code-generation', 'analysis', 
        'fast-reasoning', 'multimodal'
      ],
      pricing: {
        inputCostPer1MTokens: 3.00,
        outputCostPer1MTokens: 15.00
      },
      contextWindow: 200000,
      maxOutputTokens: 8192,
      supportedFormats: ['text', 'image', 'document'],
      isAvailable: true,
      releaseDate: new Date('2025-05-01'),
      performance: {
        accuracy: 0.92,
        speed: 25,
        latency: 400,
        qualityScore: 9.2,
        reliabilityScore: 9.5
      }
    });

    // GPT-4.5/GPT-5 시리즈 (OpenAI)
    this.registerModel({
      id: 'gpt-4.5-turbo',
      name: 'GPT-4.5 Turbo',
      provider: 'OpenAI',
      type: 'LLM',
      version: '4.5',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      capabilities: [
        'general-purpose', 'conversation', 'formatting', 
        'api-integration', 'multimodal', 'real-time'
      ],
      pricing: {
        inputCostPer1MTokens: 2.50,
        outputCostPer1MTokens: 10.00
      },
      contextWindow: 128000,
      maxOutputTokens: 4096,
      supportedFormats: ['text', 'image', 'audio'],
      isAvailable: true,
      releaseDate: new Date('2025-04-14'),
      performance: {
        accuracy: 0.90,
        speed: 30,
        latency: 350,
        qualityScore: 8.8,
        reliabilityScore: 9.3
      }
    });

    this.registerModel({
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      provider: 'OpenAI',
      type: 'LLM',
      version: '4.1',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      capabilities: [
        'developer-focused', 'coding', 'instruction-following',
        'enhanced-reasoning', 'multimodal'
      ],
      pricing: {
        inputCostPer1MTokens: 5.00,
        outputCostPer1MTokens: 20.00
      },
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      supportedFormats: ['text', 'image', 'code'],
      isAvailable: true,
      releaseDate: new Date('2025-04-14'),
      performance: {
        accuracy: 0.93,
        speed: 20,
        latency: 500,
        qualityScore: 9.0,
        reliabilityScore: 9.4
      }
    });

    // Gemini 2.5 Pro/3.0 시리즈 (Google)
    this.registerModel({
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      type: 'MULTIMODAL',
      version: '2.5',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      capabilities: [
        'multimodal-excellence', 'context-handling', 'scientific-analysis',
        'document-processing', 'video-understanding', 'deep-reasoning'
      ],
      pricing: {
        inputCostPer1MTokens: 1.25, // Under 200K tokens
        outputCostPer1MTokens: 2.50  // Doubles for longer contexts
      },
      contextWindow: 2000000, // 2M tokens
      maxOutputTokens: 8192,
      supportedFormats: ['text', 'image', 'video', 'audio', 'document'],
      isAvailable: true,
      releaseDate: new Date('2025-03-25'),
      performance: {
        accuracy: 0.94,
        speed: 18,
        latency: 600,
        qualityScore: 9.4,
        reliabilityScore: 9.2
      }
    });

    this.registerModel({
      id: 'gemini-flash',
      name: 'Gemini Flash',
      provider: 'Google',
      type: 'MULTIMODAL',
      version: '2.5',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      capabilities: [
        'high-speed', 'cost-effective', 'multimodal', 
        'real-time-processing', 'lightweight'
      ],
      pricing: {
        inputCostPer1MTokens: 0.075,
        outputCostPer1MTokens: 0.30
      },
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      supportedFormats: ['text', 'image', 'audio'],
      isAvailable: true,
      releaseDate: new Date('2025-03-25'),
      performance: {
        accuracy: 0.87,
        speed: 50,
        latency: 200,
        qualityScore: 8.2,
        reliabilityScore: 9.0
      }
    });

    // Grok 3 (xAI)
    this.registerModel({
      id: 'grok-3',
      name: 'Grok 3',
      provider: 'xAI',
      type: 'LLM',
      version: '3.0',
      apiEndpoint: 'https://api.x.ai/v1/chat/completions',
      capabilities: [
        'truth-seeking', 'reasoning', 'real-time-data', 
        'twitter-integration', 'uncensored'
      ],
      pricing: {
        inputCostPer1MTokens: 4.00,
        outputCostPer1MTokens: 16.00
      },
      contextWindow: 128000,
      maxOutputTokens: 4096,
      supportedFormats: ['text'],
      isAvailable: true,
      releaseDate: new Date('2025-02-01'),
      performance: {
        accuracy: 0.88,
        speed: 22,
        latency: 450,
        qualityScore: 8.5,
        reliabilityScore: 8.8
      }
    });

    // === 2025 최신 비디오 생성 모델들 ===

    // Runway Gen-4
    this.registerModel({
      id: 'runway-gen-4',
      name: 'Runway Gen-4',
      provider: 'RunwayML',
      type: 'VIDEO_GENERATION',
      version: '4.0',
      apiEndpoint: 'https://api.runwayml.com/v1/generate',
      capabilities: [
        'text-to-video', 'image-to-video', 'consistent-characters',
        'scene-continuity', 'professional-quality', 'motion-control'
      ],
      pricing: {
        inputCostPer1MTokens: 0,
        outputCostPer1MTokens: 0,
        videoCostPerSecond: 3.00
      },
      supportedFormats: ['mp4', 'mov', 'gif'],
      isAvailable: true,
      releaseDate: new Date('2025-03-01'),
      performance: {
        accuracy: 0.92,
        speed: 0.5, // videos per minute
        latency: 60000, // 1 minute
        qualityScore: 9.5,
        reliabilityScore: 9.0
      }
    });

    // Pika Labs 2.0
    this.registerModel({
      id: 'pika-2.0',
      name: 'Pika Labs 2.0',
      provider: 'Pika Labs',
      type: 'VIDEO_GENERATION',
      version: '2.0',
      apiEndpoint: 'https://api.pikalabs.com/v1/generate',
      capabilities: [
        'text-to-video', 'image-to-video', 'motion-brush',
        'modify-region', 'fast-generation', 'user-friendly'
      ],
      pricing: {
        inputCostPer1MTokens: 0,
        outputCostPer1MTokens: 0,
        videoCostPerSecond: 1.50,
        freeTier: {
          dailyLimit: 10,
          monthlyLimit: 200
        }
      },
      supportedFormats: ['mp4', 'gif'],
      isAvailable: true,
      releaseDate: new Date('2025-01-15'),
      performance: {
        accuracy: 0.85,
        speed: 1.2,
        latency: 30000,
        qualityScore: 8.5,
        reliabilityScore: 8.8
      }
    });

    // Stable Video Diffusion 2.0
    this.registerModel({
      id: 'stable-video-diffusion-2.0',
      name: 'Stable Video Diffusion 2.0',
      provider: 'Stability AI',
      type: 'VIDEO_GENERATION',
      version: '2.0',
      apiEndpoint: 'https://api.stability.ai/v2alpha/generation/video',
      capabilities: [
        'open-source', 'image-to-video', 'customizable',
        'community-driven', 'self-hostable', 'fine-tunable'
      ],
      pricing: {
        inputCostPer1MTokens: 0,
        outputCostPer1MTokens: 0,
        videoCostPerSecond: 0.80
      },
      supportedFormats: ['mp4', 'webm', 'gif'],
      isAvailable: true,
      releaseDate: new Date('2025-02-10'),
      performance: {
        accuracy: 0.87,
        speed: 2.0,
        latency: 25000,
        qualityScore: 8.7,
        reliabilityScore: 8.5
      }
    });

    // Google Veo 3
    this.registerModel({
      id: 'google-veo-3',
      name: 'Google Veo 3',
      provider: 'Google',
      type: 'VIDEO_GENERATION',
      version: '3.0',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3',
      capabilities: [
        'text-to-video', 'audio-generation', 'voice-synthesis',
        '8-second-videos', 'sound-effects', 'integrated-audio'
      ],
      pricing: {
        inputCostPer1MTokens: 0,
        outputCostPer1MTokens: 0,
        videoCostPerSecond: 2.50,
        audioCostPerSecond: 0.10
      },
      supportedFormats: ['mp4', 'webm'],
      isAvailable: true,
      releaseDate: new Date('2025-03-20'),
      performance: {
        accuracy: 0.90,
        speed: 0.8,
        latency: 45000,
        qualityScore: 9.2,
        reliabilityScore: 8.9
      }
    });

    // OpenAI Sora 2.0
    this.registerModel({
      id: 'sora-2.0',
      name: 'Sora 2.0',
      provider: 'OpenAI',
      type: 'VIDEO_GENERATION',
      version: '2.0',
      apiEndpoint: 'https://api.openai.com/v1/video/generations',
      capabilities: [
        'photorealistic-video', 'long-form-content', 'physics-simulation',
        'temporal-consistency', 'complex-scenes', 'narrative-understanding'
      ],
      pricing: {
        inputCostPer1MTokens: 0,
        outputCostPer1MTokens: 0,
        videoCostPerSecond: 5.00
      },
      supportedFormats: ['mp4', 'mov'],
      isAvailable: false, // Limited beta
      releaseDate: new Date('2025-06-01'),
      performance: {
        accuracy: 0.95,
        speed: 0.3,
        latency: 120000,
        qualityScore: 9.8,
        reliabilityScore: 9.2
      }
    });

    // === 특화 모델들 ===

    // NVIDIA Describe Anything 3B
    this.registerModel({
      id: 'nvidia-dam-3b',
      name: 'NVIDIA Describe Anything 3B',
      provider: 'NVIDIA',
      type: 'MULTIMODAL',
      version: '3B',
      apiEndpoint: 'https://api.nvidia.com/v1/foundation-models/describe-anything',
      capabilities: [
        'detailed-captioning', 'localized-descriptions', 
        'video-analysis', 'fine-grained-understanding'
      ],
      pricing: {
        inputCostPer1MTokens: 0.50,
        outputCostPer1MTokens: 2.00
      },
      contextWindow: 32000,
      maxOutputTokens: 2048,
      supportedFormats: ['image', 'video'],
      isAvailable: true,
      releaseDate: new Date('2025-04-23'),
      performance: {
        accuracy: 0.93,
        speed: 15,
        latency: 400,
        qualityScore: 9.0,
        reliabilityScore: 9.1
      }
    });

    // Microsoft Phi-4 Multimodal
    this.registerModel({
      id: 'phi-4-multimodal',
      name: 'Microsoft Phi-4 Multimodal',
      provider: 'Microsoft',
      type: 'MULTIMODAL',
      version: '4.0',
      apiEndpoint: 'https://api.cognitive.microsoft.com/phi-4',
      capabilities: [
        'speech-processing', 'vision', 'text', 'unified-architecture',
        'cross-modal-learning', 'edge-computing', 'device-deployment'
      ],
      pricing: {
        inputCostPer1MTokens: 1.00,
        outputCostPer1MTokens: 3.00
      },
      contextWindow: 64000,
      maxOutputTokens: 4096,
      supportedFormats: ['text', 'image', 'audio', 'speech'],
      isAvailable: true,
      releaseDate: new Date('2025-05-01'),
      performance: {
        accuracy: 0.89,
        speed: 35,
        latency: 250,
        qualityScore: 8.5,
        reliabilityScore: 9.0
      }
    });

    // Meta Llama 4
    this.registerModel({
      id: 'llama-4',
      name: 'Meta Llama 4',
      provider: 'Meta',
      type: 'MULTIMODAL',
      version: '4.0',
      apiEndpoint: 'https://api.llama.meta.com/v1/chat/completions',
      capabilities: [
        'open-source', 'multimodal', 'efficient', 'customizable',
        'commercial-use', 'fine-tunable', 'community-driven'
      ],
      pricing: {
        inputCostPer1MTokens: 0.00, // Open source
        outputCostPer1MTokens: 0.00
      },
      contextWindow: 128000,
      maxOutputTokens: 4096,
      supportedFormats: ['text', 'image'],
      isAvailable: true,
      releaseDate: new Date('2025-02-15'),
      performance: {
        accuracy: 0.90,
        speed: 40,
        latency: 300,
        qualityScore: 8.8,
        reliabilityScore: 8.9
      }
    });

    // === 오디오/음성 모델들 ===

    // ElevenLabs Voice 3.0
    this.registerModel({
      id: 'elevenlabs-voice-3.0',
      name: 'ElevenLabs Voice 3.0',
      provider: 'ElevenLabs',
      type: 'AUDIO',
      version: '3.0',
      apiEndpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
      capabilities: [
        'voice-cloning', 'multilingual', 'emotion-control',
        'real-time-synthesis', 'custom-voices', 'dubbing'
      ],
      pricing: {
        inputCostPer1MTokens: 0,
        outputCostPer1MTokens: 0,
        audioCostPerSecond: 0.30
      },
      supportedFormats: ['mp3', 'wav', 'flac'],
      isAvailable: true,
      releaseDate: new Date('2025-01-10'),
      performance: {
        accuracy: 0.95,
        speed: 10,
        latency: 500,
        qualityScore: 9.5,
        reliabilityScore: 9.3
      }
    });

    logger.info(`Initialized ${this.models.size} AI models for 2025`);
  }

  private registerModel(config: AIModelConfig) {
    this.models.set(config.id, config);
  }

  // 공개 메서드들
  async getAvailableModels(type?: string): Promise<AIModelConfig[]> {
    let models = Array.from(this.models.values()).filter(m => m.isAvailable);
    
    if (type) {
      models = models.filter(m => m.type === type);
    }
    
    return models.sort((a, b) => b.performance.qualityScore - a.performance.qualityScore);
  }

  async getModelById(id: string): Promise<AIModelConfig | null> {
    return this.models.get(id) || null;
  }

  async getRecommendedModel(
    task: 'video-generation' | 'text-analysis' | 'code-generation' | 'multimodal' | 'audio-generation',
    budget: 'free' | 'low' | 'medium' | 'high' = 'medium'
  ): Promise<AIModelConfig[]> {
    const allModels = await this.getAvailableModels();
    let filteredModels: AIModelConfig[] = [];

    // 작업 유형별 필터링
    switch (task) {
      case 'video-generation':
        filteredModels = allModels.filter(m => m.type === 'VIDEO_GENERATION');
        break;
      case 'text-analysis':
        filteredModels = allModels.filter(m => 
          m.type === 'LLM' && m.capabilities.includes('analysis')
        );
        break;
      case 'code-generation':
        filteredModels = allModels.filter(m => 
          m.capabilities.includes('code-generation') || 
          m.capabilities.includes('coding')
        );
        break;
      case 'multimodal':
        filteredModels = allModels.filter(m => 
          m.type === 'MULTIMODAL' || m.capabilities.includes('multimodal')
        );
        break;
      case 'audio-generation':
        filteredModels = allModels.filter(m => m.type === 'AUDIO');
        break;
    }

    // 예산별 필터링
    filteredModels = filteredModels.filter(model => {
      const cost = model.pricing.inputCostPer1MTokens + model.pricing.outputCostPer1MTokens;
      
      switch (budget) {
        case 'free':
          return cost === 0 || model.pricing.freeTier;
        case 'low':
          return cost < 5;
        case 'medium':
          return cost < 20;
        case 'high':
          return true;
        default:
          return true;
      }
    });

    return filteredModels
      .sort((a, b) => b.performance.qualityScore - a.performance.qualityScore)
      .slice(0, 5);
  }

  async getModelPricing(modelId: string): Promise<ModelPricing | null> {
    const model = await this.getModelById(modelId);
    return model?.pricing || null;
  }

  async updateModelAvailability(modelId: string, isAvailable: boolean): Promise<void> {
    const model = this.models.get(modelId);
    if (model) {
      model.isAvailable = isAvailable;
      await cache.set(`model:${modelId}:availability`, isAvailable, 3600);
      logger.info(`Model ${modelId} availability updated to ${isAvailable}`);
    }
  }

  async getModelStatistics(): Promise<{
    totalModels: number;
    availableModels: number;
    modelsByType: Record<string, number>;
    modelsByProvider: Record<string, number>;
    averageQualityScore: number;
  }> {
    const allModels = Array.from(this.models.values());
    const availableModels = allModels.filter(m => m.isAvailable);
    
    const modelsByType: Record<string, number> = {};
    const modelsByProvider: Record<string, number> = {};
    let totalQuality = 0;

    allModels.forEach(model => {
      modelsByType[model.type] = (modelsByType[model.type] || 0) + 1;
      modelsByProvider[model.provider] = (modelsByProvider[model.provider] || 0) + 1;
      totalQuality += model.performance.qualityScore;
    });

    return {
      totalModels: allModels.length,
      availableModels: availableModels.length,
      modelsByType,
      modelsByProvider,
      averageQualityScore: totalQuality / allModels.length
    };
  }

  // 채널 타입별 최적 모델 추천
  async getOptimalModelForChannel(channelType: string): Promise<AIModelConfig[]> {
    const recommendations: Record<string, string[]> = {
      'YOUTUBE': ['claude-4-sonnet', 'gpt-4.1', 'runway-gen-4'],
      'TIKTOK': ['gemini-flash', 'pika-2.0', 'elevenlabs-voice-3.0'],
      'INSTAGRAM': ['phi-4-multimodal', 'stable-video-diffusion-2.0', 'nvidia-dam-3b'],
      'PODCAST': ['claude-4-opus', 'elevenlabs-voice-3.0', 'gpt-4.5-turbo'],
      'CUSTOM': ['claude-4-opus', 'gemini-2.5-pro', 'runway-gen-4']
    };

    const modelIds = recommendations[channelType] || recommendations['CUSTOM'];
    const models: AIModelConfig[] = [];

    for (const id of modelIds) {
      const model = await this.getModelById(id);
      if (model && model.isAvailable) {
        models.push(model);
      }
    }

    return models;
  }
}

export const aiModelRegistryService = new AIModelRegistryService();