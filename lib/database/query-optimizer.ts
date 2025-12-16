/**
 * Database Query Optimization Helpers
 * 
 * PERFORMANCE CRITICAL:
 * - Prevents N+1 queries
 * - Optimized includes and selects
 * - Consistent query patterns
 * - Reduced data transfer
 */

import { Prisma } from '@prisma/client';

/**
 * Optimized event select (basic info only)
 */
export const eventBasicSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  eventDate: true,
  location: true,
  accessCode: true,
  coverPhotoUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventSelect;

/**
 * Optimized event with counts
 */
export const eventWithCountsInclude = {
  _count: {
    select: {
      photos: { where: { deletedAt: null } },
      comments: true,
      guestSessions: true,
    },
  },
} satisfies Prisma.EventInclude;

/**
 * Optimized photo select (list view)
 */
export const photoListSelect = {
  id: true,
  filename: true,
  thumbnailSmallUrl: true,
  thumbnailMediumUrl: true,
  thumbnailLargeUrl: true,
  width: true,
  height: true,
  fileSize: true,
  likesCount: true,
  viewsCount: true,
  downloadCount: true,
  isFeatured: true,
  displayOrder: true,
  createdAt: true,
  caption: true,
} satisfies Prisma.PhotoSelect;

/**
 * Optimized photo select (detail view)
 */
export const photoDetailSelect = {
  id: true,
  filename: true,
  originalUrl: true,
  thumbnailSmallUrl: true,
  thumbnailMediumUrl: true,
  thumbnailLargeUrl: true,
  width: true,
  height: true,
  fileSize: true,
  mimeType: true,
  likesCount: true,
  viewsCount: true,
  downloadCount: true,
  isFeatured: true,
  displayOrder: true,
  caption: true,
  exifData: true,
  createdAt: true,
  updatedAt: true,
  eventId: true,
} satisfies Prisma.PhotoSelect;

/**
 * Optimized comment select
 */
export const commentSelect = {
  id: true,
  guestName: true,
  message: true,
  relationship: true,
  status: true,
  createdAt: true,
  photoId: true,
} satisfies Prisma.CommentSelect;

/**
 * Optimized comment with photo
 */
export const commentWithPhotoSelect = {
  id: true,
  guestName: true,
  message: true,
  relationship: true,
  status: true,
  createdAt: true,
  photo: {
    select: {
      id: true,
      filename: true,
      thumbnailSmallUrl: true,
    },
  },
} satisfies Prisma.CommentSelect;

/**
 * Event query helper: Get events with optimized queries
 */
export function buildEventQuery(options: {
  includePhotoCounts?: boolean;
  includeClient?: boolean;
  page?: number;
  limit?: number;
  where?: Prisma.EventWhereInput;
  orderBy?: Prisma.EventOrderByWithRelationInput;
}) {
  const {
    includePhotoCounts = true,
    includeClient = false,
    page = 1,
    limit = 20,
    where = {},
    orderBy = { createdAt: 'desc' },
  } = options;

  const query: Prisma.EventFindManyArgs = {
    where,
    orderBy,
    take: limit,
    skip: (page - 1) * limit,
    select: {
      ...eventBasicSelect,
      ...(includeClient && {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      }),
      ...(includePhotoCounts && eventWithCountsInclude),
    },
  };

  return query;
}

/**
 * Photo query helper: Get photos with optimized queries
 */
export function buildPhotoQuery(options: {
  eventId: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  orderBy?: Prisma.PhotoOrderByWithRelationInput;
}) {
  const {
    eventId,
    includeDeleted = false,
    page = 1,
    limit = 50,
    orderBy = { displayOrder: 'asc' },
  } = options;

  const where: Prisma.PhotoWhereInput = {
    eventId,
    ...(includeDeleted ? {} : { deletedAt: null }),
  };

  const query: Prisma.PhotoFindManyArgs = {
    where,
    orderBy,
    take: limit,
    skip: (page - 1) * limit,
    select: photoListSelect,
  };

  return query;
}

/**
 * Comment query helper: Get comments with optimized queries
 */
export function buildCommentQuery(options: {
  eventId?: string;
  photoId?: string;
  status?: string;
  page?: number;
  limit?: number;
  includePhoto?: boolean;
}) {
  const {
    eventId,
    photoId,
    status = 'approved',
    page = 1,
    limit = 50,
    includePhoto = false,
  } = options;

  const where: Prisma.CommentWhereInput = {
    ...(eventId && { eventId }),
    ...(photoId && { photoId }),
    status,
  };

  const query: Prisma.CommentFindManyArgs = {
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    select: includePhoto ? commentWithPhotoSelect : commentSelect,
  };

  return query;
}

/**
 * Pagination helper
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Search helper: Build full-text search query
 */
export function buildSearchWhere(
  search: string,
  fields: string[]
): Prisma.EventWhereInput | Prisma.PhotoWhereInput | Prisma.CommentWhereInput {
  if (!search || search.trim().length === 0) {
    return {};
  }

  const searchTerm = search.trim();
  const OR = fields.map((field) => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const,
    },
  }));

  return { OR };
}

/**
 * Date range helper
 */
export function buildDateRangeWhere(
  field: string,
  startDate?: Date,
  endDate?: Date
): any {
  if (!startDate && !endDate) {
    return {};
  }

  const where: any = {};
  
  if (startDate && endDate) {
    where[field] = {
      gte: startDate,
      lte: endDate,
    };
  } else if (startDate) {
    where[field] = { gte: startDate };
  } else if (endDate) {
    where[field] = { lte: endDate };
  }

  return where;
}

/**
 * Bulk operation helper: Get items in batches
 */
export async function processBatch<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
  }
}

/**
 * Transaction helper: Ensure atomic operations
 */
export function buildTransactionOptions(): Prisma.TransactionOptions {
  return {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  };
}

const queryOptimizer = {
  // Selects
  eventBasicSelect,
  photoListSelect,
  photoDetailSelect,
  commentSelect,
  commentWithPhotoSelect,
  
  // Query builders
  buildEventQuery,
  buildPhotoQuery,
  buildCommentQuery,
  buildPaginationInfo,
  buildSearchWhere,
  buildDateRangeWhere,
  
  // Helpers
  processBatch,
  buildTransactionOptions,
};
export default queryOptimizer;
