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

## Another example: loading a user

The default interpreter is based on [fp-ts](https://github.com/gcanti/fp-ts)'s `Task`

```ts
import {
  status,
  closeHeaders,
  send,
  json,
  ResponseStateTransition,
  Handler,
  MiddlewareTask,
  lift,
  param
} from 'hyper-ts/lib/MiddlewareTask'
import { Either, right, left } from 'fp-ts/lib/Either'
import * as task from 'fp-ts/lib/Task'
import * as express from 'express'
import { StatusOpen, ResponseEnded } from 'hyper-ts'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'

// a generic middleware
const notFound = (message: string): ResponseStateTransition<StatusOpen, ResponseEnded> =>
  status(404)
    .ichain(() => closeHeaders)
    .ichain(() => send(message))

//
// domain and mocked APIs
//

interface User {
  name: string
}

interface API {
  fetchUser: (id: string) => task.Task<Either<string, User>>
}

const api: API = {
  fetchUser: (id: string): task.Task<Either<string, User>> => {
    return task.of(id === '1' ? right({ name: 'Giulio' }) : left('user not found'))
  }
}

//
// load user middleware
//

const getUser = (api: API) => (id: string): MiddlewareTask<StatusOpen, StatusOpen, Either<string, User>> =>
  lift(api.fetchUser(id))

// `Handler` is an alias for `ResponseStateTransition<StatusOpen, ResponseEnded>`
const writeUser = (u: User): Handler => status(200).ichain(() => json(JSON.stringify(u)))

const loadUserMiddleware = (api: API): Handler =>
  param('user_id', t.string).ichain(e =>
    e.fold(
      errors => notFound(failure(errors).join('')),
      id => getUser(api)(id).ichain(e => e.fold(notFound, writeUser))
    )
  )

const app = express()
app.get('/:user_id?/', loadUserMiddleware(api).toRequestHandler())
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
