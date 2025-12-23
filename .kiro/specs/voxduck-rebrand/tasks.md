# Implementation Plan

- [x] 1. Set up design tokens and base styles





  - [x] 1.1 Add Google Fonts link for Inter and JetBrains Mono to index.html


    - Add font preconnect and stylesheet links
    - _Requirements: 4.1, 4.2_

  - [x] 1.2 Create CSS custom properties (design tokens) in index.css

    - Define all color variables (backgrounds, accents, text, status)
    - Define typography variables (font families)
    - Define animation variables (transitions, pulse)
    - _Requirements: 6.1, 6.2_

  - [x] 1.3 Update base body and App styles to dark theme

    - Apply Midnight Slate background
    - Apply primary text color
    - Update font-family to Inter
    - _Requirements: 1.2, 1.4_

- [x] 2. Update brand identity elements







  - [x] 2.1 Update index.html with VoxDuck branding


    - Change page title to "VoxDuck"
    - Add favicon link references (16x16, 32x32)
    - _Requirements: 1.1, 8.4, 8.5_

  - [x] 2.2 Create VoxDuck logo SVG component

    - Create Logo.tsx component with inline SVG
    - Implement voice wave icon with cyan-to-violet gradient
    - Support both full wordmark and icon-only variants
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 2.3 Create favicon files


    - Create favicon.svg with voice wave icon
    - Generate favicon-16x16.png and favicon-32x32.png
    - _Requirements: 8.4, 8.5_
  - [x] 2.4 Update App.tsx header with logo and tagline




    - Replace emoji title with Logo component
    - Update tagline to "Debug by talking it through."
    - Update footer text
    - _Requirements: 1.1, 8.1_

- [x] 3. Update StatusDisplay component styling







  - [x] 3.1 Restyle StatusDisplay for dark theme




    - Update background to Deep Charcoal
    - Update text colors to brand palette
    - _Requirements: 1.3, 1.4, 1.5_
  - [x] 3.2 Update status-specific colors


    - Listening: Soft Cyan (#22D3EE)
    - Thinking: Voice Violet (#7C3AED)
    - Speaking/Playing: Emerald (#10B981)
    - Error: Rose (#EF4444)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 3.3 Add subtle pulse animation for active states


    - Create soft pulse keyframes
    - Apply to listening and thinking states
    - _Requirements: 2.5, 7.2_
  - [x] 3.4 Write property test for status color mapping


    - **Property 1: Status state color mapping**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 4. Update AudioRecorder component styling





  - [x] 4.1 Restyle record button for dark theme


    - Update background to Deep Charcoal
    - Apply Voice Violet accent for border/hover
    - Update text colors
    - _Requirements: 3.1, 1.3_
  - [x] 4.2 Update recording state styling


    - Apply Soft Cyan glow effect when recording
    - Update pulse animation to use brand colors
    - Remove bouncy effects, use soft transitions
    - _Requirements: 3.2, 3.3, 7.1_

- [x] 5. Update ConversationDisplay component styling





  - [x] 5.1 Restyle conversation container for dark theme


    - Update background to Deep Charcoal
    - Update scrollbar colors for dark theme
    - _Requirements: 1.3_


  - [x] 5.2 Update message styling
    - User messages: Soft Cyan accent border
    - AI messages: Voice Violet accent border
    - Update text colors to brand palette
    - Apply Inter font family
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 5.3 Add code snippet styling with JetBrains Mono
    - Style code elements with monospace font
    - Apply appropriate background for code blocks
    - _Requirements: 4.2_
  - [x] 5.4 Write property test for message font consistency


    - **Property 2: Message text font consistency**
    - **Validates: Requirements 4.1**

- [x] 6. Update AudioPlayer component styling




  - [x] 6.1 Restyle AudioPlayer for dark theme

    - Update background to Deep Charcoal
    - Update control button colors to brand palette
    - Apply minimal visual design
    - _Requirements: 5.1, 5.2, 1.3_

- [x] 7. Update header and footer styling




  - [x] 7.1 Restyle app-header for dark theme


    - Update background to primary dark
    - Update border colors
    - Style logo placement
    - _Requirements: 1.2, 8.1_
  - [x] 7.2 Restyle app-footer for dark theme


    - Update background and text colors
    - Update border colors
    - _Requirements: 1.2, 1.5_

- [x] 8. Final polish and responsive adjustments






  - [x] 8.1 Review and adjust responsive breakpoints

    - Ensure dark theme works on mobile
    - Adjust spacing for breathing room
    - _Requirements: 4.3_
  - [x] 8.2 Verify all hardcoded colors are replaced with design tokens


    - Audit CSS for any remaining hardcoded hex values
    - Replace with var() references
    - _Requirements: 6.3, 6.4_

- [x] 9. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
