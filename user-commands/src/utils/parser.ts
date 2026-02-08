import { ParsedMessage } from "../types";
import { ALLOWED_VARIABLES, VALID_ACTIONS } from "../constants";

/**
 * Parses a !command message into its component parts.
 *
 * @param message - The arguments after "!command" (e.g., "add greet Hello!")
 * @returns Parsed message with action, commandName, and response, or null if invalid
 *
 * @example
 * parseManageMessage("add greet Hello {{displayName}}!")
 * // Returns: { action: "add", commandName: "greet", response: "Hello {{displayName}}!" }
 *
 * @example
 * parseManageMessage("delete greet")
 * // Returns: { action: "delete", commandName: "greet", response: "" }
 *
 * @example
 * parseManageMessage("list")
 * // Returns: { action: "list", commandName: "", response: "" }
 */
export function parseManageMessage(
  message: string | undefined
): ParsedMessage | null {
  const trimmed = (message || "").trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length < 1) return null;

  let action = parts[0].toLowerCase();

  if (!VALID_ACTIONS.includes(action)) {
    return null;
  }

  // Normalize "remove" to "delete"
  if (action === "remove") {
    action = "delete";
  }

  if (action === "list" || action === "help") {
    return { action, commandName: "", response: "" };
  }

  if (parts.length < 2) return null;

  const commandName = parts[1].toLowerCase();

  if (action === "delete") {
    return { action, commandName, response: "" };
  }

  if (parts.length < 3) return null;

  const rawResponse = parts.slice(2).join(" ");
  const response = normalizeAndStripVariables(rawResponse);
  return { action, commandName, response };
}

/**
 * Normalizes allowed variables to correct case and strips invalid ones.
 *
 * - {{message}} and {{displayName}} are normalized to exact case (case-insensitive match)
 * - Any other {{xxx}} variables are stripped from the template
 *
 * @param template - The response template to normalize
 * @returns Template with normalized variables and invalid ones removed
 *
 * @example
 * normalizeAndStripVariables("Hello {{DISPLAYNAME}}!")
 * // Returns: "Hello {{displayName}}!"
 *
 * @example
 * normalizeAndStripVariables("{{username}} says {{MESSAGE}}")
 * // Returns: " says {{message}}" ({{username}} is stripped)
 */
export function normalizeAndStripVariables(template: string): string {
  // First normalize allowed variables to correct case
  let result = template.replace(/\{\{message\}\}/gi, "{{message}}");
  result = result.replace(/\{\{displayName\}\}/gi, "{{displayName}}");

  // Strip any remaining {{xxx}} variables that aren't allowed
  result = result.replace(/\{\{(?!message\}\}|displayName\}\})[^}]+\}\}/gi, "");

  return result;
}

/**
 * Finds any variables in the template that aren't in the allowed list.
 *
 * @param template - The response template to check
 * @returns Array of invalid variable strings (e.g., ["{{username}}", "{{channel}}"])
 *
 * @example
 * findInvalidVariables("Hello {{displayName}} from {{channel}}")
 * // Returns: ["{{channel}}"]
 */
export function findInvalidVariables(template: string): string[] {
  const matches = template.match(/\{\{[^}]+\}\}/g) || [];
  const normalized = matches.map((v) => v.toLowerCase());
  const allowedLower = ALLOWED_VARIABLES.map((v) => v.toLowerCase());
  return matches.filter((_, i) => !allowedLower.includes(normalized[i]));
}
