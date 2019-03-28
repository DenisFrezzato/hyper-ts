**IMPORTANT**. Version 0.4 is under active development.

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

The stable version is tested against TypeScript 3.3.4000, but should run with TypeScript 3.0.1+ too

# Core API

## Connection

A `Connection` models the entirety of a connection between the HTTP server and the user agent, both
request and response.

State changes are tracked by the phantom type `S`.

```ts
export interface Connection<S> {
  readonly _S: S
  getRequest: () => IncomingMessage
  getBody: () => unknown
  getHeader: (name: string) => unknown
  getParams: () => unknown
  getQuery: () => unknown
  getOriginalUrl: () => string
  getMethod: () => string
  setCookie: (name: string, value: string, options: CookieOptions) => Connection<S>
  clearCookie: (name: string, options: CookieOptions) => Connection<S>
  setHeader: (name: string, value: string) => Connection<S>
  setStatus: <T>(status: Status) => Connection<T>
  setBody: <T>(body: unknown) => Connection<T>
  endResponse: <T>() => Connection<T>
}
```

`hyper-ts` exports a `Connection` for [express 4.x](http://expressjs.com/) from the `hyper-ts/lib/express` module.

## Middleware

A middleware is an indexed monadic action transforming one `Connection` to another `Connection`. It operates in the `TaskEither` monad,
and is indexed by `I` and `O`, the input and output `Connection` types of the middleware action.

```ts
class Middleware<I, O, L, A> {
  constructor(readonly run: (c: Connection<I>) => TaskEither<L, [A, Connection<O>]>) {}
  ...
}
```

The input and output type parameters are used to ensure that a `Connection` is transformed, and that side-effects are
performed, correctly, throughout the middleware chain.

Middlewares are composed using `ichain`, the indexed monadic version of `chain`.

# Hello world

```ts
import * as express from 'express'
import { Status, status } from 'hyper-ts'
import { fromMiddleware } from 'hyper-ts/lib/express'

const hello = status(Status.OK) // writes the response status
  .closeHeaders() // tells hyper-ts that we're done with the headers
  .send('Hello hyper-ts on express!') // sends the response

express()
  .get('/', fromMiddleware(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
```

## Type safety

Invalid operations are prevented statically

```ts
import { headers, Status, status } from 'hyper-ts'

status(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts!')
  // try to write a header after sending the body
  .ichain(() => header('field', 'value')) // error: Property 'HeadersOpen' is missing in type 'ResponseEnded' but required in type 'HeadersOpen'
```

No more `"Can't set headers after they are sent."` errors.

# Decoding params, query and body

Input validation/decoding can leverage [io-ts](https://github.com/gcanti/io-ts) types

**A single param**

```ts
import { param } from 'hyper-ts'

// returns a middleware validating `req.param.user_id`
const middleware = param('user_id', t.string.decode)
```

Here I'm using `t.string` but you can pass _any_ `io-ts` runtime type

```ts
import { IntFromString } from 'io-ts-types/lib/IntFromString'

// validation succeeds only if `req.param.user_id` can be parsed to an integer
const middleware = param('user_id', IntFromString.decode)
```

**Multiple params**

```ts
import { params } from 'hyper-ts'

// returns a middleware validating both `req.param.user_id` and `req.param.user_name`
const middleware = params(
  t.strict({
    user_id: t.string,
    user_name: t.string
  })
).decode
```

**Query**

```ts
import { query } from 'hyper-ts'

// return a middleware validating the query "order=desc&shoe[color]=blue&shoe[type]=converse"
const middleware = query(
  t.strict({
    order: t.string,
    shoe: t.strict({
      color: t.string,
      type: t.string
    })
  })
).decode
```

**Body**

```ts
import { body } from 'hyper-ts'

// return a middleware validating `req.body`
const middleware = body(t.string.decode)
```

# Error handling

```ts
import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import { fromLeft, Middleware, of, decodeParam, Status, status, StatusOpen, ResponseEnded } from 'hyper-ts'
import { fromMiddleware } from 'hyper-ts/lib/express'

//
// model
//

const UserId = NonEmptyString

type UserId = NonEmptyString

interface User {
  name: string
}

//
// business logic
//

const UserNotFound: 'UserNotFound' = 'UserNotFound'

const InvalidArguments: 'InvalidArguments' = 'InvalidArguments'

type UserError = typeof InvalidArguments | typeof UserNotFound

/** Parses the `user_id` param */
const getUserId = decodeParam('user_id', UserId.decode).mapLeft<UserError>(() => InvalidArguments)

/** Loads a `User` from a database (fake) */
const loadUser = (userId: UserId): Middleware<StatusOpen, StatusOpen, UserError, User> =>
  userId === 'ab' ? of({ name: 'User name...' }) : fromLeft(UserNotFound)

/** Sends a `User` to the client */
const sendUser = (user: User) =>
  status(Status.OK)
    .closeHeaders()
    .send(JSON.stringify(user))

const getUser = getUserId.ichain(loadUser).ichain(sendUser)

//
// error handling
//

const badRequest = (message: string) =>
  status(Status.BadRequest)
    .closeHeaders()
    .send(message)

const notFound = (message: string) =>
  status(Status.NotFound)
    .closeHeaders()
    .send(message)

const sendError = (err: UserError): Middleware<StatusOpen, ResponseEnded, never, void> => {
  switch (err) {
    case 'UserNotFound':
      return notFound('user not found')
    case 'InvalidArguments':
      return badRequest('invalid arguments')
  }
}

//
// route
//

const user = getUser.orElse(sendError)

express()
  .get('/:user_id', fromMiddleware(user))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
```

# Documentation

- [API Reference](https://gcanti.github.io/hyper-ts/modules/)
