---
name: Operational Precision
colors:
  surface: '#fbf9fb'
  surface-dim: '#dbd9db'
  surface-bright: '#fbf9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f5'
  surface-container: '#efedef'
  surface-container-high: '#eae7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#44474d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f2f0f2'
  outline: '#75777e'
  outline-variant: '#c5c6cd'
  surface-tint: '#515f78'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0d1c32'
  on-primary-container: '#76849f'
  inverse-primary: '#b9c7e4'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#23005c'
  on-tertiary-container: '#9466ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#fbf9fb'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin: 24px
---

## Brand & Style

The brand personality is authoritative, systematic, and unflappable. Designed for industries where precision is non-negotiable—accounting, HR, and finance—this design system prioritizes clarity over decoration. It evokes an emotional response of "calm control" amidst complex workflows.

The visual style is **Corporate / Modern**. It utilizes a structured mathematical grid to ensure that even high-density information remains legible and accessible. By balancing a deep, institutional navy with crisp, functional whites and grays, the UI establishes an immediate sense of professional trust and operational maturity.

## Colors

The palette is anchored by **Deep Navy Blue**, used for core navigation and primary structural elements to project stability. **Vibrant Blue** is the primary interactive driver, used for buttons, links, and active states to guide the eye toward action. **Purple** is reserved for specialized "Value-Add" features, such as automation triggers or insights.

The background system uses a two-tier approach: **White** for primary content surfaces and **Light Gray** for the underlying canvas and decorative grouping. This subtle contrast helps define layout boundaries without the need for heavy borders. Semantic colors for success, warning, and error follow industry standards but are slightly desaturated to maintain a professional, rather than alarming, tone.

## Typography

The typography system relies exclusively on **Inter**, chosen for its exceptional legibility in data-heavy environments and its neutral, systematic aesthetic. 

The scale is optimized for functional hierarchy. Headlines use a tighter letter-spacing and heavier weights to command attention, while body text remains at a comfortable 14px-16px for long-form reading of procedures. For high-density tables and metadata, the 12px label and caption styles allow for maximum information display without sacrificing clarity.

## Layout & Spacing

This design system employs a **Fluid Grid** model based on an 8px base unit (with a 4px half-step for micro-adjustments). The primary layout utilizes a 12-column grid for the main content area, allowing for flexible arrangements of sidebars, task lists, and detail panels.

To achieve high operational density, vertical padding is tightened while horizontal margins are preserved to prevent visual crowding. Information grouping should rely on logical clusters and whitespace rather than excessive lines. Standard gutters are set to 16px to ensure a compact but readable flow of data in multi-column forms or dashboards.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**. 

The design system avoids dramatic shadows in favor of a flatter, more architectural depth. Surfaces are tiered:
- **Level 0 (Canvas):** Light Gray (#F8FAFC) background.
- **Level 1 (Cards/Sections):** White (#FFFFFF) surfaces with a 1px border (#E2E8F0).
- **Level 2 (Popovers/Modals):** White surfaces with a soft, diffused shadow (0px 4px 12px rgba(10, 25, 47, 0.08)).

This approach ensures that the UI feels integrated and sturdy, suitable for a platform managing sensitive operational procedures.

## Shapes

The shape language is defined by **Soft/Rounded** geometry. A base radius of 8px (Level 2) is applied to buttons, input fields, and standard cards. Larger containers like modals or main content areas may use up to 12px-16px (rounded-lg/xl) to soften the professional aesthetic and make the platform feel modern and approachable.

This roundedness balances the "hard" nature of corporate data, providing a tactile, user-friendly interface that reduces visual fatigue during extended periods of use.

## Components

### Buttons
- **Primary Action:** Solid Deep Navy or Vibrant Blue with white text. 8px radius.
- **Secondary Action:** Ghost style with a 1px Navy border or Light Gray background.
- **Status Buttons:** Used sparingly; success green or error red for definitive final actions.

### Input Fields
- High-density design (36px-40px height).
- 1px Light Gray border that transitions to Vibrant Blue on focus.
- Labels are 12px bold, positioned above the field for maximum scanability in forms.

### Cards & Containers
- White background with a 1px border.
- Used to group procedure steps or financial line items.
- Headers within cards should have a subtle bottom border or a slightly darker gray header background.

### Status Chips
- Small, pill-shaped badges (radius-full).
- Use low-opacity background tints (e.g., 10% opacity Emerald Green) with high-contrast text for high legibility without being visually overwhelming.

### Lists & Data Tables
- Row-based layouts with subtle hover states (#F1F5F9).
- Clean dividers (1px) between rows.
- Compact padding (8px-12px) to allow more data visibility per screen.

### Process Progress Bars
- Slim (4px-8px height) trackers using the Vibrant Blue or Success Green to indicate completion percentage of operational workflows.