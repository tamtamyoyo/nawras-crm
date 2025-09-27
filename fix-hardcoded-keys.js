#!/usr/bin/env node
/**
 * Script to remove hardcoded API keys from all test files
 * This addresses the critical security vulnerability identified in the audit
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Files that need to be updated (excluding ones already fixed)
const filesToUpdate = [
  'test-operations.mjs',
  'test-direct-insert.js',
  'debug-connection.js',
  'test-auth-status.js',
  'test-frontend-customer.js',
  'check-triggers-functions.js',
  'test-simple-customer-insert.js',
  'test-auth-state.js',
  'test-raw-insert.js',
  'test-customer-save.js',
  'test-crud-operations.js',
  'test-customer-crud.js',
  'test-customer-insert.js',
  'test-connection.js',
  'comprehensive-proposals-test.mjs',
  'debug-database-issue.js',
  'scripts/update-test-user.js',
  'scripts/create-test-user.js'
]

// Patterns to replace
const patterns = [
  {
    // Pattern 1: Standard import and hardcoded values
    search: /import \{ createClient \} from '@supabase\/supabase-js'[\s\S]*?const supabase = createClient\(supabaseUrl, supabase(?:Anon)?Key\)/g,
    replace: "import { supabase } from './test-config.js'"
  },
  {
    // Pattern 2: Just the hardcoded URL and key lines
    search: /const supabaseUrl = 'https:\/\/ayxrdxjwyjhthkimtdja\.supabase\.co'[\s\S]*?const supabase(?:Anon)?Key = 'eyJ[^']*'/g,
    replace: '// Supabase configuration moved to test-config.js'
  }
]

function updateFile(filePath) {
  try {
    console.log(`🔧 Updating ${filePath}...`)
    
    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false
    
    // Check if file contains hardcoded keys
    if (content.includes('ayxrdxjwyjhthkimtdja.supabase.co')) {
      // Replace import and client creation
      if (content.includes("import { createClient } from '@supabase/supabase-js'")) {
        // Find the entire block from import to client creation
        const importMatch = content.match(/import \{ createClient \} from '@supabase\/supabase-js'[\s\S]*?const supabase = createClient\([^)]+\)/)
        if (importMatch) {
          content = content.replace(importMatch[0], "import { supabase } from './test-config.js'")
          updated = true
        }
      }
      
      // Remove any remaining hardcoded URLs and keys
      content = content.replace(/const supabaseUrl = 'https:\/\/ayxrdxjwyjhthkimtdja\.supabase\.co'[\s\n]*/g, '')
      content = content.replace(/const supabase(?:Anon)?Key = 'eyJ[^']*'[\s\n]*/g, '')
      
      // Clean up extra whitespace
      content = content.replace(/\n\n\n+/g, '\n\n')
      
      if (updated || content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content)
        console.log(`✅ Updated ${filePath}`)
        return true
      }
    }
    
    console.log(`ℹ️  No changes needed for ${filePath}`)
    return false
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
}

function main() {
  console.log('🚀 Starting batch update of test files to remove hardcoded API keys...')
  console.log('📋 Files to process:', filesToUpdate.length)
  
  let updatedCount = 0
  let errorCount = 0
  
  for (const file of filesToUpdate) {
    const filePath = path.join(__dirname, file)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      continue
    }
    
    try {
      if (updateFile(filePath)) {
        updatedCount++
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message)
      errorCount++
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`✅ Files updated: ${updatedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📁 Total processed: ${filesToUpdate.length}`)
  
  if (updatedCount > 0) {
    console.log('\n🔒 Security improvement: Hardcoded API keys have been removed!')
    console.log('⚠️  Remember to:')
    console.log('   1. Set environment variables before running tests')
    console.log('   2. Revoke the exposed API keys in Supabase dashboard')
    console.log('   3. Generate new API keys for production')
  }
}

main()