import { ManageParams, CommandStore } from "../types";
import { ALLOWED_VARIABLES, RESERVED_COMMANDS } from "../constants";
import {
  hasPermission,
  canManageCommand,
  parseManageMessage,
  validateVariables,
} from "../utils";

export interface ManageContext {
  commands: CommandStore;
  sendResponse: (message: string) => Promise<void>;
  saveCommands: () => Promise<void>;
}

export async function handleManageCommand(
  params: ManageParams,
  ctx: ManageContext
): Promise<void> {
  const displayName = params?.displayName || params?.username || "User";

  if (!hasPermission(params)) {
    await ctx.sendResponse(
      `@${displayName} Sorry, only VIPs, Tier 2/3 subs, and mods can manage commands.`
    );
    return;
  }

  const parsed = parseManageMessage(params?.message);

  if (!parsed) {
    await ctx.sendResponse(
      `@${displayName} Usage: !command <add|edit|delete|list> [name] [response]`
    );
    return;
  }

  const { action, commandName, response } = parsed;

  switch (action) {
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

  const invalidVars = validateVariables(response);
  if (invalidVars.length > 0) {
    await ctx.sendResponse(
      `@${displayName} Invalid variables: ${invalidVars.join(", ")}. Allowed: ${ALLOWED_VARIABLES.join(", ")}`
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

  const invalidVars = validateVariables(response);
  if (invalidVars.length > 0) {
    await ctx.sendResponse(
      `@${displayName} Invalid variables: ${invalidVars.join(", ")}. Allowed: ${ALLOWED_VARIABLES.join(", ")}`
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
