# AdBanner

`AdBanner` is a responsive advertisement container that can be positioned at the top, bottom, or sidebar.

## Props

- `userRole`: Required. Ad logic is only enabled for `'free'` users.
- `position`: Optional. `'top' | 'bottom' | 'sidebar'`. Default is `'bottom'`.

## Usage

```tsx
<AdBanner userRole="free" position="sidebar" />
```
