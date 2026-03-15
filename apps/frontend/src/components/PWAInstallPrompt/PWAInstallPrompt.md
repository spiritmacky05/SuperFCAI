# PWAInstallPrompt

`PWAInstallPrompt` monitors the `beforeinstallprompt` event and detects iOS "Add to Home Screen" conditions to show a guided installation banner.

## Features

- Deferred installation prompt for Chromium browsers.
- Guided instructions for iOS users.
- Persistent dismissal using `localStorage`.

## Usage

```tsx
<PWAInstallPrompt />
```
