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
  const result = executeCommand('npx vercel ls');
  
  if (!result.success) {
    log(`Failed to get deployments: ${result.error}`, 'ERROR');
    return null;
  }
  
  try {
    // Parse the output to extract deployment info
    const lines = result.output.split('\n').filter(line => line.trim());
    const deploymentLines = lines.filter(line => 
      (line.includes('● Error') || line.includes('● Ready') || line.includes('● Building')) &&
      line.includes('https://')
    );
    
    if (deploymentLines.length === 0) {
      log('No deployments found', 'WARN');
      return null;
    }
    
    // Get the most recent deployment (first in list)
    const latestLine = deploymentLines[0];
    const state = latestLine.includes('● Error') ? 'ERROR' : 
                 latestLine.includes('● Ready') ? 'READY' : 
                 latestLine.includes('● Building') ? 'BUILDING' : 'UNKNOWN';
    
    log(`Latest deployment status: ${state}`);
    log(`Deployment line: ${latestLine.substring(0, 100)}...`);
    return { state, line: latestLine };
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
  if (!deployment || !deployment.line) return 'unknown';
  
  // Common failure patterns and their fixes
  const patterns = [
    { pattern: /index\.html.*not found/i, fix: 'missing-index-html' },
    { pattern: /build.*failed/i, fix: 'build-failure' },
    { pattern: /module.*not found/i, fix: 'missing-dependencies' },
    { pattern: /permission.*denied/i, fix: 'permission-error' },
    { pattern: /timeout/i, fix: 'timeout-error' },
    { pattern: /html.*excluded/i, fix: 'vercel-ignore-issue' }
  ];
  
  const errorText = deployment.line || '';
  
  for (const { pattern, fix } of patterns) {
    if (pattern.test(errorText)) {
      log(`Identified issue: ${fix}`);
      return fix;
    }
  }
  
  return 'unknown';
}

function analyzeFailureFromOutput(outputLine) {
  const fixes = [];
  
  if (outputLine.includes('index.html') && outputLine.includes('not found')) {
    fixes.push('missing-index-html');
  }
  if (outputLine.includes('build') && outputLine.includes('failed')) {
    fixes.push('build-failure');
  }
  if (outputLine.includes('module') && outputLine.includes('not found')) {
    fixes.push('missing-dependencies');
  }
  
  return fixes;
}

// Apply automatic fixes
async function applyFix(fixType) {
  log(`Applying fix: ${fixType}`);
  
  switch (fixType) {
    case 'missing-index-html':
    case 'vercel-ignore-issue':
      // Fix .vercelignore excluding HTML files
      const fs = require('fs');
      try {
        let vercelIgnoreContent = '';
        if (fs.existsSync('.vercelignore')) {
          vercelIgnoreContent = fs.readFileSync('.vercelignore', 'utf8');
        }
        
        // Remove any HTML exclusions and ensure index.html is included
        vercelIgnoreContent = vercelIgnoreContent.replace(/^\*\.html$/gm, '# *.html');
        if (!vercelIgnoreContent.includes('!index.html')) {
          vercelIgnoreContent += '\n!index.html\n';
        }
        
        fs.writeFileSync('.vercelignore', vercelIgnoreContent);
        log('Updated .vercelignore to include index.html', 'SUCCESS');
        return true;
      } catch (error) {
        log(`Failed to fix .vercelignore: ${error.message}`, 'ERROR');
        return false;
      }
      
    case 'missing-dependencies':
      // Try to install missing dependencies
      const installResult = executeCommand('npm install');
      if (installResult.success) {
        log('Dependencies installed successfully', 'SUCCESS');
        return true;
      }
      break;
      
    case 'build-failure':
      // Try to fix build issues
      log('Attempting to fix build errors...');
      const buildResult = executeCommand('npm run build');
      if (buildResult.success) {
        log('Build errors resolved', 'SUCCESS');
        return true;
      }
      break;
      
    default:
      log(`No automatic fix available for: ${fixType}`, 'WARN');
      return false;
  }
  
  return false;
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main monitoring loop
async function main() {
  log('Starting continuous deployment monitoring...', 'INFO');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    log(`\n=== Deployment Attempt ${attempts}/${maxAttempts} ===`);
    
    // Check for uncommitted changes and commit them
    const statusResult = executeCommand('git status --porcelain');
    if (statusResult.success && statusResult.output.trim()) {
      log('Uncommitted changes detected, committing...', 'WARN');
      executeCommand('git add .');
      executeCommand(`git commit -m "Auto-fix deployment issues - attempt ${attempts}"`);
    }
    
    // Push to GitHub with retries
    const pushSuccess = await pushToGitHub();
    if (!pushSuccess) {
      log('Failed to push to GitHub after retries', 'ERROR');
      await sleep(30000); // Wait 30 seconds before next attempt
      continue;
    }
    
    // Wait for deployment to trigger
    log('Waiting for GitHub Actions to trigger deployment...');
    await sleep(30000);
    
    // Monitor deployment status
    const deployment = getLatestDeployment();
    if (!deployment) {
      log('Could not fetch deployment status', 'ERROR');
      await sleep(30000);
      continue;
    }
    
    log(`Deployment status: ${deployment.state}`);
    
    if (deployment.state === 'READY') {
      log('🎉 Deployment successful!', 'SUCCESS');
      log(`Deployment info: ${deployment.line}`);
      break;
    } else if (deployment.state === 'ERROR') {
      log('Deployment failed, analyzing...', 'ERROR');
      log(`Error details: ${deployment.line}`);
      
      // Apply common fixes for deployment errors
      const fixType = analyzeDeploymentFailure(deployment);
      if (fixType !== 'unknown') {
        const fixApplied = applyFix(fixType);
        if (!fixApplied) {
          log('Could not apply automatic fix', 'ERROR');
        }
      }
      
      await sleep(10000); // Wait before next attempt
    } else {
      log(`Deployment in progress (${deployment.state}), waiting...`);
      await sleep(30000);
    }
  }
  
  if (attempts >= maxAttempts) {
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