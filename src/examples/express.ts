import * as express from 'express'
import { Status, StatusOpen, ResponseEnded } from '..'
import { status, closeHeaders, send, MiddlewareTask } from '../../src/MiddlewareTask'
import { ExpressConn } from '../adapters/express'

const hello = status(Status.OK)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts on express!'))

export const toRequestHandler = (task: MiddlewareTask<StatusOpen, ResponseEnded, void>): express.RequestHandler => (
  req,
  res
) => task.eval(new ExpressConn(req, res)).run()

express()
  .get('/', toRequestHandler(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
