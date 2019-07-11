import * as express from 'express'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import { decodeBody, Middleware, ResponseEnded, Status, status, StatusOpen } from '../src'
import { fromRequestHandler, toRequestHandler } from '../src/express'

// Express middleware
const json = express.json()

function withJsonBody<A>(
  middleware: Middleware<StatusOpen, ResponseEnded, never, A>
): Middleware<StatusOpen, ResponseEnded, never, A> {
  return fromRequestHandler<StatusOpen, void>(json, () => undefined).ichain(() => middleware)
}

const Body = t.strict({
  name: t.string
})

const bodyDecoder = decodeBody(u =>
  pipe(
    Body.decode(u),
    E.mapLeft(errors => `invalid body: ${failure(errors).join('\n')}`)
  )
)

const badRequest = (message: string) =>
  status(Status.BadRequest)
    .closeHeaders()
    .send(message)

const hello = withJsonBody(
  bodyDecoder
    .ichain(({ name }) =>
      status(Status.OK)
        .closeHeaders()
        .send(`Hello ${name}!`)
    )
    .orElse(badRequest)
)

const app = express()

app
  .post('/', toRequestHandler(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: POST /'))

// curl --request POST --silent --header 'Content-Type: application/json' --data '{"name":"bob"}' "localhost:3000/"
// curl --request POST --silent --header 'Content-Type: application/json' --data '{}' "localhost:3000/"
