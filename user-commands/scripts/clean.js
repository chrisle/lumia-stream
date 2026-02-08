#!/usr/bin/env node

/**
 * Clean script - Removes build artifacts from the project.
 *
 * Usage: node scripts/clean.js [--all]
 *
 * Options:
 *   --all    Also remove dist/ directory
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

/** Directories and files to always remove */
const ARTIFACTS = [
  "build",
  "main.js",
  "main.d.ts",
  "types.js",
  "types.d.ts",
  "constants.js",
  "constants.d.ts",
  "handlers",
  "utils",
];

/** Additional items to remove with --all flag */
const DIST_ARTIFACTS = ["dist"];

/**
 * Recursively removes a file or directory.
 * @param {string} targetPath - Path to remove
 */
function remove(targetPath) {
  const fullPath = path.join(ROOT, targetPath);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  const stat = fs.statSync(fullPath);

  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  Removed directory: ${targetPath}`);
  } else {
    fs.unlinkSync(fullPath);
    console.log(`  Removed file: ${targetPath}`);
  }
}

function main() {
  const includeAll = process.argv.includes("--all");

  console.log("Cleaning build artifacts...\n");

  for (const artifact of ARTIFACTS) {
    remove(artifact);
  }

  if (includeAll) {
    for (const artifact of DIST_ARTIFACTS) {
      remove(artifact);
    }
  }

  console.log("\nDone.");
}

main();
