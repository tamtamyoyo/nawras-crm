#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentMonitor {
  constructor() {
    this.logFile = path.join(__dirname, '..', 'deployment.log');
    this.startTime = new Date();
    this.stages = [
      'pre-deployment-checks',
      'dependency-installation', 
      'type-checking',
      'linting',
      'building',
      'deployment',
      'post-deployment-verification'
    ];
    this.currentStage = 0;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.deploymentUrl = null;
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    // Append to log file
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  logStage(stageName, status = 'STARTED') {
    const duration = status === 'COMPLETED' ? 
      ` (${((Date.now() - this.stageStartTime) / 1000).toFixed(2)}s)` : '';
    
    this.log(`STAGE: ${stageName} - ${status}${duration}`, 'STAGE');
    
    if (status === 'STARTED') {
      this.stageStartTime = Date.now();
    }
  }

  async executeCommand(command, description, options = {}) {
    this.log(`Executing: ${description}`);
    this.log(`Command: ${command}`);
    
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        ...options
      });
      
      this.log(`✅ ${description} completed successfully`);
      if (result.trim()) {
        this.log(`Output: ${result.trim()}`);
      }
      
      return { success: true, output: result };
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'ERROR');
      if (error.stdout) {
        this.log(`STDOUT: ${error.stdout}`, 'ERROR');
      }
      if (error.stderr) {
        this.log(`STDERR: ${error.stderr}`, 'ERROR');
      }
      
      return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
    }
  }

  async runPreDeploymentChecks() {
    this.logStage('Pre-deployment Checks', 'STARTED');
    
    // Check if required files exist
    const requiredFiles = ['package.json', 'vite.config.ts', 'index.html', 'src/main.tsx'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
      this.log(`✅ Found required file: ${file}`);
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    this.log(`Node.js version: ${nodeVersion}`);
    
    // Check if git is clean (optional)
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        this.log('⚠️  Working directory has uncommitted changes', 'WARN');
      } else {
        this.log('✅ Working directory is clean');
      }
    } catch (error) {
      this.log('⚠️  Could not check git status', 'WARN');
    }
    
    this.logStage('Pre-deployment Checks', 'COMPLETED');
  }

  async installDependencies() {
    this.logStage('Dependency Installation', 'STARTED');
    
    const result = await this.executeCommand(
      'npm ci --silent',
      'Installing dependencies'
    );
    
    if (!result.success) {
      throw new Error(`Dependency installation failed: ${result.error}`);
    }
    
    this.logStage('Dependency Installation', 'COMPLETED');
  }

  async runTypeChecking() {
    this.logStage('Type Checking', 'STARTED');
    
    const result = await this.executeCommand(
      'npm run check',
      'Running TypeScript type checking'
    );
    
    if (!result.success) {
      throw new Error(`Type checking failed: ${result.error}`);
    }
    
    this.logStage('Type Checking', 'COMPLETED');
  }

  async runLinting() {
    this.logStage('Linting', 'STARTED');
    
    const result = await this.executeCommand(
      'npm run lint',
      'Running ESLint'
    );
    
    if (!result.success) {
      this.log('⚠️  Linting issues found, but continuing deployment', 'WARN');
      this.log(`Linting output: ${result.stderr}`, 'WARN');
    }
    
    this.logStage('Linting', 'COMPLETED');
  }

  async buildProject() {
    this.logStage('Building', 'STARTED');
    
    const result = await this.executeCommand(
      'npm run build',
      'Building project'
    );
    
    if (!result.success) {
      throw new Error(`Build failed: ${result.error}`);
    }
    
    // Check if dist folder was created
    if (!fs.existsSync('dist')) {
      throw new Error('Build completed but dist folder not found');
    }
    
    this.log('✅ Build artifacts created successfully');
    this.logStage('Building', 'COMPLETED');
  }

  async deployToVercel() {
    this.logStage('Deployment', 'STARTED');
    
    // Deploy using Vercel CLI
    const result = await this.executeCommand(
      'npx vercel --prod --yes',
      'Deploying to Vercel'
    );
    
    if (!result.success) {
      throw new Error(`Deployment failed: ${result.error}`);
    }
    
    // Extract deployment URL from output
    const urlMatch = result.output.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      this.deploymentUrl = urlMatch[0];
      this.log(`🚀 Deployment URL: ${this.deploymentUrl}`);
    }
    
    this.logStage('Deployment', 'COMPLETED');
  }

  async verifyDeployment() {
    this.logStage('Post-deployment Verification', 'STARTED');
    
    if (!this.deploymentUrl) {
      this.log('⚠️  No deployment URL found, skipping verification', 'WARN');
      this.logStage('Post-deployment Verification', 'COMPLETED');
      return;
    }
    
    try {
      // Simple HTTP check
      const response = await fetch(this.deploymentUrl);
      if (response.ok) {
        this.log(`✅ Deployment verification successful (${response.status})`);
      } else {
        this.log(`⚠️  Deployment responded with status ${response.status}`, 'WARN');
      }
    } catch (error) {
      this.log(`⚠️  Deployment verification failed: ${error.message}`, 'WARN');
    }
    
    this.logStage('Post-deployment Verification', 'COMPLETED');
  }

  async runDeployment() {
    try {
      this.log('🚀 Starting deployment process...');
      this.log(`Retry attempt: ${this.retryCount + 1}/${this.maxRetries + 1}`);
      
      await this.runPreDeploymentChecks();
      await this.installDependencies();
      await this.runTypeChecking();
      await this.runLinting();
      await this.buildProject();
      await this.deployToVercel();
      await this.verifyDeployment();
      
      const totalDuration = ((Date.now() - this.startTime.getTime()) / 1000).toFixed(2);
      this.log(`🎉 Deployment completed successfully in ${totalDuration}s`);
      
      if (this.deploymentUrl) {
        this.log(`🌐 Live URL: ${this.deploymentUrl}`);
      }
      
      return { success: true, url: this.deploymentUrl };
      
    } catch (error) {
      this.log(`💥 Deployment failed: ${error.message}`, 'ERROR');
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.log(`🔄 Retrying deployment (${this.retryCount}/${this.maxRetries})...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return this.runDeployment();
      } else {
        this.log('❌ Maximum retry attempts reached. Deployment failed.', 'ERROR');
        return { success: false, error: error.message };
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: ((Date.now() - this.startTime.getTime()) / 1000).toFixed(2),
      retryCount: this.retryCount,
      deploymentUrl: this.deploymentUrl,
      logFile: this.logFile
    };
    
    const reportPath = path.join(__dirname, '..', 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📊 Deployment report saved to: ${reportPath}`);
    return report;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new DeploymentMonitor();
  
  monitor.runDeployment()
    .then((result) => {
      const report = monitor.generateReport();
      
      if (result.success) {
        console.log('\n✅ Deployment monitoring completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Deployment monitoring failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Deployment monitoring crashed:', error.message);
      process.exit(1);
    });
}

export default DeploymentMonitor;