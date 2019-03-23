import * as express from 'express'
import { StatusOpen, ResponseEnded } from '.'
import { MiddlewareTask } from './MiddlewareTask'
import { ExpressConn } from './ExpressConn'

export function toExpressRequestHandler(task: MiddlewareTask<StatusOpen, ResponseEnded, void>): express.RequestHandler {
  return (req, res) => task.eval(new ExpressConn<StatusOpen>(req, res)).run()
}
