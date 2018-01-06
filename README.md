# Work in progress

A partial porting of https://github.com/owickstrom/hyper to TypeScript

# Examples

## Hello world

```ts
import * as express from 'express'
import { writeStatus, closeHeaders, send, toRequestHandler } from 'hyper-ts/lib/Response'

const hello = writeStatus(200)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts!'))

const app = express()
app.get('/', toRequestHandler(hello))
app.listen(3000, () => console.log('App listening on port 3000!'))
```

## Middlewares

```ts
import { Middleware, fromTask, gets } from 'hyper-ts/lib/Middleware'
import {
  StatusOpen,
  toRequestHandler,
  writeStatus,
  closeHeaders,
  ResponseEnded,
  send,
  json
} from 'hyper-ts/lib/Response'
import { Either, right, left } from 'fp-ts/lib/Either'
import * as task from 'fp-ts/lib/Task'
import { Option, fromNullable } from 'fp-ts/lib/Option'
import * as express from 'express'

//
// generic middlewares
//

export const param = (name: string): Middleware<StatusOpen, StatusOpen, Option<string>> =>
  gets(c => fromNullable(c.req.params[name]))

export const notFound = (message: string): Middleware<StatusOpen, ResponseEnded, void> =>
  writeStatus(404)
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

export const api: API = {
  fetchUser: (id: string): task.Task<Either<string, User>> => {
    return task.of(id === '1' ? right({ name: 'Giulio' }) : left('user not found'))
  }
}

//
// user middleware
//

export const getUser = (api: API) => (id: string): Middleware<StatusOpen, StatusOpen, Either<string, User>> =>
  fromTask(api.fetchUser(id))

export const writeUser = (u: User): Middleware<StatusOpen, ResponseEnded, void> =>
  writeStatus(200).ichain(() => json(JSON.stringify(u)))

export const userMiddleware = (api: API): Middleware<StatusOpen, ResponseEnded, void> =>
  param('user_id').ichain(o =>
    o.fold(() => notFound('id not found'), id => getUser(api)(id).ichain(e => e.fold(notFound, writeUser)))
  )

//
// express app
//

const app = express()
app.get('/:user_id/', toRequestHandler(userMiddleware(api)))
app.listen(3000, () => console.log('App listening on port 3000!'))
```
