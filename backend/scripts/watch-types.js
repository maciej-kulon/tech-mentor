const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');

/**
 * File watcher that automatically regenerates types and endpoints when source files change
 * This provides hot-reloading for type and endpoint generation during development
 */

// Configuration
const WATCH_PATTERNS = [
  // Watch DTO and enum files for type extraction
  path.join(__dirname, '../src/**/*.dto.ts'),
  path.join(__dirname, '../src/**/*.enum.ts'),
  // Watch controller files for endpoint extraction
  path.join(__dirname, '../src/**/*.controller.ts'),
];

const EXTRACT_TYPES_SCRIPT = path.join(__dirname, 'extract-types.js');
const EXTRACT_ENDPOINTS_SCRIPT = path.join(__dirname, 'extract-endpoints.js');

console.log('🔍 Starting file watcher for types and endpoints...');
console.log(`📁 Watching patterns:`);
WATCH_PATTERNS.forEach((pattern) => console.log(`   - ${pattern}`));
console.log('💡 Types and endpoints will be automatically regenerated when files change\n');

// Initialize watcher
const watcher = chokidar.watch(WATCH_PATTERNS, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: false, // run extraction on startup
});

// Track if extraction is currently running to avoid duplicate runs
let isExtracting = false;
let pendingExtraction = false;

/**
 * Determine which scripts to run based on the changed file
 */
function getScriptsToRun(filePath) {
  const scripts = [];

  if (filePath.endsWith('.dto.ts') || filePath.endsWith('.enum.ts')) {
    scripts.push({ script: EXTRACT_TYPES_SCRIPT, name: 'types' });
  }

  if (filePath.endsWith('.controller.ts')) {
    scripts.push({ script: EXTRACT_ENDPOINTS_SCRIPT, name: 'endpoints' });
  }

  return scripts;
}

/**
 * Run extraction scripts with debouncing to avoid multiple runs
 */
function runExtractions(eventType, filePath) {
  if (isExtracting) {
    pendingExtraction = true;
    return;
  }

  isExtracting = true;

  const fileName = path.relative(path.join(__dirname, '../src'), filePath);
  const fileType = fileName.endsWith('.dto.ts')
    ? 'DTO'
    : fileName.endsWith('.enum.ts')
      ? 'Enum'
      : fileName.endsWith('.controller.ts')
        ? 'Controller'
        : 'Unknown';

  console.log(`\n🔄 ${eventType} ${fileType}: ${fileName}`);

  // Determine which scripts need to run
  const scriptsToRun = getScriptsToRun(filePath);

  if (scriptsToRun.length === 0) {
    console.log('⚠️  No extraction scripts needed for this file type');
    isExtracting = false;
    return;
  }

  console.log(`⚡ Running ${scriptsToRun.map((s) => s.name).join(' and ')} extraction...`);

  try {
    // Run each required script
    for (const { script, name } of scriptsToRun) {
      console.log(`🔧 Extracting ${name}...`);
      execSync(`node "${script}"`, {
        stdio: 'pipe',
        cwd: __dirname,
      });
    }

    console.log('✅ All extractions completed successfully!');

    // Show a summary of what was generated
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🕐 Last updated: ${timestamp}\n`);
  } catch (error) {
    console.error('❌ Error during extraction:');
    console.error(error.stdout?.toString() || error.message);
    console.log('🔧 Please check your source files for syntax errors\n');
  } finally {
    isExtracting = false;

    // If there was a pending extraction request, run it now
    if (pendingExtraction) {
      pendingExtraction = false;
      setTimeout(() => runExtractions('Queued', filePath), 100);
    }
  }
}

/**
 * Run initial extraction of both types and endpoints on startup
 */
function runInitialExtractions() {
  console.log('🚀 Running initial extractions...');

  try {
    console.log('🔧 Extracting types...');
    execSync(`node "${EXTRACT_TYPES_SCRIPT}"`, {
      stdio: 'pipe',
      cwd: __dirname,
    });

    console.log('🔧 Extracting endpoints...');
    execSync(`node "${EXTRACT_ENDPOINTS_SCRIPT}"`, {
      stdio: 'pipe',
      cwd: __dirname,
    });

    console.log('✅ Initial extractions completed successfully!');
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🕐 Initial extraction completed: ${timestamp}\n`);
  } catch (error) {
    console.error('❌ Error during initial extraction:');
    console.error(error.stdout?.toString() || error.message);
    console.log('🔧 Please check your source files for syntax errors\n');
  }
}

// Run initial extractions on startup
let hasRunInitial = false;

// Set up event handlers
watcher
  .on('add', (filePath) => {
    if (!hasRunInitial) {
      return; // Skip individual file processing during initial scan
    }
    runExtractions('Added', filePath);
  })
  .on('change', (filePath) => runExtractions('Changed', filePath))
  .on('unlink', (filePath) => {
    const fileName = path.relative(path.join(__dirname, '../src'), filePath);
    const fileType = fileName.endsWith('.dto.ts')
      ? 'DTO'
      : fileName.endsWith('.enum.ts')
        ? 'Enum'
        : fileName.endsWith('.controller.ts')
          ? 'Controller'
          : 'Unknown';
    console.log(`\n🗑️  Deleted ${fileType}: ${fileName}`);

    // Run both extractions when files are deleted to clean up
    // This is a simplified approach - we run both to be safe
    runExtractions('Deleted', filePath);
  })
  .on('error', (error) => {
    console.error('❌ Watcher error:', error);
  })
  .on('ready', () => {
    console.log('👀 Watcher is ready. Running initial extractions...');
    runInitialExtractions();
    hasRunInitial = true;
    console.log('💻 Now monitoring for changes. Press Ctrl+C to stop watching\n');
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping file watcher...');
  watcher.close();
  console.log('✅ File watcher stopped. Goodbye!');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  watcher.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  watcher.close();
  process.exit(1);
});
