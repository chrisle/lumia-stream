import { ManageParams, CommandStore } from "../types";
import { ALLOWED_VARIABLES, RESERVED_COMMANDS, DEBUG } from "../constants";
import { canManageCommand, parseManageMessage } from "../utils";

/**
 * Context object providing dependencies for command management.
 */
export interface ManageContext {
  /** The current command store */
  commands: CommandStore;
  /** Function to send a chat response */
  sendResponse: (message: string) => Promise<void>;
  /** Function to persist command changes */
  saveCommands: () => Promise<void>;
  /** Function to log debug messages */
  log: (message: string) => void;
  /** Whether mods can modify anyone's commands */
  allowModsToManage: boolean;
}

/**
 * Handles the !command management action.
 * Parses the arguments and routes to the appropriate handler (add/edit/delete/list/help).
 *
 * @param params - The action parameters with username and arguments
 * @param ctx - The context with commands store and helper functions
 *
 * @example
 * // !command add greet Hello {{displayName}}!
 * await handleManageCommand(
 *   { username: "lexie", arguments: "add greet Hello {{displayName}}!" },
 *   ctx
 * );
 */
export async function handleManageCommand(
  params: ManageParams,
  ctx: ManageContext
): Promise<void> {
  if (DEBUG) ctx.log(`[manage] params: ${JSON.stringify(params)}`);

  const userId = params?.userId || "";
  const displayName = params?.displayName || "User";
  const isMod = params?.isMod === "true";
  const isBroadcaster = params?.isBroadcaster === "true";

  if (DEBUG) ctx.log(`[manage] parsing arguments: "${params?.arguments}"`);
  const parsed = parseManageMessage(params?.arguments);
  if (DEBUG) ctx.log(`[manage] parsed: ${JSON.stringify(parsed)}`);

  if (!parsed) {
    await ctx.sendResponse(
      `@${displayName} Usage: !command <add|edit|delete|list> [name] [response]`
    );
    return;
  }

  const { action, commandName, response } = parsed;

  switch (action) {
    case "help":
      await handleHelp(displayName, ctx);
      break;
    case "list":
      await handleList(displayName, ctx);
      break;
    case "add":
      await handleAdd(userId, displayName, commandName, response, ctx);
      break;
    case "edit":
      await handleEdit(userId, isMod, isBroadcaster, displayName, commandName, response, ctx);
      break;
    case "delete":
      await handleDelete(userId, isMod, isBroadcaster, displayName, commandName, ctx);
      break;
  }
}

async function handleHelp(
  displayName: string,
  ctx: ManageContext
): Promise<void> {
  await ctx.sendResponse(
    `@${displayName} Usage: !command <add|edit|delete|list> [name] [response]. Variables: ${ALLOWED_VARIABLES.join(", ")}`
  );
}

async function handleList(
  displayName: string,
  ctx: ManageContext
): Promise<void> {
  const commandNames = Object.keys(ctx.commands);

  if (commandNames.length === 0) {
    await ctx.sendResponse(`@${displayName} No custom commands exist yet.`);
    return;
  }

  const list = commandNames.map((name) => `!${name}`).join(", ");
  await ctx.sendResponse(`@${displayName} Custom commands: ${list}`);
}

async function handleAdd(
  userId: string,
  displayName: string,
  commandName: string,
  response: string,
  ctx: ManageContext
): Promise<void> {
  if (RESERVED_COMMANDS.includes(commandName)) {
    await ctx.sendResponse(
      `@${displayName} The command name "${commandName}" is reserved.`
    );
    return;
  }

  if (ctx.commands[commandName]) {
    await ctx.sendResponse(
      `@${displayName} Command "!${commandName}" already exists. Use "!command edit ${commandName} <response>" to modify it.`
    );
    return;
  }

  const now = new Date().toISOString();
  ctx.commands[commandName] = {
    response,
    creatorId: userId,
    createdAt: now,
    updatedAt: now,
  };

  await ctx.saveCommands();
  await ctx.sendResponse(
    `@${displayName} Command "!${commandName}" has been created.`
  );
  ctx.log(`${displayName} created !${commandName}`);
}

async function handleEdit(
  userId: string,
  isMod: boolean,
  isBroadcaster: boolean,
  displayName: string,
  commandName: string,
  response: string,
  ctx: ManageContext
): Promise<void> {
  const command = ctx.commands[commandName];

  if (!command) {
    await ctx.sendResponse(
      `@${displayName} Command "!${commandName}" does not exist.`
    );
    return;
  }

  if (!canManageCommand(userId, isMod, isBroadcaster, command, ctx.allowModsToManage)) {
    await ctx.sendResponse(
      `@${displayName} You can only edit commands you created.`
    );
    return;
  }

  command.response = response;
  command.updatedAt = new Date().toISOString();

  await ctx.saveCommands();
  await ctx.sendResponse(
    `@${displayName} Command "!${commandName}" has been updated.`
  );
  ctx.log(`${displayName} edited !${commandName}`);
}

async function handleDelete(
  userId: string,
  isMod: boolean,
  isBroadcaster: boolean,
  displayName: string,
  commandName: string,
  ctx: ManageContext
): Promise<void> {
  const command = ctx.commands[commandName];

  if (!command) {
    await ctx.sendResponse(
      `@${displayName} Command "!${commandName}" does not exist.`
    );
    return;
  }

  if (!canManageCommand(userId, isMod, isBroadcaster, command, ctx.allowModsToManage)) {
    await ctx.sendResponse(
      `@${displayName} You can only delete commands you created.`
    );
    return;
  }

  delete ctx.commands[commandName];
  await ctx.saveCommands();
  await ctx.sendResponse(
    `@${displayName} Command "!${commandName}" has been deleted.`
  );
  ctx.log(`${displayName} deleted !${commandName}`);
}
