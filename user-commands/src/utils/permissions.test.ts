import { canManageCommand } from "./permissions";
import { CommandData } from "../types";

describe("canManageCommand", () => {
  const createCommand = (creatorId: string): CommandData => ({
    response: "test response",
    creatorId,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });

  describe("ownership checks", () => {
    it("should return true when userId matches creatorId", () => {
      const command = createCommand("12345");
      expect(canManageCommand("12345", false, false, command)).toBe(true);
    });

    it("should return false when userId does not match creatorId", () => {
      const command = createCommand("12345");
      expect(canManageCommand("67890", false, false, command)).toBe(false);
    });

    it("should return false when userId is empty", () => {
      const command = createCommand("12345");
      expect(canManageCommand("", false, false, command)).toBe(false);
    });
  });

  describe("broadcaster permissions", () => {
    it("should allow broadcaster to manage any command", () => {
      const command = createCommand("12345");
      expect(canManageCommand("67890", false, true, command, false)).toBe(true);
    });

    it("should allow broadcaster even when allowModsToManage is false", () => {
      const command = createCommand("12345");
      expect(canManageCommand("67890", false, true, command, false)).toBe(true);
    });
  });

  describe("mod permissions", () => {
    it("should allow mod to manage when allowModsToManage is true", () => {
      const command = createCommand("12345");
      expect(canManageCommand("67890", true, false, command, true)).toBe(true);
    });

    it("should not allow mod to manage when allowModsToManage is false", () => {
      const command = createCommand("12345");
      expect(canManageCommand("67890", true, false, command, false)).toBe(false);
    });

    it("should not allow non-mod when allowModsToManage is true", () => {
      const command = createCommand("12345");
      expect(canManageCommand("67890", false, false, command, true)).toBe(false);
    });

    it("should allow owner even when not a mod", () => {
      const command = createCommand("12345");
      expect(canManageCommand("12345", false, false, command, true)).toBe(true);
    });

    it("should allow owner when allowModsToManage is false", () => {
      const command = createCommand("12345");
      expect(canManageCommand("12345", false, false, command, false)).toBe(true);
    });

    it("should allow owner when also a mod", () => {
      const command = createCommand("12345");
      expect(canManageCommand("12345", true, false, command, true)).toBe(true);
    });
  });
});
