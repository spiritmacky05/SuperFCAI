# AuthView

The `AuthView` page handles user authentication, including login and registration flows. It utilizes `AuthForms` for the actual input logic.

## Props

- `onLogin`: Callback function triggered after a successful authentication, passing the `User` object.

## Components

- `AuthForms`: The sub-component containing the actual form JSX.

## Usage

```tsx
<AuthView onLogin={(user) => console.log(user)} />
```
