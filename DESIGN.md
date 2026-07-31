# Caffeinate — Visual System

## Direction

A quiet macOS control surface inspired by a physical power console: warm paper, dark espresso ink, one amber state signal, crisp typography, and restrained motion. The interface should feel authored, not generated.

## Layout

- Single window, 720 × 560 default, 620 × 500 minimum.
- One continuous surface. Avoid a stack of floating cards.
- Header: product name and local-only descriptor.
- Main state field: status eyebrow, large direct statement, one sentence of consequence.
- Primary action: full-width, high-contrast rectangular button.
- Controls: two compact rows separated by rules, not nested cards.
- Footer: exact command preview and keyboard shortcut.

## Color tokens

Light appearance:
- Canvas: `#F4F0E7`
- Surface: `#FBF8F1`
- Ink: `#171411`
- Muted ink: `#70685F`
- Rule: `#D8D0C4`
- Espresso: `#2B201A`
- Amber: `#D58A2A`
- Error: `#A13A2B`

Dark appearance:
- Canvas: `#171411`
- Surface: `#201B17`
- Ink: `#F4F0E7`
- Muted ink: `#B5AAA0`
- Rule: `#3C342E`
- Espresso: `#F4F0E7`
- Amber: `#E6A34C`
- Error: `#F18A78`

## Typography

Use the macOS system stack. No web font dependency.

- Display: 42–50 px, 650 weight, tight but readable tracking.
- Status eyebrow: 12 px, 700 weight, uppercase, 0.14 em tracking.
- Body: 15–17 px, 400–500 weight, 1.45 line height.
- Technical command: SFMono/monospace, 12 px.

## Shape and depth

- Primary radius: 14 px.
- Small controls: 10 px.
- Avoid full pills except the native-style toggle track.
- One soft outer shadow for the window surface; no stacked shadows.
- Use 1 px rules for structure.

## Interaction

- Main action toggles the session.
- `⌘ Return` performs the same action.
- Duration uses a select to preserve compactness and native familiarity.
- Display control is a labeled switch with a clear consequence.
- Controls are disabled while a transition is in progress.
- Active state uses amber as a status signal, not as decoration.
- Respect `prefers-reduced-motion`.

## State copy

Ready:
- Eyebrow: `READY`
- Heading: `Sleep is allowed.`
- Description: `Start a session before a long task.`
- Action: `Keep Mac Awake`

Active:
- Eyebrow: `AWAKE`
- Heading: `Idle sleep is blocked.`
- Description varies by display setting and timeout.
- Action: `Allow Sleep`

Error:
- Show a compact inline alert above the action.
- Preserve the last confirmed status.
- Use literal recovery guidance.

## Accessibility

- Semantic buttons, labels, select, and checkbox.
- Visible `:focus-visible` treatment with a 3 px amber outline.
- Minimum 44 px pointer targets.
- Status changes announced through `aria-live="polite"`.
- Error content uses `role="alert"`.
- Contrast should meet WCAG AA for body text and controls.
