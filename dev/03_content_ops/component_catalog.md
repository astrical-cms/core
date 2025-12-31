# Component & Configuration Catalog

This document serves as a detailed reference for all configuration files and available components within the Astrical content system. It complements the [Page Recipes](page_recipes.md) guide.

## Site Configuration

Global site settings and navigation menus are managed in specific YAML files.

### Global Configuration

The primary site configuration is located at `content/config.yaml`.

**Example**:

```yaml
site:
  name: 'Organization Name'
  organization: 'Organization Name'
  site: 'https://example.com'
  announcement: ''
  base: '/'
  trailingSlash: false
  googleSiteVerificationId: 'xxxxxxx'

metadata:
  title:
    default: 'Organization Name'
    template: '%s — Organization Name'
  description: "Organization Description"
  robots:
    index: true
    follow: true
  openGraph:
    site_name: 'Organization Name'
    images:
      - url: '~/assets/images/default.png'
        width: 1200
        height: 628
    type: 'website'
  twitter:
    handle: '@organization'
    site: '@organization'
    cardType: 'summary_large_image'

i18n:
  language: 'en'
  textDirection: 'ltr'

analytics:
  vendors:
    googleAnalytics:
      id: 'G-XXXXXXXXXX'
    googleTagManager:
      id: 'GTM-XXXXXXXXXX'
    facebook:
      id: 'XXXXXXXXXXXXXX'

ui:
  theme: 'default'
```

### Navigation Menus

Navigation menus are defined in the `content/menus/` directory. Each file corresponds to a specific menu location.

- **Header Navigation**: `content/menus/header.yaml`
  - An array of link objects. Nested `links` create dropdowns.
  - **Schema**: `[{ text: string, href: string, links: [{ text: string, href: string }] }]`

- **Header Actions**: `content/menus/actions.yaml`
  - An array of CallToAction objects for buttons in the header.
  - **Schema**: `[{ text: string, href: string, variant: string }]`

- **Footer Navigation**: `content/menus/footer.yaml`
  - An array of link group objects, where each object represents a column in the footer.
  - **Schema**: `[{ title: string, links: [{ text: string, href: string }] }]`

- **Auxiliary Footer Links**: `content/menus/auxillary.yaml`
  - A simple array of links for the bottom-most part of the footer.
  - **Schema**: `[{ text: string, href: string }]`

- **Social Media Links**: `content/menus/social.yaml`
  - An array of social media links, including icons.
  - **Schema**: `[{ ariaLabel: string, icon: string, href: string }]`

## Common Data Structures

These are reusable data structures referenced by various components.

### Image
Defines an image with properties for source, alt text, and linking.

### CallToAction
Defines a call-to-action element, typically a button or a link.

### Item
A generic content item used in lists and grids.

## Component Dictionary (The "API")

Components are the building blocks of a page, placed inside a section's `components` array.

### Component Reference (Shared Components)

**Purpose**: Embeds a reusable component from the `content/shared/` directory. This is used to avoid duplicating content across multiple pages. Any property from the original component's schema can be included to override the value from the shared file for a specific instance.

**Example**:
```yaml
- component: 'cta/service_inquiry'
  title: 'A Custom Overridden Title'
  subtitle: 'This subtitle will be used instead of the one in the shared file.'
```

### Brands

**Purpose**: Renders a showcase of brand logos or icons.

**Example**:
```yaml
- type: Brands
  title: 'Powered by Open Source'
  subtitle: 'Leveraging popular technologies you already trust.'
  images:
    - src: '/_image/software/icons/python.svg'
      alt: 'Python Language'
      href: 'https://www.python.org/'
      target: '_blank'
    - src: '/_image/software/icons/docker.svg'
      alt: 'Docker Container Runtime'
      href: 'https://www.docker.com/'
      target: '_blank'
```

### CallToAction

**Purpose**: Renders a call-to-action section with a title and one or more buttons.

**Example**:
```yaml
- type: CallToAction
  title: 'Ready to get started?'
  subtitle: 'Book a consultation to learn more.'
  actions:
    - variant: primary
      text: 'Book a Consultation'
      href: '/book-a-consultation'
      icon: 'tabler:calendar-event'
```

