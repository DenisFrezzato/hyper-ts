import * as Koa from 'koa'
import * as Router from 'koa-router'
import { Status } from '..'
import { status, closeHeaders, send } from '../../src/MiddlewareTask'
import { toRequestHandler } from '../adapters/koa'

const hello = status(Status.OK)
  .ichain(() => closeHeaders)
  .ichain(() => send('Hello hyper-ts on koa!'))

const app = new Koa()
const router = new Router()

console.log('Koa listening on port 3000. Use: GET /')

app.use(router.get('/', toRequestHandler(hello)).routes()).listen(3000)
