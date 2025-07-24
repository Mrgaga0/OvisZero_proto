import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { cache } from '../../config/redis';

// 6. 보안 및 규정 준수
export class SecurityService {
  // 6-1-3. 키 관리 시스템
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_ROTATION_INTERVAL = 90 * 24 * 60 * 60 * 1000; // 90일

  // 6-1-1. 전송 중 암호화 (TLS) - Express에서 HTTPS 설정 필요
  static validateTLSConnection(req: any): boolean {
    return req.secure || req.headers['x-forwarded-proto'] === 'https';
  }

  // 6-1-2. 저장 시 암호화
  static encryptSensitiveData(data: string, key?: string): {encrypted: string, iv: string, tag: string} {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipherGCM(this.ENCRYPTION_ALGORITHM, encryptionKey);
    cipher.setAAD(Buffer.from('ovistra-sensitive-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decryptSensitiveData(encryptedData: {encrypted: string, iv: string, tag: string}, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not found');
    }

    const decipher = crypto.createDecipherGCM(this.ENCRYPTION_ALGORITHM, encryptionKey);
    decipher.setAAD(Buffer.from('ovistra-sensitive-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // 6-1-4. 보안 감사 로깅
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const logEntry = {
      ...event,
      timestamp: new Date(),
      severity: this.calculateSeverity(event.type),
      hash: crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex')
    };

    // 데이터베이스에 저장
    await prisma.auditLog.create({
      data: {
        userId: event.userId,
        action: `SECURITY_${event.type}`,
        entityType: 'SECURITY',
        entityId: event.resourceId,
        metadata: logEntry as any,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      }
    });

    // 고위험 이벤트는 즉시 알림
    if (logEntry.severity === 'HIGH' || logEntry.severity === 'CRITICAL') {
      await this.sendSecurityAlert(logEntry);
    }

    logger.warn(`Security Event [${event.type}]: ${event.description}`, logEntry);
  }

  private static calculateSeverity(eventType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      'LOGIN_FAILED': 'MEDIUM',
      'LOGIN_SUCCESS': 'LOW',
      'UNAUTHORIZED_ACCESS': 'HIGH',
      'DATA_ACCESS': 'MEDIUM',
      'PRIVILEGE_ESCALATION': 'CRITICAL',
      'SUSPICIOUS_ACTIVITY': 'HIGH',
      'RATE_LIMIT_EXCEEDED': 'MEDIUM',
      'MALICIOUS_REQUEST': 'HIGH'
    };

    return severityMap[eventType] || 'MEDIUM';
  }

  private static async sendSecurityAlert(event: any): Promise<void> {
    // 실제로는 이메일, Slack, SMS 등으로 알림 발송
    logger.error(`SECURITY ALERT: ${event.type} - ${event.description}`, event);
  }

  // 6-1-5. 침입 탐지 시스템
  static async detectSuspiciousActivity(req: any): Promise<SuspiciousActivityResult> {
    const clientIP = req.ip;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.id;

    const suspiciousPatterns = [
      await this.checkRateLimitViolation(clientIP, userId),
      await this.checkSQLInjectionPatterns(req),
      await this.checkXSSPatterns(req),
      await this.checkUnusualUserAgent(userAgent),
      await this.checkGeolocationAnomaly(clientIP, userId),
      await this.checkSessionAnomalies(userId)
    ];

    const detectedThreats = suspiciousPatterns.filter(p => p.isSuspicious);
    const riskScore = this.calculateRiskScore(detectedThreats);

    if (riskScore > 0.7) {
      await this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        description: `High risk activity detected (score: ${riskScore})`,
        userId,
        ipAddress: clientIP,
        userAgent,
        resourceId: req.path,
        metadata: { patterns: detectedThreats, riskScore }
      });
    }

