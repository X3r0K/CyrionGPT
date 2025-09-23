import type { Sandbox } from '@e2b/code-interpreter';
import type { AgentMode } from '@/types/llms';
import type { PluginID } from '@/types';
import { Geo } from '@vercel/functions/headers';

export interface SandboxManager {
  getSandbox: () => Promise<{ sandbox: Sandbox }>;
  setSandbox: (sandbox: Sandbox) => void;
}

/**
 * Interface for tools that need access to the data stream
 */
export interface ToolContext {
  dataStream: any;
  sandbox?: Sandbox | null;
  userID: string;
  setSandbox: (sandbox: Sandbox) => void;
  agentMode: AgentMode;
  sandboxManager?: SandboxManager;
  userLocation?: Geo & { timezone?: string };
  selectedPlugin?: PluginID;
}

// Constants for sandbox creation
export const SANDBOX_TEMPLATE = 'terminal-agent-sandbox';
export const BASH_SANDBOX_TIMEOUT = 15 * 60 * 1000;
