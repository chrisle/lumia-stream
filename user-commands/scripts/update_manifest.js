#!/usr/bin/env node

/**
 * Update Manifest script - Syncs content from docs/ into manifest.json.
 *
 * Usage: node scripts/update_manifest.js
 *
 * Reads from:
 *   - docs/description.md      → manifest.description
 *   - docs/changelog.md        → manifest.changelog
 *   - docs/settings_tutorial.md → manifest.config.settings_tutorial
 *   - docs/actions_tutorial.md  → manifest.config.actions_tutorial
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "docs");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");

/** Mapping of doc files to manifest fields */
const DOC_MAPPINGS = [
  {
    file: "description.md",
    path: ["description"],
    description: "Plugin description",
  },
  {
    file: "changelog.md",
    path: ["changelog"],
    description: "Changelog",
  },
  {
    file: "settings_tutorial.md",
    path: ["config", "settings_tutorial"],
    description: "Settings tutorial",
  },
  {
    file: "actions_tutorial.md",
    path: ["config", "actions_tutorial"],
    description: "Actions tutorial",
  },
];

/**
 * Reads a file and returns its content, or null if empty/missing.
 * @param {string} filePath - Path to the file
 * @returns {string|null}
 */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8").trim();
  return content || null;
}

/**
 * Sets a nested property on an object.
 * @param {object} obj - The object to modify
 * @param {string[]} pathArray - Array of keys representing the path
 * @param {*} value - Value to set
 */
function setNestedProperty(obj, pathArray, value) {
  let current = obj;

  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[pathArray[pathArray.length - 1]] = value;
}

/**
 * Gets a nested property from an object.
 * @param {object} obj - The object to read from
 * @param {string[]} pathArray - Array of keys representing the path
 * @returns {*}
 */
function getNestedProperty(obj, pathArray) {
  let current = obj;

  for (const key of pathArray) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

function main() {
  console.log("=== Updating Manifest from Docs ===\n");

  // Read current manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Error: manifest.json not found");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  let updated = false;

  // Process each doc mapping
  for (const mapping of DOC_MAPPINGS) {
    const docPath = path.join(DOCS_DIR, mapping.file);
    const content = readFile(docPath);

    if (content === null) {
      console.log(`  Skipping ${mapping.file} (empty or missing)`);
      continue;
    }

    const currentValue = getNestedProperty(manifest, mapping.path);

    if (currentValue !== content) {
      setNestedProperty(manifest, mapping.path, content);
      console.log(`  Updated: ${mapping.description} (${mapping.file})`);
      updated = true;
    } else {
      console.log(`  Unchanged: ${mapping.description}`);
    }
  }

  // Write updated manifest
  if (updated) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
    console.log("\nManifest updated successfully.");
  } else {
    console.log("\nNo changes needed.");
  }
}

main();
