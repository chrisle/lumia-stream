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

  it("should send the command response when command exists", async () => {
    commands.greet = {
      response: "Hello {{displayName}}!",
      creatorId: "12345",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    await handleExecuteCommand({ command: "greet", arguments: "" }, ctx);

    expect(mockSendResponse).toHaveBeenCalledWith("Hello {{displayName}}!");
  });

  it("should send response with {{message}} variable intact", async () => {
    commands.greet = {
      response: "{{displayName}} says: {{message}}",
      creatorId: "12345",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    await handleExecuteCommand(
      { command: "greet", arguments: "@triodeofficial" },
      ctx
    );

    // Template is sent as-is; Lumia Stream handles variable replacement
    expect(mockSendResponse).toHaveBeenCalledWith(
      "{{displayName}} says: {{message}}"
    );
  });

  it("should not send response when command does not exist", async () => {
    await handleExecuteCommand({ command: "nonexistent", arguments: "" }, ctx);

    expect(mockSendResponse).not.toHaveBeenCalled();
  });

  it("should handle case-insensitive command lookup", async () => {
    commands.greet = {
      response: "Hello!",
      creatorId: "12345",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    await handleExecuteCommand({ command: "GREET", arguments: "" }, ctx);

    expect(mockSendResponse).toHaveBeenCalledWith("Hello!");
  });

  it("should handle empty command name", async () => {
    await handleExecuteCommand({ command: "", arguments: "" }, ctx);

    expect(mockSendResponse).not.toHaveBeenCalled();
  });

  it("should handle undefined command name", async () => {
    await handleExecuteCommand({ arguments: "" }, ctx);

    expect(mockSendResponse).not.toHaveBeenCalled();
  });

  it("should handle undefined params", async () => {
    await handleExecuteCommand({}, ctx);

    expect(mockSendResponse).not.toHaveBeenCalled();
  });
});
