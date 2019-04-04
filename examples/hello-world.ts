import * as express from 'express'
import { Status, status } from '../src'
import { toRequestHandler } from '../src/express'

const hello = status(Status.OK) // writes the response status
  .closeHeaders() // tells hyper-ts that we're done with the headers
  .send('Hello hyper-ts on express!') // sends the response

express()
  .get('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
