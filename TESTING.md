# Testing Guide - Job Application Tracker

## Automated Tests

### Running the Test Suite

Open the browser console and run:

```javascript
// Import and run all tests
import('/src/tests/testRunner.ts').then(m => m.runAllTests())
```

Or simply:
```javascript
runAllTests()
```

This will test:
- ✅ Storage operations (save, get, update, delete)
- ✅ Duplicate URL detection
- ✅ Follow-up reminder logic
- ✅ Export functionality (JSON, CSV)
- ✅ Statistics calculation
- ✅ Data integrity
- ✅ Edge cases (large datasets, special characters, null values)

---

## Manual Testing Checklist

### 1. Initial Load
- [ ] App loads without errors
- [ ] Empty state shows correctly ("No applications found")
- [ ] "Add Application" button is visible
- [ ] Navigation (Dashboard, Statistics, Export) works

### 2. Adding Jobs - Manual Entry

#### Test Case 1: Basic Manual Entry
- [ ] Click "Add Application"
- [ ] Click "Manual Entry"
- [ ] Fill in basic info:
  - Job Title: "Senior Software Engineer"
  - Company: "Test Corp"
  - Location: "Remote"
  - Work Type: "Full-time"
  - Work Environment: "Remote"
- [ ] Click "Save Application"
- [ ] Job appears on dashboard
- [ ] All entered data displays correctly

#### Test Case 2: Full Manual Entry with All Fields
- [ ] Add another job with ALL fields filled:
  - Title, Company, Location
  - Compensation (Min: 120000, Max: 180000, USD, Annual)
  - Platform: LinkedIn
  - Work Type: Full-time
  - Work Environment: Hybrid
  - Job description summary
  - User notes: "Really excited about this!"
  - Check "I have already applied"
- [ ] Save and verify all fields display correctly

#### Test Case 3: Minimal Entry (Required Fields Only)
- [ ] Add job with only Title and Company
- [ ] Leave all other fields empty/default
- [ ] Verify it saves without errors
- [ ] Check how empty fields display on dashboard

### 3. Adding Jobs - URL Parsing (Requires API Key)

#### Setup
- [ ] Create `.env` file with `VITE_ANTHROPIC_API_KEY=your_key`
- [ ] Restart dev server

#### Test Case 4: Parse LinkedIn URL
- [ ] Click "Add Application"
- [ ] Paste a real LinkedIn job URL
- [ ] Click "Parse Job Posting"
- [ ] **Expected**: CORS error OR successful parse
- [ ] If successful, verify parsed data accuracy
- [ ] Edit any incorrect fields
- [ ] Save

#### Test Case 5: Invalid URL
- [ ] Try pasting "https://google.com"
- [ ] Should show error
- [ ] Manual entry option still available

### 4. Dashboard Functionality

#### Test Case 6: Search
- [ ] Add 3+ jobs with different titles/companies
- [ ] Search for specific company name
- [ ] Verify filtering works
- [ ] Clear search, verify all jobs show again

#### Test Case 7: Filters
- [ ] Use status filter dropdown
- [ ] Use work environment filter
- [ ] Verify only matching jobs show
- [ ] Check "Showing X of Y applications" text

#### Test Case 8: Sorting
- [ ] Click "Date" sort - verify jobs reorder
- [ ] Click again - verify reverse order
- [ ] Try Company, Title, Status sorts
- [ ] Verify sort indicators (↑/↓) show correctly

### 5. Job Detail View

#### Test Case 9: Open Job Details
- [ ] Click any job card
- [ ] Detail modal opens
- [ ] All job info displays correctly
- [ ] Timeline shows application date
- [ ] URL link works (if provided)

#### Test Case 10: Add Status Update
- [ ] In detail view, click "Add Status Update"
- [ ] Check "Have you heard back?"
- [ ] Select "Phone Screen Scheduled" from dropdown
- [ ] Add notes: "Interview scheduled for next week"
- [ ] Click "Save Update"
- [ ] Verify update appears in timeline
- [ ] Status badge on card updates

