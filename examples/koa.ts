import * as Koa from 'koa'
import { Status, StatusOpen, ResponseEnded } from '..'
import { status, closeHeaders, send, MiddlewareTask } from '../src/MiddlewareTask'
import { KoaConn } from '../src/adapters/koa'

const hello = status(Status.OK)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts on koa!'))

const app = new Koa()

const toRequestHandler = (task: MiddlewareTask<StatusOpen, ResponseEnded, void>): Koa.Middleware => ctx =>
  task.eval(new KoaConn(ctx)).run()

app.use(toRequestHandler(hello)).listen(3000, () => {
  console.log('Koa listening on port 3000. Use: GET /')
})
