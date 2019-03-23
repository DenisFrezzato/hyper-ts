---
title: MiddlewareTask.ts
nav_order: 5
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Handler (interface)](#handler-interface)
- [ResponseStateTransition (interface)](#responsestatetransition-interface)
- [URI (type alias)](#uri-type-alias)
- [MiddlewareTask (class)](#middlewaretask-class)
  - [eval (method)](#eval-method)
  - [map (method)](#map-method)
  - [ap (method)](#ap-method)
  - [chain (method)](#chain-method)
  - [ichain (method)](#ichain-method)
- [URI (constant)](#uri-constant)
- [body (constant)](#body-constant)
- [contentType (constant)](#contenttype-constant)
- [header (constant)](#header-constant)
- [json (constant)](#json-constant)
- [middleware (constant)](#middleware-constant)
- [param (constant)](#param-constant)
- [params (constant)](#params-constant)
- [query (constant)](#query-constant)
- [redirect (constant)](#redirect-constant)
- [unsafeResponseStateTransition (constant)](#unsaferesponsestatetransition-constant)
- [lift (function)](#lift-function)

---

# Handler (interface)

A middleware representing a complete `Request` / `Response` handling

**Signature**

```ts
export interface Handler extends ResponseStateTransition<StatusOpen, ResponseEnded> {}
```

# ResponseStateTransition (interface)

A middleware transitioning from one `Response` state to another

**Signature**

```ts
export interface ResponseStateTransition<I, O> extends MiddlewareTask<I, O, void> {}
```

# URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

# MiddlewareTask (class)

**Signature**

```ts
export class MiddlewareTask<I, O, A> {
  constructor(readonly run: Middleware1<TaskURI, I, O, A>) { ... }
  ...
}
```

## eval (method)

**Signature**

```ts
eval(c: Conn<I>): Task<A> { ... }
```

## map (method)

**Signature**

```ts
map<I, B>(this: MiddlewareTask<I, I, A>, f: (a: A) => B): MiddlewareTask<I, I, B> { ... }
```

## ap (method)

**Signature**

```ts
ap<I, B>(this: MiddlewareTask<I, I, A>, fab: MiddlewareTask<I, I, (a: A) => B>): MiddlewareTask<I, I, B> { ... }
```

## chain (method)

**Signature**

```ts
chain<I, B>(this: MiddlewareTask<I, I, A>, f: (a: A) => MiddlewareTask<I, I, B>): MiddlewareTask<I, I, B> { ... }
```

## ichain (method)

**Signature**

```ts
ichain<Z, B>(f: (a: A) => MiddlewareTask<O, Z, B>): MiddlewareTask<I, Z, B> { ... }
```

# URI (constant)

**Signature**

```ts
export const URI = ...
```

# body (constant)

**Signature**

```ts
export const body: <A>(type: Decoder<unknown, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = ...
```

# contentType (constant)

**Signature**

```ts
export const contentType: (mediaType: MediaType) => ResponseStateTransition<HeadersOpen, HeadersOpen> = ...
```

# header (constant)

**Signature**

```ts
export const header: <A>(
  name: string,
  type: Decoder<unknown, A>
) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = ...
```

# json (constant)

**Signature**

```ts
export const json: (o: string) => ResponseStateTransition<HeadersOpen, ResponseEnded> = ...
```

# middleware (constant)

**Signature**

```ts
export const middleware: MonadMiddleware3<URI> = ...
```

# param (constant)

**Signature**

```ts
export const param: <A>(
  name: string,
  type: Decoder<unknown, A>
) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = ...
```

# params (constant)

**Signature**

```ts
export const params: <A>(type: Decoder<unknown, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = ...
```

# query (constant)

**Signature**

```ts
export const query: <A>(type: Decoder<unknown, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = ...
```

# redirect (constant)

**Signature**

```ts
export const redirect: (uri: string) => ResponseStateTransition<StatusOpen, HeadersOpen> = ...
```

# unsafeResponseStateTransition (constant)

**Signature**

```ts
export const unsafeResponseStateTransition: ResponseStateTransition<any, any> = ...
```

# lift (function)

**Signature**

```ts
export const lift = <I, A>(fa: Task<A>): MiddlewareTask<I, I, A> => ...
```
