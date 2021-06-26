import * as express from 'express'
import * as H from '../src'
import * as M from '../src/Middleware'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/function'

const hello = pipe(
  M.status(H.Status.OK),
  M.ichain(() => M.json({ a: 1 }, () => 'error'))
)

express()
  .get('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
