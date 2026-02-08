/**
 * Variables that users can include in custom command responses.
 * These are replaced by Lumia Stream at runtime:
 * - {{message}} - The arguments passed with the command
 * - {{displayName}} - The display name of the user who triggered the command
 */
export const ALLOWED_VARIABLES: string[] = ["{{message}}", "{{displayName}}"];

/**
 * Valid actions for the !command management system.
 * - add: Create a new custom command
 * - edit: Modify an existing command (creator only)
 * - delete/remove: Delete a command (creator only)
 * - list: Show all custom commands
 * - help: Show usage information
 */
export const VALID_ACTIONS: string[] = ["add", "edit", "delete", "remove", "list", "help"];

/**
 * Command names that cannot be used for custom commands
 * to prevent conflicts with the management system.
 */
export const RESERVED_COMMANDS: string[] = [
  "command",
  "commands",
  "help",
  "add",
  "edit",
  "delete",
  "remove",
  "list",
];
