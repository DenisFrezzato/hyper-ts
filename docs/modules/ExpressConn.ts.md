---
title: ExpressConn.ts
nav_order: 1
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [ExpressConn (class)](#expressconn-class)
  - [clearCookie (method)](#clearcookie-method)
  - [endResponse (method)](#endresponse-method)
  - [getBody (method)](#getbody-method)
  - [getHeader (method)](#getheader-method)
  - [getParams (method)](#getparams-method)
  - [getQuery (method)](#getquery-method)
  - [setBody (method)](#setbody-method)
  - [setCookie (method)](#setcookie-method)
  - [setHeader (method)](#setheader-method)
  - [setStatus (method)](#setstatus-method)

---

# ExpressConn (class)

**Signature**

```ts
export class ExpressConn<S> {
  constructor(readonly req: express.Request, readonly res: express.Response) { ... }
  ...
}
```

## clearCookie (method)

**Signature**

```ts
clearCookie(name: string, options: CookieOptions) { ... }
```

## endResponse (method)

**Signature**

```ts
endResponse() { ... }
```

## getBody (method)

**Signature**

```ts
getBody() { ... }
```

## getHeader (method)

**Signature**

```ts
getHeader(name: string) { ... }
```

## getParams (method)

**Signature**

```ts
getParams() { ... }
```

## getQuery (method)

**Signature**

```ts
getQuery() { ... }
```

## setBody (method)

**Signature**

```ts
setBody(body: unknown) { ... }
```

## setCookie (method)

**Signature**

```ts
setCookie(name: string, value: string, options: CookieOptions) { ... }
```

## setHeader (method)

**Signature**

```ts
setHeader(name: string, value: string) { ... }
```

## setStatus (method)

**Signature**

```ts
setStatus(status: Status) { ... }
```
