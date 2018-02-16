import * as express from 'express'
import { StatusOpen, ResponseEnded } from '.'
import { MiddlewareTask } from './MiddlewareTask'
import { ExpressConn } from './ExpressConn'

export const toExpressRequestHandler = (
  task: MiddlewareTask<StatusOpen, ResponseEnded, void>
): express.RequestHandler => (req, res) => task.eval(new ExpressConn(req, res)).run()
