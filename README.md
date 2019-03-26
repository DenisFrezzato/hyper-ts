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

The stable version is tested against TypeScript 3.1.6, but should run with TypeScript 3.0.1+ too

# Core API

## Conn

A `Conn`, short for “connection”, models the entirety of a connection between the HTTP server and the user agent, both
request and response.

State changes are tracked by the phantom type `S`.

```ts
class Conn<S> {
  readonly _S: S
  clearCookie: (name: string, options: CookieOptions) => void
  endResponse: () => void
  getBody: () => mixed
  getHeader: (name: string) => mixed
  getParams: () => mixed
  getQuery: () => mixed
  setBody: (body: mixed) => void
  setCookie: (name: string, value: string, options: CookieOptions) => void
  setHeader: (name: string, value: string) => void
  setStatus: (status: Status) => void
}
```

## Middleware

A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates in some base monad `M`,
and is indexed by `I` and `O`, the input and output `Conn` types of the middleware action.

```ts
type Middleware<M, I, O, A> = (c: Conn<I>) => HKT<M, [A, Conn<O>]>
```

**Note**. The type `HKT` is how [fp-ts](https://github.com/gcanti/fp-ts) represents Higher Kinded Types.

The input and output type parameters are used to ensure that a `Conn` is transformed, and that side-effects are
performed, correctly, throughout the middleware chain.

Middlewares are composed using `ichain`, the indexed monadic version of `chain`.

# Hello world

The default interpreter, `MiddlewareTask`, is based on [fp-ts](https://github.com/gcanti/fp-ts)'s `Task`

```ts
import * as express from 'express'
import { Status } from 'hyper-ts'
import { middleware } from 'hyper-ts/lib/MiddlewareTask'
import { toExpressRequestHandler } from 'hyper-ts/lib/toExpressRequestHandler'

const hello = middleware
  .status(Status.OK)
  .ichain(() => middleware.closeHeaders)
  .ichain(() => middleware.send('Hello hyper-ts on express!'))

express()
  .get('/', toExpressRequestHandler(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
```

## Type safety

Invalid operations are prevented statically

```ts
import { middleware } from 'hyper-ts/lib/MiddlewareTask'
import { Status } from 'hyper-ts'

middleware
  .status(Status.OK)
  .ichain(() => middleware.closeHeaders)
  .ichain(() => middleware.send('Hello hyper-ts!'))
  // try to write a header after sending the body
  .ichain(() => middleware.headers({ field: 'value' })) // error: Type '"HeadersOpen"' is not assignable to type '"ResponseEnded"'
```

No more `"Can't set headers after they are sent."` errors.

# Validating params, query and body

Validations leverage [io-ts](https://github.com/gcanti/io-ts) types

```ts
import { param, params, query, body } from 'hyper-ts/lib/MiddlewareTask'
import * as t from 'io-ts'
```

**A single param**

```ts
// returns a middleware validating `req.param.user_id`
const middleware = param('user_id', t.string)
```

Here I'm using `t.string` but you can pass _any_ `io-ts` runtime type

```ts
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'

// validation succeeds only if `req.param.user_id` can be parsed to an integer
param('user_id', IntegerFromString)
```

**Multiple params**

```ts
// returns a middleware validating both `req.param.user_id` and `req.param.user_name`
const middleware = params(
  t.type({
    user_id: t.string,
    user_name: t.string
  })
)
```

**Query**

```ts
// return a middleware validating the query "order=desc&shoe[color]=blue&shoe[type]=converse"
const middleware = query(
  t.type({
    order: t.string,
    shoe: t.type({
      color: t.string,
      type: t.string
    })
  })
)
```

**Body**

```ts
// return a middleware validating `req.body`
const middleware = body(t.string)
```

# Defining custom connection states: authentication

Let's say there are some middlewares that must be executed only if the authentication process succeded. Here's how to
ensure this requirement statically

```ts
import * as express from 'express'
import { MiddlewareTask, param, Handler, unsafeResponseStateTransition, middleware } from 'hyper-ts/lib/MiddlewareTask'
import { Status, StatusOpen, Conn } from 'hyper-ts'
import { Option, some, none } from 'fp-ts/lib/Option'
import * as t from 'io-ts'
import { Task, task } from 'fp-ts/lib/Task'
import { tuple } from 'fp-ts/lib/function'
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'
import { toExpressRequestHandler } from 'hyper-ts/lib/toExpressRequestHandler'

// the new connection state
type Authenticated = 'Authenticated'

interface Authentication
  extends MiddlewareTask<StatusOpen, StatusOpen, Option<MiddlewareTask<StatusOpen, Authenticated, void>>> {}

const withAuthentication = (strategy: (c: Conn<StatusOpen>) => Task<boolean>): Authentication =>
  new MiddlewareTask(c => {
    return strategy(c).map(authenticated => tuple(authenticated ? some(unsafeResponseStateTransition) : none, c))
  })

// dummy authentication process
const tokenAuthentication = withAuthentication(c => task.of(t.string.is(c.getHeader('token'))))

// dummy ResponseStateTransition (like middleware.closeHeaders)
const authenticated: MiddlewareTask<Authenticated, StatusOpen, void> = unsafeResponseStateTransition

//
// error handling combinators
//

const badRequest = (message: string) =>
  middleware
    .status(Status.BadRequest)
    .ichain(() => middleware.closeHeaders)
    .ichain(() => middleware.send(message))

const notFound = (message: string) =>
  middleware
    .status(Status.NotFound)
    .ichain(() => middleware.closeHeaders)
    .ichain(() => middleware.send(message))

const unauthorized = (message: string) =>
  middleware
    .status(Status.Unauthorized)
    .ichain(() => middleware.closeHeaders)
    .ichain(() => middleware.send(message))

//
// user
//

interface User {
  name: string
}

// the result of this function requires a successful authentication upstream
const loadUser = (id: number) =>
  authenticated.ichain(() => middleware.of(id === 1 ? some<User>({ name: 'Giulio' }) : none))

const getUserId = param('user_id', IntegerFromString)

const sendUser = (user: User) =>
  middleware
    .status(Status.OK)
    .ichain(() => middleware.closeHeaders)
    .ichain(() => middleware.send(`Hello ${user.name}!`))

const user: Handler = getUserId.ichain(oid =>
  oid.fold(
    () => badRequest('Invalid user id'),
    id =>
      tokenAuthentication.ichain(oAuthenticated =>
        oAuthenticated.foldL(
          () => unauthorized('Unauthorized user'),
          authenticated =>
            authenticated.ichain(() => loadUser(id).ichain(ou => ou.foldL(() => notFound('User not found'), sendUser)))
        )
      )
  )
)

express()
  .get('/:user_id', toExpressRequestHandler(user))
  .listen(3000, () => console.log('Express listening on port 3000'))
```

# Using the State monad for writing tests

There's another interpreter for testing purposes: `MiddlewareState`

```ts
import * as express from 'express'
import { MonadMiddleware, MonadMiddleware3, StatusOpen, ResponseEnded, Conn, param, Status } from 'hyper-ts'
import { middleware as middlewareTask } from 'hyper-ts/lib/MiddlewareTask'
import { middleware as middlewareState } from 'hyper-ts/lib/MiddlewareState'
import { HKT3, URIS3, Type3 } from 'fp-ts/lib/HKT'
import * as t from 'io-ts'
import { toExpressRequestHandler } from 'hyper-ts/lib/toExpressRequestHandler'

function program<M extends URIS3>(R: MonadMiddleware3<M>): Type3<M, StatusOpen, ResponseEnded, void>
function program<M>(R: MonadMiddleware<M>): HKT3<M, StatusOpen, ResponseEnded, void>
function program<M>(R: MonadMiddleware<M>): HKT3<M, StatusOpen, ResponseEnded, void> {
  return R.ichain(param(R)('name', t.string), e =>
    R.ichain(R.ichain(R.status(Status.OK), () => R.closeHeaders), () => R.send(`Hello ${e.getOrElse('Anonymous')}!`))
  )
}

// interpreted in Task
const programTask = program(middlewareTask)

// interpreted in State
const programState = program(middlewareState)

// fake Conn
const c: Conn<StatusOpen> = {
  getParams: () => ({}),
  setStatus: () => null,
  setBody: () => null
} as any

console.log(programState.eval(c).run([]))

//
// express app
//

express()
  .get('/:name?', toExpressRequestHandler(programTask))
  .listen(3000, () => console.log('Express listening on port 3000'))

/*
Output:

[ undefined,
  [ StatusEvent { status: 200, type: 'StatusEvent' },
    CloseHeadersEvent { type: 'CloseHeadersEvent' },
    SendEvent { o: 'Hello Anonymous!', type: 'SendEvent' } ] ]
App listening on port 3000!

*/
```
