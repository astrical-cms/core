# Component Catalog (Core)

**Status:** Auto-Generated Manifest
**Scope:** `src/components/`

This document lists the components available in the **Core** engine.
*Note: Most functional widgets (Hero, Features, Pricing) are provided by **Modules**, not Core.*

## 1. Core Widgets (`components/widgets/*.astro`)
These are dynamic components you can use in `content/pages/*.yaml` with `- type: [Name]`.

| Component Name | Description |
| :--- | :--- |
| **`RoleRedirect`** | Logic component to redirect users based on auth role. |
| **`SectionHeader`** | Standard header for a section (Title, Subtitle). |

*To find more widgets, check `modules/*/src/components/widgets/`.*

## 2. Core Sections (`components/sections/*.astro`)
These are layout containers for sections. Use with `layout: [Name]`.

| Layout Name | Description |
| :--- | :--- |
| **`SingleColumn`** | Standard vertical stack content. |
| **`TwoColumn`** | Split 50/50 layout. |
| **`ThreeColumn`** | 3-column grid. |
| **`Header`** | Site header layout (used contextually). |
| **`Footer`** | Site footer layout (used contextually). |

## 3. Core Forms (`components/forms/*.astro`)
Available form fields.

| Component | Type |
| :--- | :--- |
| **`Form`** | The container. |
| **`Checkbox`** | `fields/Checkbox.astro` |
| **`Email`** | `fields/Email.astro` |
| **`FileUpload`** | `fields/FileUpload.astro` |
| **`LongText`** | `fields/LongText.astro` |
| **`Select`** | `fields/Select.astro` |
| **`ShortText`** | `fields/ShortText.astro` |

## 4. UI Primitives (`components/ui/*.astro`)
Reusable atoms used by other components. NOT available in YAML directly.

*   `Button`
*   `Headline`
*   `Image` (Optimized)
*   `ToggleTheme`
*   `WidgetWrapper`

## 5. Page Components (`components/page/*.astro`)
Singletons used by `PageLayout`.

*   `Header` (Site Navigation)
*   `Footer` (Site Footer)
*   `Announcement` (Top Banner)