#### Test Case 11: Multiple Status Updates
- [ ] Add 2-3 more status updates to same job
- [ ] Verify timeline shows all updates chronologically
- [ ] Latest update shows in status badge

### 6. Follow-up Reminders

#### Test Case 12: Create Old Application
- [ ] Open browser console
- [ ] Run:
```javascript
// Create job from 3 weeks ago
const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 21);

const oldJob = {
  id: crypto.randomUUID(),
  url: 'https://example.com/job',
  parsedData: {
    title: 'Old Application Test',
    company: 'Old Company',
    compensation: null,
    workEnvironment: 'Remote',
    workType: 'Full-time',
    location: 'Remote',
    platform: 'LinkedIn',
    benefits: [],
    descriptionSummary: 'Test',
  },
  userNotes: 'This should trigger a reminder',
  hasApplied: true,
  applicationDate: oldDate.toISOString(),
  statusUpdates: [],
  followUpReminderShown: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const apps = JSON.parse(localStorage.getItem('job_applications') || '[]');
apps.push(oldJob);
localStorage.setItem('job_applications', JSON.stringify(apps));
location.reload();
```
- [ ] Yellow reminder banner appears
- [ ] Shows correct job in reminder
- [ ] "Dismiss" button works
- [ ] "Generate Email" button works

### 7. Email Generation (Requires API Key)

#### Test Case 13: Generate Follow-up Email
- [ ] Click "Generate Email" from reminder OR detail view
- [ ] Wait for generation (5-10 seconds)
- [ ] Email appears with subject and body
- [ ] Email includes job details
- [ ] Email uses user notes if provided
- [ ] Edit subject/body
- [ ] Click "Copy to Clipboard"
- [ ] Verify "Copied!" appears
- [ ] Paste elsewhere to verify clipboard works

#### Test Case 14: Regenerate Email
- [ ] Click "Regenerate"
- [ ] New email generates
- [ ] Verify it's different from first version

### 8. Statistics

#### Test Case 15: View Statistics
- [ ] Add 5+ jobs with varied statuses
- [ ] Click "Statistics" in nav
- [ ] Verify summary cards show correct numbers
- [ ] Check all charts render:
  - Applications over time (line chart)
  - Status breakdown (pie chart)
  - Platform distribution (bar chart)
  - Work environment (pie chart)
  - Work type (bar chart)
  - Compensation ranges (bar chart)
- [ ] Hover over chart elements, verify tooltips

#### Test Case 16: Statistics with No Data
- [ ] Clear all applications
- [ ] Open Statistics
- [ ] Verify doesn't crash
- [ ] Shows appropriate empty state

### 9. Export Functionality

#### Test Case 17: Export to JSON
- [ ] Add 3+ jobs
- [ ] Click "Export" → "Export as JSON"
- [ ] File downloads with date in filename
- [ ] Open file, verify valid JSON
- [ ] Verify all job data present

#### Test Case 18: Export to CSV
- [ ] Click "Export" → "Export as CSV"
- [ ] File downloads
- [ ] Open in spreadsheet software
- [ ] Verify columns: Date Applied, Company, Job Title, Location, etc.
- [ ] Verify data is correct

#### Test Case 19: Export Empty Data
- [ ] Clear all applications
- [ ] Try to export JSON and CSV
- [ ] Should not crash (empty array or message)

### 10. Data Persistence

#### Test Case 20: Refresh Page
- [ ] Add 2-3 jobs
- [ ] Refresh browser (F5 or Cmd+R)
- [ ] Verify all jobs still present
- [ ] Verify filters/sort reset to defaults

#### Test Case 21: Close and Reopen Browser
- [ ] Add jobs
- [ ] Close browser tab
- [ ] Reopen to http://localhost:5173
- [ ] Verify data persists

#### Test Case 22: localStorage Limit
- [ ] Add 50+ jobs (use test script)
- [ ] Verify no errors
- [ ] Check browser console for warnings
- [ ] Note: localStorage limit is ~5-10MB

### 11. Mobile Responsiveness (Resize Browser)

