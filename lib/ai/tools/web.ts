import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';
import type { ToolContext } from './agent/types';

/**
 * Web tool using Exa API
 * Provides search and URL opening capabilities
 */
export const createWebTool = (context: ToolContext) => {
  const { dataStream, userLocation } = context;

  return tool({
    description: `Use the \`web\` tool to access up-to-date information from the web or when responding to the user requires information about their location. Some examples of when to use the \`web\` tool include:

- Local Information: Use the \`web\` tool to respond to questions that require information about the user's location, such as the weather, local businesses, or events.
- Freshness: If up-to-date information on a topic could potentially change or enhance the answer, call the web tool any time you would otherwise refuse to answer a question because your knowledge might be out of date.
- Niche Information: If the answer would benefit from detailed information not widely known or understood (which might be found on the internet), such as details about a small neighborhood, a less well-known company, or arcane regulations, use web sources directly rather than relying on the distilled knowledge from pretraining.
- Accuracy: If the cost of a small mistake or outdated information is high (e.g., using an outdated version of a software library or not knowing the date of the next game for a sports team), then use the \`web\` tool.

IMPORTANT: Do NOT use the web tool for basic questions or simple facts you already know like "Can I eat umbrella?". Only use this tool when you genuinely need up-to-date information that could change or enhance your response.

IMPORTANT: Do not attempt to use the old \`browser\` tool, \`web search\` tool, or generate responses from these deprecated tools anymore, as they are now deprecated or disabled.

The \`web\` tool has the following commands:

- \`search()\`: Issues a new query to a search engine and outputs the response.
- \`open_url(url: string)\`: Opens the given URL and displays it.`,
    parameters: z.object({
      command: z
        .enum(['search', 'open_url'])
        .describe(
          "The command to execute: 'search' to search the web, 'open_url' to open a specific URL",
        ),
      query: z
        .string()
        .nullable()
        .describe(
          'For search command: The search term to look up on the web. Be specific and include relevant keywords for better results. For technical queries, include version numbers or dates if relevant.',
        ),
      url: z
        .string()
        .nullable()
        .describe(
          'For open_url command: The URL to open and retrieve content from',
        ),
      explanation: z
        .string()
        .describe(
          'One sentence explanation as to why this command needs to be run and how it contributes to the goal.',
        ),
    }),
    execute: async ({
      command,
      query,
      url,
    }: {
      command: 'search' | 'open_url';
      query?: string | null;
      url?: string | null;
    }) => {
      try {
        if (!process.env.EXA_API_KEY) {
          throw new Error('EXA_API_KEY environment variable is not set');
        }

        const exa = new Exa(process.env.EXA_API_KEY);

        if (command === 'search') {
          if (!query) {
            return 'Error: Query is required for search command';
          }

          let result: any;

          try {
            const country = userLocation?.country;
            const searchOptions = {
              type: 'auto' as const,
              text: {
                maxCharacters: 2000,
              },
              ...(country && { userLocation: country }),
            };

            result = await exa.searchAndContents(query, searchOptions);
          } catch (_) {
            result = await exa.searchAndContents(query, {
              type: 'auto',
              text: {
                maxCharacters: 2000,
              },
            });
          }

          const citations = Array.isArray(result?.results)
            ? result.results
                .map((item: any) => item?.url)
                .filter((u: string | undefined) => Boolean(u))
            : [];
          if (citations.length > 0 && dataStream?.writeData) {
            dataStream.writeData({ citations });
          }

          return result.results;
        }

        if (command === 'open_url') {
          if (!url) {
            return 'Error: URL is required for open_url command';
          }

          const results = await exa.getContents([url], {
            text: { maxCharacters: 12000 },
          });

          if (dataStream?.writeData) {
            dataStream.writeData({ citations: [url] });
          }

          return results.results;
        }

        return 'Error: Invalid command';
      } catch (error) {
        console.error('Exa web tool error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        return `Error performing web operation: ${errorMessage}`;
      }
    },
  });
};

export default createWebTool;
