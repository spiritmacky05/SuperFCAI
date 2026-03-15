# HistoryView

The `HistoryView` page displays a chronological list of previously generated fire safety reports for a specific user.

## Props

- `email`: Required. The email of the user to fetch history for.
- `onSelect`: Callback function triggered when a report is clicked.
- `onBack`: Redirect back to the main search dashboard.

## Usage

```tsx
<HistoryView
  email="user@example.com"
  onSelect={handleSelect}
  onBack={handleBack}
/>
```
