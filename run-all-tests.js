#!/usr/bin/env node

/**
 * Run all tests for the Messaging App
 *
 * This script runs both backend and frontend tests and provides
 * a summary of the results.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('========================================');
console.log('  Messaging App - Test Runner');
console.log('========================================\n');

let backendPassed = false;
let frontendPassed = false;

// Run backend tests
console.log('📦 Running Backend Tests...\n');
try {
  execSync('npm test', {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
  });
  backendPassed = true;
  console.log('\n✅ Backend tests passed!\n');
} catch (error) {
  console.log('\n❌ Backend tests failed!\n');
}

// Run frontend tests
console.log('📦 Running Frontend Tests...\n');
try {
  execSync('npm test -- --run', {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
  });
  frontendPassed = true;
  console.log('\n✅ Frontend tests passed!\n');
} catch (error) {
  console.log('\n❌ Frontend tests failed!\n');
}

// Summary
console.log('========================================');
console.log('  Test Summary');
console.log('========================================');
console.log(`Backend:  ${backendPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Frontend: ${frontendPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log('========================================\n');

// Exit with error code if any tests failed
if (!backendPassed || !frontendPassed) {
  process.exit(1);
}
