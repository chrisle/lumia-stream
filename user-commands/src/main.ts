import { Plugin } from "@lumiastream/plugin";
import { ActionsConfig, ManageParams, ExecuteParams, CommandStore } from "./types";
import { handleManageCommand } from "./handlers/manage";
import { handleExecuteCommand } from "./handlers/execute";

class UserCommandsPlugin extends Plugin {
  private commands: CommandStore = {};

  async onload(): Promise<void> {
    await this.loadCommands();
  }

  async onunload(): Promise<void> {
    // Cleanup if needed
  }

  async actions(config: ActionsConfig = {}): Promise<void> {
    const actions = Array.isArray(config.actions) ? config.actions : [];

    for (const action of actions) {
      if (action?.type === "manage_command") {
        await handleManageCommand(action.value as ManageParams, {
          commands: this.commands,
          sendResponse: this.sendResponse.bind(this),
          saveCommands: this.saveCommands.bind(this),
        });
      } else if (action?.type === "execute_command") {
        await handleExecuteCommand(action.value as ExecuteParams, {
          commands: this.commands,
          sendResponse: this.sendResponse.bind(this),
        });
      }
    }
  }

  private async loadCommands(): Promise<void> {
    try {
      const commandsJson = await this.lumia.getVariable("triode-user-commands");
      this.commands = commandsJson ? JSON.parse(commandsJson as string) : {};
    } catch (error) {
      this.commands = {};
      const message = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`Failed to load commands: ${message}`);
    }
  }

  private async saveCommands(): Promise<void> {
    try {
      await this.lumia.setVariable("triode-user-commands", JSON.stringify(this.commands));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`Failed to save commands: ${message}`);
    }
  }

  private async sendResponse(message: string): Promise<void> {
    try {
      await this.lumia.setVariable("lastResponse", message);
      await this.lumia.chatbot({ message });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`Failed to send chat: ${errMessage}`);
    }
  }
}

export = UserCommandsPlugin;
