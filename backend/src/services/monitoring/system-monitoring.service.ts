import os from 'os';
import { logger } from '../../utils/logger';
import { cache } from '../../config/redis';
import { prisma } from '../../config/database';
import { Server } from 'socket.io';

// 7-1. 시스템 모니터링
export interface SystemMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  database: DatabaseMetrics;
  redis: RedisMetrics;
  activeConnections: number;
  timestamp: Date;
}

export interface CPUMetrics {
  usage: number; // 0-100
  loadAverage: number[];
  cores: number;
  processes: ProcessInfo[];
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  usage: number; // percentage
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
  usage: number; // percentage
  readRate: number; // MB/s
  writeRate: number; // MB/s
}

export interface NetworkMetrics {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  connectionsActive: number;
  connectionsIdle: number;
}

export interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  transactionCount: number;
}

export interface RedisMetrics {
  memoryUsage: number;
  connectedClients: number;
  hitRate: number;
  keyCount: number;
  avgResponseTime: number;
}

// 7-1-1. 애플리케이션 성능 모니터링 (APM)
export class SystemMonitoringService {
  private io?: Server;
  private metrics: SystemMetrics[] = [];
  private alerts: SystemAlert[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.startMonitoring();
  }

  setSocketIO(io: Server) {
    this.io = io;
  }