### Content

**Purpose**: Renders a flexible content block that can display text, an image, and a list of items in a responsive grid.

**Example**:
```yaml
- type: Content
  title: 'Flexible, Efficient, and Extensible'
  isReversed: true
  items:
    - title: 'Modular, Extensible Architecture'
      description: 'Easily integrate diverse data sources with a pluggable system.'
      icon: 'tabler:layers-linked'
    - title: 'Unified Data Models'
      description: 'Leverage integrated, dynamically generated data models.'
      icon: 'tabler:database'
  image:
    src: '/_image/software/processing-data.png'
    alt: 'Data Integration Features'
```

### FAQs

**Purpose**: Renders a frequently asked questions section in a grid layout.

**Example**:
```yaml
- type: FAQs
  title: 'Frequently Asked Questions'
  columns: 2
  items:
    - title: 'How does it handle large-scale data integration?'
      description: 'It uses Kubernetes and serverless technologies to scale horizontally.'
    - title: 'Can I customize data models?'
      description: 'Yes, the modular framework allows you to plug in and override data models.'
```

### Features

**Purpose**: Renders a grid of feature items, typically with an icon, title, and description. This is the primary, most common feature grid.

**Example**:
```yaml
- type: Features
  title: 'Values'
  subtitle: 'Principles that shape how we design, deliver, and partner.'
  columns: 3
  items:
    - title: 'Transparency'
      description: 'Open architectures, clear roadmaps, and visibility into every layer.'
      icon: 'tabler:eye'
    - title: 'Ownership'
      description: 'You keep the code, the infrastructure, and the governance controls.'
      icon: 'tabler:key'
```

### Features2

**Purpose**: An enhanced version of the Features widget with a different default layout style.

**Example**:
```yaml
- type: Features2
  title: 'API & MCP Accelerator outcomes'
  subtitle: 'Accelerate innovation with AI-ready interfaces and resilient delivery.'
  columns: 3
  items:
    - title: 'Rapid API generation'
      description: 'Produce secure, OpenAPI-compatible endpoints automatically.'
      icon: 'tabler:api'
    - title: 'AI-friendly MCP layer'
      description: 'Expose a standardised, stateful control plane for AI agents.'
      icon: 'tabler:circuit-switch-closed'
```

### Features3

**Purpose**: An enhanced features widget that displays a collection of feature items alongside a prominent image above the items.

**Example**:
```yaml
- type: Features3
  title: 'How we work'
  subtitle: 'A clear, accelerated path from idea to production-ready AI.'
  columns: 2
  items:
    - title: 'Discovery & Design'
      description: 'Kick off with focused workshops to align on goals and success metrics.'
      icon: 'tabler:square-number-1'
    - title: 'Prototyping in days'
      description: 'Stand up a governed proof of concept that exercises real data flows.'
      icon: 'tabler:square-number-2'
```

### Hero

**Purpose**: Renders a prominent hero section, typically at the top of a page, with a title, subtitle, actions, and a large image.

**Example**:
```yaml
- type: Hero
  title: 'Organization Name: Your tagline'
  subtitle: 'Your subtitle'
  actions:
    - variant: primary
      text: 'Talk to Us'
      href: '/contact'
      icon: 'tabler:message'
```

### Hero2

**Purpose**: An enhanced hero widget with a two-column layout, displaying content on one side and an image on the other.

**Example**:
```yaml
- type: Hero2
  title: 'Organization Name'
  subtitle: 'Your subtitle'
  tagline: 'Your tagline'
  image:
    src: '/_image/software/system-components.png'
    alt: 'Platform Components'
```

### HeroText

**Purpose**: Renders a text-focused hero section without an image. Supports up to two call-to-action buttons.

**Example**:
```yaml
- type: HeroText
  title: 'A Text-Focused Headline'
  subtitle: 'This hero section uses only text to convey its message.'
  callToAction:
    text: 'Primary Action'
    href: '/primary'
  callToAction2:
    text: 'Secondary Action'
    href: '/secondary'
```

### Note

