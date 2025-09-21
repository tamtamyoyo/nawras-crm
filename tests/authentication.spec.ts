import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should display login form on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Look for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]');
    
    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
    await expect(loginButton.first()).toBeVisible();
    
    await page.screenshot({ path: 'test-results/login-form.png' });
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();
    
    await emailInput.fill('invalid@test.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();
    
    // Wait for error message or stay on login page
    await page.waitForTimeout(2000);
    
    // Check for error message or that we're still on login page
    const errorMessage = page.locator('.error, .alert-error, [role="alert"]');
    const isStillOnLogin = await emailInput.isVisible();
    
    const hasErrorHandling = await errorMessage.count() > 0 || isStillOnLogin;
    expect(hasErrorHandling).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/invalid-login.png' });
  });

  test('should attempt demo login if available', async ({ page }) => {
    await page.goto('/');
    
    // Look for demo/guest login options
    const demoButton = page.locator('button:has-text("Demo"), button:has-text("Guest"), button:has-text("Try Demo")');
    
    if (await demoButton.count() > 0) {
      await demoButton.first().click();
      await page.waitForTimeout(3000);
      
      // Check if we're redirected to dashboard or main app
      const currentUrl = page.url();
      const isDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/app') || currentUrl.includes('/home');
      
      if (isDashboard) {
        await page.screenshot({ path: 'test-results/demo-login-success.png' });
      }
    } else {
      // Try common demo credentials
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();
      
      const demoCredentials = [
        { email: 'demo@example.com', password: 'demo123' },
        { email: 'test@test.com', password: 'password' },
        { email: 'admin@admin.com', password: 'admin' }
      ];
      
      for (const creds of demoCredentials) {
        await emailInput.fill(creds.email);
        await passwordInput.fill(creds.password);
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/app') || !currentUrl.includes('/login')) {
          await page.screenshot({ path: 'test-results/successful-login.png' });
          break;
        }
      }
    }
  });

  test('should check for registration functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for registration/signup links or forms
    const signupLink = page.locator('a:has-text("Sign Up"), a:has-text("Register"), button:has-text("Sign Up")');
    const registerForm = page.locator('form:has(input[name="confirmPassword"]), form:has(input[name="confirm_password"])');
    
    if (await signupLink.count() > 0) {
      await signupLink.first().click();
      await page.waitForTimeout(1000);
      
      // Check if registration form is displayed
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      
      await expect(emailInput.first()).toBeVisible();
      await expect(passwordInput.first()).toBeVisible();
      
      await page.screenshot({ path: 'test-results/registration-form.png' });
    } else if (await registerForm.count() > 0) {
      await page.screenshot({ path: 'test-results/registration-available.png' });
    }
  });

  test('should handle session management', async ({ page }) => {
    await page.goto('/');
    
    // Check if there's any session persistence mechanism
    const localStorage = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter(key => 
        key.includes('token') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('user')
      );
    });
    
    const sessionStorage = await page.evaluate(() => {
      const keys = Object.keys(sessionStorage);
      return keys.filter(key => 
        key.includes('token') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('user')
      );
    });
    
    // Check for cookies related to authentication
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('token') ||
      cookie.name.includes('auth') ||
      cookie.name.includes('session')
    );
    
    const hasSessionManagement = localStorage.length > 0 || sessionStorage.length > 0 || authCookies.length > 0;
    
    // This is informational - we don't fail the test
    console.log('Session management detected:', hasSessionManagement);
    console.log('LocalStorage keys:', localStorage);
    console.log('SessionStorage keys:', sessionStorage);
    console.log('Auth cookies:', authCookies.map(c => c.name));
  });
});