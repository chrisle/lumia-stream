import { ManageParams, CommandData } from "../types";

/**
 * Checks if a user has permission to manage (edit/delete) a command.
 * Users can only manage commands they created.
 *
 * @param params - The manage action parameters containing the username
 * @param command - The command data to check ownership of
 * @returns True if the user is the creator of the command
 *
 * @example
 * canManageCommand({ username: "lexie" }, { creator: "lexie", ... })
 * // Returns: true
 *
 * @example
 * canManageCommand({ username: "other" }, { creator: "lexie", ... })
 * // Returns: false
 */
export function canManageCommand(
  params: ManageParams,
  command: CommandData
): boolean {
  return command.creator === params?.username?.toLowerCase();
}
