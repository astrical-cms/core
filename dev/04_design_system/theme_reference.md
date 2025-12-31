# Theme Reference & Style Guide

This document complements [Tokens](tokens.md) and [Atomic CSS](aromic_css.md) by detailing the implementation of the `style.yaml` blueprint and providing strategic design rules.

## The Blueprint (`style.yaml`)

The `style.yaml` file contains the mapping of semantic components to Tailwind classes. It is organized into **Style Groups**.

### Syntax & References
*   **Simple String**: Just a list of utility classes.
    ```yaml
    title: 'text-4xl font-bold text-default'
    ```
*   **Variable Reference (`@`)**: Reuses a value defined at the root of `style.yaml`.
    ```yaml
    # Root variable
    section_columns: 'gap-12 md:gap-20'

    # Usage
    Section+TwoColumn:
      column_wrapper: '@section_columns'
    ```

### Comprehensive Style Reference
Refer to `dev/theme.spec.yaml` for the exact schema. Below are the key groups you will encounter.

#### A. Layouts (`Layout+*`)
Global structural styles.
*   **`Layout+Base`**: Targets `<html>` and `<body>`. Set base font size here.
*   **`Layout+Page`**: Targets `<main>`. Usually empty, but can set global padding.
*   **`Layout+Markdown`**: Critical for content pages.
    *   `content`: **MUST** include `prose dark:prose-invert` to style raw Markdown.

#### B. Sections (`Section+*`)
Layouts for major page blocks. All sections support a background image overlay pattern.
*   **`Component+SectionWrapper`**: The base class for all sections.
    *   `container`: Controls vertical padding (e.g., `py-12 md:py-20`).
    *   `overlay`: Styles the layer over background images (e.g., `bg-black/50`).
*   **`Section+SingleColumn`**: Centered content.
*   **`Section+TwoColumn`**: Split layout (Text + Image).
    *   `column_wrapper`: Controls the gap between columns.
*   **`Section+Header` / `Section+Footer`**: Special sections that often have zero padding (`py-0`).

#### C. Components (`Component+*`)
Reusable UI widgets.
*   **`Component+Button`**:
    *   `primary`: Styles `.btn-primary` (Use `global.css` for the definition).
*   **`Component+Headline`**:
    *   `title`: Main heading style (e.g., `text-4xl`).
    *   `tagline`: Small uppercase label above title.
    *   `subtitle`: Descriptive text below title.
*   **`Component+Form`**:
    *   Controls layout of all form inputs.
    *   Sub-groups: `Form+ShortText`, `Form+Email`, `Form+Checkbox`.

#### D. Page Components (`Page+*`)
Global site singletons.
*   **`Page+Header`**: The top navigation bar.
    *   `header`: Sticky behavior, background color.
    *   `nav_link`: Standard link styles.
    *   `link_active`: Style for the current page (e.g., `text-primary`).
*   **`Page+Footer`**: The site footer.
    *   `links_grid`: Responsive grid for footer links.

## Design Intelligence: How to Style

When asked to "create a theme" or "update styles," follow these rules to ensure high-quality output.

### Rule 1: Visual Hierarchy
Don't make everything bold and big.
*   **Headings**: Bold, tight tracking (`tracking-tight`), separate from body.
*   **Body**: Readable height (`leading-relaxed`), lighter color (`text-muted`).
*   **Taglines**: Small, uppercase, wide tracking (`tracking-wide`), accent color.

### Rule 2: Depth & Texture
A flat white page is boring. Use background variety.
*   **Base**: `bg-page` (White/Dark Gray).
*   **Cards**: `bg-surface` (Off-white/Black).
*   **Popups**: `bg-surface-elevated` (Bright White/Darker Gray).
*   **Shadows**: Use `shadow-sm` for cards, `shadow-xl` for floating elements.

### Rule 3: Mobile-First
Always write classes for mobile first, then modify for desktop.
*   **Good**: `grid-cols-1 md:grid-cols-2` (Stacks on mobile, side-by-side on desktop).
*   **Bad**: `grid-cols-2` (Squished columns on mobile).

### Rule 4: Dark Mode
Every color-related class **must** have a dark mode equivalent if it's not handled by a CSS variable.
*   **Tailwind**: `text-gray-900 dark:text-white`.
*   **CSS Vars (Preferred)**: `text-default` (Handles switching automatically).

### Rule 5: Background Images
If a component supports a `bg` image:
1.  Assume the image might be noisy.
2.  **ALWAYS** apply an overlay in `style.yaml`:
    ```yaml
    wrapper:
      overlay: 'bg-black/60' # Ensure text is readable
    ```

## Theming Workflow Example

**User Request**: "Make the hero section look more modern with a dark theme and larger text."

**Plan**:
1.  **Analyze**: "Hero section" maps to `Component+Hero` (or `Section+SingleColumn` used as hero).
2.  **Locate**: Open `src/themes/[theme]/style.yaml`.
3.  **Edit `Component+Hero`**:
    *   Increase title size: `text-5xl md:text-7xl`.
    *   Add gradient text: `text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600`.
4.  **Edit `Section+Header`** (Wrapper):
    *   Remove padding: `py-0`.
    *   Add dark background: `bg-slate-900`.
5.  **Validate**: Run `npm run validate` to ensure YAML correctness.

## Troubleshooting

*   **Changes not showing?**
    *   Is the server running? (`npm run dev`)
    *   Did you edit the correct theme? Check specific `content/style.yaml` overrides.
    *   Did you save the file?
*   **"Missing Property" Error**:
    *   Check `src/core/dev/style.spec.yaml`. You can only use keys defined there.
*   **Styles look broken on mobile**:
    *   Check for fixed widths (`w-96`). Use `max-w-*` instead.
    *   Check `flex-row` without wrapping. Use `flex-col md:flex-row`.
