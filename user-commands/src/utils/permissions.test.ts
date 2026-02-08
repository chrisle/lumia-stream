import { canManageCommand } from "./permissions";
import { CommandData, ManageParams } from "../types";

describe("canManageCommand", () => {
  const createCommand = (creator: string): CommandData => ({
    response: "test response",
    creator,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });

  it("should return true when username matches creator", () => {
    const params: ManageParams = { username: "lexie" };
    const command = createCommand("lexie");
    expect(canManageCommand(params, command)).toBe(true);
  });

  it("should return false when username does not match creator", () => {
    const params: ManageParams = { username: "other" };
    const command = createCommand("lexie");
    expect(canManageCommand(params, command)).toBe(false);
  });

  it("should be case-insensitive for username comparison", () => {
    const params: ManageParams = { username: "LEXIE" };
    const command = createCommand("lexie");
    expect(canManageCommand(params, command)).toBe(true);
  });

  it("should handle uppercase creator", () => {
    const params: ManageParams = { username: "lexie" };
    const command = createCommand("LEXIE");
    // Creator is stored lowercase, so this should fail
    expect(canManageCommand(params, command)).toBe(false);
  });

  it("should return false when username is undefined", () => {
    const params: ManageParams = {};
    const command = createCommand("lexie");
    expect(canManageCommand(params, command)).toBe(false);
  });

  it("should return false when params is empty object", () => {
    const params: ManageParams = {};
    const command = createCommand("lexie");
    expect(canManageCommand(params, command)).toBe(false);
  });
});
