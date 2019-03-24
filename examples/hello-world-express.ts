import * as express from 'express'
import { Status, status } from '../src'
import { fromMiddleware } from '../src/toExpressRequestHandler'

const hello = status<never>(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts on express!')

express()
  .get('/', fromMiddleware(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
