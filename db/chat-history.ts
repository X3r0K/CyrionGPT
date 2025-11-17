import type { Doc } from '@/convex/_generated/dataModel';
import { makeAuthenticatedRequest } from '@/lib/api/convex';

export type MessageWithExtras = {
  _id: string;
  _creationTime: number;
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  plugin?: string;
  role: string;
  sequence_number: number;
  thinking_content?: string;
  updated_at?: number;
  created_at: number;
};

export type ChatWithMessages = Doc<'chats'> & {
  messages: MessageWithExtras[];
};

export const getFullChatHistory = async (
  userId: string,
  batchSize = 3,
): Promise<ChatWithMessages[]> => {
  const data = await makeAuthenticatedRequest('/api/chat-history', 'POST', {
    userId,
    batchSize,
  });

  return (data?.chats ?? []) as ChatWithMessages[];
};