**Purpose**: Renders a visually distinct note or announcement block, often with an icon.

**Example**:
```yaml
- type: Note
  subject: 'Integration'
  statement: 'Unify your operational data and supercharge your analytics with automated, scalable pipelines.'
  icon: 'tabler:link'
```

### Pricing

**Purpose**: Renders a grid of pricing plans.

**Example**:
```yaml
- type: Pricing
  title: 'Production-ready AI packages'
  prices:
    - title: 'API & MCP Accelerator'
      price: '1,990'
      period: 'Delivery within 24 hours'
      items:
        - description: '24-hour delivery of new endpoints.'
          icon: 'tabler:clock-hour-1'
      callToAction:
        - variant: primary
          text: 'Pay now'
          href: 'https://buy.stripe.com/...'
```

### SectionHeader

**Purpose**: Renders a section header with a title, subtitle, and an optional separator line.

**Example**:
```yaml
- type: SectionHeader
  title: 'Course Instructors'
  separator: true
```

### Stats

**Purpose**: Renders a grid of key metrics or data points.

**Example**:
```yaml
- type: Stats
  title: 'The Surging Adoption of Multi-Agent Systems'
  stats:
    - title: 'Enterprise Adoption of AI Agents'
      amount: '33%'
      description: 'By 2028, 33% of enterprise software applications will include agentic AI.'
    - title: 'Large Enterprises Planning to Integrate AI Agents'
      amount: '82%'
      description: '82% plan to integrate them within the next three years.'
```

### Steps

**Purpose**: Renders a step-by-step process in a timeline format, typically alongside an image.

**Example**:
```yaml
- type: Steps
  title: 'Engagement designed for ownership'
  isReversed: true
  items:
    - title: 'Co-designed architectures'
      description: 'Work shoulder-to-shoulder with architects.'
      icon: 'tabler:layout-2'
  image:
    src: '/_image/strategy/ai-framework.svg'
    alt: 'AI delivery approach'
```

### Steps2

**Purpose**: An enhanced step-by-step process widget with a two-column layout.

**Example**:
```yaml
- type: Steps2
  title: 'Getting started'
  subtitle: 'Bring the platform online in your environment with a guided rollout.'
  items:
    - title: 'Scope the modules'
      description: 'Align on the knowledge, agent, and interface components you need first.'
      icon: 'tabler:number-1'
    - title: 'Deploy with accelerators'
      description: 'Use infrastructure-as-code and CI/CD templates to stand up environments in days.'
      icon: 'tabler:number-2'
```

### Testimonials

**Purpose**: Renders a grid of testimonials or quotes.

**Example**:
```yaml
- type: Testimonials
  title: 'What Our Clients Say'
  testimonials:
    - name: 'Jane Doe'
      job: 'CEO, ExampleCorp'
      testimonial: 'This service transformed our business.'
      image:
        src: '/_image/avatars/jane-doe.png'
        alt: 'Jane Doe'
```

### VideoPlayer

**Purpose**: Renders an embedded YouTube video player.

**Example**:
```yaml
- type: VideoPlayer
  title: 'Watch Our Demo'
  youtubeId: 'dQw4w9WgXcQ'
```

## Managing Forms

Forms are added to pages using the `Form` component. The form's structure and behavior are defined entirely within the YAML configuration.

**Form Example**:

```yaml
- type: Form
  name: contact
  title: 'Book a consultation'
  disclaimer: 'By submitting this form, you agree to our terms.'
  note: 'We respond within 24 business hours.'
  buttonText: 'Book Consultation'
  redirect: contact_success
  recipients:
    - adrian@cellebris.com
    - kieran@cellebris.com
  fields:
    - type: ShortText
      name: name
      label: 'Name'
      required: true
    - type: Email
      name: email
      label: 'Email'
      required: true
    - type: LongText
      name: project_goals
      label: 'Project Goals / Use Case'
      required: true
      rows: 4
    - type: Select
      name: industry
      label: 'Industry / Sector'
      required: true
      options:
        - name: healthcare
          label: 'Healthcare'
        - name: insurance
          label: 'Insurance'
        - name: other
          label: 'Other'
```
