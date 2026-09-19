---
name: design-system
description: >-
  Design system and UI/UX product guidelines based on the Horizon aesthetic:
  Apple-grade dark mode, tabular data, crisp micro-interactions, per-app primary tokens,
  and Volc-specific blur/fade transitions.
---

# Product Design & UI/UX System Guidelines

## 1. Core Horizon Aesthetic (Base)
All applications inherit the Horizon visual standard: clean, dense, high-contrast Apple dark aesthetic.

### Palette Tokens
- **Background Base**: `#000000` (pure black)
- **Background Card / Surface**: `#0c0c0c`
- **Background Hover / Highlight**: `#191919`
- **Border Subtle**: `#202020` (dividers, soft card outlines)
- **Border Strong**: `#2e2e2e` (active states, focus rings)
- **Text Primary**: `#ffffff` (high contrast, crisp)
- **Text Secondary**: `#888888`
- **Text Muted**: `#555555`

### Status Indicators (Horizon Standard)
- **Positive / Gain**: `#30d158` (Apple System Green)
- **Negative / Loss / Alert**: `#ff453a` (Apple System Red)
- **Warning / Pending**: `#ffd60a` (Apple System Yellow)

### Typography & Numbers
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif`
- **Metrics & Numbers**: Always enforce tabular numbers (`font-variant-numeric: tabular-nums; -webkit-font-feature-settings: "tnum"`) for weights, reps, timers, and financial values.

---

## 2. Per-App Primary Theming
Each app specifies a `primary` color plus tonal variants (`light`, `muted`) and an optional `accent`:

### Volc Configuration
- **Primary**: `#f84f3e` (coral red-orange)
- **Primary Light / Glow**: `#f86b5c`
- **Primary Muted**: `#d4412f`
- **Primary Tint**: `rgba(248, 79, 62, 0.15)`
- **Accent**: `#ff8c00`

---

## 3. Motion & Surface Polish (Volc Signatures)
- **Content Transitions**: Subtle cross-fades (`opacity 0.15s ease-out`) rather than sliding or jarring layout jumps.
- **SafeAreaView Overlays**: Blur gradients (`BlurView` intensity 40–60, dark tint) on headers, floating input bars, and bottom sheets so scrolling content fades smoothly beneath Chrome.
- **Tactile Micro-interactions**: Slight scale down (`transform: scale(0.98)`) and opacity drop (`0.9`) on press/active states.
- **Data Denseness**: Avoid empty whitespace padding without purpose; prioritize clear hierarchy and scannability.
