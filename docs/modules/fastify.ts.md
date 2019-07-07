---
title: fastify.ts
nav_order: 2
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Action (type alias)](#action-type-alias)
- [FastifyConnection (class)](#fastifyconnection-class)
  - [chain (method)](#chain-method)
  - [getRequest (method)](#getrequest-method)
  - [getBody (method)](#getbody-method)
  - [getHeader (method)](#getheader-method)
  - [getParams (method)](#getparams-method)
  - [getQuery (method)](#getquery-method)
  - [getOriginalUrl (method)](#getoriginalurl-method)
  - [getMethod (method)](#getmethod-method)
  - [setHeader (method)](#setheader-method)
  - [setStatus (method)](#setstatus-method)
  - [setBody (method)](#setbody-method)
  - [endResponse (method)](#endresponse-method)
- [fromRequestHandler (function)](#fromrequesthandler-function)
- [toRequestHandler (function)](#torequesthandler-function)

---

# Action (type alias)

**Signature**

```ts
export type Action =
  | { type: 'setBody'; body: unknown }
  | { type: 'endResponse' }
  | { type: 'setStatus'; status: Status }
  | { type: 'setHeader'; name: string; value: string }
```

# FastifyConnection (class)

**Signature**

```ts
export class FastifyConnection<S> {
  constructor(
    readonly req: fastify.FastifyRequest<IncomingMessage>,
    readonly reply: fastify.FastifyReply<ServerResponse>,
    readonly actions: LinkedList<Action> = nil,
    readonly ended: boolean = false
  ) { ... }
  ...
}
```

## chain (method)

**Signature**

```ts
chain<T>(action: Action, ended: boolean = false): FastifyConnection<T> { ... }
```

## getRequest (method)

**Signature**

```ts
getRequest(): IncomingMessage { ... }
```

## getBody (method)

**Signature**

```ts
getBody(): unknown { ... }
```

## getHeader (method)

**Signature**

```ts
getHeader(name: string): unknown { ... }
```

## getParams (method)

**Signature**

```ts
getParams(): unknown { ... }
```

## getQuery (method)

**Signature**

```ts
getQuery(): unknown { ... }
```

## getOriginalUrl (method)

**Signature**

```ts
getOriginalUrl(): string { ... }
```

## getMethod (method)

**Signature**

```ts
getMethod(): string { ... }
```

## setHeader (method)

**Signature**

```ts
setHeader(name: string, value: string): FastifyConnection<HeadersOpen> { ... }
```

## setStatus (method)

**Signature**

```ts
setStatus(status: Status): FastifyConnection<HeadersOpen> { ... }
```

## setBody (method)

**Signature**

```ts
setBody(body: unknown): FastifyConnection<ResponseEnded> { ... }
```

## endResponse (method)

**Signature**

```ts
endResponse(): FastifyConnection<ResponseEnded> { ... }
```

# fromRequestHandler (function)

**Signature**

```ts
export function fromRequestHandler(fastifyInstance: fastify.FastifyInstance) { ... }
```

# toRequestHandler (function)

**Signature**

```ts
export function toRequestHandler<I, O, L>(middleware: Middleware<I, O, L, void>): fastify.RequestHandler { ... }
```
