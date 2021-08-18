A partial porting of https://github.com/owickstrom/hyper to TypeScript

`hyper-ts` is an experimental middleware architecture for HTTP servers written in TypeScript.

Its main focus is correctness and type-safety, using type-level information to enforce correct composition and
abstraction for web servers.

# Goals

The goal of `hyper-ts` is to make use of type system features in TypeScript to enforce correctly stacked middleware in
HTTP server applications. All effects of middleware should be reflected in the types to ensure that common mistakes
cannot be made. A few examples of such mistakes could be:

- Incorrect ordering of header and body writing
- Writing incomplete responses
- Writing multiple responses
- Trying to consume a non-parsed request body
- Consuming a request body parsed as the wrong type
- Incorrect ordering of, or missing, error handling middleware
- Incorrect ordering of middleware for sessions, authentication, authorization
- Missing authentication and/or authorization checks

# TypeScript compatibility

| `hyper-ts` version | `fp-ts` version | `typescript` version |
| ------------------ | --------------- | -------------------- |
| 0.7.x+             | 2.10.5+         | 4.3+                 |
| 0.5.x+             | 2.0.5+          | 3.5+                 |
| 0.4.x+             | 1.15.0+         | 3.0.1+               |

# Hello world

```ts
import * as express from 'express'
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import { toRequestHandler } from 'hyper-ts/lib/express'
import { pipe } from 'fp-ts/function'

const hello: M.Middleware<H.StatusOpen, H.ResponseEnded, never, void> = pipe(
  M.status(H.Status.OK), // writes the response status
  M.ichain(() => M.closeHeaders()), // tells hyper-ts that we're done with the headers
  M.ichain(() => M.send('Hello hyper-ts on express!')) // sends the response as text
)

express()
  .get('/', toRequestHandler(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
```

**Sending a JSON**

```ts
const hello = pipe(
  M.status(H.Status.OK),
  M.ichain(() => M.json({ a: 1 }, () => 'error'))
)
```

# Core API

## Connection

A `Connection` models the entirety of a connection between the HTTP server and the user agent, both
request and response.

State changes are tracked by the phantom type `S`.

```ts
interface Connection<S> {
  readonly _S: S
  readonly getRequest: () => IncomingMessage
  readonly getBody: () => unknown
  readonly getHeader: (name: string) => unknown
  readonly getParams: () => unknown
  readonly getQuery: () => unknown
  readonly getOriginalUrl: () => string
  readonly getMethod: () => string
  readonly setCookie: (
    this: Connection<HeadersOpen>,
    name: string,
    value: string,
    options: CookieOptions
  ) => Connection<HeadersOpen>
  readonly clearCookie: (this: Connection<HeadersOpen>, name: string, options: CookieOptions) => Connection<HeadersOpen>
  readonly setHeader: (this: Connection<HeadersOpen>, name: string, value: string) => Connection<HeadersOpen>
  readonly setStatus: (this: Connection<StatusOpen>, status: Status) => Connection<HeadersOpen>
  readonly setBody: (this: Connection<BodyOpen>, body: unknown) => Connection<ResponseEnded>
  readonly endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>
}
```

By default `hyper-ts` manages the following states:

- `StatusOpen`: Type indicating that the status-line is ready to be sent
- `HeadersOpen`: Type indicating that headers are ready to be sent, i.e. the body streaming has not been started
- `BodyOpen`: Type indicating that headers have already been sent, and that the body is currently streaming
- `ResponseEnded`: Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished

During the connection lifecycle the following flow is statically enforced

```
StatusOpen -> HeadersOpen -> BodyOpen -> ResponseEnded
```

**Note**. `hyper-ts` supports [express 4.x](http://expressjs.com/) by default by exporting a `Connection` instance from the `hyper-ts/lib/express` module.

## Middleware

A middleware is an indexed monadic action transforming one `Connection` to another `Connection`. It operates in the `TaskEither` monad,
and is indexed by `I` and `O`, the input and output `Connection` types of the middleware action.

```ts
interface Middleware<I, O, E, A> {
  (c: Connection<I>): TaskEither<E, [A, Connection<O>]>
}
```

The input and output type parameters are used to ensure that a `Connection` is transformed, and that side-effects are
performed, correctly, throughout the middleware chain.

Middlewares are composed using `chain` and `ichain`, the indexed monadic version of `chain`.

# Type safety

Invalid operations are prevented statically

```ts
import { Status, status } from 'hyper-ts'

pipe(
  M.status(H.Status.OK),
  M.ichain(() => M.header('name', 'value')),
  M.ichain(() => M.closeHeaders()),
  M.ichain(() => M.send('Hello hyper-ts on express!')),
  // try to write a header after sending the body
  M.ichain(() => M.header('name', 'value')) // static error
)
```

No more `"Can't set headers after they are sent."` errors.

# Decoding params, query and body

Input validation/decoding is done by defining a decoding function with the following signature

```ts
(input: unknown) => Either<L, A>
```

**Example** (decoding a param)

```ts
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import * as E from 'fp-ts/Either'

const isUnknownRecord = (u: unknown): u is Record<string, unknown> => typeof u === 'object' && u !== null

// returns a middleware validating `req.param.user_id`
export const middleware: M.Middleware<H.StatusOpen, H.StatusOpen, string, string> = M.decodeParam('user_id', u =>
  isUnknownRecord(u) && typeof u.user_id === 'string' ? E.right(u.user_id) : E.left('cannot read param user_id')
)
```

You can also use [io-ts](https://github.com/gcanti/io-ts) decoders.

```ts
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import * as t from 'io-ts'

// returns a middleware validating `req.param.user_id`
export const middleware2: M.Middleware<H.StatusOpen, H.StatusOpen, t.Errors, string> = M.decodeParam(
  'user_id',
  t.string.decode
)
```

Here I'm using `t.string` but you can pass _any_ `io-ts` runtime type

```ts
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import { IntFromString } from 'io-ts-types/lib/IntFromString'

// validation succeeds only if `req.param.user_id` can be parsed to an integer
export const middleware3: M.Middleware<
  H.StatusOpen,
  H.StatusOpen,
  t.Errors,
  t.Branded<number, t.IntBrand>
> = M.decodeParam('user_id', IntFromString.decode)
```

**Multiple params**

```ts
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import * as t from 'io-ts'

// returns a middleware validating both `req.param.user_id` and `req.param.user_name`
export const middleware = M.decodeParams(
  t.strict({
    user_id: t.string,
    user_name: t.string
  }).decode
)
```

**Query**

```ts
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import * as t from 'io-ts'

// return a middleware validating the query "order=desc&shoe[color]=blue&shoe[type]=converse"
export const middleware = M.decodeQuery(
  t.strict({
    order: t.string,
    shoe: t.strict({
      color: t.string,
      type: t.string
    })
  }).decode
)
```

**Body**

```ts
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import * as t from 'io-ts'

// return a middleware validating `req.body`
export const middleware = M.decodeBody(t.string.decode)
```

[Here](examples/json-middleware.ts)'s an example using the standard `express.json` middleware

# Documentation

- [API Reference](https://denisfrezzato.github.io/hyper-ts/)

# Ecosystem

- [hyper-ts-connect](https://github.com/DenisFrezzato/hyper-ts-connect) - adapter for [connect](https://github.com/senchalabs/connect)
- [hyper-ts-fastify](https://github.com/DenisFrezzato/hyper-ts-fastify) - adapter for [fastify](https://github.com/fastify/fastify)
