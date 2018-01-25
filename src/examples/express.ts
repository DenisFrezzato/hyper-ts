import * as express from 'express'
import { Status } from '..'
import { status, closeHeaders, send } from '../../src/MiddlewareTask'
import { toRequestHandler } from '../adapters/express'

const hello = status(Status.OK)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts on express!'))

express()
  .get('/', toRequestHandler(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
