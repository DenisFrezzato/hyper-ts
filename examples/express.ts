import * as express from 'express'
import { Status } from '../src'
import { middleware } from '../src/MiddlewareTask'
import { toExpressRequestHandler } from '../src/toExpressRequestHandler'

const hello = middleware
  .status(Status.OK)
  .ichain(() => middleware.closeHeaders)
  .ichain(() => middleware.send('Hello hyper-ts on express!'))

express()
  .get('/', toExpressRequestHandler(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
