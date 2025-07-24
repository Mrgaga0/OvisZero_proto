import { prisma } from '../../config/database';
import { cache } from '../../config/redis';
import { logger } from '../../utils/logger';

// 7-2. 비즈니스 분석
export interface BusinessMetrics {
  userActivity: UserActivityMetrics;
  featureUsage: FeatureUsageMetrics;
  performance: PerformanceMetrics;
  revenue: RevenueMetrics;
  contentAnalysis: ContentAnalysisMetrics;
  timestamp: Date;
}

export interface UserActivityMetrics {
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  newUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  sessionMetrics: {
    averageDuration: number;
    averageSessions: number;
    bounceRate: number;
  };
  userEngagement: UserEngagementData[];
}

export interface UserEngagementData {
  userId: string;
  lastActive: Date;
  sessionsCount: number;
  totalDuration: number;
  actionsCount: number;
  engagementScore: number;
}

export interface FeatureUsageMetrics {
  magicButton: FeatureUsageData;
  channelManagement: FeatureUsageData;
  aiLearning: FeatureUsageData;
  projectManagement: FeatureUsageData;
  videoProcessing: FeatureUsageData;
  mostUsedFeatures: Array<{feature: string, usage: number}>;
  leastUsedFeatures: Array<{feature: string, usage: number}>;
}

export interface FeatureUsageData {
  totalUsage: number;
  uniqueUsers: number;
  averagePerUser: number;
  growthRate: number; // week over week
  conversionRate: number; // from view to usage
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  apiEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  slowestEndpoints: Array<{
    endpoint: string;
    avgResponseTime: number;
  }>;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  averageRevenuePerUser: number;
  subscriptionMetrics: {
    newSubscriptions: number;
    canceledSubscriptions: number;
    renewalRate: number;
    churnRate: number;
  };
  planDistribution: Array<{
    plan: string;
    users: number;
    revenue: number;
  }>;
}

export interface ContentAnalysisMetrics {
  projectsCreated: number;
  channelsCreated: number;
  aiTrainingSessions: number;
  videoProcessingJobs: number;
  popularChannelTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  contentQuality: {
    averageConfidence: number;
    successfulTrainings: number;
    failedTrainings: number;
  };
}

// 7-2-1. 사용자 행동 분석
export class BusinessAnalyticsService {
  // 비즈니스 메트릭 수집
  async collectBusinessMetrics(): Promise<BusinessMetrics> {
    logger.info('Collecting business metrics...');

    const [
      userActivity,
      featureUsage,
      performance,
      revenue,
      contentAnalysis
    ] = await Promise.all([
      this.collectUserActivityMetrics(),
      this.collectFeatureUsageMetrics(),
      this.collectPerformanceMetrics(),
      this.collectRevenueMetrics(),
      this.collectContentAnalysisMetrics()
    ]);

    const metrics: BusinessMetrics = {
      userActivity,
      featureUsage,
      performance,
      revenue,
      contentAnalysis,
      timestamp: new Date()
    };

    // 캐시에 저장
    await cache.set('business:metrics:latest', metrics, 3600); // 1시간

    logger.debug('Business metrics collected:', {
      activeUsersDaily: userActivity.activeUsers.daily,
      totalRevenue: revenue.totalRevenue,
      successRate: performance.successRate
    });

    return metrics;
  }

