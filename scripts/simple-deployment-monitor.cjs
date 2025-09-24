const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function getLatestDeployment() {
  try {
    log('Fetching latest deployment status...');
    const result = execSync('npx vercel ls', { encoding: 'utf8', timeout: 30000 });
    
    const lines = result.split('\n').filter(line => line.trim());
    log(`Total lines found: ${lines.length}`);
    
    // Look for URL lines and examine them for status indicators
    const urlLines = lines.filter(line => line.includes('https://'));
    log(`Found ${urlLines.length} URL lines`);
    
    // Log first few lines to debug
    urlLines.slice(0, 3).forEach((line, i) => {
      log(`URL line ${i}: ${line}`);
    });
    
    // Since the output shows URLs with status on same line, look for status in URL lines
    const errorLines = urlLines.filter(line => line.includes('● Error'));
    const readyLines = urlLines.filter(line => line.includes('● Ready'));
    const buildingLines = urlLines.filter(line => line.includes('● Building'));
    
    log(`Found ${errorLines.length} error lines, ${readyLines.length} ready lines, ${buildingLines.length} building lines`);
    
    // Use the appropriate status lines
    let deploymentLines = [];
    if (errorLines.length > 0) {
      deploymentLines = errorLines;
    } else if (buildingLines.length > 0) {
      deploymentLines = buildingLines;
    } else if (readyLines.length > 0) {
      deploymentLines = readyLines;
    } else {
      // If no status found, assume the most recent URL is an error since we know deployments are failing
      deploymentLines = urlLines.slice(0, 1);
    }
    
    log(`Found ${deploymentLines.length} deployment lines`);
    
    if (deploymentLines.length === 0) {
      log('No deployments found', 'WARN');
      return null;
    }
    
    // Determine state from the type of lines we found
    let state = 'UNKNOWN';
    if (errorLines.length > 0) {
      state = 'ERROR';
    } else if (buildingLines.length > 0) {
      state = 'BUILDING';
    } else if (readyLines.length > 0) {
      state = 'READY';
    } else if (urlLines.length > 0) {
      // Assume error state for recent deployments since we know they're failing
      state = 'ERROR';
    }
    
    // Get the most recent URL (first URL line)
    const latestUrl = urlLines.length > 0 ? extractUrl(urlLines[0]) : null;
    
    log(`Latest deployment status: ${state}`);
    log(`Latest deployment URL: ${latestUrl}`);
    return { state, line: deploymentLines[0] || urlLines[0], url: latestUrl };
  } catch (error) {
    log(`Failed to get deployments: ${error.message}`, 'ERROR');
    return null;
  }
}

function extractUrl(line) {
  const match = line.match(/https:\/\/[^\s]+/);
  return match ? match[0] : null;
}

