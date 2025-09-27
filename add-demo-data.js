// Simple script to add demo data to the CRM
import { addDemoData } from './src/utils/demo-data.js';

// Use the mock user ID from offline mode
const mockUserId = 'offline-user-' + Date.now();

console.log('🚀 Adding demo data...');

try {
  await addDemoData(mockUserId);
  console.log('✅ Demo data added successfully!');
} catch (error) {
  console.error('❌ Error adding demo data:', error);
}