import * as express from 'express'
import * as H from '../src'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/lib/pipeable'

const hello = pipe(
  H.status(H.Status.OK),
  H.ichain(() => H.json({ a: 1 }, () => 'error'))
)

express()
  .get('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
