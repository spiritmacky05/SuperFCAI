# ChatBox

The `ChatBox` component manages real-time messaging with the AI assistant during a search context.

## Props

- `messages`: List of chat messages.
- `isTyping`: Boolean indicating if AI is responding.
- `onSendMessage`: Callback for sending a message.

## Usage

```tsx
<ChatBox messages={history} isTyping={false} onSendMessage={handleSend} />
```
