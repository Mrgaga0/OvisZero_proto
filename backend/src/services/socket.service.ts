import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  channels?: string[];
}

export function setupSocketHandlers(io: Server): void {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.userId = decoded.userId;

      // Join user's personal room
      socket.join(`user:${decoded.userId}`);

      // Get user's channels and join channel rooms
      const channels = await prisma.channel.findMany({
        where: { userId: decoded.userId },
        select: { id: true }
      });

      socket.channels = channels.map(c => c.id);
      channels.forEach(channel => {
        socket.join(`channel:${channel.id}`);
      });

      logger.info(`Socket authenticated for user: ${decoded.userId}`);
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.userId}`);

    // Handle channel subscription
    socket.on('subscribe:channel', async (channelId: string) => {
      try {
        // Verify user has access to channel
        const channel = await prisma.channel.findFirst({
          where: {
            id: channelId,
            userId: socket.userId
          }
        });

        if (channel) {
          socket.join(`channel:${channelId}`);
          socket.emit('subscribed:channel', { channelId });
          logger.info(`User ${socket.userId} subscribed to channel ${channelId}`);
        } else {
          socket.emit('error', { message: 'Channel access denied' });
        }
      } catch (error) {
        logger.error('Channel subscription error:', error);
        socket.emit('error', { message: 'Failed to subscribe to channel' });
      }
    });

    // Handle learning session updates request
    socket.on('subscribe:learning', async (sessionId: string) => {
      try {
        // Verify user has access to learning session
        const session = await prisma.learningSession.findFirst({
          where: {
            id: sessionId,
            userId: socket.userId
          }
        });

        if (session) {
          socket.join(`learning:${sessionId}`);
          socket.emit('subscribed:learning', { sessionId });
          logger.info(`User ${socket.userId} subscribed to learning session ${sessionId}`);
        } else {
          socket.emit('error', { message: 'Learning session access denied' });
        }
      } catch (error) {
        logger.error('Learning subscription error:', error);
        socket.emit('error', { message: 'Failed to subscribe to learning session' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });
}

// Emit events to specific rooms
export const socketEmitter = {
  // Emit to a specific user
  toUser(io: Server, userId: string, event: string, data: any): void {
    io.to(`user:${userId}`).emit(event, data);
  },

  // Emit to all users in a channel
  toChannel(io: Server, channelId: string, event: string, data: any): void {
    io.to(`channel:${channelId}`).emit(event, data);
  },

  // Emit to all users watching a learning session
  toLearningSession(io: Server, sessionId: string, event: string, data: any): void {
    io.to(`learning:${sessionId}`).emit(event, data);
  },

  // Emit learning progress
  learningProgress(io: Server, sessionId: string, progress: number, status: string): void {
    io.to(`learning:${sessionId}`).emit('learning:progress', {
      sessionId,
      progress,
      status,
      timestamp: new Date().toISOString()
    });
  },

  // Emit AI processing status
  aiProcessingStatus(io: Server, userId: string, jobId: string, status: string, progress?: number): void {
    io.to(`user:${userId}`).emit('ai:status', {
      jobId,
      status,
      progress,
      timestamp: new Date().toISOString()
    });
  }
};