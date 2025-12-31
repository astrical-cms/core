# Protocol: Application Logic - Guards

**Status:** Active Protocol
**Scope:** `src/guards/**/*.ts`
**Key Systems:** Validation, Authorization, Security Boundaries
**Template:** `src/core/dev/templates/logic/GenericGuard.ts`

## 1. The Core Philosophy: "Defense in Depth"

A **Guard** is a self-contained unit of logic responsible for protecting a resource. It answers one question: **"Is this request allowed to proceed?"**

Unlike a Schema Validator (which checks *shape*), a Guard checks *context* (Permissions, Rate Limits, Feature Flags).

*   **Role:** The "Bouncer" of the application.
*   **Location:** `src/guards/` (User Logic) or `src/core/dev/templates/logic/` (Templates).
*   **Dependency:** Implemented in API Routes or Middleware.

---

## 2. The "Logic Wrapper" Pattern

We use the **Generic Guard** pattern to wrap complex validation logic into reusable classes.

### Why not just write `if` statements in the API Route?

*   **Reusability:** You can use the same `RateLimitGuard` in 50 different routes.
*   **Testability:** You can unit test the Guard without mocking the entire Astro Request object.
*   **Consistency:** All security failures return standardized error codes (401, 403, 429).

---

## 3. Implementation Recipe

### Step 1: Create the Guard
Copy the template `src/core/dev/templates/logic/GenericGuard.ts` to `src/guards/MyGuard.ts`.

```typescript
import { GenericGuard, type GuardResult } from '~/core/dev/templates/logic/GenericGuard'; // Adjust import
import type { APIContext } from 'astro';

export class AdminRoleGuard extends GenericGuard {
    readonly name = 'admin-role-guard';

    async validate({ locals }: APIContext): Promise<GuardResult> {
        // Assume 'locals.user' is populated by auth middleware
        const user = locals.user;

        if (!user) {
            return this.fail('Unauthorized', 401);
        }

        if (user.role !== 'admin') {
            return this.fail('Forbidden: Admin access required', 403);
        }

        return this.pass();
    }
}
```

### Step 2: Use in an API Route

Guards are typically instantiated and executed at the start of an endpoint.

```typescript
// src/pages/api/admin/delete-user.ts
import type { APIRoute } from 'astro';
import { AdminRoleGuard } from '~/guards/AdminRoleGuard';

export const POST: APIRoute = async (context) => {
    // 1. Guard
    const guard = new AdminRoleGuard();
    const result = await guard.validate(context);

    if (!result.allowed) {
        return new Response(JSON.stringify({ error: result.reason }), { 
            status: result.status 
        });
    }

    // 2. Act (Business Logic)
    // ... delete the user ...

    return new Response(JSON.stringify({ success: true }));
};
```

---

## 4. Common Guard Types

| Type | Purpose | Example Check |
| :--- | :--- | :--- |
| **AuthGuard** | Authentication | "Is `Authorization: Bearer` present?" |
| **RoleGuard** | Authorization | "Does user have `admin` role?" |
| **RateLimitGuard** | Traffic Control | "Has IP sent > 100 requests?" |
| **FeatureFlagGuard** | Feature Gating | "Is `BETA_FEATURE_X` enabled in Config?" |
| **HoneypotGuard** | Anti-Bot | "Is the hidden `_gotcha` field empty?" |

---

## 5. Best Practices

1.  **Fail Fast:** Guards should run *before* any heavy processing or database calls.
2.  **Standard Returns:** Always use `this.pass()` and `this.fail()` helpers to ensure consistent return shapes.
3.  **Composition:** You can chain multiple guards:
    ```typescript
    const guards = [new AuthGuard(), new AdminGuard()];
    for (const guard of guards) {
        const result = await guard.validate(ctx);
        if (!result.allowed) return fail(result);
    }
    ```
