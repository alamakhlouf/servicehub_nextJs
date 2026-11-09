---
name: ServiceHub
description: A dark-first local marketplace design system for clear, trustworthy actions.
colors:
  primary: "#2563EB"
  primary-hover: "#3B82F6"
  primary-strong: "#1D4ED8"
  secondary: "#10B981"
  secondary-hover: "#34D399"
  tertiary: "#F59E0B"
  background: "#0B1220"
  surface: "#111A2E"
  surface-elevated: "#182238"
  surface-interactive: "#202C46"
  text: "#F8FAFC"
  text-muted: "#A7B3C9"
  text-subtle: "#71809A"
  border: "#2B3852"
  border-strong: "#43516C"
  success: "#34D399"
  warning: "#FBBF24"
  error: "#F87171"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

## Overview

ServiceHub is a compact, dark-first marketplace system for customers, providers, suppliers, and admins. It follows the supplied design-system reference: navy tonal layering creates structure, blue owns primary action, green communicates success, and amber is reserved for attention. The interface should feel dependable and operational rather than decorative.

## Colors

The page canvas is `#0B1220`. Use `#111A2E` for standard surfaces and `#182238` for elevated or focused surfaces. `#202C46` is reserved for interactive hover/selected states. Use `#F8FAFC` for primary text, `#A7B3C9` for supporting text, and `#71809A` for secondary metadata. Borders remain subtle at `#2B3852`, with `#43516C` for stronger outlines.

Use `#2563EB` for primary actions and links, with `#3B82F6` on hover and `#1D4ED8` for active/pressed states. Use `#10B981` and `#34D399` for success and secondary actions. Use `#F59E0B`/`#FBBF24` sparingly for warnings. Reserve `#F87171` for errors and destructive actions. Never make amber the dominant surface or use accent colors as small text on same-hue backgrounds.

## Typography

Headings use Plus Jakarta Sans; body copy, labels, and controls use Inter. Display text begins at 36px on desktop and scales down to 30px on compact screens. Headline, title, body, and label roles use the frontmatter scale. Headings use a restrained negative tracking; body copy stays at a readable 1.5 line-height and roughly 65–75 characters per line.

## Layout

Use a centered `max-width: 1280px` container with 16px gutters on mobile, 24px on tablet, and 32px on desktop. Breakpoints are 640px (small), 768px (tablet), 1024px (desktop), and 1280px (wide). Stack content on mobile; introduce two-column layouts at 768px and persistent desktop navigation at 1024px. Use the 4/8/16/24/32px spacing rhythm, with 48px and 64px reserved for major section separation.

## Elevation & Depth

The system prefers tonal layering over heavy decoration. Standard surfaces use `--shadow-sm`; dialogs and prominent overlays use `--shadow-lg`. Shadows are soft, offset, and low-opacity. Avoid gradients, glass effects, hard offset shadows, and nested card stacks.

## Shapes

Controls use 6px corners, cards use 14px, dialogs use 18px, and status badges use a pill radius. Borders are 1px and use the border tokens. Inputs have a minimum 40px height; primary touch targets should be at least 40px, with 44px preferred for mobile. Focus uses a 2px blue outline with a 3px offset.

## Components

- **Button:** `primary`, `secondary`, `outline`, `ghost`, and `danger` variants; `sm`, `md`, and `lg` sizes; disabled and loading states. Labels name the action.
- **Input / Select / Textarea:** always include a visible label. Error copy appears below the field and uses `role="alert"`. Placeholder text is subdued but readable.
- **Card:** neutral navy surface, 1px border, restrained shadow, and no colored side stripe.
- **Badge:** compact semantic status indicator using neutral, primary, success, warning, or error tones.
- **Dialog:** native modal dialog with a protected focus context, clear title, close button, and backdrop. Use only for interruption or confirmation, not ordinary page content.
- **Avatar:** image or initials fallback with accessible naming and three sizes.
- **Navigation:** compact desktop links and horizontally scrollable mobile links; selected state uses an elevated navy surface.
- **Loading:** explicit status text with a spinner, plus neutral skeleton blocks for content loading.

## Do's and Don'ts

- Do use one primary action per region and keep the hierarchy obvious.
- Do preserve visible focus, keyboard access, semantic labels, and honest loading/error/empty states.
- Do use cards for meaningful grouping, not as the default wrapper for every piece of content.
- Do keep color accents purposeful and maintain readable contrast.
- Don't use generic gradient dashboards, excessive card grids, orange-dominant layouts, or decorative glassmorphism.
- Don't use emoji or Unicode glyphs as icons; use the shared SVG icon primitives or a consistent icon library.
- Don't claim offline actions succeeded; distinguish cached content, drafts, and pending sync.
