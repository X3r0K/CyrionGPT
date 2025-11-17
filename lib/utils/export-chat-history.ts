import type { ChatWithMessages } from '@/db/chat-history';
import { getFullChatHistory } from '@/db/chat-history';

export interface ExportedChat {
  id: string;
  name: string;
  created_at: number;
  updated_at?: number;
  messages: ExportedMessage[];
}

export interface ExportedMessage {
  id: string;
  role: string;
  content: string;
  sequence_number: number;
  created_at: number;
  updated_at?: number;
  thinking_content?: string;
  plugin?: string;
}

export interface ExportedChatHistory {
  export_date: string;
  total_chats: number;
  chats: ExportedChat[];
}

const transformChatHistory = (
  chatHistory: ChatWithMessages[],
): ExportedChat[] =>
  chatHistory
    .map((chat) => ({
      id: chat.id,
      name: chat.name,
      created_at: chat._creationTime,
      updated_at: chat.updated_at,
      messages: chat.messages
        .map<ExportedMessage>((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          sequence_number: message.sequence_number,
          created_at: message.created_at ?? message._creationTime ?? 0,
          updated_at: message.updated_at,
          thinking_content: message.thinking_content,
          plugin: message.plugin,
        }))
        .sort((a, b) => a.sequence_number - b.sequence_number),
    }))
    .sort(
      (a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at),
    );

/**
 * Converts chat history to CSV format
 */
const convertToCSV = (chats: ExportedChat[]): string => {
  const headers = [
    'Chat ID',
    'Chat Name',
    'Chat Created',
    'Chat Updated',
    'Message ID',
    'Role',
    'Sequence',
    'Content',
    'Created',
    'Updated',
    'Thinking Content',
    'Plugin',
  ];

  const rows: string[] = [headers.join(',')];

  for (const chat of chats) {
    const chatCreated = new Date(chat.created_at).toISOString();
    const chatUpdated = chat.updated_at
      ? new Date(chat.updated_at).toISOString()
      : '';

    for (const message of chat.messages) {
      const messageCreated = new Date(message.created_at).toISOString();
      const messageUpdated = message.updated_at
        ? new Date(message.updated_at).toISOString()
        : '';

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value: string | undefined | null): string => {
        if (value === undefined || value === null) return '';
        const str = String(value);
        // If contains comma, quote, or newline, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const row = [
        escapeCSV(chat.id),
        escapeCSV(chat.name),
        escapeCSV(chatCreated),
        escapeCSV(chatUpdated),
        escapeCSV(message.id),
        escapeCSV(message.role),
        message.sequence_number.toString(),
        escapeCSV(message.content),
        escapeCSV(messageCreated),
        escapeCSV(messageUpdated),
        escapeCSV(message.thinking_content),
        escapeCSV(message.plugin),
      ];

      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
};

/**
 * Exports all chat history for a user as JSON or CSV file
 */
export const exportChatHistory = async (
  userId: string,
  format: 'json' | 'csv' = 'json',
): Promise<void> => {
  try {
    const chatHistory = await getFullChatHistory(userId);
    const chats = transformChatHistory(chatHistory);

    let blob: Blob;
    let filename: string;

    if (format === 'json') {
      // Export as JSON
      const exportData: ExportedChatHistory = {
        export_date: new Date().toISOString(),
        total_chats: chats.length,
        chats,
      };
      blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      filename = `pentestgpt-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // Export as CSV
      const csv = convertToCSV(chats);
      blob = new Blob([csv], { type: 'text/csv' });
      filename = `pentestgpt-chat-history-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting chat history:', error);
    throw error;
  }
};
