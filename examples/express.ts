import * as express from 'express'
import { Status } from '../src'
import { middleware as hyper } from '../src/MiddlewareTask'
import { toExpressRequestHandler } from '../src/toExpressRequestHandler'

const hello = hyper
  .status(Status.OK)
  .ichain(() => hyper.closeHeaders)
  .ichain(() => hyper.send('Hello hyper-ts on express!'))

express()
  .get('/', toExpressRequestHandler(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
