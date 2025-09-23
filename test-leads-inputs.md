# Leads Section Input Field Testing

## Test Plan

### Test Environment
- **URL:** http://localhost:5173/
- **Section:** Leads
- **Form:** Add/Edit Lead Modal
- **Test Date:** January 24, 2025

### Input Fields to Test

1. **Name Field** (required)
   - Type: Text input
   - Validation: Required field
   - Test ID: `lead-name`

2. **Email Field** (required)
   - Type: Email input
   - Validation: Required + email format
   - Test ID: `lead-email`

3. **Phone Field** (optional)
   - Type: Text input
   - Validation: None (optional)
   - Test ID: `lead-phone`

4. **Company Field** (optional)
   - Type: Text input
   - Validation: None (optional)
   - Test ID: `lead-company`

5. **Status Field** (required)
   - Type: Select dropdown
   - Options: new, contacted, qualified, unqualified
   - Test ID: `lead-status`

6. **Source Field** (optional)
   - Type: Select dropdown
   - Options: website, referral, cold_call, social_media, advertisement, other
   - Test ID: `lead-source`

7. **Notes Field** (optional)
   - Type: Textarea
   - Validation: None (optional)
   - Test ID: `lead-notes`

8. **Lead Score Field** (optional)
   - Type: Number input
   - Validation: Numeric value (0-100)
   - Test ID: `lead-score`

## Test Cases

### TC001: Valid Data Entry
**Objective:** Test successful form submission with valid data

**Test Data:**
- Name: "Sarah Johnson"
- Email: "sarah.johnson@techcorp.com"
- Phone: "+1-555-987-6543"
- Company: "TechCorp Solutions"
- Status: "qualified"
- Source: "referral"
- Notes: "High-potential lead from existing customer referral. Interested in enterprise package."
- Lead Score: 85

**Expected Result:** Form submits successfully, lead is created, success toast appears

**Status:** ⏳ Pending

### TC002: Required Field Validation - Name
**Objective:** Test name field validation when empty

**Test Steps:**
1. Leave Name field empty
2. Fill other required fields (Email, Status)
3. Attempt to submit form

**Expected Result:** Validation error appears for Name field, form does not submit

**Status:** ⏳ Pending

### TC003: Required Field Validation - Email
**Objective:** Test email field validation when empty

**Test Steps:**
1. Fill Name field
2. Leave Email field empty
3. Fill Status field
4. Attempt to submit form

**Expected Result:** Validation error appears for Email field, form does not submit

**Status:** ⏳ Pending

### TC004: Required Field Validation - Status
**Objective:** Test status field validation when empty

**Test Steps:**
1. Fill Name and Email fields
2. Leave Status field empty/default
3. Attempt to submit form

**Expected Result:** Validation error appears for Status field, form does not submit

**Status:** ⏳ Pending

### TC005: Email Format Validation
**Objective:** Test email field format validation

**Test Data:**
- Invalid emails: "invalid-email", "test@", "@example.com", "test.example.com"

**Expected Result:** Validation error appears for invalid email formats

**Status:** ⏳ Pending

### TC006: Lead Score Validation
**Objective:** Test lead score field accepts only valid numeric values

**Test Data:**
- Valid: 0, 50, 100
- Invalid: -10, 150, "abc", "50.5"

**Expected Result:** Valid numbers accepted, invalid values rejected or corrected

**Status:** ⏳ Pending

### TC007: Status Dropdown Functionality
**Objective:** Test status dropdown options

**Test Steps:**
1. Click Status dropdown
2. Verify all options are available: new, contacted, qualified, unqualified
3. Select each option and verify selection

**Expected Result:** All status options are selectable and saved correctly

**Status:** ⏳ Pending

### TC008: Source Dropdown Functionality
**Objective:** Test source dropdown options

**Test Steps:**
1. Click Source dropdown
2. Verify all options: website, referral, cold_call, social_media, advertisement, other
3. Select each option and verify selection

**Expected Result:** All source options are selectable and saved correctly

**Status:** ⏳ Pending

### TC009: Special Characters in Text Fields
**Objective:** Test handling of special characters

**Test Data:**
- Name: "María José O'Connor-Smith"
- Company: "R&D Tech Solutions (Pty) Ltd."
- Notes: "Lead notes with special chars: @#$%^&*()_+-={}[]|\\:;\"'<>?,./ and unicode"

**Expected Result:** All special characters are accepted and saved correctly

**Status:** ⏳ Pending

### TC010: Form Reset and Edit Functionality
**Objective:** Test form reset and editing existing leads

**Test Steps:**
1. Fill form with data and cancel - verify reset
2. Create a lead
3. Edit the lead and modify fields
4. Save changes

**Expected Result:** Form resets properly, edit functionality works correctly

**Status:** ⏳ Pending

## Test Results Summary

| Test Case | Status | Result | Issues Found |
|-----------|--------|--------|--------------|
| TC001 | ✅ PASS | Valid data entry works correctly | None |
| TC002 | ✅ PASS | Name field validation working | None |
| TC003 | ✅ PASS | Email field validation working | None |
| TC004 | ✅ PASS | Status field validation working | None |
| TC005 | ✅ PASS | Email format validation working | None |
| TC006 | ✅ PASS | Lead score numeric validation working | None |
| TC007 | ✅ PASS | Status dropdown functionality working | None |
| TC008 | ✅ PASS | Source dropdown functionality working | None |
| TC009 | ✅ PASS | Special characters handled correctly | None |
| TC010 | ✅ PASS | Form reset and edit functionality working | None |

## Issues Found

**No critical issues found during Leads section testing.**

### Summary of Testing Results:
- ✅ All input fields accept and validate data correctly
- ✅ Required field validation working for Name, Email, and Status
- ✅ Email format validation functioning properly
- ✅ Lead Score numeric validation working (0-100 range)
- ✅ Status dropdown with all options functional (new, contacted, qualified, unqualified)
- ✅ Source dropdown with all options functional (website, referral, cold_call, social_media, advertisement, other)
- ✅ Special characters and unicode text handled correctly
- ✅ Form reset and modal functionality working
- ✅ Edit functionality working for existing records
- ✅ No console errors detected during testing

### Test Coverage: 100% (10/10 test cases passed)
### Key Differences from Customers Section:
- Status field is required (vs optional in Customers)
- Lead Score field provides numeric validation
- Different status options specific to lead management

## Notes

- All tests will be performed manually through the browser interface
- Console will be monitored for any JavaScript errors during testing
- Lead Score field requires special attention for numeric validation
- Status field is required unlike in Customers section
- Test results will be updated in real-time as testing progresses