import * as express from 'express'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import * as H from '../src'
import * as M from '../src/Middleware'
import { fromRequestHandler, toRequestHandler } from '../src/express'

// Express middleware
const json = express.json()

const jsonMiddleware = fromRequestHandler(
  json,
  () => E.right(undefined),
  (err) => String(err)
)

const Body = t.strict({
  name: t.string,
})

const bodyDecoder = pipe(
  jsonMiddleware,
  M.iflatMap(() =>
    M.decodeBody((u) =>
      pipe(
        Body.decode(u),
        E.mapLeft((errors) => `invalid body: ${failure(errors).join('\n')}`)
      )
    )
  )
)

function badRequest(message: string): M.Middleware<H.StatusOpen, H.ResponseEnded, never, void> {
  return pipe(
    M.status(H.Status.BadRequest),
    M.iflatMap(() => M.closeHeaders()),
    M.iflatMap(() => M.send(message))
  )
}

const hello = pipe(
  bodyDecoder,
  M.iflatMap(({ name }) =>
    pipe(
      M.status<string>(H.Status.OK),
      M.iflatMap(() => M.closeHeaders()),
      M.iflatMap(() => M.send(`Hello ${name}!`))
    )
  ),
  M.orElse(badRequest)
)

const app = express()

app
  .post('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: POST /'))

// curl --request POST --silent --header 'Content-Type: application/json' --data '{"name":"bob"}' "localhost:3000/"
// curl --request POST --silent --header 'Content-Type: application/json' --data '{}' "localhost:3000/"