#### Test Case 23: Mobile View (375px width)
- [ ] Resize browser to phone size
- [ ] Dashboard cards stack vertically
- [ ] Navigation is usable
- [ ] Forms are usable
- [ ] Charts resize appropriately
- [ ] No horizontal scroll

#### Test Case 24: Tablet View (768px width)
- [ ] Resize to tablet width
- [ ] Grid shows 2 columns
- [ ] All features accessible

### 12. Error Handling

#### Test Case 25: Invalid API Key
- [ ] Set invalid API key in `.env`
- [ ] Try to parse URL
- [ ] Error message shows clearly
- [ ] Can still use manual entry

#### Test Case 26: Network Offline
- [ ] Open DevTools → Network tab
- [ ] Set to "Offline"
- [ ] Try to parse URL
- [ ] Error message shows
- [ ] Can still view existing jobs
- [ ] Can add jobs manually

#### Test Case 27: Corrupted localStorage
- [ ] Open browser console
- [ ] Run: `localStorage.setItem('job_applications', 'invalid json')`
- [ ] Refresh page
- [ ] App should recover gracefully
- [ ] Shows empty state or error message

### 13. Performance

#### Test Case 28: Large Dataset
- [ ] Run test script to add 100 jobs:
```javascript
import('/src/tests/testRunner.ts').then(m => {
  const { v4: uuidv4 } = require('uuid');
  for (let i = 0; i < 100; i++) {
    // Add job logic
  }
});
```
- [ ] Dashboard loads in <2 seconds
- [ ] Filtering is responsive
- [ ] Sorting is fast
- [ ] Statistics calculate quickly
- [ ] No browser freezing

### 14. Edge Cases

#### Test Case 29: Special Characters
- [ ] Add job with title: `Senior Engineer @ "Best" Co. <HTML> & Co's`
- [ ] Add job with description: `Español, 中文, Emoji 🚀`
- [ ] Verify displays correctly
- [ ] Export and verify special chars preserved

#### Test Case 30: Very Long Text
- [ ] Add job with 5000-character description
- [ ] Verify doesn't break layout
- [ ] Verify scrolling works

#### Test Case 31: Future Dates
- [ ] Try to manually set application date in future
- [ ] App should handle gracefully

---

## Known Issues to Watch For

### Critical Issues
- [ ] CORS blocks URL parsing (expected - needs extension)
- [ ] Tailwind CSS not loading (check @import syntax)
- [ ] API key not being read from .env
- [ ] localStorage quota exceeded with many jobs

### UI Issues
- [ ] Charts not rendering (check recharts install)
- [ ] Modal doesn't close
- [ ] Buttons not clickable
- [ ] Layout breaks on mobile

### Data Issues
- [ ] Jobs not saving to localStorage
- [ ] Status updates not persisting
- [ ] Export files empty or corrupted
- [ ] Follow-up reminders showing for wrong jobs

---

## Reporting Test Results

After testing, create a summary:

```markdown
## Test Results - [Date]

### Passed ✅
- [List features that work perfectly]

### Partially Working ⚠️
- [List features that work but have issues]

### Not Working ❌
- [List broken features with error messages]

### Blockers 🚫
- [Critical issues that prevent core functionality]
```

---

## Quick Test Data Generator

Run this in console to add sample data:

```javascript
// Add 5 diverse test jobs
const testJobs = [
  {
    title: 'Senior Frontend Engineer',
    company: 'TechCorp',
    workEnvironment: 'Remote',
    platform: 'LinkedIn',
  },
  {
    title: 'Backend Developer',
    company: 'StartupXYZ',
    workEnvironment: 'Hybrid',
    platform: 'Indeed',
  },
  {
    title: 'Full Stack Engineer',
    company: 'BigCo',
    workEnvironment: 'In-Office',
    platform: 'Glassdoor',
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudCompany',
    workEnvironment: 'Remote',
    platform: 'LinkedIn',
  },
  {
    title: 'Software Engineer',
    company: 'MegaCorp',
    workEnvironment: 'Hybrid',
    platform: 'Company Website',
  },
];

// Use manual entry UI to add these
```
