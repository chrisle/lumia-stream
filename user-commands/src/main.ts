import { Plugin } from "@lumiastream/plugin";
import { ActionsConfig, ManageParams, ExecuteParams, CommandStore } from "./types";
import { handleManageCommand } from "./handlers/manage";
import { handleExecuteCommand } from "./handlers/execute";
import { DEBUG } from "./constants";

const COMMANDS_FILE = "commands.json";

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

  /** Whether mods can modify anyone's commands */
  private allowModsToManage: boolean = false;

  /**
   * Called when the plugin is loaded.
   * Loads persisted commands and settings from Lumia Stream.
   */
  async onload(): Promise<void> {
    await this.loadSettings();
    await this.loadCommands();
    const commandCount = Object.keys(this.commands).length;
    this.log(`Loaded ${commandCount} command${commandCount !== 1 ? "s" : ""}`);
  }

  /**
   * Called when the plugin is unloaded.
   */
  async onunload(): Promise<void> {
    // Nothing to clean up
  }

  /**
   * Handles incoming actions from Lumia Stream.
   * Routes to appropriate handler based on action type.
   *
   * @param config - The actions configuration from Lumia Stream
   */
  async actions(config: ActionsConfig = {}): Promise<void> {
    const actions = Array.isArray(config.actions) ? config.actions : [];
    if (DEBUG) this.log(`[actions] received ${actions.length} action(s)`);

    for (const action of actions) {
      if (DEBUG) this.log(`[actions] processing type: "${action?.type}"`);
      if (action?.type === "manage_command") {
        await handleManageCommand(action.value as ManageParams, {
          commands: this.commands,
          sendResponse: this.sendResponse.bind(this),
          saveCommands: this.saveCommands.bind(this),
          log: this.log.bind(this),
          allowModsToManage: this.allowModsToManage,
        });
      } else if (action?.type === "execute_command") {
        await handleExecuteCommand(action.value as ExecuteParams, {
          commands: this.commands,
          sendResponse: this.sendResponse.bind(this),
          log: this.log.bind(this),
        });
      }
    }
  }

  /**
   * Loads plugin settings from Lumia Stream.
   */
  private async loadSettings(): Promise<void> {
    try {
      const settings = await this.lumia.getSettings();
      this.allowModsToManage = settings?.allowModsToManage === true;
    } catch {
      this.allowModsToManage = false;
    }
  }

  /**
   * Loads commands from Lumia Stream variable storage or file.
   * Tries variable first, then falls back to file, then empty object.
   */
  private async loadCommands(): Promise<void> {
    // Try loading from variable first
    try {
      const commandsJson = await this.lumia.getVariable("triode-user-commands");
      if (commandsJson) {
        this.commands = JSON.parse(commandsJson as string);
        return;
      }
    } catch {
      // Variable load failed, try file
    }

    // Fall back to file
    try {
      const fileContent = await this.lumia.readFile(COMMANDS_FILE);
      if (typeof fileContent === "string" && fileContent) {
        this.commands = JSON.parse(fileContent);
        return;
      }
    } catch {
      // File load failed
    }

    this.commands = {};
  }

  /**
   * Persists current commands to Lumia Stream variable storage and file.
   */
  private async saveCommands(): Promise<void> {
    const commandsJson = JSON.stringify(this.commands, null, 2);

    // Save to both variable and file
    const results = await Promise.allSettled([
      this.lumia.setVariable("triode-user-commands", commandsJson),
      this.lumia.writeFile({ path: COMMANDS_FILE, message: commandsJson }),
    ]);

    // Log any save errors
    for (const result of results) {
      if (result.status === "rejected") {
        this.log(`Error saving: ${result.reason}`);
      }
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
      const msg = error instanceof Error ? error.message : String(error);
      this.log(`Error sending chat: ${msg}`);
    }
  }

  /**
   * Logs a message to Lumia Stream's log panel.
   *
   * @param message - The message to log
   */
  private log(message: string): void {
    this.lumia.addLog(message);
  }
}

export = UserCommandsPlugin;
