const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npx vitest run src/pages/Dashboard.test.tsx --reporter=verbose', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  fs.writeFileSync('test-output.txt', output);
  console.log('Test completed successfully');
} catch (error) {
  const errorOutput = error.stdout + '\n' + error.stderr;
  fs.writeFileSync('test-error.txt', errorOutput);
  console.log('Test failed, error written to test-error.txt');
  console.log(errorOutput);
}