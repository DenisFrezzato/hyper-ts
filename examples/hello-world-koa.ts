import * as Koa from 'koa'
import { Status, status } from '../src'
import { fromMiddleware } from '../src/koa'

const hello = status(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts on koa!')

const app = new Koa<any, {}>()

app.use(fromMiddleware(hello)).listen(3000, () => {
  // tslint:disable-next-line: no-console
  console.log('Koa listening on port 3000. Use: GET /')
})
