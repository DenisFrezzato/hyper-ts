# Work in progress

A partial porting of https://github.com/owickstrom/hyper to TypeScript

# Examples

## Hello world

```ts
import * as express from 'express'
import { status, closeHeaders, send } from 'hyper-ts/lib/MiddlewareTask'

const hello = status(200)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts!'))

//
// express app
//

const app = express()
app.get('/', hello.toRequestHandler())
app.listen(3000, () => console.log('App listening on port 3000!'))
```

## MiddlewareTask

```ts
import {
  gets,
  status,
  closeHeaders,
  send,
  json,
  ResponseStateTransition,
  Handler,
  MiddlewareTask,
  lift
} from 'hyper-ts/lib/MiddlewareTask'
import { Either, right, left } from 'fp-ts/lib/Either'
import * as task from 'fp-ts/lib/Task'
import { Option, fromNullable } from 'fp-ts/lib/Option'
import * as express from 'express'
import { StatusOpen, ResponseEnded } from 'hyper-ts'

//
// generic middlewares
//

const param = (name: string): MiddlewareTask<StatusOpen, StatusOpen, Option<string>> =>
  gets(c => fromNullable(c.req.params[name]))

// `ResponseStateTransition<I, O>` is an alias for `Middleware<I, O, void>`
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
// user middleware
//

const getUser = (api: API) => (id: string): MiddlewareTask<StatusOpen, StatusOpen, Either<string, User>> =>
  lift(api.fetchUser(id))

// `Handler` is an alias for `ResponseStateTransition<StatusOpen, ResponseEnded>`
const writeUser = (u: User): Handler => status(200).ichain(() => json(JSON.stringify(u)))

const userMiddleware = (api: API): Handler =>
  param('user_id').ichain(o =>
    o.fold(() => notFound('id not found'), id => getUser(api)(id).ichain(e => e.fold(notFound, writeUser)))
  )

//
// express app
//

const app = express()
app.get('/:user_id/', userMiddleware(api).toRequestHandler())
app.listen(3000, () => console.log('App listening on port 3000!'))
```

## MiddlewareState

There's another interpreter for testing purposes: `MiddlewareState`

```ts
import * as express from 'express'
import { MonadMiddleware, StatusOpen, ResponseEnded, Conn, param } from 'hyper-ts/lib/index'
import { middlewareTask } from 'hyper-ts/lib/MiddlewareTask'
import { middlewareState } from 'hyper-ts/lib/MiddlewareState'
import { HKT3, HKT3S, HKT3As } from 'fp-ts/lib/HKT'

function program<M extends HKT3S>(R: MonadMiddleware<M>): HKT3As<M, StatusOpen, ResponseEnded, void>
function program<M>(R: MonadMiddleware<M>): HKT3<M, StatusOpen, ResponseEnded, void> {
  return R.ichain(
    o =>
      R.ichain(() => R.send(`Hello ${o.getOrElseValue('Anonymous')}!`), R.ichain(() => R.closeHeaders, R.status(200))),
    param(R)('name')
  )
}

// interpreted in Task
const helloTask = program(middlewareTask)

// interpreted in State
const helloState = program(middlewareState)

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

//
// express app
//

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
