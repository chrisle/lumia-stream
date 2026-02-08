import { CommandData } from "../types";

/**
 * Checks if a user has permission to manage (edit/delete) a command.
 * Users can manage commands they created, if they are the broadcaster,
 * or if they are a mod and the allowModsToManage setting is enabled.
 *
 * @param userId - The user's ID
 * @param isMod - Whether the user is a moderator
 * @param isBroadcaster - Whether the user is the broadcaster
 * @param command - The command data to check ownership of
 * @param allowModsToManage - Whether mods can modify anyone's commands
 * @returns True if the user can manage the command
 *
 * @example
 * canManageCommand("12345", false, false, { creatorId: "12345", ... }, false)
 * // Returns: true (is owner)
 *
 * @example
 * canManageCommand("67890", false, true, { creatorId: "12345", ... }, false)
 * // Returns: true (is broadcaster)
 *
 * @example
 * canManageCommand("67890", true, false, { creatorId: "12345", ... }, true)
 * // Returns: true (mod with allowModsToManage enabled)
 *
 * @example
 * canManageCommand("67890", true, false, { creatorId: "12345", ... }, false)
 * // Returns: false (mod but allowModsToManage is disabled)
 */
export function canManageCommand(
  userId: string,
  isMod: boolean,
  isBroadcaster: boolean,
  command: CommandData,
  allowModsToManage: boolean = false
): boolean {
  const isOwner = command.creatorId === userId;
  const isModWithPermission = allowModsToManage && isMod;
  return isOwner || isBroadcaster || isModWithPermission;
}
