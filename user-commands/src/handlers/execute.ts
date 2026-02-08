import { ExecuteParams, CommandStore } from "../types";

/**
 * Context object providing dependencies for command execution.
 */
export interface ExecuteContext {
  /** The current command store */
  commands: CommandStore;
  /** Function to send a chat response */
  sendResponse: (message: string) => Promise<void>;
  /** Function to log debug messages */
  log: (message: string) => void;
}

/**
 * Handles the execution of a custom command.
 * Looks up the command and sends its response template.
 * Lumia Stream handles variable replacement ({{message}}, {{displayname}}).
 *
 * @param params - The action parameters with command name and arguments
 * @param ctx - The context with commands store and helper functions
 *
 * @example
 * // User types: !greet @triodeofficial
 * // Command "greet" has response: "@{{displayname}} says hello to {{message}}"
 * await handleExecuteCommand(
 *   { command: "greet", arguments: "@triodeofficial" },
 *   ctx
 * );
 * // Sends: "@{{displayname}} says hello to {{message}}"
 * // Lumia replaces to: "@lexie says hello to @triodeofficial"
 */
export async function handleExecuteCommand(
  params: ExecuteParams,
  ctx: ExecuteContext
): Promise<void> {
  const commandName = (params?.command || "").toLowerCase();
  const command = ctx.commands[commandName];

  if (command) {
    await ctx.sendResponse(command.response);
  }
}
