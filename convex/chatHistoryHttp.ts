import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  createErrorResponse,
  createResponse,
  validateAuthWithUser,
  validateUserId,
} from './httpUtils';

export const handleChatHistoryHttp = httpAction(async (ctx, request) => {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  const authResult = await validateAuthWithUser(request);
  if (!authResult.success || !authResult.user) {
    return createErrorResponse(
      authResult.error || 'Authentication failed',
      401,
    );
  }

  try {
    const body = await request.json();
    const { userId, batchSize } = body;

    if (!userId) {
      return createErrorResponse('Missing user_id parameter', 400);
    }

    validateUserId(userId, authResult.user.id);

    const chats: any[] = [];
    let cursor: string | null = null;
    let isDone = false;
    const numItems =
      typeof batchSize === 'number' && batchSize > 0 ? batchSize : 3;

    while (!isDone) {
      const result: {
        chats: any[];
        isDone: boolean;
        continueCursor: string | null;
      } = await ctx.runQuery(internal.chats.getChatHistoryChunk, {
        userId,
        paginationOpts: {
          numItems,
          cursor,
        },
      });

      chats.push(...result.chats);
      isDone = result.isDone;
      cursor = result.continueCursor;
    }

    return createResponse({ chats }, 200);
  } catch (error) {
    console.error('[CHAT_HISTORY] Error exporting chat history:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createErrorResponse('Internal server error', 500);
  }
});
