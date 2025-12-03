import { google } from '@ai-sdk/google';
import chalk from 'chalk';

/**
 * Available Google Generative AI tools configuration
 * Note: Tools are instantiated lazily to avoid initialization errors
 */
export const availableTools = [
  {
    id: 'google_search',
    name: 'Google Search',
    description: 'Access the latest information using Google search. Useful for current events, news, and real-time information.',
    getTool: () => google.tools.googleSearch({}),
    enabled: false,
  },
  {
    id: 'code_execution',
    name: 'Code Execution',
    description: 'Generate and execute Python code to perform calculations, solve problems, or provide accurate information.',
    getTool: () => google.tools.codeExecution({}),
    enabled: false,
  },
  {
    id: 'url_context',
    name: 'URL Context',
    description: 'Provide specific URLs that you want the model to analyze directly from the prompt. Supports up to 20 URLs per request.',
    getTool: () => google.tools.urlContext({}),
    enabled: false,
  },
];

/**
 * Get enabled tools as a tools object for AI SDK
 */
export function getEnabledTools() {
  const tools = {};
  
  try {
    for (const toolConfig of availableTools) {
      if (toolConfig.enabled) {
        // Instantiate the tool when needed
        tools[toolConfig.id] = toolConfig.getTool();
      }
    }
    
    // Debug logging
    if (Object.keys(tools).length > 0) {
      console.log(chalk.gray(`[DEBUG] Enabled tools: ${Object.keys(tools).join(', ')}`));
    } else {
      console.log(chalk.yellow('[DEBUG] No tools enabled'));
    }
    
    return Object.keys(tools).length > 0 ? tools : undefined;
  } catch (error) {
    console.error(chalk.red('[ERROR] Failed to initialize tools:'), error.message);
    console.error(chalk.yellow('Make sure you have @ai-sdk/google version 2.0+ installed'));
    console.error(chalk.yellow('Run: npm install @ai-sdk/google@latest'));
    return undefined;
  }
}

/**
 * Toggle a tool's enabled state
 */
export function toggleTool(toolId) {
  const tool = availableTools.find(t => t.id === toolId);
  if (tool) {
    tool.enabled = !tool.enabled;
    console.log(chalk.gray(`[DEBUG] Tool ${toolId} toggled to ${tool.enabled}`));
    return tool.enabled;
  }
  console.log(chalk.red(`[DEBUG] Tool ${toolId} not found`));
  return false;
}

/**
 * Enable specific tools
 */
export function enableTools(toolIds) {
  console.log(chalk.gray('[DEBUG] enableTools called with:'), toolIds);
  
  availableTools.forEach(tool => {
    const wasEnabled = tool.enabled;
    tool.enabled = toolIds.includes(tool.id);
    
    if (tool.enabled !== wasEnabled) {
      console.log(chalk.gray(`[DEBUG] ${tool.id}: ${wasEnabled} → ${tool.enabled}`));
    }
  });
  
  const enabledCount = availableTools.filter(t => t.enabled).length;
  console.log(chalk.gray(`[DEBUG] Total tools enabled: ${enabledCount}/${availableTools.length}`));
}

/**
 * Get all enabled tool names
 */
export function getEnabledToolNames() {
  const names = availableTools.filter(t => t.enabled).map(t => t.name);
  console.log(chalk.gray('[DEBUG] getEnabledToolNames returning:'), names);
  return names;
}

/**
 * Reset all tools (disable all)
 */
export function resetTools() {
  availableTools.forEach(tool => {
    tool.enabled = false;
  });
  console.log(chalk.gray('[DEBUG] All tools have been reset (disabled)'));
}