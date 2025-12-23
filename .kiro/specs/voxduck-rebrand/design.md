# Design Document: VoxDuck Rebrand

## Overview

This design document outlines the technical approach for rebranding the Voice Rubber Duck Debugger application to "VoxDuck". The rebrand involves updating the visual identity (colors, typography, logo), component styling, and brand messaging while preserving all existing functionality.

The current application uses a light theme with blue/orange accents. The rebrand transitions to a dark, minimal aesthetic with Voice Violet and Soft Cyan as primary accents, aligning with the "late-night debugging session" feel.

## Architecture

The rebrand follows a CSS-first approach using design tokens (CSS custom properties) for maintainability. No structural changes to React components are required — only styling and content updates.

```
┌─────────────────────────────────────────────────────────────┐
│                    Design Token Layer                        │
│  (CSS Custom Properties in index.css)                       │
│  --color-bg-primary, --color-accent-violet, etc.            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Styles                          │
│  StatusDisplay, AudioRecorder, ConversationDisplay,         │
│  AudioPlayer - reference design tokens                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Static Assets                             │
│  Logo SVG, Favicon (16x16, 32x32)                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/index.css` | Add design tokens, update all component styles to dark theme |
| `frontend/src/App.tsx` | Update header title, tagline, footer text |
| `frontend/index.html` | Update page title, add favicon references |
| `frontend/public/` | Add logo SVG and favicon files |

### Component Style Updates

**StatusDisplay**
- Update status colors to brand palette
- Listening: Soft Cyan (#22D3EE)
- Thinking: Voice Violet (#7C3AED)
- Speaking/Playing: Emerald (#10B981)
- Error: Rose (#EF4444)
- Add subtle pulse animation for active states

**AudioRecorder**
- Record button: Voice Violet (#7C3AED) accent
- Active/recording state: Soft Cyan (#22D3EE) glow
- Remove bouncy animations, use soft transitions

**ConversationDisplay**
- Dark surface background (Deep Charcoal)
- User messages: Soft Cyan accent border
- AI messages: Voice Violet accent border
- Inter font for text, JetBrains Mono for code

**AudioPlayer**
- Minimal dark styling
- Brand-colored controls

## Data Models

No data model changes required. This is a visual-only rebrand.

### Design Tokens Structure

```css
:root {
  /* Background Colors */
  --color-bg-primary: #0B1020;      /* Midnight Slate */
  --color-bg-surface: #111827;       /* Deep Charcoal */
  
  /* Accent Colors */
  --color-accent-violet: #7C3AED;    /* Voice Violet */
  --color-accent-cyan: #22D3EE;      /* Soft Cyan */
  
  /* Text Colors */
  --color-text-primary: #E5E7EB;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;
  
  /* Status Colors */
  --color-status-listening: #22D3EE;
  --color-status-thinking: #7C3AED;
  --color-status-speaking: #10B981;
  --color-status-error: #EF4444;
  
  /* Typography */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  
  /* Animation */
  --transition-smooth: 0.3s ease;
  --animation-pulse: pulse 2s ease-in-out infinite;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Status state color mapping

*For any* status state (listening, thinking, speaking, error), the StatusDisplay component should render with the correct brand color for that state:
- Listening → Soft Cyan (#22D3EE)
- Thinking → Voice Violet (#7C3AED)
- Speaking → Emerald (#10B981)
- Error → Rose (#EF4444)

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 2: Message text font consistency

*For any* message rendered in the ConversationDisplay component, the computed font-family should include "Inter" as the primary font.

**Validates: Requirements 4.1**

## Error Handling

No new error handling required. The rebrand is purely visual and does not affect application logic or error states. Existing error handling in components remains unchanged.

## Testing Strategy

### Unit Testing

Unit tests will verify specific visual examples:
- Document title contains "VoxDuck"
- Header displays correct brand name and tagline
- Design tokens (CSS custom properties) are defined in stylesheet
- Favicon link elements exist in HTML
- Logo SVG is present in header

### Property-Based Testing

Property-based tests will use **fast-check** library to verify universal properties:

1. **Status Color Property Test**: Generate random status states and verify each maps to the correct brand color
2. **Font Family Property Test**: Generate random message content and verify Inter font is applied

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the format: `**Feature: voxduck-rebrand, Property {number}: {property_text}**`
- Reference the specific correctness property from this design document

### Test File Structure

```
frontend/src/
├── components/
│   ├── StatusDisplay.test.tsx    # Add status color property test
│   └── ConversationDisplay.test.tsx  # Add font property test
└── App.test.tsx                  # Add brand name/title tests
```

## Implementation Notes

### Font Loading

Inter and JetBrains Mono fonts should be loaded via Google Fonts or self-hosted:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

### Logo Implementation

The logo will be implemented as an inline SVG component for flexibility:
- Full wordmark in header
- Icon-only version for favicon
- Gradient defined in SVG defs for the voice wave icon

### Animation Guidelines

All animations should use:
- `ease` or `ease-in-out` timing functions
- Duration between 0.2s - 0.4s for transitions
- Duration of 2s for pulse animations
- No `bounce`, `elastic`, or `spring` effects