    return {
      riskScore,
      detectedThreats: detectedThreats.map(t => t.type),
      shouldBlock: riskScore > 0.8,
      shouldChallenge: riskScore > 0.6
    };
  }

  private static async checkRateLimitViolation(ip: string, userId?: string): Promise<SuspiciousPattern> {
    const key = userId ? `rate:user:${userId}` : `rate:ip:${ip}`;
    const requests = await cache.get<number>(key) || 0;
    
    return {
      type: 'RATE_LIMIT_VIOLATION',
      isSuspicious: requests > 100, // 100 requests per minute
      confidence: Math.min(requests / 100, 1.0),
      metadata: { requests }
    };
  }

  private static async checkSQLInjectionPatterns(req: any): Promise<SuspiciousPattern> {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/i,
      /(\bOR\b\s+\b1\b\s*=\s*\b1\b|\bAND\b\s+\b1\b\s*=\s*\b1\b)/i,
      /(\'|\")(\s*;\s*|\s+--|\s+\/\*)/i
    ];

    const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
    const matches = sqlPatterns.filter(pattern => pattern.test(requestString));

    return {
      type: 'SQL_INJECTION',
      isSuspicious: matches.length > 0,
      confidence: matches.length / sqlPatterns.length,
      metadata: { matchedPatterns: matches.length }
    };
  }

  private static async checkXSSPatterns(req: any): Promise<SuspiciousPattern> {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi
    ];

    const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
    const matches = xssPatterns.filter(pattern => pattern.test(requestString));

    return {
      type: 'XSS_ATTEMPT',
      isSuspicious: matches.length > 0,
      confidence: matches.length / xssPatterns.length,
      metadata: { matchedPatterns: matches.length }
    };
  }

  private static async checkUnusualUserAgent(userAgent?: string): Promise<SuspiciousPattern> {
    if (!userAgent) {
      return { type: 'UNUSUAL_USER_AGENT', isSuspicious: true, confidence: 0.8, metadata: {} };
    }

    const suspiciousAgents = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /script/i
    ];

    const isSuspicious = suspiciousAgents.some(pattern => pattern.test(userAgent));

    return {
      type: 'UNUSUAL_USER_AGENT',
      isSuspicious,
      confidence: isSuspicious ? 0.6 : 0.1,
      metadata: { userAgent }
    };
  }

  private static async checkGeolocationAnomaly(ip: string, userId?: string): Promise<SuspiciousPattern> {
    if (!userId) {
      return { type: 'GEOLOCATION_ANOMALY', isSuspicious: false, confidence: 0, metadata: {} };
    }

    // Mock 구현 - 실제로는 GeoIP 서비스 사용
    const previousLocations = await cache.get<string[]>(`locations:${userId}`) || [];
    const currentCountry = 'KR'; // Mock

    const isNewLocation = !previousLocations.includes(currentCountry);
    
    if (isNewLocation) {
      previousLocations.push(currentCountry);
      await cache.set(`locations:${userId}`, previousLocations.slice(-5), 86400 * 30); // 30일
    }

    return {
      type: 'GEOLOCATION_ANOMALY',
      isSuspicious: isNewLocation && previousLocations.length > 0,
      confidence: isNewLocation ? 0.4 : 0.1,
      metadata: { currentCountry, isNewLocation }
    };
  }

  private static async checkSessionAnomalies(userId?: string): Promise<SuspiciousPattern> {
    if (!userId) {
      return { type: 'SESSION_ANOMALY', isSuspicious: false, confidence: 0, metadata: {} };
    }

    const sessionKey = `sessions:${userId}`;
    const activeSessions = await cache.get<number>(sessionKey) || 0;
    
    return {
      type: 'SESSION_ANOMALY',
      isSuspicious: activeSessions > 3, // 3개 이상의 동시 세션
      confidence: Math.min(activeSessions / 3, 1.0),
      metadata: { activeSessions }
    };
  }

  private static calculateRiskScore(patterns: SuspiciousPattern[]): number {
    if (patterns.length === 0) return 0;

    const weights = {
      'RATE_LIMIT_VIOLATION': 0.3,
      'SQL_INJECTION': 0.9,
      'XSS_ATTEMPT': 0.8,
      'UNUSUAL_USER_AGENT': 0.2,
      'GEOLOCATION_ANOMALY': 0.4,
      'SESSION_ANOMALY': 0.5
    };

    const totalScore = patterns.reduce((score, pattern) => {
      const weight = weights[pattern.type as keyof typeof weights] || 0.5;
      return score + (pattern.confidence * weight);
    }, 0);

    return Math.min(totalScore, 1.0);
  }

  // 6-2. 인증 보안 (이미 auth.ts에 구현된 부분들을 보완)
  
  // 6-2-3. 비밀번호 정책 검증
  static validatePasswordPolicy(password: string): PasswordValidationResult {
    const checks = [
      { name: 'length', valid: password.length >= 8, message: 'Password must be at least 8 characters long' },
      { name: 'uppercase', valid: /[A-Z]/.test(password), message: 'Password must contain at least one uppercase letter' },
      { name: 'lowercase', valid: /[a-z]/.test(password), message: 'Password must contain at least one lowercase letter' },
      { name: 'number', valid: /\d/.test(password), message: 'Password must contain at least one number' },
      { name: 'special', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password), message: 'Password must contain at least one special character' },
      { name: 'noCommon', valid: !this.isCommonPassword(password), message: 'Password is too common' }
    ];

    const failedChecks = checks.filter(check => !check.valid);
    const strength = this.calculatePasswordStrength(password);

    return {
      isValid: failedChecks.length === 0,
      strength,
      failedChecks: failedChecks.map(check => check.message),
      score: (checks.length - failedChecks.length) / checks.length
    };
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  private static calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'strong';
    return 'very-strong';
  }

  // 6-2-4. 계정 잠금 정책
  static async checkAccountLockout(identifier: string): Promise<AccountLockStatus> {
    const lockKey = `lockout:${identifier}`;
    const attemptsKey = `attempts:${identifier}`;
    
    const lockInfo = await cache.get<{lockedUntil: number, attempts: number}>(lockKey);
    const attempts = await cache.get<number>(attemptsKey) || 0;

    if (lockInfo && Date.now() < lockInfo.lockedUntil) {
      return {
        isLocked: true,
        remainingTime: lockInfo.lockedUntil - Date.now(),
        attempts: lockInfo.attempts
      };
    }

    return {
      isLocked: false,
      remainingTime: 0,
      attempts
    };
  }

  static async recordFailedAttempt(identifier: string): Promise<void> {
    const attemptsKey = `attempts:${identifier}`;
    const lockKey = `lockout:${identifier}`;
    
    const attempts = await cache.get<number>(attemptsKey) || 0;
    const newAttempts = attempts + 1;
    
    await cache.set(attemptsKey, newAttempts, 900); // 15분

    // 5회 실패 시 계정 잠금
    if (newAttempts >= 5) {
      const lockDuration = Math.min(30 * 60 * 1000 * Math.pow(2, Math.floor(newAttempts / 5)), 24 * 60 * 60 * 1000); // 최대 24시간
      const lockUntil = Date.now() + lockDuration;
      
      await cache.set(lockKey, { lockedUntil: lockUntil, attempts: newAttempts }, lockDuration / 1000);
      
      await this.logSecurityEvent({
        type: 'ACCOUNT_LOCKED',
        description: `Account locked after ${newAttempts} failed attempts`,
        userId: identifier,
        ipAddress: '',
        userAgent: '',
        resourceId: identifier,
        metadata: { attempts: newAttempts, lockDuration }
      });
    }
  }

  static async clearFailedAttempts(identifier: string): Promise<void> {
    const attemptsKey = `attempts:${identifier}`;
    await cache.del(attemptsKey);
  }

  // 6-3. 규정 준수

  // 6-3-1. GDPR 준수
  static async handleGDPRRequest(request: GDPRRequest): Promise<GDPRResponse> {
    const { type, userId, email } = request;

    switch (type) {
      case 'DATA_EXPORT':
        return await this.exportUserData(userId);
      case 'DATA_DELETION':
        return await this.deleteUserData(userId);
      case 'DATA_RECTIFICATION':
        return await this.rectifyUserData(userId, request.data);
      case 'DATA_PORTABILITY':
        return await this.portUserData(userId);
      default:
        throw new Error(`Unsupported GDPR request type: ${type}`);
    }
  }

  private static async exportUserData(userId: string): Promise<GDPRResponse> {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        channels: {
          include: {
            editingRules: true,
            learningSessions: true
          }
        },
        auditLogs: true,
        apiKeys: true
      }
    });

    if (!userData) {
      throw new Error('User not found');
    }

    // 민감한 정보 제거
    const exportData = {
      ...userData,
      password: '[REDACTED]',
      apiKeys: userData.apiKeys.map(key => ({ ...key, key: '[REDACTED]' }))
    };

    return {
      success: true,
      data: exportData,
      message: 'User data exported successfully'
    };
  }

  private static async deleteUserData(userId: string): Promise<GDPRResponse> {
    // 소프트 삭제 구현
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.ovistra.com`,
        name: '[DELETED]',
        isActive: false
      }
    });

    // 관련 데이터 익명화
    await prisma.channel.updateMany({
      where: { userId },
      data: { deletedAt: new Date() }
    });

    return {
      success: true,
      message: 'User data deleted successfully'
    };
  }

  private static async rectifyUserData(userId: string, newData: any): Promise<GDPRResponse> {
    await prisma.user.update({
      where: { id: userId },
      data: newData
    });

    return {
      success: true,
      message: 'User data rectified successfully'
    };
  }

  private static async portUserData(userId: string): Promise<GDPRResponse> {
    const userData = await this.exportUserData(userId);
    
    // 표준 형식으로 변환 (JSON, CSV 등)
    const portableData = {
      format: 'JSON',
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: userData.data
    };

    return {
      success: true,
      data: portableData,
      message: 'User data prepared for portability'
    };
  }
}

// 인터페이스 정의
export interface SecurityEvent {
  type: string;
  description: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resourceId?: string;
  metadata?: any;
}

export interface SuspiciousActivityResult {
  riskScore: number;
  detectedThreats: string[];
  shouldBlock: boolean;
  shouldChallenge: boolean;
}

export interface SuspiciousPattern {
  type: string;
  isSuspicious: boolean;
  confidence: number;
  metadata: any;
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  failedChecks: string[];
  score: number;
}

export interface AccountLockStatus {
  isLocked: boolean;
  remainingTime: number;
  attempts: number;
}

export interface GDPRRequest {
  type: 'DATA_EXPORT' | 'DATA_DELETION' | 'DATA_RECTIFICATION' | 'DATA_PORTABILITY';
  userId: string;
  email: string;
  data?: any;
}

export interface GDPRResponse {
  success: boolean;
  data?: any;
  message: string;
}