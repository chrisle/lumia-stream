import { ExecuteParams, CommandStore } from "../types";
import { DEBUG } from "../constants";

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
 * Replaces template variables in a response string.
 *
 * Uses single braces {displayname} and {message} to avoid Lumia Stream's
 * recursive variable expansion with double braces.
 *
 * @param response - The response template with {displayname} and {message} variables
 * @param displayName - The display name to substitute
 * @param message - The message/arguments to substitute
 * @returns The response with variables replaced
 */
function replaceVariables(response: string, displayName: string, message: string): string {
  return response
    .replace(/\{displayname\}/gi, displayName)
    .replace(/\{message\}/gi, message);
}

/**
 * Handles the execution of a custom command.
 * Looks up the command, replaces variables, and sends the response.
 *
 * @param params - The action parameters with command name, displayName, and arguments
 * @param ctx - The context with commands store and helper functions
 *
 * @example
 * // User "lexie" types: !greet @triodeofficial
 * // Command "greet" has response: "@{{displayname}} says hello to {{message}}"
 * await handleExecuteCommand(
 *   { command: "greet", displayName: "lexie", arguments: "@triodeofficial" },
 *   ctx
 * );
 * // Sends: "@lexie says hello to @triodeofficial"
 */
/**
 * Parses a chat message to extract the command name and arguments.
 * Handles messages like "!testing 1234" -> { command: "testing", args: "1234" }
 *
 * @param message - The full chat message (e.g., "!testing 1234")
 * @returns Object with command name and remaining arguments, or null if not a command
 */
function parseCommand(message: string): { command: string; args: string } | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith("!")) {
    return null;
  }

  // Remove the ! and split into parts
  const withoutPrefix = trimmed.slice(1);
  const spaceIndex = withoutPrefix.indexOf(" ");

  if (spaceIndex === -1) {
    // No arguments, just the command
    return { command: withoutPrefix.toLowerCase(), args: "" };
  }

  return {
    command: withoutPrefix.slice(0, spaceIndex).toLowerCase(),
    args: withoutPrefix.slice(spaceIndex + 1),
  };
}

export async function handleExecuteCommand(
  params: ExecuteParams,
  ctx: ExecuteContext
): Promise<void> {
  if (DEBUG) {
    ctx.log(`[execute] params: ${JSON.stringify(params)}`);
    ctx.log(`[execute] commands: ${JSON.stringify(Object.keys(ctx.commands))}`);
  }

  // Parse command from the arguments field (contains "!commandname args")
  const parsed = parseCommand(params?.arguments || "");
  if (!parsed) {
    if (DEBUG) ctx.log(`[execute] not a command message`);
    return;
  }

  if (DEBUG) ctx.log(`[execute] parsed command: "${parsed.command}", args: "${parsed.args}"`);

  const command = ctx.commands[parsed.command];

  if (command) {
    const displayName = params?.displayName || "";
    if (DEBUG) {
      ctx.log(`[execute] found command, response template: "${command.response}"`);
      ctx.log(`[execute] displayName: "${displayName}", args: "${parsed.args}"`);
    }
    const response = replaceVariables(command.response, displayName, parsed.args);
    if (DEBUG) ctx.log(`[execute] final response: "${response}"`);
    await ctx.sendResponse(response);
  } else {
    if (DEBUG) ctx.log(`[execute] command "${parsed.command}" not found`);
  }
}
