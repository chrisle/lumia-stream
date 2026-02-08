/**
 * Stored data for a custom command.
 */
export interface CommandData {
  /** The response template with {message} and {displayname} variables */
  response: string;
  /** Unique user ID of the command creator */
  creatorId: string;
  /** ISO timestamp when the command was created */
  createdAt: string;
  /** ISO timestamp when the command was last updated */
  updatedAt: string;
}

/**
 * Parameters passed to the manage_command action.
 * Used for !command add/edit/delete/list operations.
 */
export interface ManageParams {
  /** The unique user ID of the person running the command */
  userId?: string;
  /** The display name of the person running the command */
  displayName?: string;
  /** Whether the user is a moderator */
  isMod?: string;
  /** Whether the user is the broadcaster */
  isBroadcaster?: string;
  /** The arguments after "!command" (e.g., "add greet Hello {{displayname}}!") */
  arguments?: string;
}

/**
 * Parameters passed to the execute_command action.
 * Used when a viewer triggers a custom command like !greet.
 */
export interface ExecuteParams {
  /** The command name without the ! prefix (e.g., "greet") */
  command?: string;
  /** The display name of the user who triggered the command */
  displayName?: string;
  /** The arguments passed with the command (e.g., "@someone") */
  arguments?: string;
}

/**
 * A single action configuration from Lumia Stream.
 */
export interface ActionConfig {
  /** The action type (e.g., "manage_command" or "execute_command") */
  type: string;
  /** The action parameters */
  value: ManageParams | ExecuteParams;
}

/**
 * Configuration passed to the plugin's actions() method.
 */
export interface ActionsConfig {
  /** Array of actions to execute */
  actions?: ActionConfig[];
}

/**
 * Result of parsing a !command message.
 */
export interface ParsedMessage {
  /** The action to perform (add, edit, delete, list, help) */
  action: string;
  /** The name of the command being managed */
  commandName: string;
  /** The response template (normalized, with invalid variables stripped) */
  response: string;
}

/**
 * Map of command names to their stored data.
 */
export type CommandStore = Record<string, CommandData>;
