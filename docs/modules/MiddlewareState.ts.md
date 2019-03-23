---
title: MiddlewareState.ts
nav_order: 4
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Handler (interface)](#handler-interface)
- [ResponseStateTransition (interface)](#responsestatetransition-interface)
- [Event (type alias)](#event-type-alias)
- [S (type alias)](#s-type-alias)
- [URI (type alias)](#uri-type-alias)
- [MiddlewareState (class)](#middlewarestate-class)
  - [eval (method)](#eval-method)
  - [map (method)](#map-method)
  - [ap (method)](#ap-method)
  - [chain (method)](#chain-method)
  - [ichain (method)](#ichain-method)
- [URI (constant)](#uri-constant)
- [closeHeadersEvent (constant)](#closeheadersevent-constant)
- [endEvent (constant)](#endevent-constant)
- [middleware (constant)](#middleware-constant)
- [clearCookieEvent (function)](#clearcookieevent-function)
- [cookieEvent (function)](#cookieevent-function)
- [customEvent (function)](#customevent-function)
- [fold (function)](#fold-function)
- [foldL (function)](#foldl-function)
- [headersEvent (function)](#headersevent-function)
- [lift (function)](#lift-function)
- [sendEvent (function)](#sendevent-function)
- [statusEvent (function)](#statusevent-function)

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
export interface ResponseStateTransition<I, O> extends MiddlewareState<I, O, void> {}
```

# Event (type alias)

**Signature**

```ts
export type Event =
  | {
      readonly type: 'StatusEvent'
      readonly status: number
    }
  | {
      readonly type: 'HeadersEvent'
      readonly headers: Record<string, string>
    }
  | {
      readonly type: 'CloseHeadersEvent'
    }
  | {
      readonly type: 'SendEvent'
      readonly body: string
    }
  | {
      readonly type: 'EndEvent'
    }
  | {
      readonly type: 'CookieEvent'
      readonly name: string
      readonly value: string
      readonly options: CookieOptions
    }
  | {
      readonly type: 'ClearCookieEvent'
      readonly name: string
      readonly options: CookieOptions
    }
  | {
      readonly type: 'CustomEvent'
      readonly message: string
    }
```

# S (type alias)

**Signature**

```ts
export type S = Array<Event>
```

# URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

# MiddlewareState (class)

**Signature**

```ts
export class MiddlewareState<I, O, A> {
  constructor(readonly run: Middleware2<StateURI, S, I, O, A>) { ... }
  ...
}
```

## eval (method)

**Signature**

```ts
eval(c: Conn<I>): State<S, A> { ... }
```

## map (method)

**Signature**

```ts
map<I, B>(this: MiddlewareState<I, I, A>, f: (a: A) => B): MiddlewareState<I, I, B> { ... }
```

## ap (method)

**Signature**

```ts
ap<I, B>(this: MiddlewareState<I, I, A>, fab: MiddlewareState<I, I, (a: A) => B>): MiddlewareState<I, I, B> { ... }
```

## chain (method)

**Signature**

```ts
chain<I, B>(this: MiddlewareState<I, I, A>, f: (a: A) => MiddlewareState<I, I, B>): MiddlewareState<I, I, B> { ... }
```

## ichain (method)

**Signature**

```ts
ichain<Z, B>(f: (a: A) => MiddlewareState<O, Z, B>): MiddlewareState<I, Z, B> { ... }
```

# URI (constant)

**Signature**

```ts
export const URI = ...
```

# closeHeadersEvent (constant)

**Signature**

```ts
export const closeHeadersEvent: Event = ...
```

# endEvent (constant)

**Signature**

```ts
export const endEvent: Event = ...
```

# middleware (constant)

**Signature**

```ts
export const middleware: MonadMiddleware3<URI> = ...
```

# clearCookieEvent (function)

**Signature**

```ts
export function clearCookieEvent(name: string, options: CookieOptions): Event { ... }
```

# cookieEvent (function)

**Signature**

```ts
export function cookieEvent(name: string, value: string, options: CookieOptions): Event { ... }
```

# customEvent (function)

**Signature**

```ts
export function customEvent(message: string): Event { ... }
```

# fold (function)

**Signature**

```ts
export function fold<R>(
  fa: Event,
  handlers: {
    onStatusEvent: (status: number) => R
    onHeadersEvent: (headers: Record<string, string>) => R
    onCloseHeadersEvent: R
    onSendEvent: (body: string) => R
    onEndEvent: R
    onCookieEvent: (name: string, value: string, options: CookieOptions) => R
    onClearCookieEvent: (name: string, options: CookieOptions) => R
    onCustomEvent: (message: string) => R
  }
): R { ... }
```

# foldL (function)

**Signature**

```ts
export function foldL<R>(
  fa: Event,
  handlers: {
    onStatusEvent: (status: number) => R
    onHeadersEvent: (headers: Record<string, string>) => R
    onCloseHeadersEvent: () => R
    onSendEvent: (body: string) => R
    onEndEvent: () => R
    onCookieEvent: (name: string, value: string, options: CookieOptions) => R
    onClearCookieEvent: (name: string, options: CookieOptions) => R
    onCustomEvent: (message: string) => R
  }
): R { ... }
```

# headersEvent (function)

**Signature**

```ts
export function headersEvent(headers: Record<string, string>): Event { ... }
```

# lift (function)

**Signature**

```ts
export const lift = <I, A>(fa: State<S, A>): MiddlewareState<I, I, A> => ...
```

# sendEvent (function)

**Signature**

```ts
export function sendEvent(body: string): Event { ... }
```

# statusEvent (function)

**Signature**

```ts
export function statusEvent(status: number): Event { ... }
```
