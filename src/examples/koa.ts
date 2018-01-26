import * as Koa from 'koa'
import * as Router from 'koa-router'
import { Status, StatusOpen, ResponseEnded } from '..'
import { status, closeHeaders, send, MiddlewareTask } from '../../src/MiddlewareTask'
import { KoaConn } from '../adapters/koa'

const hello = status(Status.OK)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts on koa!'))

const app = new Koa()
const router = new Router()

const toRequestHandler = (task: MiddlewareTask<StatusOpen, ResponseEnded, void>): Router.IMiddleware => ctx =>
  task.eval(new KoaConn(ctx)).run()

app.use(router.get('/', toRequestHandler(hello)).routes()).listen(3000, () => {
  console.log('Koa listening on port 3000. Use: GET /')
})
