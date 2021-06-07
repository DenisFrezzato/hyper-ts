---
title: ReaderMiddleware.ts
nav_order: 3
parent: Modules
---

## ReaderMiddleware overview

Added in v0.6.3

---

<h2 class="text-delta">Table of contents</h2>

- [Apply](#apply)
  - [ap](#ap)
  - [apW](#apw)
- [Bifunctor](#bifunctor)
  - [bimap](#bimap)
  - [mapLeft](#mapleft)
- [Functor](#functor)
  - [map](#map)
- [Monad](#monad)
  - [chain](#chain)
  - [chainW](#chainw)
- [Pointed](#pointed)
  - [of](#of)
- [utils](#utils)
  - [Alt](#alt)
  - [Applicative](#applicative)
  - [Apply](#apply-1)
  - [Bifunctor](#bifunctor-1)
  - [Do](#do)
  - [Functor](#functor-1)
  - [Monad](#monad-1)
  - [MonadThrow](#monadthrow)
  - [ReaderMiddleware (interface)](#readermiddleware-interface)
  - [URI](#uri)
  - [URI (type alias)](#uri-type-alias)
  - [ask](#ask)
  - [asks](#asks)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [bindW](#bindw)
  - [chainMiddlewareK](#chainmiddlewarek)
  - [chainReaderTaskEitherK](#chainreadertaskeitherk)
  - [chainReaderTaskEitherKW](#chainreadertaskeitherkw)
  - [chainTaskEitherK](#chaintaskeitherk)
  - [chainTaskEitherKW](#chaintaskeitherkw)
  - [clearCookie](#clearcookie)
  - [closeHeaders](#closeheaders)
  - [contentType](#contenttype)
  - [cookie](#cookie)
  - [decodeBody](#decodebody)
  - [decodeHeader](#decodeheader)
  - [decodeMethod](#decodemethod)
  - [decodeParam](#decodeparam)
  - [decodeParams](#decodeparams)
  - [decodeQuery](#decodequery)
  - [end](#end)
  - [fromIOEither](#fromioeither)
  - [fromMiddleware](#frommiddleware)
  - [fromReaderTaskEither](#fromreadertaskeither)
  - [fromTaskEither](#fromtaskeither)
  - [header](#header)
  - [ichain](#ichain)
  - [ichainMiddlewareK](#ichainmiddlewarek)
  - [ichainMiddlewareW](#ichainmiddlewarew)
  - [ichainW](#ichainw)
  - [iof](#iof)
  - [json](#json)
  - [left](#left)
  - [leftIO](#leftio)
  - [leftReader](#leftreader)
  - [leftTask](#lefttask)
  - [orElse](#orelse)
  - [orElseW](#orelsew)
  - [redirect](#redirect)
  - [right](#right)
  - [rightIO](#rightio)
  - [rightReader](#rightreader)
  - [rightTask](#righttask)
  - [send](#send)
  - [status](#status)

---

# Apply

## ap

Apply a function to an argument under a type constructor.

**Signature**

```ts
export declare const ap: <R, I, E, A>(
  fa: ReaderMiddleware<R, I, I, E, A>
) => <B>(fab: ReaderMiddleware<R, I, I, E, (a: A) => B>) => ReaderMiddleware<R, I, I, E, B>
```

Added in v0.6.3

## apW

Less strict version of [`ap`](#ap).

**Signature**

```ts
export declare const apW: <R2, I, E2, A>(
  fa: ReaderMiddleware<R2, I, I, E2, A>
) => <R1, E1, B>(fab: ReaderMiddleware<R1, I, I, E1, (a: A) => B>) => ReaderMiddleware<R1 & R2, I, I, E2 | E1, B>
```

Added in v0.6.3

# Bifunctor

## bimap

Map a pair of functions over the two last type arguments of the bifunctor.

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B
) => <R, I>(fa: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, G, B>
```

Added in v0.6.3

## mapLeft

Map a function over the second type argument of a bifunctor.

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (e: E) => G
) => <R, I, A>(fa: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, G, A>
```

Added in v0.6.3

# Functor

## map

`map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
use the type constructor `F` to represent some computational context.

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B
) => <R, I, E>(fa: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B>
```

Added in v0.6.3

# Monad

## chain

Composes computations in sequence, using the return value of one computation to determine the next computation.

**Signature**

```ts
export declare const chain: <R, I, E, A, B>(
  f: (a: A) => ReaderMiddleware<R, I, I, E, B>
) => (ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B>
```

Added in v0.6.3

## chainW

Less strict version of [`chain`](#chain).

**Signature**

```ts
export declare const chainW: <R2, I, E2, A, B>(
  f: (a: A) => ReaderMiddleware<R2, I, I, E2, B>
) => <R1, E1>(ma: ReaderMiddleware<R1, I, I, E1, A>) => ReaderMiddleware<R1 & R2, I, I, E2 | E1, B>
```

Added in v0.6.3

# Pointed

## of

**Signature**

```ts
export declare const of: <R, I = H.StatusOpen, E = never, A = never>(a: A) => ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

# utils

## Alt

**Signature**

```ts
export declare const Alt: Alt4<'ReaderMiddleware'>
```

Added in v0.6.3

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative4<'ReaderMiddleware'>
```

Added in v0.6.3

## Apply

**Signature**

```ts
export declare const Apply: Apply4<'ReaderMiddleware'>
```

Added in v0.6.3

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bifunctor4<'ReaderMiddleware'>
```

Added in v0.6.3

## Do

**Signature**

```ts
export declare const Do: ReaderMiddleware<unknown, unknown, unknown, never, {}>
```

Added in v0.6.3

## Functor

**Signature**

```ts
export declare const Functor: Functor4<'ReaderMiddleware'>
```

Added in v0.6.3

## Monad

**Signature**

```ts
export declare const Monad: Monad4<'ReaderMiddleware'>
```

Added in v0.6.3

## MonadThrow

**Signature**

```ts
export declare const MonadThrow: MonadThrow4<'ReaderMiddleware'>
```

Added in v0.6.3

## ReaderMiddleware (interface)

**Signature**

```ts
export interface ReaderMiddleware<R, I, O, E, A> {
  (r: R): H.Middleware<I, O, E, A>
}
```

Added in v0.6.3

## URI

**Signature**

```ts
export declare const URI: 'ReaderMiddleware'
```

Added in v0.6.3

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.6.3

## ask

**Signature**

```ts
export declare const ask: <R, I = H.StatusOpen, E = never>() => ReaderMiddleware<R, I, I, E, R>
```

Added in v0.6.3

## asks

**Signature**

```ts
export declare const asks: <R, E = never, A = never>(
  f: (r: R) => A
) => ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A>
```

Added in v0.6.3

## bind

**Signature**

```ts
export declare const bind: <N extends string, R, I, E, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderMiddleware<R, I, I, E, B>
) => (
  fa: ReaderMiddleware<R, I, I, E, A>
) => ReaderMiddleware<R, I, I, E, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.6.3

## bindTo

**Signature**

```ts
export declare const bindTo: <N extends string>(
  name: N
) => <R, I, E, A>(fa: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, { [K in N]: A }>
```

Added in v0.6.3

## bindW

**Signature**

```ts
export declare const bindW: <N extends string, R, I, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderMiddleware<R, I, I, E2, B>
) => <E1>(
  fa: ReaderMiddleware<R, I, I, E1, A>
) => ReaderMiddleware<R, I, I, E2 | E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.6.3

## chainMiddlewareK

**Signature**

```ts
export declare const chainMiddlewareK: <R, I, E, A, B>(
  f: (a: A) => H.Middleware<I, I, E, B>
) => (ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B>
```

Added in v0.6.3

## chainReaderTaskEitherK

**Signature**

```ts
export declare const chainReaderTaskEitherK: <R, E, A, B>(
  f: (a: A) => RTE.ReaderTaskEither<R, E, B>
) => <I>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B>
```

Added in v0.6.3

## chainReaderTaskEitherKW

**Signature**

```ts
export declare const chainReaderTaskEitherKW: <R2, E2, A, B>(
  f: (a: A) => RTE.ReaderTaskEither<R2, E2, B>
) => <R1, I, E1>(ma: ReaderMiddleware<R1, I, I, E1, A>) => ReaderMiddleware<R1 & R2, I, I, E2 | E1, B>
```

Added in v0.6.3

## chainTaskEitherK

**Signature**

```ts
export declare const chainTaskEitherK: <E, A, B>(
  f: (a: A) => TE.TaskEither<E, B>
) => <R, I>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B>
```

Added in v0.6.3

## chainTaskEitherKW

**Signature**

```ts
export declare const chainTaskEitherKW: <E2, A, B>(
  f: (a: A) => TE.TaskEither<E2, B>
) => <R, I, E1>(ma: ReaderMiddleware<R, I, I, E1, A>) => ReaderMiddleware<R, I, I, E2 | E1, B>
```

Added in v0.6.3

## clearCookie

**Signature**

```ts
export declare function clearCookie<R, E = never>(
  name: string,
  options: H.CookieOptions
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void>
```

Added in v0.6.3

## closeHeaders

**Signature**

```ts
export declare function closeHeaders<R, E = never>(): ReaderMiddleware<R, H.HeadersOpen, H.BodyOpen, E, void>
```

Added in v0.6.3

## contentType

**Signature**

```ts
export declare function contentType<R, E = never>(
  mediaType: H.MediaType
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void>
```

Added in v0.6.3

## cookie

**Signature**

```ts
export declare function cookie<R, E = never>(
  name: string,
  value: string,
  options: H.CookieOptions
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void>
```

Added in v0.6.3

## decodeBody

**Signature**

```ts
export declare function decodeBody<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A>
```

Added in v0.6.3

## decodeHeader

**Signature**

```ts
export declare function decodeHeader<R, E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A>
```

Added in v0.6.3

## decodeMethod

**Signature**

```ts
export declare function decodeMethod<R, E, A>(
  f: (method: string) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A>
```

Added in v0.6.3

## decodeParam

**Signature**

```ts
export declare function decodeParam<R, E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A>
```

Added in v0.6.3

## decodeParams

**Signature**

```ts
export declare function decodeParams<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A>
```

Added in v0.6.3

## decodeQuery

**Signature**

```ts
export declare function decodeQuery<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A>
```

Added in v0.6.3

## end

**Signature**

```ts
export declare function end<R, E = never>(): ReaderMiddleware<R, H.BodyOpen, H.ResponseEnded, E, void>
```

Added in v0.6.3

## fromIOEither

**Signature**

```ts
export declare function fromIOEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: IOEither<E, A>
): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## fromMiddleware

**Signature**

```ts
export declare const fromMiddleware: <R, I = H.StatusOpen, E = never, A = never>(
  fa: H.Middleware<I, I, E, A>
) => ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## fromReaderTaskEither

**Signature**

```ts
export declare function fromReaderTaskEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: RTE.ReaderTaskEither<R, E, A>
): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## fromTaskEither

**Signature**

```ts
export declare function fromTaskEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: TE.TaskEither<E, A>
): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## header

**Signature**

```ts
export declare function header<R, E = never>(
  name: string,
  value: string
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void>
```

Added in v0.6.3

## ichain

**Signature**

```ts
export declare const ichain: <R, A, O, Z, E, B>(
  f: (a: A) => ReaderMiddleware<R, O, Z, E, B>
) => <I>(ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, Z, E, B>
```

Added in v0.6.3

## ichainMiddlewareK

**Signature**

```ts
export declare const ichainMiddlewareK: <R, A, O, Z, E, B>(
  f: (a: A) => H.Middleware<O, Z, E, B>
) => <I>(ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, Z, E, B>
```

Added in v0.6.3

## ichainMiddlewareW

**Signature**

```ts
export declare const ichainMiddlewareW: <R, A, O, Z, E, B>(
  f: (a: A) => H.Middleware<O, Z, E, B>
) => <I, D>(ma: ReaderMiddleware<R, I, O, D, A>) => ReaderMiddleware<R, I, Z, E | D, B>
```

Added in v0.6.3

## ichainW

**Signature**

```ts
export declare function ichainW<R2, A, O, Z, E2, B>(
  f: (a: A) => ReaderMiddleware<R2, O, Z, E2, B>
): <R1, I, E1>(ma: ReaderMiddleware<R1, I, O, E1, A>) => ReaderMiddleware<R1 & R2, I, Z, E1 | E2, B>
```

Added in v0.6.3

## iof

**Signature**

```ts
export declare function iof<R, I = H.StatusOpen, O = H.StatusOpen, E = never, A = never>(
  a: A
): ReaderMiddleware<R, I, O, E, A>
```

Added in v0.6.3

## json

**Signature**

```ts
export declare function json<R, E>(
  body: unknown,
  onError: (reason: unknown) => E
): ReaderMiddleware<R, H.HeadersOpen, H.ResponseEnded, E, void>
```

Added in v0.6.3

## left

**Signature**

```ts
export declare function left<R, I = H.StatusOpen, E = never, A = never>(e: E): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## leftIO

**Signature**

```ts
export declare function leftIO<R, I = H.StatusOpen, E = never, A = never>(fe: IO<E>): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## leftReader

**Signature**

```ts
export declare function leftReader<R, I = H.StatusOpen, E = never, A = never>(
  me: Reader<R, E>
): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## leftTask

**Signature**

```ts
export declare function leftTask<R, I = H.StatusOpen, E = never, A = never>(
  te: Task<E>
): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## orElse

**Signature**

```ts
export declare function orElse<R, E, I, O, M, A>(
  f: (e: E) => ReaderMiddleware<R, I, O, M, A>
): (ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, O, M, A>
```

Added in v0.6.3

## orElseW

**Signature**

```ts
export declare const orElseW: <R2, E, I, O, M, A>(
  f: (e: E) => ReaderMiddleware<R2, I, O, M, A>
) => <R1, B>(ma: ReaderMiddleware<R1, I, O, E, B>) => ReaderMiddleware<R2 & R1, I, O, M, A | B>
```

Added in v0.6.4

## redirect

**Signature**

```ts
export declare function redirect<R, E = never>(uri: string): ReaderMiddleware<R, H.StatusOpen, H.HeadersOpen, E, void>
```

Added in v0.6.3

## right

**Signature**

```ts
export declare const right: <R, I = H.StatusOpen, E = never, A = never>(a: A) => ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## rightIO

**Signature**

```ts
export declare function rightIO<R, I = H.StatusOpen, E = never, A = never>(fa: IO<A>): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## rightReader

**Signature**

```ts
export declare const rightReader: <R, I = H.StatusOpen, E = never, A = never>(
  ma: Reader<R, A>
) => ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## rightTask

**Signature**

```ts
export declare function rightTask<R, I = H.StatusOpen, E = never, A = never>(
  fa: Task<A>
): ReaderMiddleware<R, I, I, E, A>
```

Added in v0.6.3

## send

**Signature**

```ts
export declare function send<R, E = never>(body: string): ReaderMiddleware<R, H.BodyOpen, H.ResponseEnded, E, void>
```

Added in v0.6.3

## status

**Signature**

```ts
export declare function status<R, E = never>(
  status: H.Status
): ReaderMiddleware<R, H.StatusOpen, H.HeadersOpen, E, void>
```

Added in v0.6.3
