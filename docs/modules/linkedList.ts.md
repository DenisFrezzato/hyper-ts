---
title: linkedList.ts
nav_order: 4
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [LinkedList (type alias)](#linkedlist-type-alias)
- [nil (constant)](#nil-constant)
- [cons (function)](#cons-function)
- [toArray (function)](#toarray-function)

---

# LinkedList (type alias)

**Signature**

```ts
export type LinkedList<A> =
  | { type: 'Nil'; length: number }
  | { type: 'Cons'; head: A; tail: LinkedList<A>; length: number }
```

# nil (constant)

**Signature**

```ts
export const nil: LinkedList<never> = ...
```

# cons (function)

**Signature**

```ts
export const cons = <A>(head: A, tail: LinkedList<A>): LinkedList<A> => ...
```

# toArray (function)

**Signature**

```ts
export const toArray = <A>(list: LinkedList<A>): Array<A> => ...
```
