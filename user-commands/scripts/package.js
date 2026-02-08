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
 *   4. Update manifest with docs content
 *   5. Create staging directory with only required files
 *   6. Run lumia-plugin build on staging directory
 *   7. Clean up staging directory
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const ROOT = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const DIST_DIR = path.join(ROOT, "dist");
const STAGING_DIR = path.join(ROOT, ".staging");
const MANIFEST_FILE = path.join(ROOT, "manifest.json");
const PACKAGE_FILE = path.join(ROOT, "package.json");

/**
 * Gets output filename from package.json name and version.
 * @returns {string} Output file path
 */
function getOutputFile() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, "utf-8"));
  return path.join(DIST_DIR, `${pkg.name}-${pkg.version}.lumiaplugin`);
}

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
 * Removes the staging directory.
 */
function cleanStaging() {
  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  }
}

/**
 * Removes old .lumiaplugin files from the dist directory.
 */
function cleanOldPlugins() {
  if (!fs.existsSync(DIST_DIR)) {
    return;
  }

  const files = fs.readdirSync(DIST_DIR);
  let removed = 0;

  for (const file of files) {
    if (file.endsWith(".lumiaplugin")) {
      fs.unlinkSync(path.join(DIST_DIR, file));
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`  Removed ${removed} old plugin file(s)`);
  }
}

/**
 * Creates staging directory with only the required plugin files.
 * This avoids including node_modules, src, dist, and other dev files.
 */
function createStaging() {
  cleanStaging();
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  // Copy manifest.json
  fs.copyFileSync(MANIFEST_FILE, path.join(STAGING_DIR, "manifest.json"));

  // Copy compiled JavaScript from build directory
  copyDir(BUILD_DIR, STAGING_DIR);

  console.log("  Created staging directory with plugin files");
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

/**
 * Reads a markdown file and wraps it with --- delimiters.
 * @param {string} filename - Name of the file in root directory
 * @returns {string} Content wrapped with ---\n prefix and \n--- suffix
 */
function readDocFile(filename) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  Warning: ${filename} not found`);
    return "";
  }
  const content = fs.readFileSync(filePath, "utf-8").trimEnd();
  return `---\n${content}\n---`;
}

/**
 * Updates manifest.json with content from package.json and *.md files.
 */
function updateManifest() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, "utf-8"));

  // Sync fields from package.json
  manifest.id = pkg.name.replace(/-/g, "_");
  manifest.version = pkg.version;
  manifest.author = pkg.author;
  manifest.email = pkg.email;
  manifest.license = pkg.license;
  manifest.repository = pkg.repository;
  manifest.keywords = pkg.keywords.join(", ");

  // Update tutorials
  manifest.config.settings_tutorial = readDocFile("settings_tutorial.md");
  manifest.config.actions_tutorial = readDocFile("actions_tutorial.md");

  // Update changelog and description if they exist
  const changelogPath = path.join(ROOT, "changelog.md");
  if (fs.existsSync(changelogPath)) {
    manifest.changelog = fs.readFileSync(changelogPath, "utf-8").trimEnd();
  }

  const descriptionPath = path.join(ROOT, "description.md");
  if (fs.existsSync(descriptionPath)) {
    manifest.description = fs.readFileSync(descriptionPath, "utf-8").trimEnd();
  }

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + "\n");
  console.log("  Updated manifest with package.json and docs content");
}

async function main() {
  console.log("=== Packaging Lumia Stream Plugin ===");

  // Step 1: Clean
  run("node scripts/clean.js", "Cleaning previous build");
  console.log("\nCleaning old plugin files...");
  cleanOldPlugins();

  // Step 2: Compile TypeScript
  run("npx tsc", "Compiling TypeScript");

  // Step 3: Minify JavaScript
  console.log("\nMinifying JavaScript...");
  await minifyBuild();

  // Step 4: Update manifest with docs content
  console.log("\nUpdating manifest...");
  updateManifest();

  // Step 5: Create staging directory with only required files
  console.log("\nCreating staging directory...");
  createStaging();

  // Step 6: Run lumia-plugin build on staging directory
  const outputFile = getOutputFile();
  run(
    `npx lumia-plugin build "${STAGING_DIR}" --out "${outputFile}"`,
    "Building plugin package"
  );

  // Step 7: Clean up staging directory
  console.log("\nCleaning up staging directory...");
  cleanStaging();

  console.log("\n=== Package Complete ===");
  console.log(`Output: ${outputFile}`);
}

main().catch((err) => {
  console.error("Package failed:", err);
  process.exit(1);
});
