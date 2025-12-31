# Protocol: Middleware (The Interceptor Layer)

**Status:** Active Protocol
**Scope:** `src/middleware.ts`, `modules/*/src/middleware.ts`
**Key Systems:** Astro Middleware, Auto-Wiring, `site:config`

## 1. The Core Philosophy: "Chain of Responsibility"

Middleware allows us to intercept requests and responses **before** they reach the page or API route. In Astrical, middleware is modular.

*   **Core Middleware**: `src/middleware.ts` acts as the orchestrator.
*   **Module Middleware**: Each module can define its own `middleware.ts`.
*   **Execution Order**: Determined by `site:config` (topological sort of module dependencies).

---

## 2. Default Capabilities

Astrical provides built-in middleware capabilities via the core or standard modules:

1.  **Locals Injection**: Populates `context.locals` with runtime environment (`runtime.env`).
2.  **Auth (via Modules)**: Verifies sessions and populates `context.locals.user`.
3.  **I18n**: Detects locale from URL or headers.

---

## 3. Creating Middleware (in a Module)

To add middleware, simply create a `middleware.ts` file in your module's source root. It is **auto-wired** by the core engine.

**File:** `modules/my-security-module/src/middleware.ts`

```typescript
import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async (context, next) => {
    // 1. Pre-Processing (Before Page/API)
    const start = Date.now();
    
    console.log(`[Request] ${context.request.method} ${context.url.pathname}`);

    // Example: Block generic bots (simple/naive)
    const userAgent = context.request.headers.get('user-agent') || '';
    if (userAgent.includes('BadBot')) {
        return new Response('Forbidden', { status: 403 });
    }

    // 2. Next (Run other middlewares and the page)
    const response = await next();

    // 3. Post-Processing (After Page/API)
    const duration = Date.now() - start;
    response.headers.set('X-Response-Time', `${duration}ms`);

    return response;
});
```

---

## 4. Middleware vs Guards

| Feature | Middleware | Guard |
| :--- | :--- | :--- |
| **Scope** | Global (runs on every request). | Local (runs on specific routes). |
| **Purpose** | Cross-cutting concerns (Logging, Header injection). | Specific Security (Admin check, Rate limit). |
| **Context** | Modifies `context.locals` or headers. | Validates context state. |

**Rule of Thumb:**
*   Use **Middleware** to *populate* data (e.g., "Find the user session").
*   Use **Guards** to *check* data (e.g., "Is this user an Admin?").

---

## 5. Troubleshooting

*   **Middleware not running?**
    *   Ensure the file is named exactly `middleware.ts`.
    *   Ensure it exports `onRequest`.
    *   Ensure the module is enabled in `project_manifest.yaml` (or auto-discovered).
