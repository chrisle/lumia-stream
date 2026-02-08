import { ExecuteParams, CommandStore } from "../types";
import { replaceVariables } from "../utils";

export interface ExecuteContext {
  commands: CommandStore;
  sendResponse: (message: string) => Promise<void>;
}

export async function handleExecuteCommand(
  params: ExecuteParams,
  ctx: ExecuteContext
): Promise<void> {
  const commandName = (params?.commandName || "").toLowerCase();
  const command = ctx.commands[commandName];

  if (!command) {
    return;
  }

  const response = replaceVariables(command.response, {
    displayName: params?.displayName || "",
    username: params?.username || "",
    channel: params?.channel || "",
    game: params?.game || "",
    title: params?.title || "",
  });

  await ctx.sendResponse(response);
}
