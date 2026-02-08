import { Plugin } from "@lumiastream/plugin";
import { ActionsConfig, ManageParams, ExecuteParams, CommandStore } from "./types";
import { handleManageCommand } from "./handlers/manage";
import { handleExecuteCommand } from "./handlers/execute";

/**
 * User Commands Plugin for Lumia Stream.
 *
 * Allows privileged viewers to create, edit, and delete custom chat commands.
 *
 * @example
 * // Viewer creates a command:
 * // !command add greet Hello {{displayName}}!
 *
 * // Another viewer uses it:
 * // !greet
 * // Bot responds: "Hello lexie!"
 */
class UserCommandsPlugin extends Plugin {
  /** In-memory store of custom commands, persisted to Lumia variables */
  private commands: CommandStore = {};

  /**
   * Called when the plugin is loaded.
   * Loads persisted commands from Lumia Stream variables.
   */
  async onload(): Promise<void> {
    await this.loadCommands();
  }

  /**
   * Called when the plugin is unloaded.
   */
  async onunload(): Promise<void> {
    // Cleanup if needed
  }

  /**
   * Handles incoming actions from Lumia Stream.
   * Routes to appropriate handler based on action type.
   *
   * @param config - The actions configuration from Lumia Stream
   */
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

  /**
   * Loads commands from Lumia Stream variable storage.
   * Falls back to empty object on error.
   */
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

  /**
   * Persists current commands to Lumia Stream variable storage.
   */
  private async saveCommands(): Promise<void> {
    try {
      await this.lumia.setVariable("triode-user-commands", JSON.stringify(this.commands));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.lumia.addLog(`Failed to save commands: ${message}`);
    }
  }

  /**
   * Sends a chat message via Lumia Stream chatbot.
   * Also stores the response in the lastResponse variable.
   *
   * @param message - The message to send to chat
   */
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
