const { execSync } = require('child_process');

try {
  console.log('Running TypeScript check...');
  const result = execSync('npx tsc --noEmit --skipLibCheck', { 
    encoding: 'utf8',
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('TypeScript check passed!');
  console.log(result);
} catch (error) {
  console.log('TypeScript errors found:');
  console.log(error.stdout || error.message);
  console.log('---');
  if (error.stderr) {
    console.log(error.stderr);
  }
}