import * as express from 'express'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as H from '../src'
import { fromRequestHandler, toRequestHandler } from '../src/express'

// Express middleware
const json = express.json()

const jsonMiddleware = fromRequestHandler(json, () => undefined)

const Body = t.strict({
  name: t.string
})

const bodyDecoder = pipe(
  jsonMiddleware,
  H.ichain(() =>
    H.decodeBody(u =>
      pipe(
        Body.decode(u),
        E.mapLeft(errors => `invalid body: ${failure(errors).join('\n')}`)
      )
    )
  )
)

function badRequest(message: string): H.Middleware<H.StatusOpen, H.ResponseEnded, never, void> {
  return pipe(
    H.status(H.Status.BadRequest),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  )
}

const hello = pipe(
  bodyDecoder,
  H.ichain(({ name }) =>
    pipe(
      H.status<string>(H.Status.OK),
      H.ichain(() => H.closeHeaders()),
      H.ichain(() => H.send(`Hello ${name}!`))
    )
  ),
  H.orElse(badRequest)
)

const app = express()

app
  .post('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: POST /'))

// curl --request POST --silent --header 'Content-Type: application/json' --data '{"name":"bob"}' "localhost:3000/"
// curl --request POST --silent --header 'Content-Type: application/json' --data '{}' "localhost:3000/"
