import * as express from 'express'
import * as H from '../src'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/lib/pipeable'

const hello: H.Middleware<H.StatusOpen, H.ResponseEnded, never, void> = pipe(
  H.status(H.Status.OK), // writes the response status
  H.ichain(() => H.closeHeaders()), // tells hyper-ts that we're done with the headers
  H.ichain(() => H.send('Hello hyper-ts on express!')) // sends the response as text
)

express()
  .get('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
