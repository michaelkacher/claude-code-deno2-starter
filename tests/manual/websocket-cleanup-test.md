# WebSocket Cleanup Test

This test verifies that WebSocket connections are properly cleaned up when users log out.

## Test Steps

1. **Login**: Navigate to `/login` and log in with test credentials
2. **Verify WebSocket Connection**: Check that WebSocket connects in browser dev tools
3. **Logout**: Click logout button  
4. **Verify Cleanup**: Confirm no more WebSocket connection attempts

## Expected Behavior

### Before Fix
- ❌ WebSocket continues trying to reconnect after logout
- ❌ Console shows 429 errors from expired tokens
- ❌ Unnecessary network traffic and error logs

### After Fix
- ✅ WebSocket connection closes immediately on logout
- ✅ No reconnection attempts after logout
- ✅ Clean component state after logout
- ✅ No console errors from WebSocket attempts

## Test Commands

```bash
# 1. Start dev server
deno task dev

# 2. Open browser and check console
open http://localhost:3000

# 3. Login with test user
# Email: test@example.com
# Password: password123

# 4. Check WebSocket connection in Network tab
# Should see: ws://localhost:3000/api/notifications/ws?token=...

# 5. Logout
# Click profile dropdown > Logout

# 6. Verify cleanup
# - No more WebSocket connection attempts
# - Profile shows "Login" button
# - No console errors
```

## Browser Console Verification

### During Login
```
WebSocket connection established
Connected to notification service
```

### During Logout  
```
WebSocket connection closed
Component state cleared
No reconnection attempts
```

### After Logout
```
No WebSocket-related console messages
Clean state maintained
```

## Manual Testing Checklist

- [ ] Login works correctly
- [ ] WebSocket connects after login
- [ ] Notifications work (if any)
- [ ] Logout properly cleans up WebSocket
- [ ] No console errors after logout  
- [ ] No network requests to WebSocket after logout
- [ ] Profile dropdown shows "Login" button after logout
- [ ] No background reconnection attempts

## Automated Test (Future)

```typescript
// Integration test to verify WebSocket cleanup
describe('WebSocket Cleanup on Logout', () => {
  it('should close WebSocket and stop reconnection attempts', async () => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for WebSocket connection
    await page.waitForTimeout(1000);
    
    // Verify WebSocket is connected
    const wsRequests = page.context().serviceWorkers();
    expect(wsRequests.length).toBeGreaterThan(0);
    
    // Logout
    await page.click('[data-testid="profile-dropdown"]');
    await page.click('[data-testid="logout-button"]');
    
    // Wait and verify no new WebSocket attempts
    await page.waitForTimeout(5000);
    const wsRequestsAfterLogout = page.context().serviceWorkers();
    
    // Should have no new WebSocket connection attempts
    expect(wsRequestsAfterLogout.length).toBe(wsRequests.length);
  });
});
```

## Success Criteria

The fix is successful when:
- ✅ WebSocket connects properly after login
- ✅ WebSocket closes immediately on logout
- ✅ No reconnection attempts after logout
- ✅ No 429 or authentication errors in console
- ✅ Component state is properly cleared
- ✅ User can login again without issues