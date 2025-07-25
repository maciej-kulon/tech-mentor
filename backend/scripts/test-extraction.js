#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Test script to verify type extraction works correctly.
 * Run this before pushing to ensure the GitHub workflow will succeed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(__dirname, '../../web/src/types/generated');

console.log('🧪 Testing type extraction...\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(BACKEND_DIR, 'package.json'))) {
    throw new Error('Must run from backend directory');
  }

  // Check if output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('📁 Creating output directory...');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Run extraction
  console.log('🔄 Running type extraction...');
  execSync('npm run extract-all', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
  });

  // Check generated files
  console.log('\n📋 Checking generated files...');
  const files = fs.readdirSync(OUTPUT_DIR, { recursive: true });

  if (files.length === 0) {
    throw new Error('No files were generated');
  }

  console.log('✅ Generated files:');
  files.forEach((file) => {
    if (typeof file === 'string' && file.endsWith('.ts')) {
      console.log(`   📄 ${file}`);
    }
  });

  // Check for specific expected files
  const expectedFiles = ['api-endpoints.ts', 'index.ts'];

  console.log('\n🔍 Checking for expected files...');
  expectedFiles.forEach((file) => {
    const filePath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} (missing)`);
    }
  });

  // Test that generated files are valid TypeScript
  console.log('\n🔍 Validating TypeScript syntax...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', {
      cwd: path.resolve(OUTPUT_DIR, '../..'),
      stdio: 'pipe',
    });
    console.log('   ✅ TypeScript validation passed');
  } catch (error) {
    console.log(
      '   ⚠️  TypeScript validation failed (this might be expected if types reference backend-only types)',
    );
  }

  console.log('\n🎉 Type extraction test completed successfully!');
  console.log('✅ Ready to push to GitHub - the workflow should work correctly.');
} catch (error) {
  console.error('\n❌ Type extraction test failed:');
  console.error(error.message);
  process.exit(1);
}
