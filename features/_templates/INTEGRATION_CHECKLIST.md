# Feature Integration Checklist

Use this checklist after implementing a feature to ensure it's fully integrated with the application.

## Feature Information

**Feature Name**: _______________
**Feature Route**: _______________
**Implementation Date**: _______________
**Developer**: _______________

---

## 1. Navigation Integration

- [ ] **Dashboard/Home Page**
  - [ ] Added button/link to access feature from main dashboard
  - [ ] Updated any "coming soon" messages or placeholders
  - [ ] Verified navigation works (tested click → route loads)

- [ ] **Navigation Menu/Sidebar**
  - [ ] Added menu item for feature (if applicable)
  - [ ] Organized under correct section/category
  - [ ] Added appropriate icon (if applicable)

- [ ] **Breadcrumbs**
  - [ ] Updated breadcrumb navigation (if applicable)
  - [ ] Verified parent-child relationships

- [ ] **Related Features**
  - [ ] Updated links from related features to this feature
  - [ ] Verified bi-directional navigation (if applicable)

**Notes**:
_Document any navigation changes or special considerations_

---

## 2. Data Browser Integration

- [ ] **KV Models Registered**
  - [ ] All new KV key prefixes added to `frontend/routes/api/admin/data/models.ts`
  - [ ] Tested that models appear in Data Browser at `/admin/data`
  - [ ] Verified data can be browsed correctly

- [ ] **Model Prefixes Added**:
  - [ ] `[prefix-1]` (e.g., campaigns_by_invite_code)
  - [ ] `[prefix-2]`
  - [ ] `[prefix-3]`

**Notes**:
_List all KV key patterns used by this feature_

---

## 3. Security Review

- [ ] **Authentication**
  - [ ] All routes require authentication (where applicable)
  - [ ] Uses `requireUser(ctx)` or `requireAdmin(ctx)` middleware
  - [ ] No public routes that should be protected

- [ ] **Authorization**
  - [ ] User IDs from JWT tokens (`user.sub`), not request body
  - [ ] No `userId`, `ownerId`, or `createdBy` in Zod schemas
  - [ ] Proper role-based access control (if applicable)

- [ ] **Input Validation**
  - [ ] All inputs validated with Zod schemas
  - [ ] Proper field length limits enforced
  - [ ] SQL injection prevented (N/A for Deno KV)
  - [ ] XSS prevention in place

- [ ] **Security Scan Results**
  - [ ] Ran `./scripts/security-scan.sh [feature-name]`
  - [ ] All issues resolved or documented

**Notes**:
_Document any security considerations or exceptions_

---

## 4. Runtime Safety

- [ ] **Array Operations**
  - [ ] All `.map()` calls use `(array || [])` pattern
  - [ ] All `.filter()` calls use null checks
  - [ ] All `.length` accesses safe

- [ ] **Property Access**
  - [ ] Nested properties use optional chaining (`?.`)
  - [ ] Fallback values for critical data (`?? default`)

- [ ] **Event Handlers**
  - [ ] Uses `e.currentTarget` instead of `e.target`
  - [ ] Proper type assertions where needed

- [ ] **API Patterns**
  - [ ] Uses `globalThis` instead of `window`
  - [ ] Uses `TokenStorage` instead of `localStorage`
  - [ ] Uses `apiClient` instead of manual `fetch`

- [ ] **Safety Scan Results**
  - [ ] Ran `./scripts/runtime-safety-scan.sh [feature-name]`
  - [ ] All warnings addressed or documented

**Notes**:
_Document any runtime safety considerations_

---

## 5. Testing

- [ ] **Unit Tests**
  - [ ] Service layer tests written and passing
  - [ ] Repository tests written and passing (if applicable)
  - [ ] Utility function tests written and passing

- [ ] **Integration Tests**
  - [ ] API endpoint tests written and passing
  - [ ] End-to-end workflow tests written (if applicable)

