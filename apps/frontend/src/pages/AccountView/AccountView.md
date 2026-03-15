# AccountView

The `AccountView` page allows users to manage their profiles, view usage stats, and handle account upgrades (GCash integration).

## Props

- `user`: Required. Currently logged-in user profile.

## Features

- Usage statistics visualization.
- Subscription tier management.
- PayMongo/GCash payment redirect.
- Proof of payment upload.

## Usage

```tsx
<AccountView user={user} />
```
