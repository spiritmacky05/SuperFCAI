# ToastContext

`ToastContext` provides a global notification system and a confirmation dialog utility.

## Hook: `useToast()`

Returns an object with:

- `showToast(message: string, type?: 'success' | 'error' | 'info')`: Triggers a floating notification.
- `confirm(message: string): Promise<boolean>`: Triggers a modal confirmation dialog.

## Provider

`ToastProvider` must wrap the application tree.

## Usage

```tsx
const { showToast, confirm } = useToast();

const handleDelete = async () => {
  if (await confirm("Are you sure?")) {
    showToast("Deleted!", "success");
  }
};
```
