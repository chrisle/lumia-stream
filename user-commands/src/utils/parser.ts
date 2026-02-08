import { ParsedMessage } from "../types";
import { ALLOWED_VARIABLES } from "../constants";

export function parseManageMessage(
  message: string | undefined
): ParsedMessage | null {
  const trimmed = (message || "").trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length < 1) return null;

  const action = parts[0].toLowerCase();

  if (!["add", "edit", "delete", "list"].includes(action)) {
    return null;
  }

  if (action === "list") {
    return { action, commandName: "", response: "" };
  }

  if (parts.length < 2) return null;

  const commandName = parts[1].toLowerCase();

  if (action === "delete") {
    return { action, commandName, response: "" };
  }

  if (parts.length < 3) return null;

  const response = parts.slice(2).join(" ");
  return { action, commandName, response };
}

export function validateVariables(response: string): string[] {
  const matches = response.match(/\{[^}]+\}/g) || [];
  return matches.filter((v) => !ALLOWED_VARIABLES.includes(v));
}

export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}
