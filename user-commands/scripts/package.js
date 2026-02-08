#!/usr/bin/env node

/**
 * Package script - Builds and packages the Lumia Stream plugin.
 *
 * Usage: node scripts/package.js
 *
 * Steps:
 *   1. Clean previous build artifacts
 *   2. Compile TypeScript
 *   3. Minify JavaScript files
 *   4. Copy build output to root (required by lumia-plugin)
 *   5. Run lumia-plugin build
 *   6. Clean up root artifacts
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const ROOT = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const DIST_DIR = path.join(ROOT, "dist");
const OUTPUT_FILE = path.join(DIST_DIR, "triode_user_commands.lumiaplugin");

/**
 * Executes a command and prints output.
 * @param {string} cmd - Command to execute
 * @param {string} description - Description of the step
 */
function run(cmd, description) {
  console.log(`\n${description}...`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit" });
  } catch (error) {
    console.error(`\nFailed: ${description}`);
    process.exit(1);
  }
}

/**
 * Recursively copies a directory.
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Removes root-level build artifacts.
 */
function cleanRoot() {
  const artifacts = [
    "main.js",
    "main.d.ts",
    "types.js",
    "types.d.ts",
    "constants.js",
    "constants.d.ts",
    "handlers",
    "utils",
  ];

  for (const artifact of artifacts) {
    const fullPath = path.join(ROOT, artifact);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  }
}

/**
 * Recursively finds all .js files in a directory.
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of file paths
 */
function findJsFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Minifies all JavaScript files in the build directory.
 */
async function minifyBuild() {
  const jsFiles = findJsFiles(BUILD_DIR);
  let totalOriginal = 0;
  let totalMinified = 0;

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, "utf-8");
    totalOriginal += code.length;

    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    });

    if (result.code) {
      fs.writeFileSync(file, result.code);
      totalMinified += result.code.length;
    }
  }

  const savings = ((1 - totalMinified / totalOriginal) * 100).toFixed(1);
  console.log(
    `  Minified ${jsFiles.length} files (${savings}% size reduction)`
  );
}

async function main() {
  console.log("=== Packaging Lumia Stream Plugin ===");

  // Step 1: Clean
  run("node scripts/clean.js", "Cleaning previous build");

  // Step 2: Compile TypeScript
  run("npx tsc", "Compiling TypeScript");

  // Step 3: Minify JavaScript
  console.log("\nMinifying JavaScript...");
  await minifyBuild();

  // Step 4: Copy build to root
  console.log("\nCopying build output to root...");
  copyDir(BUILD_DIR, ROOT);

  // Step 5: Run lumia-plugin build
  run(
    `npx lumia-plugin build . --out "${OUTPUT_FILE}"`,
    "Building plugin package"
  );

  // Step 6: Clean up root
  console.log("\nCleaning up root artifacts...");
  cleanRoot();

  console.log("\n=== Package Complete ===");
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Package failed:", err);
  process.exit(1);
});
