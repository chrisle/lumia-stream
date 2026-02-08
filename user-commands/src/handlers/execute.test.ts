import { handleExecuteCommand, ExecuteContext } from "./execute";
import { CommandStore } from "../types";

describe("handleExecuteCommand", () => {
  let mockSendResponse: jest.Mock;
  let mockLog: jest.Mock;
  let commands: CommandStore;
  let ctx: ExecuteContext;

  beforeEach(() => {
    mockSendResponse = jest.fn().mockResolvedValue(undefined);
    mockLog = jest.fn();
    commands = {};
    ctx = {
      commands,
      sendResponse: mockSendResponse,
      log: mockLog,
    };
  });

  describe("command parsing from arguments", () => {
    it("should parse command from !command format in arguments", async () => {
      commands.greet = {
        response: "Hello!",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!greet" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("Hello!");
    });

    it("should extract arguments after command name", async () => {
      commands.greet = {
        response: "Hello {message}!",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!greet world" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("Hello world!");
    });

    it("should handle multiple words in arguments", async () => {
      commands.say = {
        response: "{displayname} says: {message}",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!say hello there friend" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("lexie says: hello there friend");
    });
  });

  describe("variable replacement", () => {
    it("should replace {displayname} with the display name", async () => {
      commands.greet = {
        response: "Hello {displayname}!",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "TRIODEOfficial", arguments: "!greet" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("Hello TRIODEOfficial!");
    });

    it("should replace {message} with the arguments", async () => {
      commands.hug = {
        response: "@{displayname} hugs {message}!",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!hug @TRIODEOfficial" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("@lexie hugs @TRIODEOfficial!");
    });

    it("should handle case-insensitive variable replacement", async () => {
      commands.greet = {
        response: "Hello {DISPLAYNAME}, you said {MESSAGE}!",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!greet hi" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("Hello lexie, you said hi!");
    });

    it("should handle empty arguments for {message}", async () => {
      commands.greet = {
        response: "Hello {displayname}! Message: {message}",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!greet" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("Hello lexie! Message: ");
    });
  });

  describe("command not found", () => {
    it("should not send response when command does not exist", async () => {
      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!nonexistent" },
        ctx
      );

      expect(mockSendResponse).not.toHaveBeenCalled();
    });

    it("should handle case-insensitive command lookup", async () => {
      commands.greet = {
        response: "Hello!",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "!GREET" },
        ctx
      );

      expect(mockSendResponse).toHaveBeenCalledWith("Hello!");
    });
  });

  describe("invalid input", () => {
    it("should not respond to messages without ! prefix", async () => {
      commands.greet = {
        response: "Hello!",
        creatorId: "12345",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "greet" },
        ctx
      );

      expect(mockSendResponse).not.toHaveBeenCalled();
    });

    it("should handle empty arguments", async () => {
      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie", arguments: "" },
        ctx
      );

      expect(mockSendResponse).not.toHaveBeenCalled();
    });

    it("should handle undefined arguments", async () => {
      await handleExecuteCommand(
        { command: "User Commands", displayName: "lexie" },
        ctx
      );

      expect(mockSendResponse).not.toHaveBeenCalled();
    });
  });
});
