import { handleManageCommand, ManageContext } from "./manage";
import { CommandStore } from "../types";

describe("handleManageCommand", () => {
  let mockSendResponse: jest.Mock;
  let mockSaveCommands: jest.Mock;
  let commands: CommandStore;
  let ctx: ManageContext;

  beforeEach(() => {
    mockSendResponse = jest.fn().mockResolvedValue(undefined);
    mockSaveCommands = jest.fn().mockResolvedValue(undefined);
    commands = {};
    ctx = {
      commands,
      sendResponse: mockSendResponse,
      saveCommands: mockSaveCommands,
    };
  });

  describe("help action", () => {
    it("should show usage information", async () => {
      await handleManageCommand({ username: "lexie", arguments: "help" }, ctx);

      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("Usage:")
      );
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("{{message}}")
      );
    });
  });

  describe("list action", () => {
    it("should show message when no commands exist", async () => {
      await handleManageCommand({ username: "lexie", arguments: "list" }, ctx);

      expect(mockSendResponse).toHaveBeenCalledWith(
        "@lexie No custom commands exist yet."
      );
    });

    it("should list all commands", async () => {
      commands.greet = {
        response: "Hello!",
        creator: "lexie",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      commands.bye = {
        response: "Goodbye!",
        creator: "lexie",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleManageCommand({ username: "lexie", arguments: "list" }, ctx);

      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("!greet")
      );
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("!bye")
      );
    });
  });

  describe("add action", () => {
    it("should create a new command", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "add greet Hello {{displayName}}!" },
        ctx
      );

      expect(commands.greet).toBeDefined();
      expect(commands.greet.response).toBe("Hello {{displayName}}!");
      expect(commands.greet.creator).toBe("lexie");
      expect(mockSaveCommands).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        '@lexie Command "!greet" has been created.'
      );
    });

    it("should reject reserved command names", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "add command Hello!" },
        ctx
      );

      expect(commands.command).toBeUndefined();
      expect(mockSaveCommands).not.toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("reserved")
      );
    });

    it("should reject duplicate command names", async () => {
      commands.greet = {
        response: "Hello!",
        creator: "lexie",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleManageCommand(
        { username: "other", arguments: "add greet Hi!" },
        ctx
      );

      expect(commands.greet.response).toBe("Hello!"); // Unchanged
      expect(mockSaveCommands).not.toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("already exists")
      );
    });

    it("should normalize and strip invalid variables", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "add greet {{USERNAME}} {{DISPLAYNAME}}" },
        ctx
      );

      // {{USERNAME}} should be stripped, {{DISPLAYNAME}} normalized
      expect(commands.greet.response).toBe(" {{displayName}}");
    });
  });

  describe("edit action", () => {
    beforeEach(() => {
      commands.greet = {
        response: "Hello!",
        creator: "lexie",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
    });

    it("should update an existing command", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "edit greet Goodbye!" },
        ctx
      );

      expect(commands.greet.response).toBe("Goodbye!");
      expect(mockSaveCommands).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        '@lexie Command "!greet" has been updated.'
      );
    });

    it("should reject editing non-existent command", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "edit nonexistent Hi!" },
        ctx
      );

      expect(mockSaveCommands).not.toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("does not exist")
      );
    });

    it("should reject editing command by non-creator", async () => {
      await handleManageCommand(
        { username: "other", arguments: "edit greet Hi!" },
        ctx
      );

      expect(commands.greet.response).toBe("Hello!"); // Unchanged
      expect(mockSaveCommands).not.toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("only edit commands you created")
      );
    });
  });

  describe("delete action", () => {
    beforeEach(() => {
      commands.greet = {
        response: "Hello!",
        creator: "lexie",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
    });

    it("should delete an existing command", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "delete greet" },
        ctx
      );

      expect(commands.greet).toBeUndefined();
      expect(mockSaveCommands).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        '@lexie Command "!greet" has been deleted.'
      );
    });

    it("should accept 'remove' as alias for delete", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "remove greet" },
        ctx
      );

      expect(commands.greet).toBeUndefined();
      expect(mockSaveCommands).toHaveBeenCalled();
    });

    it("should reject deleting non-existent command", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "delete nonexistent" },
        ctx
      );

      expect(mockSaveCommands).not.toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("does not exist")
      );
    });

    it("should reject deleting command by non-creator", async () => {
      await handleManageCommand(
        { username: "other", arguments: "delete greet" },
        ctx
      );

      expect(commands.greet).toBeDefined();
      expect(mockSaveCommands).not.toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("only delete commands you created")
      );
    });
  });

  describe("invalid input", () => {
    it("should show usage for empty arguments", async () => {
      await handleManageCommand({ username: "lexie", arguments: "" }, ctx);

      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("Usage:")
      );
    });

    it("should show usage for undefined arguments", async () => {
      await handleManageCommand({ username: "lexie" }, ctx);

      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("Usage:")
      );
    });

    it("should show usage for invalid action", async () => {
      await handleManageCommand(
        { username: "lexie", arguments: "invalid greet" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("Usage:")
      );
    });

    it("should use 'User' as default displayName", async () => {
      await handleManageCommand({ arguments: "list" }, ctx);

      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.stringContaining("@User")
      );
    });
  });
});
