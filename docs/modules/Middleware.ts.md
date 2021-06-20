---
title: Middleware.ts
nav_order: 3
parent: Modules
---

## Middleware overview

A middleware is an indexed monadic action transforming one `Connection` to another `Connection`.
It operates in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output
`Connection` types of the middleware action.

Added in v0.7.0

---

<h2 class="text-delta">Table of contents</h2>

- [Alt](#alt)
  - [alt](#alt)
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
  - [ichain](#ichain)
  - [ichainW](#ichainw)
- [Pointed](#pointed)
  - [iof](#iof)
  - [of](#of)
- [combinators](#combinators)
  - [apFirst](#apfirst)
  - [apSecond](#apsecond)
  - [chainFirst](#chainfirst)
  - [chainFirstW](#chainfirstw)
  - [filterOrElse](#filterorelse)
  - [filterOrElseW](#filterorelsew)
  - [flatten](#flatten)
  - [orElse](#orelse)
- [constructor](#constructor)
  - [fromConnection](#fromconnection)
  - [gets](#gets)
  - [modifyConnection](#modifyconnection)
- [constructors](#constructors)
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
  - [fromEither](#fromeither)
  - [fromIOEither](#fromioeither)
  - [fromOption](#fromoption)
  - [fromPredicate](#frompredicate)
  - [fromTaskEither](#fromtaskeither)
  - [header](#header)
  - [json](#json)
  - [left](#left)
  - [leftIO](#leftio)
  - [leftTask](#lefttask)
  - [pipeStream](#pipestream)
  - [redirect](#redirect)
  - [right](#right)
  - [rightIO](#rightio)
  - [rightTask](#righttask)
  - [send](#send)
  - [status](#status)
- [instances](#instances)
  - [Alt](#alt-1)
  - [ApplicativePar](#applicativepar)
  - [ApplicativeSeq](#applicativeseq)
  - [ApplyPar](#applypar)
  - [ApplySeq](#applyseq)
  - [Bifunctor](#bifunctor-1)
  - [Chain](#chain)
  - [FromEither](#fromeither)
  - [Functor](#functor-1)
  - [Monad](#monad-1)
  - [MonadTask](#monadtask)
  - [MonadThrow](#monadthrow)
  - [Pointed](#pointed-1)
  - [URI](#uri)
  - [URI (type alias)](#uri-type-alias)
- [interop](#interop)
  - [tryCatch](#trycatch)
- [model](#model)
  - [Middleware (interface)](#middleware-interface)
- [utils](#utils)
  - [Do](#do)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [bindW](#bindw)
  - [evalMiddleware](#evalmiddleware)
  - [execMiddleware](#execmiddleware)

---

# Alt

## alt

**Signature**

```ts
export declare const alt: <I, E, A>(
  that: Lazy<Middleware<I, I, E, A>>
) => (fa: Middleware<I, I, E, A>) => Middleware<I, I, E, A>
```

Added in v0.7.0

# Apply

## ap

Apply a function to an argument under a type constructor.

**Signature**

```ts
export declare const ap: <I, E, A>(
  fa: Middleware<I, I, E, A>
) => <B>(fab: Middleware<I, I, E, (a: A) => B>) => Middleware<I, I, E, B>
```

Added in v0.7.0

## apW

Less strict version of [`ap`](#ap).

**Signature**

```ts
export declare const apW: <I, E2, A>(
  fa: Middleware<I, I, E2, A>
) => <E1, B>(fab: Middleware<I, I, E1, (a: A) => B>) => Middleware<I, I, E2 | E1, B>
```

Added in v0.7.0

# Bifunctor

## bimap

Map a pair of functions over the two last type arguments of the bifunctor.

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B
) => <I>(fa: Middleware<I, I, E, A>) => Middleware<I, I, G, B>
```

Added in v0.7.0

## mapLeft

Map a function over the second type argument of a bifunctor.

**Signature**

```ts
export declare const mapLeft: <E, G>(f: (e: E) => G) => <I, A>(fa: Middleware<I, I, E, A>) => Middleware<I, I, G, A>
```

Added in v0.7.0

# Functor

## map

`map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
use the type constructor `F` to represent some computational context.

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => <I, E>(fa: Middleware<I, I, E, A>) => Middleware<I, I, E, B>
```

Added in v0.7.0

# Monad

## chain

Composes computations in sequence, using the return value of one computation to determine the next computation.

**Signature**

```ts
export declare const chain: <I, E, A, B>(
  f: (a: A) => Middleware<I, I, E, B>
) => (ma: Middleware<I, I, E, A>) => Middleware<I, I, E, B>
```

Added in v0.7.0

## chainW

Less strict version of [`chain`](#chain).

**Signature**

```ts
export declare const chainW: <I, E2, A, B>(
  f: (a: A) => Middleware<I, I, E2, B>
) => <E1>(ma: Middleware<I, I, E1, A>) => Middleware<I, I, E2 | E1, B>
```

Added in v0.7.0

## ichain

**Signature**

```ts
export declare const ichain: <A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
) => <I>(ma: Middleware<I, O, E, A>) => Middleware<I, Z, E, B>
```

Added in v0.7.0

## ichainW

Less strict version of [`ichain`](#ichain).

**Signature**

```ts
export declare function ichainW<A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
): <I, D>(ma: Middleware<I, O, D, A>) => Middleware<I, Z, D | E, B>
```

Added in v0.7.0

# Pointed

## iof

**Signature**

```ts
export declare function iof<I = StatusOpen, O = StatusOpen, E = never, A = never>(a: A): Middleware<I, O, E, A>
```

Added in v0.7.0

## of

**Signature**

```ts
export declare const of: <I = StatusOpen, E = never, A = never>(a: A) => Middleware<I, I, E, A>
```

Added in v0.7.0

# combinators

## apFirst

**Signature**

```ts
export declare const apFirst: <R, E, B>(
  second: Middleware<R, R, E, B>
) => <A>(first: Middleware<R, R, E, A>) => Middleware<R, R, E, A>
```

Added in v0.7.0

## apSecond

**Signature**

```ts
export declare const apSecond: <R, E, B>(
  second: Middleware<R, R, E, B>
) => <A>(first: Middleware<R, R, E, A>) => Middleware<R, R, E, B>
```

Added in v0.7.0

## chainFirst

Composes computations in sequence, using the return value of one computation to determine the next computation and
keeping only the result of the first.

Derivable from `Chain`.

**Signature**

```ts
export declare const chainFirst: <A, R, E, B>(
  f: (a: A) => Middleware<R, R, E, B>
) => (first: Middleware<R, R, E, A>) => Middleware<R, R, E, A>
```

Added in v0.7.0

## chainFirstW

Less strict version of [`chainFirst`](#chainfirst).

Derivable from `Chain`.

**Signature**

```ts
export declare const chainFirstW: <I, E2, A, B>(
  f: (a: A) => Middleware<I, I, E2, B>
) => <E1>(ma: Middleware<I, I, E1, A>) => Middleware<I, I, E2 | E1, A>
```

Added in v0.7.0

## filterOrElse

**Signature**

```ts
export declare const filterOrElse: {
  <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <I>(
    ma: Middleware<I, I, E, A>
  ) => Middleware<I, I, E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <I>(ma: Middleware<I, I, E, A>) => Middleware<I, I, E, A>
}
```

Added in v0.7.0

## filterOrElseW

Less strict version of [`filterOrElse`](#filterorelse).

**Signature**

```ts
export declare const filterOrElseW: {
  <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: (a: A) => E2): <I, E1>(
    ma: Middleware<I, I, E1, A>
  ) => Middleware<I, I, E2 | E1, B>
  <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): <I, E1>(
    ma: Middleware<I, I, E1, A>
  ) => Middleware<I, I, E2 | E1, A>
}
```

Added in v0.7.0

## flatten

Derivable from `Chain`.

**Signature**

```ts
export declare const flatten: <I, E, A>(mma: Middleware<I, I, E, Middleware<I, I, E, A>>) => Middleware<I, I, E, A>
```

Added in v0.7.0

## orElse

**Signature**

```ts
export declare function orElse<E, I, O, M, A>(
  f: (e: E) => Middleware<I, O, M, A>
): (ma: Middleware<I, O, E, A>) => Middleware<I, O, M, A>
```

Added in v0.7.0

# constructor

## fromConnection

**Signature**

```ts
export declare function fromConnection<I = StatusOpen, E = never, A = never>(
  f: (c: Connection<I>) => E.Either<E, A>
): Middleware<I, I, E, A>
```

Added in v0.7.0

## gets

**Signature**

```ts
export declare function gets<I = StatusOpen, E = never, A = never>(f: (c: Connection<I>) => A): Middleware<I, I, E, A>
```

Added in v0.7.0

## modifyConnection

**Signature**

```ts
export declare function modifyConnection<I, O, E>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, E, void>
```

Added in v0.7.0

# constructors

## clearCookie

Returns a middleware that clears the cookie `name`

**Signature**

```ts
export declare function clearCookie<E = never>(
  name: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.7.0

## closeHeaders

Returns a middleware that changes the connection status to `BodyOpen`

**Signature**

```ts
export declare function closeHeaders<E = never>(): Middleware<HeadersOpen, BodyOpen, E, void>
```

Added in v0.7.0

## contentType

Returns a middleware that sets the given `mediaType`

**Signature**

```ts
export declare function contentType<E = never>(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.7.0

## cookie

Returns a middleware that sets the cookie `name` to `value`, with the given `options`

**Signature**

```ts
export declare function cookie<E = never>(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.7.0

## decodeBody

Returns a middleware that tries to decode `connection.getBody()`

**Signature**

```ts
export declare function decodeBody<E, A>(
  f: (input: unknown) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.7.0

## decodeHeader

Returns a middleware that tries to decode `connection.getHeader(name)`

**Signature**

```ts
export declare function decodeHeader<E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.7.0

## decodeMethod

Returns a middleware that tries to decode `connection.getMethod()`

**Signature**

```ts
export declare function decodeMethod<E, A>(
  f: (method: string) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.7.0

## decodeParam

Returns a middleware that tries to decode `connection.getParams()[name]`

**Signature**

```ts
export declare function decodeParam<E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.7.0

## decodeParams

Returns a middleware that tries to decode `connection.getParams()`

**Signature**

```ts
export declare function decodeParams<E, A>(
  f: (input: unknown) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.7.0

## decodeQuery

Returns a middleware that tries to decode `connection.getQuery()`

**Signature**

```ts
export declare function decodeQuery<E, A>(
  f: (input: unknown) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.7.0

## end

Returns a middleware that ends the response without sending any response body

**Signature**

```ts
export declare function end<E = never>(): Middleware<BodyOpen, ResponseEnded, E, void>
```

Added in v0.7.0

## fromEither

**Signature**

```ts
export declare const fromEither: <I = StatusOpen, E = never, A = never>(fa: E.Either<E, A>) => Middleware<I, I, E, A>
```

Added in v0.7.0

## fromIOEither

**Signature**

```ts
export declare function fromIOEither<I = StatusOpen, E = never, A = never>(fa: IOEither<E, A>): Middleware<I, I, E, A>
```

Added in v0.7.0

## fromOption

**Signature**

```ts
export declare const fromOption: <E>(onNone: Lazy<E>) => <I, A>(ma: O.Option<A>) => Middleware<I, I, E, A>
```

Added in v0.7.0

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <I>(a: A) => Middleware<I, I, E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <I>(a: A) => Middleware<I, I, E, A>
}
```

Added in v0.7.0

## fromTaskEither

**Signature**

```ts
export declare function fromTaskEither<I = StatusOpen, E = never, A = never>(
  fa: TE.TaskEither<E, A>
): Middleware<I, I, E, A>
```

Added in v0.7.0

## header

Returns a middleware that writes the given header

**Signature**

```ts
export declare function header<E = never>(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.7.0

## json

Returns a middleware that sends `body` as JSON

**Signature**

```ts
export declare function json<E>(
  body: unknown,
  onError: (reason: unknown) => E
): Middleware<HeadersOpen, ResponseEnded, E, void>
```

Added in v0.7.0

## left

**Signature**

```ts
export declare function left<I = StatusOpen, E = never, A = never>(e: E): Middleware<I, I, E, A>
```

Added in v0.7.0

## leftIO

**Signature**

```ts
export declare function leftIO<I = StatusOpen, E = never, A = never>(fe: IO<E>): Middleware<I, I, E, A>
```

Added in v0.7.0

## leftTask

**Signature**

```ts
export declare function leftTask<I = StatusOpen, E = never, A = never>(te: Task<E>): Middleware<I, I, E, A>
```

Added in v0.7.0

## pipeStream

Returns a middleware that pipes a stream to the response object.

**Signature**

```ts
export declare function pipeStream<E>(stream: Readable): Middleware<BodyOpen, ResponseEnded, E, void>
```

Added in v0.7.0

## redirect

Returns a middleware that sends a redirect to `uri`

**Signature**

```ts
export declare function redirect<E = never>(uri: string): Middleware<StatusOpen, HeadersOpen, E, void>
```

Added in v0.7.0

## right

**Signature**

```ts
export declare function right<I = StatusOpen, E = never, A = never>(a: A): Middleware<I, I, E, A>
```

Added in v0.7.0

## rightIO

**Signature**

```ts
export declare function rightIO<I = StatusOpen, E = never, A = never>(fa: IO<A>): Middleware<I, I, E, A>
```

Added in v0.7.0

## rightTask

**Signature**

```ts
export declare function rightTask<I = StatusOpen, E = never, A = never>(fa: Task<A>): Middleware<I, I, E, A>
```

Added in v0.7.0

## send

Returns a middleware that sends `body` as response body

**Signature**

```ts
export declare function send<E = never>(body: string): Middleware<BodyOpen, ResponseEnded, E, void>
```

Added in v0.7.0

## status

Returns a middleware that writes the response status

**Signature**

```ts
export declare function status<E = never>(status: Status): Middleware<StatusOpen, HeadersOpen, E, void>
```

Added in v0.7.0

# instances

## Alt

**Signature**

```ts
export declare const Alt: Alt3<'Middleware'>
```

Added in v0.7.0

## ApplicativePar

**Signature**

```ts
export declare const ApplicativePar: Applicative3<'Middleware'>
```

Added in v0.7.0

## ApplicativeSeq

**Signature**

```ts
export declare const ApplicativeSeq: Applicative3<'Middleware'>
```

Added in v0.7.0

## ApplyPar

**Signature**

```ts
export declare const ApplyPar: Apply3<'Middleware'>
```

Added in v0.7.0

## ApplySeq

**Signature**

```ts
export declare const ApplySeq: Apply3<'Middleware'>
```

Added in v0.7.0

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bifunctor3<'Middleware'>
```

Added in v0.7.0

## Chain

**Signature**

```ts
export declare const Chain: Chain3<'Middleware'>
```

Added in v0.7.0

## FromEither

**Signature**

```ts
export declare const FromEither: FromEither3<'Middleware'>
```

Added in v0.7.0

## Functor

**Signature**

```ts
export declare const Functor: Functor3<'Middleware'>
```

Added in v0.7.0

## Monad

**Signature**

```ts
export declare const Monad: Monad3<'Middleware'>
```

Added in v0.7.0

## MonadTask

**Signature**

```ts
export declare const MonadTask: MonadTask3<'Middleware'>
```

Added in v0.7.0

## MonadThrow

**Signature**

```ts
export declare const MonadThrow: MonadThrow3<'Middleware'>
```

Added in v0.7.0

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed3<'Middleware'>
```

Added in v0.7.0

## URI

**Signature**

```ts
export declare const URI: 'Middleware'
```

Added in v0.7.0

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.7.0

# interop

## tryCatch

**Signature**

```ts
export declare function tryCatch<I = StatusOpen, E = never, A = never>(
  f: () => Promise<A>,
  onRejected: (reason: unknown) => E
): Middleware<I, I, E, A>
```

Added in v0.7.0

# model

## Middleware (interface)

A middleware is an indexed monadic action transforming one `Connection` to another `Connection`. It operates
in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Connection` types of the
middleware action.

**Signature**

```ts
export interface Middleware<I, O, E, A> {
  (c: Connection<I>): TE.TaskEither<E, [A, Connection<O>]>
}
```

Added in v0.7.0

# utils

## Do

**Signature**

```ts
export declare const Do: Middleware<unknown, unknown, never, {}>
```

Added in v0.7.0

## bind

**Signature**

```ts
export declare const bind: <N extends string, I, E, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Middleware<I, I, E, B>
) => (fa: Middleware<I, I, E, A>) => Middleware<I, I, E, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.7.0

## bindTo

**Signature**

```ts
export declare const bindTo: <N extends string>(
  name: N
) => <I, E, A>(fa: Middleware<I, I, E, A>) => Middleware<I, I, E, { [K in N]: A }>
```

Added in v0.7.0

## bindW

**Signature**

```ts
export declare const bindW: <N extends string, I, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Middleware<I, I, E2, B>
) => <E1>(
  fa: Middleware<I, I, E1, A>
) => Middleware<I, I, E2 | E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.7.0

## evalMiddleware

**Signature**

```ts
export declare function evalMiddleware<I, O, E, A>(ma: Middleware<I, O, E, A>, c: Connection<I>): TE.TaskEither<E, A>
```

Added in v0.7.0

## execMiddleware

**Signature**

```ts
export declare function execMiddleware<I, O, E, A>(
  ma: Middleware<I, O, E, A>,
  c: Connection<I>
): TE.TaskEither<E, Connection<O>>
```

Added in v0.7.0