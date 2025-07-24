import { Response } from 'express';
import { prisma } from '../../config/database';
import { cache } from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { generateToken } from '../../utils/crypto';
import { PaginatedResponse, DeletionStep } from '../../types';
import { Channel, ChannelType } from '@prisma/client';

// Get all channels for the authenticated user
export async function getChannels(req: AuthRequest, res: Response) {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
  const userId = req.user!.id;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get channels with pagination
  const [channels, total] = await Promise.all([
    prisma.channel.findMany({
      where: { 
        userId,
        deletedAt: null
      },
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: order },
      include: {
        _count: {
          select: {
            editingRules: true,
            learningSessions: true
          }
        }
      }
    }),
    prisma.channel.count({
      where: { 
        userId,
        deletedAt: null
      }
    })
  ]);

  const response: PaginatedResponse<Channel> = {
    data: channels,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };

  res.json({
    success: true,
    ...response
  });
}

// Get a specific channel
export async function getChannel(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  const channel = await prisma.channel.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    },
    include: {
      editingRules: true,
      _count: {
        select: {
          learningSessions: true
        }
      }
    }
  });

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  res.json({
    success: true,
    data: channel
  });
}

// Create a new channel
export async function createChannel(req: AuthRequest, res: Response) {
  const { name, type, description, iconColor } = req.body;
  const userId = req.user!.id;

  // Check channel limit (e.g., max 10 channels per user)
  const channelCount = await prisma.channel.count({
    where: { userId, deletedAt: null }
  });

  if (channelCount >= 10) {
    throw new AppError('Maximum channel limit reached', 400);
  }

  // Create channel
  const channel = await prisma.channel.create({
    data: {
      name,
      type: type as ChannelType,
      description,
      iconColor,
      userId,
      settings: {}
    },
    include: {
      _count: {
        select: {
          editingRules: true,
          learningSessions: true
        }
      }
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CHANNEL_CREATED',
      entityType: 'CHANNEL',
      entityId: channel.id,
      metadata: { name, type },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  logger.info(`Channel created: ${channel.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: channel
  });
}

// Update a channel
export async function updateChannel(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, description, iconColor, settings } = req.body;
  const userId = req.user!.id;

  // Check if channel exists and belongs to user
  const existing = await prisma.channel.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    }
  });

  if (!existing) {
    throw new AppError('Channel not found', 404);
  }

  // Update channel
  const channel = await prisma.channel.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(iconColor && { iconColor }),
      ...(settings && { settings })
    },
    include: {
      _count: {
        select: {
          editingRules: true,
          learningSessions: true
        }
      }
    }
  });

  // Clear cache
  await cache.del(`channel:${id}`);

  // Log update
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CHANNEL_UPDATED',
      entityType: 'CHANNEL',
      entityId: channel.id,
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    success: true,
    data: channel
  });
}

// Step 1: Initiate channel deletion
export async function initiateChannelDeletion(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if channel exists and belongs to user
  const channel = await prisma.channel.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    },
    include: {
      _count: {
        select: {
          editingRules: true,
          learningSessions: true
        }
      }
    }
  });

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // Generate deletion token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.deletionToken.create({
    data: {
      token,
      entityType: 'CHANNEL',
      entityId: id,
      step: 1,
      maxSteps: 3,
      expiresAt
    }
  });

  // Log deletion initiation
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CHANNEL_DELETION_INITIATED',
      entityType: 'CHANNEL',
      entityId: id,
      metadata: { step: 1 },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  const response: DeletionStep = {
    step: 1,
    token,
    message: `This will delete channel "${channel.name}" and all associated data. This action cannot be undone.`,
    affectedCount: channel._count.editingRules + channel._count.learningSessions,
    expiresAt
  };

  res.json({
    success: true,
    data: response
  });
}

// Step 2: Confirm channel deletion
export async function confirmChannelDeletion(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { token } = req.body;
  const userId = req.user!.id;

  // Verify token
  const deletionToken = await prisma.deletionToken.findFirst({
    where: {
      token,
      entityType: 'CHANNEL',
      entityId: id,
      step: 1,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!deletionToken) {
    throw new AppError('Invalid or expired deletion token', 400);
  }

  // Verify channel ownership
  const channel = await prisma.channel.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    },
    include: {
      _count: {
        select: {
          editingRules: true,
          learningSessions: true
        }
      }
    }
  });

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // Mark token as used and create new token for step 2
  await prisma.deletionToken.update({
    where: { id: deletionToken.id },
    data: { usedAt: new Date() }
  });

  const newToken = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.deletionToken.create({
    data: {
      token: newToken,
      entityType: 'CHANNEL',
      entityId: id,
      step: 2,
      maxSteps: 3,
      expiresAt
    }
  });

  // Log confirmation
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CHANNEL_DELETION_CONFIRMED',
      entityType: 'CHANNEL',
      entityId: id,
      metadata: { step: 2 },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  const response: DeletionStep = {
    step: 2,
    token: newToken,
    message: `Please confirm again. This will permanently delete "${channel.name}" including ${channel._count.editingRules} rules and ${channel._count.learningSessions} learning sessions.`,
    affectedCount: channel._count.editingRules + channel._count.learningSessions,
    expiresAt
  };

  res.json({
    success: true,
    data: response
  });
}

// Step 3: Final channel deletion
export async function finalChannelDeletion(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { token } = req.body;
  const userId = req.user!.id;

  // Verify final token
  const deletionToken = await prisma.deletionToken.findFirst({
    where: {
      token,
      entityType: 'CHANNEL',
      entityId: id,
      step: 2,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!deletionToken) {
    throw new AppError('Invalid or expired deletion token', 400);
  }

  // Verify channel ownership one last time
  const channel = await prisma.channel.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    }
  });

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // Perform soft delete
  await prisma.channel.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  // Mark token as used
  await prisma.deletionToken.update({
    where: { id: deletionToken.id },
    data: { usedAt: new Date() }
  });

  // Clear cache
  await cache.del(`channel:${id}`);

  // Log deletion
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CHANNEL_DELETED',
      entityType: 'CHANNEL',
      entityId: id,
      metadata: { channelName: channel.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  logger.info(`Channel deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: `Channel "${channel.name}" has been permanently deleted.`
  });
}

// Get channel learning sessions
export async function getChannelLearningSessions(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.user!.id;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Verify channel ownership
  const channel = await prisma.channel.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    }
  });

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // Get learning sessions
  const where = {
    channelId: id,
    ...(status && { status: status as any })
  };

  const [sessions, total] = await Promise.all([
    prisma.learningSession.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { startedAt: 'desc' }
    }),
    prisma.learningSession.count({ where })
  ]);

  const response: PaginatedResponse<any> = {
    data: sessions,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };

  res.json({
    success: true,
    ...response
  });
}

// Get channel statistics
export async function getChannelStatistics(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  // Verify channel ownership
  const channel = await prisma.channel.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    }
  });

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // Get statistics
  const [
    totalSessions,
    completedSessions,
    totalRules,
    avgConfidence
  ] = await Promise.all([
    prisma.learningSession.count({
      where: { channelId: id }
    }),
    prisma.learningSession.count({
      where: { 
        channelId: id,
        status: 'COMPLETED'
      }
    }),
    prisma.editingRule.count({
      where: { channelId: id }
    }),
    prisma.editingRule.aggregate({
      where: { channelId: id },
      _avg: { confidence: true }
    })
  ]);

  const statistics = {
    channelId: id,
    totalLearningSessions: totalSessions,
    completedSessions,
    successRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    totalEditingRules: totalRules,
    averageConfidence: avgConfidence._avg.confidence || 0,
    lastTrainedAt: channel.lastTrainedAt,
    createdAt: channel.createdAt
  };

  res.json({
    success: true,
    data: statistics
  });
}