  // 모니터링 시작
  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        await this.processMetrics(metrics);
        await this.checkAlerts(metrics);
      } catch (error) {
        logger.error('System monitoring error:', error);
      }
    }, 10000); // 10초마다

    logger.info('System monitoring started');
  }

  // 모니터링 중지
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    logger.info('System monitoring stopped');
  }

  // 시스템 메트릭 수집
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const [cpu, memory, disk, network, database, redis] = await Promise.all([
      this.collectCPUMetrics(),
      this.collectMemoryMetrics(),
      this.collectDiskMetrics(),
      this.collectNetworkMetrics(),
      this.collectDatabaseMetrics(),
      this.collectRedisMetrics()
    ]);

    const metrics: SystemMetrics = {
      cpu,
      memory,
      disk,
      network,
      database,
      redis,
      activeConnections: this.getActiveConnections(),
      timestamp: new Date()
    };

    return metrics;
  }

  // CPU 메트릭 수집
  private async collectCPUMetrics(): Promise<CPUMetrics> {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // CPU 사용률 계산 (간단한 구현)
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const usage = 100 - Math.floor(100 * totalIdle / totalTick);

    return {
      usage,
      loadAverage: loadAvg,
      cores: cpus.length,
      processes: await this.getTopProcesses()
    };
  }

  // 메모리 메트릭 수집
  private collectMemoryMetrics(): MemoryMetrics {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    const memUsage = process.memoryUsage();

    return {
      total,
      used,
      free,
      usage,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };
  }

  // 디스크 메트릭 수집 (Mock 구현)
  private async collectDiskMetrics(): Promise<DiskMetrics> {
    // 실제로는 fs.statfs나 외부 라이브러리 사용
    return {
      total: 1024 * 1024 * 1024 * 500, // 500GB
      used: 1024 * 1024 * 1024 * 200,  // 200GB
      free: 1024 * 1024 * 1024 * 300,  // 300GB
      usage: 40, // 40%
      readRate: Math.random() * 100,   // Mock read rate
      writeRate: Math.random() * 50    // Mock write rate
    };
  }

  // 네트워크 메트릭 수집 (Mock 구현)
  private async collectNetworkMetrics(): Promise<NetworkMetrics> {
    // 실제로는 시스템 네트워크 인터페이스에서 수집
    return {
      bytesReceived: Math.floor(Math.random() * 1000000),
      bytesSent: Math.floor(Math.random() * 500000),
      packetsReceived: Math.floor(Math.random() * 10000),
      packetsSent: Math.floor(Math.random() * 5000),
      connectionsActive: Math.floor(Math.random() * 100),
      connectionsIdle: Math.floor(Math.random() * 50)
    };
  }

  // 데이터베이스 메트릭 수집
  private async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Prisma를 통한 데이터베이스 상태 확인
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const queryTime = Date.now() - start;

      // Mock 구현 - 실제로는 DB별 모니터링 쿼리 사용
      return {
        connectionCount: 10,
        activeQueries: Math.floor(Math.random() * 5),
        avgQueryTime: queryTime,
        slowQueries: 0,
        transactionCount: Math.floor(Math.random() * 100)
      };
    } catch (error) {
      logger.error('Database metrics collection error:', error);
      return {
        connectionCount: 0,
        activeQueries: 0,
        avgQueryTime: 0,
        slowQueries: 1,
        transactionCount: 0
      };
    }
  }

  // Redis 메트릭 수집
  private async collectRedisMetrics(): Promise<RedisMetrics> {
    try {
      const info = await cache.info();
      
      // Mock 구현 - 실제로는 Redis INFO 명령어 파싱
      return {
        memoryUsage: Math.floor(Math.random() * 100) * 1024 * 1024, // MB
        connectedClients: Math.floor(Math.random() * 50),
        hitRate: 0.85 + Math.random() * 0.1, // 85-95%
        keyCount: Math.floor(Math.random() * 10000),
        avgResponseTime: Math.random() * 5 // ms
      };
    } catch (error) {
      logger.error('Redis metrics collection error:', error);
      return {
        memoryUsage: 0,
        connectedClients: 0,
        hitRate: 0,
        keyCount: 0,
        avgResponseTime: 0
      };
    }
  }

  // 활성 연결 수 조회
  private getActiveConnections(): number {
    // Socket.IO 연결 수 (Mock)
    return this.io ? Object.keys(this.io.sockets.sockets).length : 0;
  }

  // 상위 프로세스 조회 (Mock)
  private async getTopProcesses(): Promise<ProcessInfo[]> {
    // 실제로는 ps 명령어나 시스템 API 사용
    return [
      { pid: process.pid, name: 'node', cpuUsage: 15.5, memoryUsage: 128 },
      { pid: 1234, name: 'postgres', cpuUsage: 8.2, memoryUsage: 256 },
      { pid: 5678, name: 'redis-server', cpuUsage: 3.1, memoryUsage: 64 }
    ];
  }

  // 메트릭 처리 및 저장
  private async processMetrics(metrics: SystemMetrics) {
    // 메모리에 최근 메트릭 저장 (최대 100개)
    this.metrics.push(metrics);
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Redis에 캐시
    await cache.set('system:metrics:latest', metrics, 300); // 5분

    // 중요한 메트릭은 데이터베이스에 저장
    if (this.shouldPersistMetrics(metrics)) {
      await this.persistMetrics(metrics);
    }

    // 실시간 업데이트
    if (this.io) {
      this.io.emit('system:metrics', {
        cpu: metrics.cpu.usage,
        memory: metrics.memory.usage,
        disk: metrics.disk.usage,
        timestamp: metrics.timestamp
      });
    }

    logger.debug('System metrics collected:', {
      cpu: `${metrics.cpu.usage}%`,
      memory: `${metrics.memory.usage.toFixed(1)}%`,
      disk: `${metrics.disk.usage}%`,
      activeConnections: metrics.activeConnections
    });
  }

  // 메트릭 영구 저장 여부 결정
  private shouldPersistMetrics(metrics: SystemMetrics): boolean {
    // 5분마다 또는 임계값 초과 시 저장
    const lastPersist = this.metrics.findLast(m => m.timestamp.getMinutes() % 5 === 0);
    const isInterval = metrics.timestamp.getMinutes() % 5 === 0;
    const isHighUsage = metrics.cpu.usage > 80 || metrics.memory.usage > 80;
    
    return isInterval || isHighUsage || !lastPersist;
  }

  // 메트릭 데이터베이스 저장
  private async persistMetrics(metrics: SystemMetrics) {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'SYSTEM_METRICS',
          entityType: 'SYSTEM',
          metadata: {
            cpu: metrics.cpu,
            memory: metrics.memory,
            disk: metrics.disk,
            network: metrics.network,
            database: metrics.database,
            redis: metrics.redis,
            activeConnections: metrics.activeConnections
          } as any
        }
      });
    } catch (error) {
      logger.error('Failed to persist metrics:', error);
    }
  }

  // 경고 확인
  private async checkAlerts(metrics: SystemMetrics) {
    const alerts: SystemAlert[] = [];

    // CPU 경고
    if (metrics.cpu.usage > 90) {
      alerts.push({
        type: 'CPU_HIGH',
        severity: 'CRITICAL',
        message: `CPU usage is ${metrics.cpu.usage}%`,
        value: metrics.cpu.usage,
        threshold: 90,
        timestamp: new Date()
      });
    } else if (metrics.cpu.usage > 75) {
      alerts.push({
        type: 'CPU_HIGH',
        severity: 'WARNING',
        message: `CPU usage is ${metrics.cpu.usage}%`,
        value: metrics.cpu.usage,
        threshold: 75,
        timestamp: new Date()
      });
    }

    // 메모리 경고
    if (metrics.memory.usage > 90) {
      alerts.push({
        type: 'MEMORY_HIGH',
        severity: 'CRITICAL',
        message: `Memory usage is ${metrics.memory.usage.toFixed(1)}%`,
        value: metrics.memory.usage,
        threshold: 90,
        timestamp: new Date()
      });
    }

    // 디스크 경고
    if (metrics.disk.usage > 85) {
      alerts.push({
        type: 'DISK_HIGH',
        severity: 'WARNING',
        message: `Disk usage is ${metrics.disk.usage}%`,
        value: metrics.disk.usage,
        threshold: 85,
        timestamp: new Date()
      });
    }

    // 데이터베이스 경고
    if (metrics.database.avgQueryTime > 1000) {
      alerts.push({
        type: 'DB_SLOW',
        severity: 'WARNING',
        message: `Average query time is ${metrics.database.avgQueryTime}ms`,
        value: metrics.database.avgQueryTime,
        threshold: 1000,
        timestamp: new Date()
      });
    }

    // 새로운 경고 처리
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  // 경고 처리
  private async processAlert(alert: SystemAlert) {
    // 중복 경고 방지 (최근 5분 내 동일 경고 확인)
    const recentAlerts = this.alerts.filter(a => 
      a.type === alert.type && 
      (Date.now() - a.timestamp.getTime()) < 300000 // 5분
    );

    if (recentAlerts.length > 0) {
      return; // 중복 경고 무시
    }

    this.alerts.push(alert);
    
    // 경고 로깅
    logger.warn(`System Alert [${alert.severity}]: ${alert.message}`, alert);

    // 데이터베이스에 경고 저장
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_ALERT',
        entityType: 'SYSTEM',
        metadata: alert as any
      }
    });

    // 실시간 알림
    if (this.io) {
      this.io.emit('system:alert', alert);
    }

    // 중요한 경고는 외부 알림 발송
    if (alert.severity === 'CRITICAL') {
      await this.sendExternalAlert(alert);
    }
  }

  // 외부 알림 발송
  private async sendExternalAlert(alert: SystemAlert) {
    // 실제로는 이메일, Slack, SMS 등으로 알림
    logger.error(`CRITICAL SYSTEM ALERT: ${alert.message}`, alert);
    
    // Webhook 호출 (Mock)
    try {
      // await fetch('https://hooks.slack.com/webhook', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     text: `🚨 ${alert.message}`,
      //     channel: '#alerts'
      //   })
      // });
    } catch (error) {
      logger.error('Failed to send external alert:', error);
    }
  }

  // 공개 메서드들
  async getLatestMetrics(): Promise<SystemMetrics | null> {
    return cache.get<SystemMetrics>('system:metrics:latest');
  }

  async getMetricsHistory(hours: number = 24): Promise<SystemMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const metrics = await this.getLatestMetrics();
    if (!metrics) {
      return { status: 'UNKNOWN', score: 0, issues: ['No metrics available'] };
    }

    let score = 100;
    const issues: string[] = [];

    // 점수 계산
    if (metrics.cpu.usage > 90) {
      score -= 30;
      issues.push('High CPU usage');
    } else if (metrics.cpu.usage > 75) {
      score -= 15;
      issues.push('Elevated CPU usage');
    }

    if (metrics.memory.usage > 90) {
      score -= 25;
      issues.push('High memory usage');
    } else if (metrics.memory.usage > 80) {
      score -= 10;
      issues.push('Elevated memory usage');
    }

    if (metrics.disk.usage > 90) {
      score -= 20;
      issues.push('High disk usage');
    }

    if (metrics.database.avgQueryTime > 1000) {
      score -= 15;
      issues.push('Slow database queries');
    }

    let status: SystemHealth['status'];
    if (score >= 90) status = 'HEALTHY';
    else if (score >= 70) status = 'WARNING';
    else if (score >= 50) status = 'DEGRADED';
    else status = 'CRITICAL';

    return { status, score, issues };
  }

  async getActiveAlerts(): Promise<SystemAlert[]> {
    // 최근 1시간 내 경고만 반환
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.alerts.filter(a => a.timestamp > oneHourAgo);
  }
}

// 인터페이스 정의
export interface SystemAlert {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  score: number; // 0-100
  issues: string[];
}

// 싱글톤 인스턴스
export const systemMonitoringService = new SystemMonitoringService();

// 프로세스 종료 시 모니터링 정리
process.on('SIGTERM', () => {
  systemMonitoringService.stopMonitoring();
});

process.on('SIGINT', () => {
  systemMonitoringService.stopMonitoring();
});