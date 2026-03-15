# AdminView

The `AdminView` (Admin Nexus) is a monolithic administrative dashboard for system-wide configuration, user approval, and auditing.

## Props

- `currentUser`: Required. The currently logged-in admin/superadmin user.

## Features

- Dashboard analytics (Active users, Pending payments).
- User Management (Role assignment, Approval).
- Training Resource Management.
- Fire Safety Provision Knowledge Base editing.
- Error Report Auditing.

## Usage

```tsx
<AdminView currentUser={adminUser} />
```
