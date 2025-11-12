# Manual Testing Checklist Template

Copy this template for each feature and customize for your specific requirements.

---

## Feature: [Feature Name]

**Tester**: _____________  
**Date**: _____________  
**Environment**: Development / Staging / Production  
**Branch**: _____________

---

## Pre-Testing Setup

- [ ] Server running without errors (`deno task dev`)
- [ ] No TypeScript errors in terminal
- [ ] Browser console clear of JavaScript errors
- [ ] Test user logged in (if authentication required)
- [ ] Test data seeded (if needed)

---

## Happy Path Testing

**Primary User Flow** - Test the main success path:

- [ ] Step 1: ________________________________
- [ ] Step 2: ________________________________
- [ ] Step 3: ________________________________
- [ ] Step 4: ________________________________
- [ ] Final Result: __________________________

**Expected Outcome**:
- [ ] User completes flow successfully
- [ ] Data saved correctly
- [ ] Appropriate success message shown
- [ ] User redirected to correct page (if applicable)

---

## Input Validation Testing

**Required Fields**:
- [ ] Empty required fields show error messages
- [ ] Error messages are clear and helpful
- [ ] Errors display next to relevant fields
- [ ] Cannot submit with validation errors

**Field Length Limits**:
- [ ] Short text fields reject input over limit (e.g., 100 chars)
- [ ] Long text fields reject input over limit (e.g., 5000 chars)
- [ ] Character count shown for long fields (optional)
- [ ] Trimming whitespace works correctly

**Format Validation**:
- [ ] Email fields validate format
- [ ] URL fields validate format
- [ ] Date fields validate format
- [ ] Phone/number fields validate format (if applicable)

**Custom Business Rules**:
- [ ] Rule 1: ________________________________
- [ ] Rule 2: ________________________________
- [ ] Rule 3: ________________________________

---

## Edge Cases & Error Handling

**Boundary Conditions**:
- [ ] Minimum value inputs work
- [ ] Maximum value inputs work
- [ ] Empty/null values handled gracefully
- [ ] Special characters in text fields handled

**Race Conditions**:
- [ ] Double-click submit doesn't create duplicates
- [ ] Rapid navigation doesn't break state
- [ ] Multiple tabs/windows work correctly

**Network Issues** (if applicable):
- [ ] Loading states shown during requests
- [ ] Error message if request fails
- [ ] Can retry failed operations
- [ ] Offline behavior is acceptable

**Data Integrity**:
- [ ] Duplicate prevention works (if applicable)
- [ ] Unique constraints enforced
- [ ] Related data updates correctly
- [ ] Soft delete vs hard delete works as expected

---

## Authentication & Authorization

**Authentication**:
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can access feature
- [ ] Session expiry handled gracefully
- [ ] Re-authentication works correctly

**Authorization** (if role-based):
- [ ] Admin users can access admin features
- [ ] Regular users blocked from admin features
- [ ] User can only modify their own data
- [ ] Permission denied messages are clear

**Data Isolation**:
- [ ] User A cannot see User B's private data
- [ ] User A cannot modify User B's data
- [ ] API endpoints enforce ownership checks

---

## UI/UX Testing

**Navigation**:
- [ ] Back button works correctly
- [ ] Forward button works correctly
- [ ] Browser refresh preserves state (or warns)
- [ ] Internal links navigate correctly
- [ ] External links open in new tab (if applicable)

**Form Behavior**:
- [ ] Tab order is logical
- [ ] Enter key submits form (where appropriate)
- [ ] Escape key cancels/closes modals
- [ ] Autofocus on first field
- [ ] Form data persists when navigating back

**Visual Feedback**:
- [ ] Loading spinners shown during async operations
- [ ] Success notifications appear
- [ ] Error notifications appear and are dismissible
- [ ] Disabled states are visually clear
- [ ] Hover states work on interactive elements

**Data Display**:
- [ ] Empty states show helpful messages
- [ ] Large lists paginate or infinite scroll
- [ ] Sorting works correctly (if applicable)
- [ ] Filtering works correctly (if applicable)
- [ ] Search works correctly (if applicable)

---

## Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**:
- [ ] All interactive elements accessible via Tab
- [ ] Focus visible on all elements
- [ ] Focus order is logical
- [ ] Can complete entire flow with keyboard only
- [ ] Skip links work (if applicable)

**Screen Reader**:
- [ ] Form labels properly associated
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Success messages announced
- [ ] Images have alt text
- [ ] Buttons have aria-labels (if icon-only)

**Visual Accessibility**:
- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] No information conveyed by color alone
- [ ] Text resizes without breaking layout (up to 200%)
- [ ] Focus indicators meet contrast requirements

**Form Accessibility**:
- [ ] Required fields indicated (not just by color)
- [ ] Error messages programmatically associated
- [ ] Field instructions provided where needed
- [ ] Autocomplete attributes used appropriately

---

## Responsive Design

**Mobile (375px width)**:
- [ ] Layout adapts correctly
- [ ] All content accessible
- [ ] Touch targets at least 44x44px
- [ ] No horizontal scrolling (except tables/code)
- [ ] Text readable without zooming

**Tablet (768px width)**:
- [ ] Layout uses space effectively
- [ ] Navigation works correctly
- [ ] Multi-column layouts stack appropriately

**Desktop (1920px width)**:
- [ ] Content not too wide (max-width used)
- [ ] Multi-column layouts work
- [ ] No wasted white space

**Orientation Changes**:
- [ ] Portrait to landscape works correctly
- [ ] No data loss on orientation change

---

## Performance

**Page Load**:
- [ ] Initial page load < 2 seconds (on 3G)
- [ ] No layout shift during load
- [ ] Images lazy load (if applicable)
- [ ] Critical content loads first

**Interactions**:
- [ ] Form submissions respond immediately
- [ ] API calls complete within reasonable time
- [ ] Large lists render without freezing
- [ ] Animations smooth (60fps)

**Resource Usage**:
- [ ] No memory leaks (test long session)
- [ ] CPU usage reasonable
- [ ] No excessive network requests

---

## Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - if Mac available
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS) - if device available
- [ ] Mobile Chrome (Android) - if device available

**Browser-Specific Issues**:
- [ ] Date pickers work in all browsers
- [ ] File uploads work in all browsers
- [ ] Flexbox/Grid layouts work consistently
- [ ] Custom form inputs styled correctly

---

## Data Verification

**Database Checks** (if access available):
- [ ] Data saved with correct values
- [ ] Timestamps populated correctly (createdAt, updatedAt)
- [ ] Foreign keys reference correct records
- [ ] Indexes used efficiently
- [ ] No orphaned records

**API Response Checks**:
- [ ] Response status codes correct (200, 201, 400, 401, 403, 404)
- [ ] Response data matches schema
- [ ] Error responses include helpful messages
- [ ] No sensitive data leaked in responses

---

## Security Testing (Basic)

**Input Sanitization**:
- [ ] XSS attempts blocked (e.g., `<script>alert('xss')</script>`)
- [ ] SQL injection attempts blocked (if applicable)
- [ ] HTML entities escaped in output

**CSRF Protection**:
- [ ] Forms include CSRF tokens (if applicable)
- [ ] State-changing operations require authentication

**Data Privacy**:
- [ ] Passwords not visible in plain text
- [ ] Sensitive data not in URL parameters
- [ ] API tokens not exposed in client code

---

## Cleanup

After testing:
- [ ] Delete test data created
- [ ] Reset test user account (if modified)
- [ ] Clear test uploads/files
- [ ] Document any bugs found
- [ ] Create tickets for issues

---

## Issues Found

| # | Issue Description | Severity | Steps to Reproduce | Screenshot/Video |
|---|-------------------|----------|-------------------|------------------|
| 1 |                   | High/Med/Low |                   |                  |
| 2 |                   | High/Med/Low |                   |                  |
| 3 |                   | High/Med/Low |                   |                  |

---

## Sign-Off

- [ ] All critical tests passed
- [ ] All high-priority issues resolved or documented
- [ ] Feature ready for code review
- [ ] Feature ready for staging deployment

**Tester Signature**: _______________  **Date**: ___________

**Reviewer Signature**: ______________  **Date**: ___________

---

## Notes

Add any additional observations, concerns, or recommendations:

```
[Notes here]
```
