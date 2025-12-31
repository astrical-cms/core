# Protocol: Media Assets & Image Optimization

**Status:** Active Protocol
**Scope:** `src/assets/`, `public/`, `src/utils/images-optimization.ts`
**Key Systems:** Astro Assets, Unpic, Image Optimizer

## 1. The Core Philosophy: "Optimize by Default"

Astrical automatically optimizes images to ensure high performance (Core Web Vitals). We handle two types of assets differently:

1.  **Local Assets (`src/assets/`)**: Processed at build-time by Astro. Best for UI elements, backgrounds, and static content.
2.  **Public/Remote Assets (`public/` or URL)**: Processed at runtime (or simply served). Best for CMS content, user uploads, or frequently changing media.

---

## 2. Where to put files?

| Location | Use Case | Implementation | Optimization? |
| :--- | :--- | :--- | :--- |
| **`src/assets/`** | Static UI images (Logos, Icons, Hero Backgrounds). | `import img from '~/assets/img.png'` | ✅ Yes (Build Time) |
| **`public/`** | files referenced by YAML Content (CMS) or direct links (`/favicon.ico`). | String path: `/images/hero.png` | ⚠️ Runtime (via Unpic/Edge) |
| **Remote (URL)** | Images hosted on CDNs, AWS S3, or Cloudinary. | String path: `https://example.com/img.jpg` | ✅ Yes (via Unpic) |

---

## 3. Using Images in YAML Content

When defining pages in `content/pages/*.yaml`, you typically use string paths.

### A. Reference a Public Image
Place the image in `public/images/dashboard.png`.
```yaml
- type: Hero
  image:
    src: '/images/dashboard.png'  # Starts with slash, relative to public/
    alt: 'Dashboard Screenshot'
```

### B. Reference a Remote Image
```yaml
- type: Hero
  image:
    src: 'https://images.unsplash.com/photo-1234'
    alt: 'Stock Photo'
```

---

## 4. The Image Optimization Utility

We provide a unified utility `getImagesOptimized` in `src/utils/images-optimization.ts` that handles both scenarios transparently.

**Key Features:**
*   **Auto-Format:** Converts to WebP.
*   **Responsive:** Generates `srcset` for different device widths.
*   **Layouts:** Supports `constrained` (default), `fixed`, `fullWidth`, `cover`.

### Layout Strategies

1.  **`constrained`** (Default): Image has a max-width but shrinks on mobile.
2.  **`fullWidth`**: Always spans 100vw. Good for backgrounds.
3.  **`fixed`**: Never resizes. Good for icons/avatars.
4.  **`cover`**: Fills the container (needs object-fit).

---

## 5. Coding proper Images (in Components)

If you are building a new component (`.astro`), **do not use the standard `<img>` tag**. Use the optimized flow.

### Example: Implementing an Image in a Component

```astro
---
import type { Image as ImageProps } from '~/types';
import Image from '~/components/common/Image.astro'; // <--- Use this wrapper

interface Props {
  image?: ImageProps;
}

const { image } = Astro.props;
---

{image && (
  <div class="relative">
    <Image
      src={image.src}
      alt={image.alt}
      width={600}       // Default width (if not in YAML)
      layout="constrained"
      class="rounded-lg shadow-md"
    />
  </div>
)}
```

`~/components/common/Image.astro` internally calls `getImagesOptimized`, detecting if `src` is a string (public/remote) or an import (local).

---

## 6. Video & Other Media

Astro currently does not optimize video files (`.mp4`, `.webm`).

1.  **Host Externally:** Preference is using YouTube/Vimeo/Cloudflare Stream.
2.  **Public Folder:** If you must host locally, put them in `public/videos/`.
3.  **Usage:** Use the standard `<video>` tag or the `VideoPlayer` widget.

```yaml
- type: VideoPlayer
  youtubeId: 'dQw4w9WgXcQ'
```
