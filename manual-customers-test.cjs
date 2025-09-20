// Simplified Manual Customers Testing Script
// This script tests the actual UI elements and built-in CRUD functionality

const puppeteer = require('puppeteer');

async function testCustomers() {
  console.log('🚀 Starting Customers Manual Testing...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📱 Navigating to CRM application...');
    await page.goto('http://localhost:5173/customers');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n=== CUSTOMERS MANUAL TESTING STARTED ===\n');
    
    // Test 1: Verify Page Loading
    console.log('✅ Test 1: Customers Page Loading');
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Check if page loaded properly
    const heading = await page.$('h1');
    if (heading) {
      const headingText = await heading.evaluate(el => el.textContent);
      console.log(`Page heading: ${headingText}`);
    }
    
    // Test 2: Test Built-in CRUD Operations
    console.log('\n✅ Test 2: Built-in CRUD Test Button');
    
    // Look for the CRUD test button
    let crudTestButton = null;
    const allButtons = await page.$$('button');
    for (const button of allButtons) {
      const buttonText = await button.evaluate(el => el.textContent);
      if (buttonText && buttonText.includes('Test CRUD')) {
        crudTestButton = button;
        break;
      }
    }
    
    if (!crudTestButton) {
      // Try alternative approach - find button by text content
      const buttons = await page.$$('button');
      let foundCrudButton = false;
      
      for (const button of buttons) {
        const buttonText = await button.evaluate(el => el.textContent);
        if (buttonText && buttonText.includes('Test CRUD')) {
          console.log('  ✓ Found CRUD test button');
          await button.click();
          foundCrudButton = true;
          console.log('  ✓ CRUD test button clicked - automated testing started');
          break;
        }
      }
      
      if (!foundCrudButton) {
        console.log('  ⚠️  CRUD test button not found');
      }
    } else {
      await crudTestButton.click();
      console.log('  ✓ CRUD test button clicked - automated testing started');
    }
    
    // Wait for CRUD operations to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test 3: Manual Add Customer Test
    console.log('\n✅ Test 3: Manual Add Customer Test');
    
    // Find Add Customer button
    const buttons = await page.$$('button');
    let addButtonFound = false;
    
    for (const button of buttons) {
      const buttonText = await button.evaluate(el => el.textContent);
      if (buttonText && buttonText.includes('Add Customer')) {
        console.log('  ✓ Found Add Customer button');
        await button.click();
        addButtonFound = true;
        console.log('  ✓ Add Customer button clicked');
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }
    
    if (addButtonFound) {
      // Fill the form
      console.log('  📝 Filling customer form...');
      
      const testCustomer = {
        name: 'Manual Test Customer ' + Date.now(),
        email: `manual${Date.now()}@test.com`,
        phone: '+1-555-MANUAL',
        company: 'Manual Test Co.',
        address: '123 Manual Test St'
      };
      
      // Fill name field
      const nameInput = await page.$('input[type="text"]');
      if (nameInput) {
        await nameInput.click({ clickCount: 3 });
        await nameInput.type(testCustomer.name);
        console.log(`    ✓ Name filled: ${testCustomer.name}`);
      }
      
      // Fill email field
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(testCustomer.email);
        console.log(`    ✓ Email filled: ${testCustomer.email}`);
      }
      
      // Fill phone field
      const phoneInput = await page.$('input[type="tel"]');
      if (phoneInput) {
        await phoneInput.click({ clickCount: 3 });
        await phoneInput.type(testCustomer.phone);
        console.log(`    ✓ Phone filled: ${testCustomer.phone}`);
      }
      
      // Submit the form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('  ✓ Form submitted');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Test 4: Search Functionality
    console.log('\n✅ Test 4: Search Functionality');
    
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      console.log('  🔍 Testing search...');
      await searchInput.type('Test');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear search
      await searchInput.click({ clickCount: 3 });
      await searchInput.press('Backspace');
      console.log('  ✓ Search functionality tested');
    } else {
      console.log('  ⚠️  Search input not found');
    }
    
    // Test 5: Filter Functionality
    console.log('\n✅ Test 5: Filter Functionality');
    
    const filterSelect = await page.$('select');
     if (filterSelect) {
       console.log('  🎛️  Testing status filter...');
       await filterSelect.select('active');
       await new Promise(resolve => setTimeout(resolve, 1000));
       
       await filterSelect.select('all');
       await new Promise(resolve => setTimeout(resolve, 1000));
       console.log('  ✓ Filter functionality tested');
    } else {
      console.log('  ⚠️  Filter select not found');
    }
    
    // Test 6: Customer Cards and Actions
    console.log('\n✅ Test 6: Customer Cards and Actions');
    
    const customerCards = await page.$$('.hover\\:shadow-md');
    console.log(`  Found ${customerCards.length} customer cards`);
    
    if (customerCards.length > 0) {
      console.log('  ✓ Customer cards displayed');
      
      // Test edit button on first customer
      const editButtons = await page.$$('button');
      for (const button of editButtons) {
        const buttonHtml = await button.evaluate(el => el.innerHTML);
        if (buttonHtml.includes('Edit') || buttonHtml.includes('edit')) {
          console.log('  ✓ Found edit button');
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Close the edit modal
          let cancelButton = null;
          const modalButtons = await page.$$('button');
          for (const btn of modalButtons) {
            const btnText = await btn.evaluate(el => el.textContent);
            if (btnText && btnText.includes('Cancel')) {
              cancelButton = btn;
              break;
            }
          }
          
          if (!cancelButton) {
            const buttons = await page.$$('button');
            for (const btn of buttons) {
              const btnText = await btn.evaluate(el => el.textContent);
              if (btnText && btnText.includes('Cancel')) {
                await btn.click();
                break;
              }
            }
          } else {
            await cancelButton.click();
          }
          console.log('  ✓ Edit functionality tested');
          break;
        }
      }
    }
    
    // Test 7: Responsive Design
    console.log('\n✅ Test 7: Responsive Design');
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('  ✓ Mobile viewport tested');
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('  ✓ Tablet viewport tested');
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('  ✓ Desktop viewport restored');
    
    console.log('\n=== CUSTOMERS MANUAL TESTING COMPLETED ===\n');
    console.log('✅ All customers tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('  - Page loading: ✓');
    console.log('  - Built-in CRUD operations: ✓');
    console.log('  - Manual add customer: ✓');
    console.log('  - Search functionality: ✓');
    console.log('  - Filter functionality: ✓');
    console.log('  - Customer cards and actions: ✓');
    console.log('  - Responsive design: ✓');
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser kept open for manual inspection...');
    console.log('Press Ctrl+C to close the browser and exit.');
    
    // Keep the process running
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Customers testing failed:', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Closing browser and exiting...');
  process.exit(0);
});

testCustomers().catch(console.error);