async function getDeploymentLogs(url) {
  try {
    log(`Getting deployment logs for: ${url}`);
    
    // Try to get logs using the URL
    try {
      const result = execSync(`npx vercel logs ${url}`, { encoding: 'utf8', timeout: 30000 });
      return result;
    } catch (urlError) {
      log(`Direct URL logs failed: ${urlError.message}`);
      
      // Extract deployment ID from URL and try with that
      const deploymentId = url.split('//')[1].split('-')[2]; // Extract ID from URL
      log(`Trying with deployment ID: ${deploymentId}`);
      
      try {
        const result = execSync(`npx vercel logs ${deploymentId}`, { encoding: 'utf8', timeout: 30000 });
        return result;
      } catch (idError) {
        log(`Deployment ID logs failed: ${idError.message}`);
        
        // Try to get build logs instead
        try {
          const buildResult = execSync(`npx vercel inspect ${url}`, { encoding: 'utf8', timeout: 30000 });
          return buildResult;
        } catch (inspectError) {
          log(`Inspect failed: ${inspectError.message}`);
          
          // Return a generic error analysis
          return 'Unable to fetch logs - deployment in error state';
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to get deployment logs: ${error.message}`);
  }
}

async function analyzeFailure(logs) {
  log('Analyzing deployment failure...');
  
  // If we have logs, analyze them
  if (logs && logs !== 'Unable to fetch logs - deployment in error state') {
    const logText = logs.toLowerCase();
    
    // Check for common issues
    if (logText.includes('index.html') && logText.includes('not found')) {
      return {
        issue: 'missing_index_html',
        fix: 'create_index_html'
      };
    }
    
    if (logText.includes('module not found') || logText.includes('cannot resolve')) {
      return {
        issue: 'missing_dependencies',
        fix: 'install_dependencies'
      };
    }
    
    if (logText.includes('build failed') || logText.includes('compilation failed')) {
      return {
        issue: 'build_failure',
        fix: 'fix_build_config'
      };
    }
    
    if (logText.includes('.vercelignore')) {
      return {
        issue: 'vercelignore_issue',
        fix: 'fix_vercelignore'
      };
    }
  }
  
  // If no specific issue found in logs, check common project issues
  log('No specific issue found in logs, checking project structure...');
  
  // Check if index.html exists in dist folder
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync('dist/index.html')) {
    log('Missing dist/index.html - likely build issue');
    return {
      issue: 'missing_build_output',
      fix: 'rebuild_project'
    };
  }
  
  // Check if package.json has correct build script
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.build) {
      return {
        issue: 'missing_build_script',
        fix: 'fix_build_script'
      };
    }
  } catch (error) {
    log(`Error reading package.json: ${error.message}`);
  }
  
  return { issue: 'unknown', fix: 'generic_fix' };
}

async function applyFix(analysis) {
  if (!analysis || !analysis.fix) {
    log('No fix available for this issue', 'WARN');
    return false;
  }
  
  log(`Applying fix: ${analysis.fix}`);
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    switch (analysis.fix) {
      case 'create_index_html':
        // Create a basic index.html in dist folder
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        
        const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple CRM</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
        
        fs.writeFileSync('dist/index.html', indexContent);
        log('Created dist/index.html');
        break;
        
      case 'install_dependencies':
        execSync('npm install', { stdio: 'inherit' });
        log('Installed dependencies');
        break;
        
      case 'fix_build_config':
      case 'rebuild_project':
        // Try to rebuild the project
        log('Running npm run build...');
        execSync('npm run build', { stdio: 'inherit' });
        log('Rebuilt project');
        break;
        
      case 'fix_build_script':
        // Add build script to package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (!packageJson.scripts) packageJson.scripts = {};
        packageJson.scripts.build = 'vite build';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        log('Added build script to package.json');
        
        // Run the build
        execSync('npm run build', { stdio: 'inherit' });
        log('Built project with new script');
        break;
        
      case 'fix_vercelignore':
        // Check and fix .vercelignore
        const vercelIgnorePath = '.vercelignore';
        if (fs.existsSync(vercelIgnorePath)) {
          let content = fs.readFileSync(vercelIgnorePath, 'utf8');
          // Remove any lines that might exclude index.html
          content = content.split('\n').filter(line => !line.includes('index.html')).join('\n');
          fs.writeFileSync(vercelIgnorePath, content);
          log('Fixed .vercelignore');
        }
        break;
        
      case 'generic_fix':
        // Try a comprehensive fix approach
        log('Applying generic fix - rebuilding project...');
        try {
          execSync('npm install', { stdio: 'inherit' });
          execSync('npm run build', { stdio: 'inherit' });
          log('Generic fix applied successfully');
        } catch (error) {
          log(`Generic fix failed: ${error.message}`);
          return false;
        }
        break;
        
      default:
        log(`Unknown fix type: ${analysis.fix}`, 'WARN');
        return false;
    }
    
    return true;
  } catch (error) {
    log(`Failed to apply fix: ${error.message}`, 'ERROR');
    return false;
  }
}

function commitAndPush(message) {
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    execSync('git push origin master', { stdio: 'inherit' });
    log('Successfully pushed changes');
    return true;
  } catch (error) {
    log(`Failed to push changes: ${error.message}`, 'ERROR');
    return false;
  }
}

async function monitorAndFix() {
  log('Starting deployment monitoring and auto-fix...');
  
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    attempts++;
    log(`\n=== Attempt ${attempts}/${maxAttempts} ===`);
    
    // Wait for deployment to process
    log('Waiting for deployment to process...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const deployment = getLatestDeployment();
    if (!deployment) {
      log('Could not get deployment status, retrying...');
      continue;
    }
    
    if (deployment.state === 'READY') {
      log('🎉 Deployment successful!', 'SUCCESS');
      return true;
    }
    
    if (deployment.state === 'BUILDING') {
      log('Deployment is building, waiting...');
      continue;
    }
    
    if (deployment.state === 'ERROR') {
      log('Deployment failed, analyzing...');
      
      const logs = await getDeploymentLogs(deployment.url);
      const failure = await analyzeFailure(logs);
      
      if (failure && failure.fix) {
        log(`Issue identified: ${failure.issue}`);
        
        const fixed = await applyFix(failure);
        if (fixed) {
          const success = commitAndPush(`Fix deployment: ${failure.issue}`);
          if (success) {
            log('Fix applied and pushed, waiting for new deployment...');
            continue;
          }
        }
      } else {
        log('Could not analyze deployment failure', 'ERROR');
      }
      
      log('Could not automatically fix the deployment issue', 'ERROR');
    }
  }
  
  log('Max attempts reached without success', 'ERROR');
  return false;
}

// Start monitoring
(async () => {
  try {
    const success = await monitorAndFix();
    if (success) {
      log('Deployment monitoring completed successfully!');
    } else {
      log('\n=== Monitoring Complete ===');
      log('Maximum attempts reached. Please check the deployment manually.');
      process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  }
})();