- [ ] **Manual Testing**
  - [ ] Tested happy path (normal usage)
  - [ ] Tested error cases (invalid input, missing data)
  - [ ] Tested edge cases (boundary values, special characters)
  - [ ] Tested on mobile devices (if applicable)

- [ ] **Test Results**
  ```bash
  # Run with --no-check for environment compatibility
  deno test --no-check tests/unit/services/[feature].service.test.ts -A
  ```
  - [ ] All tests passing

**Notes**:
_Document test coverage and any known issues_

---

## 6. Documentation

- [ ] **Feature Documentation**
  - [ ] Requirements documented in `features/[status]/[feature-name]/requirements.md`
  - [ ] API spec documented (if backend feature)
  - [ ] UI/UX decisions documented (if frontend feature)

- [ ] **Code Comments**
  - [ ] Complex logic explained with comments
  - [ ] JSDoc comments for public functions
  - [ ] TODO/FIXME items documented

- [ ] **User Documentation** (if applicable)
  - [ ] User guide updated
  - [ ] FAQ updated
  - [ ] Help text added to UI

**Notes**:
_Document any special documentation needs_

---

## 7. Performance

- [ ] **Load Time**
  - [ ] Initial page load < 2 seconds (mobile)
  - [ ] No blocking operations on main thread

- [ ] **Optimization**
  - [ ] Images optimized (if applicable)
  - [ ] Code splitting applied (if needed)
  - [ ] Lazy loading for heavy components (if needed)

- [ ] **Database Queries**
  - [ ] Efficient KV key structure
  - [ ] No N+1 query issues
  - [ ] Proper indexing with secondary keys

**Notes**:
_Document performance metrics or concerns_

---

## 8. Error Handling

- [ ] **User-Facing Errors**
  - [ ] Friendly error messages displayed
  - [ ] Validation errors shown inline
  - [ ] Network errors handled gracefully

- [ ] **Backend Errors**
  - [ ] Proper HTTP status codes used
  - [ ] Error logging in place
  - [ ] No sensitive data in error messages

- [ ] **Edge Cases**
  - [ ] Empty states handled
  - [ ] Loading states implemented
  - [ ] Timeout handling implemented

**Notes**:
_Document error handling strategy_

---

## 9. Accessibility

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements keyboard accessible
  - [ ] Proper tab order
  - [ ] Focus indicators visible

- [ ] **Screen Readers**
  - [ ] Proper ARIA labels
  - [ ] Alt text for images (if applicable)
  - [ ] Semantic HTML used

- [ ] **Visual**
  - [ ] Sufficient color contrast
  - [ ] Text readable at standard sizes
  - [ ] No color-only indicators

**Notes**:
_Document accessibility features or limitations_

---

## 10. Mobile Responsiveness

- [ ] **Layout**
  - [ ] Mobile-first design applied
  - [ ] Touch targets ≥ 44px
  - [ ] No horizontal scroll on mobile

- [ ] **Testing**
  - [ ] Tested on iOS Safari
  - [ ] Tested on Chrome Mobile
  - [ ] Tested on various screen sizes

**Notes**:
_Document mobile-specific considerations_

---

## 11. Feature Completion

- [ ] **Mockup Cleanup** (if converted from mockup)
  - [ ] Mockup files deleted or archived
  - [ ] Mockup references removed

- [ ] **Feature Status**
  - [ ] Moved from `features/proposed/` to `features/implemented/`
  - [ ] README updated with feature description
  - [ ] CHANGELOG.md updated

- [ ] **Deployment**
  - [ ] Feature deployed to staging (if applicable)
  - [ ] Feature deployed to production (if applicable)
  - [ ] Release notes prepared

**Notes**:
_Document deployment process or special steps_

---

## Sign-Off

**Developer**: _______________ **Date**: _______________

**Reviewer** (if applicable): _______________ **Date**: _______________

**QA** (if applicable): _______________ **Date**: _______________

---

## Additional Notes

_Add any additional notes, gotchas, or future improvements here_
