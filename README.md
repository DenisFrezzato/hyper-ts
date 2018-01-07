# Work in progress

A partial porting of https://github.com/owickstrom/hyper to TypeScript

# Examples

## Hello world

```ts
import * as express from 'express'
import { status, closeHeaders, send } from 'hyper-ts'

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

## Middlewares

```ts
import {
  Middleware,
  fromTask,
  gets,
  StatusOpen,
  status,
  closeHeaders,
  ResponseEnded,
  send,
  json,
  ResponseStateTransition,
  Handler
} from 'hyper-ts'
import { Either, right, left } from 'fp-ts/lib/Either'
import * as task from 'fp-ts/lib/Task'
import { Option, fromNullable } from 'fp-ts/lib/Option'
import * as express from 'express'

//
// generic middlewares
//

const param = (name: string): Middleware<StatusOpen, StatusOpen, Option<string>> =>
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

const getUser = (api: API) => (id: string): Middleware<StatusOpen, StatusOpen, Either<string, User>> =>
  fromTask(api.fetchUser(id))

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
