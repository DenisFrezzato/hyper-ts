import * as express from 'express'
import * as H from '../src'
import * as M from '../src/Middleware'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/function'

const hello: M.Middleware<H.StatusOpen, H.ResponseEnded, never, void> = pipe(
  M.status(H.Status.OK), // writes the response status
  M.ichain(() => M.closeHeaders()), // tells hyper-ts that we're done with the headers
  M.ichain(() => M.send('Hello hyper-ts on express!')) // sends the response as text
)

express()
  .get('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
