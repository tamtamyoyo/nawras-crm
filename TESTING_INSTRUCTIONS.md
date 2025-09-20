# Nawras CRM - Manual Testing Instructions

## Prerequisites
- Development server running on http://localhost:5174/
- Supabase database configured with sample data
- Browser with developer tools available

## Test Execution Plan

### Phase 1: Authentication Testing

#### 1.1 Registration Test ✅ READY
1. Navigate to registration page at http://localhost:5174/register
2. Fill out registration form:
   - Email: `testuser@nawrascrm.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
   - Full Name: `Test User CRM`
3. Submit form
4. **Expected**: Success message about email verification
5. **Verify**: User should be created in Supabase Auth
6. **Note**: Email verification may be required depending on Supabase settings

#### 1.2 Test User Login
1. Navigate to login page
2. Enter credentials:
   - **Email**: testuser@example.com
   - **Password**: testpass123
3. Submit and verify:
   - ✅ Successful login
   - ✅ Redirect to dashboard
   - ✅ User profile loaded

#### 1.3 Test Form Validation
1. Test empty fields validation
2. Test password mismatch on registration
3. Test invalid email format
4. Test password length requirements

### Phase 2: Navigation Testing

#### 2.1 Main Navigation
Test each navigation item:
1. **Dashboard** - `/dashboard`
2. **Customers** - `/customers`
3. **Leads** - `/leads`
4. **Deals** - `/deals`
5. **Proposals** - `/proposals`
6. **Invoices** - `/invoices`
7. **Analytics** - `/analytics`
8. **Calendar** - `/calendar`
9. **Settings** - `/settings`

For each page, verify:
- ✅ Page loads without errors
- ✅ Proper layout and styling
- ✅ Navigation highlights current page
- ✅ Responsive design on mobile

### Phase 3: CRUD Operations Testing

#### 3.1 Customer Management ✅ READY FOR TESTING
1. Navigate to Customers page at http://localhost:5174/customers
2. **Add Customer Test**:
   - Click "Add Customer" button in header
   - Fill modal form with test data:
     - **Name**: Acme Corporation (required)
     - **Email**: contact@acmecorp.com
     - **Phone**: +1-555-0123
     - **Company**: Acme Corporation
     - **Address**: 123 Business Ave, Tech City, TC 12345
     - **Status**: Active (dropdown selection)
     - **Notes**: Test customer for CRM system validation
   - Click "Add Customer" button
   - **Verify**: Success toast message appears
   - **Verify**: Customer appears in main list with correct data
   - **Verify**: Customer card shows all entered information

3. **Edit Customer Test**:
   - Click Edit button (pencil icon) on the test customer
   - Modify customer data:
     - **Name**: Acme Corporation Ltd
     - **Phone**: +1-555-0124
     - **Status**: Change to "Inactive"
     - **Notes**: Updated test customer information
   - Click "Update Customer" button
   - **Verify**: Success toast message appears
   - **Verify**: Changes are reflected in customer list
   - **Verify**: Status badge color changes appropriately

4. **Search and Filter Test**:
   - Use search box to find customer by name
   - Test status filter dropdown (All, Active, Inactive, Prospect)
   - **Verify**: Search results update in real-time
   - **Verify**: Filters work correctly

5. **Delete Customer Test**:
   - Click Delete button (trash icon) on test customer
   - Confirm deletion in browser alert
   - **Verify**: Success toast message appears
   - **Verify**: Customer is removed from list
   - **Verify**: Database persistence (customer should not reappear on page refresh)

#### 3.2 Lead Management ✅ READY FOR TESTING
1. Navigate to Leads page at http://localhost:5174/leads
2. **Add Lead Test**:
   - Click "Add Lead" button in header
   - Fill modal form with test data:
     - **Name**: TechCorp Solutions (required)
     - **Email**: contact@techcorp.com
     - **Phone**: +1-555-0456
     - **Company**: TechCorp Solutions
     - **Title**: IT Director
     - **Source**: Website (dropdown selection)
     - **Status**: New (dropdown selection)
     - **Lead Score**: 75 (0-100 range)
     - **Notes**: Interested in enterprise software solutions
   - Click "Add Lead" button
   - **Verify**: Success toast message appears
   - **Verify**: Lead appears in main list with correct data
   - **Verify**: Status badge shows "New" with blue color
   - **Verify**: Lead score displays with appropriate color (green for 75)

3. **Edit Lead Test**:
   - Click Edit button (pencil icon) on the test lead
   - Modify lead data:
     - **Status**: Change to "Contacted"
     - **Lead Score**: Change to 85
     - **Notes**: Add "Follow-up call scheduled for next week"
   - Click "Update Lead" button
   - **Verify**: Success toast message appears
   - **Verify**: Status badge changes to "Contacted" with yellow color
   - **Verify**: Lead score updates and color changes appropriately

4. **Search and Filter Test**:
   - Use search box to find lead by name, email, or company
   - Test status filter dropdown (All Status, New, Contacted, Qualified, Unqualified, Converted)
   - Test source filter dropdown (All Sources, Website, Referral, Social Media, etc.)
   - **Verify**: Search results update in real-time
   - **Verify**: Filters work correctly and can be combined

5. **Lead Conversion Test**:
   - Edit the test lead and change status to "Qualified"
   - **Verify**: "Convert to Customer" button appears
   - Click "Convert to Customer" button
   - **Verify**: Success toast message appears
   - **Verify**: Lead status changes to "Converted" with purple badge
   - Navigate to Customers page
   - **Verify**: New customer record created with lead data
   - **Verify**: Customer notes include "Converted from lead" message

6. **Delete Lead Test**:
   - Click Delete button (trash icon) on test lead
   - Confirm deletion in browser alert
   - **Verify**: Success toast message appears
   - **Verify**: Lead is removed from list
   - **Verify**: Database persistence (lead should not reappear on page refresh)

#### 3.3 Deal Pipeline Testing ✅ READY FOR TESTING

**Status:** 🔄 IN PROGRESS

**URL:** `/deals`

**Test Data:**
- Deal 1: "Enterprise Software License" - Customer: Any existing - Value: $50,000 - Stage: "Lead" - Probability: 25%
- Deal 2: "Marketing Campaign" - Customer: Any existing - Value: $15,000 - Stage: "Qualified" - Probability: 50%
- Deal 3: "Consulting Services" - Customer: Any existing - Value: $25,000 - Stage: "Proposal" - Probability: 75%

**Pipeline Stages to Test:**
- Lead → Qualified → Proposal → Negotiation → Closed Won/Lost

**Detailed Test Steps:**

**A. Pipeline Overview Testing:**
1. Navigate to `/deals`
2. Verify all 6 pipeline stages are displayed with correct titles
3. Check pipeline statistics cards show: Total Deals, Pipeline Value, Won Deals
4. Verify each stage column shows deal count and total value

**B. Add New Deal Testing:**
1. Click "Add Deal" button
2. Fill form with test data (all required fields: title, customer)
3. Test form validation (try submitting without required fields)
4. Submit and verify deal appears in correct stage
5. Check pipeline statistics update correctly

**C. Edit Deal Testing:**
1. Click edit button on any deal card
2. Modify deal details (title, value, probability, stage, notes)
3. Save changes and verify updates are reflected
4. Test canceling edit without saving

**D. Drag-and-Drop Testing:**
1. Drag a deal from "Lead" to "Qualified" stage
2. Verify deal moves and stage updates in database
3. Check success toast notification appears
4. Test dragging between multiple stages
5. Verify pipeline statistics update after moves
6. Test drag overlay visual feedback

**E. Delete Deal Testing:**
1. Click delete button on deal card
2. Confirm deletion in popup dialog
3. Verify deal is removed from pipeline
4. Check pipeline statistics update correctly
5. Test canceling deletion

**F. Deal Card Information Testing:**
1. Verify deal cards display: title, customer name, value, close date, probability
2. Check action buttons (edit, delete, drag handle) are functional
3. Test hover effects and visual feedback

**Verification Checklist:**
- [ ] All 6 pipeline stages visible and properly labeled
- [ ] Pipeline statistics (Total Deals, Pipeline Value, Won Deals) display correctly
- [ ] Add deal form validation works (required fields)
- [ ] New deals appear in correct stage after creation
- [ ] Edit deal functionality updates all fields properly
- [ ] Drag-and-drop between stages works smoothly
- [ ] Deal stage updates persist in database after drag-and-drop
- [ ] Delete confirmation dialog appears and functions correctly
- [ ] Pipeline statistics update after all CRUD operations
- [ ] Deal cards display all information correctly
- [ ] Toast notifications appear for all actions
- [ ] Loading states display during operations
- [ ] Responsive design works on different screen sizes

#### 3.4 Proposals Management ✅ READY FOR TESTING

**Test Data Setup**
Before testing proposals, ensure you have:
- At least 2-3 deals created (from previous testing)
- Customers associated with those deals
- Test proposal templates available

**3.4.1 Proposal Creation Testing**
**Steps:**
1. Navigate to Proposals page at http://localhost:5174/proposals
2. Click "Add Proposal" button
3. Fill in proposal form:
   - Title: "Website Development Proposal"
   - Deal: Select from dropdown (should show existing deals with customer names)
   - Status: Leave as "Draft"
   - Valid Until: Set to 30 days from today
   - Template: Select "Service Proposal" template (if available)
   - Content: Verify template content loads automatically
4. Click "Create Proposal"

**Verification:**
- Proposal appears in proposals list
- Status shows as "Draft"
- Deal relationship is correctly displayed
- Valid until date is shown
- Content is saved properly

**3.4.2 Proposal Templates Testing**
**Steps:**
1. Create new proposal
2. Test each available template:
   - Select "Service Proposal" template
   - Verify content auto-fills in textarea
   - Select "Product Proposal" template
   - Verify content changes appropriately
   - Select "Custom Proposal" template
3. Modify template content before saving
4. Create proposal with modified content

**Verification:**
- Template selection updates content field
- Content is editable after template selection
- Final proposal saves custom content

**3.4.3 Proposal Status Management**
**Steps:**
1. Create proposal with "Draft" status
2. Use "Send" button to change status to "Sent"
3. Edit proposal and change status to "Accepted"
4. Create another proposal and set status to "Rejected"
5. Test filtering by status using filter dropdown

**Verification:**
- Status updates correctly in database
- "Send" button only appears for draft proposals
- Status badges display correct colors
- Filtering works for each status
- Stats cards update with status changes

**3.4.4 Proposal Viewing and Editing**
**Steps:**
1. Click "View" (eye icon) on any proposal
2. Verify proposal content displays in modal
3. Check status badge and close modal
4. Click "Edit" (pencil icon) on same proposal
5. Modify title and content
6. Update status and valid until date
7. Save changes

**Verification:**
- View modal shows formatted content
- Edit modal pre-fills all fields correctly
- Changes are saved and reflected in list
- Template dropdown is hidden in edit mode

**3.4.5 Proposal Deletion**
**Steps:**
1. Click "Delete" (trash icon) on a test proposal
2. Confirm deletion in any confirmation dialog
3. Verify proposal is removed from list

**Verification:**
- Proposal is permanently deleted
- List updates immediately
- Stats cards reflect the change

**3.4.6 Deal-Proposal Integration**
**Steps:**
1. Create proposal linked to specific deal
2. Navigate to Deals page
3. Verify deal shows proposal relationship (if displayed)
4. Return to Proposals page
5. Verify deal information shows in proposal card

**Verification:**
- Deal dropdown shows all available deals
- Customer name appears with deal in dropdown
- Proposal card displays deal and customer info
- Relationship is maintained in database

**3.4.7 Search and Filtering**
**Steps:**
1. Create multiple proposals with different titles and statuses
2. Use search bar to find specific proposals
3. Test status filter dropdown
4. Test combination of search and filter

**Verification:**
- Search finds proposals by title
- Status filter shows only matching proposals
- Combined search and filter works correctly
- "Clear filters" resets to show all proposals

**3.4.8 Proposals Statistics**
**Verification Points:**
- Total Proposals count is accurate
- Sent Proposals count matches filtered view
- Accepted Proposals count is correct
- Acceptance Rate calculation is accurate (accepted/sent * 100)
- Stats update in real-time with changes

#### 3.5 Invoice Management ✅ READY FOR TESTING

**Test Data Setup**
- Ensure you have deals and customers created from previous tests
- Note invoice numbering system (auto-generated: INV-001, INV-002, etc.)
- Available statuses: Draft, Sent, Paid, Overdue
- Payment terms: Net 15, Net 30, Net 45, Net 60, Due on Receipt

**Test Steps**

**A. Invoice Creation**
1. **Navigate to Invoices page**:
   - Click "Invoices" in sidebar
   - Verify page loads with invoice list
   - Check stats cards (Total Invoices, Paid, Overdue, Total Revenue)

2. **Create New Invoice**:
   - Click "Create Invoice" button
   - Fill in invoice details:
     - Invoice number (auto-generated)
     - Select deal from dropdown
     - Set status (Draft/Sent/Paid)
     - Choose payment terms
     - Set due date
   - Add invoice line items:
     - Click "Add Item" button
     - Enter description, quantity, rate
     - Verify amount calculation (quantity × rate)
     - Add multiple items
   - Set tax rate and verify calculations:
     - Enter tax percentage
     - Check subtotal calculation
     - Verify tax amount calculation
     - Confirm total amount (subtotal + tax)
   - Add notes (optional)
   - Click "Create Invoice"

**B. Invoice Management**
1. **View Invoice Details**:
   - Click "View" button on invoice card
   - Verify all invoice information displays correctly
   - Check invoice items table
   - Verify totals and calculations
   - Review deal and customer information

2. **Edit Invoice**:
   - Click "Edit" button on invoice card
   - Modify invoice details:
     - Change deal selection
     - Update status
     - Modify payment terms
     - Adjust due date
   - Edit line items:
     - Modify existing items
     - Add new items
     - Remove items (verify minimum 1 item)
   - Update tax rate and verify recalculations
   - Save changes

3. **Status Management**:
   - Test status updates using status buttons:
     - Draft → Sent
     - Sent → Paid
   - Verify status colors and labels
   - Check overdue detection for past due dates

4. **Invoice Deletion**:
   - Click "Delete" button on invoice card
   - Confirm deletion in dialog
   - Verify invoice removed from list
   - Check stats update after deletion

**C. Search and Filtering**
1. **Search Functionality**:
   - Use search bar to find invoices by:
     - Invoice number
     - Deal title
     - Customer name
   - Verify real-time search results

2. **Status Filtering**:
   - Use status filter dropdown
   - Test each status filter (All, Draft, Sent, Paid, Overdue)
   - Verify filtered results

**D. Deal Integration**
1. **Deal-Invoice Relationship**:
   - Verify deal selection shows correct deals
   - Check customer information auto-populates from deal
   - Test invoice creation from different deals

**E. Statistics and Calculations**
1. **Stats Cards Verification**:
   - Check total invoices count
   - Verify paid invoices count
   - Confirm overdue invoices count
   - Validate total revenue calculation

2. **Tax Calculations**:
   - Test different tax rates (0%, 5%, 10%, 15%)
   - Verify calculations with multiple line items
   - Check rounding accuracy

**Verification Checklist:**
- [ ] Invoice creation with auto-generated numbers
- [ ] Line items addition/removal functionality
- [ ] Tax calculations accuracy (subtotal, tax, total)
- [ ] Status updates and color coding
- [ ] Invoice editing and data persistence
- [ ] Invoice deletion with confirmation
- [ ] Search functionality across invoice data
- [ ] Status filtering works correctly
- [ ] Deal-customer relationship display
- [ ] Statistics cards show accurate data
- [ ] Overdue detection for past due dates
- [ ] Payment terms selection and display
- [ ] Notes field functionality
- [ ] View modal displays complete invoice details
- [ ] Data persists after page refresh
- [ ] Loading states during operations
- [ ] Error handling for invalid data

### Phase 4: Dashboard Functionality ✅ READY FOR TESTING

#### 4.1 Dashboard Overview Testing

**URL:** `/` (Dashboard)

**Prerequisites:**
- Ensure you have created customers, leads, deals, and invoices from previous tests
- Dashboard displays real-time data from all modules

**Test Steps:**

**A. Dashboard Loading and Layout**
1. Navigate to Dashboard (home page)
2. Verify page loads without errors
3. Check welcome message displays user name/email
4. Verify responsive layout on different screen sizes
5. Confirm loading state appears briefly during data fetch

**B. Statistics Cards Testing**
1. **Total Customers Card**:
   - Verify count matches actual customers created
   - Check blue Users icon displays
   - Verify "+12% from last month" text appears

2. **Active Deals Card**:
   - Verify count excludes closed_won and closed_lost deals
   - Check green TrendingUp icon displays
   - Verify "+8% from last month" text appears

3. **Revenue Card**:
   - Verify amount shows sum of closed_won deals
   - Check purple DollarSign icon displays
   - Verify "+23% from last month" text appears
   - Test currency formatting ($X,XXX)

4. **New Leads Card**:
   - Verify count shows leads with "new" status
   - Check orange Calendar icon displays
   - Verify "+5 from last month" text appears

**C. Charts and Data Visualization**
1. **Monthly Revenue Chart (Line Chart)**:
   - Verify chart renders without errors
   - Check data shows last 6 months
   - Test tooltip functionality on hover
   - Verify revenue calculation from closed deals
   - Check chart responsiveness

2. **Deals by Stage Chart (Bar Chart)**:
   - Verify all deal stages are represented
   - Check stage names are properly formatted
   - Test tooltip shows correct counts
   - Verify data matches actual deal distribution

3. **Leads by Source Chart (Pie Chart)**:
   - Verify pie chart renders with colors
   - Check source labels and counts display
   - Test tooltip functionality
   - Verify "Unknown" appears for leads without source
   - Check color variety (5 different colors)

**D. Quick Actions Testing**
1. **Navigation Buttons**:
   - Click "Add Customer" → should navigate to /customers
   - Click "Add Lead" → should navigate to /leads
   - Click "Create Deal" → should navigate to /deals
   - Click "Create Proposal" → should navigate to /proposals
   - Verify all buttons have appropriate icons
   - Test button hover states

**E. System Overview Testing**
1. **Recent Activity Section**:
   - Verify displays current system statistics
   - Check customer count message
   - Check deals count message
   - Check leads count message
   - Check invoices count message
   - Verify "Current" timestamp for all items
   - Check blue dot indicators

**F. Real-time Data Updates**
1. **Data Synchronization**:
   - Create new customer → return to dashboard → verify count updated
   - Create new deal → verify Active Deals and charts update
   - Create new lead → verify New Leads count updates
   - Create new invoice → verify system overview updates
   - Close a deal as won → verify Revenue card updates

**G. Error Handling**
1. **Network Issues**:
   - Test dashboard behavior with network interruption
   - Verify error toast appears on data load failure
   - Check loading state handling

**Verification Checklist:**
- [ ] Dashboard loads quickly and displays welcome message
- [ ] All 4 statistics cards show accurate real-time data
- [ ] Statistics cards have correct icons and colors
- [ ] Monthly Revenue line chart renders and shows 6 months
- [ ] Deals by Stage bar chart displays all pipeline stages
- [ ] Leads by Source pie chart shows colorful distribution
- [ ] All chart tooltips work on hover
- [ ] Quick action buttons navigate to correct pages
- [ ] System overview shows current counts for all modules
- [ ] Dashboard updates when data changes in other modules
- [ ] Responsive design works on mobile and desktop
- [ ] Loading states appear during data fetching
- [ ] Error handling works for failed data loads
- [ ] Currency formatting displays correctly ($X,XXX)
- [ ] Stage names are properly formatted (Title Case)
- [ ] Charts are responsive and scale properly

### Phase 5: Error Handling & Edge Cases

#### 5.1 Form Validation
1. Test required field validation
2. Test email format validation
3. Test numeric field validation
4. Test date field validation

#### 5.2 Loading States
1. Verify loading spinners during API calls
2. Test loading states on page navigation
3. Verify skeleton loaders where applicable

#### 5.3 Error Messages
1. Test network error handling
2. Test validation error display
3. Test success message display

### Phase 6: Role-Based Access Control

#### 6.1 User Permissions
1. Test data visibility based on user role
2. Test edit permissions
3. Test delete permissions
4. Test admin-only features

### Phase 7: Responsive Design

#### 7.1 Mobile Testing
1. Test on mobile viewport (375px)
2. Verify navigation menu collapse
3. Test form usability on mobile
4. Verify table responsiveness

#### 7.2 Tablet Testing
1. Test on tablet viewport (768px)
2. Verify layout adjustments
3. Test touch interactions

## Test Results Documentation

For each test:
- ✅ **PASS** - Feature works as expected
- ❌ **FAIL** - Feature has issues (document details)
- ⚠️ **PARTIAL** - Feature works with minor issues
- 🚫 **BLOCKED** - Cannot test due to dependencies

## Common Issues to Watch For

1. **Console Errors**: Check browser console for JavaScript errors
2. **Network Failures**: Monitor network tab for failed API calls
3. **Memory Leaks**: Watch for performance degradation
4. **Data Persistence**: Verify data survives page refresh
5. **Cross-browser Compatibility**: Test in Chrome, Firefox, Safari

## Post-Test Actions

1. Document all findings in TEST_REPORT.md
2. Create bug reports for any issues found
3. Verify test data cleanup
4. Update test coverage metrics

## Emergency Procedures

- If application crashes: Check console errors and server logs
- If database issues: Verify Supabase connection and RLS policies
- If authentication fails: Check Supabase Auth configuration

---

**Note**: This testing should be performed systematically, documenting each step's results. Take screenshots of any issues encountered for debugging purposes.