  // 사용자 활동 메트릭 수집
  private async collectUserActivityMetrics(): Promise<UserActivityMetrics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 활성 사용자 수
    const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
      this.getActiveUsersCount(oneDayAgo),
      this.getActiveUsersCount(oneWeekAgo),
      this.getActiveUsersCount(oneMonthAgo)
    ]);

    // 신규 사용자 수
    const [dailyNew, weeklyNew, monthlyNew] = await Promise.all([
      this.getNewUsersCount(oneDayAgo),
      this.getNewUsersCount(oneWeekAgo),
      this.getNewUsersCount(oneMonthAgo)
    ]);

    // 리텐션 계산
    const retention = await this.calculateRetentionRates();

    // 세션 메트릭
    const sessionMetrics = await this.calculateSessionMetrics();

    // 사용자 참여도
    const userEngagement = await this.getUserEngagementData();

    return {
      activeUsers: {
        daily: dailyActive,
        weekly: weeklyActive,
        monthly: monthlyActive
      },
      newUsers: {
        daily: dailyNew,
        weekly: weeklyNew,
        monthly: monthlyNew
      },
      retention,
      sessionMetrics,
      userEngagement
    };
  }

  private async getActiveUsersCount(since: Date): Promise<number> {
    return await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: since
        }
      }
    });
  }

  private async getNewUsersCount(since: Date): Promise<number> {
    return await prisma.user.count({
      where: {
        createdAt: {
          gte: since
        }
      }
    });
  }

  private async calculateRetentionRates(): Promise<{day1: number, day7: number, day30: number}> {
    // Mock 구현 - 실제로는 복잡한 코호트 분석 필요
    const totalUsers = await prisma.user.count();
    
    return {
      day1: 0.75, // 75% day-1 retention
      day7: 0.45, // 45% day-7 retention
      day30: 0.25 // 25% day-30 retention
    };
  }

  private async calculateSessionMetrics(): Promise<{
    averageDuration: number;
    averageSessions: number;
    bounceRate: number;
  }> {
    // Mock 구현 - 실제로는 세션 추적 데이터 분석
    return {
      averageDuration: 1800, // 30분
      averageSessions: 3.2, // 평균 세션 수
      bounceRate: 0.15 // 15% 바운스율
    };
  }

  private async getUserEngagementData(): Promise<UserEngagementData[]> {
    const users = await prisma.user.findMany({
      take: 100,
      orderBy: { lastLoginAt: 'desc' },
      include: {
        auditLogs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 최근 7일
            }
          }
        }
      }
    });

    return users.map(user => {
      const actionsCount = user.auditLogs.length;
      const engagementScore = this.calculateEngagementScore(user, actionsCount);

      return {
        userId: user.id,
        lastActive: user.lastLoginAt || user.createdAt,
        sessionsCount: Math.floor(actionsCount / 10), // Mock
        totalDuration: actionsCount * 300, // Mock: 5분/액션
        actionsCount,
        engagementScore
      };
    });
  }

  private calculateEngagementScore(user: any, actionsCount: number): number {
    let score = 0;
    
    // 최근 활동 점수
    const daysSinceLastLogin = user.lastLoginAt 
      ? (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    
    score += Math.max(0, 30 - daysSinceLastLogin); // 최대 30점
    
    // 활동량 점수
    score += Math.min(actionsCount * 2, 50); // 최대 50점
    
    // 계정 연령 점수
    const accountAgeInDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(accountAgeInDays / 7, 20); // 최대 20점
    
    return Math.min(score, 100);
  }

  // 7-2-2. 기능 사용 통계
  private async collectFeatureUsageMetrics(): Promise<FeatureUsageMetrics> {
    const features = [
      'MAGIC_BUTTON_CLICK',
      'CHANNEL_CREATED',
      'AI_LEARNING_STARTED',
      'PROJECT_CREATED',
      'VIDEO_PROCESSED'
    ];

    const featureUsageData: Record<string, FeatureUsageData> = {};
    
    for (const feature of features) {
      featureUsageData[feature] = await this.getFeatureUsageData(feature);
    }

    // 가장 많이/적게 사용되는 기능 찾기
    const usageEntries = Object.entries(featureUsageData)
      .map(([feature, data]) => ({ feature, usage: data.totalUsage }))
      .sort((a, b) => b.usage - a.usage);

    const mostUsedFeatures = usageEntries.slice(0, 5);
    const leastUsedFeatures = usageEntries.slice(-5).reverse();

    return {
      magicButton: featureUsageData['MAGIC_BUTTON_CLICK'],
      channelManagement: featureUsageData['CHANNEL_CREATED'],
      aiLearning: featureUsageData['AI_LEARNING_STARTED'],
      projectManagement: featureUsageData['PROJECT_CREATED'],
      videoProcessing: featureUsageData['VIDEO_PROCESSED'],
      mostUsedFeatures,
      leastUsedFeatures
    };
  }

  private async getFeatureUsageData(action: string): Promise<FeatureUsageData> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // 총 사용량
    const totalUsage = await prisma.auditLog.count({
      where: { action }
    });

    // 고유 사용자 수
    const uniqueUsers = await prisma.auditLog.findMany({
      where: { action },
      select: { userId: true },
      distinct: ['userId']
    });

    // 이번 주와 지난 주 사용량
    const thisWeekUsage = await prisma.auditLog.count({
      where: {
        action,
        createdAt: { gte: oneWeekAgo }
      }
    });

    const lastWeekUsage = await prisma.auditLog.count({
      where: {
        action,
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo
        }
      }
    });

    const growthRate = lastWeekUsage > 0 
      ? ((thisWeekUsage - lastWeekUsage) / lastWeekUsage) * 100
      : 0;

    return {
      totalUsage,
      uniqueUsers: uniqueUsers.length,
      averagePerUser: uniqueUsers.length > 0 ? totalUsage / uniqueUsers.length : 0,
      growthRate,
      conversionRate: 0.8 // Mock - 실제로는 뷰 대비 사용 비율
    };
  }

  // 7-2-3. 성능 메트릭 수집
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Mock 구현 - 실제로는 APM 도구나 로그 분석 필요
    const apiEndpoints = [
      { endpoint: '/api/auth/login', requests: 1200, avgResponseTime: 150, errorRate: 0.02 },
      { endpoint: '/api/channels', requests: 800, avgResponseTime: 200, errorRate: 0.01 },
      { endpoint: '/api/projects', requests: 600, avgResponseTime: 180, errorRate: 0.015 },
      { endpoint: '/api/ai/learn', requests: 300, avgResponseTime: 2500, errorRate: 0.05 },
      { endpoint: '/api/video/process', requests: 150, avgResponseTime: 5000, errorRate: 0.08 }
    ];

    const totalRequests = apiEndpoints.reduce((sum, ep) => sum + ep.requests, 0);
    const totalErrors = apiEndpoints.reduce((sum, ep) => sum + (ep.requests * ep.errorRate), 0);
    const averageResponseTime = apiEndpoints.reduce((sum, ep) => 
      sum + (ep.avgResponseTime * ep.requests), 0) / totalRequests;

    const slowestEndpoints = [...apiEndpoints]
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 3)
      .map(ep => ({
        endpoint: ep.endpoint,
        avgResponseTime: ep.avgResponseTime
      }));

    return {
      averageResponseTime,
      errorRate: totalErrors / totalRequests,
      successRate: 1 - (totalErrors / totalRequests),
      apiEndpoints,
      slowestEndpoints
    };
  }

  // 7-2-4. 수익 분석
  private async collectRevenueMetrics(): Promise<RevenueMetrics> {
    // Mock 구현 - 실제로는 결제 시스템과 연동
    const totalUsers = await prisma.user.count();
    
    return {
      totalRevenue: 45670, // $456.70
      revenueGrowth: 12.5, // 12.5% MoM growth
      averageRevenuePerUser: totalUsers > 0 ? 45670 / totalUsers : 0,
      subscriptionMetrics: {
        newSubscriptions: 23,
        canceledSubscriptions: 3,
        renewalRate: 0.92,
        churnRate: 0.08
      },
      planDistribution: [
        { plan: 'Free', users: totalUsers * 0.7, revenue: 0 },
        { plan: 'Pro', users: totalUsers * 0.25, revenue: 30000 },
        { plan: 'Enterprise', users: totalUsers * 0.05, revenue: 15670 }
      ]
    };
  }

  // 7-2-5. 예측 분석
  private async collectContentAnalysisMetrics(): Promise<ContentAnalysisMetrics> {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 프로젝트 및 채널 생성 수
    const [projectsCreated, channelsCreated] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'PROJECT_CREATED',
          createdAt: { gte: oneMonthAgo }
        }
      }),
      prisma.channel.count({
        where: {
          createdAt: { gte: oneMonthAgo }
        }
      })
    ]);

    // AI 학습 세션 수
    const aiTrainingSessions = await prisma.learningSession.count({
      where: {
        createdAt: { gte: oneMonthAgo }
      }
    });

    // 비디오 처리 작업 수
    const videoProcessingJobs = await prisma.auditLog.count({
      where: {
        action: 'VIDEO_PROCESSED',
        createdAt: { gte: oneMonthAgo }
      }
    });

    // 인기 채널 타입
    const channelTypes = await prisma.channel.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });

    const totalChannels = channelTypes.reduce((sum, ct) => sum + ct._count.type, 0);
    const popularChannelTypes = channelTypes.map(ct => ({
      type: ct.type,
      count: ct._count.type,
      percentage: (ct._count.type / totalChannels) * 100
    }));

    // 콘텐츠 품질 메트릭
    const trainingSessions = await prisma.learningSession.findMany({
      where: {
        createdAt: { gte: oneMonthAgo }
      },
      select: {
        status: true,
        confidence: true
      }
    });

    const successfulTrainings = trainingSessions.filter(s => s.status === 'COMPLETED').length;
    const failedTrainings = trainingSessions.filter(s => s.status === 'FAILED').length;
    const averageConfidence = trainingSessions.length > 0
      ? trainingSessions.reduce((sum, s) => sum + (s.confidence || 0), 0) / trainingSessions.length
      : 0;

    return {
      projectsCreated,
      channelsCreated,
      aiTrainingSessions,
      videoProcessingJobs,
      popularChannelTypes,
      contentQuality: {
        averageConfidence,
        successfulTrainings,
        failedTrainings
      }
    };
  }

  // 대시보드용 요약 메트릭
  async getDashboardSummary(): Promise<DashboardSummary> {
    const metrics = await this.collectBusinessMetrics();
    
    return {
      activeUsers: metrics.userActivity.activeUsers.daily,
      totalRevenue: metrics.revenue.totalRevenue,
      successRate: metrics.performance.successRate * 100,
      newProjects: metrics.contentAnalysis.projectsCreated,
      topFeature: metrics.featureUsage.mostUsedFeatures[0]?.feature || 'N/A',
      growthRate: metrics.revenue.revenueGrowth,
      errorRate: metrics.performance.errorRate * 100,
      userRetention: metrics.userActivity.retention.day7 * 100
    };
  }

  // 예측 분석
  async generatePredictions(): Promise<BusinessPredictions> {
    const historicalMetrics = await this.getHistoricalMetrics(30); // 30일
    
    // 간단한 선형 회귀 예측
    const userGrowthTrend = this.calculateTrend(
      historicalMetrics.map(m => m.userActivity.activeUsers.daily)
    );
    
    const revenueGrowthTrend = this.calculateTrend(
      historicalMetrics.map(m => m.revenue.totalRevenue)
    );

    return {
      nextMonthUsers: Math.round(userGrowthTrend.predicted),
      nextMonthRevenue: Math.round(revenueGrowthTrend.predicted),
      churnRisk: this.calculateChurnRisk(historicalMetrics),
      recommendations: this.generateRecommendations(historicalMetrics)
    };
  }

  private async getHistoricalMetrics(days: number): Promise<BusinessMetrics[]> {
    // Mock 구현 - 실제로는 저장된 메트릭 데이터 조회
    const metrics: BusinessMetrics[] = [];
    const currentMetrics = await this.collectBusinessMetrics();
    
    // 과거 데이터 시뮬레이션
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      metrics.push({
        ...currentMetrics,
        timestamp: date,
        userActivity: {
          ...currentMetrics.userActivity,
          activeUsers: {
            daily: Math.floor(currentMetrics.userActivity.activeUsers.daily * (0.8 + Math.random() * 0.4)),
            weekly: currentMetrics.userActivity.activeUsers.weekly,
            monthly: currentMetrics.userActivity.activeUsers.monthly
          }
        },
        revenue: {
          ...currentMetrics.revenue,
          totalRevenue: Math.floor(currentMetrics.revenue.totalRevenue * (0.7 + Math.random() * 0.6))
        }
      });
    }
    
    return metrics;
  }

  private calculateTrend(values: number[]): { slope: number; predicted: number } {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predicted = slope * n + intercept;

    return { slope, predicted };
  }

  private calculateChurnRisk(metrics: BusinessMetrics[]): number {
    // 간단한 이탈 위험도 계산
    const latestMetrics = metrics[metrics.length - 1];
    let risk = 0;

    // 리텐션율이 낮으면 위험도 증가
    if (latestMetrics.userActivity.retention.day7 < 0.4) risk += 30;
    if (latestMetrics.userActivity.retention.day30 < 0.2) risk += 20;

    // 세션 시간이 짧으면 위험도 증가
    if (latestMetrics.userActivity.sessionMetrics.averageDuration < 900) risk += 25; // 15분 미만

    // 에러율이 높으면 위험도 증가
    if (latestMetrics.performance.errorRate > 0.05) risk += 25;

    return Math.min(risk, 100);
  }

  private generateRecommendations(metrics: BusinessMetrics[]): string[] {
    const recommendations: string[] = [];
    const latestMetrics = metrics[metrics.length - 1];

    // 성능 기반 추천
    if (latestMetrics.performance.errorRate > 0.03) {
      recommendations.push('고에러율 API 엔드포인트 최적화 필요');
    }

    if (latestMetrics.performance.averageResponseTime > 1000) {
      recommendations.push('응답 시간 개선이 필요한 API 식별 및 최적화');
    }

    // 사용자 경험 기반 추천
    if (latestMetrics.userActivity.retention.day7 < 0.4) {
      recommendations.push('7일 리텐션 개선을 위한 온보딩 프로세스 강화');
    }

    if (latestMetrics.userActivity.sessionMetrics.bounceRate > 0.2) {
      recommendations.push('높은 바운스율 개선을 위한 초기 사용자 경험 개선');
    }

    // 기능 사용 패턴 기반 추천
    const leastUsed = latestMetrics.featureUsage.leastUsedFeatures[0];
    if (leastUsed && leastUsed.usage < 100) {
      recommendations.push(`${leastUsed.feature} 기능의 사용성 개선 및 홍보 강화`);
    }

    return recommendations.length > 0 ? recommendations : ['현재 모든 지표가 양호한 상태입니다'];
  }
}

// 인터페이스 정의
export interface DashboardSummary {
  activeUsers: number;
  totalRevenue: number;
  successRate: number;
  newProjects: number;
  topFeature: string;
  growthRate: number;
  errorRate: number;
  userRetention: number;
}

export interface BusinessPredictions {
  nextMonthUsers: number;
  nextMonthRevenue: number;
  churnRisk: number;
  recommendations: string[];
}

// 싱글톤 인스턴스
export const businessAnalyticsService = new BusinessAnalyticsService();