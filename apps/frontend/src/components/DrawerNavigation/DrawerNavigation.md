# DrawerNavigation

The `DrawerNavigation` component serves as the primary vertical sidebar for desktop users.

## Props

- `activeView`: The current active dashboard view ID.
- `setView`: Callback to change the view.
- `user`: User object for profile display.
- `onLogout`: Logout handler.

## Dependencies

- `Logo`: Renders the system brand.

## Usage

```tsx
<DrawerNavigation
  activeView={view}
  setView={setView}
  user={user}
  onLogout={handleLogout}
/>
```
