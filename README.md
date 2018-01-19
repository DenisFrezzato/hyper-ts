A partial porting of https://github.com/owickstrom/hyper to TypeScript

`hyper-ts` is an experimental middleware architecture for HTTP servers written in TypeScript.

Its main focus is correctness and type-safety, using type-level information to enforce correct composition and
abstraction for web servers.

# Goals

The goal of `hyper-ts` is to make use of type system features in TypeScript to enforce correctly stacked middleware in
HTTP server applications. All effects of middleware should be reflected in the types to ensure that common mistakes
cannot be made. A few examples of such mistakes could be:

* Incorrect ordering of header and body writing
* Writing incomplete responses
* Writing multiple responses
* Trying to consume a non-parsed request body
* Consuming a request body parsed as the wrong type
* Incorrect ordering of, or missing, error handling middleware
* Incorrect ordering of middleware for sessions, authentication, authorization
* Missing authentication and/or authorization checks

# Core API

## Conn

A `Conn`, short for “connection”, models the entirety of a connection between the HTTP server and the user agent, both
request and response.

State changes are tracked by the phanton type `S`.

```ts
class Conn<S> {
  readonly _S: S
  constructor(readonly req: express.Request, readonly res: express.Response) {}
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
import { status, closeHeaders, send } from 'hyper-ts/lib/MiddlewareTask'

const hello = status(200)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts!'))

const app = express()
app.get('/', hello.toRequestHandler())
app.listen(3000, () => console.log('App listening on port 3000!'))
```

## Type safety

Invalid operations are prevented statically

```ts
import { status, closeHeaders, send, header } from 'hyper-ts/lib/MiddlewareTask'

const hello = status(200)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts!'))
  // try to write a header after sending the body
  .ichain(() => header(['field', 'value'])) // error: Type '"HeadersOpen"' is not assignable to type '"ResponseEnded"'
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

// validation succeeds only if `req.param.user_id` is an integer
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
import {
  status,
  closeHeaders,
  send,
  MiddlewareTask,
  param,
  of,
  Handler,
  unsafeResponseStateTransition
} from 'hyper-ts/lib/MiddlewareTask'
import { Status, StatusOpen } from 'hyper-ts'
import { Option, some, none } from 'fp-ts/lib/Option'
import * as t from 'io-ts'
import * as task from 'fp-ts/lib/Task'
import { tuple } from 'fp-ts/lib/function'
import { IntegerFromString } from 'io-ts-types/lib/number/IntegerFromString'

// the new connection state
type Authenticated = 'Authenticated'

interface Authentication
  extends MiddlewareTask<StatusOpen, StatusOpen, Option<MiddlewareTask<StatusOpen, Authenticated, void>>> {}

const withAuthentication = (strategy: (req: express.Request) => task.Task<boolean>): Authentication =>
  new MiddlewareTask(c => {
    return strategy(c.req).map(authenticated => tuple(authenticated ? some(unsafeResponseStateTransition) : none, c))
  })

// dummy authentication process
const tokenAuthentication = withAuthentication(req => task.of(t.string.is(req.get('token'))))

// dummy ResponseStateTransition (like closeHeaders)
const authenticated: MiddlewareTask<Authenticated, StatusOpen, void> = unsafeResponseStateTransition

//
// error handling combinators
//

const badRequest = (message: string) =>
  status(Status.BadRequest)
    .ichain(() => closeHeaders)
    .ichain(() => send(message))

const notFound = (message: string) =>
  status(Status.NotFound)
    .ichain(() => closeHeaders)
    .ichain(() => send(message))

const unauthorized = (message: string) =>
  status(Status.Unauthorized)
    .ichain(() => closeHeaders)
    .ichain(() => send(message))

//
// user
//

interface User {
  name: string
}

// the result of this function requires a successful authentication upstream
const loadUser = (id: number) => authenticated.ichain(() => of(id === 1 ? some<User>({ name: 'Giulio' }) : none))

const getUserId = param('user_id', IntegerFromString)

const sendUser = (user: User) =>
  status(Status.OK)
    .ichain(() => closeHeaders)
    .ichain(() => send(`Hello ${user.name}!`))

const user: Handler = getUserId.ichain(oid =>
  oid.fold(
    () => badRequest('Invalid user id'),
    id =>
      tokenAuthentication.ichain(oAuthenticated =>
        oAuthenticated.fold(
          () => unauthorized('Unauthorized user'),
          authenticated =>
            authenticated.ichain(() => loadUser(id).ichain(ou => ou.fold(() => notFound('User not found'), sendUser)))
        )
      )
  )
)

const app = express()
app.get('/:user_id', user.toRequestHandler())
app.listen(3000, () => console.log('App listening on port 3000!'))
```

# Using the State monad for writing tests

There's another interpreter for testing purposes: `MiddlewareState`

```ts
import * as express from 'express'
import { MonadMiddleware, StatusOpen, ResponseEnded, Conn, param } from 'hyper-ts'
import { monadMiddlewareTask } from 'hyper-ts/lib/MiddlewareTask'
import { monadMiddlewareState } from 'hyper-ts/lib/MiddlewareState'
import { HKT3, HKT3S, HKT3As } from 'fp-ts/lib/HKT'
import * as t from 'io-ts'

function program<M extends HKT3S>(R: MonadMiddleware<M>): HKT3As<M, StatusOpen, ResponseEnded, void>
function program<M>(R: MonadMiddleware<M>): HKT3<M, StatusOpen, ResponseEnded, void>
function program<M>(R: MonadMiddleware<M>): HKT3<M, StatusOpen, ResponseEnded, void> {
  return R.ichain(
    e =>
      R.ichain(() => R.send(`Hello ${e.getOrElseValue('Anonymous')}!`), R.ichain(() => R.closeHeaders, R.status(200))),
    param(R)('name', t.string)
  )
}

// interpreted in Task
const helloTask = program(monadMiddlewareTask)

// interpreted in State
const helloState = program(monadMiddlewareState)

// fake Conn
const c: Conn<StatusOpen> = {
  req: {
    params: {}
  },
  res: {
    status: () => null,
    send: () => null
  }
} as any

console.log(helloState.eval(c).run([]))

const app = express()
app.get('/:name?', helloTask.toRequestHandler())
app.listen(3000, () => console.log('App listening on port 3000!'))

/*
Output:

[ undefined,
  [ StatusEvent { status: 200, type: 'StatusEvent' },
    CloseHeadersEvent { type: 'CloseHeadersEvent' },
    SendEvent { o: 'Hello Anonymous!', type: 'SendEvent' } ] ]
App listening on port 3000!

*/
```
