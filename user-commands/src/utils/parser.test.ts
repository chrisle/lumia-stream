import {
  parseManageMessage,
  normalizeAndStripVariables,
  findInvalidVariables,
} from "./parser";

describe("parseManageMessage", () => {
  describe("valid actions", () => {
    it("should parse 'add' action with command and response", () => {
      const result = parseManageMessage("add greet Hello {{displayName}}!");
      expect(result).toEqual({
        action: "add",
        commandName: "greet",
        response: "Hello {{displayName}}!",
      });
    });

    it("should parse 'edit' action with command and response", () => {
      const result = parseManageMessage("edit greet Goodbye {{displayName}}!");
      expect(result).toEqual({
        action: "edit",
        commandName: "greet",
        response: "Goodbye {{displayName}}!",
      });
    });

    it("should parse 'delete' action with command name only", () => {
      const result = parseManageMessage("delete greet");
      expect(result).toEqual({
        action: "delete",
        commandName: "greet",
        response: "",
      });
    });

    it("should parse 'remove' as 'delete'", () => {
      const result = parseManageMessage("remove greet");
      expect(result).toEqual({
        action: "delete",
        commandName: "greet",
        response: "",
      });
    });

    it("should parse 'list' action", () => {
      const result = parseManageMessage("list");
      expect(result).toEqual({
        action: "list",
        commandName: "",
        response: "",
      });
    });

    it("should parse 'help' action", () => {
      const result = parseManageMessage("help");
      expect(result).toEqual({
        action: "help",
        commandName: "",
        response: "",
      });
    });
  });

  describe("case insensitivity", () => {
    it("should handle uppercase action", () => {
      const result = parseManageMessage("ADD greet Hello!");
      expect(result?.action).toBe("add");
    });

    it("should handle mixed case action", () => {
      const result = parseManageMessage("DeLeTe greet");
      expect(result?.action).toBe("delete");
    });

    it("should lowercase command name", () => {
      const result = parseManageMessage("add GREET Hello!");
      expect(result?.commandName).toBe("greet");
    });
  });

  describe("variable normalization in response", () => {
    it("should normalize {{MESSAGE}} to {{message}}", () => {
      const result = parseManageMessage("add greet {{MESSAGE}}");
      expect(result?.response).toBe("{{message}}");
    });

    it("should normalize {{DISPLAYNAME}} to {{displayName}}", () => {
      const result = parseManageMessage("add greet Hello {{DISPLAYNAME}}!");
      expect(result?.response).toBe("Hello {{displayName}}!");
    });

    it("should strip invalid variables", () => {
      const result = parseManageMessage("add greet {{username}} says {{message}}");
      expect(result?.response).toBe(" says {{message}}");
    });
  });

  describe("multi-word responses", () => {
    it("should preserve spaces in response", () => {
      const result = parseManageMessage("add greet Hello world, how are you?");
      expect(result?.response).toBe("Hello world, how are you?");
    });

    it("should handle response with multiple variables", () => {
      const result = parseManageMessage(
        "add greet {{displayName}} says: {{message}}"
      );
      expect(result?.response).toBe("{{displayName}} says: {{message}}");
    });
  });

  describe("invalid inputs", () => {
    it("should return null for empty string", () => {
      expect(parseManageMessage("")).toBeNull();
    });

    it("should return null for undefined", () => {
      expect(parseManageMessage(undefined)).toBeNull();
    });

    it("should return null for invalid action", () => {
      expect(parseManageMessage("invalid greet")).toBeNull();
    });

    it("should return null for add without command name", () => {
      expect(parseManageMessage("add")).toBeNull();
    });

    it("should return null for add without response", () => {
      expect(parseManageMessage("add greet")).toBeNull();
    });

    it("should return null for edit without response", () => {
      expect(parseManageMessage("edit greet")).toBeNull();
    });
  });
});

describe("normalizeAndStripVariables", () => {
  it("should normalize {{message}} case", () => {
    expect(normalizeAndStripVariables("{{MESSAGE}}")).toBe("{{message}}");
    expect(normalizeAndStripVariables("{{Message}}")).toBe("{{message}}");
    expect(normalizeAndStripVariables("{{mEsSaGe}}")).toBe("{{message}}");
  });

  it("should normalize {{displayName}} case", () => {
    expect(normalizeAndStripVariables("{{DISPLAYNAME}}")).toBe("{{displayName}}");
    expect(normalizeAndStripVariables("{{displayname}}")).toBe("{{displayName}}");
    expect(normalizeAndStripVariables("{{DisplayName}}")).toBe("{{displayName}}");
  });

  it("should strip invalid variables", () => {
    expect(normalizeAndStripVariables("{{username}}")).toBe("");
    expect(normalizeAndStripVariables("{{channel}}")).toBe("");
    expect(normalizeAndStripVariables("{{game}}")).toBe("");
    expect(normalizeAndStripVariables("{{title}}")).toBe("");
  });

  it("should preserve text around stripped variables", () => {
    expect(normalizeAndStripVariables("Hello {{username}} there")).toBe(
      "Hello  there"
    );
  });

  it("should handle mixed valid and invalid variables", () => {
    expect(
      normalizeAndStripVariables("{{username}} {{displayName}} {{channel}}")
    ).toBe(" {{displayName}} ");
  });

  it("should handle text without variables", () => {
    expect(normalizeAndStripVariables("Hello world!")).toBe("Hello world!");
  });

  it("should handle multiple occurrences of same variable", () => {
    expect(
      normalizeAndStripVariables("{{MESSAGE}} and {{message}}")
    ).toBe("{{message}} and {{message}}");
  });
});

describe("findInvalidVariables", () => {
  it("should return empty array for valid variables only", () => {
    expect(findInvalidVariables("{{message}} {{displayName}}")).toEqual([]);
  });

  it("should find invalid variables", () => {
    expect(findInvalidVariables("{{username}}")).toEqual(["{{username}}"]);
    expect(findInvalidVariables("{{channel}} {{game}}")).toEqual([
      "{{channel}}",
      "{{game}}",
    ]);
  });

  it("should be case-insensitive for valid variables", () => {
    expect(findInvalidVariables("{{MESSAGE}} {{DISPLAYNAME}}")).toEqual([]);
  });

  it("should return empty array for text without variables", () => {
    expect(findInvalidVariables("Hello world!")).toEqual([]);
  });

  it("should find only invalid variables in mixed text", () => {
    expect(
      findInvalidVariables("{{displayName}} says {{username}}: {{message}}")
    ).toEqual(["{{username}}"]);
  });
});
