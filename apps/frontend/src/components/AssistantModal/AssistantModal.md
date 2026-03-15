# AssistantModal

The `AssistantModal` (Expert Mode) provides an interactive chatbot interface specifically tailored for RA 9514 (Fire Code of the Philippines).

## Props

- `isOpen`: Boolean to control visibility.
- `onClose`: Callback to close the modal.

## Dependencies

- `Logo`: System branding.
- `geminiService`: Handles AI communication.
- `react-markdown`: Renders the AI's response.

## Usage

```tsx
<AssistantModal isOpen={true} onClose={() => {}} />
```
