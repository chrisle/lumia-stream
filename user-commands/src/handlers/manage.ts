import { ManageParams, CommandStore } from "../types";
import { ALLOWED_VARIABLES, RESERVED_COMMANDS } from "../constants";
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
  const displayName = params?.username || "User";

  const parsed = parseManageMessage(params?.arguments);

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
      await handleAdd(params, displayName, commandName, response, ctx);
      break;
    case "edit":
      await handleEdit(params, displayName, commandName, response, ctx);
      break;
    case "delete":
      await handleDelete(params, displayName, commandName, ctx);
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
  params: ManageParams,
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
    creator: (params?.username || "").toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };

  await ctx.saveCommands();
  await ctx.sendResponse(
    `@${displayName} Command "!${commandName}" has been created.`
  );
}

async function handleEdit(
  params: ManageParams,
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

  if (!canManageCommand(params, command)) {
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
}

async function handleDelete(
  params: ManageParams,
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

  if (!canManageCommand(params, command)) {
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
}
