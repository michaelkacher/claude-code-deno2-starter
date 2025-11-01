# Admin Panel - Quick Start

## Access the Admin Panel

1. **Make yourself an admin** (if not already):
   ```bash
   deno task users:make-admin your-email@example.com
   ```

2. **Log in** at http://localhost:3000/login
   - Use your email and password
   - Or use test account: test@example.com / password123

3. **Click "Admin Panel"** button in the navigation bar

4. **Or navigate directly** to http://localhost:3000/admin/users

---

## Quick Actions

### View All Users
- Open http://localhost:3000/admin/users
- See statistics at the top
- Browse user table below

### Search & Filter
- **Search**: Type name, email, or ID in search box, press Enter
- **Role**: Select "Users" or "Admins" from dropdown
- **Email Status**: Select "Verified" or "Unverified"
- Click "Apply Filters"

### Manage Users

| Action | Button | Description |
|--------|--------|-------------|
| Promote to Admin | ↑ | Change user role to admin |
| Demote to User | ↓ | Change admin role to user |
| Verify Email | ✓ | Manually verify unverified email |
| Revoke Sessions | 🔒 | Log out user from all devices |
| Delete User | ✕ | Permanently delete user |

---

## CLI Commands

```bash
# List all users
deno task users:list

# Make a user admin
deno task users:make-admin email@example.com
```

---

## Key Features

✅ **Real-time statistics**: Total users, verified rate, admin count, 24h signups  
✅ **Advanced filtering**: Search, role, and verification status filters  
✅ **Pagination**: Navigate through pages (50 users per page)  
✅ **User management**: Promote, verify, revoke sessions, delete  
✅ **Security**: Cannot modify yourself, confirmation prompts  
✅ **Responsive**: Works on mobile and desktop  

---

## Testing

1. **Create test user**:
   ```bash
   deno task kv:seed-user
   ```

2. **Make them admin**:
   ```bash
   deno task users:make-admin test@example.com
   ```

3. **Log in**: http://localhost:3000/login
   - Email: test@example.com
   - Password: password123

4. **Access admin panel**: http://localhost:3000/admin/users

---

## Full Documentation

See [ADMIN_PANEL.md](./ADMIN_PANEL.md) for:
- Complete API reference
- Security details
- Troubleshooting
- Production considerations
- Future enhancements
