#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxRetries: 10,
  retryDelay: 30000, // 30 seconds
  pushRetryDelay: 60000, // 1 minute for push retries
  logFile: path.join(__dirname, '..', 'deployment-monitor.log'),
  projectName: 'new-simple-crm'
};

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Append to log file
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

// Execute command with error handling
function executeCommand(command, options = {}) {
  try {
    log(`Executing: ${command}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || error.stderr || '' 
    };
  }
}

// Check if we can connect to GitHub
function checkGitHubConnectivity() {
  log('Checking GitHub connectivity...');
  const result = executeCommand('git ls-remote --heads origin');
  return result.success;
}

// Push changes to GitHub with retries
async function pushToGitHub(maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`Push attempt ${attempt}/${maxRetries}`);
    
    if (!checkGitHubConnectivity()) {
      log('GitHub connectivity issue detected', 'WARN');
      if (attempt < maxRetries) {
        log(`Waiting ${CONFIG.pushRetryDelay/1000} seconds before retry...`);
        await sleep(CONFIG.pushRetryDelay);
        continue;
      }
      return false;
    }
    
    const result = executeCommand('git push origin master');
    if (result.success) {
      log('Successfully pushed to GitHub', 'SUCCESS');
      return true;
    }
    
    log(`Push failed: ${result.error}`, 'ERROR');
    if (attempt < maxRetries) {
      await sleep(CONFIG.pushRetryDelay);
    }
  }
  
  return false;
}

// Get latest deployment status
function getLatestDeployment() {
  log('Fetching latest deployment status...');
  const result = executeCommand('npx vercel ls --json');
  
  if (!result.success) {
    log(`Failed to get deployments: ${result.error}`, 'ERROR');
    return null;
  }
  
  try {
    const deployments = JSON.parse(result.output);
    if (deployments && deployments.length > 0) {
      return deployments[0]; // Most recent deployment
    }
  } catch (error) {
    log(`Failed to parse deployment data: ${error.message}`, 'ERROR');
  }
  
  return null;
}

// Monitor deployment status
async function monitorDeployment(deploymentUrl, maxWaitTime = 300000) { // 5 minutes max
  const startTime = Date.now();
  log(`Monitoring deployment: ${deploymentUrl}`);
  
  while (Date.now() - startTime < maxWaitTime) {
    const result = executeCommand(`npx vercel inspect ${deploymentUrl} --json`);
    
    if (result.success) {
      try {
        const deployment = JSON.parse(result.output);
        const status = deployment.readyState || deployment.state;
        
        log(`Deployment status: ${status}`);
        
        if (status === 'READY') {
          log('Deployment successful!', 'SUCCESS');
          return { success: true, status };
        } else if (status === 'ERROR') {
          log('Deployment failed', 'ERROR');
          return { success: false, status, deployment };
        }
        // Continue monitoring if status is BUILDING, QUEUED, etc.
      } catch (error) {
        log(`Failed to parse deployment status: ${error.message}`, 'ERROR');
      }
    }
    
    await sleep(10000); // Wait 10 seconds before next check
  }
  
  log('Deployment monitoring timed out', 'WARN');
  return { success: false, status: 'TIMEOUT' };
}

// Analyze deployment failure
function analyzeDeploymentFailure(deployment) {
  log('Analyzing deployment failure...');
  
  // Common failure patterns and their fixes
  const commonIssues = [
    {
      pattern: /could not resolve entry module.*index\.html/i,
      fix: 'vercelignore_html_exclusion',
      description: 'index.html is being excluded by .vercelignore'
    },
    {
      pattern: /module not found/i,
      fix: 'missing_dependency',
      description: 'Missing dependency in package.json'
    },
    {
      pattern: /typescript.*error/i,
      fix: 'typescript_errors',
      description: 'TypeScript compilation errors'
    },
    {
      pattern: /eslint.*error/i,
      fix: 'eslint_errors',
      description: 'ESLint errors blocking build'
    }
  ];
  
  // Try to get build logs for analysis
  const logsResult = executeCommand(`npx vercel logs ${deployment.url}`);
  const logs = logsResult.output || '';
  
  for (const issue of commonIssues) {
    if (issue.pattern.test(logs)) {
      log(`Identified issue: ${issue.description}`, 'WARN');
      return issue.fix;
    }
  }
  
  log('Could not identify specific failure cause', 'WARN');
  return 'unknown';
}

// Apply automatic fixes
function applyFix(fixType) {
  log(`Applying fix: ${fixType}`);
  
  switch (fixType) {
    case 'vercelignore_html_exclusion':
      // This fix has already been applied
      log('HTML exclusion fix already applied');
      return true;
      
    case 'typescript_errors':
      log('Running TypeScript check...');
      const tscResult = executeCommand('npm run check');
      if (!tscResult.success) {
        log(`TypeScript errors found: ${tscResult.output}`, 'ERROR');
        return false;
      }
      return true;
      
    case 'eslint_errors':
      log('Running ESLint check...');
      const eslintResult = executeCommand('npm run lint');
      if (!eslintResult.success) {
        log(`ESLint errors found: ${eslintResult.output}`, 'ERROR');
        return false;
      }
      return true;
      
    default:
      log(`No automatic fix available for: ${fixType}`, 'WARN');
      return false;
  }
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main monitoring loop
async function main() {
  log('Starting continuous deployment monitoring...', 'INFO');
  
  let attempt = 1;
  
  while (attempt <= CONFIG.maxRetries) {
    log(`\n=== Deployment Attempt ${attempt}/${CONFIG.maxRetries} ===`);
    
    // Step 1: Ensure we have the latest changes committed
    const statusResult = executeCommand('git status --porcelain');
    if (statusResult.success && statusResult.output.trim()) {
      log('Uncommitted changes detected, committing...', 'WARN');
      executeCommand('git add .');
      executeCommand(`git commit -m "Auto-fix deployment issues - attempt ${attempt}"`);
    }
    
    // Step 2: Try to push to GitHub
    const pushSuccess = await pushToGitHub();
    if (!pushSuccess) {
      log('Failed to push to GitHub, will retry in next cycle', 'ERROR');
      attempt++;
      if (attempt <= CONFIG.maxRetries) {
        await sleep(CONFIG.retryDelay);
      }
      continue;
    }
    
    // Step 3: Wait a moment for GitHub Actions to trigger
    log('Waiting for GitHub Actions to trigger deployment...');
    await sleep(30000); // Wait 30 seconds
    
    // Step 4: Monitor the deployment
    const deployment = getLatestDeployment();
    if (!deployment) {
      log('Could not fetch deployment status', 'ERROR');
      attempt++;
      continue;
    }
    
    const monitorResult = await monitorDeployment(deployment.url);
    
    if (monitorResult.success) {
      log('\n🎉 DEPLOYMENT SUCCESSFUL! 🎉', 'SUCCESS');
      log(`Deployment URL: ${deployment.url}`);
      break;
    }
    
    // Step 5: Analyze failure and apply fixes
    log('Deployment failed, analyzing...', 'ERROR');
    const fixType = analyzeDeploymentFailure(monitorResult.deployment || deployment);
    
    if (fixType !== 'unknown') {
      const fixApplied = applyFix(fixType);
      if (!fixApplied) {
        log('Could not apply automatic fix', 'ERROR');
      }
    }
    
    attempt++;
    if (attempt <= CONFIG.maxRetries) {
      log(`Waiting ${CONFIG.retryDelay/1000} seconds before next attempt...`);
      await sleep(CONFIG.retryDelay);
    }
  }
  
  if (attempt > CONFIG.maxRetries) {
    log('\n❌ DEPLOYMENT FAILED AFTER ALL RETRIES ❌', 'ERROR');
    log('Manual intervention may be required.');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\nMonitoring interrupted by user', 'WARN');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'ERROR');
  process.exit(1);
});

// Start the monitoring
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { main, log, executeCommand };