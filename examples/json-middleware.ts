import * as express from 'express'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as H from '../src'
import * as M from '../src/Middleware'
import { fromRequestHandler, toRequestHandler } from '../src/express'

// Express middleware
const json = express.json()

const jsonMiddleware = fromRequestHandler(json, () => undefined)

const Body = t.strict({
  name: t.string,
})

const bodyDecoder = pipe(
  jsonMiddleware,
  M.ichain(() =>
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
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send(message))
  )
}

const hello = pipe(
  bodyDecoder,
  M.ichain(({ name }) =>
    pipe(
      M.status<string>(H.Status.OK),
      M.ichain(() => M.closeHeaders()),
      M.ichain(() => M.send(`Hello ${name}!`))
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
