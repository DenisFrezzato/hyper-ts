import * as Koa from 'koa'
import { Status } from '..'
import { middleware } from '../src/MiddlewareTask'
import { toKoaRequestHandler } from '../src/toKoaRequestHandler'

const hello = middleware
  .status(Status.OK)
  .ichain(() => middleware.closeHeaders)
  .ichain(() => middleware.send('Hello hyper-ts on koa!'))

const app = new Koa()

app.use(toKoaRequestHandler(hello)).listen(3000, () => {
  console.log('Koa listening on port 3000. Use: GET /')
})
