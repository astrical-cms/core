# Protocol: Application Logic - Services

**Status:** Active Protocol
**Scope:** Client-Side State & Domain Logic
**Key Systems:** Nano Stores, Singleton Pattern
**Template:** `src/core/dev/templates/services/GenericService.ts`

## 1. The Core Philosophy: "Service Singletons"

In Astrical's Island Architecture, React/Preact components are isolated. A component in the Header cannot share state with a component in the Footer using standard React Context.

To bridge this gap, we use **Nano Stores** wrapped in a **Service Interface**.

### The Golden Rule
> **"State is Private. Access is Public."**
> Never export a raw Nano Store (`atom`, `map`). Always wrap it in a Service that exposes specific methods (`addItem`, `getUser`) and hooks (`useCart`).

---

## 2. Why use the Service Pattern?

1.  **Decoupling:** Components don't know *how* state is stored (Memory vs LocalStorage vs API). They just call methods.
2.  **Centralization:** Business logic (e.g., "Max 10 items in cart") lives in the Service, not in the UI component.
3.  **Universal Access:** The Service works in React Islands, Vanilla JS scripts, and even server-side utilities (snapshotting).

---

## 3. Implementation Recipe

### Step 1: Create the Service
Copy the template `src/core/dev/templates/services/GenericService.ts` to `src/services/MyService.ts`.

```typescript
// src/services/cart.ts
import { map } from 'nanostores';
import { useStore } from '@nanostores/react'; 

// 1. Private State
type CartState = { items: string[]; count: number };
const $store = map<CartState>({ items: [], count: 0 });

// 2. Public Service (Logic)
export const CartService = {
    addItem(item: string) {
        const current = $store.get();
        // Business Logic
        if (current.count >= 10) return; 
        
        $store.set({ 
            items: [...current.items, item], 
            count: current.count + 1 
        });
    },

    clear() {
        $store.set({ items: [], count: 0 });
    },
    
    // For non-reactive access (Vanilla JS)
    getSnapshot() {
        return $store.get();
    }
};

// 3. Public Hook (View)
export function useCart() {
    return useStore($store);
}
```

### Step 2: Usage in Islands (Reactive)

```tsx
// src/components/Cart.tsx
import { useCart, CartService } from '~/services/cart';

export default function Cart() {
    const { count } = useCart(); // Auto-updates!

    return (
        <button onClick={() => CartService.addItem('Apple')}>
            Items: {count}
        </button>
    );
}
```

### Step 3: Usage in Scripts (Non-Reactive)

```html
<!-- src/pages/index.astro -->
<script>
    import { CartService } from '~/services/cart';
    
    // Listen for external events
    document.addEventListener('buy-now', () => {
        CartService.addItem('Special Offer');
        console.log('Current Cart:', CartService.getSnapshot());
    });
</script>
```

---

## 4. Advanced: Persistence

To persist state to `localStorage`, simply swap `map` for `persistentMap` in the Service file. **No UI components need to change.**

```typescript
import { persistentMap } from '@nanostores/persistent';

// defined as 'cart:' prefix in localStorage
const $store = persistentMap<CartState>('cart:', { items: [], count: 0 });
```

---

## 5. Anti-Patterns

| Bad Practice | Why it fails | Correct Approach |
| :--- | :--- | :--- |
| **Exporting Raw Atoms** | `export const count = atom(0);` | Logic gets scattered across components. |
| **Direct Mutation** | `count.set(count.get() + 1)` in `.tsx`. | Hard to debug/test. Move logic to Service method. |
| **React Context** | `<CartProvider>...</CartProvider>` | Does not work across Astro Islands. |
| **Heavy Objects** | Storing giant JSON blobs. | Re-renders everything on small changes. Use multiple atoms or computed stores. |
